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

| File           | What it holds                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `projects.ts`  | Case studies: hook, ship date, tools, how it works                                                             |
| `lineage.ts`   | Last Signal's family tree of films, books, and broadcasts                                                      |
| `notes.ts`     | Lab notebook entries, newest first                                                                             |
| `legacy.ts`    | Earlier work (2015 to 2020): card titles, blurbs, and cover images in `public/archive/`                        |
| `archive/*.md` | The original write-ups from the old site. Run `bun run archive` after editing to regenerate `archive-posts.ts` |

Nothing goes on the site as a placeholder. A piece appears once there is something real to show, even if it is a work in progress.

Last Signal itself is data too: `src/content/last-signal-film.ts` holds every shot, line, hold and ending. The player (`src/components/film/`) runs it, and `bun scripts/last-signal.ts` turns it into media: a still per shot (fal), a voice take per line and a sound per cue (ElevenLabs). It only makes what's missing, so delete a file to regenerate it. It needs `FAL_KEY` and `ELEVENLABS_API_KEY`.

The homepage radio (`src/components/receiver.tsx`) is a canvas waterfall plus Web Audio synthesis; the five lines it hides are in its `STATIONS` list.

Old post URLs (like `/unever-odd-ar`) redirect to `/archive/<slug>`. The `Check links` GitHub Action checks every outbound link in `src/content` on each PR.

## Deploy

Every page is prerendered, so any Next.js host works (Vercel, Netlify, Cloudflare). The previous Gatsby site lives in this repo's history before the `site-2026` branch.
