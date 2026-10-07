import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/site-chrome";
import { notes } from "@/content/notes";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Notebook",
  description:
    "A dated build log: what I made, what broke, and what I learned.",
};

export default function NotebookPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-8">
      <SectionLabel>Build log</SectionLabel>
      <h1 className="font-display text-7xl leading-none tracking-tight sm:text-8xl">
        Notebook
      </h1>
      <p className="mt-6 mb-14 max-w-2xl text-xl leading-relaxed text-ink-soft">
        What I made, what broke, and what I learned, written down before I can
        pretend it went smoothly.
      </p>
      <ul className="space-y-6">
        {notes.map((n, i) => (
          <li key={n.slug}>
            <Link
              href={`/notebook/${n.slug}`}
              className={`group block rounded-3xl p-8 ${["bg-sun", "bg-pink", "bg-paper-deep"][i % 3]}`}
            >
              <span className="font-mono text-xs tracking-[0.15em] uppercase">
                {formatDate(n.date)}
              </span>
              <span className="mt-2 block font-display text-3xl leading-tight group-hover:italic">
                {n.title}
              </span>
              <span className="mt-3 block text-lg">{n.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
