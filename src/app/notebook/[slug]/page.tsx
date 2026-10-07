import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, notes } from "@/content/notes";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return notes.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/notebook/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return {};
  return { title: note.title, description: note.summary };
}

export default async function NotePage({ params }: PageProps<"/notebook/[slug]">) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) notFound();

  return (
    <article className="mx-auto max-w-2xl pt-10">
      <Link
        href="/notebook"
        className="font-mono text-xs tracking-[0.14em] text-muted uppercase hover:text-fg"
      >
        Notebook / {formatDate(note.date)}
      </Link>
      <h1 className="mt-4 font-display text-5xl leading-tight tracking-tight">
        {note.title}
      </h1>
      <div className="mt-10 space-y-6 text-lg leading-relaxed">
        {note.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {note.xUrl && (
        <a href={note.xUrl} className="mt-10 inline-block text-accent hover:underline">
          Discuss on X
        </a>
      )}
    </article>
  );
}
