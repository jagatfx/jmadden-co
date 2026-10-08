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
  "14": "9ee1d9b68372b48ab94d1f55b9ca638d",
  "16": "113e360ad58a45c2f209d26f8636b5d1",
  "17": "124e6a4e22b5183f0e765a7b9a3b97b7",
  "18": "21da1435f8bb878bb893042e1619337b",
  "19": "ed05140e7ae384fc503341c3978cab45",
  "20": "7d701b1e60a8eecb65f5d4fb8c5a48cb",
  "21": "7b0cb4eb9c8dde2674e14faa0f657e0d",
  "22": "861a42c0b74c12176790d1e9596b2fb6",
  "02": "0e02b901fe1d2b38e24d214a8ac8c5d5",
  "03": "7efb17069ca02ce0d42e230185a276cb",
  "03w": "c71ba7e9fc0031d7313882c71cc44f50",
  "04": "5408d838f7f21d0c1b5b5085e1580515",
  "04k": "c741d54e409ed26447d26fb6e4592b27",
  "05c": "c43e78271f8576edc8e112d5dc6754a4",
  "06": "472a97ede6987b2396df66f7cb91664d",
  "07": "f30d88b4dde0fc0792727eae4c0e051a",
  "10c": "4c5ca4abbe917ed4918c9e9972b50dd4",
  "11A": "d9c5fb10c8de500e89de94b28b0441b6",
  "12A": "dac143ccc04333953886e6a2f3f86c1f",
  "13A": "87ebdbe8696ee4fe0deef4cd46fa03a1",
  "11B": "7e67f0feede858cc5302282cec137f4f",
  "12B": "b36086290aa2dba98a5cdcfe4b95a082",
  "13B": "c95add7dfe2a92b5383cb6b1388759cb",
  "01": "0839728511588f5cfa44f0a277c2c503",
  "08": "d032f43e131643aa72b17340ed9f3f18",
  "08s": "87a9f93aece68878ba5a48659f9ff908",
  "09": "edd879f72857b7d2192469adb36208e8",
};

/** Where a clip's picture plays from, or undefined until it's on Stream. */
export function clipSrc(id: string) {
  const uid = STREAM_IDS[id];
  if (!uid || !STREAM_HOST) return undefined;
  return `https://${STREAM_HOST}/${uid}/downloads/default.mp4`;
}
