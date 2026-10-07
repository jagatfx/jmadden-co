# jmadden.co

Personal portfolio of Jacob Madden: AI films, the agents that make them, and the tools in between.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, and bun.

## Develop

```sh
bun install
bun dev        # http://localhost:3000
bun run build  # production build
bun run lint
```

## Content

All content is typed data in `src/content/`, so adding work never touches page code:

| File | What it holds |
| --- | --- |
| `projects.ts` | Case studies: hook, status, ship date, hero media, tools, how it works, proof, what's next |
| `areas.ts` | The 15 areas, each with a one-line thesis |
| `notes.ts` | Lab notebook entries, newest first |
| `legacy.ts` | Earlier work (2015 to 2020), listed on the About page |

To ship a piece, set its `status` to `"live"`, replace the `placeholder` hero with a `video`, `image`, or `embed`, and fill in `proof`. Media files go in `public/`.

## Deploy

Every page is prerendered, so any Next.js host works (Vercel, Netlify, Cloudflare). The previous Gatsby site lives in this repo's history before the `site-2026` branch.
