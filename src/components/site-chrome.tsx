import Link from "next/link";
import { site } from "@/lib/format";

const NAV = [
  { href: "/#work", label: "Work" },
  { href: "/areas", label: "Areas" },
  { href: "/notebook", label: "Notebook" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-8">
      <Link
        href="/"
        className="font-display text-2xl tracking-tight text-fg hover:text-accent"
      >
        {site.name}
      </Link>
      <nav aria-label="Main">
        <ul className="flex gap-4 text-sm text-muted sm:gap-7">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="transition-colors hover:text-fg">
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
    <footer className="mx-auto mt-32 w-full max-w-6xl border-t border-line px-4 py-10 sm:px-8">
      <div className="flex flex-col justify-between gap-6 text-sm text-muted sm:flex-row">
        <p>
          {site.name}. Made with AI tools, on purpose.
        </p>
        <ul className="flex gap-6">
          <li>
            <a href={site.links.x} className="hover:text-fg">
              X
            </a>
          </li>
          <li>
            <a href={site.links.github} className="hover:text-fg">
              GitHub
            </a>
          </li>
          <li>
            <a href={site.links.linkedin} className="hover:text-fg">
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 font-mono text-xs tracking-[0.2em] text-accent uppercase">
      {children}
    </p>
  );
}
