"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Station = {
  f: number;
  who: "INES" | "ARC" | "TEO";
  line: string;
  /** Recorded line, played through the radio when the dial locks on. */
  clip?: string;
};

/** Five fragments of the film, hidden in the static. Positions are 0 to 1 across the band. */
const STATIONS: Station[] = [
  {
    f: 0.13,
    who: "INES",
    line: "Any station, this is Perihelion. Any station.",
    clip: "/last-signal/radio/ines-1.mp3",
  },
  {
    f: 0.31,
    who: "INES",
    line: "Somebody's there. I can hear the hiss change.",
    clip: "/last-signal/radio/ines-2.mp3",
  },
  {
    f: 0.52,
    who: "INES",
    line: "Crew's under. Three of them. I'm the one who drew the short straw.",
    clip: "/last-signal/radio/ines-3.mp3",
  },
  { f: 0.71, who: "ARC", line: "Debris risk was within tolerance." },
  {
    f: 0.9,
    who: "INES",
    line: "Talk to me. I'm not doing this one alone.",
    clip: "/last-signal/radio/ines-4.mp3",
  },
];

const BAND_LOW = 400.0;
const BAND_HIGH = 402.5;
const LOCK_WIDTH = 0.035;
const W = 240;
const H = 135;

/** night → cobalt → pink → sun → white, Technicolor-ish. */
const STOPS: [number, number, number, number][] = [
  [0, 15, 16, 32],
  [0.35, 35, 71, 214],
  [0.6, 240, 139, 180],
  [0.82, 246, 183, 51],
  [1, 255, 248, 232],
];

function palette(v: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, v));
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, r1, g1, b1] = STOPS[i];
    if (x <= p1) {
      const [p0, r0, g0, b0] = STOPS[i - 1];
      const t = (x - p0) / (p1 - p0);
      return [r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t];
    }
  }
  return [255, 248, 232];
}

function lockFor(tune: number) {
  let best = -1;
  let lock = 0;
  STATIONS.forEach((s, i) => {
    const l = Math.max(0, 1 - Math.abs(tune - s.f) / LOCK_WIDTH);
    if (l > lock) {
      lock = l;
      best = i;
    }
  });
  return { index: best, lock };
}

const GLYPHS = "▚▞▖▗▘▝#%&*+=<>/\\|";

type Audio = {
  ctx: AudioContext;
  noise: GainNode;
  band: BiquadFilterNode;
  carrier: GainNode;
  master: GainNode;
  voice: GainNode;
  clips: (AudioBuffer | null)[];
  playing: { index: number; src: AudioBufferSourceNode; gain: GainNode } | null;
};

/** Seconds of dead air before a locked transmission repeats. */
const CLIP_GAP = 1.6;

function startAudio(): Audio {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.6);
  master.connect(ctx.destination);

  // Static: looping white noise through a band-pass that follows the dial.
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.7;
  band.frequency.value = 1800;
  const noise = ctx.createGain();
  noise.gain.value = 0.22;
  src.connect(band).connect(noise).connect(master);
  src.start();

  // Carrier: a soft tone with a slow wobble that rises out of the static on lock.
  const carrier = ctx.createGain();
  carrier.gain.value = 0;
  const osc = ctx.createOscillator();
  osc.frequency.value = 523.25;
  const osc2 = ctx.createOscillator();
  osc2.frequency.value = 784.9;
  const wobble = ctx.createOscillator();
  wobble.frequency.value = 0.35;
  const wobbleDepth = ctx.createGain();
  wobbleDepth.gain.value = 3;
  wobble.connect(wobbleDepth).connect(osc.frequency);
  const o2 = ctx.createGain();
  o2.gain.value = 0.25;
  osc.connect(carrier);
  osc2.connect(o2).connect(carrier);
  carrier.connect(master);
  osc.start();
  osc2.start();
  wobble.start();

  // Drone: the first sketch of the score, two low detuned sines.
  const drone = ctx.createGain();
  drone.gain.value = 0.05;
  [55, 82.6, 110.4].forEach((f) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    o.connect(drone);
    o.start();
  });
  drone.connect(master);

  // Voice: band-limited and lightly overdriven so it sounds like a radio, not a podcast.
  const voice = ctx.createGain();
  voice.gain.value = 0;
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
  voice.connect(hp).connect(lp).connect(drive).connect(master);

  return {
    ctx,
    noise,
    band,
    carrier,
    master,
    voice,
    clips: STATIONS.map(() => null),
    playing: null,
  };
}

