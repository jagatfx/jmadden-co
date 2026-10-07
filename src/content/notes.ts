import type { Note } from "./types";

/** Lab notebook: dated build-log posts, newest first. */
export const notes: Note[] = [
  {
    slug: "nine-days",
    title: "Nine days to make a film that listens",
    date: "2026-10-07",
    summary:
      "The story is locked. Now the hard part: a character who has to react to whatever a stranger says to her.",
    body: [
      "Today I locked the story for Last Signal. An astronaut named Ines is awake and alone on a damaged ship, and her distress call reaches exactly one person: you.",
      "Writing a branching film is mostly bookkeeping. Writing a character who has to answer anything a stranger says is a different job. Ines gets a brief instead of lines: who she is at each moment, what she knows, what she wants from you, and a rule that she can be persuaded but not bullied.",
      "The radio teaser on the homepage is the first piece. Tune it and you will hear her before you see her. I'll post each day's progress here and on X until it premieres on October 16.",
    ],
  },
];

export function getNote(slug: string): Note | undefined {
  return notes.find((n) => n.slug === slug);
}
