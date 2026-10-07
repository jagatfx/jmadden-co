import { lineage } from "@/content/lineage";
import type { Ancestor } from "@/content/types";

const BG: Record<Ancestor["color"], string> = {
  tomato: "bg-tomato text-paper",
  cobalt: "bg-cobalt text-paper",
  sun: "bg-sun text-ink",
  teal: "bg-teal text-paper",
  plum: "bg-plum text-paper",
  pink: "bg-pink text-ink",
};

const MEDIUM: Record<Ancestor["medium"], string> = {
  film: "Film",
  book: "Novel",
  radio: "Radio",
  tv: "Television",
  story: "Short story",
};

export function Lineage() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-6 sm:-mx-8 sm:px-8 [scrollbar-width:thin]">
      <ol className="flex w-max snap-x snap-mandatory gap-4">
        {lineage.map((a, i) => (
          <li
            key={a.title}
            className={`${BG[a.color]} flex w-64 shrink-0 snap-start flex-col rounded-3xl p-6 ${i % 2 ? "rotate-1" : "-rotate-1"} transition-transform hover:rotate-0`}
          >
            <span className="font-display text-5xl leading-none tracking-tight">
              {a.year}
            </span>
            <span className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase opacity-80">
              {MEDIUM[a.medium]}
            </span>
            <span className="mt-6 font-display text-2xl leading-tight italic">
              {a.title}
            </span>
            <span className="mt-1 text-sm opacity-80">{a.by}</span>
            <p className="mt-5 text-[15px] leading-snug">{a.took}</p>
          </li>
        ))}
        <li className="flex w-64 shrink-0 snap-start flex-col justify-between rounded-3xl bg-ink p-6 text-paper ring-4 ring-sun">
          <div>
            <span className="font-display text-5xl leading-none tracking-tight">
              2026
            </span>
            <span className="mt-1 block font-mono text-[10px] tracking-[0.2em] text-sun uppercase">
              You are here
            </span>
            <span className="mt-6 block font-display text-2xl leading-tight italic">
              Last Signal
            </span>
          </div>
          <p className="mt-5 text-[15px] leading-snug">
            The kid of all of the above. The first one where the voice on the
            other end of the radio is yours.
          </p>
        </li>
      </ol>
    </div>
  );
}
