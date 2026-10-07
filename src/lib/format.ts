const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Formats an ISO date (YYYY-MM-DD) without timezone shifts. */
export function formatDate(iso: string, withYear = true): string {
  const [y, m, d] = iso.split("-").map(Number);
  const md = `${MONTHS[m - 1]} ${d}`;
  return withYear ? `${md}, ${y}` : md;
}

export const site = {
  name: "Jacob Madden",
  url: "https://www.jmadden.co",
  tagline:
    "Creative technologist building AI films, the agents that make them, and the tools in between.",
  links: {
    x: "https://x.com/jagatfx",
    github: "https://github.com/jagatfx",
    linkedin: "https://www.linkedin.com/in/jacobmadden",
  },
};
