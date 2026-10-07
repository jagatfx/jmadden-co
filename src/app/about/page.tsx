import type { Metadata } from "next";
import { Archive } from "@/components/archive";
import { SectionLabel } from "@/components/site-chrome";
import { site } from "@/lib/format";

export const metadata: Metadata = {
  title: "About",
  description: site.tagline,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-[7fr_5fr]">
        <div>
          <SectionLabel>About</SectionLabel>
          <h1 className="font-display text-6xl leading-[0.95] tracking-tight sm:text-7xl">
            Engineer by trade,{" "}
            <span className="text-tomato italic">storyteller</span> by nature.
          </h1>
          <div className="mt-10 space-y-6 text-xl leading-relaxed">
            <p>
              I&apos;ve been writing software for more than 25 years. For the
              last ten I&apos;ve pointed it at stories: AR portals at festivals,
              VR scenes for amateur actors, a live dance piece where three
              dancers performed with scans of themselves.
            </p>
            <p>
              I&apos;m a lifelong reader and I write constantly. The stories I
              love have a person at the center of it trying to be understood,
              which is how I ended up making a film where the only way through
              is to talk to someone.
            </p>
            <p>
              I also build{" "}
              <a
                href="https://www.firefolio.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="ink-link"
              >
                Firefolio
              </a>
              , a lab for financial independence planning and market research,
              where my trading-agent experiments live. And I&apos;m one of the
              active creators at{" "}
              <a
                href="https://www.showrunnerstudio.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="ink-link"
              >
                Showrunner
              </a>
              . Everything on this site is my own work outside both.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={site.links.x}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink px-5 py-2.5 text-paper hover:bg-tomato"
            >
              @jagatfx on X
            </a>
            <a
              href={site.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-ink px-5 py-2 hover:bg-sun"
            >
              GitHub
            </a>
            <a
              href={site.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-ink px-5 py-2 hover:bg-pink"
            >
              LinkedIn
            </a>
          </div>
        </div>
        <aside className="self-start rounded-3xl bg-teal p-8 text-paper lg:mt-24">
          <SectionLabel className="text-sun">
            What my work keeps circling
          </SectionLabel>
          <ul className="space-y-4 font-display text-2xl leading-snug">
            <li>Voices on the radio in the middle of the night</li>
            <li>Machines that are polite right up until they aren&apos;t</li>
            <li>Stories you can walk around inside</li>
            <li>Interfaces that get out of the way</li>
          </ul>
        </aside>
      </div>

      <section id="archive" className="scroll-mt-8 pt-24">
        <SectionLabel>Earlier work, 2015 to 2020</SectionLabel>
        <Archive />
      </section>
    </div>
  );
}
