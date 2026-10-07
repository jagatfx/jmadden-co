import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "last-signal",
    title: "Last Signal",
    hook: "A short film you talk to. A stranded astronaut's distress call reaches exactly one person, and what you say decides whether her crew comes home.",
    date: "2026-10-16",
    shipped: false,
    tools: [
      { name: "Veo 3.1" },
      { name: "Kling" },
      { name: "ElevenLabs Eleven v4" },
      { name: "GPT-Live-1" },
      { name: "Suno v5.5" },
      { name: "Claude Agent SDK" },
    ],
    how: [
      "48 generated shots, three spoken decisions, three endings. Any one viewing plays about 35 of them.",
      "The film pauses when Ines needs an answer. You reply out loud, and she can interrupt you back.",
      "A character agent scores every exchange on trust and nerve. Those two numbers, not keywords, pick the ending.",
      "The score is built from the radio itself: carrier tone, static, and data chirps, mixed live as the story branches.",
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
