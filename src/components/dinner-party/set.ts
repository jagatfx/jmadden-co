import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * Theo and Nina's loft, built in code: a wood floor, a wall of steel-framed
 * windows onto the city at dusk, Nina's new canvas over the sofa, the bar
 * cart, and the Venice photo on the sideboard. Lit by practicals the way a
 * DP would: warm pendants, a cool window, one shadow-casting key.
 */

const tex = (url: string) => {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

function woodFloor() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext("2d")!;
  const plank = 1024 / 8;
  for (let i = 0; i < 8; i++) {
    let y = -Math.random() * 400;
    while (y < 1024) {
      const len = 300 + Math.random() * 500;
      const l = 30 + Math.random() * 10;
      g.fillStyle = `hsl(28, 38%, ${l}%)`;
      g.fillRect(i * plank, y, plank, len);
      for (let k = 0; k < 40; k++) {
        g.strokeStyle = `hsla(25, 40%, ${l - 8 + Math.random() * 6}%, 0.35)`;
        g.lineWidth = 1 + Math.random() * 2;
        const x = i * plank + Math.random() * plank;
        g.beginPath();
        g.moveTo(x, y);
        g.bezierCurveTo(
          x + 6,
          y + len / 3,
          x - 6,
          y + (2 * len) / 3,
          x,
          y + len,
        );
        g.stroke();
      }
      g.fillStyle = "rgba(0,0,0,0.55)";
      g.fillRect(i * plank, y, plank, 2);
      g.fillRect(i * plank, y, 2, len);
      y += len;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.anisotropy = 8;
  return t;
}

const std = (
  color: THREE.ColorRepresentation,
  roughness = 0.8,
  metalness = 0,
) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  r = 0.02,
) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export type PropId =
  | "photo"
  | "painting"
  | "phone"
  | "letter"
  | "suitcase"
  | "door"
  | "sofa"
  | "bottles";

export type BuiltSet = {
  /** Lamps that slowly warm up as the night goes on. */
  pendants: THREE.PointLight[];
  window: THREE.DirectionalLight;
  /** Things the guest can pick up, look at, sit on or walk out of. */
  props: Record<PropId, THREE.Object3D>;
  /** Furniture footprints on the floor (x0, z0, x1, z1), for walking. */
  blocks: [number, number, number, number][];
  /** The phone's screen, lit when it buzzes. */
  phoneScreen: THREE.MeshStandardMaterial;
};

/** The kitchen, through the opening in the right wall. */
export const KITCHEN = {
  /** The opening, as a span of z along the wall at x = 5. */
  door: [0.6, 2.0] as [number, number],
  x1: 8.6,
  z0: -0.8,
  z1: 3.4,
};

const frontPlasterOf = (m: THREE.MeshStandardMaterial) => {
  const c = m.clone();
  c.side = THREE.DoubleSide;
  return c;
};

/**
 * A galley kitchen off the living room: close enough to hear, far enough
 * for a word in private. Counter and cabinets on the far wall, a fridge, an
 * island with a bowl of olives nobody went to get.
 */
function kitchen(scene: THREE.Scene, plaster: THREE.MeshStandardMaterial) {
  const { x1, z0, z1 } = KITCHEN;
  const w = x1 - 5;
  const d = z1 - z0;
  const cx = (5 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const tile = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    std(0x8c877e, 0.6),
  );
  tile.rotation.x = -Math.PI / 2;
  tile.position.set(cx, 0.003, cz);
  tile.receiveShadow = true;
  scene.add(tile);
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    std(0x2a2622, 1),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(cx, 3.0, cz);
  scene.add(ceiling);
  const walls = frontPlasterOf(plaster);
  walls.color.set(0xc4b8a6);
  for (const [x, z, ry, len] of [
    [cx, z0, 0, w],
    [cx, z1, Math.PI, w],
    [x1, cz, -Math.PI / 2, d],
  ] as const) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.6), walls);
    m.position.set(x, 1.8, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    scene.add(m);
  }
  // Lintel over the opening, seen from the kitchen side too.
  scene.add(
    box(
      0.1,
      0.06,
      KITCHEN.door[1] - KITCHEN.door[0],
      std(0x2b2724, 0.6),
      5,
      2.3,
      (KITCHEN.door[0] + KITCHEN.door[1]) / 2,
      0.005,
    ),
  );

  const cabinet = std(0x30363a, 0.6);
  const stone = std(0xd8d4cc, 0.25);
  // Base run along the far wall, with the counter on top.
  scene.add(box(0.62, 0.86, d - 1.0, cabinet, x1 - 0.31, 0.43, cz - 0.5));
  scene.add(box(0.66, 0.04, d - 1.0, stone, x1 - 0.33, 0.88, cz - 0.5, 0.01));
  for (let i = 0; i < 5; i++) {
    const z = z0 + 0.35 + i * ((d - 1.0) / 5);
    const pull = box(
      0.02,
      0.02,
      0.22,
      std(0x9a9a9a, 0.3, 1),
      x1 - 0.63,
      0.75,
      z + 0.12,
      0.005,
    );
    scene.add(pull);
  }
  // Uppers
  scene.add(box(0.36, 0.75, d - 1.0, cabinet, x1 - 0.18, 1.95, cz - 0.5));
  // Fridge in the corner by the front wall
  scene.add(
    box(
      0.7,
      1.95,
      0.9,
      std(0xb8bcbf, 0.3, 0.6),
      x1 - 0.36,
      0.98,
      z1 - 0.5,
      0.03,
    ),
  );
  // Island
  const ix = 6.7;
  const iz = 1.3;
  scene.add(box(0.75, 0.88, 1.4, std(0x463c34, 0.7), ix, 0.44, iz));
  scene.add(box(0.85, 0.04, 1.5, stone, ix, 0.9, iz, 0.01));
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.11,
      20,
      10,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    ),
    std(0xe9e4da, 0.4),
  );
  bowl.position.set(ix, 1.03, iz - 0.3);
  scene.add(bowl);
  for (let i = 0; i < 9; i++) {
    const o = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 6),
      std(0x5d6b2a, 0.5),
    );
    o.scale.z = 1.4;
    o.position.set(
      ix + (Math.random() - 0.5) * 0.12,
      0.99,
      iz - 0.3 + (Math.random() - 0.5) * 0.12,
    );
    scene.add(o);
  }
  const wine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.3, 16),
    std(0x1d2b1c, 0.2),
  );
  wine.position.set(ix + 0.15, 1.07, iz + 0.35);
  scene.add(wine);
  // One warm light over the island.
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.16, 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1b1b1b,
      emissive: 0xffc27a,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide,
    }),
  );
  shade.position.set(ix, 2.25, iz);
  scene.add(shade);
  const light = new THREE.PointLight(0xffd6a8, 6, 5, 2);
  light.position.set(ix, 2.1, iz);
  scene.add(light);
}

