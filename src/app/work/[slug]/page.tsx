import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaFrame } from "@/components/media-frame";
import { SectionLabel } from "@/components/site-chrome";
import { StatusBadge } from "@/components/status-badge";
import { areaTitle } from "@/content/areas";
import { getProject, projects } from "@/content/projects";

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

export default async function WorkPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <article className="pt-10">
      <StatusBadge status={project.status} date={project.date} />
      <h1 className="mt-4 font-display text-6xl leading-none tracking-tight sm:text-8xl">
        {project.title}
      </h1>
      <p className="mt-6 max-w-3xl text-xl leading-relaxed text-muted">
        {project.hook}
      </p>

      <div className="mt-12">
        <MediaFrame media={project.hero} priority />
      </div>

      {project.tryIt && (
        <a
          href={project.tryIt.href}
          className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 font-medium text-bg hover:opacity-90"
        >
          {project.tryIt.label}
        </a>
      )}

      <div className="mt-20 grid gap-16 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-16">
          <section>
            <SectionLabel>How it works</SectionLabel>
            <ul className="space-y-5 text-lg leading-relaxed">
              {project.how.map((line) => (
                <li key={line} className="border-l border-accent pl-5">
                  {line}
                </li>
              ))}
            </ul>
          </section>

          {project.proof.length > 0 && (
            <section>
              <SectionLabel>Proof</SectionLabel>
              <ul className="space-y-3 text-lg leading-relaxed">
                {project.proof.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionLabel>What&apos;s next</SectionLabel>
            <p className="font-display text-3xl leading-snug">{project.next}</p>
          </section>
        </div>

        <aside className="space-y-10 text-sm">
          <div>
            <SectionLabel>Built with</SectionLabel>
            <ul className="space-y-2">
              {project.tools.map((t) => (
                <li key={t.name}>
                  {t.url ? (
                    <a href={t.url} className="hover:text-accent">
                      {t.name}
                    </a>
                  ) : (
                    t.name
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>Areas</SectionLabel>
            <ul className="space-y-2">
              {project.areas.map((a) => (
                <li key={a}>
                  <Link href={`/areas/${a}`} className="text-muted hover:text-fg">
                    {areaTitle(a)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </article>
  );
}
