import * as THREE from "three";

/**
 * Runs the camera like an editor. Every setup is a named shot built off the
 * actors' heads, so coverage stays framed wherever they stand; cuts are hard,
 * and between cuts a slow push and a little handheld breath keep it alive.
 */

export type ShotName =
  "pov" | "two" | "trip" | "grace" | "tripOts" | "graceOts";

type Rig = {
  eye: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  focus: THREE.Vector3;
};

export class Director {
  camera: THREE.PerspectiveCamera;
  shot: ShotName = "pov";
  private since = 0;
  private t = 0;
  private from = new THREE.Vector3();
  private heads: Record<"trip" | "grace", THREE.Object3D>;
  /** Where the guest stands: the actors play to this point. */
  guest: THREE.Vector3;

  constructor(
    aspect: number,
    heads: Record<"trip" | "grace", THREE.Object3D>,
    guest: THREE.Vector3,
  ) {
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.05, 60);
    this.heads = heads;
    this.guest = guest;
  }

  cut(shot: ShotName) {
    if (shot === this.shot && this.since < 99) return;
    this.shot = shot;
    this.since = 0;
  }

  private head(who: "trip" | "grace") {
    return this.heads[who]
      .getWorldPosition(new THREE.Vector3())
      .add(new THREE.Vector3(0, 0.06, 0));
  }

  private rig(): Rig {
    const trip = this.head("trip");
    const grace = this.head("grace");
    const mid = trip.clone().lerp(grace, 0.5);
    const g = this.guest;
    switch (this.shot) {
      case "pov":
        return {
          eye: g.clone(),
          look: mid.clone().add(new THREE.Vector3(0, -0.3, 0)),
          fov: 30,
          focus: mid,
        };
      case "two": {
        const eye = g
          .clone()
          .lerp(mid, 0.25)
          .add(new THREE.Vector3(0.25, -0.1, 0));
        return {
          eye,
          look: mid.clone().add(new THREE.Vector3(0, -0.15, 0)),
          fov: 30,
          focus: mid,
        };
      }
      case "trip":
      case "grace": {
        const h = this.shot === "trip" ? trip : grace;
        // A single from just off the guest's eyeline, on a long lens.
        const toGuest = g.clone().sub(h).setY(0).normalize();
        const side = new THREE.Vector3(-toGuest.z, 0, toGuest.x).multiplyScalar(
          this.shot === "trip" ? -0.18 : 0.18,
        );
        const eye = h
          .clone()
          .add(toGuest.multiplyScalar(1.55))
          .add(side)
          .add(new THREE.Vector3(0, -0.03, 0));
        return {
          eye,
          look: h.clone().add(new THREE.Vector3(0, -0.05, 0)),
          fov: 17,
          focus: h,
        };
      }
      case "tripOts":
      case "graceOts": {
        // Over the other actor's shoulder.
        const [h, o] = this.shot === "tripOts" ? [trip, grace] : [grace, trip];
        const dir = h.clone().sub(o).setY(0).normalize();
        const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.28);
        const eye = o
          .clone()
          .sub(dir.clone().multiplyScalar(0.55))
          .add(side)
          .add(new THREE.Vector3(0, 0.02, 0));
        return {
          eye,
          look: h.clone().add(new THREE.Vector3(0, -0.04, 0)),
          fov: 24,
          focus: h,
        };
      }
    }
  }

  /** Returns the focus distance for depth of field. */
  update(dt: number): number {
    this.t += dt;
    this.since += dt;
    const r = this.rig();
    // Slow push-in over the life of a shot.
    const push = Math.min(this.since / 12, 1) * 0.12;
    const eye = r.eye.clone().lerp(r.look, push);
    // Handheld: a few incommensurate sines, smaller on long lenses.
    const amp = (r.fov / 40) * 0.006;
    const n = (f: number, p: number) => Math.sin(this.t * f + p);
    eye.x += amp * (n(0.9, 0) + 0.5 * n(2.3, 1.7));
    eye.y += amp * (n(0.7, 2.1) + 0.4 * n(1.9, 0.3));
    const look = r.look.clone();
    look.x += amp * 0.8 * n(0.6, 4);
    look.y += amp * 0.8 * n(0.8, 5);
    this.camera.position.copy(eye);
    this.camera.fov = r.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(look);
    this.from.copy(eye);
    return eye.distanceTo(r.focus);
  }
}