export function buildSet(scene: THREE.Scene, base: string): BuiltSet {
  scene.background = new THREE.Color(0x05070c);
  scene.fog = new THREE.Fog(0x05070c, 9, 22);

  // Floor and rug
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ map: woodFloor(), roughness: 0.55 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.4),
    std(0x5a2a22, 0.98),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.3, 0.004, -0.6);
  rug.receiveShadow = true;
  scene.add(rug);

  // Back wall with a window opening
  const plaster = std(0xb9ab98, 0.95);
  const wall = new THREE.Shape();
  wall.moveTo(-5, 0);
  wall.lineTo(5, 0);
  wall.lineTo(5, 3.6);
  wall.lineTo(-5, 3.6);
  const hole = new THREE.Path();
  hole.moveTo(-3.2, 0.35);
  hole.lineTo(1.4, 0.35);
  hole.lineTo(1.4, 3.3);
  hole.lineTo(-3.2, 3.3);
  wall.holes.push(hole);
  const back = new THREE.Mesh(new THREE.ShapeGeometry(wall), plaster);
  back.position.z = -2.6;
  back.receiveShadow = true;
  scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.6), plaster);
  left.position.set(-5, 1.8, 1.9);
  left.rotation.y = Math.PI / 2;
  left.receiveShadow = true;
  scene.add(left);
  // The right wall has a wide opening through to the kitchen. In the wall's
  // own frame x runs along world +z, from -2.6 at x = -4.5.
  const right = new THREE.Shape();
  right.moveTo(-4.5, 0);
  right.lineTo(4.5, 0);
  right.lineTo(4.5, 3.6);
  right.lineTo(-4.5, 3.6);
  const opening = new THREE.Path();
  opening.moveTo(KITCHEN.door[0] - 1.9, 0);
  opening.lineTo(KITCHEN.door[1] - 1.9, 0);
  opening.lineTo(KITCHEN.door[1] - 1.9, 2.3);
  opening.lineTo(KITCHEN.door[0] - 1.9, 2.3);
  right.holes.push(opening);
  const rightWall = new THREE.Mesh(
    new THREE.ShapeGeometry(right),
    frontPlasterOf(plaster),
  );
  rightWall.position.set(5, 0, 1.9);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  scene.add(rightWall);
  kitchen(scene, plaster);
  // Front wall: the front door, and the hall closet left ajar
  const front = new THREE.Shape();
  front.moveTo(-5, 0);
  front.lineTo(5, 0);
  front.lineTo(5, 3.6);
  front.lineTo(-5, 3.6);
  for (const [x0, x1] of [
    [0.7, 1.7],
    [3.1, 4.1],
  ]) {
    const h = new THREE.Path();
    h.moveTo(x0, 0);
    h.lineTo(x1, 0);
    h.lineTo(x1, 2.15);
    h.lineTo(x0, 2.15);
    front.holes.push(h);
  }
  const frontPlaster = plaster.clone();
  frontPlaster.side = THREE.DoubleSide;
  const frontWall = new THREE.Mesh(
    new THREE.ShapeGeometry(front),
    frontPlaster,
  );
  frontWall.position.z = 4.4;
  frontWall.receiveShadow = true;
  scene.add(frontWall);
  const doorWood = std(0x2b2724, 0.55);
  const door = new THREE.Group();
  const leaf = box(0.98, 2.12, 0.05, doorWood, 0.49, 1.06, 0, 0.01);
  door.add(leaf);
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 12, 8),
    std(0xb08d57, 0.3, 1),
  );
  knob.position.set(0.86, 1.0, -0.05);
  door.add(knob);
  door.position.set(0.71, 0, 4.42);
  scene.add(door);
  // The closet: a shallow box behind the wall, its door swung open.
  const closet = new THREE.Group();
  closet.add(box(1.0, 2.2, 0.02, plaster, 0, 1.1, 0.72, 0.005));
  closet.add(box(0.02, 2.2, 0.72, plaster, -0.5, 1.1, 0.36, 0.005));
  closet.add(box(0.02, 2.2, 0.72, plaster, 0.5, 1.1, 0.36, 0.005));
  closet.add(box(1.0, 0.02, 0.72, std(0x3a3430, 0.9), 0, 0.01, 0.36, 0.005));
  closet.position.set(3.6, 0, 4.4);
  scene.add(closet);
  const closetDoor = box(0.98, 2.12, 0.04, doorWood, 0.49, 1.06, 0, 0.01);
  const hinge = new THREE.Group();
  hinge.add(closetDoor);
  hinge.position.set(3.11, 0, 4.4);
  hinge.rotation.y = -1.9;
  scene.add(hinge);
  for (let i = 0; i < 3; i++) {
    const coat = box(
      0.42,
      0.95,
      0.12,
      std([0x2d3340, 0x4a3a2a, 0x1f1f22][i], 0.95),
      3.3 + i * 0.22,
      1.45,
      4.95,
      0.05,
    );
    scene.add(coat);
  }
  const suitcase = new THREE.Group();
  suitcase.add(box(0.46, 0.66, 0.26, std(0x8a2f2a, 0.55), 0, 0.38, 0, 0.04));
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI),
    std(0x111111, 0.4),
  );
  handle.position.y = 0.72;
  suitcase.add(handle);
  suitcase.position.set(3.8, 0.02, 4.85);
  suitcase.rotation.y = 0.25;
  scene.add(suitcase);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 9),
    std(0x2a2622, 1),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 3.6, 1.9);
  scene.add(ceiling);

  // Steel window frame and the city behind it
  const steel = std(0x111214, 0.5, 0.6);
  for (let i = 0; i <= 6; i++) {
    const x = -3.2 + (i * 4.6) / 6;
    scene.add(box(0.05, 2.95, 0.06, steel, x, 1.825, -2.6, 0.005));
  }
  for (const y of [0.35, 1.3, 2.3, 3.3])
    scene.add(box(4.65, 0.05, 0.06, steel, -0.9, y, -2.6, 0.005));
  const city = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 12.4),
    new THREE.MeshBasicMaterial({
      map: tex(`${base}/set/city.webp`),
      fog: false,
    }),
  );
  city.position.set(-1, 2.2, -12);
  scene.add(city);

  // Nina's canvas over the sofa
  const canvas = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.4, 0.04), [
    std(0xe8e2d6),
    std(0xe8e2d6),
    std(0xe8e2d6),
    std(0xe8e2d6),
    new THREE.MeshStandardMaterial({
      map: tex(`${base}/set/painting.webp`),
      roughness: 0.7,
    }),
    std(0xe8e2d6),
  ]);
  canvas.position.set(3.0, 1.85, -2.56);
  canvas.castShadow = true;
  scene.add(canvas);

  // Sofa
  const fabric = std(0x55585c, 0.97);
  const sofa = new THREE.Group();
  sofa.add(box(2.3, 0.42, 0.95, fabric, 0, 0.21, 0, 0.06));
  sofa.add(box(2.3, 0.5, 0.22, fabric, 0, 0.62, -0.37, 0.08));
  sofa.add(box(0.22, 0.6, 0.95, fabric, -1.15, 0.3, 0, 0.08));
  sofa.add(box(0.22, 0.6, 0.95, fabric, 1.15, 0.3, 0, 0.08));
  sofa.add(box(0.95, 0.14, 0.7, fabric, -0.5, 0.48, 0.08, 0.06));
  sofa.add(box(0.95, 0.14, 0.7, fabric, 0.5, 0.48, 0.08, 0.06));
  sofa.position.set(3.0, 0, -2.0);
  scene.add(sofa);

  // Bar cart: brass frame, glass shelves, bottles
  const brass = std(0xb08d57, 0.3, 1);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    transmission: 0.9,
    thickness: 0.01,
    transparent: true,
    opacity: 0.35,
  });
  const cart = new THREE.Group();
  for (const [x, z] of [
    [-0.4, -0.22],
    [0.4, -0.22],
    [-0.4, 0.22],
    [0.4, 0.22],
  ]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.85),
      brass,
    );
    leg.position.set(x, 0.425, z);
    leg.castShadow = true;
    cart.add(leg);
  }
  for (const y of [0.25, 0.8]) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.01, 0.46),
      glass,
    );
    shelf.position.y = y;
    cart.add(shelf);
  }
  const bottleColors = [0x3b1d0a, 0x1c3a20, 0xd8c8a0, 0x6b2b10, 0x203040];
  bottleColors.forEach((c, i) => {
    const b = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.045, 0.28, 16),
      new THREE.MeshPhysicalMaterial({
        color: c,
        roughness: 0.1,
        transmission: 0.4,
        thickness: 0.05,
      }),
    );
    b.position.set(-0.3 + i * 0.15, 0.95, -0.05 + (i % 2) * 0.1);
    b.castShadow = true;
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.03, 0.09, 12),
      b.material,
    );
    neck.position.y = 0.18;
    b.add(neck);
    cart.add(b);
  });
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.012, 0.07, 16, 1, true),
      glass,
    );
    g.position.set(-0.2 + i * 0.12, 0.33, 0.1);
    cart.add(g);
  }
  cart.position.set(-2.5, 0, -1.75);
  cart.rotation.y = 0;
  scene.add(cart);

  // Sideboard with the Venice photo
  const walnut = std(0x3a2416, 0.6);
  scene.add(box(0.5, 0.8, 2.0, walnut, -4.7, 0.4, -0.4));
  const frame = box(
    0.03,
    0.34,
    0.44,
    std(0x111111, 0.4),
    -4.62,
    0.98,
    -0.6,
    0.004,
  );
  frame.rotation.z = 0.12;
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.28),
    new THREE.MeshStandardMaterial({
      map: tex(`${base}/set/venice.webp`),
      roughness: 0.4,
    }),
  );
  photo.position.x = 0.018;
  photo.rotation.y = Math.PI / 2;
  frame.add(photo);
  const photoProp = new THREE.Group();
  photoProp.add(frame);
  scene.add(photoProp);

  // Theo's phone, face up on the sideboard
  const phoneScreen = new THREE.MeshStandardMaterial({
    color: 0x05070a,
    emissive: 0x9fc4ff,
    emissiveIntensity: 0,
    roughness: 0.2,
  });
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.009, 0.155), [
    std(0x1a1a1c, 0.4, 0.5),
    std(0x1a1a1c, 0.4, 0.5),
    phoneScreen,
    std(0x1a1a1c, 0.4, 0.5),
    std(0x1a1a1c, 0.4, 0.5),
    std(0x1a1a1c, 0.4, 0.5),
  ]);
  phone.position.set(-4.62, 0.805, -0.05);
  phone.rotation.y = 0.3;
  scene.add(phone);

  // Side table by the sofa, with Nina's letter half under a book
  const sideTable = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.03, 32),
    walnut,
  );
  top.position.y = 0.55;
  top.castShadow = top.receiveShadow = true;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.05, 0.55, 12),
    walnut,
  );
  stem.position.y = 0.275;
  sideTable.add(top, stem);
  sideTable.position.set(1.45, 0, -1.95);
  scene.add(sideTable);
  const letter = new THREE.Mesh(
    new THREE.BoxGeometry(0.21, 0.003, 0.28),
    std(0xf4f1ea, 0.9),
  );
  letter.position.set(1.42, 0.568, -1.9);
  letter.rotation.y = 0.5;
  scene.add(letter);
  const book = box(
    0.17,
    0.035,
    0.24,
    std(0x2c4a5a, 0.8),
    1.52,
    0.585,
    -2.0,
    0.005,
  );
  book.rotation.y = -0.2;
  scene.add(book);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 24, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfff1d6,
      emissive: 0xffc27a,
      emissiveIntensity: 2,
    }),
  );
  lamp.position.set(-4.7, 1.05, 0.25);
  scene.add(lamp);

  // Lighting
  scene.add(new THREE.HemisphereLight(0x8090b0, 0x2a1d14, 0.35));
  const pendants: THREE.PointLight[] = [];
  for (const [x, y, z] of [
    [-0.6, 2.5, -0.2],
    [1.6, 2.4, -1.3],
  ]) {
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 24, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfff1d6,
        emissive: 0xffb866,
        emissiveIntensity: 3,
      }),
    );
    globe.position.set(x, y, z);
    scene.add(globe);
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 3.6 - y),
      steel,
    );
    cord.position.set(x, (3.6 + y) / 2, z);
    scene.add(cord);
    const p = new THREE.PointLight(0xffb470, 9, 9, 1.6);
    p.position.set(x, y - 0.2, z);
    scene.add(p);
    pendants.push(p);
  }
  const sideLamp = new THREE.PointLight(0xffa860, 4, 5, 1.8);
  sideLamp.position.set(-4.4, 1.2, 0.25);
  scene.add(sideLamp);

  // Key: a warm spot from front-left, the only shadow caster
  const key = new THREE.SpotLight(0xffcf9a, 40, 12, 0.6, 0.6, 1.4);
  key.position.set(-2.2, 3.3, 3.2);
  key.target.position.set(0, 1.2, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  // Cool window light from behind: rims them against the city
  const win = new THREE.DirectionalLight(0x6f8fd8, 1.6);
  win.position.set(-1, 3, -6);
  scene.add(win);

  // The bar's bottles, as one thing to reach for
  const bottles = new THREE.Group();
  cart.updateMatrixWorld(true);
  for (const b of cart.children.filter(
    (o) =>
      (o as THREE.Mesh).geometry instanceof THREE.CylinderGeometry &&
      o.position.y > 0.9,
  ))
    bottles.attach(b);
  scene.add(bottles);

  return {
    pendants,
    window: win,
    props: {
      photo: photoProp,
      painting: canvas,
      phone,
      letter,
      suitcase,
      door,
      sofa,
      bottles,
    },
    blocks: [
      [1.8, -2.6, 4.2, -1.5], // sofa
      [-3.0, -2.05, -2.0, -1.45], // bar cart
      [-5, -1.4, -4.4, 0.6], // sideboard
      [1.15, -2.25, 1.75, -1.65], // side table
      // The right wall either side of the kitchen opening
      [4.75, -2.6, 5.25, KITCHEN.door[0]],
      [4.75, KITCHEN.door[1], 5.25, 4.4],
      // Past the kitchen's own walls
      [5.0, -3.5, 9, KITCHEN.z0],
      [5.0, KITCHEN.z1, 9, 5],
      [KITCHEN.x1 - 0.65, KITCHEN.z0, 9, KITCHEN.z1], // counter and fridge
      [6.3, 0.55, 7.1, 2.05], // island
    ],
    phoneScreen,
  };
}
