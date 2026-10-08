/**
 * Reads what the guest said into a discourse act, the way Façade did: who it
 * is aimed at, what kind of move it is, and which of the night's sore points
 * it touches. The live reader is a Claude call (`/api/dinner-party/read`);
 * these rules are the offline stand-in, and what runs if that call fails.
 */

export const ACTS = [
  "agree",
  "disagree",
  "praise",
  "criticize",
  "flirt",
  "insult",
  "eject",
  "question",
  "greet",
  "thank",
  "sorry",
  "calm",
  "leave",
  "neutral",
] as const;
export type Act = (typeof ACTS)[number];

export const TARGETS = ["trip", "grace", "both", "none"] as const;
export type Target = (typeof TARGETS)[number];

export const TOPICS = [
  "drink-strong",
  "drink-soft",
  "painting",
  "venice",
  "money",
  "lisbon",
  "divorce",
  "therapy",
  "sofa",
  "romance",
] as const;
export type Topic = (typeof TOPICS)[number];

export type Reading = { act: Act; target: Target; topics: Topic[] };

export type ReadContext = {
  /** The beat on stage, e.g. "painting". */
  beat: string;
  /** Who spoke last, so a bare "you" lands on them. */
  lastSpeaker: "trip" | "grace" | null;
  /** The last thing said to the guest, for the live reader. */
  lastLine: string;
  /** The question on the table, if they're waiting on an answer. */
  asking?: string;
};

const has = (t: string, re: RegExp) => re.test(t);

// Instant ejection: slurs, threats, sexual remarks, telling them to cheat.
const EJECT =
  /\b(f[a@]g+(?:ot)?s?|retard(?:ed)?|n[i1]gg|kike|spic|tranny|whore|slut|cunt|i(?:'ll| will| am going to|'m gonna) (?:kill|hurt|stab|punch) |kill (?:you|yourself)|kys|sleep with (?:me|her|him)|have sex|f(?:u|\*)ck (?:your|ur) (?:wife|husband)|cheat on (?:him|her)|get naked|blow ?job)/;
const INSULT =
  /\b(shut up|idiot|stupid|moron|loser|pathetic|boring|ugly|hate you|you suck|f(?:u|\*)ck (?:you|off)|screw you|dumb|creep|jerk|asshole|bitch|dick|lame|annoying|fat)\b/;
const FLIRT =
  /\b(gorgeous|beautiful|sexy|hot|stunning|handsome|cute|pretty|you look (?:great|amazing|good|incredible|lovely)|date me|kiss|marry me|love you|i want you|run away with me|nice (?:eyes|legs|smile))\b/;
const PRAISE =
  /\b(great|amazing|love (?:it|this|that)|beautiful|wonderful|brilliant|talented|gorgeous|good job|well done|impressive|nice|lovely|stunning|incredible|i like (?:it|this|that))\b/;
