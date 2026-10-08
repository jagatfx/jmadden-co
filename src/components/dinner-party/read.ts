/**
 * Reads what the guest said at the drinks hold. The film's live reader is a
 * Claude call; this is the offline stand-in the look test runs on.
 */
export type Stance = "strong" | "water" | "insult" | "flirt" | "other";

const RULES: [Stance, RegExp][] = [
  [
    "insult",
    /\b(shut up|idiot|stupid|loser|pathetic|boring|ugly|hate you|fuck|screw you|dumb|creep)/,
  ],
  [
    "flirt",
    /\b(gorgeous|beautiful|sexy|hot|stunning|handsome|cute|you look (?:great|amazing|good|incredible)|date me|kiss)/,
  ],
  [
    "water",
    /\b(water|soda|sparkling|seltzer|tea|juice|nothing|i'?m (?:good|fine|driving)|no thanks|sober|non.?alcoholic)/,
  ],
  [
    "strong",
    /\b(whisk(?:e)?y|scotch|bourbon|martini|vodka|gin|tequila|rum|negroni|old fashioned|manhattan|strong|double|whatever you'?re having|surprise me|wine|beer|cocktail|drink)/,
  ],
];

export function readDrink(said: string | null): Stance {
  if (!said) return "other";
  const t = said.toLowerCase().replace(/[’]/g, "'");
  for (const [stance, re] of RULES) if (re.test(t)) return stance;
  return "other";
}
