import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionLabel } from "@/components/site-chrome";
import { archivePosts } from "@/content/archive-posts";
import { legacy } from "@/content/legacy";
import { formatDate } from "@/lib/format";

function getPost(slug: string) {
  return archivePosts.find((p) => p.slug === slug);
}

export function generateStaticParams() {
  return archivePosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/archive/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const blurb = legacy.find((l) => l.slug === slug)?.blurb;
  return { title: post.title, description: blurb };
}

export default async function ArchivePostPage({
  params,
}: PageProps<"/archive/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const i = archivePosts.indexOf(post);
  const newer = archivePosts[i - 1];
  const older = archivePosts[i + 1];

  return (
    <article className="mx-auto max-w-3xl px-4 pt-8 sm:px-8">
      <Link
        href="/about#archive"
        className="font-mono text-xs tracking-[0.15em] text-tomato uppercase hover:underline"
      >
        ← Earlier work
      </Link>
      <SectionLabel className="mt-8 text-ink-soft">
        {formatDate(post.date)}
      </SectionLabel>
      <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl">
        {post.title}
      </h1>
      <ul className="mt-5 flex flex-wrap gap-2">
        {post.tags.map((t) => (
          <li
            key={t}
            className="rounded-full border-2 border-ink px-3 py-0.5 font-mono text-[11px] tracking-wide"
          >
            {t}
          </li>
        ))}
      </ul>

      <div
        className="archive-prose mt-10"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <nav
        className="mt-20 grid gap-4 border-t-2 border-ink pt-8 sm:grid-cols-2"
        aria-label="More earlier work"
      >
        {older ? (
          <Link href={`/archive/${older.slug}`} className="group">
            <span className="font-mono text-xs tracking-[0.15em] text-ink-soft uppercase">
              ← Older
            </span>
            <span className="mt-1 block font-display text-2xl group-hover:italic">
              {older.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {newer && (
          <Link href={`/archive/${newer.slug}`} className="group sm:text-right">
            <span className="font-mono text-xs tracking-[0.15em] text-ink-soft uppercase">
              Newer →
            </span>
            <span className="mt-1 block font-display text-2xl group-hover:italic">
              {newer.title}
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
