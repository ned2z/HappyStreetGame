import * as THREE from "three";
import type { Room } from "../game/engine";
import {
  HOUSE_PITCH, ROOM_W, STORY_HEIGHT, STAIR_STEPS, STAIR_WIDTH, TERRACE_DEPTH,
  houseHeight, houseStoryCount, loftFront, roomDepth, slotPosition, stairFlights, zoneCapacity,
} from "../game/layout";
import { houseLevel } from "../game/houseLevels";
import { box, cyl, mat, rbox, shadowify, sph } from "./props";

let oak: THREE.CanvasTexture | null = null;
let contact: THREE.CanvasTexture | null = null;

export function oakTexture() {
  if (oak) return oak;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#d2ae80"; c.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) {
    c.fillStyle = ["#d7b58e", "#dfc299", "#d1ad81", "#ddba8f"][row % 4]; c.fillRect(0, row * 64 + 1, 512, 62);
    c.strokeStyle = "rgba(116,77,43,0.12)";
    for (let n = 0; n < 7; n++) {
      c.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const y = row * 64 + 5 + n * 8 + Math.sin(x * 0.018 + row + n) * 1.5;
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }
    c.fillStyle = "rgba(103,74,44,0.16)"; c.fillRect((row % 3) * 157 + 48, row * 64, 1, 64);
  }
  oak = new THREE.CanvasTexture(canvas); oak.colorSpace = THREE.SRGBColorSpace;
  oak.wrapS = oak.wrapT = THREE.RepeatWrapping; oak.repeat.set(1.35, 1.2); oak.anisotropy = 4;
  return oak;
}

export function contactShadow(width = 1, depth = 1, opacity = 0.18) {
  if (!contact) {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
    const c = canvas.getContext("2d")!;
    const gradient = c.createRadialGradient(64, 64, 4, 64, 64, 63);
    gradient.addColorStop(0, "rgba(48,43,31,0.5)"); gradient.addColorStop(0.5, "rgba(48,43,31,0.26)"); gradient.addColorStop(1, "rgba(48,43,31,0)");
    c.fillStyle = gradient; c.fillRect(0, 0, 128, 128); contact = new THREE.CanvasTexture(canvas);
  }
  const material = new THREE.MeshBasicMaterial({ map: contact, transparent: true, opacity, depthWrite: false, toneMapped: false });
  material.userData.owned = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.018; mesh.renderOrder = 1;
  return mesh;
}

