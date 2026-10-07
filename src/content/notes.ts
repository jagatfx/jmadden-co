import type { Note } from "./types";

/** Lab notebook: dated build-log posts, newest first. */
export const notes: Note[] = [
  {
    slug: "nine-days",
    title: "Nine days, one film, fifteen disciplines",
    date: "2026-10-07",
    summary:
      "Starting a nine-day sprint to make an interactive AI film, and the agent studio that makes it.",
    body: [
      "Today I locked the story for Last Signal: a stranded astronaut whose distress call reaches exactly one person, you.",
      "Over the next nine days I am building the film, the agents that generate and edit it, and the site you are reading, and posting what I learn each day.",
    ],
  },
];

export function getNote(slug: string): Note | undefined {
  return notes.find((n) => n.slug === slug);
}
