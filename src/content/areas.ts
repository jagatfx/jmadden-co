import type { Area, AreaSlug } from "./types";

export const areas: Area[] = [
  {
    slug: "storytelling",
    title: "AI storytelling and film",
    thesis:
      "The director's job is shifting from making every frame to designing the system that makes them.",
  },
  {
    slug: "image-video",
    title: "Image and video",
    thesis:
      "Consistency, not resolution, is what turned generated video from clips into scenes.",
  },
  {
    slug: "3d",
    title: "3D",
    thesis:
      "Generated worlds you can walk through are becoming the new storyboard and the new set.",
  },
  {
    slug: "voice",
    title: "Voice",
    thesis:
      "Full-duplex speech makes a character feel present: you can interrupt it, and it can interrupt you.",
  },
  {
    slug: "music",
    title: "Music",
    thesis:
      "Stems and structure control turn a generated song into a score that can follow the story.",
  },
  {
    slug: "games",
    title: "Games",
    thesis:
      "When the other character can actually listen, the conversation itself becomes the game mechanic.",
  },
  {
    slug: "web-apps",
    title: "Website and app creation",
    thesis:
      "One person can now ship the film, the player, and the site that hosts them in the same week.",
  },
  {
    slug: "agents",
    title: "Agents and agent architecture",
    thesis:
      "2026 is the year agents edit video. The hard part is giving them taste, not tools.",
  },
  {
    slug: "productivity",
    title: "Productivity",
    thesis:
      "The best creative tooling removes the 80% of the work that was never the creative part.",
  },
  {
    slug: "writing",
    title: "Writing",
    thesis:
      "An AI writers' room is most useful as an argument partner, not a ghostwriter.",
  },
  {
    slug: "coding",
    title: "Coding and developer tools",
    thesis:
      "Creative pipelines should be code: versioned, reviewable, and runnable by anyone.",
  },
  {
    slug: "world-models",
    title: "World models and robotics",
    thesis:
      "Playable world models are short today, but they are the first engines that learned physics by watching.",
  },
  {
    slug: "dynamic-narrative",
    title: "Dynamic narrative experiences",
    thesis:
      "Branching stories stop feeling like menus when the branch is chosen by how you talk, not what you click.",
  },
  {
    slug: "conversational",
    title: "Conversational agents",
    thesis:
      "A character with memory, a goal, and limits is more convincing than one that can say anything.",
  },
  {
    slug: "quant",
    title: "Computational finance and quant agents",
    thesis:
      "An agent desk earns trust the same way a person does: by showing every decision and its reasoning.",
  },
];

export function getArea(slug: string): Area | undefined {
  return areas.find((a) => a.slug === slug);
}

export function areaTitle(slug: AreaSlug): string {
  return getArea(slug)?.title ?? slug;
}
