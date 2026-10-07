import type { Metadata } from "next";
import { SectionLabel } from "@/components/site-chrome";
import { legacy } from "@/content/legacy";
import { site } from "@/lib/format";

export const metadata: Metadata = {
  title: "About",
  description: site.tagline,
};

export default function AboutPage() {
  return (
    <div className="grid gap-16 pt-10 lg:grid-cols-[3fr_2fr]">
      <div>
        <h1 className="font-display text-6xl leading-none tracking-tight sm:text-7xl">
          About
        </h1>
        <div className="mt-10 space-y-6 text-lg leading-relaxed">
          <p>
            I am a creative technologist with more than 25 years of building
            software. I make AI films and interactive stories, and I build the
            agents and tools that make them.
          </p>
          <p>
            I was early to augmented reality, virtual reality, and voice
            assistants, building them at hackathons and startups from 2015 to
            2020. Generative AI is the same feeling again, only bigger.
          </p>
          <p>
            I am also one of the active creators at{" "}
            <a href="https://www.showrunnerstudio.com/" className="text-accent hover:underline">
              Showrunner
            </a>
            . The work on this site is my own exploration outside it.
          </p>
        </div>
        <div className="mt-10 flex gap-6">
          <a href={site.links.x} className="text-accent hover:underline">
            @jagatfx on X
          </a>
          <a href={site.links.github} className="text-accent hover:underline">
            GitHub
          </a>
        </div>
      </div>

      <section>
        <SectionLabel>Earlier work, 2015 to 2020</SectionLabel>
        <ul className="divide-y divide-line border-y border-line text-sm">
          {legacy.map((item) => (
            <li key={item.title} className="flex justify-between gap-4 py-3">
              <span>{item.title}</span>
              <span className="font-mono text-muted">{item.date.slice(0, 4)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
