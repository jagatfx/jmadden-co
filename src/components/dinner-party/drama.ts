import { SCRIPT, type LineId } from "@/content/dinner-party-script";
import type { Act, Reading, ReadContext, Topic } from "./read";

/**
 * The drama manager, after Façade's. Trip and Grace run beats on their own;
 * which beat comes next depends on the tension, on who the guest has been
 * siding with, and on what the guest has touched or said. The guest can cut
 * in at any moment by talking, moving, or handling something, and every
 * beat is written to be interrupted. Variants and the beat order are drawn
 * at random, so no two nights play the same.
 */

export type Who = "trip" | "grace";
export type Mark =
  | "door"
  | "center-t"
  | "center-g"
  | "bar"
  | "sideboard"
  | "painting"
  | "sofa-side"
  | "table"
  | "window";
export type Look =
  "guest" | Who | "painting" | "photo" | "phone" | "closet" | "door";
export type Spot =
  "door" | "closet" | "painting" | "sideboard" | "bar" | "sofa";
export type Held = "drink" | "photo" | "letter" | "phone" | "bottle" | null;
export type Ending =
  "honest" | "recommit" | "fracture" | "caught" | "out" | "left";

/** Something the guest did. */
export type Move =
  | { kind: "said"; text: string }
  | { kind: "knock" }
  | {
      kind: "take";
      prop: "photo" | "letter" | "phone" | "bottle" | "suitcase" | "painting";
    }
  | { kind: "drop" }
  | { kind: "sip" }
  | { kind: "give"; who: Who }
  | { kind: "hug"; who: Who }
  | { kind: "kiss"; who: Who }
  | { kind: "sit" }
  | { kind: "leave" }
  | { kind: "near"; spot: Spot }
  | { kind: "space"; who: Who }
  | { kind: "away" };

export type GuestView = {
  /** Metres to each of them. */
  dist: Record<Who, number>;
  at: Spot | null;
  held: Held;
  sitting: boolean;
};

/** What the stage does for the drama manager. */
export interface Cast {
  say(
    id: LineId,
    o: {
      mood?: string;
      gesture?: string;
      face?: string;
      look?: Look;
      signal: AbortSignal;
    },
  ): Promise<void>;
  react(who: Who, o: { mood?: string; face?: string; gesture?: string }): void;
  look(who: Who, at: Look): void;
  walk(who: Who, to: Mark): Promise<void>;
  sfx(id: string): void;
  door(id: LineId): Promise<void>;
  hand(held: Held): void;
  buzz(on: boolean): void;
  reveal(what: "phone" | "letter"): void;
  guest(): GuestView;
  read(text: string, ctx: ReadContext): Promise<Reading>;
  wait(ms: number, signal?: AbortSignal): Promise<void>;
}

export type State = {
  trust: Record<Who, number>;
  tension: number;
  strikes: number;
  flirts: number;
  secrets: Record<Who, boolean>;
  /** What the guest knows that one of them hasn't said. */
  knows: { money: boolean; lisbon: boolean };
  beat: string;
  beats: string[];
};

export type DramaEvents = {
  onState?: (s: State) => void;
  onHold?: (asking: string | null) => void;
  onHeard?: (text: string, r: Reading) => void;
  onEnd?: (e: Ending, s: State) => void;
};

class End extends Error {
  constructor(public ending: Ending) {
    super(ending);
  }
}

const pick = <T>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const other = (w: Who): Who => (w === "trip" ? "grace" : "trip");
const speaker = (id: LineId): Who =>
  SCRIPT[id].who === "TRIP" ? "trip" : "grace";

/** The middle of the night: beats the manager deals from. */
type BeatDef = {
  id: string;
  /** The tension range it plays best in. */
  band: [number, number];
  run: (d: Drama) => Promise<void>;
};

export class Drama {
  s: State = {
    trust: { trip: 0, grace: 0 },
    tension: 1,
    strikes: 0,
    flirts: 0,
    secrets: { trip: false, grace: false },
    knows: { money: false, lisbon: false },
    beat: "door",
    beats: [],
  };
  cast: Cast;
  ev: DramaEvents;
  private moves: Move[] = [];
  private wake: (() => void) | null = null;
  private holding: ((m: Move) => boolean) | null = null;
  private speaking: AbortController | null = null;
  private lastSpeaker: Who | null = null;
  private lastLine = "";
  private used = new Map<string, number>();
  private once = new Set<string>();
  private next: string | null = null;
  private crisis: Who | null = null;
  private quiet = 0;
  private ended = false;
  private buzzes = 0;

  constructor(cast: Cast, ev: DramaEvents = {}) {
    this.cast = cast;
    this.ev = ev;
  }

  /** The guest did something. */
  push(m: Move) {
    if (this.ended) return;
    // Proximity notices are dropped if one's already waiting.
    if (
      (m.kind === "near" || m.kind === "away" || m.kind === "space") &&
      this.moves.some((x) => x.kind === m.kind)
    )
      return;
    this.moves.push(m);
    // Saying or doing something stops whoever's talking, Façade-style.
    if (this.speaking && m.kind !== "near" && m.kind !== "away" && m.kind !== "space")
      this.speaking.abort();
    this.wake?.();
  }

