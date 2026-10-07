"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  allLines,
  HOLDS,
  REELS,
  SFX,
  shot,
  type Cam,
  type HoldId,
  type Line,
  type Outcome,
  type Shot,
} from "@/content/last-signal-film";
import { read, TRUSTED } from "@/lib/last-signal-intent";
import { InsertScreen } from "./inserts";
import { listen, speechSupported } from "./listen";
import { FilmSound, type Mood } from "./sound";

type Ending = "home" | "signal" | "static";

const ENDINGS: Record<
  Ending,
  { title: string; tagline: string; color: string }
> = {
  home: {
    title: "Homecoming",
    tagline: "She trusted you, and you picked the crew.",
    color: "bg-sun",
  },
  signal: {
    title: "The Signal",
    tagline: "She trusted you, and you picked what they found.",
    color: "bg-teal text-paper",
  },
  static: {
    title: "Static",
    tagline: "She never quite trusted the voice on the radio.",
    color: "bg-plum text-paper",
  },
};

/** Where the score changes, by the shot it changes on. */
const MOODS: Record<string, Mood> = {
  "01": "ambient",
  "08": "tension",
  "11A": "ambient",
  "11B": "ambient",
  "15": "tension",
  "23A": "ambient",
  "24": "ambient",
  "26": "tension",
  H2: "resolve",
  S2: "resolve",
  T2: "silence",
};

const CAM_NAMES: Partial<Record<Cam, string>> = {
  "SEC-01": "SEC-01 · HAB",
  "SEC-02": "SEC-02 · CRYOBAY",
  "SEC-03": "SEC-03 · GREENHOUSE",
};

const WHO_COLOR = { INES: "text-sun", ARC: "text-pink", TEO: "text-[#7dffa8]" };

const QUESTIONS: Record<HoldId, string> = {
  hello: "Answer her",
  greenhouse: "Seal the greenhouse, or go outside?",
  arc: "Hear ARC out, or pull the plug?",
  final: "The burn home, or the data?",
};

const ENDINGS_KEY = "last-signal:endings";

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((done) => {
    const t = setTimeout(done, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      done();
    });
  });

type Listening = {
  hold: HoldId;
  heard: string;
  level: number;
  started: number;
  patience: number;
};

