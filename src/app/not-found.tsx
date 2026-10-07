import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-32 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">
        Signal lost
      </p>
      <h1 className="mt-4 font-display text-6xl">Nothing on this channel.</h1>
      <Link href="/" className="mt-8 inline-block text-muted hover:text-fg">
        Back to the start
      </Link>
    </div>
  );
}
