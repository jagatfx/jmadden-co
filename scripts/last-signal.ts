/**
 * Turns the Last Signal shot list (src/content/last-signal-film.ts) into media:
 * a still per shot (fal, Nano Banana Pro, against Ines's character sheet and
 * earlier shots of the same set), a voice take per line (ElevenLabs v4), and a
 * sound effect per cue. Only missing files are made, so re-running is cheap;
 * delete a file to regenerate it.
 *
 *   bun scripts/last-signal.ts [lines|sfx|shots] [shot ids...]
 *
 * Needs FAL_KEY and ELEVENLABS_API_KEY. Full-size masters go to MASTERS
 * (default: .last-signal-masters/, not committed); the site gets 1920px WebP.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  allLines,
  SFX,
  SHOTS,
  STYLE_SUFFIX,
  type Line,
  type Shot,
  type Who,
} from "../src/content/last-signal-film";

const OUT = "public/last-signal/film";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MASTERS = process.env.MASTERS ?? ".last-signal-masters";

const VOICES: Record<Who, string> = {
  INES: "ylr7Gk2W8pFN3FDqepQ7",
  ARC: "IsJRBN2VYO8QhtuQZ6l5",
  // A premade ElevenLabs voice: warm, low, a commander you'd follow.
  TEO: "nPczCjzI2devNBz1zQrb",
};

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function speak(line: Line) {
  const file = join(OUT, "lines", `${line.id}.mp3`);
  if (existsSync(file)) return;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICES[line.who]}?output_format=mp3_44100_96`,
    {
      method: "POST",
      headers: {
        "xi-api-key": env("ELEVENLABS_API_KEY"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: line.read ?? line.text,
        model_id: "eleven_v4",
      }),
    },
  );
  if (!res.ok) throw new Error(`${line.id}: ${res.status} ${await res.text()}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log("line", line.id);
}

async function sound(id: string) {
  const file = join(OUT, "sfx", `${id}.mp3`);
  if (existsSync(file)) return;
  const cue = SFX[id];
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": env("ELEVENLABS_API_KEY"),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: cue.prompt,
      duration_seconds: cue.seconds,
      loop: cue.loop ?? false,
    }),
  });
  if (!res.ok) throw new Error(`${id}: ${res.status} ${await res.text()}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log("sfx", id);
}

const dataUri = (path: string, type: string) =>
  `data:${type};base64,${readFileSync(path).toString("base64")}`;

async function fal(model: string, input: object) {
  const headers = {
    authorization: `Key ${env("FAL_KEY")}`,
    "content-type": "application/json",
  };
  const queued = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  if (!queued.ok) throw new Error(`${queued.status} ${await queued.text()}`);
  const { status_url, response_url } = await queued.json();
  for (;;) {
    await sleep(3000);
    const s = await (await fetch(status_url, { headers })).json();
    if (s.status === "COMPLETED") break;
    if (s.status !== "IN_QUEUE" && s.status !== "IN_PROGRESS")
      throw new Error(JSON.stringify(s));
  }
  // Large inline responses sometimes arrive cut short; the result keeps.
  for (let i = 0; ; i++) {
    try {
      return await (await fetch(response_url, { headers })).json();
    } catch (e) {
      if (i === 4) throw e;
      await sleep(3000);
    }
  }
}

const master = (id: string) => join(MASTERS, `${id}.jpg`);

async function still(shot: Shot) {
  const web = join(OUT, "shots", `${shot.id}.webp`);
  if (existsSync(web) || !shot.prompt) return;
  if (!existsSync(master(shot.id))) {
    const refs: string[] = [];
    if (shot.ines)
      refs.push(
        dataUri("public/last-signal/ines.webp", "image/webp"),
        dataUri("public/last-signal/ines-sheet.webp", "image/webp"),
      );
    for (const r of shot.refs ?? [])
      refs.push(dataUri(master(r), "image/jpeg"));
    const prompt = `${shot.prompt} ${STYLE_SUFFIX}${refs.length && !shot.ines ? " Match the set, palette and lighting of the reference images." : ""}`;
    const input = {
      prompt,
      aspect_ratio: "21:9",
      resolution: "2K",
      output_format: "jpeg",
      // fal's CDN is not reachable from every build box, so ask for the bytes inline.
      sync_mode: true,
      num_images: 1,
      ...(refs.length ? { image_urls: refs } : {}),
    };
    const out = await fal(
      refs.length ? "fal-ai/nano-banana-pro/edit" : "fal-ai/nano-banana-pro",
      input,
    );
    const url: string = out.images[0].url;
    writeFileSync(master(shot.id), Buffer.from(url.split(",")[1], "base64"));
  }
  execFileSync("convert", [
    master(shot.id),
    "-resize",
    "1920x",
    "-quality",
    "78",
    web,
  ]);
  console.log("shot", shot.id);
}

/** Shots wait for the shots they reference, and run in parallel otherwise. */
async function shots(only: string[]) {
  const done = new Map<string, Promise<void>>();
  const run = (s: Shot): Promise<void> => {
    if (!done.has(s.id))
      done.set(
        s.id,
        Promise.all(
          (s.refs ?? []).map((r) => run(SHOTS.find((x) => x.id === r)!)),
        ).then(() => still(s)),
      );
    return done.get(s.id)!;
  };
  const todo = only.length ? SHOTS.filter((s) => only.includes(s.id)) : SHOTS;
  const results = await Promise.allSettled(todo.map(run));
  for (const [i, r] of results.entries())
    if (r.status === "rejected") console.error(todo[i].id, r.reason);
}

async function inBatches<T>(items: T[], n: number, f: (t: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += n)
    await Promise.all(items.slice(i, i + n).map(f));
}

for (const d of ["lines", "sfx", "shots"])
  mkdirSync(join(OUT, d), { recursive: true });
mkdirSync(MASTERS, { recursive: true });

const [what, ...ids] = process.argv.slice(2);
if (!what || what === "lines") await inBatches(allLines(), 4, speak);
if (!what || what === "sfx") await inBatches(Object.keys(SFX), 4, sound);
if (!what || what === "shots") await shots(ids);
