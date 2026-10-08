import * as THREE from "three";

/**
 * The guest's body: a first-person camera that walks the room. Arrow keys or
 * WASD walk, dragging looks around, and a click on the floor walks there
 * (the way you get around on a phone). Keys are ignored while typing.
 */

const EYE = 1.62;
const SEATED = 1.12;
const SPEED = 1.35;
const RADIUS = 0.25;
const ROOM = { x0: -4.65, x1: 4.65, z0: -2.3, z1: 4.15 };

export class Guest {
  camera: THREE.PerspectiveCamera;
  pos = new THREE.Vector2(1.2, 3.75);
  yaw = 0; // facing into the room (-z)
  pitch = -0.05;
  sitting = false;
  /** Set when the guest walks somewhere by clicking. */
  goal: THREE.Vector2 | null = null;
  frozen = true;
  /** Set while the body is doing something (a hug, a sip): no walking. */
  busy = false;
  /** Where the head has moved to for an action, added to the eye. */
  lean = new THREE.Vector3();
  /** A point the view is held on during an action. */
  gaze: THREE.Vector3 | null = null;
  private goalTime = 0;
  private keys = new Set<string>();
  private bob = 0;
  private eye = EYE;
  private dragging: { x: number; y: number; moved: number } | null = null;
  private dom: HTMLElement;
  private onClick: (ndc: THREE.Vector2) => void;
  private cleanup: (() => void)[] = [];

