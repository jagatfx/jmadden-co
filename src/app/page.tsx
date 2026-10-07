import Image from "next/image";
import Link from "next/link";
import { Archive } from "@/components/archive";
import { Lineage } from "@/components/lineage";
import { Poster } from "@/components/poster";
import { Receiver } from "@/components/receiver";
import { SectionLabel } from "@/components/site-chrome";
import { notes } from "@/content/notes";
import { getProject } from "@/content/projects";
import { formatDate } from "@/lib/format";

function Squiggle() {
  return (
    <svg
      viewBox="0 0 300 20"
      preserveAspectRatio="none"
      className="absolute -bottom-2 left-0 h-3 w-full sm:h-4"
      aria-hidden
    >
      <path
        d="M2 12 C 30 2, 50 20, 80 10 S 130 2, 160 11 S 220 20, 250 9 S 290 4, 298 10"
        fill="none"
        stroke="var(--sun)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  const film = getProject("last-signal")!;
  const note = notes[0];

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-8 sm:pt-14">
        <SectionLabel>Now showing (almost)</SectionLabel>
        <h1 className="max-w-5xl font-display text-6xl leading-[0.95] tracking-tight sm:text-8xl">
          I make films that{" "}
          <span className="relative inline-block text-tomato italic">
            talk back.
            <Squiggle />
          </span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed sm:text-xl">
          I&apos;m Jacob Madden. I&apos;ve written software for 25 years and
          spent the last ten making things you step inside: AR portals, a VR
          stage for amateur actors, a drum machine you play by nodding. Now
          I&apos;m making a movie that listens to you.
        </p>

        <div className="mt-12">
          <Receiver />
          <p className="mt-4 text-sm text-ink-soft">
            Five lines from the film are hidden in the band. Headphones help.
            The static is loud; that part is accurate.
          </p>
        </div>
      </section>

      <section className="bg-cobalt text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[5fr_7fr] lg:py-28">
          <Link
            href={`/work/${film.slug}`}
            className="mx-auto block w-full max-w-sm -rotate-2 shadow-[12px_12px_0_var(--ink)] transition-transform hover:rotate-0"
          >
            <Poster className="block h-auto w-full" />
          </Link>
          <div>
            <SectionLabel className="text-sun">
              In production · premieres Oct 16
            </SectionLabel>
            <h2 className="font-display text-6xl leading-none tracking-tight sm:text-7xl">
              Last Signal
            </h2>
            <p className="mt-6 max-w-xl text-xl leading-relaxed">{film.hook}</p>

            <figure className="mt-10 grid max-w-xl gap-5 rounded-3xl bg-paper p-6 text-ink sm:grid-cols-[8rem_1fr]">
              <Image
                src="/last-signal/ines.webp"
                alt="Ines Varga, a tired woman in her forties with dark hair tied back, in a grey flight suit with a mission patch"
                width={800}
                height={800}
                sizes="8rem"
                className="size-32 -rotate-3 rounded-2xl object-cover shadow-[5px_5px_0_var(--tomato)]"
              />
              <div>
                <figcaption className="font-mono text-[11px] tracking-[0.2em] text-tomato uppercase">
                  From the character brief
                </figcaption>
                <blockquote className="mt-3 font-display text-xl leading-snug italic">
                  Ines Varga, flight engineer, 41, four hours of sleep, alone
                  and awake on a damaged ship. Dry and steady. Short sentences.
                  Goes quiet when she is scared. She can be persuaded, but not
                  bullied.
                </blockquote>
              </div>
            </figure>

            <Link
              href={`/work/${film.slug}`}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3 font-medium text-ink transition-transform hover:-rotate-2"
            >
              How it&apos;s being made <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8">
        <SectionLabel>Family tree</SectionLabel>
        <h2 className="max-w-3xl font-display text-5xl leading-tight tracking-tight sm:text-6xl">
          Every film is somebody&apos;s creation.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          Last Signal&apos;s ancestors, on page, screen, and airwave, and what
          it borrowed from each.
        </p>
        <div className="mt-10">
          <Lineage />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8">
        <SectionLabel>From the notebook</SectionLabel>
        <Link
          href={`/notebook/${note.slug}`}
          className="group grid gap-6 rounded-3xl bg-sun p-8 sm:grid-cols-[1fr_2fr] sm:p-12"
        >
          <div>
            <span className="font-mono text-xs tracking-[0.15em] uppercase">
              {formatDate(note.date)}
            </span>
            <h3 className="mt-3 font-display text-4xl leading-tight group-hover:italic">
              {note.title}
            </h3>
          </div>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>{note.body[1]}</p>
            <span className="inline-block font-medium underline decoration-2 underline-offset-4">
              Keep reading
            </span>
          </div>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8">
        <SectionLabel>Before this, 2015 to 2020</SectionLabel>
        <h2 className="max-w-3xl font-display text-5xl leading-tight tracking-tight sm:text-6xl">
          Ten years of putting people{" "}
          <span className="italic text-cobalt">inside</span> things.
        </h2>
        <p className="mt-4 mb-10 max-w-2xl text-lg text-ink-soft">
          Hackathons, startups, and a few installations, mostly AR and VR, back
          when you had to explain what those letters meant.
        </p>
        <Archive />
      </section>
    </>
  );
}
