import type { Metadata } from "next";
import Link from "next/link";
import { notes } from "@/content/notes";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Notebook",
  description: "A dated build log: what I made, what broke, and what I learned.",
};

export default function NotebookPage() {
  return (
    <div className="pt-10">
      <h1 className="font-display text-6xl leading-none tracking-tight sm:text-7xl">
        Notebook
      </h1>
      <p className="mt-6 mb-14 max-w-2xl text-lg leading-relaxed text-muted">
        A dated build log: what I made, what broke, and what I learned.
      </p>
      <ul className="divide-y divide-line border-y border-line">
        {notes.map((n) => (
          <li key={n.slug}>
            <Link
              href={`/notebook/${n.slug}`}
              className="group grid gap-2 py-6 sm:grid-cols-[10rem_1fr]"
            >
              <span className="font-mono text-xs text-muted">{formatDate(n.date)}</span>
              <span>
                <span className="block text-lg group-hover:text-accent">{n.title}</span>
                <span className="mt-1 block text-muted">{n.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
