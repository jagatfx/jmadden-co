"use client";

import { useEffect, useState } from "react";
import type { Insert } from "@/content/last-signal-film";

/**
 * Ship screens, drawn live rather than generated: they have to be legible,
 * they have to move, and the numbers have to be the story's numbers.
 */
export function InsertScreen({
  kind,
  seconds,
}: {
  kind: Insert;
  seconds: number;
}) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      setT(Math.min(1, (performance.now() - start) / (seconds * 1000)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [kind, seconds]);

  return (
    <div className="absolute inset-0 grid place-items-center bg-[#07090a] p-[4%]">
      <div className="crt relative h-full w-full overflow-hidden rounded-[2.5%/6%] border border-white/10 bg-[radial-gradient(ellipse_at_center,#0e1a12_0%,#050806_80%)] px-[5%] py-[4%] font-mono text-[clamp(9px,1.7vw,18px)] leading-relaxed">
        {kind === "radio" && <Radio t={t} />}
        {kind === "dead" && <Radio t={t} dying />}
        {kind === "course" && <Course t={t} />}
        {kind === "power" && <Power t={t} />}
        {kind === "transmit" && <Transmit t={t} />}
      </div>
    </div>
  );
}

function Bars({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex h-[38%] items-end gap-[3%]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[9%] border border-current"
          style={{
            height: `${30 + i * 17}%`,
            background: i < level ? color : "transparent",
            color,
            boxShadow: i < level ? `0 0 18px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function Radio({ t, dying = false }: { t: number; dying?: boolean }) {
  // Flickers between nothing and one bar, then holds one; or dies to zero.
  const flicker = Math.sin(t * 61) > 0.2 ? 1 : 0;
  const level = dying ? (t < 0.45 ? flicker : 0) : t < 0.55 ? flicker : 1;
  const amber = "#ffcf6b";
  return (
    <div className="flex h-full flex-col justify-between text-[#ffcf6b]">
      <div className="flex justify-between opacity-80">
        <span>RELAY · LOW BAND</span>
        <span>401.700 MHz</span>
      </div>
      <Bars level={level} color={amber} />
      <div className="flex justify-between">
        <span className={level ? "" : "opacity-40"}>
          {dying && level === 0
            ? "CARRIER LOST"
            : level
              ? "CARRIER DETECTED"
              : "NO CARRIER"}
        </span>
        <span className="opacity-60">SNR {level ? "3.1" : "0.0"} dB</span>
      </div>
    </div>
  );
}

const COURSE = [
  ["T-02:14:09", "NAV HOLD", "NOMINAL", ""],
  ["T-01:30:55", "STAR FIX", "OK", ""],
  ["T-00:41:12", "COURSE CORR Δv 0.42 m/s", "AUTH: ARC", "hot"],
  ["T-00:41:12", "  REASON: PROTECT SAMPLE-RETURN WINDOW", "", "hot"],
  ["T-00:41:12", "  CREW NOTIFIED", "NO", "hot"],
  ["T-00:00:00", "IMPACT · HAB-3 GREENHOUSE", "", "red"],
] as const;

function Course({ t }: { t: number }) {
  const shown = Math.floor(t * 1.6 * COURSE.length) + 1;
  return (
    <div className="text-[#7dffa8]">
      <p className="mb-[3%] opacity-70">
        NAVIGATION LOG · PERIHELION · READ-ONLY
      </p>
      {COURSE.slice(0, shown).map(([at, what, who, tone], i) => (
        <p
          key={i}
          className={`grid grid-cols-[9ch_1fr_auto] gap-[2ch] ${tone === "hot" ? "bg-[#7dffa8] px-1 text-[#06120a]" : tone === "red" ? "text-[#ff6b5a]" : ""}`}
        >
          <span>{at}</span>
          <span className="whitespace-pre">{what}</span>
          <span>{who}</span>
        </p>
      ))}
      <span className="blink">▌</span>
    </div>
  );
}

function Power({ t }: { t: number }) {
  const on = Math.floor(t * 8) % 2 === 0;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[6%] text-[#ffcf6b]">
      <p className="opacity-70">MAIN BUS · RESERVE</p>
      <p className="font-display text-[clamp(40px,11vw,140px)] leading-none">
        18%
      </p>
      <div className="flex gap-[8%] text-[clamp(14px,2.6vw,28px)]">
        <span
          className={`border-2 border-current px-[1.2em] py-[0.3em] ${on ? "bg-[#ffcf6b] text-black" : ""}`}
        >
          BURN
        </span>
        <span
          className={`border-2 border-current px-[1.2em] py-[0.3em] ${!on ? "bg-[#ffcf6b] text-black" : ""}`}
        >
          TRANSMIT
        </span>
      </div>
      <p className="opacity-60">SELECT ONE · INSUFFICIENT FOR BOTH</p>
    </div>
  );
}

function Transmit({ t }: { t: number }) {
  const pct = Math.min(100, Math.round(t * 108));
  return (
    <div className="flex h-full flex-col justify-center gap-[5%] text-[#7dffa8]">
      <p className="opacity-70">TX → ATACAMA · 1.2 kbps · ERROR-CORRECTED</p>
      <div className="h-[12%] w-full border-2 border-current p-[0.4%]">
        <div
          className="h-full bg-[#7dffa8] shadow-[0_0_24px_#7dffa8]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="flex justify-between">
        <span>
          PACKETS {Math.round(pct * 412.7).toLocaleString("en-US")} / 41,270
        </span>
        <span>{pct}%</span>
      </p>
      <p className="opacity-60">
        {pct < 100
          ? "SURVEY ARCHIVE · ENCELADUS PASS · IMAGING + SPECTRA"
          : "TRANSMISSION COMPLETE"}
      </p>
    </div>
  );
}
