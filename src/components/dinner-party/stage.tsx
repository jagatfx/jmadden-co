"use client";

import { useEffect, useRef, useState } from "react";
import { listen, speechSupported } from "@/components/film/listen";
import { readDrink, type Stance } from "./read";
import type { Stage, Who } from "./engine";

const BASE = "/dinner-party";

type Phase = "idle" | "loading" | "ready" | "playing" | "hold";

/** What each stance sets off: who reacts how, then who answers. */
async function answer(stage: Stage, stance: Stance) {
  switch (stance) {
    case "strong":
      stage.react("trip", { mood: "happy", face: "😄" });
      stage.react("grace", { face: "🙄" });
      stage.cut("trip");
      await stage.say("t-strong", { gesture: "thumbup" });
      stage.glance("grace", "trip");
      await stage.say("g-strong", { shot: "grace" });
      stage.glance("grace", "guest");
      return;
    case "water":
      stage.react("grace", { mood: "happy", face: "🙂" });
      stage.react("trip", { face: "😐" });
      await stage.say("g-water", { shot: "grace" });
      await stage.say("t-water", { shot: "trip", gesture: "shrug" });
      stage.react("trip", { mood: "neutral" });
      return;
    case "insult":
      stage.react("grace", { mood: "angry", face: "😠" });
      stage.react("trip", { mood: "angry", face: "😳" });
      stage.cut("two");
      await new Promise((r) => setTimeout(r, 900));
      await stage.say("g-insult", { shot: "grace" });
      await stage.say("t-insult", { shot: "trip" });
      return;
    case "flirt":
      stage.react("trip", { face: "😳" });
      stage.react("grace", { face: "😏" });
      stage.cut("trip");
      await stage.say("t-flirt", { gesture: "handup" });
      stage.glance("grace", "trip");
      await stage.say("g-flirt", { shot: "grace" });
      stage.glance("grace", "guest");
      return;
    default:
      stage.react("trip", { mood: "happy" });
      await stage.say("t-default", { shot: "trip", gesture: "index" });
  }
}

export function DinnerPartyStage() {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const typed = useRef<((t: string) => void) | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [sub, setSub] = useState<{ who: Who | null; text: string }>({
    who: null,
    text: "",
  });
  const [heard, setHeard] = useState("");
  const [draft, setDraft] = useState("");
  const [reading, setReading] = useState<Stance | null>(null);

  useEffect(() => {
    const onResize = () => stage.current?.resize();
    addEventListener("resize", onResize);
    return () => {
      removeEventListener("resize", onResize);
      stage.current?.dispose();
    };
  }, []);

  async function begin() {
    setPhase("loading");
    const { Stage } = await import("./engine");
    const s = new Stage(host.current!, BASE, {
      onSubtitle: (who, text) => setSub({ who, text }),
      onProgress: setProgress,
    });
    stage.current = s;
    await s.load();
    await s.unlock();
    setPhase("playing");
    s.cut("pov");
    await new Promise((r) => setTimeout(r, 1500));
    await s.say("t-hello", { mood: "happy", gesture: "handup" });
    s.glance("grace", "guest");
    await s.say("g-hello", { shot: "grace" });
    s.glance("trip", "grace");
    await s.say("t-drink", { shot: "trip" });
    s.glance("trip", "guest");
    await hold(s);
  }

  async function hold(s: Stage) {
    s.cut("pov");
    setPhase("hold");
    setHeard("");
    const said = await listen({
      patience: 600,
      onHeard: (h) => setHeard(h.text),
      signal: new AbortController().signal,
      typed: new Promise<string>((r) => (typed.current = r)),
    });
    const stance = readDrink(said);
    setReading(stance);
    setPhase("playing");
    await answer(s, stance);
    await hold(s);
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="relative aspect-[2.39/1] w-full overflow-hidden bg-black">
        <div ref={host} className="absolute inset-0" />
        {phase === "idle" || phase === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black text-center text-white">
            <p className="font-mono text-xs tracking-[0.3em] uppercase opacity-60">
              Look test
            </p>
            <h2 className="font-display text-5xl sm:text-7xl">Dinner Party</h2>
            {phase === "idle" ? (
              <button
                onClick={begin}
                className="border border-white/60 px-6 py-3 font-mono text-sm tracking-widest uppercase hover:bg-white hover:text-black"
              >
                Knock
              </button>
            ) : (
              <p className="font-mono text-sm opacity-70">
                Setting the table… {Math.round(progress * 100)}%
              </p>
            )}
          </div>
        ) : null}
        {sub.text ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-[6%] px-8 text-center text-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-2xl">
            <span className="font-mono text-xs tracking-widest uppercase opacity-70">
              {sub.who}
            </span>
            <br />
            {sub.text}
          </p>
        ) : null}
      </div>
      {phase === "hold" ? (
        <form
          className="mt-4 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) typed.current?.(draft.trim());
            setDraft("");
          }}
        >
          <input
            autoFocus
            value={draft || heard}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              speechSupported()
                ? "Say it out loud, or type…"
                : "Type what you say…"
            }
            className="flex-1 border border-current/30 bg-transparent px-4 py-3"
          />
          <button className="border border-current px-5 font-mono text-sm uppercase">
            Say
          </button>
        </form>
      ) : null}
      {reading ? (
        <p className="mt-3 font-mono text-xs opacity-60">
          They heard: {reading}
        </p>
      ) : null}
    </div>
  );
}
