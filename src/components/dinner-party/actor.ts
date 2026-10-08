import * as THREE from "three";
import type { TalkingHead } from "@met4citizen/talkinghead";

/**
 * Moves a TalkingHead avatar around the room. TalkingHead owns the face,
 * gaze, gestures and standing pose; this adds what it lacks: walking between
 * marks with a procedural gait, and turning the body to face whoever the
 * actor is playing to.
 */

const SPEED = 0.85; // metres per second
const STRIDE = 0.62; // metres per full gait cycle
const TURN = 2.4; // radians per second

export type Facing = THREE.Object3D | THREE.Vector3 | null;

type Bones = Record<
  | "Hips"
  | "LeftUpLeg"
  | "LeftLeg"
  | "LeftFoot"
  | "RightUpLeg"
  | "RightLeg"
  | "RightFoot"
  | "LeftArm"
  | "RightArm"
  | "LeftForeArm"
  | "RightForeArm"
  | "LeftHand"
  | "RightHand"
  | "Spine",
  THREE.Object3D
>;

export class Actor {
  head: TalkingHead;
  root: THREE.Object3D;
  /** What the body turns toward when standing still. */
  facing: Facing = null;
  private bones: Bones;
  private path: THREE.Vector2[] = [];
  private arrive: (() => void) | null = null;
  private phase = 0;
  private stepping = 0; // 0..1, eases the gait in and out
  private turning = 0;
  /** 0..1: how far both arms are open and reaching forward, for a hug. */
  reach = 0;
  /** 0..1: the right hand out to take something. */
  take = 0;

  constructor(head: TalkingHead) {
    this.head = head;
    this.root = head.armature;
    const get = (n: string) => this.root.getObjectByName(n)!;
    this.bones = Object.fromEntries(
      [
        "Hips",
        "LeftUpLeg",
        "LeftLeg",
        "LeftFoot",
        "RightUpLeg",
        "RightLeg",
        "RightFoot",
        "LeftArm",
        "RightArm",
        "LeftForeArm",
        "RightForeArm",
        "LeftHand",
        "RightHand",
        "Spine",
      ].map((n) => [n, get(n)]),
    ) as Bones;
  }

  get pos() {
    return new THREE.Vector2(this.root.position.x, this.root.position.z);
  }

  get walking() {
    return this.path.length > 0;
  }

  place(x: number, z: number, yaw = 0) {
    this.root.position.set(x, 0, z);
    this.root.rotation.y = yaw;
  }

  /** Walks through each waypoint in turn; resolves on arrival. */
  walk(...to: [number, number][]): Promise<void> {
    this.arrive?.();
    this.path = to.map(([x, z]) => new THREE.Vector2(x, z));
    return new Promise((r) => (this.arrive = r));
  }

  stop() {
    this.path = [];
    this.arrive?.();
    this.arrive = null;
  }

  /** Call after head.animate(), before rendering. */
  update(dt: number) {
    const r = this.root;
    let moving = false;
    let wantYaw: number | null = null;
    if (this.path.length) {
      const target = this.path[0];
      const d = target.clone().sub(this.pos);
      const len = d.length();
      if (len < 0.04) {
        this.path.shift();
        if (!this.path.length) {
          this.arrive?.();
          this.arrive = null;
        }
      } else {
        wantYaw = Math.atan2(d.x, d.y);
        // Don't stride off sideways: turn most of the way first.
        const off = Math.abs(angleDiff(wantYaw, r.rotation.y));
        const step = Math.min(len, SPEED * dt * (off > 1.2 ? 0.15 : 1));
        d.normalize().multiplyScalar(step);
        r.position.x += d.x;
        r.position.z += d.y;
        this.phase += (step / STRIDE) * Math.PI * 2;
        moving = true;
      }
    } else if (this.facing) {
      const p =
        this.facing instanceof THREE.Vector3
          ? this.facing
          : this.facing.getWorldPosition(new THREE.Vector3());
      const yaw = Math.atan2(p.x - r.position.x, p.z - r.position.z);
      // People don't square up exactly; only turn once it's well off.
      const off = angleDiff(yaw, r.rotation.y);
      if (Math.abs(off) > (this.turning ? 0.12 : 0.6)) wantYaw = yaw;
    }
    if (wantYaw !== null) {
      const off = angleDiff(wantYaw, r.rotation.y);
      const turn = Math.sign(off) * Math.min(Math.abs(off), TURN * dt);
      r.rotation.y += turn;
      this.turning = Math.abs(off) > 0.12 ? 1 : 0;
      // Turning in place shuffles the feet.
      if (!moving && this.turning) this.phase += Math.abs(turn) * 2.2;
    } else this.turning = 0;

    const active = moving || this.turning > 0;
    this.stepping += ((active ? 1 : 0) - this.stepping) * Math.min(1, dt * 6);
    this.gait(this.stepping);
    this.arms();
  }

