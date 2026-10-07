/**
 * The film's footage lives on Cloudflare Stream, not in the repo. Each clip in
 * CLIPS (last-signal-film.ts) is uploaded once by scripts/last-signal-stream.ts,
 * which writes its video id here. The player plays Stream's MP4 rendition, so a
 * plain <video> can seek it to stay on the audio clock.
 *
 * A clip with no id yet plays as its shot's still, over the same sound.
 */

/** The account's Stream delivery host, e.g. customer-abc123.cloudflarestream.com. */
export const STREAM_HOST = "";

/** Clip id → Stream video id. */
export const STREAM_IDS: Partial<Record<string, string>> = {};

/** Where a clip's picture plays from, or undefined until it's on Stream. */
export function clipSrc(id: string) {
  const uid = STREAM_IDS[id];
  if (!uid || !STREAM_HOST) return undefined;
  return `https://${STREAM_HOST}/${uid}/downloads/default.mp4`;
}
