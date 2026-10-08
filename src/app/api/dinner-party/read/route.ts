import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ACTS, TARGETS, TOPICS } from "@/components/dinner-party/read";

/**
 * Dinner Party's live reader: turns what the guest said into a discourse act.
 * Without ANTHROPIC_API_KEY it answers 503 and the page reads with its own
 * rules instead.
 */

const Reading = z.object({
  act: z.enum(ACTS),
  target: z.enum(TARGETS),
  topics: z.array(z.enum(TOPICS)),
});

const Body = z.object({
  said: z.string().min(1).max(400),
  beat: z.string().max(40),
  lastSpeaker: z.enum(["trip", "grace"]).nullable(),
  lastLine: z.string().max(400),
  asking: z.string().max(400).optional(),
});

const SYSTEM = `You read one line said by the guest in an interactive drama, the way Façade's parser did. Trip and Grace, a married couple in their late thirties, have their oldest friend (the guest) over for drinks. They are fighting under the surface. Trip secretly lost $80,000 on options trades (their advisor Dan keeps calling). Grace secretly accepted a year-long painting residency in Lisbon; her bag is packed.

Return the guest's move:
- act: agree, disagree, praise, criticize, flirt, insult, eject, question, greet, thank, sorry, calm (telling them to stop fighting or relax), leave (saying goodbye or that they're going), or neutral.
  - eject is only for slurs, threats, sexual remarks about either of them, or urging one of them to cheat.
  - insult is rudeness aimed at a person ("shut up", "you're pathetic"). Criticizing a thing or a choice is criticize.
  - flirt is romantic or physical interest in Trip or Grace, not praise of a thing.
  - A plain yes or no to the question on the table is agree or disagree.
- target: whose side the move lands on or who it's aimed at: trip, grace, both, or none. Siding with one of them against the other targets the one being sided with for agree/praise, and the one being attacked for criticize/insult.
- topics: any of the night's sore points the line touches.`;

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export async function POST(request: Request) {
  if (!client) return new Response("No reader configured", { status: 503 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return new Response("Bad request", { status: 400 });
  const b = body.data;
  const context = [
    `Beat: ${b.beat}`,
    b.lastSpeaker ? `Last line (${b.lastSpeaker}): "${b.lastLine}"` : null,
    b.asking ? `Question on the table: "${b.asking}"` : null,
    `The guest says: "${b.said}"`,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const res = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      output_config: { effort: "low", format: zodOutputFormat(Reading) },
      system: SYSTEM,
      messages: [{ role: "user", content: context }],
    });
    if (!res.parsed_output) return new Response("Unread", { status: 502 });
    return Response.json(res.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.APIError)
      return new Response(`Reader failed: ${error.status}`, { status: 502 });
    throw error;
  }
}