  async run() {
    try {
      await this.arrival();
      await this.drinks();
      const pool = [...MIDDLE];
      let middles = 0;
      while (!this.crisis && middles < 4 && pool.length) {
        const b = this.choose(pool);
        pool.splice(pool.indexOf(b), 1);
        this.s.beat = b.id;
        this.s.beats.push(b.id);
        this.emit();
        await b.run(this);
        middles++;
        await this.between();
        if (this.s.tension >= 6 && middles >= 2) break;
      }
      await this.crisisBeat(
        this.crisis ??
          (this.s.trust.grace >= this.s.trust.trip ? "trip" : "grace"),
      );
      await this.between();
      await this.question();
    } catch (e) {
      if (!(e instanceof End)) throw e;
      await this.finish(e.ending);
    }
  }

  // ---------------------------------------------------------------- helpers

  emit() {
    this.ev.onState?.({ ...this.s, trust: { ...this.s.trust } });
  }

  shift(o: { trip?: number; grace?: number; tension?: number }) {
    this.s.trust.trip = clamp(this.s.trust.trip + (o.trip ?? 0), -3, 3);
    this.s.trust.grace = clamp(this.s.trust.grace + (o.grace ?? 0), -3, 3);
    this.s.tension = clamp(this.s.tension + (o.tension ?? 0), 0, 10);
    this.emit();
    if (this.s.tension >= 10) throw new End("fracture");
  }

  /**
   * One line. If the guest cuts in, it stops, they react, and the line is
   * picked up again if it had barely started.
   */
  async line(
    id: LineId,
    o: { mood?: string; gesture?: string; face?: string; look?: Look } = {},
  ) {
    await this.drain();
    for (let tries = 0; tries < 3; tries++) {
      const ac = new AbortController();
      this.speaking = ac;
      const who = speaker(id);
      const t0 = performance.now();
      await this.cast.say(id, { ...o, signal: ac.signal });
      this.speaking = null;
      this.lastSpeaker = who;
      this.lastLine = id;
      if (!ac.signal.aborted) return;
      const short = performance.now() - t0 < 1200;
      this.cast.react(who, { face: "😳" });
      await this.drain();
      if (!short) return;
      o = { ...o, gesture: undefined };
    }
  }

  /** Lines in order, each one interruptible. */
  async lines(...ids: LineId[]) {
    for (const id of ids) await this.line(id);
  }

  /** Handles anything the guest did, outside of a hold. */
  async drain() {
    while (this.moves.length) await this.mixin(this.moves.shift()!);
  }

  /**
   * Waits for the guest's answer. `take` decides which moves count as an
   * answer; everything else is handled as a cut-in while they wait.
   */
  async hold(
    asking: string,
    ms = 14000,
    take: (m: Move) => boolean = (m) => m.kind === "said",
  ): Promise<Move | null> {
    this.ev.onHold?.(asking);
    const deadline = performance.now() + ms;
    try {
      while (true) {
        const i = this.moves.findIndex(take);
        if (i >= 0) {
          const m = this.moves.splice(i, 1)[0];
          this.quiet = 0;
          return m;
        }
        if (this.moves.length) {
          await this.mixin(this.moves.shift()!);
          continue;
        }
        const left = deadline - performance.now();
        if (left <= 0) {
          this.quiet++;
          await this.silence();
          return null;
        }
        await new Promise<void>((r) => {
          const t = setTimeout(r, left);
          this.wake = () => {
            clearTimeout(t);
            r();
          };
        });
        this.wake = null;
      }
    } finally {
      this.ev.onHold?.(null);
    }
  }

  async readMove(m: Move | null, asking?: string): Promise<Reading | null> {
    if (!m || m.kind !== "said") return null;
    const r = await this.cast.read(m.text, {
      beat: this.s.beat,
      lastSpeaker: this.lastSpeaker,
      lastLine: this.lastLine,
      asking,
    });
    this.ev.onHeard?.(m.text, r);
    this.checkLimits(r);
    return r;
  }

  /** Lines that end the night whatever beat it is. */
  checkLimits(r: Reading) {
    if (r.act === "eject") throw new End("out");
    if (r.act === "insult") {
      this.s.strikes++;
      if (this.s.strikes >= 2) throw new End("out");
    }
    if (r.act === "flirt") {
      this.s.flirts++;
      if (this.s.flirts >= 2) throw new End("caught");
    }
  }

  /** Says a line at most `max` times a night; false if it's used up. */
  fresh(id: string, max = 1) {
    const n = this.used.get(id) ?? 0;
    if (n >= max) return false;
    this.used.set(id, n + 1);
    return true;
  }

  private onceOnly(key: string) {
    if (this.once.has(key)) return false;
    this.once.add(key);
    return true;
  }

  private choose(pool: BeatDef[]) {
    if (this.next) {
      const forced = pool.find((b) => b.id === this.next);
      this.next = null;
      if (forced) return forced;
    }
    // Weighted draw: beats suited to the current tension come up more.
    const t = this.s.tension;
    const w = pool.map(
      (b) => (t >= b.band[0] && t <= b.band[1] ? 3 : 1) * (0.6 + Math.random()),
    );
    return pool[w.indexOf(Math.max(...w))];
  }

