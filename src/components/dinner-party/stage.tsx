"use client";

import { useEffect, useRef, useState } from "react";
import { listen, speechSupported } from "@/components/film/listen";
import { cleanName } from "@/content/dinner-party-script";
import type { Action, Focus, Stage } from "./engine";
import {
  ENDINGS,
  type Drama,
  type Ending,
  type State,
  type Who,
} from "./drama";

const BASE = "/dinner-party";

type Phase = "name" | "loading" | "door" | "play" | "end";

const NOTES = {
  phone: {
    from: "Dan Reyes",
    text: "Margin call on the options account came in. We need to talk tonight, Trip. Please call me back.",
  },
  letter: {
    from: "Casa Azul Residency, Lisbon",
    text: "Dear Grace, we are delighted to confirm your place for the coming year. Your studio will be ready on the 1st. We look forward to welcoming you.",
  },
};

export function DinnerPartyStage() {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const drama = useRef<Drama | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const mic = useRef<AbortController | null>(null);
  const subRef = useRef("");
  const [phase, setPhase] = useState<Phase>("name");
  const [name, setName] = useState("");
  const [progress, setProgress] = useState(0);
  const [sub, setSub] = useState<{
    who: Who | null;
    text: string;
    door?: boolean;
  }>({ who: null, text: "" });
  const [draft, setDraft] = useState("");
  const [heard, setHeard] = useState("");
  const [focus, setFocus] = useState<Focus>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [note, setNote] = useState<"phone" | "letter" | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [listening, setListening] = useState(false);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const onResize = () => stage.current?.resize();
    addEventListener("resize", onResize);
    return () => {
      removeEventListener("resize", onResize);
      mic.current?.abort();
      stage.current?.dispose();
    };
  }, []);

  // Keys: Enter to talk, the action letters to use things.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const typing = document.activeElement === field.current;
      if (e.key === "Enter" && !typing && phase === "play") {
        field.current?.focus();
        e.preventDefault();
        return;
      }
      if (e.key === "Escape" && typing) field.current?.blur();
      if (typing) return;
      if (phase === "door" && e.key.toLowerCase() === "k")
        drama.current?.push({ kind: "knock" });
      const a = focus?.actions.find((x) => x.key === e.key.toLowerCase());
      if (a) perform(a);
    };
    addEventListener("keydown", down);
    return () => removeEventListener("keydown", down);
  });

  function perform(a: Action) {
    stage.current?.act(a);
  }

  async function begin() {
    setPhase("loading");
    setDebug(new URLSearchParams(location.search).has("debug"));
    const guestName = cleanName(name);
    const { Stage } = await import("./engine");
    const { Drama } = await import("./drama");
    const s = new Stage(host.current!, BASE, guestName, {
      onSubtitle: (who, text, door) => {
        subRef.current = text;
        setSub({ who, text, door });
      },
      onProgress: setProgress,
      onFocus: setFocus,
      onReveal: setNote,
      onMove: (m) => {
        if (m.kind === "drop" || m.kind === "give") setNote(null);
        drama.current?.push(m);
      },
    });
    stage.current = s;
    await s.load();
    await s.unlock();
    const d = new Drama(s, {
      onState: setState,
      onHold: setAsking,
      onHeard: (_t, r) =>
        setHeard(
          `${r.act}${r.target !== "none" ? ` → ${r.target}` : ""}${r.topics.length ? ` (${r.topics.join(", ")})` : ""}`,
        ),
      onEnd: (e) => {
        setEnding(e);
        s.fadeTo(1, 2500);
        setTimeout(() => setPhase("end"), 2500);
      },
    });
    drama.current = d;
    setPhase("door");
    const enter = setInterval(() => {
      if (d.s.beat !== "door") {
        clearInterval(enter);
        s.enter();
        setPhase((p) => (p === "door" ? "play" : p));
      }
    }, 100);
    void d.run();
  }

  function say(text: string) {
    const t = text.trim();
    if (!t || !drama.current) return;
    drama.current.push({ kind: "said", text: t });
    setDraft("");
    field.current?.blur();
  }

  /** Keeps the microphone open, ignoring the couple's own voices. */
  async function toggleMic() {
    if (mic.current) {
      mic.current.abort();
      mic.current = null;
      setListening(false);
      return;
    }
    const ac = new AbortController();
    mic.current = ac;
    setListening(true);
    while (!ac.signal.aborted) {
      const said = await listen({
        patience: 30,
        settle: 1.1,
        onHeard: (h) => setDraft(h.text),
        onDeaf: () => ac.abort(),
        signal: ac.signal,
        typed: new Promise(() => {}),
      });
      if (said && !echo(said, subRef.current)) say(said);
      else setDraft("");
    }
    setListening(false);
  }

  const playing = phase === "play";

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black select-none sm:aspect-[16/9]">
        <div ref={host} className="absolute inset-0" />

        {phase === "name" || phase === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
            <p className="font-mono text-xs tracking-[0.3em] uppercase opacity-60">
              An evening with Trip and Grace
            </p>
            <h2 className="font-display text-5xl sm:text-7xl">Dinner Party</h2>
            {phase === "name" ? (
              <form
                className="flex w-full max-w-sm flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void begin();
                }}
              >
                <label
                  className="font-mono text-xs tracking-widest uppercase opacity-70"
                  htmlFor="dp-name"
                >
                  Your first name
                </label>
                <input
                  id="dp-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="So they can greet you"
                  className="border border-white/40 bg-transparent px-4 py-3 text-center text-lg"
                />
                <button className="border border-white/60 px-6 py-3 font-mono text-sm tracking-widest uppercase hover:bg-white hover:text-black">
                  Go to their door
                </button>
                <p className="text-xs opacity-50">
                  Headphones help. Talk by typing or out loud. Walk with WASD or
                  by clicking the floor, drag to look around, E to use things.
                </p>
              </form>
            ) : (
              <p className="font-mono text-sm opacity-70">
                Finding their building… {Math.round(progress * 100)}%
              </p>
            )}
          </div>
        ) : null}

        {phase === "door" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-white">
            <p className="font-mono text-xs tracking-[0.3em] uppercase opacity-50">
              Outside 4B
            </p>
            {asking === "knock" ? (
              <button
                onClick={() => drama.current?.push({ kind: "knock" })}
                className="border border-white/60 px-6 py-3 font-mono text-sm tracking-widest uppercase hover:bg-white hover:text-black"
              >
                Knock <span className="opacity-50">(K)</span>
              </button>
            ) : null}
            {asking === "knock" ? (
              <button
                onClick={() => drama.current?.push({ kind: "leave" })}
                className="text-xs underline opacity-50"
              >
                Go home
              </button>
            ) : null}
          </div>
        ) : null}

        {playing ? (
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 mix-blend-difference" />
        ) : null}

        {playing && focus ? (
          <div className="absolute inset-x-0 top-[56%] flex flex-col items-center gap-2 text-white">
            {focus.label ? (
              <p className="font-mono text-[11px] tracking-widest uppercase opacity-70 drop-shadow">
                {focus.label}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
              {focus.actions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => perform(a)}
                  className="border border-white/50 bg-black/40 px-3 py-1.5 font-mono text-xs backdrop-blur-sm hover:bg-white hover:text-black"
                >
                  <span className="opacity-60">{a.key.toUpperCase()}</span>{" "}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {note ? (
          <div className="absolute top-6 right-6 max-w-xs bg-[#f4f1ea] p-4 text-sm text-neutral-900 shadow-2xl">
            <p className="font-mono text-[10px] tracking-widest uppercase opacity-60">
              {NOTES[note].from}
            </p>
            <p className="mt-2 leading-snug">{NOTES[note].text}</p>
          </div>
        ) : null}

        {sub.text ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-[7%] px-8 text-center text-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-2xl">
            <span className="font-mono text-xs tracking-widest uppercase opacity-70">
              {sub.who}
              {sub.door ? " · through the door" : ""}
            </span>
            <br />
            <span className={sub.door ? "italic opacity-80" : ""}>
              {sub.text}
            </span>
          </p>
        ) : null}

        {phase === "end" && ending ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black px-6 text-center text-white">
            <p className="font-mono text-xs tracking-[0.3em] uppercase opacity-60">
              Ending
            </p>
            <h2 className="font-display text-5xl sm:text-7xl">
              {ENDINGS[ending].title}
            </h2>
            <p className="max-w-md opacity-80">{ENDINGS[ending].line}</p>
            {state ? (
              <p className="font-mono text-xs opacity-50">
                {state.beats.length} scenes · Trip {fmt(state.trust.trip)} ·
                Grace {fmt(state.trust.grace)} · tension{" "}
                {Math.round(state.tension)}/10
              </p>
            ) : null}
            <button
              onClick={() => location.reload()}
              className="border border-white/60 px-6 py-3 font-mono text-sm tracking-widest uppercase hover:bg-white hover:text-black"
            >
              Go back another night
            </button>
          </div>
        ) : null}
      </div>

      {playing ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            say(draft);
          }}
        >
          <input
            ref={field}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              asking
                ? `${asking}  (Enter to talk)`
                : "Say something… (Enter to talk)"
            }
            className="min-w-0 flex-1 border border-current/30 bg-transparent px-4 py-3"
          />
          {speechSupported() ? (
            <button
              type="button"
              onClick={() => void toggleMic()}
              className={`border px-4 font-mono text-xs uppercase ${listening ? "border-red-500 text-red-500" : "border-current/50"}`}
            >
              {listening ? "Mic on" : "Mic"}
            </button>
          ) : null}
          <button className="border border-current px-5 font-mono text-sm uppercase">
            Say
          </button>
        </form>
      ) : null}
      {playing ? (
        <p className="mt-2 font-mono text-[11px] opacity-50">
          WASD or click the floor to walk · drag to look · E to use · Enter to
          talk
        </p>
      ) : null}
      {debug && state ? (
        <p className="mt-2 font-mono text-[11px] opacity-60">
          beat {state.beat} · trip {fmt(state.trust.trip)} · grace{" "}
          {fmt(state.trust.grace)} · tension {state.tension.toFixed(1)} ·
          strikes {state.strikes} · flirts {state.flirts} · heard: {heard}
        </p>
      ) : null}
    </div>
  );
}

const fmt = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

/** True when the mic mostly picked up what one of them just said. */
function echo(said: string, line: string) {
  if (!line) return false;
  const w = (s: string) => new Set(s.toLowerCase().match(/[a-z']+/g) ?? []);
  const a = w(said);
  const b = w(line);
  if (!a.size) return true;
  let hit = 0;
  for (const x of a) if (b.has(x)) hit++;
  return hit / a.size > 0.6;
}
