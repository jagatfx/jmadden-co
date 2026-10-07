import type { HoldId, Outcome } from "@/content/last-signal-film";

/**
 * Reads what the viewer said at a hold. This is the offline stand-in for the
 * live character agent: it finds which way they leaned, and how they said it.
 */

type Side = { outcome: Outcome; yes: RegExp; no: RegExp };

const NOT = String.raw`(?:don'?t|do not|never|no|not|stop)\s+(?:\w+\s+){0,2}`;

const SIDES: Partial<Record<HoldId, [Side, Side]>> = {
  greenhouse: [
    {
      outcome: "seal",
      yes: /\b(seal|close|shut|lock|stay (?:in|inside|put)|listen to arc|arc(?:'?s| is) right|(?:do what|trust) arc|safe|plants? (?:can|don'?t)|forget the (?:plants|tomatoes|garden))/,
      no: new RegExp(`${NOT}(?:seal|close|shut|lock)`),
    },
    {
      outcome: "outside",
      yes: /\b(outside|patch|go out|eva|space ?walk|fix|repair|suit up|save (?:the )?(?:plants|garden|tomatoes|greenhouse)|go for it)/,
      no: new RegExp(`${NOT}(?:go(?: out| outside)?|patch|risk)`),
    },
  ],
  arc: [
    {
      outcome: "hear",
      yes: /\b(let (?:it|him|her|arc)|hear|listen|talk|speak|explain|chance|put (?:it|arc) on|on the channel)/,
      no: new RegExp(`${NOT}(?:let|listen|trust|talk)`),
    },
    {
      outcome: "unplug",
      yes: /\b(pull|plug|shut (?:it |arc )?(?:down|off)|turn (?:it |arc )?off|kill|disconnect|switch (?:it )?off|fly (?:it )?yourself|manual|can'?t trust|don'?t trust)/,
      no: new RegExp(`${NOT}(?:pull|unplug|shut|turn)`),
    },
  ],
  final: [
    {
      outcome: "home",
      yes: /\b(home|burn|crew|teo|sun mei|dayo|alive|live|lives|people|family|survive|come back|save (?:yourself|them|you))/,
      no: new RegExp(`${NOT}(?:burn|go home|come home)`),
    },
    {
      outcome: "signal",
      yes: /\b(send|transmit|data|science|signal|found|worth|discover|mission|everything you found|tell them)/,
      no: new RegExp(`${NOT}(?:send|transmit)`),
    },
  ],
};

const WARM =
  /\b(you can|you'?ve got|i'?m here|i'?m with you|with you|we'?ll|together|it'?s okay|you'?re okay|breathe|trust you|i believe|got this|sorry|stay with|not alone|proud|brave)/;
const COLD =
  /\b(shut up|stupid|idiot|die|don'?t care|whatever|hate you|kill yourself|fuck|loser|who cares|boring)/;

export type Reading = {
  /** Which way they leaned, if they leaned. */
  outcome: Outcome | null;
  /** How much closer this brought Ines to trusting them, -2 to +2. */
  trust: number;
};

export function read(hold: HoldId, said: string | null): Reading {
  if (!said || !said.trim()) return { outcome: null, trust: -1 };
  const t = said.toLowerCase().replace(/[’]/g, "'");
  let trust = 0;
  if (WARM.test(t)) trust += 1;
  if (COLD.test(t)) trust -= 2;

  if (hold === "hello") return { outcome: "hello", trust: trust + 1 };

  const sides = SIDES[hold];
  if (!sides) return { outcome: null, trust };
  const [a, b] = sides;
  // "Don't seal it" counts for the other side.
  const score = (s: Side, other: Side) =>
    (s.yes.test(t) && !s.no.test(t) ? 2 : 0) + (other.no.test(t) ? 1 : 0);
  const sa = score(a, b);
  const sb = score(b, a);
  if (sa === sb) return { outcome: null, trust };
  return { outcome: sa > sb ? a.outcome : b.outcome, trust: trust + 1 };
}

/** Trust she needs by the last hold to follow your call instead of going quiet. */
export const TRUSTED = 2;
