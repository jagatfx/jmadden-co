import type { Line, Mood } from "@/content/last-signal-film";
import { SFX } from "@/content/last-signal-film";

/**
 * The film's sound: Web Audio, so the radio is a real filter chain and the
 * score can follow the story. Voices on the radio are band-limited and driven;
 * ARC is in the room, clean, after a cabin chime; the static bed rises
 * whenever Ines is waiting on you.
 */
export type { Mood };

export class FilmSound {
  readonly ctx: AudioContext;
  private master: GainNode;
  private radio: GainNode;
  private room: GainNode;
  private staticBed: GainNode;
  private sfxBus: GainNode;
  private score: Record<Exclude<Mood, "silence">, GainNode>;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private sfxNow: {
    id: string;
    src: AudioBufferSourceNode;
    gain: GainNode;
  } | null = null;
  private voices = new Set<AudioBufferSourceNode>();
  /** Everything laid on the timeline, so a skip can pull it all. */
  private placed = new Set<AudioScheduledSourceNode>();

  constructor() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.95;
    this.master.connect(ctx.destination);

    // Radio voice: band-limited and lightly overdriven.
    this.radio = ctx.createGain();
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 320;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3400;
    const drive = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(2.2 * x) / Math.tanh(2.2);
    }
    drive.curve = curve;
    this.radio.connect(hp).connect(lp).connect(drive).connect(this.master);

    this.room = ctx.createGain();
    this.room.connect(this.master);

    // Static: looping noise through a band-pass, quiet until she listens.
    const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = n;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1900;
    band.Q.value = 0.6;
    this.staticBed = ctx.createGain();
    this.staticBed.gain.value = 0.015;
    noise.connect(band).connect(this.staticBed).connect(this.master);
    noise.start();

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.55;
    this.sfxBus.connect(this.master);

    // Score: three layers from the brief, mixed by the story.
    const layer = (freqs: number[], type: OscillatorType, cutoff: number) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = cutoff;
      for (const [i, hz] of freqs.entries()) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = hz;
        o.detune.value = (i % 2 ? 1 : -1) * 6;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.05 + i * 0.03;
        const depth = ctx.createGain();
        depth.gain.value = 0.35 / freqs.length;
        const v = ctx.createGain();
        v.gain.value = 0.5 / freqs.length;
        lfo.connect(depth).connect(v.gain);
        o.connect(v).connect(f);
        o.start();
        lfo.start();
      }
      f.connect(g).connect(this.master);
      return g;
    };
    this.score = {
      // A low open fifth, like the dish humming.
      ambient: layer([55, 82.4, 110], "triangle", 600),
      // A semitone rub on top: something is wrong.
      tension: layer([58.3, 87.3, 116.5, 123.5], "sawtooth", 420),
      // Major, warm, a little brighter.
      resolve: layer([65.4, 98, 130.8, 164.8], "triangle", 1400),
    };
  }

  resume() {
    return this.ctx.resume();
  }

  private load(url: string) {
    if (!this.buffers.has(url))
      this.buffers.set(
        url,
        fetch(url)
          .then((r) => {
            if (!r.ok) throw new Error(`${url}: ${r.status}`);
            return r.arrayBuffer();
          })
          .then((b) => this.ctx.decodeAudioData(b)),
      );
    return this.buffers.get(url)!;
  }

  preload(lines: Line[], cues: string[], clips: string[] = []) {
    return Promise.allSettled([
      ...lines.map((l) => this.load(lineUrl(l))),
      ...cues.map((c) => this.load(sfxUrl(c))),
      ...clips.map((c) => this.load(syncUrl(c))),
    ]);
  }

  /**
   * Lays a sound on the timeline at context time `at`, from `offset` seconds
   * into it, for `dur` seconds, with short fades so cuts don't click. If it
   * loads late, it comes in where it would have been, so sync holds.
   */
  async place(
    url: string,
    opts: {
      at: number;
      offset?: number;
      dur?: number;
      gain?: number;
      loop?: boolean;
      bus?: "fx" | "room" | "radio";
    },
  ) {
    const buf = await this.load(url).catch(() => null);
    if (!buf || this.ctx.state === "closed") return 0;
    const { at, offset = 0, gain = 1, loop = false, bus = "room" } = opts;
    const dur = opts.dur ?? (loop ? 0 : buf.duration - offset);
    const now = this.ctx.currentTime;
    const late = Math.max(0, now - at);
    if (late >= dur) return buf.duration;
    const start = at + late;
    const end = at + dur;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    const g = this.ctx.createGain();
    const fade = Math.min(0.08, dur / 4);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + fade);
    g.gain.setValueAtTime(gain, end - fade);
    g.gain.linearRampToValueAtTime(0, end);
    const out =
      bus === "fx" ? this.sfxBus : bus === "radio" ? this.radio : this.room;
    src.connect(g).connect(out);
    src.start(start, loop ? (offset + late) % buf.duration : offset + late);
    src.stop(end);
    this.placed.add(src);
    src.onended = () => this.placed.delete(src);
    return buf.duration;
  }

  /** A line on the timeline: ARC after its chime, Ines over the radio. Returns when the words start. */
  placeLine(line: Line, at: number, open = false) {
    let start = at;
    if (line.who === "ARC") start = this.chime(at);
    void this.place(lineUrl(line), {
      at: start,
      bus: open || line.who === "ARC" ? "room" : "radio",
    });
    return start;
  }

  lineLength(line: Line) {
    return this.load(lineUrl(line))
      .then((b) => b.duration)
      .catch(() => 4);
  }

  /** Pulls everything laid on the timeline, for a skip. */
  clearPlaced() {
    const now = this.ctx.currentTime;
    for (const s of this.placed) {
      try {
        s.stop(now + 0.05);
      } catch {}
    }
    this.placed.clear();
  }

  mood(m: Mood, seconds = 4) {
    const now = this.ctx.currentTime;
    for (const [k, g] of Object.entries(this.score)) {
      const level = k === m ? (k === "tension" ? 0.11 : 0.09) : 0;
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(level, now, seconds / 3);
    }
  }

  /** How loud the static is: a whisper while the film plays, up while she waits. */
  static(level: number, seconds = 1.2) {
    const now = this.ctx.currentTime;
    this.staticBed.gain.cancelScheduledValues(now);
    this.staticBed.gain.setTargetAtTime(level, now, seconds / 3);
  }

  async sfx(id: string | undefined) {
    const now = this.ctx.currentTime;
    if (this.sfxNow && this.sfxNow.id !== id) {
      const { src, gain } = this.sfxNow;
      gain.gain.setTargetAtTime(0, now, 0.4);
      src.stop(now + 2);
      this.sfxNow = null;
    }
    if (!id || this.sfxNow) return;
    const buf = await this.load(sfxUrl(id)).catch(() => null);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = SFX[id]?.loop ?? false;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.15);
    src.connect(gain).connect(this.sfxBus);
    src.start();
    this.sfxNow = { id, src, gain };
  }

  /** Plays a line and resolves when it ends. `open` skips the radio filter. */
  async say(line: Line, open = false, signal?: AbortSignal) {
    const buf = await this.load(lineUrl(line)).catch(() => null);
    if (!buf || signal?.aborted) return;
    const clean = open || line.who === "ARC";
    let at = this.ctx.currentTime + 0.05;
    if (line.who === "ARC") at = this.chime(at);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(clean ? this.room : this.radio);
    src.start(at);
    this.voices.add(src);
    await new Promise<void>((done) => {
      src.onended = () => done();
      signal?.addEventListener("abort", () => {
        try {
          src.stop();
        } catch {}
        done();
      });
    });
    this.voices.delete(src);
  }

  /** Two falling notes, like a cabin announcement, so ARC reads as the ship. */
  private chime(at: number) {
    for (const [dt, f] of [
      [0, 1046.5],
      [0.32, 784],
    ]) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0, at + dt);
      g.gain.linearRampToValueAtTime(0.12, at + dt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dt + 0.7);
      o.connect(g).connect(this.room);
      o.start(at + dt);
      o.stop(at + dt + 0.8);
    }
    return at + 1.0;
  }

  /** A click of the push-to-talk key. */
  key() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "square";
    o.frequency.value = 1320;
    g.gain.setValueAtTime(0.03, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.06);
  }

  hush() {
    this.clearPlaced();
    for (const v of this.voices) {
      try {
        v.stop();
      } catch {}
    }
    this.voices.clear();
    void this.sfx(undefined);
  }

  /** Fades the whole mix, static and score included, then shuts it down. */
  async fadeOut(seconds: number) {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, seconds / 5);
    await new Promise((r) => setTimeout(r, seconds * 1000));
    this.close();
  }

  close() {
    if (this.ctx.state === "closed") return;
    this.hush();
    void this.ctx.close();
  }
}

export const lineUrl = (l: Line) => `/last-signal/film/lines/${l.id}.mp3`;
export const sfxUrl = (id: string) => `/last-signal/film/sfx/${id}.mp3`;
export const syncUrl = (clip: string) => `/last-signal/film/clips/${clip}.mp3`;