  constructor(dom: HTMLElement, onClick: (ndc: THREE.Vector2) => void) {
    this.dom = dom;
    this.onClick = onClick;
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 60);
    const typing = () => {
      const a = document.activeElement;
      return a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement;
    };
    const down = (e: KeyboardEvent) => {
      if (typing()) return;
      const k = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(k)
      ) {
        this.keys.add(k);
        this.goal = null;
        if (this.sitting) this.stand();
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    const blur = () => this.keys.clear();
    const pdown = (e: PointerEvent) => {
      this.dragging = { x: e.clientX, y: e.clientY, moved: 0 };
      dom.setPointerCapture(e.pointerId);
    };
    const pmove = (e: PointerEvent) => {
      const d = this.dragging;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.moved += Math.abs(dx) + Math.abs(dy);
      d.x = e.clientX;
      d.y = e.clientY;
      const k = 0.0042 * (e.pointerType === "touch" ? 1.4 : 1);
      this.yaw -= dx * k;
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -1.1, 0.9);
    };
    const pup = (e: PointerEvent) => {
      const d = this.dragging;
      this.dragging = null;
      if (!d || d.moved > 8) return;
      const r = dom.getBoundingClientRect();
      this.onClick(
        new THREE.Vector2(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          -((e.clientY - r.top) / r.height) * 2 + 1,
        ),
      );
    };
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    addEventListener("blur", blur);
    dom.addEventListener("pointerdown", pdown);
    dom.addEventListener("pointermove", pmove);
    dom.addEventListener("pointerup", pup);
    this.cleanup.push(
      () => removeEventListener("keydown", down),
      () => removeEventListener("keyup", up),
      () => removeEventListener("blur", blur),
      () => dom.removeEventListener("pointerdown", pdown),
      () => dom.removeEventListener("pointermove", pmove),
      () => dom.removeEventListener("pointerup", pup),
    );
  }

  get moving() {
    return this.keys.size > 0 || this.goal !== null;
  }

  sit(x: number, z: number, yaw: number) {
    this.sitting = true;
    this.goal = null;
    this.pos.set(x, z);
    this.yaw = yaw;
  }

  /** Walks to a point on the floor. */
  go(x: number, z: number) {
    if (this.sitting) this.stand();
    this.goal = new THREE.Vector2(x, z);
    this.goalTime = 0;
  }

  stand() {
    this.sitting = false;
    this.pos.y += 0.6; // step forward off the sofa
  }

  /** Turns smoothly toward a point, for moments the film wants you to see. */
  lookToward(p: THREE.Vector3, k = 1) {
    const yaw = Math.atan2(-(p.x - this.pos.x), -(p.z - this.pos.y));
    let d = yaw - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += d * k;
  }

  update(
    dt: number,
    blocks: [number, number, number, number][],
    people: THREE.Vector2[],
  ) {
    if (!this.frozen && !this.sitting && !this.busy) {
      const f = new THREE.Vector2(-Math.sin(this.yaw), -Math.cos(this.yaw));
      const r = new THREE.Vector2(-f.y, f.x);
      const v = new THREE.Vector2();
      const k = this.keys;
      if (k.has("w") || k.has("arrowup")) v.add(f);
      if (k.has("s") || k.has("arrowdown")) v.sub(f);
      if (k.has("a")) v.sub(r);
      if (k.has("d")) v.add(r);
      if (k.has("arrowleft")) this.yaw += 1.8 * dt;
      if (k.has("arrowright")) this.yaw -= 1.8 * dt;
      if (this.goal) {
        const d = this.goal.clone().sub(this.pos);
        this.goalTime += dt;
        // Never walk at a click for longer than it should take.
        if (d.length() < 0.08 || this.goalTime > 1.5 + d.length() / SPEED)
          this.goal = null;
        else {
          v.copy(d.normalize());
          // Ease the view round toward where you're heading.
          const yaw = Math.atan2(-d.x, -d.y);
          let dy = yaw - this.yaw;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          this.yaw += dy * Math.min(1, dt * 3);
        }
      }
      if (v.lengthSq() > 0) {
        const before = this.pos.clone();
        this.pos.add(v.normalize().multiplyScalar(SPEED * dt));
        this.collide(blocks, people);
        this.bob += before.distanceTo(this.pos) * 9;
        // Walked into something, or sliding round someone without getting
        // closer: give up on the click target.
        if (
          this.goal &&
          (before.distanceTo(this.pos) < SPEED * dt * 0.2 ||
            this.goal.distanceTo(this.pos) >
              this.goal.distanceTo(before) - SPEED * dt * 0.1)
        )
          this.goal = null;
      }
    }
    this.eye +=
      ((this.sitting ? SEATED : EYE) - this.eye) * Math.min(1, dt * 4);
    const c = this.camera;
    c.position.set(
      this.pos.x,
      this.eye + Math.sin(this.bob) * 0.012,
      this.pos.y,
    );
    c.position.add(this.lean);
    if (this.gaze) {
      const d = this.gaze.clone().sub(c.position);
      const yaw = Math.atan2(-d.x, -d.z);
      const pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      let dy = yaw - this.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      const k = Math.min(1, dt * 5);
      this.yaw += dy * k;
      this.pitch += (pitch - this.pitch) * k;
    }
    c.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  private collide(
    blocks: [number, number, number, number][],
    people: THREE.Vector2[],
  ) {
    const p = this.pos;
    p.x = THREE.MathUtils.clamp(p.x, ROOM.x0, ROOM.x1);
    p.y = THREE.MathUtils.clamp(p.y, ROOM.z0, ROOM.z1);
    for (const [x0, z0, x1, z1] of blocks) {
      const a = x0 - RADIUS;
      const b = x1 + RADIUS;
      const c = z0 - RADIUS;
      const d = z1 + RADIUS;
      if (p.x > a && p.x < b && p.y > c && p.y < d) {
        const out = [p.x - a, b - p.x, p.y - c, d - p.y];
        const m = Math.min(...out);
        if (m === out[0]) p.x = a;
        else if (m === out[1]) p.x = b;
        else if (m === out[2]) p.y = c;
        else p.y = d;
      }
    }
    for (const q of people) {
      const d = p.clone().sub(q);
      const min = 0.42;
      if (d.length() < min) p.copy(q).add(d.normalize().multiplyScalar(min));
    }
  }

  dispose() {
    for (const f of this.cleanup) f();
  }
}
