import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { TalkingHead } from "@met4citizen/talkinghead";
import { LipsyncEn } from "@met4citizen/talkinghead/modules/lipsync-en.mjs";
import LINES from "@/content/dinner-party-lines.json";
import { buildSet } from "./set";
import { Director, type ShotName } from "./director";

// TalkingHead builds its own GLTFLoader; the avatars are meshopt-compressed.
const load = GLTFLoader.prototype.load;
GLTFLoader.prototype.load = function (...args: Parameters<typeof load>) {
  this.setMeshoptDecoder(MeshoptDecoder);
  return load.apply(this, args);
};

export type Who = "trip" | "grace";
export type LineId = keyof typeof LINES;

const Grade = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0.06 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; uniform float amount; varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // teal shadows, warm highlights
      float l = dot(c.rgb, vec3(0.299,0.587,0.114));
      c.rgb = mix(c.rgb * vec3(0.92,1.0,1.06), c.rgb * vec3(1.06,1.0,0.9), smoothstep(0.15,0.75,l));
      // grain
      float g = rand(vUv * vec2(1920.0,1080.0) + fract(time) * 100.0) - 0.5;
      c.rgb += g * amount;
      // vignette
      vec2 d = vUv - 0.5; c.rgb *= 1.0 - dot(d,d) * 0.9;
      gl_FragColor = c;
    }`,
};

const ACTORS: Record<
  Who,
  { url: string; body: "M" | "F"; at: [number, number] }
> = {
  trip: { url: "avatars/trip.glb", body: "M", at: [-0.72, 0.35] },
  grace: { url: "avatars/grace.glb", body: "F", at: [0.78, -0.05] },
};

export type StageEvents = {
  onSubtitle: (who: Who | null, text: string) => void;
  onProgress: (p: number) => void;
};

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  director!: Director;
  heads = {} as Record<Who, TalkingHead>;
  private composer!: EffectComposer;
  private bokeh!: BokehPass;
  private grade!: ShaderPass;
  private clock = new THREE.Clock();
  private audio: Partial<Record<LineId, AudioBuffer>> = {};
  private guestCam: THREE.PerspectiveCamera;
  private host: HTMLElement;
  private base: string;
  private ev: StageEvents;
  private stopped = false;

  constructor(host: HTMLElement, base: string, ev: StageEvents) {
    this.host = host;
    this.base = base;
    this.ev = ev;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    host.appendChild(this.renderer.domElement);
    // The point the actors play to: the guest's eyes, just inside the door.
    this.guestCam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    this.guestCam.position.set(0.05, 1.64, 3.1);
    this.guestCam.lookAt(0, 1.45, 0);
  }

  async load() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.25;
    buildSet(this.scene, this.base);

    let done = 0;
    const tick = () => this.ev.onProgress(++done / 14);
    const hidden = document.createElement("div");
    const audioCtx = new AudioContext();
    await Promise.all(
      (Object.keys(ACTORS) as Who[]).map(async (who) => {
        const a = ACTORS[who];
        const head = new TalkingHead(hidden, {
          avatarOnly: true,
          avatarOnlyCamera: this.guestCam,
          lipsyncModules: [],
          modelFPS: 60,
          avatarIdleEyeContact: 0.55,
          avatarSpeakingEyeContact: 0.75,
          audioCtx,
        });
        head.lipsync.en = new LipsyncEn();
        await head.showAvatar({
          url: `${this.base}/${a.url}`,
          body: a.body,
          avatarMood: "neutral",
          lipsyncLang: "en",
          // The scans' eyes read a touch wide; rest the lids a little lower.
          baseline: { eyeBlinkLeft: 0.12, eyeBlinkRight: 0.12 },
        });
        const arm = head.armature;
        arm.position.set(a.at[0], 0, a.at[1]);
        const g = this.guestCam.position;
        arm.rotation.y = Math.atan2(g.x - a.at[0], g.z - a.at[1]);
        arm.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
            m.frustumCulled = false;
          }
        });
        this.scene.add(arm);
        this.heads[who] = head;
        tick();
      }),
    );
    this.heads.trip.speakTo = this.guestCam;
    this.heads.grace.speakTo = this.guestCam;

    const ctx = this.heads.trip.audioCtx;
    await Promise.all(
      (Object.keys(LINES) as LineId[]).map(async (id) => {
        const buf = await (
          await fetch(`${this.base}/lines/${id}.mp3`)
        ).arrayBuffer();
        this.audio[id] = await ctx.decodeAudioData(buf);
        tick();
      }),
    );

    const headOf = (who: Who) =>
      this.heads[who].armature.getObjectByName("Head")!;
    this.director = new Director(
      1,
      { trip: headOf("trip"), grace: headOf("grace") },
      this.guestCam.position,
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.director.camera));
    this.bokeh = new BokehPass(this.scene, this.director.camera, {
      focus: 3,
      aperture: 0.0025,
      maxblur: 0.008,
    });
    this.composer.addPass(this.bokeh);
    this.grade = new ShaderPass(Grade);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  resize() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
    if (this.director) {
      this.director.camera.aspect = w / h;
      this.director.camera.updateProjectionMatrix();
    }
  }

  private frame() {
    if (this.stopped) return;
    const dt = Math.min(this.clock.getDelta(), 0.1);
    for (const h of Object.values(this.heads)) h.animate(dt * 1000);
    const focus = this.director.update(dt);
    (this.bokeh.uniforms as Record<string, { value: number }>).focus.value =
      focus;
    (this.grade.uniforms as Record<string, { value: number }>).time.value += dt;
    this.composer.render();
  }

  async unlock() {
    await this.heads.trip.audioCtx.resume();
  }

  cut(shot: ShotName) {
    this.director.cut(shot);
  }

  /** Plays a line with lip sync; resolves when it has been said. */
  async say(
    id: LineId,
    opt: { shot?: ShotName; mood?: string; gesture?: string } = {},
  ) {
    const line = LINES[id];
    const who: Who = line.who === "TRIP" ? "trip" : "grace";
    const head = this.heads[who];
    const audio = this.audio[id]!;
    if (opt.shot) this.cut(opt.shot);
    if (opt.mood) head.setMood(opt.mood);
    if (opt.gesture) head.playGesture(opt.gesture, 2.5);
    this.ev.onSubtitle(who, line.text);
    head.speakAudio(
      {
        audio,
        words: line.words,
        wtimes: line.wtimes,
        wdurations: line.wdurations,
      },
      { lipsyncLang: "en" },
    );
    await wait(audio.duration * 1000 + 250);
    this.ev.onSubtitle(null, "");
  }

  /** A silent reaction: an expression and a gesture, no line. */
  react(who: Who, opt: { mood?: string; face?: string; gesture?: string }) {
    const head = this.heads[who];
    if (opt.mood) head.setMood(opt.mood);
    if (opt.face) head.playGesture(opt.face, 2.2);
    if (opt.gesture) head.playGesture(opt.gesture, 2.2);
  }

  /** Has one actor glance at the other, or back at the guest. */
  glance(who: Who, at: Who | "guest") {
    this.heads[who].speakTo =
      at === "guest"
        ? this.guestCam
        : this.heads[at].armature.getObjectByName("Head")!;
  }

  dispose() {
    this.stopped = true;
    this.renderer.setAnimationLoop(null);
    void this.heads.trip?.audioCtx.close();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