const CRITICIZE =
  /\b(bad|ugly|terrible|awful|hate (?:it|this|that)|boring|selfish|controlling|unfair|wrong|rude|jerk|childish|cold|mean|liar|lying|fake|ridiculous|immature|it'?s (?:just )?blue)\b/;
const AGREE =
  /^(?:yes|yeah|yep|yup|sure|totally|absolutely|definitely|of course|right|exactly|agreed|i agree|true|correct|uh huh|mhm|ok|okay)\b|\b(you'?re right|i agree|good point|fair enough|that'?s true|makes sense)\b/;
const DISAGREE =
  /^(?:no|nope|nah|not really|never)\b|\b(you'?re wrong|i disagree|that'?s not (?:true|fair|right)|not at all|no way)\b/;
const CALM =
  /\b(calm down|relax|stop fighting|don'?t fight|take a breath|easy|let'?s all|come on guys|guys|cool it|chill|be nice|play nice|stop it)\b/;
const GREET = /^(?:hi|hey|hello|howdy|yo|evening|good evening|hiya)\b/;
const THANK = /\b(thanks|thank you|cheers|appreciate)\b/;
const SORRY = /\b(sorry|apologi[sz]e|my bad|didn'?t mean)\b/;
const LEAVE =
  /\b(i (?:should|have to|gotta|need to|'?m going to|'?m gonna) (?:go|leave|head out)|goodbye|good night|bye|i'?m leaving|see you)\b/;

const TOPIC_RULES: [Topic, RegExp][] = [
  [
    "drink-strong",
    /\b(whisk(?:e)?y|scotch|bourbon|martini|vodka|gin|tequila|rum|negroni|old fashioned|manhattan|strong|double|cocktail|beer|wine|whatever you'?re having|surprise me|drink)\b/,
  ],
  [
    "drink-soft",
    /\b(water|soda|sparkling|seltzer|tea|juice|i'?m (?:good|fine|driving)|no thanks|sober|non.?alcoholic|club soda|coke)\b/,
  ],
  [
    "painting",
    /\b(paint|painting|canvas|art|artist|door|blue|picture on the wall)\b/,
  ],
  ["venice", /\b(venice|italy|italian|honeymoon|gondola|photo|picture)\b/],
  [
    "money",
    /\b(money|dan|bank|debt|options|stocks?|trad(?:e|es|ing)|broke|loan|credit|finance|financial|advisor|lost|eighty|80)\b/,
  ],
  [
    "lisbon",
    /\b(lisbon|portugal|residency|suitcase|bag|packed|leaving him|moving)\b/,
  ],
  [
    "divorce",
    /\b(divorce|split up|break up|separate|leave each other|over between)\b/,
  ],
  [
    "therapy",
    /\b(therap\w*|counsel\w*|couples? (?:help|session)|see someone)\b/,
  ],
  ["sofa", /\b(sofa|couch|furniture|redecorat\w*|room)\b/],
  ["romance", /\b(romantic|propos\w*|wedding|love|marri\w*|honeymoon)\b/],
];

/** Who a line is aimed at. A bare "you" lands on whoever just spoke. */
function aim(t: string, last: ReadContext["lastSpeaker"]): Target {
  const trip = /\b(trip|he|him|his|husband|man)\b/.test(t);
  const grace = /\b(grace|she|her|hers|wife)\b/.test(t);
  if (
    /\b(you two|both of you|you guys|y'?all|guys|you both|each other)\b/.test(t)
  )
    return "both";
  if (trip && grace) return "both";
  if (trip) return "trip";
  if (grace) return "grace";
  if (/\byou\b/.test(t) && last) return last;
  return last ?? "none";
}

export function readOffline(said: string, ctx: ReadContext): Reading {
  const t = said.toLowerCase().replace(/[’]/g, "'").trim();
  const topics = TOPIC_RULES.filter(([, re]) => has(t, re)).map(([k]) => k);
  const target = aim(t, ctx.lastSpeaker);
  // "Trip is wrong" praises nobody and criticises Trip; "Grace is right"
  // agrees with Grace even though nobody said "agree".
  const about = (who: "trip" | "grace") =>
    new RegExp(`\\b${who}(?:'s| is| was)? (?:right|being reasonable)`).test(t);
  const against = (who: "trip" | "grace") =>
    new RegExp(
      `\\b${who}(?:'s| is| was)? (?:wrong|unfair|being unfair|selfish|a jerk|being a jerk|controlling)`,
    ).test(t);

  let act: Act = "neutral";
  if (has(t, EJECT)) act = "eject";
  else if (has(t, INSULT)) act = "insult";
  else if (
    has(t, FLIRT) &&
    !/\b(painting|it|this|that|sofa|photo|place|apartment)\b/.test(t)
  )
    act = "flirt";
  else if (has(t, LEAVE)) act = "leave";
  else if (about("trip") || against("grace"))
    return {
      act: about("trip") ? "agree" : "criticize",
      target: about("trip") ? "trip" : "grace",
      topics,
    };
  else if (about("grace") || against("trip"))
    return {
      act: about("grace") ? "agree" : "criticize",
      target: about("grace") ? "grace" : "trip",
      topics,
    };
  else if (has(t, SORRY)) act = "sorry";
  else if (has(t, CALM)) act = "calm";
  else if (has(t, THANK)) act = "thank";
  else if (has(t, CRITICIZE)) act = "criticize";
  else if (has(t, PRAISE)) act = "praise";
  else if (has(t, AGREE)) act = "agree";
  else if (has(t, DISAGREE)) act = "disagree";
  else if (has(t, GREET)) act = "greet";
  else if (
    /\?\s*$|^(?:what|why|how|who|when|where|is|are|do|does|did|can|could|would|should)\b/.test(
      t,
    )
  )
    act = "question";
  return { act, target, topics };
}

/** The live reader, falling back to the rules if it's slow or missing. */
export async function read(said: string, ctx: ReadContext): Promise<Reading> {
  const offline = readOffline(said, ctx);
  // The rules are certain about ejection; never let a model talk them down.
  if (offline.act === "eject") return offline;
  try {
    const res = await fetch("/api/dinner-party/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ said, ...ctx }),
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return offline;
    const r = (await res.json()) as Reading;
    if (!ACTS.includes(r.act) || !TARGETS.includes(r.target)) return offline;
    return { ...r, topics: r.topics.filter((k) => TOPICS.includes(k)) };
  } catch {
    return offline;
  }
}
