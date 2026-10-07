/**
 * Hears the viewer. Uses the browser's own speech recognition where there is
 * one (Chrome, Edge, Safari), and a mic meter so you can see she hears you.
 * Where there is none, the player shows a text box instead.
 */

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type RecognitionCtor = new () => Recognition;

export function speechSupported() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

export type Heard = { text: string; final: boolean };

export type ListenOptions = {
  /** Seconds of nothing before giving up. */
  patience: number;
  /** Seconds of quiet after speech that end the turn. */
  settle?: number;
  onHeard: (h: Heard) => void;
  onLevel?: (level: number) => void;
  /** Speech recognition refused or failed: the text box is all there is. */
  onDeaf?: () => void;
  signal: AbortSignal;
  /** Resolves with typed text, for viewers without a mic. */
  typed: Promise<string>;
};

/** Resolves with what they said, or null if they said nothing. */
export async function listen(o: ListenOptions): Promise<string | null> {
  const settle = (o.settle ?? 1.6) * 1000;
  const w = window as unknown as Record<string, RecognitionCtor | undefined>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;

  let meter: { stop(): void } | null = null;
  if (o.onLevel && typeof navigator.mediaDevices?.getUserMedia === "function")
    meter = await startMeter(o.onLevel).catch(() => null);

  return new Promise((resolve) => {
    let text = "";
    let finished = false;
    let quiet: ReturnType<typeof setTimeout> | undefined;
    let rec: Recognition | null = null;

    const finish = (value: string | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(quiet);
      clearTimeout(giveUp);
      try {
        rec?.abort();
      } catch {}
      meter?.stop();
      resolve(value && value.trim() ? value.trim() : null);
    };

    const giveUp = setTimeout(() => finish(text || null), o.patience * 1000);
    o.signal.addEventListener("abort", () => finish(null));
    o.typed.then((t) => finish(t));

    if (!Ctor) return;
    rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      let done = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) done += r[0].transcript;
        else interim += r[0].transcript;
      }
      text = `${done} ${interim}`.replace(/\s+/g, " ").trim();
      o.onHeard({ text, final: !interim });
      clearTimeout(quiet);
      // Once they've started, a pause ends the turn, and she gets more patient.
      clearTimeout(giveUp);
      quiet = setTimeout(() => finish(text), settle);
    };
    let deaf = false;
    rec.onerror = (e) => {
      // "no-speech" and "aborted" are part of normal listening; anything
      // else (no permission, no mic, no recognition service) won't recover.
      if (e.error === "no-speech" || e.error === "aborted") return;
      deaf = true;
      o.onDeaf?.();
    };
    // Some browsers stop on their own after a pause; keep listening.
    rec.onend = () => {
      if (!finished && !deaf)
        try {
          rec?.start();
        } catch {}
    };
    try {
      rec.start();
    } catch {}
  });
}

async function startMeter(onLevel: (l: number) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const an = ctx.createAnalyser();
  an.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(an);
  const buf = new Uint8Array(an.fftSize);
  let raf = 0;
  const tick = () => {
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += ((v - 128) / 128) ** 2;
    onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
    raf = requestAnimationFrame(tick);
  };
  tick();
  return {
    stop() {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      onLevel(0);
    },
  };
}
