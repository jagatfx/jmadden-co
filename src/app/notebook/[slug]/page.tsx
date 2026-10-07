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
    <article className="mx-auto max-w-2xl px-4 pt-8 sm:px-0">
      <Link
        href="/notebook"
        className="font-mono text-xs tracking-[0.15em] text-tomato uppercase hover:underline"
      >
        Notebook · {formatDate(note.date)}
      </Link>
      <h1 className="mt-4 font-display text-5xl leading-tight tracking-tight sm:text-6xl">
        {note.title}
      </h1>
      <div className="mt-10 space-y-6 text-xl leading-relaxed first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-tomato">
        {note.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {note.xUrl && (
        <a href={note.xUrl} className="mt-10 inline-block font-medium text-cobalt underline">
          Discuss on X
        </a>
      )}
    </article>
  );
}