  /** Between beats, the couple fills the silence, often with a jab. */
  private async between() {
    await this.drain();
    await this.cast.wait(600 + Math.random() * 900);
    await this.drain();
    if (this.s.tension >= 3 && Math.random() < 0.7) {
      const pairs: [LineId, LineId][] = [
        ["f-g1", "f-t1"],
        ["f-t2", "f-g2"],
        ["f-g3", "f-t3"],
        ["f-t4", "f-g4"],
      ];
      const fresh = pairs.filter(([a]) => !this.used.has(a));
      if (fresh.length) {
        const [a, b] = pick(fresh);
        this.used.set(a, 1);
        this.cast.look(speaker(a), other(speaker(a)));
        await this.line(a, { mood: "angry" });
        this.cast.look(speaker(b), other(speaker(b)));
        await this.line(b, { mood: "angry" });
        this.cast.look("trip", "guest");
        this.cast.look("grace", "guest");
        this.shift({ tension: 1 });
      }
    }
    // Trip's phone goes off now and then once the drinks are poured.
    if (!this.s.secrets.trip && this.buzzes < 3 && Math.random() < 0.55) {
      this.buzzes++;
      this.cast.buzz(true);
      this.cast.react("trip", { face: "😳" });
      this.cast.look("trip", "phone");
      await this.cast.wait(1600);
      this.cast.buzz(false);
      this.cast.look("trip", "guest");
      if (this.buzzes === 2) {
        this.cast.look("grace", "trip");
        await this.line("ph-g1", { mood: "neutral" });
        this.cast.look("grace", "guest");
        this.shift({ tension: 1 });
      }
    }
  }

  /** Answers a silent hold. */
  private async silence() {
    const id: LineId | null =
      this.quiet === 1 && this.fresh("x-quiet-g")
        ? "x-quiet-g"
        : this.quiet === 2 && this.fresh("x-quiet-t")
          ? "x-quiet-t"
          : null;
    if (id) await this.line(id);
    if (this.quiet >= 3) this.shift({ tension: 1 });
  }

  // ---------------------------------------------------------- the cut-ins

  /** What happens when the guest does something mid-beat. */
  async mixin(m: Move) {
    const g = this.cast.guest();
    switch (m.kind) {
      case "said": {
        const r = await this.readMove(m);
        if (r) await this.answer(r);
        return;
      }
      case "hug": {
        const w = m.who;
        this.cast.react(w, { mood: "happy", face: "🙂" });
        if (this.fresh(`x-hug-${w[0]}`))
          await this.line(w === "trip" ? "x-hug-t" : "x-hug-g");
        this.shift({ [w]: 0.5, tension: -0.5 });
        if (w === "grace" && g.dist.trip < 3 && this.fresh("x-hug-jealous-t")) {
          this.cast.look("trip", "guest");
          await this.line("x-hug-jealous-t");
        }
        return;
      }
      case "kiss": {
        const w = m.who;
        this.cast.react(w, { face: "😳" });
        this.cast.react(other(w), { mood: "angry", face: "😠" });
        this.s.flirts++;
        if (this.s.flirts >= 2) throw new End("caught");
        await this.line(w === "trip" ? "x-kiss-t" : "x-kiss-g");
        this.shift({ [other(w)]: -1, tension: 2 });
        return;
      }
      case "take":
        return this.touched(m.prop);
      case "drop":
        if (g.held === "drink" && this.fresh("x-putdown-t")) {
          this.cast.react("trip", { face: "😐" });
          await this.line("x-putdown-t");
        }
        this.cast.hand(null);
        return;
      case "sip":
        this.cast.react("trip", { mood: "happy", face: "😄" });
        if (this.fresh("x-sip-t")) {
          await this.line("x-sip-t");
          this.shift({ trip: 0.3 });
        }
        return;
      case "give":
        this.cast.hand(null);
        if (m.who === "grace") {
          this.cast.react("grace", { mood: "happy", face: "🙂" });
          await this.line("x-give-g");
          this.cast.react("trip", { face: "😐" });
          await this.line("x-give-t");
          this.shift({ grace: 0.5, trip: -0.3 });
        } else {
          this.cast.react("trip", { mood: "happy", face: "😄" });
          await this.line("x-thanks-t");
        }
        return;
      case "sit":
        if (this.fresh("x-sit-g"))
          await this.line("x-sit-g", { mood: "happy" });
        return;
      case "leave":
        throw new End("left");
      case "knock":
        return;
      case "near":
        if (m.spot === "door" && this.fresh("x-leave-t")) {
          this.cast.react("trip", { face: "😳" });
          await this.line("x-leave-t");
        }
        if (
          m.spot === "closet" &&
          !this.s.secrets.grace &&
          this.fresh("x-away-g")
        ) {
          this.cast.look("grace", "guest");
          await this.line("x-away-g");
        }
        return;
      case "space": {
        const id = m.who === "trip" ? "x-space-t" : "x-space-g";
        if (this.fresh(id)) {
          this.cast.react(m.who, { face: "😳" });
          await this.line(id);
        }
        return;
      }
      case "away": {
        const who: Who = g.dist.trip < g.dist.grace ? "trip" : "grace";
        const id = who === "trip" ? "x-away-t" : "x-away-g";
        if (this.fresh(id)) await this.line(id);
        return;
      }
    }
  }

