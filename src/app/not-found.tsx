import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-32 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-tomato uppercase">Signal lost</p>
      <h1 className="mt-4 font-display text-6xl leading-tight">
        Nothing on this channel but static.
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        Ines checked. ARC says the page is within tolerance.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block rounded-full bg-sun px-6 py-3 font-medium hover:-rotate-2"
      >
        Back to the start
      </Link>
    </div>
  );
}
