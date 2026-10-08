import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  SCRIPT,
  lineVoice,
  nameVoice,
  type LineId,
  type NameTone,
} from "@/content/dinner-party-script";

/**
 * Voices Dinner Party on demand. The first play that needs a line (or a
 * guest's name) has it recorded by ElevenLabs; the take and its word timings
 * are kept in a Netlify Blobs store, so every later play reuses it. Only the
 * script's own lines and plausible first names can be voiced, so the spend is
 * bounded by the script, not by visitors.
 */

type Timing = {
  words: string[];
  wtimes: number[];
  wdurations: number[];
  end: number;
};
type Take = Timing & { audio: string };

const MODEL = "eleven_v4";

async function store() {
  try {
    const s = getStore("dinner-party-voice");
    return {
      get: (k: string) => s.get(k, { type: "json" }) as Promise<Take | null>,
      set: (k: string, v: Take) => s.setJSON(k, v),
    };
  } catch {
    // Outside Netlify (local dev): a folder on disk.
    const dir = ".cache/dinner-party-voice";
    await mkdir(dir, { recursive: true });
    return {
      get: (k: string) =>
        readFile(`${dir}/${k}.json`, "utf8")
          .then((s) => JSON.parse(s) as Take)
          .catch(() => null),
      set: (k: string, v: Take) =>
        writeFile(`${dir}/${k}.json`, JSON.stringify(v)),
    };
  }
}

async function sha(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Buffer.from(d).toString("hex").slice(0, 32);
}

/** Character alignment to word timings, skipping [direction] tags. */
function words(a: {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}): Timing {
  const t: Timing = { words: [], wtimes: [], wdurations: [], end: 0 };
  let cur = "";
  let start = 0;
  let end = 0;
  let tag = false;
  const flush = () => {
    if (cur.trim()) {
      t.words.push(cur.trim());
      t.wtimes.push(Math.round(start * 1000));
      t.wdurations.push(Math.max(40, Math.round((end - start) * 1000)));
      t.end = end;
    }
    cur = "";
  };
  a.characters.forEach((c, i) => {
    if (c === "[") return void (tag = true);
    if (c === "]") return void (tag = false);
    if (tag) return;
    if (/\s/.test(c)) return flush();
    if (!cur) start = a.character_start_times_seconds[i];
    cur += c;
    end = a.character_end_times_seconds[i];
  });
  flush();
  return t;
}

async function record(voice: string, text: string): Promise<Take> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_96`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text, model_id: MODEL }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return {
    audio: j.audio_base64,
    ...words(j.normalized_alignment ?? j.alignment),
  };
}

/** The room's sounds, made the same way and kept in the same store. */
const SFX: Record<string, [string, number]> = {
  knock: [
    "three firm knocks on a wooden apartment front door, close up, dry",
    1.5,
  ],
  "door-open": [
    "an apartment front door unlatching and swinging open, wooden, indoors",
    1.5,
  ],
  "door-shut": [
    "an apartment front door closing firmly with a latch click, heard from the hallway",
    1.5,
  ],
  buzz: ["a smartphone vibrating twice on a wooden sideboard", 1.2],
  pour: [
    "ice cubes dropped into a glass then whiskey poured, at a home bar",
    2.5,
  ],
  clink: ["a cocktail glass set down on a glass shelf, gentle clink", 0.8],
  room: [
    "quiet city apartment room tone at night, distant traffic hum through closed windows, faint fridge hum, no voices",
    20,
  ],
};

async function effect(text: string, seconds: number): Promise<Take> {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text,
      duration_seconds: seconds,
      prompt_influence: 0.5,
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const audio = Buffer.from(await res.arrayBuffer()).toString("base64");
  return { audio, words: [], wtimes: [], wdurations: [], end: seconds };
}

// Two plays asking for the same new line at once share one recording.
const inflight = new Map<string, Promise<Take>>();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ take: string[] }> },
) {
  // Everything that picks the take is in the path, never the query: a CDN
  // that ignores query strings would otherwise hand every line the same take.
  const [kind, ...rest] = (await params).take.map(decodeURIComponent);
  let voice: string;
  let text: string;
  let make = () => record(voice, text);
  if (kind === "line") {
    const [line] = rest;
    if (!line || !(line in SCRIPT))
      return new Response("No such line", { status: 404 });
    ({ voice, text } = lineVoice(line as LineId));
  } else if (kind === "name") {
    const [who, tone, name] = rest;
    if (
      (who !== "THEO" && who !== "NINA") ||
      (tone !== "exclaim" && tone !== "address") ||
      !name
    )
      return new Response("Bad request", { status: 400 });
    const v = nameVoice(name, who, tone as NameTone);
    if (!v) return new Response("Not a name we'll say", { status: 422 });
    ({ voice, text } = v);
  } else if (kind === "sfx" && rest[0] && rest[0] in SFX) {
    const [prompt, seconds] = SFX[rest[0]];
    voice = "sfx";
    text = `${prompt}|${seconds}`;
    make = () => effect(prompt, seconds);
  } else return new Response("Bad request", { status: 400 });

  const key = await sha(`${MODEL}|${voice}|${text}`);
  const s = await store();
  let take = await s.get(key);
  if (!take) {
    if (!process.env.ELEVENLABS_API_KEY)
      return new Response("No voice configured", { status: 503 });
    let p = inflight.get(key);
    if (!p) {
      p = make().then(async (t) => {
        await s.set(key, t);
        return t;
      });
      inflight.set(key, p);
      p.finally(() => inflight.delete(key)).catch(() => {});
    }
    try {
      take = await p;
    } catch (e) {
      return new Response(String(e), { status: 502 });
    }
  }
  // The URL carries a hash of the text, so a take never changes under it.
  return Response.json(take, {
    headers: {
      "cache-control": "public, max-age=31536000, immutable",
      "netlify-vary": "query",
    },
  });
}
