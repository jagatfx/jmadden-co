/**
 * Uploads the Last Signal clips to Cloudflare Stream and records their video
 * ids in src/content/last-signal-stream.ts. Clips that already have an id are
 * skipped, so re-running only uploads what's new; delete an id to re-upload.
 *
 *   bun scripts/last-signal-stream.ts [clip ids...]
 *
 * Reads the encoded clips from CLIP_DIR (default public/last-signal/film/clips,
 * where scripts/last-signal.ts puts them). Needs CLOUDFLARE_ACCOUNT_ID and
 * CLOUDFLARE_STREAM_API_TOKEN (Account → Stream → Edit).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CLIPS } from "../src/content/last-signal-film";
import { STREAM_HOST, STREAM_IDS } from "../src/content/last-signal-stream";

const MAP = "src/content/last-signal-stream.ts";
const CLIP_DIR = process.env.CLIP_DIR ?? "public/last-signal/film/clips";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

const API = `https://api.cloudflare.com/client/v4/accounts/${env("CLOUDFLARE_ACCOUNT_ID")}/stream`;
const AUTH = { Authorization: `Bearer ${env("CLOUDFLARE_STREAM_API_TOKEN")}` };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cf(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(API + path, {
    ...init,
    headers: { ...AUTH, ...init.headers },
  });
  const body = await res.json();
  if (!body.success)
    throw new Error(
      `${path}: ${res.status} ${JSON.stringify([...body.errors, ...body.messages])}`,
    );
  return body.result;
}

/** Uploads one clip, then turns on its MP4 rendition, which the player plays. */
async function upload(id: string) {
  const file = join(CLIP_DIR, `${id}.mp4`);
  const form = new FormData();
  form.append("file", new Blob([readFileSync(file)]), `${id}.mp4`);
  const video = await cf("", { method: "POST", body: form });
  const uid: string = video.uid;
  await cf(`/${uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meta: { name: `last-signal ${id}` } }),
  });
  while (!(await cf(`/${uid}`)).readyToStream) await sleep(3000);
  await cf(`/${uid}/downloads`, { method: "POST" });
  while ((await cf(`/${uid}/downloads`)).default?.status !== "ready")
    await sleep(3000);
  const host = new URL(video.playback.hls).host;
  console.log("stream", id, uid);
  return { uid, host };
}

const only = process.argv.slice(2);
const ids = (only.length ? only : Object.keys(CLIPS)).filter(
  (id) => !STREAM_IDS[id],
);
const missing = ids.filter((id) => !existsSync(join(CLIP_DIR, `${id}.mp4`)));
if (missing.length)
  throw new Error(`no encoded clip for ${missing.join(", ")}`);

const uids = { ...STREAM_IDS };
let host = STREAM_HOST;
for (const id of ids) {
  const up = await upload(id);
  uids[id] = up.uid;
  host = up.host;
  // Written after every clip, so a failure partway keeps what's uploaded.
  const src = readFileSync(MAP, "utf8")
    .replace(/STREAM_HOST = ".*?";/, `STREAM_HOST = "${host}";`)
    .replace(
      /STREAM_IDS: Partial<Record<string, string>> = \{[^}]*\};/,
      `STREAM_IDS: Partial<Record<string, string>> = ${JSON.stringify(uids, null, 2)};`,
    );
  writeFileSync(MAP, src);
}