  /** Blends the arms toward a hug or an open hand, over TalkingHead's pose. */
  private arms() {
    const b = this.bones;
    const hug = this.reach;
    const take = this.take * (1 - hug);
    if (hug < 0.01 && take < 0.01) return;
    this.root.updateMatrixWorld(true);
    if (hug >= 0.01) {
      this.point(b.RightArm, b.RightForeArm, HUG.rightArm, hug);
      this.point(b.RightForeArm, b.RightHand, HUG.rightFore, hug);
      this.point(b.LeftArm, b.LeftForeArm, mirror(HUG.rightArm), hug);
      this.point(b.LeftForeArm, b.LeftHand, mirror(HUG.rightFore), hug);
    }
    if (take >= 0.01) {
      this.point(b.RightArm, b.RightForeArm, TAKE.rightArm, take);
      this.point(b.RightForeArm, b.RightHand, TAKE.rightFore, take);
    }
  }

  /**
   * Turns a bone so the segment to its child points along dir (given in the
   * actor's own frame: +z ahead, -x to their right), blended by k.
   */
  private point(
    bone: THREE.Object3D,
    child: THREE.Object3D,
    dir: V3,
    k: number,
  ) {
    const from = bone.getWorldPosition(new THREE.Vector3());
    const cur = child
      .getWorldPosition(new THREE.Vector3())
      .sub(from)
      .normalize();
    const want = new THREE.Vector3(...dir)
      .normalize()
      .applyQuaternion(this.root.getWorldQuaternion(new THREE.Quaternion()));
    const turn = new THREE.Quaternion().setFromUnitVectors(cur, want);
    const parent = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
    const world = bone.getWorldQuaternion(new THREE.Quaternion());
    const local = parent.invert().multiply(turn.multiply(world));
    bone.quaternion.slerp(local, k);
    bone.updateMatrixWorld(true);
  }

  /** Layers a walk cycle on whatever pose TalkingHead set this frame. */
  private gait(k: number) {
    if (k < 0.01) return;
    const b = this.bones;
    const s = Math.sin(this.phase);
    const c = Math.cos(this.phase);
    const lift = (v: number) => Math.max(0, v);
    b.LeftUpLeg.rotateX(-0.34 * s * k);
    b.RightUpLeg.rotateX(0.34 * s * k);
    // Knees bend on the swing, not the plant.
    b.LeftLeg.rotateX(0.6 * lift(c) * k);
    b.RightLeg.rotateX(0.6 * lift(-c) * k);
    b.LeftFoot.rotateX(0.2 * s * k);
    b.RightFoot.rotateX(-0.2 * s * k);
    // Arms swing against the legs; the hips sway and bob.
    b.LeftArm.rotateX(0.22 * s * k);
    b.RightArm.rotateX(-0.22 * s * k);
    b.Hips.rotateY(0.08 * s * k);
    b.Spine.rotateY(-0.1 * s * k);
    b.Hips.position.y += 0.012 * Math.abs(c) * k;
  }
}

type V3 = [number, number, number];
const mirror = ([x, y, z]: V3): V3 => [-x, y, z];
// Where each arm segment points, in the actor's frame. A hug: upper arms out
// and forward at chest height, forearms wrapping in. A take: the right hand
// held out, palm-height.
const HUG: { rightArm: V3; rightFore: V3 } = {
  rightArm: [-0.6, -0.15, 0.8],
  rightFore: [0.45, 0.05, 0.9],
};
const TAKE: { rightArm: V3; rightFore: V3 } = {
  rightArm: [-0.15, -0.45, 0.88],
  rightFore: [0, 0.1, 1],
};

export function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
