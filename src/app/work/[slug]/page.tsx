import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Poster } from "@/components/poster";
import { Receiver } from "@/components/receiver";
import { SectionLabel } from "@/components/site-chrome";
import { StoryMap } from "@/components/story-map";
import { getProject, projects } from "@/content/projects";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: project.title, description: project.hook };
}

const PROGRESS: { date: string; what: string; done: boolean }[] = [
  {
    date: "2026-10-07",
    what: "Story locked: one astronaut, one ship's computer, one stranger on the radio",
    done: true,
  },
  {
    date: "2026-10-07",
    what: "Script, 48-shot list, and the character brief Ines runs on",
    done: true,
  },
  {
    date: "2026-10-07",
    what: "Radio teaser, playable on the homepage",
    done: true,
  },
  { date: "2026-10-09", what: "Look frames and Ines's voice", done: false },
  {
    date: "2026-10-12",
    what: "All 48 shots generated and reviewed",
    done: false,
  },
  {
    date: "2026-10-14",
    what: "Live conversation wired into the player",
    done: false,
  },
  { date: "2026-10-16", what: "Premiere", done: false },
];

export default async function WorkPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <article>
      <header className="mx-auto grid max-w-6xl items-end gap-10 px-4 pt-8 sm:px-8 lg:grid-cols-[7fr_4fr]">
        <div>
          <SectionLabel>
            {project.shipped
              ? "Out now"
              : `In production · premieres ${formatDate(project.date)}`}
          </SectionLabel>
          <h1 className="font-display text-7xl leading-none tracking-tight sm:text-9xl">
            {project.title}
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed">
            {project.hook}
          </p>
        </div>
        <Poster className="mx-auto block h-auto w-full max-w-xs rotate-2 shadow-[10px_10px_0_var(--cobalt)]" />
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8">
        <SectionLabel>The map</SectionLabel>
        <h2 className="max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
          Three times, the film stops and asks you what to do.
        </h2>
        <p className="mt-4 mb-10 max-w-2xl text-lg text-ink-soft">
          You answer out loud. Ines decides whether to trust you, and the ending
          follows how she feels about you, not which word you said.
        </p>
        <div className="rounded-3xl bg-paper-deep p-4 sm:p-8">
          <StoryMap />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-24 sm:px-8 lg:grid-cols-2">
        <div>
          <SectionLabel>From the script</SectionLabel>
          <div className="-rotate-1 rounded-sm bg-white p-8 font-mono text-[13px] leading-relaxed text-ink shadow-[8px_8px_0_var(--tomato)] sm:p-10">
            <p className="font-medium">
              10. INT. PERIHELION HAB, SEC-01. HOLD.
            </p>
            <p className="mt-4">
              Emergency light. Close on INES. She looks past the camera, at you.
            </p>
            <p className="mt-6 text-center">INES</p>
            <p className="mx-auto max-w-[28ch]">
              I can seal it and lose everything we&apos;ve grown, or I go
              outside and patch it. ARC says seal. What would you do?
            </p>
            <p className="mt-6">
              The film waits. Ines listens. She can interrupt.
            </p>
            <p className="mt-6 text-center">ARC (V.O.)</p>
            <p className="mx-auto max-w-[28ch]">
              Ines, greenhouse pressure at sixty-one percent.
            </p>
          </div>
        </div>
        <div>
          <SectionLabel>How it works</SectionLabel>
          <ul className="space-y-6 text-lg leading-relaxed">
            {project.how.map((line, i) => (
              <li key={line} className="flex gap-4">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full font-display text-lg ${["bg-tomato text-paper", "bg-sun", "bg-teal text-paper", "bg-pink"][i % 4]}`}
                >
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 font-mono text-xs tracking-[0.15em] text-ink-soft uppercase">
            Made with {project.tools.map((t) => t.name).join(" · ")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8">
        <SectionLabel>Tune in</SectionLabel>
        <h2 className="mb-8 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
          The teaser is a radio. Find her.
        </h2>
        <Receiver compact />
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8">
        <SectionLabel>Production log</SectionLabel>
        <ol className="divide-y-2 divide-ink border-y-2 border-ink">
          {PROGRESS.map((p) => (
            <li
              key={p.what}
              className="grid grid-cols-[6rem_1fr_auto] items-center gap-4 py-4"
            >
              <span className="font-mono text-sm">
                {formatDate(p.date, false)}
              </span>
              <span className={`text-lg ${p.done ? "" : "text-ink-soft"}`}>
                {p.what}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-mono text-[11px] tracking-wider uppercase ${p.done ? "bg-teal text-paper" : "border-2 border-ink"}`}
              >
                {p.done ? "Done" : "Next"}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
