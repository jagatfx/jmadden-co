export type Status = "live" | "in-production" | "planned";

export type Media =
  | { kind: "video"; src: string; poster?: string; caption?: string }
  | { kind: "image"; src: string; alt: string; caption?: string }
  | { kind: "embed"; src: string; title: string; caption?: string }
  | { kind: "placeholder"; label: string };

export type Tool = { name: string; url?: string };

export type Project = {
  slug: string;
  title: string;
  /** One line: what it is and why it could not exist two years ago. */
  hook: string;
  status: Status;
  /** ISO date the piece ships or shipped. */
  date: string;
  hero: Media;
  tryIt?: { label: string; href: string };
  areas: AreaSlug[];
  tools: Tool[];
  /** The technical move: models, architecture, one hard problem solved. */
  how: string[];
  /** Metrics, reactions, before and after. Empty until the piece ships. */
  proof: string[];
  /** Two or three sentences on where this goes next. */
  next: string;
  flagship?: boolean;
};

export type AreaSlug =
  | "storytelling"
  | "image-video"
  | "3d"
  | "voice"
  | "music"
  | "games"
  | "web-apps"
  | "agents"
  | "productivity"
  | "writing"
  | "coding"
  | "world-models"
  | "dynamic-narrative"
  | "conversational"
  | "quant";

export type Area = {
  slug: AreaSlug;
  title: string;
  /** One-sentence point of view on where the area is going. */
  thesis: string;
};

export type Note = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
  xUrl?: string;
};

export type LegacyItem = { date: string; title: string };
