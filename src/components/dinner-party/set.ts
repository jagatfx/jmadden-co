import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * Trip and Grace's loft, built in code: a wood floor, a wall of steel-framed
 * windows onto the city at dusk, Grace's new canvas over the sofa, the bar
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

export type SetLights = {
  /** Lamps that slowly warm up as the night goes on. */
  pendants: THREE.PointLight[];
  window: THREE.DirectionalLight;
};

export function buildSet(scene: THREE.Scene, base: string): SetLights {
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
  for (const [x, rot] of [
    [-5, Math.PI / 2],
    [5, -Math.PI / 2],
  ] as const) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.6), plaster);
    side.position.set(x, 1.8, 1.9);
    side.rotation.y = rot;
    side.receiveShadow = true;
    scene.add(side);
  }
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

  // Grace's canvas over the sofa
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
  cart.position.set(-1.9, 0, 0.1);
  cart.rotation.y = 0.4;
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
  scene.add(frame);
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

  return { pendants, window: win };
}
