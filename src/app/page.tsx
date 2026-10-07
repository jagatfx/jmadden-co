import Link from "next/link";
import { AreaGrid } from "@/components/area-grid";
import { MediaFrame } from "@/components/media-frame";
import { ProjectCard } from "@/components/project-card";
import { SectionLabel } from "@/components/site-chrome";
import { StatusBadge } from "@/components/status-badge";
import { areas } from "@/content/areas";
import { notes } from "@/content/notes";
import { flagships, projects } from "@/content/projects";
import { formatDate } from "@/lib/format";

export default function Home() {
  const [lead, ...rest] = flagships;
  const supporting = projects.filter((p) => !p.flagship);

  return (
    <>
      <section className="pt-10 pb-20 sm:pt-20">
        <h1 className="max-w-4xl font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">
          I make AI films, and the agents that make them.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          A creative technologist working across {areas.length} disciplines of
          generative media, from voice and music to world models and agent
          architecture. Everything here was built in 2026 with the newest tools
          available.
        </p>
        <div className="mt-12">
          <MediaFrame
            media={{ kind: "placeholder", label: "Reel incoming" }}
            priority
          />
        </div>
      </section>

      <section id="work" className="scroll-mt-8 py-16">
        <SectionLabel>Flagship work</SectionLabel>
        <Link href={`/work/${lead.slug}`} className="group block">
          <MediaFrame media={lead.hero} />
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_2fr]">
            <h2 className="font-display text-5xl leading-none group-hover:text-accent">
              {lead.title}
            </h2>
            <p className="text-lg leading-relaxed text-muted">{lead.hook}</p>
          </div>
        </Link>
        <div className="mt-16 space-y-16">
          {rest.map((p) => (
            <Link
              key={p.slug}
              href={`/work/${p.slug}`}
              className="group grid items-center gap-8 sm:grid-cols-2"
            >
              <MediaFrame media={p.hero} ratio="video" />
              <div className="space-y-3">
                <StatusBadge status={p.status} date={p.date} />
                <h3 className="font-display text-4xl leading-tight group-hover:text-accent">
                  {p.title}
                </h3>
                <p className="text-lg leading-relaxed text-muted">{p.hook}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16">
        <SectionLabel>Also in production</SectionLabel>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {supporting.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      <section className="py-16">
        <SectionLabel>Fifteen areas, one point of view each</SectionLabel>
        <AreaGrid />
      </section>

      <section className="py-16">
        <SectionLabel>Lab notebook</SectionLabel>
        <ul className="divide-y divide-line border-y border-line">
          {notes.slice(0, 3).map((n) => (
            <li key={n.slug}>
              <Link
                href={`/notebook/${n.slug}`}
                className="group grid gap-2 py-6 sm:grid-cols-[10rem_1fr]"
              >
                <span className="font-mono text-xs text-muted">
                  {formatDate(n.date)}
                </span>
                <span>
                  <span className="block text-lg group-hover:text-accent">
                    {n.title}
                  </span>
                  <span className="mt-1 block text-muted">{n.summary}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
