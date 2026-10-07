import type { Metadata } from "next";
import { SectionLabel } from "@/components/site-chrome";
import { motto, now, previously } from "@/content/now";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Now",
  description: "What I'm focused on right now.",
};

const DOTS = [
  "bg-tomato",
  "bg-cobalt",
  "bg-teal",
  "bg-sun",
  "bg-pink",
  "bg-plum",
];

export default function NowPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-8">
      <SectionLabel>
        Updated {formatDate(now.updated)} · {now.location}
      </SectionLabel>
      <h1 className="font-display text-7xl leading-none tracking-tight sm:text-8xl">
        Now
      </h1>
      <p className="mt-6 max-w-2xl font-display text-2xl leading-snug text-ink-soft italic">
        &ldquo;{motto}&rdquo;
      </p>
      <p className="mt-4 max-w-2xl text-ink-soft">
        A{" "}
        <a
          href="https://nownownow.com/about"
          target="_blank"
          rel="noopener noreferrer"
          className="ink-link"
        >
          now page
        </a>
        , an idea from Derek Sivers: what I&apos;d tell a friend I hadn&apos;t
        seen in a year.
      </p>

      <div className="mt-14 space-y-12">
        {now.sections.map((s, i) => (
          <section key={s.heading}>
            <h2 className="flex items-center gap-3 font-display text-3xl">
              <span
                className={`size-3 rounded-full ${DOTS[i % DOTS.length]}`}
                aria-hidden
              />
              {s.heading}
            </h2>
            <ul className="mt-4 space-y-3 text-xl leading-relaxed">
              {s.items.map((item) => (
                <li key={item} className="border-l-4 border-line pl-4">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-24">
        <SectionLabel className="text-ink-soft">Previously</SectionLabel>
        <div className="grid gap-6 sm:grid-cols-2">
          {previously.map((snap, i) => (
            <div
              key={snap.updated}
              className={`rounded-3xl p-6 ${i % 2 ? "-rotate-1 bg-paper-deep" : "rotate-1 bg-paper-deep"}`}
            >
              <p className="font-mono text-xs tracking-[0.15em] uppercase">
                {formatDate(snap.updated)} · {snap.location}
              </p>
              <ul className="mt-4 space-y-2 text-ink-soft">
                {snap.sections
                  .flatMap((s) => s.items)
                  .map((item) => (
                    <li key={item}>{item}</li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