export function FilmPlayer() {
  const frameRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<FilmSound | null>(null);
  const runRef = useRef<AbortController | null>(null);
  const skipRef = useRef<AbortController | null>(null);
  const typedRef = useRef<((t: string) => void) | null>(null);

  const [phase, setPhase] = useState<"title" | "film" | "end">("title");
  const [stack, setStack] = useState<string[]>([]);
  const [sub, setSub] = useState<Line | null>(null);
  const [captions, setCaptions] = useState(true);
  const [listening, setListening] = useState<Listening | null>(null);
  const [typed, setTyped] = useState("");
  const [ending, setEnding] = useState<Ending | null>(null);
  const [said, setSaid] = useState<Partial<Record<HoldId, string>>>({});
  const [found, setFound] = useState<Ending[]>([]);
  const [canSpeak, setCanSpeak] = useState(true);

  useEffect(() => {
    // Read after mount: browser-only facts the server can't know.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanSpeak(speechSupported());
    try {
      setFound(JSON.parse(localStorage.getItem(ENDINGS_KEY) ?? "[]"));
    } catch {}
    return () => {
      runRef.current?.abort();
      soundRef.current?.close();
    };
  }, []);

  const current = stack.at(-1);

  const run = useCallback(async () => {
    runRef.current?.abort();
    const ctl = new AbortController();
    runRef.current = ctl;
    const signal = ctl.signal;
    soundRef.current?.close();
    const sound = new FilmSound();
    soundRef.current = sound;
    await sound.resume();
    void sound.preload(allLines(), Object.keys(SFX));

    let trust = 0;
    const words: Partial<Record<HoldId, string>> = {};
    setSaid({});
    setEnding(null);
    setStack([]);
    setPhase("film");

    /** A signal that ends with the film, or when the viewer skips ahead. */
    const skippable = () => {
      const skip = new AbortController();
      skipRef.current = skip;
      return AbortSignal.any([signal, skip.signal]);
    };

    const speakLine = async (line: Line) => {
      setSub(line);
      await sound.say(line, false, skippable());
      setSub(null);
      await sleep(250, signal);
    };

    const play = async (id: string) => {
      if (signal.aborted) return;
      const s = shot(id);
      const both = skippable();
      setStack((st) => [...st.slice(-1), id]);
      prefetchAfter(id);
      if (MOODS[id]) sound.mood(MOODS[id]);
      void sound.sfx(s.sfx);
      const start = performance.now();
      if (s.line) {
        await sleep(500, both);
        setSub(s.line);
        await sound.say(s.line, id === "H4", both);
        setSub(null);
      }
      const left = s.seconds * 1000 - (performance.now() - start);
      if (left > 0) await sleep(left, both);
    };

    const reel = async (ids: readonly string[]) => {
      for (const id of ids) await play(id);
    };

    const ask = (hold: HoldId, patience: number) => {
      setTyped("");
      setListening({
        hold,
        heard: "",
        level: 0,
        started: Date.now(),
        patience,
      });
      const typedText = new Promise<string>((resolve) => {
        typedRef.current = resolve;
      });
      return listen({
        patience,
        signal,
        typed: typedText,
        onHeard: (h) => setListening((l) => (l ? { ...l, heard: h.text } : l)),
        onLevel: (level) => setListening((l) => (l ? { ...l, level } : l)),
        onDeaf: () => setCanSpeak(false),
      }).finally(() => {
        typedRef.current = null;
        setListening(null);
      });
    };

    const hold = async (id: HoldId): Promise<Outcome> => {
      const h = HOLDS[id];
      sound.static(0.06);
      sound.key();
      let heard = await ask(id, h.patience);
      let reading = read(id, heard);
      if (!reading.outcome && heard && h.again && !signal.aborted) {
        sound.static(0.03);
        await speakLine(h.again);
        sound.static(0.06);
        heard = (await ask(id, h.patience)) ?? heard;
        reading = read(id, heard);
      }
      sound.static(0.015);
      trust += reading.trust;
      if (heard) {
        words[id] = heard;
        setSaid({ ...words });
      }
      const outcome = reading.outcome ?? h.silent;
      if (heard || id !== "hello")
        for (const line of h.replies[outcome] ?? []) await speakLine(line);
      return outcome;
    };

    await reel(REELS.open);
    await hold("hello");
    await reel(REELS.act1);
    const greenhouse = await hold("greenhouse");
    await reel(greenhouse === "outside" ? REELS.outside : REELS.seal);
    await reel(REELS.act2);
    const arc = await hold("arc");
    await reel(arc === "hear" ? REELS.hear : REELS.unplug);
    await reel(REELS.act3);
    const final = await hold("final");
    const end: Ending =
      final === "static" || trust < TRUSTED ? "static" : (final as Ending);
    await reel(REELS[end]);
    if (signal.aborted) return;
    sound.mood("silence", 6);
    void sound.sfx(undefined);
    setEnding(end);
    setFound((f) => {
      const next = f.includes(end) ? f : [...f, end];
      try {
        localStorage.setItem(ENDINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setPhase("end");
  }, []);

  const sendTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (typed.trim()) typedRef.current?.(typed.trim());
  };

  const fullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "film" || listening) return;
      if (e.key === "ArrowRight") skipRef.current?.abort();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, listening]);

  const s = current ? shot(current) : null;

  return (
    <div
      ref={frameRef}
      className="film relative w-full overflow-hidden rounded-2xl bg-black text-paper shadow-[10px_10px_0_var(--tomato)] [&:fullscreen]:rounded-none"
    >
      {/* On phones the picture sits in a letterbox, and captions live in the bar under it. */}
      <div className="relative aspect-[4/3] w-full sm:aspect-[2.39/1]">
        {phase === "title" && (
          <TitleCard onStart={run} canSpeak={canSpeak} found={found} />
        )}

        {phase !== "title" && (
          <div className="absolute inset-x-0 top-[6%] aspect-[2.39/1] overflow-hidden sm:inset-0 sm:aspect-auto">
            {stack.map((id, i) => (
              <Frame
                key={`${id}-${i}`}
                shot={shot(id)}
                index={i}
                top={i === stack.length - 1}
              />
            ))}
            {phase === "film" && s && <CamOverlay shot={s} />}
          </div>
        )}

        {phase === "film" && captions && sub && (
          <p className="pointer-events-none absolute inset-x-0 bottom-[16%] z-30 mx-auto max-w-[80%] sm:bottom-[9%] text-center text-[clamp(12px,1.8vw,22px)] leading-snug text-balance [text-shadow:0_1px_3px_#000,0_0_12px_#000]">
            <span
              className={`mr-2 font-mono text-[0.75em] tracking-widest ${WHO_COLOR[sub.who]}`}
            >
              {sub.who}
            </span>
            {sub.text}
          </p>
        )}

        {phase === "film" && listening && (
          <ListenPanel
            l={listening}
            canSpeak={canSpeak}
            typed={typed}
            setTyped={setTyped}
            onSubmit={sendTyped}
          />
        )}

        {phase === "end" && ending && (
          <EndCard ending={ending} said={said} found={found} onAgain={run} />
        )}

        {phase === "film" && !listening && (
          <div className="absolute right-[2%] bottom-[3%] z-40 flex gap-2 font-mono text-[10px] tracking-widest opacity-60 transition-opacity hover:opacity-100">
            <button
              type="button"
              onClick={() => setCaptions((c) => !c)}
              className="rounded border border-paper/40 px-2 py-1 hover:bg-paper hover:text-ink"
              aria-pressed={captions}
            >
              CC
            </button>
            <button
              type="button"
              onClick={() => skipRef.current?.abort()}
              className="rounded border border-paper/40 px-2 py-1 hover:bg-paper hover:text-ink disabled:opacity-30"
              title="Skip this shot (→)"
            >
              SKIP ›
            </button>
            <button
              type="button"
              onClick={fullscreen}
              className="rounded border border-paper/40 px-2 py-1 hover:bg-paper hover:text-ink"
            >
              ⛶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function prefetchAfter(id: string) {
  const order = Object.values(REELS).flat() as string[];
  const i = order.indexOf(id);
  for (const next of order.slice(i + 1, i + 4)) {
    const s = shot(next);
    if (s.prompt) new window.Image().src = shotSrc(next);
  }
}

const shotSrc = (id: string) => `/last-signal/film/shots/${id}.webp`;

/** One shot: a still with a slow camera move, or a live ship screen. */
function Frame({
  shot: s,
  index,
  top,
}: {
  shot: Shot;
  index: number;
  top: boolean;
}) {
  const move = ["kb-in", "kb-left", "kb-out", "kb-right"][
    (s.id.charCodeAt(1) + index) % 4
  ];
  const grade =
    s.light === "red"
      ? "after:bg-[#ff2a10]/25 after:mix-blend-multiply"
      : s.light === "dawn"
        ? "after:bg-[#ffb35c]/12 after:mix-blend-soft-light"
        : "";
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${top ? "film-in z-10" : "z-0"} after:absolute after:inset-0 ${grade}`}
    >
      {s.insert ? (
        <InsertScreen kind={s.insert} seconds={s.seconds} />
      ) : (
        <Image
          src={shotSrc(s.id)}
          alt={s.action}
          fill
          sizes="(min-width: 72rem) 72rem, 100vw"
          className={`object-cover ${move} ${s.cam.startsWith("SEC") ? "saturate-[0.82]" : ""}`}
          style={{ animationDuration: `${s.seconds + 2}s` }}
          priority={s.id === "01"}
        />
      )}
      {s.cam === "HELM" && !s.insert && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_95%_at_center,transparent_55%,#000_100%)]" />
      )}
      {s.title && (
        <p className="title-in absolute bottom-[12%] left-[5%] z-20 font-display text-[clamp(14px,2.4vw,30px)] italic [text-shadow:0_2px_8px_#000]">
          {s.title}
        </p>
      )}
      <div className="grain absolute inset-0" />
    </div>
  );
}

function CamOverlay({ shot: s }: { shot: Shot }) {
  const [met, setMet] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMet((m) => m + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const clock = new Date((771_552 + met) * 1000).toISOString().slice(11, 19);
  if (s.cam.startsWith("SEC"))
    return (
      <div className="scanlines pointer-events-none absolute inset-0 z-20 p-[2%] font-mono text-[clamp(8px,1.1vw,13px)] tracking-widest text-white/80">
        <p>{CAM_NAMES[s.cam]}</p>
        <p className="mt-1 opacity-80">
          <span className="blink text-tomato">●</span> REC · MET 214:{clock}
        </p>
      </div>
    );
  if (s.cam === "HELM" && !s.insert)
    return (
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-[3%] font-mono text-[clamp(8px,1.1vw,13px)] tracking-widest text-[#7dffa8]/80">
        <span>HELM · VARGA</span>
        <span>
          O₂ {s.id.startsWith("1") ? "61" : "44"}% · SUIT 4.1 PSI · HR{" "}
          {s.light === "dawn" ? 88 : 112}
        </span>
      </div>
    );
  return null;
}

function TitleCard({
  onStart,
  canSpeak,
  found,
}: {
  onStart: () => void;
  canSpeak: boolean;
  found: Ending[];
}) {
  return (
    <div className="absolute inset-0">
      <Image
        src={shotSrc("02")}
        alt="The empty control hut at the Atacama dish: consoles, a mug, a chair facing the speaker"
        fill
        sizes="(min-width: 72rem) 72rem, 100vw"
        className="kb-in object-cover opacity-70"
        style={{ animationDuration: "40s" }}
        priority
      />
      <div className="grain absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-start justify-end gap-[3%] bg-gradient-to-t from-black/85 via-black/30 to-transparent p-[5%]">
        <p className="font-mono text-[clamp(9px,1.1vw,13px)] tracking-[0.3em] text-sun">
          WORK IN PROGRESS · FIRST CUT IN STILLS
        </p>
        <h3 className="font-display text-[clamp(32px,7vw,96px)] leading-none">
          Last Signal
        </h3>
        <p className="max-w-[46ch] text-[clamp(11px,1.5vw,18px)] leading-snug text-paper/85">
          You&apos;re on the night shift at a dead radio dish. Someone answers.
          Turn your sound on. When she asks you something,{" "}
          {canSpeak
            ? "answer out loud."
            : "type your answer (this browser can't hear you; Chrome and Safari can)."}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onStart}
            className="rounded-full bg-tomato px-[1.6em] py-[0.6em] font-display text-[clamp(14px,2vw,24px)] text-paper transition-transform hover:-rotate-2 hover:bg-sun hover:text-ink"
          >
            Answer the radio
          </button>
          <span className="font-mono text-[clamp(9px,1vw,12px)] tracking-widest text-paper/60">
            ABOUT 6 MIN · {canSpeak ? "USES YOUR MIC" : "KEYBOARD"}
            {found.length > 0 && ` · ENDINGS FOUND ${found.length}/3`}
          </span>
        </div>
      </div>
    </div>
  );
}

function ListenPanel({
  l,
  canSpeak,
  typed,
  setTyped,
  onSubmit,
}: {
  l: Listening;
  canSpeak: boolean;
  typed: string;
  setTyped: (t: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 to-transparent px-[4%] pt-[6%] pb-[3%]">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[clamp(8px,1vw,12px)] tracking-[0.3em] text-sun">
            <span className="blink">●</span> SHE&apos;S LISTENING ·{" "}
            {QUESTIONS[l.hold].toUpperCase()}
          </p>
          <p className="min-h-[1.4em] truncate font-display text-[clamp(14px,2.2vw,28px)] italic text-paper/95">
            {l.heard ? `“${l.heard}”` : canSpeak ? "Say it out loud…" : ""}
          </p>
        </div>
        {canSpeak && (
          <div
            className="flex h-[clamp(20px,3vw,36px)] items-end gap-[3px]"
            aria-hidden
          >
            {[0.2, 0.5, 0.8, 0.5, 0.2].map((w, i) => (
              <span
                key={i}
                className="w-[clamp(3px,0.5vw,6px)] rounded-full bg-sun transition-[height] duration-75"
                style={{
                  height: `${15 + Math.min(85, l.level * 100 * (0.5 + w))}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="mt-[1.5%] flex gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={
            canSpeak ? "…or type it" : "Type your answer and press Enter"
          }
          aria-label="Your answer to Ines"
          autoFocus={!canSpeak}
          className="w-full max-w-[min(28rem,70%)] rounded border border-paper/30 bg-black/50 px-3 py-1 font-mono text-[clamp(10px,1.2vw,14px)] text-paper placeholder:text-paper/40 focus:border-sun focus:outline-none"
        />
      </form>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-paper/10">
        <div
          key={l.started}
          className="patience h-full bg-sun/70"
          style={{ animationDuration: `${l.patience}s` }}
        />
      </div>
    </div>
  );
}

function EndCard({
  ending,
  said,
  found,
  onAgain,
}: {
  ending: Ending;
  said: Partial<Record<HoldId, string>>;
  found: Ending[];
  onAgain: () => void;
}) {
  const e = ENDINGS[ending];
  const quotes = (["greenhouse", "arc", "final"] as HoldId[]).filter(
    (h) => said[h],
  );
  return (
    <div className="absolute inset-0 z-40 flex items-center bg-black/75 p-[5%] backdrop-blur-[2px]">
      <div className="max-w-[60ch]">
        <p
          className={`mb-3 inline-block rounded-full px-3 py-1 font-mono text-[clamp(8px,1vw,12px)] tracking-[0.3em] ${e.color}`}
        >
          ENDING {Object.keys(ENDINGS).indexOf(ending) + 1} OF 3
        </p>
        <h3 className="font-display text-[clamp(28px,6vw,80px)] leading-none">
          {e.title}
        </h3>
        <p className="mt-2 text-[clamp(11px,1.5vw,18px)] text-paper/80">
          {e.tagline}
        </p>
        {quotes.length > 0 && (
          <ul className="mt-[3%] space-y-1 font-mono text-[clamp(9px,1.1vw,13px)] text-paper/70">
            {quotes.map((h) => (
              <li key={h}>
                <span className="text-sun">YOU · </span>“{said[h]}”
              </li>
            ))}
          </ul>
        )}
        <div className="mt-[4%] flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onAgain}
            className="rounded-full bg-tomato px-[1.4em] py-[0.5em] font-display text-[clamp(13px,1.8vw,22px)] text-paper hover:bg-sun hover:text-ink"
          >
            Take the call again
          </button>
          <span className="font-mono text-[clamp(9px,1vw,12px)] tracking-widest text-paper/60">
            ENDINGS FOUND {found.length}/3
          </span>
        </div>
      </div>
    </div>
  );
}