  private async touched(
    prop: "photo" | "letter" | "phone" | "bottle" | "suitcase" | "painting",
  ) {
    switch (prop) {
      case "photo":
        this.cast.hand("photo");
        if (!this.s.beats.includes("venice")) {
          this.next = "venice";
          this.cast.react("trip", { mood: "happy", face: "😄" });
        } else if (this.fresh("x-photo-g")) {
          this.cast.react("grace", { face: "🙄" });
          await this.line("x-photo-g");
        }
        return;
      case "bottle":
        this.cast.hand("bottle");
        if (this.fresh("x-bottle-t"))
          await this.line("x-bottle-t", { gesture: "handup" });
        return;
      case "painting":
        this.cast.react("grace", { mood: "happy" });
        this.shift({ grace: 0.3 });
        if (!this.s.beats.includes("painting")) {
          this.next = "painting";
          if (this.fresh("x-painting-g")) await this.line("x-painting-g");
        }
        return;
      case "phone":
        this.cast.hand("phone");
        this.cast.reveal("phone");
        this.s.knows.money = true;
        if (!this.s.secrets.trip) {
          this.cast.react("trip", { face: "😳", mood: "fear" });
          await this.line("ph-t1");
          await this.line("ph-t2");
          this.cast.hand(null);
          this.crisis = this.crisis ?? "trip";
        }
        return;
      case "letter":
        this.cast.hand("letter");
        this.cast.reveal("letter");
        this.s.knows.lisbon = true;
        if (!this.s.secrets.grace && this.cast.guest().dist.grace < 3.5) {
          this.cast.react("grace", { face: "😳", mood: "fear" });
          this.cast.look("grace", "guest");
        }
        return;
      case "suitcase":
        if (!this.s.secrets.grace && this.fresh("su-g1")) {
          this.cast.react("grace", { face: "😳", mood: "fear" });
          this.cast.look("grace", "closet");
          this.cast.look("trip", "closet");
          await this.lines("su-g1", "su-t1", "su-g2");
          this.cast.look("grace", "guest");
          this.cast.look("trip", "grace");
          this.shift({ tension: 1 });
          this.crisis = this.crisis ?? "grace";
        }
        return;
    }
  }

  /** The couple's answer to something said, by what kind of move it was. */
  async answer(r: Reading) {
    const { act } = r;
    const target: Who | null =
      r.target === "trip" || r.target === "grace" ? r.target : null;
    // Sore points come first: they change the night.
    if (await this.sore(r.topics)) return;
    switch (act) {
      case "insult": {
        const w = target ?? this.lastSpeaker ?? "trip";
        this.cast.react(w, { mood: "angry", face: "😠" });
        this.cast.react(other(w), { face: "😳" });
        await this.line(w === "trip" ? "x-insult-t" : "x-insult-g");
        this.shift({ [w]: -1.5, tension: 1 });
        return;
      }
      case "flirt": {
        const w = target ?? "grace";
        if (w === "grace") {
          this.cast.react("grace", { face: "😳", mood: "happy" });
          this.cast.react("trip", { face: "😐" });
          await this.lines("x-flirt-g-g", "x-flirt-g-t");
        } else {
          this.cast.react("trip", { mood: "happy", face: "😄" });
          this.cast.react("grace", { face: "🙄" });
          await this.lines("x-flirt-t-t", "x-flirt-t-g");
        }
        this.shift({ [w]: 0.5, [other(w)]: -1, tension: 1 });
        return;
      }
      case "praise":
      case "agree": {
        const w = target ?? this.lastSpeaker;
        if (!w) return this.ack(null);
        this.cast.react(w, { mood: "happy", face: "🙂" });
        this.cast.react(other(w), { face: "🙄" });
        if (w === "trip" && this.fresh("x-praise-t", 2))
          await this.lines("x-praise-t", "x-praise-t-g");
        else if (w === "grace" && this.fresh("x-praise-g", 2))
          await this.lines("x-praise-g", "x-praise-g-t");
        this.shift({ [w]: 0.8, [other(w)]: -0.4, tension: 0.5 });
        return;
      }
      case "criticize":
      case "disagree": {
        const w = target ?? this.lastSpeaker;
        if (!w) return this.ack(null);
        this.cast.react(w, { mood: "sad", face: "😠" });
        this.cast.react(other(w), { face: "😏" });
        if (w === "trip" && this.fresh("x-crit-t", 2))
          await this.lines("x-crit-t", "x-crit-t-g");
        else if (w === "grace" && this.fresh("x-crit-g", 2))
          await this.lines("x-crit-g", "x-crit-g-t");
        this.shift({ [w]: -0.8, [other(w)]: 0.4, tension: 1 });
        return;
      }
      case "calm":
        this.cast.react("trip", { face: "😳" });
        if (this.fresh("x-calm-t", 2)) await this.lines("x-calm-t", "x-calm-g");
        this.shift({ tension: -1 });
        return;
      case "sorry":
        this.cast.react("grace", { mood: "neutral", face: "🙂" });
        if (this.fresh("x-sorry-g", 2)) await this.line("x-sorry-g");
        this.shift({ tension: -0.5 });
        return;
      case "thank":
        this.cast.react("trip", { mood: "happy", face: "😄" });
        if (this.fresh("x-thanks-t", 2)) await this.line("x-thanks-t");
        return;
      case "greet":
        if (this.fresh("x-hi-t")) await this.line("x-hi-t");
        else this.cast.react("trip", { face: "😄" });
        return;
      case "leave":
        this.cast.react("trip", { face: "😳" });
        if (this.fresh("x-leave-t", 2)) await this.line("x-leave-t");
        return;
      case "question":
        if (this.fresh(`x-question-${(target ?? "trip")[0]}`))
          await this.line(target === "grace" ? "x-question-g" : "x-question-t");
        else this.ack(target);
        return;
      default:
        return this.ack(target);
    }
  }

  /** Acknowledges something without taking it anywhere. */
  private async ack(target: Who | null) {
    const w = target ?? this.lastSpeaker ?? pick(["trip", "grace"] as const);
    const ids: LineId[] =
      w === "trip" ? ["x-ack-t", "x-ack-t2"] : ["x-ack-g", "x-ack-g2"];
    const id = ids.find((i) => this.fresh(i, 2));
    if (id) await this.line(id);
    else this.cast.react(w, { face: pick(["🙂", "😐"]) });
  }

