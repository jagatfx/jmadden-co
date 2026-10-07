import Link from "next/link";
import type { Project } from "@/content/types";
import { MediaFrame } from "./media-frame";
import { StatusBadge } from "./status-badge";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <MediaFrame media={project.hero} ratio="video" />
      <div className="mt-4 space-y-2">
        <StatusBadge status={project.status} date={project.date} />
        <h3 className="font-display text-3xl leading-tight text-fg group-hover:text-accent">
          {project.title}
        </h3>
        <p className="text-[15px] leading-relaxed text-muted">{project.hook}</p>
      </div>
    </Link>
  );
}
