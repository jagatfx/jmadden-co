import Link from "next/link";
import { areas } from "@/content/areas";
import { projectsForArea } from "@/content/projects";

export function AreaGrid() {
  return (
    <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {areas.map((area, i) => {
        const count = projectsForArea(area.slug).length;
        return (
          <li key={area.slug} className="bg-bg">
            <Link
              href={`/areas/${area.slug}`}
              className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-bg-raised"
            >
              <span className="font-mono text-[11px] tracking-[0.14em] text-muted">
                {String(i + 1).padStart(2, "0")}
                {count > 0 && (
                  <span className="ml-3 text-accent">
                    {count} {count === 1 ? "piece" : "pieces"}
                  </span>
                )}
              </span>
              <span className="text-lg text-fg group-hover:text-accent">
                {area.title}
              </span>
              <span className="text-sm leading-relaxed text-muted">
                {area.thesis}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