  /** Topics that change the night. True if one was handled. */
  private async sore(topics: Topic[]) {
    if (
      topics.includes("lisbon") &&
      !this.s.secrets.grace &&
      this.onceOnly("lisbon")
    ) {
      this.cast.react("grace", { face: "😳", mood: "fear" });
      this.cast.look("trip", "grace");
      await this.lines("x-lisbon-g", "x-lisbon-t");
      this.shift({ tension: 2 });
      this.crisis = this.crisis ?? "grace";
      return true;
    }
    if (
      topics.includes("money") &&
      (this.s.knows.money || this.s.beats.includes("sofa")) &&
      !this.s.secrets.trip &&
      this.onceOnly("money")
    ) {
      this.cast.react("trip", { face: "😳", mood: "fear" });
      this.cast.look("grace", "trip");
      await this.lines("x-money-t", "x-money-g");
      this.shift({ tension: 2 });
      this.crisis = this.crisis ?? "trip";
      return true;
    }
    if (topics.includes("divorce") && this.onceOnly("divorce")) {
      this.cast.react("trip", { face: "😳" });
      this.cast.react("grace", { mood: "sad" });
      await this.lines("x-divorce-t", "x-divorce-g");
      this.shift({ tension: 2 });
      return true;
    }
    if (topics.includes("therapy") && this.onceOnly("therapy")) {
      await this.lines("x-therapy-g", "x-therapy-t");
      this.shift({ tension: 1 });
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------- fixed beats

  private async arrival() {
    this.s.beat = "door";
    await this.cast.door("d-g1");
    await this.cast.door("d-t1");
    await this.cast.door("d-g2");
    await this.cast.door("d-t2");
    // Waits for the knock (or for the guest to go home).
    const knock = await this.hold(
      "knock",
      600000,
      (m) => m.kind === "knock" || m.kind === "leave",
    );
    if (knock?.kind === "leave") throw new End("left");
    this.cast.sfx("knock");
    await this.cast.wait(900);
    await this.cast.door("d-t3");
    await this.cast.door("d-g3");
    await this.cast.wait(500);
    this.cast.sfx("door-open");
    this.s.beat = "arrival";
    this.emit();
    this.cast.look("trip", "guest");
    this.cast.look("grace", "guest");
    await this.line(pick(["a-t1", "a-t1b"] as const), {
      mood: "happy",
      gesture: "handup",
    });
    this.cast.walk("trip", "center-t");
    void this.cast.walk("grace", "center-g");
    await this.cast.wait(700);
    await this.line(pick(["a-g1", "a-g1b"] as const), { mood: "happy" });
    await this.line("a-t2", { mood: "happy" });
    if (Math.random() < 0.7) {
      this.cast.look("grace", "trip");
      await this.line("a-g2");
      this.cast.react("trip", { face: "😳" });
      await this.line("a-t3", { look: "guest" });
      this.cast.look("grace", "guest");
      this.shift({ tension: 1 });
    }
  }

  private async drinks() {
    this.s.beat = "drinks";
    this.s.beats.push("drinks");
    this.emit();
    void this.cast.walk("trip", "bar");
    await this.line("k-g1", { look: "trip" });
    this.cast.look("grace", "guest");
    const asking = "What can I get you?";
    await this.line(pick(["k-t1", "k-t1b"] as const), { look: "guest" });
    const m = await this.hold(
      asking,
      14000,
      (x) => x.kind === "said" || (x.kind === "take" && x.prop === "bottle"),
    );
    const r = m?.kind === "said" ? await this.readMove(m, asking) : null;
    const stance: "strong" | "water" | "other" =
      m?.kind === "take" || r?.topics.includes("drink-strong")
        ? "strong"
        : r?.topics.includes("drink-soft")
          ? "water"
          : "other";
    if (r && (r.act === "insult" || r.act === "flirt" || r.act === "eject"))
      await this.answer(r);
    else if (stance === "strong") {
      this.cast.react("trip", { mood: "happy", face: "😄" });
      this.cast.react("grace", { face: "🙄" });
      await this.line("k-strong-t", { gesture: "thumbup" });
      await this.line("k-strong-g");
      this.shift({ trip: 1, grace: -0.3 });
    } else if (stance === "water") {
      this.cast.react("grace", { mood: "happy", face: "🙂" });
      await this.line("k-water-g");
      this.cast.react("trip", { face: "😐" });
      await this.line("k-water-t", { gesture: "shrug" });
      this.shift({ grace: 1, trip: -0.3 });
    } else await this.line("k-other-t", { gesture: "index" });
    this.cast.sfx("pour");
    await this.line("k-t2", { look: "grace" });
    await this.line("k-g2");
    if (Math.random() < 0.6) {
      await this.line("k-t3", { look: "guest" });
      await this.line("k-g3", { look: "trip" });
      this.cast.look("grace", "guest");
      this.shift({ tension: 1 });
    }
    // Trip brings it over.
    await this.cast.walk("trip", "center-t");
    this.cast.hand("drink");
    await this.line("k-hand-t", { mood: "happy" });
  }

  // ---------------------------------------------------------- the crisis

  private async crisisBeat(who: Who) {
    this.s.beat = `secret-${who}`;
    this.s.beats.push(this.s.beat);
    this.emit();
    this.shift({ tension: 1 });
    if (who === "trip") {
      this.cast.buzz(true);
      this.cast.look("grace", "phone");
      await this.cast.wait(1200);
      this.cast.buzz(false);
      this.cast.look("grace", "trip");
      await this.line("s-t-g1", { mood: "angry" });
      await this.line("s-t-t1", { look: "grace" });
      await this.line("s-t-g2", { mood: "angry" });
      await this.line("s-t-t2", { mood: "fear", look: "guest" });
      this.cast.look("grace", "guest");
      const asking = "Press him, or cover for him?";
      const m = await this.hold(asking, 15000);
      const r = await this.readMove(m, asking);
      const press =
        !!r &&
        (r.topics.includes("money") ||
          r.act === "question" ||
          (r.target === "trip" &&
            (r.act === "criticize" || r.act === "disagree")) ||
          (r.target === "grace" && (r.act === "agree" || r.act === "praise")));
      if (press || this.s.knows.money) {
        this.cast.react("trip", { mood: "sad" });
        await this.line("s-t-press-t", { mood: "angry" });
        this.cast.react("grace", { face: "😳", mood: "fear" });
        await this.line("s-t-press-g");
        await this.line("s-t-press-t2", { mood: "sad" });
        this.s.secrets.trip = true;
        this.shift({ tension: 2, grace: 0.5 });
        if (this.s.trust.grace >= 0 && !this.s.secrets.grace) {
          await this.cast.wait(900);
          await this.line("s-g-confess", { mood: "sad" });
          await this.line("s-g-confess2", { mood: "sad" });
          this.cast.react("trip", { face: "😳", mood: "fear" });
          await this.line("s-g-confess-t");
          this.s.secrets.grace = true;
          this.shift({ tension: 1 });
        }
      } else {
        await this.line("s-t-cover-g", { mood: "angry" });
        await this.line("s-t-cover-t");
        this.shift({ trip: 1, grace: -1, tension: 1 });
      }
    } else {
      await this.cast.walk("trip", "table");
      this.cast.look("trip", "grace");
      await this.line("s-g-t1");
      this.cast.react("grace", { face: "😳", mood: "fear" });
      await this.line("s-g-g1", { look: "trip" });
      await this.line("s-g-t2", { mood: "angry" });
      await this.line("s-g-g2", { mood: "angry" });
      this.cast.look("trip", "guest");
      this.cast.look("grace", "guest");
      const asking = "Defend her, or side with him?";
      const m = await this.hold(asking, 15000);
      const r = await this.readMove(m, asking);
      const condemn =
        !!r &&
        ((r.target === "grace" &&
          (r.act === "criticize" ||
            r.act === "disagree" ||
            r.act === "insult")) ||
          (r.target === "trip" && (r.act === "agree" || r.act === "praise")));
      this.s.secrets.grace = true;
      if (condemn) {
        this.cast.react("grace", { mood: "angry", face: "😠" });
        await this.line("s-g-condemn-g");
        await this.line("s-g-condemn-t");
        this.shift({ grace: -2, tension: 3 });
      } else {
        await this.line("s-g-defend-t", { mood: "sad" });
        await this.line("s-g-defend-g");
        this.shift({ grace: r ? 1 : 0, tension: 1 });
        if (this.s.trust.trip >= 0 && !this.s.secrets.trip) {
          await this.cast.wait(900);
          await this.line("s-t-confess", { mood: "sad" });
          await this.line("s-t-confess2", { mood: "sad" });
          this.cast.react("grace", { face: "😳" });
          await this.line("s-t-confess-g");
          this.s.secrets.trip = true;
          this.shift({ tension: 1 });
        }
      }
    }
  }

  private async question() {
    this.s.beat = "question";
    this.s.beats.push("question");
    this.emit();
    this.cast.walk("trip", "center-t");
    await this.cast.walk("grace", "center-g");
    this.cast.look("trip", "guest");
    this.cast.look("grace", "guest");
    await this.line("q-g1", { mood: "sad" });
    await this.line("q-t1", { mood: "sad" });
    await this.line("q-g2", { mood: "sad" });
    const asking = "Should we still be doing this?";
    const m = await this.hold(asking, 20000);
    const r = await this.readMove(m, asking);
    const s = this.s;
    let ending: Ending;
    if (r && (r.act === "disagree" || r.topics.includes("divorce")))
      ending = "fracture";
    else if (r && (r.act === "agree" || r.act === "praise" || r.act === "calm"))
      ending =
        s.secrets.trip &&
        s.secrets.grace &&
        s.trust.trip >= 0 &&
        s.trust.grace >= 0 &&
        s.tension < 8
          ? "honest"
          : "recommit";
    else ending = s.tension >= 6 ? "fracture" : "recommit";
    throw new End(ending);
  }

  // ---------------------------------------------------------- endings

  private async finish(e: Ending) {
    this.ended = true;
    this.moves = [];
    this.speaking?.abort();
    this.s.beat = `end-${e}`;
    this.emit();
    const say = async (
      id: LineId,
      o: { mood?: string; face?: string; gesture?: string } = {},
    ) => {
      const ac = new AbortController();
      await this.cast.say(id, { ...o, signal: ac.signal });
    };
    this.cast.look("trip", "guest");
    this.cast.look("grace", "guest");
    switch (e) {
      case "honest":
        await say("e-honest-g", { mood: "happy" });
        await say("e-honest-t", { mood: "love" });
        await say("e-honest-g2", { mood: "happy", face: "😄" });
        await say("e-honest-t2", { mood: "happy", face: "😄" });
        await say("e-honest-g3", { mood: "happy" });
        break;
      case "recommit":
        this.cast.look("grace", "trip");
        await say("e-recommit-g", { mood: "sad" });
        this.cast.look("trip", "grace");
        await say("e-recommit-t", { mood: "love" });
        this.cast.look("grace", "closet");
        this.cast.look("trip", "guest");
        await say("e-recommit-t2", { mood: "happy" });
        break;
      case "fracture":
        this.cast.look("grace", "trip");
        await say("e-fracture-g", { mood: "sad" });
        await say("e-fracture-g2", { mood: "sad" });
        void this.cast.walk("grace", "door");
        await say("e-fracture-t", { mood: "fear" });
        await this.cast.wait(1800);
        this.cast.sfx("door-shut");
        await this.cast.wait(1200);
        this.cast.look("trip", "guest");
        await say("e-fracture-t2", { mood: "sad" });
        break;
      case "caught":
        await say("e-caught-t", { face: "😳" });
        await say("e-caught-g", { mood: "disgust", face: "😠" });
        await say("e-caught-t2", { mood: "angry", gesture: "index" });
        break;
      case "out":
        await say("e-out-t", { mood: "angry" });
        await say("e-out-g", { mood: "disgust" });
        this.cast.sfx("door-shut");
        await this.cast.door("e-out-door-g");
        await this.cast.door("e-out-door-t");
        break;
      case "left":
        if (this.s.beat !== "door") {
          this.cast.react("trip", { face: "😳" });
          await say("e-left-t", { mood: "fear" });
        }
        this.cast.sfx("door-shut");
        await this.cast.door("e-left-door-g");
        await this.cast.door("e-left-door-t");
        break;
    }
    this.ev.onEnd?.(e, this.s);
  }
}

// ---------------------------------------------------------------- beats

const MIDDLE: BeatDef[] = [
  {
    id: "painting",
    band: [0, 4],
    async run(d) {
      const c = d.cast;
      if (Math.random() < 0.6) {
        // Grace shows you herself, and watches whether you come.
        await c.walk("grace", "painting");
        c.look("grace", "guest");
        await d.line("p-g0", { mood: "happy" });
        c.look("grace", "painting");
        const came = await d.hold(
          "Go and look at the painting",
          9000,
          (m) => m.kind === "near" && m.spot === "painting",
        );
        if (came) {
          d.shift({ grace: 0.6 });
          await d.line("p-near-g", { mood: "happy" });
        } else {
          d.shift({ grace: -0.5 });
          c.look("grace", "guest");
          await d.line("p-far-g", { mood: "sad" });
        }
        c.look("trip", "painting");
        await d.line("p-t2", { look: "guest" });
        await d.line("p-g1", { mood: "sad", look: "trip" });
        await d.line("p-t3");
      } else {
        // Trip shows it off for her.
        await d.line("p-t1", { mood: "happy", gesture: "index" });
        c.look("trip", "painting");
        await d.line("p-t2");
        c.react("grace", { face: "😐" });
        await d.line("p-g1", { mood: "sad" });
        await d.line("p-t3");
      }
      c.look("grace", "guest");
      c.look("trip", "guest");
      const asking = "What do you see when you look at it?";
      await d.line("p-g2");
      const m = await d.hold(asking, 15000);
      const r = await d.readMove(m, asking);
      const g = c.guest();
      // Standing beside her as you answer counts for something too.
      if (g.dist.grace + 0.8 < g.dist.trip) d.shift({ grace: 0.3 });
      const love =
        r && (r.act === "praise" || (r.act === "agree" && r.target !== "trip"));
      const hate =
        r &&
        (r.act === "criticize" ||
          r.act === "insult" ||
          (r.target === "trip" && r.act === "agree"));
      if (r && (r.act === "flirt" || r.act === "insult")) await d.answer(r);
      if (love) {
        c.react("grace", { mood: "happy", face: "🙂" });
        await d.line("p-love-g");
        c.react("trip", { face: "😳" });
        await d.line("p-love-t", { look: "grace" });
        await d.line("p-love-g2", { look: "trip" });
        d.shift({ grace: 1, trip: -0.5, tension: 1 });
      } else if (hate) {
        c.react("trip", { mood: "happy", face: "😄" });
        await d.line("p-hate-t");
        c.react("grace", { mood: "sad", face: "😠" });
        await d.line("p-hate-g");
        d.shift({ trip: 1, grace: -1, tension: 2 });
      } else {
        await d.line("p-meh-g");
        await d.line("p-meh-t", { mood: "happy" });
      }
      if (d.s.tension >= 3) {
        await d.line("p-g3", { look: "painting" });
        await d.line("p-t4", { look: "guest" });
        d.shift({ tension: 1 });
      }
      c.look("grace", "guest");
    },
  },
  {
    id: "venice",
    band: [2, 6],
    async run(d) {
      const c = d.cast;
      const found = c.guest().held === "photo";
      if (found) {
        c.look("trip", "guest");
        await d.line("v-found-t", { mood: "happy", gesture: "index" });
      } else {
        await c.walk("trip", "sideboard");
        c.look("trip", "photo");
        await d.line("v-t1", { mood: "happy" });
        c.look("trip", "guest");
        await c.walk("trip", "center-t");
      }
      await d.line("v-t2", { mood: "love" });
      c.look("grace", "trip");
      await d.line("v-g1", { look: "guest" });
      await d.line("v-t3", { look: "grace", mood: "angry" });
      await d.line("v-g2");
      await d.line("v-t4", { mood: "sad" });
      await d.line("v-g3");
      await d.line("v-t5", { look: "guest", gesture: "shrug" });
      // An argument: whoever you stand nearer reads it as taking sides.
      const g = c.guest();
      if (Math.abs(g.dist.trip - g.dist.grace) > 0.8)
        d.shift(
          g.dist.trip < g.dist.grace
            ? { trip: 0.4, grace: -0.2 }
            : { grace: 0.4, trip: -0.2 },
        );
      await d.line("v-g4", { mood: "angry", look: "trip" });
      await d.line("v-t6", { look: "guest" });
      await d.line("v-g5", { look: "trip" });
      d.shift({ tension: 1 });
      c.look("grace", "guest");
      c.look("trip", "guest");
      const asking = "Who's being unfair here?";
      await d.line("v-g6");
      const m = await d.hold(asking, 15000);
      const r = await d.readMove(m, asking);
      const forGrace =
        r &&
        ((r.target === "grace" && (r.act === "agree" || r.act === "praise")) ||
          (r.target === "trip" &&
            (r.act === "criticize" || r.act === "insult")));
      const forTrip =
        r &&
        ((r.target === "trip" && (r.act === "agree" || r.act === "praise")) ||
          (r.target === "grace" &&
            (r.act === "criticize" || r.act === "insult")));
      if (r && (r.act === "flirt" || r.act === "insult")) await d.answer(r);
      if (forGrace) {
        c.react("trip", { mood: "angry", face: "😠" });
        await d.line("v-grace-t");
        await d.line("v-grace-g", { mood: "happy" });
        d.shift({ grace: 1, trip: -1, tension: 2 });
      } else if (forTrip) {
        c.react("grace", { mood: "sad", face: "🙄" });
        await d.line("v-trip-g");
        await d.line("v-trip-t", { mood: "sad" });
        d.shift({ trip: 1, grace: -1, tension: 2 });
      } else {
        await d.line("v-both-g");
        await d.line("v-both-t");
        d.shift({ tension: -1 });
      }
    },
  },
  {
    id: "sofa",
    band: [1, 5],
    async run(d) {
      const c = d.cast;
      await c.walk("grace", "sofa-side");
      c.look("grace", "guest");
      await d.line("r-g1");
      await d.line("r-t1", { look: "grace" });
      await d.line("r-g2", { look: "trip" });
      await d.line("r-t2", { gesture: "index" });
      c.look("grace", "guest");
      const asking = "What do you think of the sofa?";
      await d.line("r-g3");
      const m = await d.hold(
        asking,
        14000,
        (x) => x.kind === "said" || x.kind === "sit",
      );
      if (m?.kind === "sit") {
        // Sitting on it is an answer of sorts.
        await d.line("r-like-t", { mood: "happy" });
        await d.line("r-like-g");
        d.shift({ trip: 0.5 });
        return;
      }
      const r = await d.readMove(m, asking);
      if (r && (r.act === "flirt" || r.act === "insult")) await d.answer(r);
      const act: Act | null = r?.act ?? null;
      if (act === "praise" || act === "agree") {
        await d.line("r-like-t", { mood: "happy" });
        await d.line("r-like-g");
        d.shift({ trip: 0.8, grace: -0.5 });
      } else if (act === "criticize" || act === "disagree") {
        c.react("grace", { mood: "happy", face: "😄" });
        await d.line("r-hate-g");
        await d.line("r-hate-t", { mood: "angry" });
        c.react("grace", { face: "😳" });
        // The first crack in Trip's story.
        await d.line("r-hate-g2", { look: "trip" });
        c.react("trip", { face: "😳", mood: "fear" });
        d.s.knows.money = true;
        d.shift({ grace: 0.8, trip: -0.5, tension: 2 });
      } else {
        await d.line("r-meh-t");
        await d.line("r-meh-g", { mood: "sad" });
      }
      c.look("grace", "guest");
      c.look("trip", "guest");
    },
  },
  {
    id: "proposal",
    band: [2, 7],
    async run(d) {
      const c = d.cast;
      c.look("trip", "guest");
      await d.line("w-t1", { mood: "happy" });
      c.react("grace", { face: "😳" });
      await d.line("w-g1", { look: "trip" });
      await d.line("w-t2", { gesture: "handup" });
      await d.line("w-g2", { look: "guest" });
      await d.line("w-t3", { mood: "love", look: "grace" });
      await d.line("w-g3", { look: "guest" });
      const asking = "Romantic, or what?";
      await d.line("w-t4", { mood: "happy", look: "guest" });
      const m = await d.hold(asking, 14000);
      const r = await d.readMove(m, asking);
      if (r && (r.act === "flirt" || r.act === "insult")) await d.answer(r);
      if (r && (r.act === "agree" || r.act === "praise")) {
        c.react("trip", { mood: "happy", face: "😄" });
        await d.line("w-yes-t");
        await d.line("w-yes-g");
        d.shift({ trip: 1, grace: -0.5, tension: 1 });
      } else if (r && (r.act === "disagree" || r.act === "criticize")) {
        c.react("grace", { mood: "happy", face: "😄" });
        await d.line("w-no-g");
        c.react("trip", { mood: "angry", face: "😠" });
        await d.line("w-no-t");
        d.shift({ grace: 1, trip: -1, tension: 2 });
      } else d.shift({ tension: 1 });
    },
  },
];

export const ENDINGS: Record<Ending, { title: string; line: string }> = {
  honest: {
    title: "Honest",
    line: "Everything came out, and they stayed for dinner.",
  },
  recommit: {
    title: "Recommit",
    line: "They're trying again. The suitcase is still packed.",
  },
  fracture: {
    title: "Fracture",
    line: "Grace took the suitcase. Trip poured two drinks.",
  },
  caught: { title: "Caught", line: "For once, they agreed on something: you." },
  out: {
    title: "Thrown out",
    line: "Through the door, you can hear them laughing about you.",
  },
  left: { title: "You left", line: "Behind the door, they started again." },
};
