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
import {
  SCRIPT,
  lineUrl,
  nameUrl,
  sfxUrl,
  type LineId,
  type ScriptLine,
} from "@/content/dinner-party-script";
import { buildSet, type BuiltSet, type PropId } from "./set";
import { Actor, angleDiff } from "./actor";
import { Guest } from "./guest";
import { read } from "./read";
import type {
  Cast,
  GuestView,
  Held,
  Look,
  Mark,
  Move,
  Spot,
  Who,
} from "./drama";

// TalkingHead builds its own GLTFLoader; the avatars are meshopt-compressed.
const load = GLTFLoader.prototype.load;
GLTFLoader.prototype.load = function (...args: Parameters<typeof load>) {
  this.setMeshoptDecoder(MeshoptDecoder);
  return load.apply(this, args);
};

export type { Who };

const Grade = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0.05 },
    fade: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; uniform float amount; uniform float fade; varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // teal shadows, warm highlights
      float l = dot(c.rgb, vec3(0.299,0.587,0.114));
      c.rgb = mix(c.rgb * vec3(0.92,1.0,1.06), c.rgb * vec3(1.06,1.0,0.9), smoothstep(0.15,0.75,l));
      float g = rand(vUv * vec2(1920.0,1080.0) + fract(time) * 100.0) - 0.5;
      c.rgb += g * amount;
      vec2 d = vUv - 0.5; c.rgb *= 1.0 - dot(d,d) * 0.9;
      c.rgb *= 1.0 - fade;
      gl_FragColor = c;
    }`,
};

/** Where each of them stands for each part of the night. */
const MARKS: Record<Mark, [number, number]> = {
  door: [1.2, 3.0],
  "center-t": [-0.55, 0.85],
  "center-g": [0.95, 0.55],
  bar: [-2.5, -1.05],
  sideboard: [-4.0, -0.3],
  painting: [2.55, -1.15],
  "sofa-side": [1.0, -1.15],
  table: [1.4, -1.3],
  window: [-1.0, -1.9],
};

/** Places in the room that mean something when the guest walks up. */
const SPOTS: Record<Spot, [number, number, number]> = {
  door: [1.2, 4.0, 0.55],
  closet: [3.6, 4.0, 0.7],
  painting: [3.0, -1.1, 1.25],
  sideboard: [-4.2, -0.4, 1.0],
  bar: [-2.5, -1.1, 0.9],
  sofa: [3.0, -1.3, 0.6],
};

export type Action = { key: string; label: string; move: Move | "pickup" };
export type Focus = { label: string; actions: Action[] } | null;

export type StageEvents = {
  onSubtitle: (who: Who | null, text: string, door?: boolean) => void;
  onProgress: (p: number) => void;
  onFocus: (f: Focus) => void;
  onReveal: (what: "phone" | "letter" | null) => void;
  onMove: (m: Move) => void;
};

type Take = {
  buf: AudioBuffer;
  words: string[];
  wtimes: number[];
  wdurations: number[];
  end: number;
};

export class Stage implements Cast {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  guestBody: Guest;
  actors = {} as Record<Who, Actor>;
  heads = {} as Record<Who, TalkingHead>;
  held: Held = null;
  private set!: BuiltSet;
  private composer!: EffectComposer;
  private bokeh!: BokehPass;
  private grade!: ShaderPass;
  private timer = new THREE.Timer();
  private ctx!: AudioContext;
  private takes = new Map<string, Promise<Take | null>>();
  private host: HTMLElement;
  private base: string;
  private ev: StageEvents;
  private name: string | null;
  private stopped = false;
  private speaking: Who | null = null;
  private ray = new THREE.Raycaster();
  private picks: THREE.Object3D[] = [];
  private solid: THREE.Object3D[] = [];
  private focus: { id: string; actions: Action[] } | null = null;
  private inSpot: Spot | null = null;
  private closeTo = new Set<Who>();
  private awayFor = 0;
  private grip = new THREE.Group();
  private buzzing = false;
  private giving: Who | null = null;
  private homes = new Map<PropId, THREE.Matrix4>();
  private tweens: {
    t: number;
    ms: number;
    fn: (k: number) => void;
    done: () => void;
  }[] = [];
  playing = false;

  constructor(
    host: HTMLElement,
    base: string,
    name: string | null,
    ev: StageEvents,
  ) {
    this.host = host;
    this.base = base;
    this.ev = ev;
    this.name = name;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.style.touchAction = "none";
    host.appendChild(this.renderer.domElement);
    this.guestBody = new Guest(this.renderer.domElement, (ndc) =>
      this.click(ndc),
    );
    this.guestBody.camera.add(this.grip);
    this.scene.add(this.guestBody.camera);
  }

  // ------------------------------------------------------------ loading

  async load() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.25;
    this.set = buildSet(this.scene, this.base);
    this.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) this.solid.push(o);
    });
    for (const [id, o] of Object.entries(this.set.props) as [
      PropId,
      THREE.Object3D,
    ][]) {
      o.userData.prop = id;
      this.picks.push(o);
      this.homes.set(id, o.matrix.clone());
    }

    let done = 0;
    const tick = () => this.ev.onProgress(++done / 6);
    const hidden = document.createElement("div");
    this.ctx = new AudioContext();
    const start: Record<
      Who,
      { url: string; body: "M" | "F"; at: [number, number] }
    > = {
      theo: { url: "avatars/theo.glb", body: "M", at: MARKS.door },
      nina: { url: "avatars/nina.glb", body: "F", at: [2.2, -0.6] },
    };
    await Promise.all(
      (["theo", "nina"] as Who[]).map(async (who) => {
        const a = start[who];
        const head = new TalkingHead(hidden, {
          avatarOnly: true,
          avatarOnlyCamera: this.guestBody.camera,
          lipsyncModules: [],
          modelFPS: 60,
          avatarIdleEyeContact: 0.6,
          avatarSpeakingEyeContact: 0.8,
          audioCtx: this.ctx,
        });
        head.lipsync.en = new LipsyncEn();
        await head.showAvatar({
          url: `${this.base}/${a.url}`,
          body: a.body,
          avatarMood: "neutral",
          lipsyncLang: "en",
          baseline: { eyeBlinkLeft: 0.12, eyeBlinkRight: 0.12 },
        });
        const arm = head.armature;
        arm.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
            m.frustumCulled = false;
          }
        });
        // An invisible column to click on or bump into.
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 1.75, 8),
          new THREE.MeshBasicMaterial({ visible: false }),
        );
        body.position.y = 0.88;
        body.userData.who = who;
        arm.add(body);
        this.picks.push(body);
        this.solid.push(body);
        this.scene.add(arm);
        this.heads[who] = head;
        const actor = new Actor(head);
        actor.place(a.at[0], a.at[1]);
        actor.facing = this.guestBody.camera;
        head.speakTo = this.guestBody.camera;
        this.actors[who] = actor;
        tick();
      }),
    );
    // The first lines and the room's sounds, so the door scene is ready.
    for (const id of [
      "d-g1",
      "d-t1",
      "d-g2",
      "d-t2",
      "d-t3",
      "d-g3",
      "a-t1",
      "a-t1b",
    ] as LineId[])
      void this.take(id);
    for (const s of ["knock", "door-open", "room"]) void this.sound(s);
    if (this.name) {
      void this.nameTake("THEO", "exclaim");
      void this.nameTake("NINA", "address");
    }
    await Promise.all(["d-g1", "d-t1"].map((id) => this.take(id as LineId)));
    tick();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.guestBody.camera));
    this.bokeh = new BokehPass(this.scene, this.guestBody.camera, {
      focus: 3,
      aperture: 0.0016,
      maxblur: 0.006,
    });
    this.composer.addPass(this.bokeh);
    this.grade = new ShaderPass(Grade);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
    this.uniform("fade", 1);
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
    tick();
  }

  resize() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
    const c = this.guestBody.camera;
    c.aspect = w / h;
    // Keep a sensible horizontal view on tall phone screens.
    c.fov = w / h < 1 ? 78 : 62;
    c.updateProjectionMatrix();
  }

  async unlock() {
    await this.ctx.resume();
  }

  /** Fades the picture up from black (or down). */
  fadeTo(v: number, ms = 1200) {
    const from = this.uniform("fade");
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      this.uniform("fade", from + (v - from) * k);
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  }

  private uniform(name: string, v?: number) {
    const u = (
      this.grade?.uniforms as Record<string, { value: number }> | undefined
    )?.[name];
    if (u && v !== undefined) u.value = v;
    return u?.value ?? 0;
  }

  // ------------------------------------------------------------ the frame

  private frame() {
    if (this.stopped) return;
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    for (const w of ["theo", "nina"] as Who[]) {
      this.heads[w].animate(dt * 1000);
      this.actors[w].update(dt);
    }
    const people = (["theo", "nina"] as Who[]).map((w) => this.actors[w].pos);
    for (const tw of [...this.tweens]) {
      tw.t += dt * 1000;
      const k = Math.min(1, tw.t / tw.ms);
      tw.fn(k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
      if (k >= 1) {
        this.tweens.splice(this.tweens.indexOf(tw), 1);
        tw.done();
      }
    }
    this.guestBody.update(dt, this.set.blocks, people);
    if (this.playing) this.sense(dt);
    this.aim();
    if (this.buzzing)
      this.set.props.phone.rotation.y =
        0.3 + Math.sin(performance.now() / 18) * 0.03;
    (this.bokeh.uniforms as Record<string, { value: number }>).focus.value =
      this.focusDistance();
    this.uniform("time", this.uniform("time") + dt);
    this.composer.render();
  }

  /** Notices where the guest is: spots, personal space, wandering off. */
  private sense(dt: number) {
    const g = this.guestBody.pos;
    let at: Spot | null = null;
    for (const [s, [x, z, r]] of Object.entries(SPOTS) as [
      Spot,
      [number, number, number],
    ][])
      if (g.distanceTo(new THREE.Vector2(x, z)) < r) at = s;
    if (at && at !== this.inSpot) this.ev.onMove({ kind: "near", spot: at });
    this.inSpot = at;
    for (const w of ["theo", "nina"] as Who[]) {
      const d = g.distanceTo(this.actors[w].pos);
      if (d < 0.6 && !this.closeTo.has(w) && !this.actors[w].walking) {
        this.closeTo.add(w);
        this.ev.onMove({ kind: "space", who: w });
      } else if (d > 1.0) this.closeTo.delete(w);
    }
    const far = people(this).every((p) => g.distanceTo(p) > 4.3);
    this.awayFor = far ? this.awayFor + dt : 0;
    if (this.awayFor > 3) {
      this.awayFor = -20;
      this.ev.onMove({ kind: "away" });
    }
  }

  /** What's under the crosshair, and what the guest can do with it. */
  private aim() {
    if (!this.playing) return this.setFocus(null);
    const c = this.guestBody.camera;
    this.ray.setFromCamera(new THREE.Vector2(0, 0), c);
    this.ray.far = 2.4;
    const hit = this.ray.intersectObjects(this.picks, true)[0];
    let id: string | null = null;
    let o: THREE.Object3D | null = hit?.object ?? null;
    while (o && !o.userData.prop && !o.userData.who) o = o.parent;
    if (o) id = o.userData.prop ?? o.userData.who;
    const actions: Action[] = [];
    const held = this.held;
    if (id === "theo" || id === "nina") {
      const who = id as Who;
      if (hit!.distance < 1.6) {
        actions.push({ key: "e", label: "Hug", move: { kind: "hug", who } });
        actions.push({ key: "r", label: "Kiss", move: { kind: "kiss", who } });
        if (held === "drink")
          actions.push({
            key: "f",
            label: "Give drink",
            move: { kind: "give", who },
          });
      }
    } else if (id && !held) {
      const map: Partial<Record<PropId, Action>> = {
        photo: {
          key: "e",
          label: "Pick up the photo",
          move: { kind: "take", prop: "photo" },
        },
        painting: {
          key: "e",
          label: "Look closer",
          move: { kind: "take", prop: "painting" },
        },
        phone: {
          key: "e",
          label: "Pick up the phone",
          move: { kind: "take", prop: "phone" },
        },
        letter: {
          key: "e",
          label: "Read the letter",
          move: { kind: "take", prop: "letter" },
        },
        suitcase: {
          key: "e",
          label: "Look at the suitcase",
          move: { kind: "take", prop: "suitcase" },
        },
        bottles: {
          key: "e",
          label: "Pour yourself one",
          move: { kind: "take", prop: "bottle" },
        },
        door: { key: "e", label: "Leave", move: { kind: "leave" } },
        sofa: { key: "e", label: "Sit down", move: { kind: "sit" } },
      };
      const a = map[id as PropId];
      if (a && !(id === "sofa" && this.guestBody.sitting)) actions.push(a);
    }
    if (held) {
      if (held === "drink" || held === "bottle")
        actions.push({ key: "q", label: "Sip", move: { kind: "sip" } });
      actions.push({ key: "x", label: "Put it down", move: { kind: "drop" } });
    }
    this.setFocus(actions.length ? { id: id ?? "held", actions } : null);
  }

  private setFocus(f: { id: string; actions: Action[] } | null) {
    const key = f ? f.id + f.actions.map((a) => a.label).join() : "";
    const old = this.focus
      ? this.focus.id + this.focus.actions.map((a) => a.label).join()
      : "";
    if (key === old) return;
    this.focus = f;
    const label =
      f?.id === "theo"
        ? "Theo"
        : f?.id === "nina"
          ? "Nina"
          : f?.id === "held"
            ? "In your hand"
            : "";
    this.ev.onFocus(f ? { label, actions: f.actions } : null);
  }

  /** Eases fn from 0 to 1 over ms, in step with the frame. */
  private tween(ms: number, fn: (k: number) => void) {
    return new Promise<void>((done) =>
      this.tweens.push({ t: 0, ms, fn, done }),
    );
  }

  /** Does what the guest asked by key or button, and plays it out. */
  act(a: Action) {
    const m = a.move;
    if (m === "pickup") return;
    if (this.guestBody.busy) return;
    switch (m.kind) {
      case "sit":
        void this.sitDown();
        break;
      case "hug":
        void this.hug(m.who);
        break;
      case "kiss":
        void this.kiss(m.who);
        break;
      case "sip":
        void this.sip();
        break;
      case "give":
        this.giving = m.who;
        break;
      case "drop":
        // Down it goes now, whatever anyone says about it after.
        for (const c of [...this.grip.children]) void this.letGo(c, null);
        break;
      case "take":
        if (m.prop === "painting" || m.prop === "suitcase")
          void this.closeIn(
            this.set.props[m.prop].getWorldPosition(new THREE.Vector3()),
            m.prop === "painting" ? 0.9 : 0.7,
            1600,
          );
        break;
    }
    this.ev.onMove(m);
  }

  /**
   * Moves the guest's head toward a point (stopping gap metres short), holds,
   * and comes back. Feet stay put, so nothing can end up inside a wall.
   */
  private async closeIn(
    at: THREE.Vector3,
    gap: number,
    hold: number,
    during?: () => Promise<void> | void,
  ) {
    const g = this.guestBody;
    g.busy = true;
    g.goal = null;
    g.gaze = at;
    const eye = g.camera.position.clone().sub(g.lean);
    const to = at.clone().sub(eye);
    const len = to.length();
    const want = to.multiplyScalar(Math.max(0, (len - gap) / len));
    // Never lean more than a long step.
    if (want.length() > 0.9) want.setLength(0.9);
    await this.tween(650, (k) => g.lean.copy(want).multiplyScalar(k));
    await Promise.all([during?.(), this.wait(hold)]);
    g.gaze = null;
    await this.tween(700, (k) => g.lean.copy(want).multiplyScalar(1 - k));
    g.lean.set(0, 0, 0);
    g.busy = false;
  }

  private async hug(who: Who) {
    const a = this.actors[who];
    a.facing = this.guestBody.camera;
    const chest = this.headOf(who)
      .getWorldPosition(new THREE.Vector3())
      .add(new THREE.Vector3(0, -0.2, 0));
    void this.tween(700, (k) => (a.reach = k));
    await this.closeIn(chest, 0.34, 1500);
    await this.tween(600, (k) => (a.reach = 1 - k));
  }

  private async kiss(who: Who) {
    const face = this.headOf(who).getWorldPosition(new THREE.Vector3());
    face.y += 0.04;
    await this.closeIn(face, 0.16, 700, async () => {
      await this.tween(250, (k) => this.uniform("fade", 0.45 * k));
      await this.wait(300);
      await this.tween(350, (k) => this.uniform("fade", 0.45 * (1 - k)));
    });
  }

  /** Raises the glass to the lips and back. */
  private async sip() {
    const o = this.grip.children[0];
    if (!o) return;
    const g = this.guestBody;
    g.busy = true;
    const from = o.position.clone();
    const to = new THREE.Vector3(0.03, -0.1, -0.2);
    await this.tween(550, (k) => {
      o.position.lerpVectors(from, to, k);
      o.rotation.x = 0.6 * k;
      g.pitch += (0.12 - g.pitch) * k * 0.08;
    });
    await this.wait(600);
    await this.tween(550, (k) => {
      o.position.lerpVectors(to, from, k);
      o.rotation.x = 0.6 * (1 - k);
    });
    g.busy = false;
  }

  /** Walks the last bit to the sofa and lowers into it. */
  private async sitDown() {
    const g = this.guestBody;
    g.busy = true;
    const from = g.pos.clone();
    const to = new THREE.Vector2(3.0, -1.75);
    const yaw0 = g.yaw;
    await this.tween(900, (k) => {
      g.pos.lerpVectors(from, to, k);
      g.yaw = yaw0 + angleDiff(0, yaw0) * k;
    });
    g.sit(to.x, to.y, 0);
    g.busy = false;
  }

  /** A click: on something you can use, use it; on the floor, walk there. */
  private click(ndc: THREE.Vector2) {
    if (!this.playing) return;
    this.ray.setFromCamera(ndc, this.guestBody.camera);
    this.ray.far = 30;
    const near = this.ray.intersectObjects(this.picks, true)[0];
    if (near && near.distance < 2.4 && this.focus?.actions[0])
      return this.act(this.focus.actions[0]);
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const p = this.ray.ray.intersectPlane(floor, new THREE.Vector3());
    if (p && p.distanceTo(this.guestBody.camera.position) < 12)
      this.guestBody.go(p.x, p.z);
  }

  private focusDistance() {
    const c = this.guestBody.camera;
    const fwd = c.getWorldDirection(new THREE.Vector3());
    const who = this.speaking;
    if (who) {
      const h = this.headOf(who).getWorldPosition(new THREE.Vector3());
      const to = h.clone().sub(c.position);
      if (to.clone().normalize().dot(fwd) > 0.8) return to.length();
    }
    // Only the set and the actors' stand-in columns: raycasting the skinned
    // avatars every frame is what made walking stutter.
    this.ray.setFromCamera(new THREE.Vector2(0, 0), c);
    this.ray.far = 12;
    const hit = this.ray.intersectObjects(this.solid, false)[0];
    return hit ? hit.distance : 3;
  }

  private headOf(who: Who) {
    return this.heads[who].armature.getObjectByName("Head")!;
  }

  // ------------------------------------------------------------ audio

  private async decode(url: string): Promise<Take | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const j = (await res.json()) as Omit<Take, "buf"> & { audio: string };
      const bytes = Uint8Array.from(atob(j.audio), (c) => c.charCodeAt(0));
      const buf = await this.ctx.decodeAudioData(bytes.buffer);
      return {
        buf,
        words: j.words,
        wtimes: j.wtimes,
        wdurations: j.wdurations,
        end: j.end,
      };
    } catch {
      return null;
    }
  }

  private take(id: LineId) {
    let p = this.takes.get(id);
    if (!p) {
      p = this.decode(lineUrl(id));
      this.takes.set(id, p);
    }
    return p;
  }

  private nameTake(who: "THEO" | "NINA", tone: "exclaim" | "address") {
    const key = `name:${who}:${tone}`;
    let p = this.takes.get(key);
    if (!p) {
      p = this.name
        ? this.decode(nameUrl(this.name, who, tone))
        : Promise.resolve(null);
      this.takes.set(key, p);
    }
    return p;
  }

  private sound(id: string) {
    const key = `sfx:${id}`;
    let p = this.takes.get(key);
    if (!p) {
      p = this.decode(sfxUrl(id));
      this.takes.set(key, p);
    }
    return p;
  }

  /** Warms the next few lines in script order, to hide recording time. */
  private prefetch(id: LineId) {
    const ids = Object.keys(SCRIPT) as LineId[];
    const i = ids.indexOf(id);
    for (const n of ids.slice(i + 1, i + 5)) void this.take(n);
  }

  /** A line plus, if it calls for one, the guest's name said just before. */
  private async compose(id: LineId): Promise<{ take: Take; text: string }> {
    const l: ScriptLine = SCRIPT[id];
    const [line, name] = await Promise.all([
      this.take(id),
      l.name ? this.nameTake(l.who, l.name) : Promise.resolve(null),
    ]);
    const text =
      name && this.name
        ? `${this.name}${l.name === "exclaim" ? "!" : ","} ${l.text}`
        : l.text;
    const base = line ?? this.silent(l.text);
    if (!name) return { take: base, text };
    // Splice: the name, a breath, then the line, with timings shifted.
    const cut = Math.min(name.buf.duration, name.end + 0.12);
    const gap = 0.06;
    const rate = this.ctx.sampleRate;
    const total = Math.ceil((cut + gap + base.buf.duration) * rate);
    const out = this.ctx.createBuffer(
      Math.max(name.buf.numberOfChannels, base.buf.numberOfChannels),
      total,
      rate,
    );
    for (let ch = 0; ch < out.numberOfChannels; ch++) {
      const o = out.getChannelData(ch);
      o.set(
        name.buf
          .getChannelData(Math.min(ch, name.buf.numberOfChannels - 1))
          .subarray(0, Math.floor(cut * rate)),
      );
      o.set(
        base.buf.getChannelData(Math.min(ch, base.buf.numberOfChannels - 1)),
        Math.floor((cut + gap) * rate),
      );
    }
    const shift = Math.round((cut + gap) * 1000);
    return {
      take: {
        buf: out,
        words: [...name.words, ...base.words],
        wtimes: [...name.wtimes, ...base.wtimes.map((t) => t + shift)],
        wdurations: [...name.wdurations, ...base.wdurations],
        end: cut + gap + base.end,
      },
      text,
    };
  }

  /** No recording to hand: mouth the words silently, at speaking pace. */
  private silent(text: string): Take {
    const words = text.split(/\s+/).filter(Boolean);
    const per = 0.3;
    const buf = this.ctx.createBuffer(
      1,
      Math.ceil((words.length * per + 0.3) * this.ctx.sampleRate),
      this.ctx.sampleRate,
    );
    return {
      buf,
      words,
      wtimes: words.map((_, i) => Math.round(i * per * 1000)),
      wdurations: words.map(() => Math.round(per * 900)),
      end: words.length * per,
    };
  }

  // ------------------------------------------------------------ Cast

  async say(
    id: LineId,
    o: {
      mood?: string;
      gesture?: string;
      face?: string;
      look?: Look;
      signal: AbortSignal;
    },
  ) {
    const l = SCRIPT[id];
    const who: Who = l.who === "THEO" ? "theo" : "nina";
    const head = this.heads[who];
    this.prefetch(id);
    const { take, text } = await this.compose(id);
    if (o.signal.aborted) return;
    if (o.look) this.look(who, o.look);
    if (o.mood) head.setMood(o.mood);
    if (o.face) head.playGesture(o.face, 2.2);
    if (o.gesture) head.playGesture(o.gesture, 2.5);
    this.speaking = who;
    this.ev.onSubtitle(who, text);
    head.speakAudio(
      {
        audio: take.buf,
        words: take.words,
        wtimes: take.wtimes,
        wdurations: take.wdurations,
      },
      { lipsyncLang: "en" },
    );
    await this.wait(take.buf.duration * 1000 + 220, o.signal);
    if (o.signal.aborted) head.stopSpeaking();
    if (this.speaking === who) this.speaking = null;
    this.ev.onSubtitle(null, "");
  }

  /** A line heard through the front door: muffled, nobody on screen. */
  async door(id: LineId) {
    const l = SCRIPT[id];
    const who: Who = l.who === "THEO" ? "theo" : "nina";
    this.prefetch(id);
    const t = await this.take(id);
    this.ev.onSubtitle(who, l.text, true);
    if (t) {
      const src = this.ctx.createBufferSource();
      src.buffer = t.buf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 650;
      const g = this.ctx.createGain();
      g.gain.value = 0.9;
      src.connect(lp).connect(g).connect(this.ctx.destination);
      src.start();
      await this.wait(t.buf.duration * 1000 + 150);
    } else await this.wait(l.text.split(" ").length * 300 + 400);
    this.ev.onSubtitle(null, "");
  }

  sfx(id: string) {
    void this.sound(id).then((t) => {
      if (!t) return;
      const src = this.ctx.createBufferSource();
      src.buffer = t.buf;
      const g = this.ctx.createGain();
      // The generated effects come back at wildly different levels, so set
      // each by its measured loudness rather than trusting the file.
      g.gain.value = Math.min(3, (LOUDNESS[id] ?? 0.04) / rms(t.buf));
      src.loop = id === "room";
      src.connect(g).connect(this.ctx.destination);
      src.start();
    });
  }

  react(who: Who, o: { mood?: string; face?: string; gesture?: string }) {
    const head = this.heads[who];
    if (o.mood) head.setMood(o.mood);
    if (o.face) head.playGesture(o.face, 2.2);
    if (o.gesture) head.playGesture(o.gesture, 2.2);
  }

  look(who: Who, at: Look) {
    const t = this.target(at);
    this.heads[who].speakTo = t;
    this.actors[who].facing = t;
  }

  private target(at: Look): THREE.Object3D {
    switch (at) {
      case "guest":
        return this.guestBody.camera;
      case "theo":
      case "nina":
        return this.headOf(at);
      case "closet":
        return this.set.props.suitcase;
      default:
        return this.set.props[at];
    }
  }

  async walk(who: Who, to: Mark) {
    const [x, z] = MARKS[to];
    await this.actors[who].walk([x, z]);
  }

  /** Puts something in the guest's hand (or empties it). */
  hand(held: Held) {
    // Whatever was held goes back where it came from, or to whoever it
    // was handed to.
    const to = this.giving;
    this.giving = null;
    for (const c of [...this.grip.children]) void this.letGo(c, to);
    this.held = held;
    if (!held) return this.ev.onReveal(null);
    let o: THREE.Object3D;
    const glass = () => {
      const g = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.03, 0.09, 20),
        // Plain transparency: a transmissive glass this close to the lens
        // costs a second render of the room every frame.
        new THREE.MeshStandardMaterial({
          color: 0xd9a35b,
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0.75,
        }),
      );
      return g;
    };
    if (held === "drink" || held === "bottle") o = glass();
    else {
      const id: PropId =
        held === "photo" ? "photo" : held === "letter" ? "letter" : "phone";
      const src = this.set.props[id];
      o = src.clone();
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
      if (id === "photo") o.rotation.set(0, Math.PI / 2, -0.1);
      if (id === "letter" || id === "phone")
        o.rotation.set(Math.PI / 2.4, 0, 0);
      src.visible = false;
      o.userData.home = id;
    }
    // It comes up into view from wherever it was: the prop's place in the
    // room, or Theo's hand for a drink.
    const rest = o.position.clone().add(new THREE.Vector3(0.16, -0.17, -0.42));
    const src =
      held === "drink"
        ? this.headOf("theo")
            .getWorldPosition(new THREE.Vector3())
            .add(new THREE.Vector3(0, -0.45, 0))
        : held === "bottle"
          ? this.set.props.bottles.getWorldPosition(new THREE.Vector3())
          : this.set.props[o.userData.home as PropId].getWorldPosition(
              new THREE.Vector3(),
            );
    this.guestBody.camera.updateMatrixWorld();
    const start = this.grip.worldToLocal(src);
    if (start.length() > 2.5) start.setLength(2.5);
    o.position.copy(start);
    this.grip.add(o);
    if (held === "drink") {
      const t = this.actors.theo;
      t.take = 1;
      void this.wait(500).then(() => this.tween(500, (k) => (t.take = 1 - k)));
    }
    void this.tween(600, (k) => o.position.lerpVectors(start, rest, k));
  }

  /** Lowers a held thing out of view, then puts it back (or hands it over). */
  private async letGo(o: THREE.Object3D, to: Who | null) {
    const from = o.position.clone();
    let end = from.clone().add(new THREE.Vector3(0, -0.35, 0.1));
    if (to) {
      const a = this.actors[to];
      a.take = 1;
      const w = this.headOf(to)
        .getWorldPosition(new THREE.Vector3())
        .add(new THREE.Vector3(0, -0.45, 0));
      end = this.grip.worldToLocal(w);
      if (end.length() > 1.5) end.setLength(1.5);
    }
    await this.tween(to ? 600 : 400, (k) =>
      o.position.lerpVectors(from, end, k),
    );
    this.grip.remove(o);
    if (to) void this.tween(500, (k) => (this.actors[to].take = 1 - k));
    const home = o.userData.home as PropId | undefined;
    if (home) {
      const p = this.set.props[home];
      p.matrix.copy(this.homes.get(home)!);
      p.matrix.decompose(p.position, p.quaternion, p.scale);
      p.visible = true;
    }
  }

  buzz(on: boolean) {
    this.buzzing = on;
    this.set.phoneScreen.emissiveIntensity = on ? 1.6 : 0;
    if (on) this.sfx("buzz");
    else this.set.props.phone.rotation.y = 0.3;
  }

  reveal(what: "phone" | "letter") {
    this.ev.onReveal(what);
  }

  guest(): GuestView {
    const g = this.guestBody.pos;
    return {
      dist: {
        theo: g.distanceTo(this.actors.theo.pos),
        nina: g.distanceTo(this.actors.nina.pos),
      },
      at: this.inSpot,
      held: this.held,
      sitting: this.guestBody.sitting,
    };
  }

  read = read;

  wait(ms: number, signal?: AbortSignal) {
    return new Promise<void>((r) => {
      const t = setTimeout(r, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        r();
      });
    });
  }

  /** Opens the door onto the room. */
  enter() {
    this.guestBody.frozen = false;
    this.playing = true;
    this.fadeTo(0, 900);
    this.sfx("room");
  }

  dispose() {
    this.stopped = true;
    this.renderer.setAnimationLoop(null);
    this.guestBody.dispose();
    void this.ctx?.close();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/** How loud each effect should sit in the mix, as RMS. */
const LOUDNESS: Record<string, number> = {
  room: 0.01,
  buzz: 0.025,
  knock: 0.07,
  "door-open": 0.05,
  "door-shut": 0.06,
  pour: 0.035,
  clink: 0.03,
};

function rms(b: AudioBuffer) {
  const d = b.getChannelData(0);
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += d[i] * d[i];
  return Math.max(1e-4, Math.sqrt(sum / (d.length / 4)));
}

const people = (s: Stage) =>
  (["theo", "nina"] as Who[]).map((w) => s.actors[w].pos);