/** Pads a clip with silence so a looping source leaves a gap between repeats. */
async function loadClip(ctx: AudioContext, url: string) {
  const res = await fetch(url);
  const clip = await ctx.decodeAudioData(await res.arrayBuffer());
  const padded = ctx.createBuffer(
    1,
    clip.length + Math.round(CLIP_GAP * clip.sampleRate),
    clip.sampleRate,
  );
  padded.copyToChannel(clip.getChannelData(0), 0);
  return padded;
}

function stopVoice(a: Audio) {
  if (!a.playing) return;
  const { src, gain } = a.playing;
  const now = a.ctx.currentTime;
  gain.gain.setTargetAtTime(0, now, 0.06);
  src.stop(now + 0.4);
  a.playing = null;
}

function blip(audio: Audio | null, high: boolean) {
  if (!audio) return;
  const { ctx, master } = audio;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.value = high ? 1760 : 1320;
  g.gain.setValueAtTime(0.025, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
  o.connect(g).connect(master);
  o.start();
  o.stop(ctx.currentTime + 0.05);
}

export function Receiver({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const tuneRef = useRef(0.42);
  const audioRef = useRef<Audio | null>(null);
  const revealRef = useRef<number[]>(STATIONS.map(() => 0));
  const [tune, setTune] = useState(0.42);
  const [sound, setSound] = useState(false);
  const [found, setFound] = useState<boolean[]>(STATIONS.map(() => false));
  const [reveal, setReveal] = useState<number[]>(STATIONS.map(() => 0));
  const [scramble, setScramble] = useState(0);
  const [clipsReady, setClipsReady] = useState(0);

  const { index, lock } = lockFor(tune);

  const setTuneClamped = useCallback((v: number) => {
    const t = Math.min(1, Math.max(0, v));
    tuneRef.current = t;
    setTune(t);
  }, []);

  // Waterfall: one new row of spectrum per frame, the rest scrolls down.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const row = ctx.createImageData(W, 1);
    let raf = 0;
    let frame = 0;

    const drawRow = (time: number) => {
      const t = tuneRef.current;
      const { lock: l } = lockFor(t);
      for (let x = 0; x < W; x++) {
        const f = x / W;
        let v = Math.random() * (0.42 - 0.22 * l);
        for (const s of STATIONS) {
          const d = (f - s.f) * W;
          const pulse = 0.55 + 0.45 * Math.sin(time / 260 + s.f * 40);
          v += Math.exp(-(d * d) / 2.2) * 0.75 * pulse;
          v +=
            Math.exp(-((d - 3) * (d - 3)) / 1.2) *
            0.22 *
            (Math.random() > 0.5 ? 1 : 0);
        }
        // The dial itself glows faintly so you can see where you are listening.
        const dt = (f - t) * W;
        v += Math.exp(-(dt * dt) / 6) * (0.18 + 0.5 * l);
        const [r, g, b] = palette(v);
        const k = x * 4;
        row.data[k] = r;
        row.data[k + 1] = g;
        row.data[k + 2] = b;
        row.data[k + 3] = 255;
      }
      ctx.drawImage(canvas, 0, 0, W, H - 1, 0, 1, W, H - 1);
      ctx.putImageData(row, 0, 0);
    };

    for (let i = 0; i < H; i++) drawRow(i * 16);

    const loop = (time: number) => {
      frame++;
      if (!reduced || frame % 10 === 0) drawRow(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Decode the locked transmission a character at a time.
  useEffect(() => {
    if (index < 0 || lock < 0.7) return;
    const id = window.setInterval(() => {
      const total = STATIONS[index].line.length;
      const cur = revealRef.current[index];
      if (cur >= total) {
        setFound((prev) =>
          prev[index] ? prev : prev.map((v, i) => i === index || v),
        );
        window.clearInterval(id);
        return;
      }
      revealRef.current = revealRef.current.map((v, i) =>
        i === index ? v + 1 : v,
      );
      setReveal(revealRef.current);
      blip(audioRef.current, cur % 3 === 0);
    }, 45);
    return () => window.clearInterval(id);
  }, [index, lock]);

  // Shimmer the unrevealed characters.
  useEffect(() => {
    const id = window.setInterval(() => setScramble((s) => s + 1), 90);
    return () => window.clearInterval(id);
  }, []);

  // Audio follows the dial.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const now = a.ctx.currentTime;
    a.noise.gain.setTargetAtTime(0.24 * (1 - 0.85 * lock), now, 0.05);
    const hasVoice = index >= 0 && a.clips[index] !== null;
    a.carrier.gain.setTargetAtTime(
      (hasVoice ? 0.02 : 0.07) * lock * lock,
      now,
      0.05,
    );
    a.band.frequency.setTargetAtTime(400 + tune * 3200, now, 0.05);
    // Her voice fades up out of the static as the dial closes in.
    a.voice.gain.setTargetAtTime(hasVoice ? 1.1 * lock * lock : 0, now, 0.08);
  }, [tune, lock, sound, index, clipsReady]);

  // Start a station's recording once the dial is close, stop it when you tune away.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const want = sound && index >= 0 && lock >= 0.5 ? index : -1;
    if (a.playing && a.playing.index !== want) stopVoice(a);
    const clip = want >= 0 ? a.clips[want] : null;
    if (clip && !a.playing) {
      const src = a.ctx.createBufferSource();
      src.buffer = clip;
      src.loop = true;
      const gain = a.ctx.createGain();
      src.connect(gain).connect(a.voice);
      src.start();
      a.playing = { index: want, src, gain };
    }
  }, [index, lock, sound, clipsReady]);

  useEffect(() => () => void audioRef.current?.ctx.close(), []);

  const toggleSound = () => {
    if (!audioRef.current) {
      const a = startAudio();
      audioRef.current = a;
      STATIONS.forEach((s, i) => {
        if (!s.clip) return;
        loadClip(a.ctx, s.clip)
          .then((buf) => {
            a.clips[i] = buf;
            setClipsReady((n) => n + 1);
          })
          .catch(() => {
            // Without the recording the station still decodes as text.
          });
      });
      setSound(true);
      return;
    }
    const a = audioRef.current;
    if (sound) {
      a.master.gain.setTargetAtTime(0, a.ctx.currentTime, 0.1);
      setSound(false);
    } else {
      void a.ctx.resume();
      a.master.gain.setTargetAtTime(0.9, a.ctx.currentTime, 0.1);
      setSound(true);
    }
  };

  const fromPointer = (clientX: number) => {
    const el = dialRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTuneClamped((clientX - r.left) / r.width);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.02 : 0.004;
    if (e.key === "ArrowRight" || e.key === "ArrowUp")
      setTuneClamped(tuneRef.current + step);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown")
      setTuneClamped(tuneRef.current - step);
    else return;
    e.preventDefault();
  };

  const count = found.filter(Boolean).length;
  const mhz = (BAND_LOW + tune * (BAND_HIGH - BAND_LOW)).toFixed(3);
  const station = index >= 0 && lock > 0.25 ? STATIONS[index] : null;
  const shown = station ? reveal[index] : 0;

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-night text-paper shadow-[0_30px_80px_-30px_rgba(35,71,214,0.6)] ring-4 ring-ink">
      <div
        className={`relative ${compact ? "aspect-[4/5] sm:aspect-[16/7]" : "aspect-[4/5] sm:aspect-[16/8]"}`}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(15,16,32,0.85))]" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 font-mono text-[11px] tracking-[0.18em] uppercase sm:p-6">
          <span>
            <span className="blink mr-2 inline-block size-2 rounded-full bg-tomato align-middle" />
            Atacama dish<span className="hidden sm:inline"> · rx live</span>
          </span>
          <span className="text-right">
            {count}/{STATIONS.length}
            <span className="hidden sm:inline"> transmissions</span> found
          </span>
        </div>

        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-5 text-center [text-shadow:0_2px_18px_rgba(15,16,32,0.95)] sm:px-16">
          {station ? (
            <p
              className="mx-auto max-w-3xl font-display text-2xl leading-snug sm:text-4xl"
              style={{ opacity: 0.35 + lock * 0.65 }}
              aria-live="polite"
            >
              <span
                className={`mb-3 block font-mono text-xs tracking-[0.3em] ${station.who === "ARC" ? "text-pink" : "text-sun"}`}
              >
                {station.who}
              </span>
              {station.line.split("").map((ch, i) =>
                i < shown || ch === " " ? (
                  <span key={i}>{ch}</span>
                ) : (
                  <span key={i} className="text-pink/70">
                    {GLYPHS[(i * 7 + scramble) % GLYPHS.length]}
                  </span>
                ),
              )}
            </p>
          ) : count === STATIONS.length ? (
            <p className="mx-auto max-w-2xl font-display text-2xl leading-snug sm:text-4xl">
              You found all five.{" "}
              <Link
                href="/work/last-signal"
                className="pointer-events-auto text-sun underline"
              >
                Last Signal
              </Link>{" "}
              premieres October 16. She&apos;ll be waiting.
            </p>
          ) : (
            <p className="mx-auto max-w-xl font-display text-2xl leading-snug text-paper/85 italic sm:text-3xl">
              Somewhere in this static, someone is calling for help.
              <span className="mt-4 block font-mono text-xs tracking-[0.2em] text-sun not-italic uppercase">
                Drag the dial to tune in
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t-4 border-ink bg-[#191a33] p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <button
          type="button"
          onClick={toggleSound}
          className="shrink-0 rounded-full bg-sun px-5 py-2.5 font-mono text-xs font-medium tracking-[0.15em] text-ink uppercase transition-transform hover:-rotate-2 active:scale-95"
        >
          {sound ? "Sound off" : "Sound on ♪"}
        </button>
        <div
          ref={dialRef}
          role="slider"
          tabIndex={0}
          aria-label="Tuning dial"
          aria-valuemin={BAND_LOW}
          aria-valuemax={BAND_HIGH}
          aria-valuenow={Number(mhz)}
          aria-valuetext={`${mhz} megahertz`}
          onKeyDown={onKey}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            fromPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons) fromPointer(e.clientX);
          }}
          className="relative h-12 flex-1 cursor-ew-resize touch-none rounded-xl bg-night outline-none focus-visible:ring-2 focus-visible:ring-sun"
        >
          {Array.from({ length: 41 }, (_, i) => (
            <span
              key={i}
              className="absolute bottom-0 w-px bg-paper/40"
              style={{
                left: `${(i / 40) * 100}%`,
                height: i % 5 === 0 ? "45%" : "22%",
              }}
            />
          ))}
          {STATIONS.map((s, i) => (
            <span
              key={s.f}
              className={`absolute top-1.5 size-1.5 -translate-x-1/2 rounded-full ${found[i] ? "bg-sun" : "bg-transparent"}`}
              style={{ left: `${s.f * 100}%` }}
            />
          ))}
          <span
            className="absolute inset-y-0 w-1 -translate-x-1/2 rounded-full bg-tomato shadow-[0_0_12px_var(--tomato)]"
            style={{ left: `${tune * 100}%` }}
          />
        </div>
        <span className="w-32 shrink-0 text-right font-mono text-sm tabular-nums text-sun">
          {mhz} MHz
        </span>
      </div>
    </div>
  );
}