function timber(w: number, h: number, d: number, x: number, y: number, z: number) {
  const mesh = rbox(w, h, d, "#fff4d7", { x, y, z }, { r: 0.035, rough: 0.84 });
  const material = (mesh.material as THREE.MeshStandardMaterial).clone(); material.map = oakTexture(); material.userData.owned = true;
  mesh.material = material; mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function storyWindow(group: THREE.Group, x: number, y: number, z: number, cream: string) {
  group.add(rbox(1.25, 1.34, 0.08, "#e5ccaa", { x, y, z }, { r: 0.055 }));
  group.add(rbox(1.06, 1.15, 0.025, "#b8dad8", { x, y, z: z + 0.055 }, { r: 0.035, emissive: "#b9ded9", emissiveI: 0.18, rough: 0.2 }));
  group.add(box(0.04, 1.15, 0.035, cream, { x, y, z: z + 0.08 }), box(1.07, 0.04, 0.035, cream, { x, y, z: z + 0.08 }));
}

export function roomShell(room: Room) {
  const root = new THREE.Group();
  const upper = new THREE.Group(); upper.name = "upper-shell";
  const d = roomDepth(room.level), back = -d / 2, front = loftFront(room.level), stories = houseStoryCount(room.level), height = houseHeight(room.level);
  const cream = "#f1eadc", frame = room.level >= 4 ? "#a38a5f" : "#9e8364";
  const wall = ["#b7c9aa", "#c5b8a6", "#bac9d2"][room.id % 3];
  const roofColor = ["#78928a", "#ba907c", "#8e9db2"][room.id % 3];

  // Larger foundation and outdoor deck make the whole model read as a house rather than a room slice.
  root.add(rbox(ROOM_W + 0.36, 0.30, d + TERRACE_DEPTH + 0.20, "#d2d4c2", { y: -0.31, z: TERRACE_DEPTH / 2 }, { r: 0.13 }));
  root.add(timber(ROOM_W, 0.18, d, 0, -0.09, 0));
  root.add(rbox(ROOM_W, 0.15, TERRACE_DEPTH, "#ddd9c7", { y: -0.075, z: d / 2 + TERRACE_DEPTH / 2 }, { r: 0.025, rough: 0.95 }));
  for (let i = 0; i < 14; i++) root.add(box(0.014, 0.005, TERRACE_DEPTH - 0.1, "#c7c5b4", { x: -ROOM_W / 2 + i * ROOM_W / 14, y: 0.008, z: d / 2 + TERRACE_DEPTH / 2 }));

  for (let story = 0; story < stories; story++) {
    const target = story === 0 ? root : upper;
    const y = story * STORY_HEIGHT;
    if (story > 0) {
      // The floor stops before the stair shaft, so stair flights never clip through a hidden slab.
      const left = -ROOM_W / 2 + 0.06;
      const right = stairFlights(room)[0].bounds.min.x - 0.18;
      const floorWidth = right - left;
      target.add(timber(floorWidth, 0.16, front - back, left + floorWidth / 2, y - 0.08, (back + front) / 2));
      const corridorLeft = stairFlights(room)[0].bottom.x - STAIR_WIDTH - 0.92;
      const corridorRight = stairFlights(room)[0].bounds.min.x - 0.15;
      const corridorWidth = corridorRight - corridorLeft;
      target.add(timber(corridorWidth, 0.16, 2.28, corridorLeft + corridorWidth / 2, y - 0.08, front + 1.14));
      // Open landing between stair flights. No fence blocks the route to the next storey.
      target.add(timber(ROOM_W - 0.12, 0.16, 0.88, 0, y - 0.08, front + 2.52));
    }
    target.add(rbox(ROOM_W, STORY_HEIGHT - 0.08, 0.18, story % 2 ? cream : wall, { y: y + (STORY_HEIGHT - 0.08) / 2, z: back }, { r: 0.035 }));
    target.add(rbox(0.18, STORY_HEIGHT - 0.08, story === 0 ? d : front - back, cream, { x: -ROOM_W / 2, y: y + (STORY_HEIGHT - 0.08) / 2, z: story === 0 ? 0 : (back + front) / 2 }, { r: 0.025 }));
    target.add(box(ROOM_W - 0.1, 0.12, 0.07, cream, { y: y + 0.06, z: back + 0.12 }));
    target.add(rbox(ROOM_W + 0.06, 0.09, 0.23, frame, { y: y + STORY_HEIGHT - 0.08, z: back }, { r: 0.03 }));
    storyWindow(target, story % 2 ? -2.5 : 2.5, y + 1.35, back + 0.13, cream);
    // Upper floors intentionally have an open front edge for clear gameplay visibility and movement.
  }

  // Every extra storey has its own flight; all flights share the same reserved shaft.
  for (const flight of stairFlights(room)) {
    const run = (flight.bottom.z - flight.top.z) / STAIR_STEPS;
    for (let i = 1; i <= STAIR_STEPS; i++) {
      const y = flight.bottom.y + STORY_HEIGHT * i / STAIR_STEPS;
      const z = flight.bottom.z - run * i;
      upper.add(timber(STAIR_WIDTH, 0.08, run + 0.035, flight.bottom.x, y - 0.05, z));
    }
    // Stair treads stay fully open: no side rails intersect the character route.
  }

  // Dynamic shelves remain aligned with installable surface slots.
  for (let i = 0; i < zoneCapacity(room.level, "surface"); i++) {
    const p = slotPosition(room, 5000 + i);
    const target = p.y >= STORY_HEIGHT ? upper : root;
    target.add(timber(0.68, 0.06, 0.38, p.x, p.y - 0.035, p.z));
    for (const x of [-0.22, 0.22]) target.add(rbox(0.026, 0.16, 0.18, "#a49270", { x: p.x + x, y: p.y - 0.14, z: p.z - 0.045 }, { r: 0.01 }));
  }

  // Roof sits above the actual top storey, so Lv.3 and Lv.5 visibly become taller buildings.
  for (const side of [-1, 1]) {
    upper.add(rbox(ROOM_W / 2 + 0.23, 0.14, 1.48, roofColor, { x: side * (ROOM_W / 4 + 0.02), y: height + 0.52, z: back + 0.13, rz: -side * 0.25 }, { r: 0.05, rough: 0.88 }));
    for (let row = 0; row < 6; row++) upper.add(rbox(ROOM_W / 2 + 0.18, 0.018, 0.025, room.id % 3 === 1 ? "#a17d6a" : "#6e8686", { x: side * (ROOM_W / 4 + 0.02), y: height + 0.595, z: back - 0.52 + row * 0.26, rz: -side * 0.25 }, { r: 0.008 }));
  }
  upper.add(cyl(0.075, 0.075, 1.56, roofColor, { y: height + 1.07, z: back + 0.13, rx: Math.PI / 2 }, {}, 18));

  // Entrance, lights and outdoor fixtures.
  for (const sign of [-1, 1]) {
    root.add(rbox((ROOM_W - 1.84) / 2, 0.40, 0.14, cream, { x: sign * (ROOM_W / 4 + 0.46), y: 0.2, z: d / 2 }, { r: 0.04 }));
    root.add(rbox(0.07, 0.85, 0.12, frame, { x: sign * 0.96, y: 0.425, z: d / 2 }, { r: 0.023 }));
  }
  root.add(rbox(0.08, 1.80, 1.10, "#87a28f", { x: 0.985, y: 0.90, z: d / 2 - 0.51 }, { r: 0.045 }));
  root.add(rbox(0.025, 1.34, 0.82, "#b5c3a7", { x: 0.935, y: 0.99, z: d / 2 - 0.51 }, { r: 0.025 }));
  root.add(sph(0.033, "#dbc288", { x: 0.91, y: 0.84, z: d / 2 - 0.91 }, { metal: 0.4, rough: 0.4 }, 16));
  root.add(rbox(1.68, 0.022, 0.60, "#7f9b83", { y: 0.015, z: d / 2 + 0.32 }, { r: 0.08 }));
  root.add(rbox(ROOM_W - 0.12, 0.12, 0.12, "#c8c9b7", { y: 0, z: d / 2 + TERRACE_DEPTH - 0.08 }, { r: 0.035 }));
  if (room.level >= 2) {
    for (const side of [-1, 1]) root.add(rbox(0.12, 2.25, 0.12, cream, { x: side * (ROOM_W / 2 - 0.18), y: 1.125, z: d / 2 + 3.82 }, { r: 0.025 }));
    root.add(rbox(ROOM_W - 0.32, 0.10, 0.13, frame, { y: 2.30, z: d / 2 + 3.82 }, { r: 0.03 }));
    for (let i = 0; i < 11; i++) {
      const x = -ROOM_W / 2 + 0.55 + i * (ROOM_W - 1.1) / 10;
      root.add(cyl(0.008, 0.008, 0.16, "#7c8472", { x, y: 2.16, z: d / 2 + 3.82 }, {}, 6));
      root.add(sph(0.055, "#f2dfb5", { x, y: 2.03, z: d / 2 + 3.82 }, { emissive: "#e9c48b", emissiveI: 0.85 }, 14));
    }
  }
  root.add(timber(1.54, 0.09, 0.5, -2.85, 0.46, d / 2 + 3.3));
  root.add(rbox(1.54, 0.36, 0.07, "#99ae98", { x: -2.85, y: 0.69, z: d / 2 + 3.55 }, { r: 0.06 }));
  for (const x of [-3.43, -2.27]) root.add(rbox(0.08, 0.44, 0.40, "#738975", { x, y: 0.22, z: d / 2 + 3.3 }, { r: 0.025 }));
  root.add(cyl(0.24, 0.18, 0.36, "#dcb794", { x: 3.45, y: 0.18, z: d / 2 + 3.33 }, { rough: 0.9 }, 24));
  for (let i = 0; i < 5; i++) {
    const leaf = sph(0.16, i % 2 ? "#9aaf80" : "#6f9b77", { x: 3.45 + Math.cos(i * 1.8) * 0.12, y: 0.58 + i * 0.07, z: d / 2 + 3.33 + Math.sin(i * 1.8) * 0.12 }, {}, 20);
    leaf.scale.set(0.85, 1.7, 0.35); leaf.rotation.z = Math.cos(i) * 0.4; root.add(leaf);
  }

  root.add(upper);
  const levelColor = houseLevel(room.level).color;
  root.add(rbox(0.74, 0.28, 0.035, levelColor, { x: -1.35, y: 0.40, z: d / 2 + 0.075 }, { r: 0.025 }));
  for (let i = 0; i < room.level; i++) root.add(sph(0.018, "#fff4d9", { x: -1.62 + i * 0.12, y: 0.41, z: d / 2 + 0.105 }, {}, 10));
  shadowify(root);
  const bounce = new THREE.PointLight("#ffe2b0", 3.6, Math.max(7, height + 2), 2);
  bounce.position.set(-0.8, Math.min(height - 0.4, STORY_HEIGHT + 0.2), (back + front) / 2); root.add(bounce);
  return { root, upper };
}

export function garden() {
  const root = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat("#d7e1d2", { rough: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.43; ground.receiveShadow = true; root.add(ground);
  const lawn = rbox(36.5, 0.12, 28, "#b9cba7", { y: -0.42, z: 1.8 }, { r: 0.05, rough: 1 }); lawn.receiveShadow = true; root.add(lawn);
  const promenade = rbox(36, 0.045, 1.4, "#d9d5c1", { y: -0.33, z: 13.2 }, { r: 0.02 }); promenade.receiveShadow = true; root.add(promenade);
  for (const x of [-HOUSE_PITCH, 0, HOUSE_PITCH]) {
    for (let i = 0; i < 5; i++) root.add(rbox(1.1, 0.065, 0.6, i % 2 ? "#d5d1bc" : "#ded9c5", { x, y: -0.31, z: 9.2 + i * 0.75 }, { r: 0.08 }));
    for (const side of [-1, 1]) {
      root.add(rbox(0.56, 0.44, 2.5, "#8da879", { x: x + side * 4.65, y: -0.13, z: 6.5 }, { r: 0.19, rough: 1 }));
      for (let n = 0; n < 5; n++) root.add(sph(0.055, n % 2 ? "#e9c597" : "#dcaaa7", { x: x + side * 4.66, y: 0.15, z: 5.5 + n * 0.46 }, {}, 12));
    }
  }
  for (let i = 0; i < 13; i++) {
    const a = i / 13 * Math.PI * 2, tree = new THREE.Group();
    tree.add(cyl(0.1, 0.16, 1.3, "#a48667", { y: 0.3 }, { rough: 0.96 }, 14));
    for (let j = 0; j < 3; j++) { const crown = sph(0.7, ["#a6ba92", "#99b89a", "#b7c69b"][(i + j) % 3], { x: Math.cos(j * 2) * 0.34, y: 1 + j * 0.31, z: Math.sin(j * 2) * 0.32 }, { rough: 0.94 }, 24); crown.scale.set(1, 1.1, 1); tree.add(crown); }
    tree.position.set(Math.cos(a) * 21, 0, Math.sin(a) * 17); shadowify(tree); root.add(tree);
  }
  return root;
}

export function disposeWorldTextures() { oak?.dispose(); contact?.dispose(); oak = null; contact = null; }