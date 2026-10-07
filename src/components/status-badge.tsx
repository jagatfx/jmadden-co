import type { Status } from "@/content/types";
import { formatDate } from "@/lib/format";

const LABEL: Record<Status, string> = {
  live: "Live",
  "in-production": "In production",
  planned: "Planned",
};

export function StatusBadge({ status, date }: { status: Status; date: string }) {
  const live = status === "live";
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? "bg-accent" : "border border-accent"}`}
        aria-hidden
      />
      {LABEL[status]}
      <span className="text-line">/</span>
      {live ? formatDate(date) : `Ships ${formatDate(date, false)}`}
    </span>
  );
}
