/**
 * The film's footage lives on Cloudflare Stream, not in the repo. Each clip in
 * CLIPS (last-signal-film.ts) is uploaded once by scripts/last-signal-stream.ts,
 * which writes its video id here. The player plays Stream's MP4 rendition, so a
 * plain <video> can seek it to stay on the audio clock.
 *
 * A clip with no id yet plays as its shot's still, over the same sound.
 */

/** The account's Stream delivery host, e.g. customer-abc123.cloudflarestream.com. */
export const STREAM_HOST = "customer-67f8p9vkxn3wfzgm.cloudflarestream.com";

/** Clip id → Stream video id. */
export const STREAM_IDS: Partial<Record<string, string>> = {
  "10": "a99301b68cb3aebf2f719361e80df3b1",
  "01": "5690c33611fb6694c634396e7e4517c5",
  "02": "0e02b901fe1d2b38e24d214a8ac8c5d5",
  "03": "7efb17069ca02ce0d42e230185a276cb",
  "03w": "c71ba7e9fc0031d7313882c71cc44f50",
  "04": "5408d838f7f21d0c1b5b5085e1580515",
  "04k": "c741d54e409ed26447d26fb6e4592b27",
  "05c": "c43e78271f8576edc8e112d5dc6754a4",
  "06": "472a97ede6987b2396df66f7cb91664d",
  "07": "f30d88b4dde0fc0792727eae4c0e051a",
  "08": "58d06c7028b70c79035963f11ba83529",
  "08s": "c983bf588502f3293312ce2d9025abe5",
  "09": "56f1f9d8e5f827ff3120caa1fa5a1c4a",
  "10c": "4c5ca4abbe917ed4918c9e9972b50dd4",
};

/** Where a clip's picture plays from, or undefined until it's on Stream. */
export function clipSrc(id: string) {
  const uid = STREAM_IDS[id];
  if (!uid || !STREAM_HOST) return undefined;
  return `https://${STREAM_HOST}/${uid}/downloads/default.mp4`;
}
