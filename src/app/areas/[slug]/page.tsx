import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/project-card";
import { SectionLabel } from "@/components/site-chrome";
import { areas, getArea } from "@/content/areas";
import { projectsForArea } from "@/content/projects";

export function generateStaticParams() {
  return areas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/areas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) return {};
  return { title: area.title, description: area.thesis };
}

export default async function AreaPage({ params }: PageProps<"/areas/[slug]">) {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) notFound();
  const work = projectsForArea(area.slug);

  return (
    <div className="pt-10">
      <Link href="/areas" className="font-mono text-xs tracking-[0.14em] text-muted uppercase hover:text-fg">
        All areas
      </Link>
      <h1 className="mt-4 font-display text-6xl leading-none tracking-tight sm:text-7xl">
        {area.title}
      </h1>
      <p className="mt-8 max-w-3xl font-display text-3xl leading-snug text-muted">
        {area.thesis}
      </p>

      <section className="mt-16">
        <SectionLabel>Work</SectionLabel>
        {work.length > 0 ? (
          <div className="grid gap-12 sm:grid-cols-2">
            {work.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        ) : (
          <p className="text-muted">A piece for this area is in production.</p>
        )}
      </section>
    </div>
  );
}
