import * as THREE from "three";
import type { Room } from "../game/engine";
import { LOFT_Y, ROOM_W, STAIR_STEPS, STAIR_WIDTH, TERRACE_DEPTH, WALL_HEIGHT, loftFront, roomDepth, stairs, slotPosition, zoneCapacity, HOUSE_PITCH } from "../game/layout";
import { houseLevel } from "../game/houseLevels";
import { box, cyl, mat, rbox, shadowify, sph } from "./props";

let oak: THREE.CanvasTexture | null = null;
let contact: THREE.CanvasTexture | null = null;
export function oakTexture() {
  if (oak) return oak;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#d2ae80";
  c.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) {
    c.fillStyle = ["#d7b58e", "#dfc299", "#d1ad81", "#ddba8f"][row % 4];
    c.fillRect(0, row * 64 + 1, 512, 62);
    c.strokeStyle = "rgba(116,77,43,0.12)";
    for (let n = 0; n < 7; n++) {
      c.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const y = row * 64 + 5 + n * 8 + Math.sin(x * 0.018 + row + n) * 1.5;
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }
    c.fillStyle = "rgba(103,74,44,0.16)";
    c.fillRect((row % 3) * 157 + 48, row * 64, 1, 64);
  }
  oak = new THREE.CanvasTexture(canvas);
  oak.colorSpace = THREE.SRGBColorSpace;
  oak.wrapS = oak.wrapT = THREE.RepeatWrapping;
  oak.repeat.set(1.2, 1.2);
  oak.anisotropy = 4;
  return oak;
}
export function contactShadow(width = 1, depth = 1, opacity = 0.18) {
  if (!contact) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 63);
    g.addColorStop(0, "rgba(48,43,31,0.5)"); g.addColorStop(0.5, "rgba(48,43,31,0.26)"); g.addColorStop(1, "rgba(48,43,31,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    contact = new THREE.CanvasTexture(c);
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ map: contact, transparent: true, opacity, depthWrite: false, toneMapped: false }));
  mesh.material.userData.owned = true;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.018;
  mesh.renderOrder = 1;
  return mesh;
}
function timber(w: number, h: number, d: number, x: number, y: number, z: number) {
  const mesh = rbox(w, h, d, "#fff4d7", { x, y, z }, { r: 0.035, rough: 0.84 });
  const material = (mesh.material as THREE.MeshStandardMaterial).clone();
  material.map = oakTexture();
  material.userData.owned = true;
  mesh.material = material;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export function roomShell(room: Room) {
  const root = new THREE.Group();
  const upper = new THREE.Group();
  upper.name = "upper-shell";
  const d = roomDepth(room.level);
  const back = -d / 2;
  const front = loftFront(room.level);
  const cream = "#f0eadb";
  const palette = ["#b7c9aa", "#c5b8a6", "#bac9d2"];
  const sage = palette[room.id % 3];
  const frame = room.level >= 4 ? "#a38a5f" : "#9e8364";
  root.add(rbox(ROOM_W + 0.25, 0.26, d + TERRACE_DEPTH + 0.14, "#d8d7c5", { y: -0.28, z: TERRACE_DEPTH / 2 }, { r: 0.12 }));
  root.add(timber(ROOM_W, 0.18, d, 0, -0.09, 0));
  root.add(rbox(ROOM_W, 0.15, TERRACE_DEPTH, "#dedbc9", { y: -0.075, z: d / 2 + TERRACE_DEPTH / 2 }, { r: 0.025, rough: 0.94 }));
  for (let i = 0; i < 12; i++) root.add(box(0.014, 0.005, TERRACE_DEPTH - 0.1, "#c9c7b7", { x: -ROOM_W / 2 + i * (ROOM_W / 12), y: 0.008, z: d / 2 + TERRACE_DEPTH / 2 }));
  root.add(rbox(ROOM_W, LOFT_Y, 0.18, sage, { y: LOFT_Y / 2, z: back }, { r: 0.035 }));
  root.add(rbox(0.17, LOFT_Y, d, cream, { x: -ROOM_W / 2, y: LOFT_Y / 2 }, { r: 0.025 }));
  root.add(rbox(0.15, 0.17, d, cream, { x: ROOM_W / 2, y: 0.085 }, { r: 0.025 }));
  root.add(box(ROOM_W - 0.1, 0.14, 0.08, cream, { y: 0.07, z: back + 0.12 }));
  root.add(box(0.08, 0.14, d, "#ddd3ba", { x: -ROOM_W / 2 + 0.11, y: 0.07 }));

  upper.add(timber(ROOM_W - 0.12, 0.15, front - back, 0, LOFT_Y - 0.075, (back + front) / 2));
  upper.add(rbox(ROOM_W, WALL_HEIGHT - LOFT_Y, 0.18, cream, { y: (WALL_HEIGHT + LOFT_Y) / 2, z: back }, { r: 0.035 }));
  upper.add(rbox(0.17, WALL_HEIGHT - LOFT_Y, front - back, cream, { x: -ROOM_W / 2, y: (WALL_HEIGHT + LOFT_Y) / 2, z: (front + back) / 2 }, { r: 0.025 }));
  upper.add(rbox(ROOM_W + 0.06, 0.10, 0.26, frame, { y: WALL_HEIGHT, z: back }, { r: 0.035 }));
  upper.add(rbox(0.24, 0.1, front - back, frame, { x: -ROOM_W / 2, y: WALL_HEIGHT, z: (back + front) / 2 }, { r: 0.03 }));
  upper.add(rbox(ROOM_W - 0.15, 0.12, 0.16, frame, { y: LOFT_Y - 0.10, z: front }, { r: 0.035 }));
  root.add(rbox(0.16, LOFT_Y - 0.15, 0.18, "#c7b08a", { x: -3.40, y: (LOFT_Y - 0.15) / 2, z: front }, { r: 0.025 }));
  const railingEnd = 2.42;
  const railingWidth = railingEnd + ROOM_W / 2 - 0.22;
  upper.add(rbox(railingWidth, 0.07, 0.075, cream, { x: (-ROOM_W / 2 + 0.22 + railingEnd) / 2, y: LOFT_Y + 0.64, z: front - 0.015 }, { r: 0.023 }));
  for (let i = 0; i < 12; i++) upper.add(cyl(0.018, 0.018, 0.60, "#a58d6b", { x: -ROOM_W / 2 + 0.30 + i * (railingWidth - 0.1) / 11, y: LOFT_Y + 0.31, z: front - 0.015 }, { metal: 0.16 }, 10));

  // Open, full-width treads match the navigation ramp and its reserved clearance.
  const stair = stairs(room);
  const run = (stair.bottom.z - stair.top.z) / STAIR_STEPS;
  for (let i = 1; i <= STAIR_STEPS; i++) {
    const y = LOFT_Y * i / STAIR_STEPS;
    const z = stair.bottom.z - run * i;
    upper.add(timber(STAIR_WIDTH, 0.08, run + 0.035, stair.bottom.x, y - 0.05, z));
    if (i % 2 === 0) upper.add(cyl(0.018, 0.018, 0.60, "#b7a484", { x: stair.bottom.x + STAIR_WIDTH / 2 - 0.04, y: y + 0.26, z }, {}, 10));
  }
  const handrailLength = Math.hypot(LOFT_Y, stair.bottom.z - stair.top.z);
  for (const offset of [-STAIR_WIDTH / 2 + 0.04, STAIR_WIDTH / 2 - 0.04]) {
    const handrail = cyl(0.035, 0.035, handrailLength, frame, { x: stair.bottom.x + offset, y: LOFT_Y / 2 + 0.56, z: (stair.top.z + stair.bottom.z) / 2, rx: -Math.atan2(stair.bottom.z - stair.top.z, LOFT_Y) }, {}, 16);
    upper.add(handrail);
  }

  const windowFrame = new THREE.Group();
  windowFrame.position.set(2.69, 3.58, back + 0.13);
  windowFrame.add(rbox(1.2, 1.65, 0.09, "#e6cfac", {}, { r: 0.065 }));
  windowFrame.add(rbox(1.01, 1.46, 0.025, "#c4e1dd", { z: 0.062 }, { r: 0.04, emissive: "#c4e5df", emissiveI: 0.20, rough: 0.24 }));
  windowFrame.add(box(0.046, 1.47, 0.04, cream, { z: 0.08 }), box(1.03, 0.046, 0.04, cream, { z: 0.08 }));
  windowFrame.add(rbox(1.32, 0.07, 0.28, cream, { y: -0.87, z: 0.09 }, { r: 0.023 }));
  upper.add(windowFrame);
  // A cutaway roof keeps the rooms readable while giving each home a distinct silhouette.
  const roofColor = ["#79928b", "#ba907c", "#8e9db2"][room.id % 3];
  for (const side of [-1, 1]) {
    const roof = rbox(4.0, 0.12, 1.35, roofColor, { x: side * 1.91, y: WALL_HEIGHT + 0.51, z: back + 0.13, rz: -side * 0.26 }, { r: 0.045, rough: 0.88 });
    upper.add(roof);
    for (let row = 0; row < 6; row++) {
      const seam = rbox(3.98, 0.018, 0.025, room.id % 3 === 1 ? "#a17d6a" : "#6e8686", { x: side * 1.91, y: WALL_HEIGHT + 0.582, z: back - 0.47 + row * 0.24, rz: -side * 0.26 }, { r: 0.008 });
      upper.add(seam);
    }
  }
  upper.add(cyl(0.075, 0.075, 1.43, roofColor, { y: WALL_HEIGHT + 1.04, z: back + 0.13, rx: Math.PI / 2 }, {}, 18));
  for (let i = 0; i < zoneCapacity(room.level, "surface"); i++) {
    const p = slotPosition(room, 5000 + i);
    root.add(timber(0.68, 0.06, 0.38, p.x, p.y - 0.035, p.z));
    for (const x of [-0.22, 0.22]) root.add(rbox(0.026, 0.16, 0.18, "#a49270", { x: p.x + x, y: p.y - 0.14, z: p.z - 0.045 }, { r: 0.01 }));
  }
  if (room.level >= 3) upper.add(rbox(ROOM_W - 0.1, 0.10, 0.10, frame, { y: WALL_HEIGHT - 0.03, z: front + 1.1 }, { r: 0.025 }));
  if (room.level >= 2) {
    for (const side of [-1, 1]) {
      const post = rbox(0.12, 2.25, 0.12, cream, { x: side * 3.53, y: 1.125, z: d / 2 + 3.82 }, { r: 0.025 });
      root.add(post);
    }
    root.add(rbox(7.14, 0.10, 0.13, frame, { y: 2.30, z: d / 2 + 3.82 }, { r: 0.03 }));
    for (let i = 0; i < 9; i++) {
      const x = -3.2 + i * 0.8;
      root.add(cyl(0.008, 0.008, 0.16, "#7c8472", { x, y: 2.16, z: d / 2 + 3.82 }, {}, 6));
      root.add(sph(0.055, "#f2dfb5", { x, y: 2.03, z: d / 2 + 3.82 }, { emissive: "#e9c48b", emissiveI: 0.85 }, 14));
    }
  }
  if (room.level >= 3) {
    for (let row = 0; row < 2; row++) for (let i = 0; i < 10; i++) root.add(rbox(0.68, 0.10, 0.12, i % 2 ? "#d1cebb" : "#c7c4b2", { x: -3.28 + i * 0.73, y: -0.17 - row * 0.11, z: d / 2 + TERRACE_DEPTH + 0.01 }, { r: 0.02 }));
  }
  if (room.level >= 4) {
    upper.add(rbox(railingWidth, 0.042, 0.08, "#d1b675", { x: (-ROOM_W / 2 + 0.22 + railingEnd) / 2, y: LOFT_Y + 0.68, z: front - 0.015 }, { r: 0.018, metal: 0.4, rough: 0.4 }));
    upper.add(rbox(0.54, 0.54, 0.06, "#ece0c0", { x: 0, y: WALL_HEIGHT + 0.32, z: back + 0.87, rz: Math.PI / 4 }, { r: 0.04 }));
  }
  if (room.level === 5) {
    for (const side of [-1, 1]) {
      upper.add(rbox(0.24, WALL_HEIGHT, 0.24, "#d3c09b", { x: side * (ROOM_W / 2 - 0.04), y: WALL_HEIGHT / 2, z: back }, { r: 0.04 }));
      root.add(cyl(0.16, 0.22, 0.40, "#cdb176", { x: side * 3.25, y: 0.20, z: d / 2 + 2.6 }, { rough: 0.55 }, 20));
    }
  }
  for (const sign of [-1, 1]) {
    root.add(rbox((ROOM_W - 1.84) / 2, 0.40, 0.14, cream, { x: sign * (ROOM_W / 4 + 0.46), y: 0.2, z: d / 2 }, { r: 0.04 }));
    root.add(rbox(0.07, 0.85, 0.12, frame, { x: sign * 0.96, y: 0.425, z: d / 2 }, { r: 0.023 }));
  }
  root.add(rbox(0.08, 1.80, 1.10, "#87a28f", { x: 0.985, y: 0.90, z: d / 2 - 0.51 }, { r: 0.045 }));
  root.add(rbox(0.025, 1.34, 0.82, "#b5c3a7", { x: 0.935, y: 0.99, z: d / 2 - 0.51 }, { r: 0.025 }));
  root.add(sph(0.033, "#dbc288", { x: 0.91, y: 0.84, z: d / 2 - 0.91 }, { metal: 0.4, rough: 0.4 }, 16));
  root.add(rbox(1.68, 0.022, 0.60, "#7f9b83", { y: 0.015, z: d / 2 + 0.32 }, { r: 0.08 }));
  root.add(rbox(ROOM_W - 0.12, 0.12, 0.12, "#c8c9b7", { y: 0.0, z: d / 2 + TERRACE_DEPTH - 0.08 }, { r: 0.035 }));

  // Terrace fixtures have corresponding navigation colliders.
  root.add(timber(1.54, 0.09, 0.5, -2.44, 0.46, d / 2 + 3.3));
  root.add(rbox(1.54, 0.36, 0.07, "#99ae98", { x: -2.44, y: 0.69, z: d / 2 + 3.55 }, { r: 0.06 }));
  for (const x of [-3.02, -1.86]) root.add(rbox(0.08, 0.44, 0.40, "#738975", { x, y: 0.22, z: d / 2 + 3.3 }, { r: 0.025 }));
  root.add(cyl(0.24, 0.18, 0.36, "#dcb794", { x: 2.95, y: 0.18, z: d / 2 + 3.33 }, { rough: 0.9 }, 24));
  for (let i = 0; i < 5; i++) {
    const leaf = sph(0.16, i % 2 ? "#9aaf80" : "#6f9b77", { x: 2.95 + Math.cos(i * 1.8) * 0.12, y: 0.58 + i * 0.07, z: d / 2 + 3.33 + Math.sin(i * 1.8) * 0.12 }, {}, 20);
    leaf.scale.set(0.85, 1.7, 0.35); leaf.rotation.z = Math.cos(i) * 0.4; root.add(leaf);
  }
  root.add(rbox(0.38, 0.028, 0.9, "#efdca5", { x: 0, y: 0.025, z: d / 2 + 1.15 }, { r: 0.02 }));
  root.add(upper);
  const levelColor = houseLevel(room.level).color;
  root.add(rbox(0.60, 0.28, 0.035, levelColor, { x: -1.25, y: 0.40, z: d / 2 + 0.075 }, { r: 0.025 }));
  for (let i = 0; i < room.level; i++) root.add(sph(0.018, "#fff4d9", { x: -1.44 + i * 0.09, y: 0.41, z: d / 2 + 0.105 }, {}, 10));
  shadowify(root);
  const bounce = new THREE.PointLight("#ffe2b0", 3.8, 7, 2);
  bounce.position.set(-0.8, LOFT_Y - 0.35, (back + front) / 2);
  root.add(bounce);
  return { root, upper };
}

export function garden() {
  const root = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat("#d7e1d2", { rough: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.43; ground.receiveShadow = true; root.add(ground);
  const lawn = rbox(31.4, 0.12, 24.5, "#b9cba7", { y: -0.42, z: 1.2 }, { r: 0.05, rough: 1 });
  lawn.receiveShadow = true; root.add(lawn);
  const promenade = rbox(31.0, 0.045, 1.4, "#d9d5c1", { y: -0.33, z: 11.6 }, { r: 0.02 });
  promenade.receiveShadow = true; root.add(promenade);
  for (const x of [-HOUSE_PITCH, 0, HOUSE_PITCH]) {
    for (let i = 0; i < 5; i++) root.add(rbox(1.1, 0.065, 0.6, i % 2 ? "#d5d1bc" : "#ded9c5", { x, y: -0.31, z: 8.1 + i * 0.67 }, { r: 0.08 }));
    for (const side of [-1, 1]) {
      const hedge = rbox(0.56, 0.44, 2.5, "#8da879", { x: x + side * 4.05, y: -0.13, z: 5.9 }, { r: 0.19, rough: 1 }); root.add(hedge);
      for (let n = 0; n < 5; n++) {
        const flower = sph(0.055, n % 2 ? "#e9c597" : "#dcaaa7", { x: x + side * 4.06, y: 0.15, z: 4.9 + n * 0.46 }, {}, 12); root.add(flower);
      }
    }
  }
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2;
    const x = Math.cos(a) * 18, z = Math.sin(a) * 15;
    const tree = new THREE.Group();
    tree.add(cyl(0.1, 0.16, 1.3, "#a48667", { y: 0.3 }, { rough: 0.96 }, 14));
    for (let j = 0; j < 3; j++) {
      const crown = sph(0.7, ["#a6ba92", "#99b89a", "#b7c69b"][(i + j) % 3], { x: Math.cos(j * 2) * 0.34, y: 1.0 + j * 0.31, z: Math.sin(j * 2) * 0.32 }, { rough: 0.94 }, 24);
      crown.scale.set(1, 1.1, 1); tree.add(crown);
    }
    tree.position.set(x, 0, z); shadowify(tree); root.add(tree);
  }
  for (let i = 0; i < 22; i++) {
    const stone = sph(0.14 + (i % 3) * 0.03, "#b6bca4", { x: Math.sin(i * 3.7) * 16, y: -0.33, z: Math.cos(i * 2.1) * 13 }, { rough: 1 }, 12);
    stone.scale.y = 0.55; root.add(stone);
  }
  return root;
}

export function disposeWorldTextures() {
  oak?.dispose(); contact?.dispose(); oak = null; contact = null;
}