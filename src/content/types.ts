export type Media =
  | { kind: "video"; src: string; poster?: string; caption?: string }
  | { kind: "image"; src: string; alt: string; caption?: string }
  | { kind: "embed"; src: string; title: string; caption?: string };

export type Tool = { name: string; url?: string };

export type Project = {
  slug: string;
  title: string;
  /** One line: what it is. */
  hook: string;
  /** ISO date the piece ships or shipped. */
  date: string;
  shipped: boolean;
  tools: Tool[];
  /** The technical and creative moves, one per line. */
  how: string[];
};

export type Note = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
  xUrl?: string;
};

export type LegacyItem = {
  date: string;
  title: string;
  blurb: string;
  image: string;
  href?: string;
};

export type Ancestor = {
  year: number;
  title: string;
  by: string;
  medium: "film" | "book" | "radio" | "tv" | "story";
  /** What Last Signal took from it, with a wink. */
  took: string;
  color: "tomato" | "cobalt" | "sun" | "teal" | "plum" | "pink";
};
