import Link from "next/link";
import { site } from "@/lib/format";

const NAV = [
  { href: "/work/last-signal", label: "Last Signal" },
  { href: "/notebook", label: "Notebook" },
  { href: "/now", label: "Now" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-5 sm:px-8">
      <Link href="/" className="group flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-full bg-tomato font-display text-lg text-paper italic transition-transform group-hover:-rotate-12"
        >
          j
        </span>
        <span className="font-display text-xl tracking-tight whitespace-nowrap">
          {site.name}
        </span>
      </Link>
      <nav aria-label="Main">
        <ul className="flex gap-3 text-sm whitespace-nowrap sm:gap-7">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="underline-offset-4 decoration-2 decoration-tomato hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-32 bg-ink text-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-6 px-4 py-12 text-sm sm:flex-row sm:px-8">
        <ul className="flex gap-6">
          <li>
            <a
              href={site.links.x}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sun"
            >
              X
            </a>
          </li>
          <li>
            <a
              href={site.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sun"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href={site.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sun"
            >
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export function SectionLabel({
  children,
  className = "text-tomato",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-5 font-mono text-xs tracking-[0.2em] uppercase ${className}`}
    >
      {children}
    </p>
  );
}
