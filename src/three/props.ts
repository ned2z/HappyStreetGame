import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FURNITURE_MAP } from "../game/furniture";
import { buildEquipment } from "./equipmentModels";

/* --------------------------------- helpers -------------------------------- */

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export interface MatOpt {
  rough?: number;
  metal?: number;
  emissive?: string;
  emissiveI?: number;
  opacity?: number;
  flat?: boolean;
}

export function mat(color: string, o: MatOpt = {}) {
  const key = `${color}|${o.rough ?? 0.8}|${o.metal ?? 0}|${o.emissive ?? ""}|${o.emissiveI ?? 0}|${o.opacity ?? 1}|${
    o.flat ? 1 : 0
  }`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: o.rough ?? 0.8,
      metalness: o.metal ?? 0,
      emissive: new THREE.Color(o.emissive ?? "#000000"),
      emissiveIntensity: o.emissiveI ?? 1,
      transparent: (o.opacity ?? 1) < 1,
      opacity: o.opacity ?? 1,
      flatShading: !!o.flat,
    });
    matCache.set(key, m);
  }
  return m;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key) as T | undefined;
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g;
}

export interface P {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
}

function apply<T extends THREE.Object3D>(o: T, p: P): T {
  o.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
  o.rotation.set(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0);
  if (p.s) o.scale.setScalar(p.s);
  return o;
}

export function rbox(w: number, h: number, d: number, color: string, p: P = {}, o: MatOpt & { r?: number } = {}) {
  const r = Math.min(o.r ?? 0.06, w / 2.2, h / 2.2, d / 2.2);
  const g = cached(`rb|${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 3, r));
  return apply(new THREE.Mesh(g, mat(color, o)), p);
}

export function box(w: number, h: number, d: number, color: string, p: P = {}, o: MatOpt = {}) {
  const g = cached(`b|${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
  return apply(new THREE.Mesh(g, mat(color, o)), p);
}

export function cyl(rt: number, rb: number, h: number, color: string, p: P = {}, o: MatOpt = {}, seg = 14) {
  const g = cached(`c${rt.toFixed(2)}${rb.toFixed(2)}${h.toFixed(2)}${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
  return apply(new THREE.Mesh(g, mat(color, o)), p);
}

export function sph(r: number, color: string, p: P = {}, o: MatOpt = {}, seg = 14) {
  const g = cached(`s${r.toFixed(2)}${seg}`, () => new THREE.SphereGeometry(r, seg, seg - 4));
  return apply(new THREE.Mesh(g, mat(color, o)), p);
}

export function torus(r: number, t: number, color: string, p: P = {}, o: MatOpt = {}) {
  const g = cached(`t${r.toFixed(2)}${t.toFixed(2)}`, () => new THREE.TorusGeometry(r, t, 8, 18));
  return apply(new THREE.Mesh(g, mat(color, o)), p);
}

export function cone(r: number, h: number, color: string, p: P = {}, o: MatOpt = {}) {
  const g = cached(`co${r.toFixed(2)}${h.toFixed(2)}`, () => new THREE.ConeGeometry(r, h, 14));
  return apply(new THREE.Mesh(g, mat(color, o)), p);
}

const G = (...kids: THREE.Object3D[]) => {
  const g = new THREE.Group();
  kids.forEach((k) => g.add(k));
  return g;
};

export function shadowify(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return o;
}

const WOOD = ["#b4886a", "#9c6a48", "#6f4630"];
const GOLD = "#f0c060";
const pick = <T,>(a: T[], g: number) => a[Math.min(a.length - 1, g)];

/* -------------------------------- builders -------------------------------- */

type Builder = (g: number) => THREE.Object3D;

const bed: Builder = (g) => {
  const w = 1.25 + g * 0.18;
  const l = 1.85 + g * 0.1;
  const frame = pick(["#a98467", "#8a6a4f", "#5d4a3a"], g);
  const sheet = pick(["#dfe7f2", "#bcd4f0", "#e9d7f7"], g);
  const grp = G(
    rbox(w, 0.34, l, frame, { y: 0.24 }, { r: 0.07, rough: 0.85 }),
    rbox(w - 0.1, 0.22, l - 0.22, sheet, { y: 0.5 }, { r: 0.1, rough: 0.95 }),
    rbox(w - 0.08, 0.1, l * 0.45, pick(["#93b4e0", "#8e7fd6", "#d7a8e8"], g), { y: 0.6, z: l * 0.24 }, { r: 0.05 }),
    rbox(w * 0.42, 0.16, 0.34, "#ffffff", { x: -w * 0.22, y: 0.63, z: -l * 0.32 }, { r: 0.07 }),
    rbox(w * 0.9, 0.5 + g * 0.2, 0.12, frame, { y: 0.5 + g * 0.1, z: -l / 2 + 0.02 }, { r: 0.06 }),
    box(0.1, 0.24, 0.1, "#6b533f", { x: -w / 2 + 0.1, y: 0.12, z: l / 2 - 0.12 }),
    box(0.1, 0.24, 0.1, "#6b533f", { x: w / 2 - 0.1, y: 0.12, z: l / 2 - 0.12 }),
  );
  if (g >= 1) grp.add(rbox(w * 0.42, 0.16, 0.34, "#fff3f6", { x: w * 0.22, y: 0.63, z: -l * 0.32 }, { r: 0.07 }));
  if (g >= 2) {
    grp.add(rbox(w * 0.95, 0.7, 0.14, "#e3b7c9", { y: 0.85, z: -l / 2 + 0.1 }, { r: 0.07 }));
    grp.add(sph(0.1, GOLD, { x: -w / 2 + 0.12, y: 1.2, z: -l / 2 + 0.1 }, { metal: 0.8, rough: 0.3 }));
    grp.add(sph(0.1, GOLD, { x: w / 2 - 0.12, y: 1.2, z: -l / 2 + 0.1 }, { metal: 0.8, rough: 0.3 }));
  }
  return grp;
};

const sofa: Builder = (g) => {
  const w = 1.3 + g * 0.3;
  const c = pick(["#8fa8c8", "#c88fa0", "#7a5c8c"], g);
  const grp = G(
    rbox(w, 0.34, 0.85, c, { y: 0.28 }, { r: 0.1 }),
    rbox(w, 0.5, 0.2, c, { y: 0.6, z: -0.34 }, { r: 0.1 }),
    rbox(0.2, 0.42, 0.85, c, { x: -w / 2 + 0.1, y: 0.56 }, { r: 0.09 }),
    rbox(0.2, 0.42, 0.85, c, { x: w / 2 - 0.1, y: 0.56 }, { r: 0.09 }),
    rbox(w * 0.36, 0.14, 0.34, "#fff0f3", { x: -w * 0.2, y: 0.52, z: -0.16, rz: 0.2 }, { r: 0.06 }),
  );
  if (g >= 1) grp.add(rbox(w * 0.34, 0.14, 0.32, "#ffe0b0", { x: w * 0.22, y: 0.52, z: -0.14, rz: -0.2 }, { r: 0.06 }));
  if (g >= 2) {
    grp.add(rbox(w, 0.12, 0.85, "#4a3654", { y: 0.1 }, { r: 0.05 }));
    grp.add(cyl(0.05, 0.05, 0.12, GOLD, { x: -w / 2 + 0.16, y: 0.06, z: 0.3 }, { metal: 0.8, rough: 0.3 }));
    grp.add(cyl(0.05, 0.05, 0.12, GOLD, { x: w / 2 - 0.16, y: 0.06, z: 0.3 }, { metal: 0.8, rough: 0.3 }));
  }
  return grp;
};

const desk: Builder = (g) => {
  const w = 1.25 + g * 0.2;
  const top = pick(WOOD, g);
  const grp = G(
    rbox(w, 0.08, 0.62, top, { y: 0.74 }, { r: 0.03 }),
    box(0.08, 0.72, 0.08, "#59636e", { x: -w / 2 + 0.1, y: 0.36, z: -0.22 }),
    box(0.08, 0.72, 0.08, "#59636e", { x: w / 2 - 0.1, y: 0.36, z: -0.22 }),
    box(0.08, 0.72, 0.08, "#59636e", { x: -w / 2 + 0.1, y: 0.36, z: 0.22 }),
    box(0.08, 0.72, 0.08, "#59636e", { x: w / 2 - 0.1, y: 0.36, z: 0.22 }),
    rbox(0.18, 0.02, 0.24, "#fdfdfd", { x: w * 0.22, y: 0.79, rz: 0.02 }, { r: 0.01 }),
  );
  if (g >= 1) grp.add(rbox(0.34, 0.3, 0.5, pick(WOOD, g), { x: -w / 2 + 0.28, y: 0.55 }, { r: 0.03 }));
  if (g >= 2) {
    grp.add(cyl(0.06, 0.06, 0.3, "#cfd6e0", { x: 0, y: 0.5, z: -0.22 }, { metal: 0.6, rough: 0.35 }));
    grp.add(rbox(0.3, 0.04, 0.2, "#2f3540", { x: w * 0.3, y: 0.82, z: -0.2 }, { r: 0.02 }));
  }
  return grp;
};

const chair: Builder = (g) => {
  const c = pick(["#d9dee6", "#7fb2d9", "#3a3f4a"], g);
  const grp = G(
    rbox(0.46, 0.1, 0.46, c, { y: 0.46 }, { r: 0.05 }),
    rbox(0.44, 0.5, 0.1, c, { y: 0.74, z: -0.2 }, { r: 0.05 }),
    cyl(0.05, 0.05, 0.42, "#4a5059", { y: 0.22 }, { metal: 0.4, rough: 0.5 }),
    cyl(0.22, 0.22, 0.05, "#3c4149", { y: 0.03 }, { metal: 0.4, rough: 0.5 }),
  );
  if (g >= 1) {
    grp.add(rbox(0.1, 0.08, 0.3, c, { x: -0.26, y: 0.6 }, { r: 0.04 }));
    grp.add(rbox(0.1, 0.08, 0.3, c, { x: 0.26, y: 0.6 }, { r: 0.04 }));
  }
  if (g >= 2) grp.add(rbox(0.36, 0.2, 0.08, "#ff8fa3", { y: 1.02, z: -0.18 }, { r: 0.05 }));
  return grp;
};

const wardrobe: Builder = (g) => {
  const w = 0.95 + g * 0.15;
  const h = 1.6 + g * 0.2;
  const c = pick(["#cbbfae", "#a5825f", "#4b3a32"], g);
  const grp = G(
    rbox(w, h, 0.5, c, { y: h / 2 }, { r: 0.05 }),
    box(0.02, h - 0.2, 0.02, "#2c2c33", { y: h / 2, z: 0.26 }),
    sph(0.05, GOLD, { x: -0.1, y: h / 2, z: 0.27 }, { metal: 0.7, rough: 0.3 }),
    sph(0.05, GOLD, { x: 0.1, y: h / 2, z: 0.27 }, { metal: 0.7, rough: 0.3 }),
  );
  if (g >= 2) {
    grp.add(rbox(w * 0.38, h * 0.7, 0.02, "#bfe4ef", { x: -w * 0.22, y: h / 2, z: 0.26 }, { r: 0.01, opacity: 0.55, rough: 0.15, metal: 0.2 }));
    grp.add(rbox(w * 0.38, h * 0.7, 0.02, "#bfe4ef", { x: w * 0.22, y: h / 2, z: 0.26 }, { r: 0.01, opacity: 0.55, rough: 0.15, metal: 0.2 }));
  }
  return grp;
};

const bookColors = ["#e05c5c", "#5c93e0", "#e0b45c", "#6fd08c", "#b46fe0", "#e07fb4"];
const shelfBooks = (grp: THREE.Group, w: number, y: number, n: number, seed: number) => {
  for (let i = 0; i < n; i++) {
    const h = 0.18 + ((i * 7 + seed) % 5) * 0.02;
    grp.add(
      box(0.05, h, 0.16, bookColors[(i + seed) % bookColors.length], {
        x: -w / 2 + 0.1 + i * 0.07,
        y: y + h / 2,
        rz: (i + seed) % 7 === 0 ? 0.16 : 0,
      }),
    );
  }
};

const bookshelf: Builder = (g) => {
  const w = 0.9 + g * 0.25;
  const h = 1.1 + g * 0.45;
  const c = pick(WOOD, g);
  const grp = new THREE.Group();
  grp.add(rbox(w, h, 0.3, c, { y: h / 2 }, { r: 0.03 }));
  const levels = 2 + g;
  for (let i = 0; i < levels; i++) {
    const y = 0.22 + (i * (h - 0.4)) / levels;
    grp.add(box(w - 0.08, 0.04, 0.3, "#f0e6d8", { y, z: 0.01 }));
    shelfBooks(grp, w - 0.12, y + 0.02, Math.floor((w - 0.2) / 0.07), i * 3 + g);
  }
  if (g >= 2) grp.add(cyl(0.08, 0.1, 0.12, "#7fc98c", { x: w / 2 - 0.16, y: h + 0.06 }));
  return grp;
};

const tv: Builder = (g) => {
  const w = 0.9 + g * 0.42;
  const h = w * 0.58;
  const grp = G(
    rbox(w, h, 0.07, "#22262e", { y: 0 }, { r: 0.03, rough: 0.4 }),
    rbox(w - 0.08, h - 0.08, 0.02, "#7fd8ff", { z: 0.05 }, { r: 0.01, emissive: "#3a9fd0", emissiveI: 0.75, rough: 0.2 }),
  );
  if (g >= 1) grp.add(rbox(w * 0.3, 0.06, 0.16, "#31363f", { y: -h / 2 - 0.05, z: 0.06 }, { r: 0.02 }));
  if (g >= 2) {
    grp.add(rbox(0.12, h * 0.8, 0.12, "#2b3038", { x: -w / 2 - 0.14, z: 0.04 }, { r: 0.04 }));
    grp.add(rbox(0.12, h * 0.8, 0.12, "#2b3038", { x: w / 2 + 0.14, z: 0.04 }, { r: 0.04 }));
  }
  return grp;
};

const pc: Builder = (g) => {
  const grp = G(
    rbox(1.1, 0.06, 0.5, "#8d99a8", { y: 0.72 }, { r: 0.02 }),
    box(0.06, 0.7, 0.06, "#6b7583", { x: -0.48, y: 0.36, z: -0.18 }),
    box(0.06, 0.7, 0.06, "#6b7583", { x: 0.48, y: 0.36, z: -0.18 }),
    box(0.06, 0.7, 0.06, "#6b7583", { x: -0.48, y: 0.36, z: 0.18 }),
    box(0.06, 0.7, 0.06, "#6b7583", { x: 0.48, y: 0.36, z: 0.18 }),
    rbox(0.62, 0.36, 0.03, "#2a2f38", { y: 1.02, z: -0.12 }, { r: 0.02 }),
    rbox(0.56, 0.3, 0.01, "#8fe1ff", { y: 1.02, z: -0.1 }, { r: 0.01, emissive: "#3fa0d8", emissiveI: 0.8 }),
    cyl(0.03, 0.03, 0.18, "#3a4049", { y: 0.85, z: -0.12 }),
    rbox(0.34, 0.02, 0.12, "#e6ebf2", { y: 0.76, z: 0.1 }, { r: 0.01 }),
  );
  if (g >= 1)
    grp.add(
      rbox(0.26, 0.5, 0.42, "#1f242c", { x: 0.42, y: 0.25, z: -0.02 }, { r: 0.03 }),
      rbox(0.02, 0.4, 0.32, "#7cf6d0", { x: 0.3, y: 0.25 }, { r: 0.01, emissive: "#37d6a8", emissiveI: 1.2, opacity: 0.8 }),
    );
  if (g >= 2) {
    grp.add(rbox(0.5, 0.3, 0.03, "#2a2f38", { x: -0.5, y: 1.0, z: 0.04, ry: 0.5 }, { r: 0.02 }));
    grp.add(rbox(0.44, 0.24, 0.01, "#ffb0e0", { x: -0.49, y: 1.0, z: 0.06, ry: 0.5 }, { r: 0.01, emissive: "#d05fa0", emissiveI: 0.9 }));
  }
  return grp;
};

const speaker: Builder = (g) => {
  const h = 0.5 + g * 0.35;
  const w = 0.28 + g * 0.08;
  const grp = G(
    rbox(w, h, w, pick(["#3a4049", "#26303a", "#1b1f26"], g), { y: h / 2 }, { r: 0.05 }),
    cyl(w * 0.3, w * 0.3, 0.03, "#15181d", { y: h * 0.72, z: w / 2, rx: Math.PI / 2 }),
    cyl(w * 0.22, w * 0.22, 0.03, "#15181d", { y: h * 0.38, z: w / 2, rx: Math.PI / 2 }),
  );
  if (g >= 1) grp.add(torus(w * 0.3, 0.02, "#ffd166", { y: h * 0.72, z: w / 2 + 0.01 }, { emissive: "#ffb347", emissiveI: 0.6 }));
  if (g >= 2) {
    grp.add(rbox(w, h, w, "#1b1f26", { x: w + 0.12, y: h / 2 }, { r: 0.05 }));
    grp.add(cyl(w * 0.3, w * 0.3, 0.03, "#15181d", { x: w + 0.12, y: h * 0.72, z: w / 2, rx: Math.PI / 2 }));
  }
  return grp;
};

const piano: Builder = (g) => {
  if (g === 0) {
    return G(
      rbox(0.36, 0.44, 0.12, "#c98a4b", { y: 0.5, rz: 0.12 }, { r: 0.1 }),
      rbox(0.12, 0.7, 0.06, "#8a5a2b", { x: 0.22, y: 1.0, rz: 0.12 }, { r: 0.03 }),
      cyl(0.03, 0.03, 0.5, "#6b6b6b", { y: 0.22, rz: 0.1 }, { metal: 0.5 }),
    );
  }
  if (g === 1) {
    return G(
      rbox(1.1, 0.14, 0.38, "#2b2f36", { y: 0.74 }, { r: 0.03 }),
      rbox(1.0, 0.03, 0.26, "#f7f7fa", { y: 0.82, z: 0.04 }, { r: 0.01 }),
      box(0.05, 0.74, 0.05, "#3a3f47", { x: -0.48, y: 0.37 }),
      box(0.05, 0.74, 0.05, "#3a3f47", { x: 0.48, y: 0.37 }),
    );
  }
  return G(
    rbox(1.3, 0.3, 0.95, "#1d2027", { y: 0.74 }, { r: 0.08, rough: 0.25, metal: 0.25 }),
    rbox(1.15, 0.04, 0.3, "#fafafa", { y: 0.9, z: 0.34 }, { r: 0.01 }),
    rbox(1.1, 0.04, 0.8, "#2b2f36", { y: 0.96, z: -0.1, rz: 0.12 }, { r: 0.03, rough: 0.2, metal: 0.3 }),
    cyl(0.06, 0.06, 0.6, "#1d2027", { x: -0.5, y: 0.3 }),
    cyl(0.06, 0.06, 0.6, "#1d2027", { x: 0.5, y: 0.3 }),
    cyl(0.06, 0.06, 0.6, "#1d2027", { z: -0.34, y: 0.3 }),
  );
};

const plant: Builder = (g) => {
  const potC = pick(["#d98e6a", "#b96b52", "#e0c08a"], g);
  const grp = new THREE.Group();
  const potH = 0.2 + g * 0.08;
  grp.add(cyl(0.16 + g * 0.05, 0.12 + g * 0.04, potH, potC, { y: potH / 2 }, { rough: 0.9 }));
  const leaves = 4 + g * 3;
  for (let i = 0; i < leaves; i++) {
    const a = (i / leaves) * Math.PI * 2;
    const r = 0.12 + (i % 3) * 0.05;
    const hh = 0.3 + ((i * 13) % 5) * 0.08 + g * 0.16;
    grp.add(
      sph(0.12 + (i % 2) * 0.05, i % 2 ? "#5fbf7a" : "#7ed694", {
        x: Math.cos(a) * r,
        y: potH + hh,
        z: Math.sin(a) * r,
        s: 1,
      }),
    );
    grp.add(cyl(0.015, 0.02, hh, "#4d8f5c", { x: Math.cos(a) * r * 0.6, y: potH + hh / 2, z: Math.sin(a) * r * 0.6, rz: Math.cos(a) * 0.12 }, {}, 6));
  }
  if (g >= 2) grp.add(cyl(0.3, 0.26, 0.1, "#cfd6e0", { y: 0.05 }, { rough: 0.6 }));
  return grp;
};

const greenwall: Builder = (g) => {
  const w = 0.9 + g * 0.5;
  const h = 0.7 + g * 0.35;
  const grp = G(rbox(w, h, 0.08, "#4b5a45", { z: 0.04 }, { r: 0.03 }));
  const cols = Math.round(w / 0.2);
  const rows = Math.round(h / 0.2);
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const c = (i + j) % 3 === 0 ? "#7ed694" : (i + j) % 3 === 1 ? "#5fbf7a" : "#a8e6a3";
      grp.add(sph(0.1 + ((i * j) % 3) * 0.015, c, { x: -w / 2 + 0.1 + i * 0.2, y: -h / 2 + 0.12 + j * 0.2, z: 0.1 }, {}, 10));
    }
  if (g >= 2) grp.add(rbox(w + 0.1, 0.06, 0.16, "#d8c8a8", { y: -h / 2 - 0.06, z: 0.08 }, { r: 0.02 }));
  return grp;
};

const aquarium: Builder = (g) => {
  const w = 0.5 + g * 0.35;
  const h = 0.35 + g * 0.2;
  const grp = G(
    rbox(w, 0.42 + g * 0.1, 0.35, pick(["#8a6a4f", "#6b5240", "#2f3742"], g), { y: (0.42 + g * 0.1) / 2 }, { r: 0.03 }),
    rbox(w, h, 0.34, "#9fe8ff", { y: 0.42 + g * 0.1 + h / 2 }, { r: 0.02, opacity: 0.45, rough: 0.1, metal: 0.1 }),
    box(w - 0.06, 0.06, 0.3, "#d8c07a", { y: 0.46 + g * 0.1 }),
  );
  for (let i = 0; i < 2 + g; i++)
    grp.add(
      sph(0.045, i % 2 ? "#ff9f68" : "#ffd166", {
        x: -w / 3 + i * 0.16,
        y: 0.42 + g * 0.1 + h * (0.4 + (i % 3) * 0.16),
        z: (i % 2 ? 0.05 : -0.05),
      }, { emissive: "#ff8f4a", emissiveI: 0.25 }, 10),
    );
  if (g >= 1) grp.add(rbox(w, 0.06, 0.34, "#3a4049", { y: 0.42 + g * 0.1 + h }, { r: 0.02, emissive: "#6fd8ff", emissiveI: 0.3 }));
  return grp;
};

const petbed: Builder = (g) => {
  if (g <= 1) {
    const r = 0.3 + g * 0.1;
    const grp = G(
      cyl(r, r * 0.9, 0.12, pick(["#e0a97e", "#c98ab0"], g), { y: 0.06 }),
      torus(r, 0.08, pick(["#f0c9a0", "#e0a9cf"], g), { y: 0.12, rx: Math.PI / 2 }),
    );
    if (g === 1) grp.add(sph(0.14, "#f7f2ea", { x: 0.05, y: 0.18, z: 0.04 }));
    return grp;
  }
  return G(
    rbox(0.7, 0.5, 0.6, "#c79a6b", { y: 0.25 }, { r: 0.05 }),
    rbox(0.66, 0.5, 0.56, "#8a6a4f", { y: 0.78 }, { r: 0.05 }),
    cyl(0.16, 0.16, 0.06, "#4a3b2c", { y: 0.5, z: 0.3, rx: Math.PI / 2 }),
    sph(0.2, "#f7f2ea", { y: 0.62, z: 0.1 }),
    torus(0.18, 0.05, "#e0a9cf", { y: 1.03, rx: Math.PI / 2 }),
  );
};

const lamp: Builder = (g) => {
  if (g === 0)
    return G(
      cyl(0.09, 0.12, 0.05, "#3f4550", { y: 0.03 }),
      cyl(0.02, 0.02, 0.32, "#5c636e", { y: 0.2 }),
      cone(0.16, 0.2, "#ffe9b8", { y: 0.44 }, { emissive: "#ffca6a", emissiveI: 0.9 }),
    );
  if (g === 1)
    return G(
      cyl(0.18, 0.2, 0.05, "#3f4550", { y: 0.03 }),
      cyl(0.03, 0.03, 1.2, "#6b727d", { y: 0.62 }, { metal: 0.5, rough: 0.4 }),
      cyl(0.22, 0.28, 0.32, "#fff0cf", { y: 1.35 }, { emissive: "#ffcf80", emissiveI: 1.0, opacity: 0.95 }),
    );
  return G(
    cyl(0.22, 0.26, 0.06, GOLD, { y: 0.03 }, { metal: 0.8, rough: 0.25 }),
    cyl(0.025, 0.025, 1.5, GOLD, { y: 0.78 }, { metal: 0.8, rough: 0.25 }),
    sph(0.2, "#fff4d8", { y: 1.6 }, { emissive: "#ffd27a", emissiveI: 1.4 }),
    sph(0.13, "#fff4d8", { x: 0.3, y: 1.3 }, { emissive: "#ffd27a", emissiveI: 1.2 }),
    sph(0.13, "#fff4d8", { x: -0.3, y: 1.45 }, { emissive: "#ffd27a", emissiveI: 1.2 }),
    cyl(0.015, 0.015, 0.7, GOLD, { x: 0.3, y: 1.0, rz: -0.2 }, { metal: 0.8 }),
    cyl(0.015, 0.015, 0.9, GOLD, { x: -0.3, y: 1.05, rz: 0.2 }, { metal: 0.8 }),
  );
};

const chandelier: Builder = (g) => {
  const grp = new THREE.Group();
  grp.add(cyl(0.015, 0.015, 0.4, "#c8b07a", { y: 0.2 }, { metal: 0.8, rough: 0.3 }));
  if (g === 0) {
    grp.add(sph(0.2, "#fff3cf", { y: -0.05 }, { emissive: "#ffd27a", emissiveI: 1.2 }));
  } else if (g === 1) {
    grp.add(torus(0.3, 0.03, GOLD, { y: -0.05, rx: Math.PI / 2 }, { metal: 0.85, rough: 0.2 }));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      grp.add(sph(0.08, "#fff3cf", { x: Math.cos(a) * 0.3, y: -0.12, z: Math.sin(a) * 0.3 }, { emissive: "#ffd27a", emissiveI: 1.4 }));
    }
  } else {
    grp.add(torus(0.42, 0.035, GOLD, { y: -0.02, rx: Math.PI / 2 }, { metal: 0.9, rough: 0.15 }));
    grp.add(torus(0.26, 0.03, GOLD, { y: -0.24, rx: Math.PI / 2 }, { metal: 0.9, rough: 0.15 }));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      grp.add(sph(0.075, "#fff8e4", { x: Math.cos(a) * 0.42, y: -0.08, z: Math.sin(a) * 0.42 }, { emissive: "#ffd89a", emissiveI: 1.6 }));
      grp.add(
        cone(0.05, 0.16, "#e8f4ff", { x: Math.cos(a) * 0.3, y: -0.34, z: Math.sin(a) * 0.3, rx: Math.PI }, { opacity: 0.6, rough: 0.05, metal: 0.4 }),
      );
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      grp.add(sph(0.07, "#fff8e4", { x: Math.cos(a) * 0.26, y: -0.3, z: Math.sin(a) * 0.26 }, { emissive: "#ffd89a", emissiveI: 1.6 }));
    }
  }
  return grp;
};

const rug: Builder = (g) => {
  const w = 1.3 + g * 0.45;
  const d = 0.95 + g * 0.3;
  const c = pick(["#8c93a8", "#c98aa0", "#a8603f"], g);
  const grp = G(rbox(w, 0.035, d, c, { y: 0.018 }, { r: 0.015, rough: 1 }));
  grp.add(rbox(w * 0.72, 0.04, d * 0.66, pick(["#a6adc2", "#e0b2c4", "#d8a26a"], g), { y: 0.03 }, { r: 0.015, rough: 1 }));
  if (g >= 1) grp.add(rbox(w * 0.38, 0.045, d * 0.34, pick(["#c3c8d8", "#f2d5de", "#f0d9a8"], g), { y: 0.04 }, { r: 0.015, rough: 1 }));
  return grp;
};

const painting: Builder = (g) => {
  const w = 0.5 + g * 0.3;
  const h = 0.4 + g * 0.22;
  const frame = pick(["#5c636e", "#8a6a4f", GOLD], g);
  const art = pick(["#89b4d9", "#e0a2b4", "#f0d9a8"], g);
  const grp = G(
    rbox(w, h, 0.05, frame, { z: 0.03 }, { r: 0.02, metal: g === 2 ? 0.8 : 0, rough: g === 2 ? 0.25 : 0.7 }),
    rbox(w - 0.08, h - 0.08, 0.02, art, { z: 0.06 }, { r: 0.01 }),
    sph(0.06, "#ffd166", { x: -w * 0.18, y: h * 0.16, z: 0.08 }, {}, 10),
    box(w * 0.5, h * 0.22, 0.01, "#6fa88c", { x: w * 0.12, y: -h * 0.16, z: 0.08 }),
  );
  if (g >= 1) grp.add(box(w * 0.3, h * 0.3, 0.01, "#d97f7f", { x: -w * 0.2, y: -h * 0.18, z: 0.08, rz: 0.3 }));
  if (g >= 2) {
    grp.add(rbox(w * 0.45, 0.06, 0.1, GOLD, { y: h / 2 + 0.06, z: 0.1 }, { r: 0.02, metal: 0.9, rough: 0.2, emissive: "#a97f30", emissiveI: 0.3 }));
  }
  return grp;
};

const curtain: Builder = (g) => {
  const w = 1.1 + g * 0.3;
  const h = 1.5;
  const c = pick(["#dfe4ec", "#9db8d9", "#8a6fa8"], g);
  const grp = G(
    rbox(w + 0.2, 0.06, 0.06, "#5c636e", { y: h / 2 + 0.05, z: 0.08 }, { r: 0.02, metal: 0.5 }),
    rbox(w * 0.82, h * 0.9, 0.03, "#bfe0f0", { y: 0, z: 0.02 }, { r: 0.01, opacity: 0.35, rough: 0.1, metal: 0.3 }),
  );
  for (let i = 0; i < 4; i++) {
    const side = i < 2 ? -1 : 1;
    const k = i % 2;
    grp.add(cyl(0.07 + k * 0.02, 0.09 + k * 0.02, h, c, { x: side * (w / 2 - 0.06 - k * 0.12), y: 0, z: 0.08 }, { rough: 0.95 }, 8));
  }
  if (g >= 2)
    grp.add(
      cyl(0.06, 0.06, h, "#f0e2c8", { x: -w / 2 + 0.3, y: 0, z: 0.12 }, { rough: 0.9 }, 8),
      cyl(0.06, 0.06, h, "#f0e2c8", { x: w / 2 - 0.3, y: 0, z: 0.12 }, { rough: 0.9 }, 8),
    );
  return grp;
};

const aircon: Builder = (g) => {
  if (g === 0)
    return G(
      cyl(0.22, 0.22, 0.1, "#dfe4ec", { y: -0.2, z: 0.16, rx: Math.PI / 2 }),
      cyl(0.04, 0.04, 0.5, "#b8bfc9", { y: -0.5 }),
      sph(0.06, "#9aa3ae", { y: -0.2, z: 0.22 }),
    );
  const w = 0.8 + g * 0.3;
  const grp = G(
    rbox(w, 0.28, 0.22, "#f2f5f9", { z: 0.11 }, { r: 0.08 }),
    box(w - 0.1, 0.03, 0.02, "#c9d2dd", { y: -0.1, z: 0.22 }),
  );
  if (g >= 2) {
    grp.add(rbox(w * 0.3, 0.06, 0.02, "#7fe6ff", { x: w * 0.3, y: 0.05, z: 0.23 }, { r: 0.01, emissive: "#3fc8e8", emissiveI: 1.1 }));
    grp.add(rbox(w + 0.1, 0.05, 0.24, "#dfe6f0", { y: 0.17, z: 0.1 }, { r: 0.02 }));
  }
  return grp;
};

const purifier: Builder = (g) => {
  const h = 0.45 + g * 0.22;
  const grp = G(
    cyl(0.18 + g * 0.03, 0.2 + g * 0.03, h, pick(["#e6ebf2", "#dfe6ef", "#2f3540"], g), { y: h / 2 }, { rough: 0.5 }),
    cyl(0.14, 0.14, 0.02, "#b9c3cf", { y: h + 0.01 }),
  );
  if (g >= 1) grp.add(torus(0.1, 0.015, "#7fe6c8", { y: h * 0.62, z: 0.19, rx: 0 }, { emissive: "#4fd6a8", emissiveI: 1 }));
  if (g >= 2) grp.add(cyl(0.05, 0.05, 0.3, "#8ff0d8", { y: h + 0.14 }, { emissive: "#4fd6b8", emissiveI: 0.8, opacity: 0.55 }));
  return grp;
};

const kitchen: Builder = (g) => {
  const w = 1.0 + g * 0.35;
  const grp = G(
    rbox(w, 0.85, 0.55, pick(["#d8d2c8", "#e8e2d6", "#3a4049"], g), { y: 0.42 }, { r: 0.04 }),
    rbox(w + 0.04, 0.06, 0.58, pick(["#b9bfc9", "#e0e4ea", "#20242b"], g), { y: 0.88 }, { r: 0.02, rough: 0.35, metal: 0.2 }),
    cyl(0.1, 0.1, 0.02, "#4a5059", { x: -w * 0.25, y: 0.92, z: -0.1 }),
    cyl(0.1, 0.1, 0.02, "#4a5059", { x: -w * 0.25, y: 0.92, z: 0.12 }),
    box(w * 0.3, 0.02, 0.3, "#8fb9c8", { x: w * 0.28, y: 0.92 }, { rough: 0.2, metal: 0.4 }),
    cyl(0.02, 0.02, 0.22, "#c9d2dd", { x: w * 0.28, y: 1.03, z: -0.12 }, { metal: 0.7, rough: 0.2 }),
  );
  if (g >= 1) grp.add(rbox(w * 0.45, 0.4, 0.5, "#4a5059", { x: -w * 0.24, y: 0.42, z: 0.04 }, { r: 0.03, metal: 0.5, rough: 0.3 }));
  if (g >= 2) {
    grp.add(rbox(w * 0.4, 0.34, 0.45, "#20242b", { x: w * 0.26, y: 0.3, z: 0.06 }, { r: 0.03 }));
    grp.add(rbox(w * 0.32, 0.22, 0.02, "#ffb063", { x: w * 0.26, y: 0.3, z: 0.3 }, { r: 0.01, emissive: "#ff8f2a", emissiveI: 0.8 }));
  }
  return grp;
};

const fridge: Builder = (g) => {
  const w = 0.55 + g * 0.16;
  const h = 0.9 + g * 0.42;
  const c = pick(["#e8ecf2", "#cfd6e0", "#8d99a8"], g);
  const grp = G(
    rbox(w, h, 0.55, c, { y: h / 2 }, { r: 0.06, rough: 0.35, metal: 0.35 }),
    box(w - 0.06, 0.02, 0.02, "#98a2ae", { y: h * 0.62, z: 0.28 }),
    rbox(0.04, h * 0.3, 0.04, "#7a828d", { x: w * 0.3, y: h * 0.4, z: 0.29 }, { r: 0.02, metal: 0.7, rough: 0.25 }),
    rbox(0.04, h * 0.18, 0.04, "#7a828d", { x: w * 0.3, y: h * 0.78, z: 0.29 }, { r: 0.02, metal: 0.7, rough: 0.25 }),
  );
  if (g >= 2)
    grp.add(rbox(0.22, 0.3, 0.01, "#7fd8ff", { x: -w * 0.22, y: h * 0.7, z: 0.29 }, { r: 0.02, emissive: "#3fa8d8", emissiveI: 0.9 }));
  return grp;
};

const bathtub: Builder = (g) => {
  const w = 1.0 + g * 0.25;
  const grp = G(
    rbox(w, 0.42 + g * 0.08, 0.66, pick(["#dfe4ec", "#f4f7fb", "#f7f2ea"], g), { y: 0.24 }, { r: 0.16, rough: 0.25 }),
    rbox(w - 0.14, 0.12, 0.52, "#bfe6f7", { y: 0.4 }, { r: 0.1, opacity: 0.75, rough: 0.05, metal: 0.2 }),
    cyl(0.03, 0.03, 0.2, "#cfd6e0", { x: -w / 2 + 0.1, y: 0.5, rz: 0.3 }, { metal: 0.8, rough: 0.2 }),
  );
  if (g >= 1) {
    grp.add(sph(0.08, "#ffffff", { x: 0.15, y: 0.46, z: 0.1 }, { opacity: 0.85 }, 10));
    grp.add(sph(0.06, "#ffffff", { x: -0.05, y: 0.47, z: -0.08 }, { opacity: 0.85 }, 10));
  }
  if (g >= 2) {
    grp.add(cyl(0.05, 0.06, 0.16, GOLD, { x: -w / 2 + 0.16, y: 0.16, z: 0.24 }, { metal: 0.9, rough: 0.2 }));
    grp.add(cyl(0.05, 0.06, 0.16, GOLD, { x: w / 2 - 0.16, y: 0.16, z: 0.24 }, { metal: 0.9, rough: 0.2 }));
    grp.add(rbox(w * 0.3, 0.05, 0.16, "#e8d7b8", { x: w * 0.2, y: 0.52, z: 0.2 }, { r: 0.02 }));
  }
  return grp;
};

const smartlock: Builder = (g) => {
  const grp = G(
    rbox(0.16, 0.34, 0.07, pick(["#8d99a8", "#3a4049", "#20242b"], g), { z: 0.04 }, { r: 0.03, metal: 0.6, rough: 0.3 }),
    cyl(0.03, 0.03, 0.14, "#c9d2dd", { z: 0.1, y: -0.1, rz: Math.PI / 2 }, { metal: 0.8, rough: 0.2 }),
  );
  if (g >= 1) grp.add(rbox(0.1, 0.12, 0.01, "#7fe6a8", { y: 0.08, z: 0.08 }, { r: 0.02, emissive: "#3fd68a", emissiveI: 1.1 }));
  if (g >= 2) grp.add(torus(0.07, 0.012, "#7fd8ff", { y: 0.08, z: 0.09 }, { emissive: "#3fa8d8", emissiveI: 1.2 }));
  return grp;
};

const cctv: Builder = (g) => {
  const grp = G(
    rbox(0.1, 0.1, 0.1, "#dfe4ec", { z: 0.06 }, { r: 0.03 }),
    cyl(0.07, 0.07, 0.22, "#eef2f7", { z: 0.2, rx: Math.PI / 2 - 0.35 }, { rough: 0.5 }),
    sph(0.05, "#20242b", { z: 0.3, y: -0.06 }, { rough: 0.15, metal: 0.3 }),
    sph(0.018, "#ff6b6b", { z: 0.28, y: 0.04 }, { emissive: "#ff4d4d", emissiveI: 1.4 }, 8),
  );
  if (g >= 1) grp.add(torus(0.08, 0.012, "#9aa3ae", { z: 0.26, rx: Math.PI / 2 - 0.35 }, { metal: 0.6 }));
  if (g >= 2) {
    grp.add(cyl(0.07, 0.07, 0.2, "#eef2f7", { x: 0.26, z: 0.18, rx: Math.PI / 2 - 0.35, ry: 0.5 }, { rough: 0.5 }));
    grp.add(sph(0.045, "#20242b", { x: 0.32, z: 0.26, y: -0.05 }, { rough: 0.15 }));
  }
  return grp;
};

const fireext: Builder = (g) => {
  const grp = G(
    cyl(0.1, 0.11, 0.42, "#d94f4f", { y: 0.21 }, { rough: 0.45, metal: 0.25 }),
    cyl(0.04, 0.05, 0.1, "#3a4049", { y: 0.46 }, { metal: 0.6, rough: 0.3 }),
    torus(0.05, 0.015, "#20242b", { y: 0.5, rx: Math.PI / 2 }, { metal: 0.6 }),
  );
  if (g >= 1)
    grp.add(
      rbox(0.24, 0.3, 0.14, "#e8ecf2", { x: 0.28, y: 0.16 }, { r: 0.03 }),
      box(0.16, 0.05, 0.01, "#d94f4f", { x: 0.28, y: 0.22, z: 0.08 }),
      box(0.05, 0.16, 0.01, "#d94f4f", { x: 0.28, y: 0.22, z: 0.08 }),
    );
  if (g >= 2)
    grp.add(
      cyl(0.03, 0.03, 0.5, "#c9d2dd", { x: -0.2, y: 0.9, rz: 0 }, { metal: 0.7, rough: 0.25 }),
      cone(0.06, 0.1, "#c9d2dd", { x: -0.2, y: 1.18 }, { metal: 0.7, rough: 0.25 }),
    );
  return grp;
};

const gym: Builder = (g) => {
  if (g === 0)
    return G(
      cyl(0.02, 0.02, 0.36, "#8d99a8", { y: 0.1, rz: Math.PI / 2 }, { metal: 0.7, rough: 0.3 }),
      rbox(0.12, 0.2, 0.2, "#2f3540", { x: -0.18, y: 0.1 }, { r: 0.05 }),
      rbox(0.12, 0.2, 0.2, "#2f3540", { x: 0.18, y: 0.1 }, { r: 0.05 }),
      cyl(0.02, 0.02, 0.36, "#8d99a8", { x: 0.4, y: 0.1, rz: Math.PI / 2 }, { metal: 0.7 }),
      rbox(0.12, 0.2, 0.2, "#2f3540", { x: 0.22, y: 0.1 }, { r: 0.05 }),
    );
  const grp = G(
    rbox(0.45, 0.16, 1.1, "#2f3540", { y: 0.55 }, { r: 0.06 }),
    box(0.1, 0.5, 0.1, "#4a5059", { y: 0.25, z: -0.4 }, { metal: 0.4 }),
    box(0.1, 0.5, 0.1, "#4a5059", { y: 0.25, z: 0.4 }, { metal: 0.4 }),
    cyl(0.03, 0.03, 1.4, "#b9c3cf", { y: 1.0, rz: Math.PI / 2 }, { metal: 0.8, rough: 0.25 }),
    cyl(0.22, 0.22, 0.06, "#20242b", { x: -0.6, y: 1.0, rz: Math.PI / 2 }),
    cyl(0.22, 0.22, 0.06, "#20242b", { x: 0.6, y: 1.0, rz: Math.PI / 2 }),
  );
  if (g >= 2) {
    grp.add(rbox(0.5, 1.6, 0.12, "#3a4049", { x: -0.85, y: 0.8 }, { r: 0.04 }));
    grp.add(cyl(0.26, 0.26, 0.07, "#20242b", { x: -0.6, y: 1.0, rz: Math.PI / 2 }));
    grp.add(rbox(0.6, 0.06, 0.6, "#5a4fa8", { x: 0.8, y: 0.03 }, { r: 0.02 }));
  }
  return grp;
};

const yoga: Builder = (g) => {
  const grp = G(rbox(0.62, 0.05, 1.5, pick(["#8fd3c8", "#c8a2ff", "#ffb3c8"], g), { y: 0.03 }, { r: 0.02, rough: 0.95 }));
  if (g >= 1) {
    grp.add(rbox(0.22, 0.12, 0.3, "#f0c060", { x: 0.42, y: 0.06, z: -0.4 }, { r: 0.05 }));
    grp.add(cyl(0.1, 0.1, 0.38, "#8a6fa8", { x: 0.42, y: 0.1, z: 0.3, rz: Math.PI / 2 }));
  }
  if (g >= 2) {
    grp.add(rbox(1.2, 1.7, 0.06, "#dfeaf5", { x: -0.6, y: 0.85, rz: 0.06 }, { r: 0.03, rough: 0.08, metal: 0.6, opacity: 0.85 }));
    grp.add(sph(0.16, "#f7e2a8", { x: 0.45, y: 0.16, z: 0.62 }, { emissive: "#e8c070", emissiveI: 0.3 }));
  }
  return grp;
};

const soundproof: Builder = (g) => {
  const w = 1.0 + g * 0.35;
  const h = 0.8 + g * 0.3;
  const grp = new THREE.Group();
  const c = pick(["#8d99a8", "#6b5a7a", "#3a3140"], g);
  const cols = Math.round(w / 0.26);
  const rows = Math.round(h / 0.26);
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++)
      grp.add(
        box(0.22, 0.22, 0.07 + ((i + j) % 2) * 0.05, (i + j) % 2 ? c : "#a8b2c0", {
          x: -w / 2 + 0.14 + i * 0.26,
          y: -h / 2 + 0.14 + j * 0.26,
          z: 0.05,
          rz: Math.PI / 4,
        }),
      );
  if (g >= 2) grp.add(rbox(w + 0.12, h + 0.12, 0.04, "#2b2f36", { z: 0.01 }, { r: 0.02 }));
  return grp;
};

const robot: Builder = (g) => {
  if (g === 0)
    return G(
      rbox(0.18, 0.4, 0.18, "#cfd6e0", { y: 0.2 }, { r: 0.06 }),
      cyl(0.02, 0.02, 0.4, "#8d99a8", { y: 0.55 }, { metal: 0.6 }),
      rbox(0.26, 0.06, 0.16, "#3a4049", { y: 0.03 }, { r: 0.02 }),
    );
  const c = g === 1 ? "#dfe4ec" : "#2b3038";
  return G(
    cyl(0.26, 0.26, 0.1, c, { y: 0.05 }, { rough: 0.4, metal: 0.2 }),
    cyl(0.2, 0.22, 0.04, "#20242b", { y: 0.01 }),
    torus(0.05, 0.012, "#7fd8ff", { y: 0.11, rx: Math.PI / 2 }, { emissive: "#3fa8d8", emissiveI: 1.2 }),
    sph(0.03, "#7fe6a8", { x: 0.14, y: 0.11, z: 0.14 }, { emissive: "#3fd68a", emissiveI: 1.2 }, 8),
    ...(g >= 2 ? [cyl(0.32, 0.32, 0.03, "#3a4049", { y: 0.14 }, { metal: 0.5, rough: 0.3 })] : []),
  );
};

const clock: Builder = (g) => {
  const r = 0.18 + g * 0.08;
  const grp = G(
    cyl(r, r, 0.06, pick(["#dfe4ec", "#8a6a4f", GOLD], g), { z: 0.04, rx: Math.PI / 2 }, { metal: g === 2 ? 0.8 : 0, rough: g === 2 ? 0.25 : 0.7 }),
    cyl(r - 0.03, r - 0.03, 0.02, "#fdf6e8", { z: 0.075, rx: Math.PI / 2 }),
    box(0.015, r * 0.6, 0.01, "#3a4049", { y: r * 0.22, z: 0.09 }),
    box(r * 0.42, 0.015, 0.01, "#7a5a3a", { x: r * 0.18, z: 0.09 }),
  );
  if (g >= 1) grp.add(sph(0.025, GOLD, { z: 0.1 }, { metal: 0.9, rough: 0.2 }, 8));
  if (g >= 2) {
    grp.add(rbox(r * 1.1, 0.7, 0.16, "#8a6a4f", { y: -r - 0.4, z: 0.06 }, { r: 0.03 }));
    grp.add(sph(0.07, GOLD, { y: -r - 0.62, z: 0.12 }, { metal: 0.9, rough: 0.2 }));
  }
  return grp;
};

const gamingsetup: Builder = (g) => {
  if (g === 0)
    return G(
      rbox(0.34, 0.14, 0.1, "#3a4049", { y: 0.42, rx: -0.2 }, { r: 0.04 }),
      rbox(0.26, 0.1, 0.02, "#8fe1ff", { y: 0.44, z: 0.05, rx: -0.2 }, { r: 0.01, emissive: "#3fa0d8", emissiveI: 1 }),
      cyl(0.16, 0.18, 0.4, "#5a4fa8", { y: 0.2 }),
    );
  const grp = G(
    rbox(1.2, 0.08, 0.6, "#20242b", { y: 0.74 }, { r: 0.03 }),
    box(0.08, 0.72, 0.08, "#2b3038", { x: -0.5, y: 0.36 }),
    box(0.08, 0.72, 0.08, "#2b3038", { x: 0.5, y: 0.36 }),
    rbox(0.8, 0.44, 0.04, "#15181d", { y: 1.05, z: -0.16 }, { r: 0.02 }),
    rbox(0.74, 0.38, 0.01, "#b08fff", { y: 1.05, z: -0.13 }, { r: 0.01, emissive: "#7a4fd8", emissiveI: 1.1 }),
    rbox(0.42, 0.02, 0.14, "#2b3038", { y: 0.79, z: 0.12 }, { r: 0.01, emissive: "#ff4fd8", emissiveI: 0.5 }),
    rbox(1.2, 0.02, 0.02, "#ff4fd8", { y: 0.69, z: 0.3 }, { r: 0.01, emissive: "#ff4fd8", emissiveI: 1.4 }),
  );
  if (g >= 2) {
    grp.add(rbox(0.55, 0.34, 0.04, "#15181d", { x: -0.62, y: 1.0, z: 0.02, ry: 0.55 }, { r: 0.02 }));
    grp.add(rbox(0.5, 0.28, 0.01, "#7fe6c8", { x: -0.6, y: 1.0, z: 0.04, ry: 0.55 }, { r: 0.01, emissive: "#3fd6a8", emissiveI: 1.1 }));
    grp.add(rbox(0.55, 0.34, 0.04, "#15181d", { x: 0.62, y: 1.0, z: 0.02, ry: -0.55 }, { r: 0.02 }));
    grp.add(rbox(0.5, 0.28, 0.01, "#ffb0e0", { x: 0.6, y: 1.0, z: 0.04, ry: -0.55 }, { r: 0.01, emissive: "#e84fb8", emissiveI: 1.1 }));
    grp.add(rbox(0.3, 0.5, 0.4, "#15181d", { x: 0.75, y: 0.25, z: -0.1 }, { r: 0.03 }));
    grp.add(rbox(0.02, 0.4, 0.3, "#b08fff", { x: 0.6, y: 0.25, z: -0.1 }, { r: 0.01, emissive: "#7a4fd8", emissiveI: 1.3 }));
  }
  return grp;
};

const partylight: Builder = (g) => {
  if (g === 0) {
    const grp = new THREE.Group();
    for (let i = 0; i < 9; i++)
      grp.add(
        sph(0.045, ["#ff6bb5", "#6bd8ff", "#ffe36b", "#8fff9f"][i % 4], { x: -0.6 + i * 0.15, y: Math.sin(i) * 0.06, z: 0.06 }, { emissive: ["#ff2b95", "#2bb8ff", "#ffc32b", "#4fdf6f"][i % 4], emissiveI: 1.4 }, 8),
      );
    return grp;
  }
  const grp = G(
    cyl(0.012, 0.012, 0.3, "#8d99a8", { y: 0.22, z: 0.1 }, { metal: 0.6 }),
    sph(0.18 + g * 0.05, "#cfd8e6", { z: 0.1 }, { metal: 0.95, rough: 0.08, emissive: "#8fa8c8", emissiveI: 0.35, flat: true }, 12),
  );
  if (g >= 2) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      grp.add(
        cone(0.06, 0.18, ["#ff6bb5", "#6bd8ff", "#ffe36b", "#8fff9f"][i], { x: Math.cos(a) * 0.5, y: Math.sin(a) * 0.35, z: 0.14, rx: Math.PI / 2 }, { emissive: ["#ff2b95", "#2bb8ff", "#ffc32b", "#4fdf6f"][i], emissiveI: 1.3 }),
      );
    }
  }
  return grp;
};

const shelf: Builder = (g) => {
  const w = 0.7 + g * 0.35;
  const grp = G(rbox(w, 0.06, 0.24, pick(["#e8e2d6", "#dfe4ec", "#f7f7fa"], g), { z: 0.13 }, { r: 0.02 }));
  grp.add(cyl(0.07, 0.08, 0.14, "#7fc98c", { x: -w * 0.28, y: 0.1, z: 0.12 }));
  grp.add(sph(0.08, "#b9d8f0", { x: w * 0.1, y: 0.1, z: 0.12 }, {}, 10));
  if (g >= 1) grp.add(rbox(w * 0.7, 0.06, 0.22, pick(["#e8e2d6", "#dfe4ec", "#f7f7fa"], g), { y: -0.34, z: 0.12 }, { r: 0.02 }));
  if (g >= 2) {
    grp.add(rbox(w * 0.5, 0.06, 0.2, "#f7f7fa", { y: 0.38, x: w * 0.2, z: 0.11 }, { r: 0.02 }));
    grp.add(box(0.05, 0.16, 0.12, "#e0a97e", { x: w * 0.3, y: 0.47, z: 0.11 }));
  }
  return grp;
};

const diffuser: Builder = (g) => {
  if (g === 0)
    return G(
      cyl(0.09, 0.09, 0.1, "#f2e2c8", { y: 0.05 }),
      cyl(0.012, 0.012, 0.06, "#4a4a4a", { y: 0.12 }),
      sph(0.035, "#ffcf6a", { y: 0.17 }, { emissive: "#ff9f2a", emissiveI: 1.6 }, 8),
    );
  const grp = G(cyl(0.1, 0.13, 0.22, pick(["#e8dcc8", "#dfe6ef", "#2f3540"], g), { y: 0.11 }, { rough: 0.4 }));
  if (g === 1) for (let i = 0; i < 5; i++) grp.add(cyl(0.008, 0.008, 0.3, "#a98467", { x: (i - 2) * 0.03, y: 0.32, rz: (i - 2) * 0.12 }, {}, 6));
  if (g >= 2) {
    grp.add(cyl(0.06, 0.06, 0.03, "#8ff0d8", { y: 0.24 }, { emissive: "#4fd6b8", emissiveI: 1.2 }));
    for (let i = 0; i < 3; i++) grp.add(sph(0.05 - i * 0.008, "#e8f7f2", { x: 0.02 * i, y: 0.34 + i * 0.13 }, { opacity: 0.32 - i * 0.07 }, 8));
  }
  return grp;
};

/* ------------------------------ ของใหม่ 10 ชนิด ------------------------------ */

const washing: Builder = (g) => {
  const w = 0.55 + g * 0.08;
  const h = 0.62 + g * 0.12;
  const grp = G(
    rbox(w, h, 0.55, pick(["#e8ecf2", "#dfe6ef", "#cfd8e6"], g), { y: h / 2 }, { r: 0.06, rough: 0.4, metal: 0.2 }),
    rbox(w - 0.08, 0.1, 0.02, "#3a4049", { y: h - 0.08, z: 0.28 }, { r: 0.02 }),
    torus(0.17, 0.035, "#8d99a8", { y: h * 0.42, z: 0.28 }, { metal: 0.7, rough: 0.25 }),
    cyl(0.15, 0.15, 0.02, "#9fd8ef", { y: h * 0.42, z: 0.28, rx: Math.PI / 2 }, { opacity: 0.7, rough: 0.1, metal: 0.3 }),
  );
  if (g >= 1) grp.add(rbox(0.2, 0.06, 0.01, "#7fe6a8", { x: w * 0.2, y: h - 0.08, z: 0.29 }, { r: 0.01, emissive: "#3fd68a", emissiveI: 1.1 }));
  if (g >= 2) {
    grp.add(sph(0.05, "#bfe6ff", { x: -0.08, y: h * 0.38, z: 0.3 }, { opacity: 0.8 }, 8));
    grp.add(sph(0.04, "#ffffff", { x: 0.07, y: h * 0.46, z: 0.3 }, { opacity: 0.8 }, 8));
    grp.add(rbox(w + 0.06, 0.05, 0.6, GOLD, { y: h + 0.02 }, { r: 0.02, metal: 0.7, rough: 0.3 }));
  }
  return grp;
};

const coffee: Builder = (g) => {
  if (g === 0)
    return G(
      cyl(0.3, 0.32, 0.06, "#8a6a4f", { y: 0.5 }, { rough: 0.7 }),
      cyl(0.04, 0.05, 0.5, "#6b5240", { y: 0.25 }),
      cyl(0.16, 0.2, 0.04, "#6b5240", { y: 0.02 }),
      cyl(0.05, 0.04, 0.08, "#fff4e8", { x: -0.08, y: 0.57 }),
      cyl(0.05, 0.04, 0.08, "#e8b4a0", { x: 0.1, y: 0.57 }),
    );
  const w = 0.9 + g * 0.2;
  const grp = G(
    rbox(w, 0.8, 0.5, pick(WOOD, g), { y: 0.4 }, { r: 0.04 }),
    rbox(w + 0.06, 0.06, 0.54, "#4a3b2c", { y: 0.83 }, { r: 0.02 }),
    rbox(0.3, 0.34, 0.3, "#2b3038", { x: -w * 0.25, y: 1.03 }, { r: 0.04, metal: 0.4, rough: 0.35 }),
    cyl(0.05, 0.04, 0.08, "#fff4e8", { x: w * 0.25, y: 0.9 }),
    cyl(0.05, 0.04, 0.08, "#e8b4a0", { x: w * 0.25 + 0.14, y: 0.9 }),
  );
  if (g >= 1) grp.add(rbox(0.16, 0.05, 0.01, "#ffb063", { x: -w * 0.25, y: 1.14, z: 0.16 }, { r: 0.01, emissive: "#ff8f2a", emissiveI: 1 }));
  if (g >= 2) {
    grp.add(cyl(0.09, 0.11, 0.22, "#cfd6e0", { x: w * 0.05, y: 0.97 }, { metal: 0.6, rough: 0.3 }));
    grp.add(sph(0.06, "#8fd8ff", { x: -w * 0.25, y: 1.26 }, { emissive: "#3fa8d8", emissiveI: 1 }, 10));
    grp.add(cyl(0.02, 0.02, 0.3, "#8d99a8", { x: w * 0.05 + 0.2, y: 1.0, rz: 0.5 }, { metal: 0.7 }));
  }
  return grp;
};

const bike: Builder = (g) => {
  const c = pick(["#5a6a8a", "#3f8a6a", "#8a3f6a"], g);
  const grp = G(
    torus(0.26, 0.035, "#2b3038", { y: 0.28, z: 0.28 }, { rough: 0.6 }),
    torus(0.26, 0.035, "#2b3038", { y: 0.28, z: -0.28 }, { rough: 0.6 }),
    rbox(0.08, 0.08, 0.7, c, { y: 0.42 }, { r: 0.03 }),
    cyl(0.03, 0.03, 0.5, c, { y: 0.6, z: -0.2, rx: 0.5 }, { metal: 0.3 }),
    rbox(0.22, 0.08, 0.26, "#2b3038", { y: 0.86, z: -0.28 }, { r: 0.04 }),
    cyl(0.03, 0.03, 0.45, "#8d99a8", { y: 0.62, z: 0.26, rx: -0.4 }, { metal: 0.6 }),
    rbox(0.34, 0.05, 0.08, "#2b3038", { y: 0.84, z: 0.34 }, { r: 0.02 }),
  );
  if (g >= 1) grp.add(rbox(0.3, 0.2, 0.03, "#1d2129", { y: 1.0, z: 0.32, rx: -0.3 }, { r: 0.02, emissive: "#3fa8d8", emissiveI: 0.5 }));
  if (g >= 2) {
    grp.add(rbox(0.3, 0.2, 0.02, "#b08fff", { y: 1.0, z: 0.33, rx: -0.3 }, { r: 0.01, emissive: "#7a4fd8", emissiveI: 1 }));
    grp.add(torus(0.26, 0.015, "#b08fff", { y: 0.28, z: 0.28 }, { emissive: "#7a4fd8", emissiveI: 1 }));
    grp.add(cyl(0.3, 0.34, 0.04, "#3a3140", { y: 0.02 }, { rough: 0.9 }));
  }
  return grp;
};

const easel: Builder = (g) => {
  if (g === 0)
    return G(
      rbox(0.4, 0.5, 0.06, "#f2ede4", { y: 0.55, rx: -0.15 }, { r: 0.02 }),
      box(0.3, 0.2, 0.02, "#e07f7f", { y: 0.55, z: 0.04 }),
      rbox(0.5, 0.4, 0.4, "#a98467", { y: 0.2 }, { r: 0.03 }),
    );
  const h = 1.3 + g * 0.2;
  const grp = G(
    cyl(0.025, 0.025, h, "#a98467", { x: -0.22, y: h / 2, rz: 0.12 }, {}, 8),
    cyl(0.025, 0.025, h, "#a98467", { x: 0.22, y: h / 2, rz: -0.12 }, {}, 8),
    cyl(0.025, 0.025, h * 0.9, "#8a6a4f", { y: h * 0.42, z: -0.18, rx: 0.3 }, {}, 8),
    rbox(0.7, 0.55, 0.04, "#f7f2ea", { y: h * 0.55 }, { r: 0.01 }),
    sph(0.09, "#e07f7f", { x: -0.15, y: h * 0.6, z: 0.03 }, {}, 8),
    box(0.3, 0.16, 0.01, "#7fa8d9", { x: 0.12, y: h * 0.48, z: 0.03 }),
  );
  if (g >= 2) {
    grp.add(rbox(0.78, 0.63, 0.02, GOLD, { y: h * 0.55, z: -0.02 }, { r: 0.01, metal: 0.8, rough: 0.25 }));
    grp.add(sph(0.05, "#fff3cf", { y: h + 0.05 }, { emissive: "#ffd27a", emissiveI: 1.4 }, 8));
    grp.add(cyl(0.015, 0.015, 0.25, "#4a4a4a", { y: h - 0.05 }, { metal: 0.6 }));
  }
  return grp;
};

const birdcage: Builder = (g) => {
  const r = 0.24 + g * 0.05;
  const h = 0.5 + g * 0.12;
  const grp = G(
    cyl(r, r * 0.85, 0.3 + g * 0.1, "#8a6a4f", { y: (0.3 + g * 0.1) / 2 }, { rough: 0.7 }),
    cyl(r, r, 0.05, "#4a3b2c", { y: 0.32 + g * 0.1 }, { rough: 0.6 }),
    sph(r, "#bfe0f0", { y: 0.35 + g * 0.1 + h / 2 }, { opacity: 0.18, rough: 0.05, metal: 0.2 }, 14),
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    grp.add(cyl(0.012, 0.012, h, GOLD, { x: Math.cos(a) * r * 0.92, y: 0.35 + g * 0.1 + h / 2, z: Math.sin(a) * r * 0.92 }, { metal: 0.8, rough: 0.25 }, 6));
  }
  grp.add(torus(r * 0.95, 0.015, GOLD, { y: 0.35 + g * 0.1 + h, rx: Math.PI / 2 }, { metal: 0.8 }));
  grp.add(cyl(0.02, 0.02, r * 1.7, "#8a6a4f", { y: 0.42 + g * 0.1 + h * 0.3, rz: Math.PI / 2 }, {}, 6));
  // น้องนก
  const bird = (x: number, c: string) =>
    G(
      sph(0.07, c, { x, y: 0.5 + g * 0.1 + h * 0.3 }, {}, 10),
      sph(0.045, c, { x, y: 0.58 + g * 0.1 + h * 0.3, z: 0.03 }, {}, 8),
      cone(0.02, 0.05, "#ffb347", { x, y: 0.57 + g * 0.1 + h * 0.3, z: 0.085, rx: Math.PI / 2 }),
    );
  grp.add(bird(-0.05, "#6fd08c"));
  if (g >= 1) grp.add(bird(0.1, "#6fb4d9"));
  if (g >= 2) grp.add(torus(0.05, 0.012, GOLD, { y: 0.38 + g * 0.1 + h + 0.08 }, { metal: 0.9, rough: 0.2 }));
  return grp;
};

const projector: Builder = (g) => {
  const grp = G(
    box(0.1, 0.1, 0.12, "#3a4049", { y: 0.42, z: 0.06 }),
    rbox(0.34, 0.14, 0.3, "#2b3038", { y: 0.3, z: 0.2 }, { r: 0.04 }),
    cyl(0.05, 0.06, 0.06, "#15181d", { y: 0.3, z: 0.37, rx: Math.PI / 2 }),
    sph(0.03, "#bfe6ff", { y: 0.3, z: 0.4 }, { emissive: "#7fd8ff", emissiveI: 1.4 }, 8),
  );
  const sw = 0.9 + g * 0.35;
  const sh = 0.55 + g * 0.2;
  grp.add(rbox(sw, sh, 0.03, "#f4f7fb", { y: -0.35, z: 0.05 }, { r: 0.01 }));
  grp.add(rbox(sw - 0.08, sh - 0.08, 0.01, pick(["#7fb4d9", "#9f8fd9", "#d98fb4"], g), { y: -0.35, z: 0.07 }, { r: 0.01, emissive: pick(["#3f8ab8", "#6a4fb8", "#b84f8a"], g), emissiveI: 0.7 }));
  grp.add(cone(0.16, 0.5, "#bfe6ff", { y: 0.02, z: 0.3, rx: -0.5 }, { opacity: 0.16, emissive: "#7fd8ff", emissiveI: 0.4 }));
  if (g >= 2) {
    grp.add(rbox(0.1, sh * 0.9, 0.1, "#1d2129", { x: -sw / 2 - 0.1, y: -0.35, z: 0.05 }, { r: 0.03 }));
    grp.add(rbox(0.1, sh * 0.9, 0.1, "#1d2129", { x: sw / 2 + 0.1, y: -0.35, z: 0.05 }, { r: 0.03 }));
  }
  return grp;
};

const safe: Builder = (g) => {
  const w = 0.45 + g * 0.12;
  const h = 0.5 + g * 0.3;
  const c = pick(["#5a6a7a", "#3f4a5a", "#2b2f3a"], g);
  const grp = G(
    rbox(w, h, 0.4, c, { y: h / 2 }, { r: 0.05, metal: 0.5, rough: 0.35 }),
    rbox(w - 0.08, h - 0.08, 0.03, "#20242b", { y: h / 2, z: 0.2 }, { r: 0.03, metal: 0.6, rough: 0.3 }),
    torus(0.06, 0.018, "#c9d2dd", { y: h / 2, z: 0.23 }, { metal: 0.85, rough: 0.2 }),
  );
  if (g >= 1) grp.add(rbox(0.12, 0.16, 0.01, "#7fe6a8", { x: w * 0.28, y: h * 0.68, z: 0.22 }, { r: 0.01, emissive: "#3fd68a", emissiveI: 1 }));
  if (g >= 2) {
    grp.add(rbox(w + 0.04, 0.05, 0.44, GOLD, { y: h + 0.02 }, { r: 0.02, metal: 0.85, rough: 0.2 }));
    grp.add(sph(0.045, "#ff6b8f", { x: -w * 0.28, y: h * 0.68, z: 0.23 }, { emissive: "#ff2b5f", emissiveI: 1.2 }, 10));
    grp.add(box(w * 0.5, 0.04, 0.02, GOLD, { y: 0.1, z: 0.21 }));
  }
  return grp;
};

const massage: Builder = (g) => {
  if (g === 0)
    return G(
      rbox(0.5, 0.12, 0.5, "#7a8a9a", { y: 0.4 }, { r: 0.05 }),
      rbox(0.5, 0.4, 0.12, "#7a8a9a", { y: 0.6, z: -0.22 }, { r: 0.05 }),
      rbox(0.46, 0.3, 0.4, "#8a5a4a", { y: 0.2 }, { r: 0.05 }),
      sph(0.05, "#ff8f6b", { x: -0.1, y: 0.62, z: -0.14 }, { emissive: "#ff5f2b", emissiveI: 0.8 }, 8),
      sph(0.05, "#ff8f6b", { x: 0.1, y: 0.62, z: -0.14 }, { emissive: "#ff5f2b", emissiveI: 0.8 }, 8),
    );
  const c = g === 1 ? "#8a6f9a" : "#3a2f4a";
  const grp = G(
    rbox(0.62, 0.18, 0.6, c, { y: 0.35 }, { r: 0.09 }),
    rbox(0.6, 0.7, 0.2, c, { y: 0.7, z: -0.3, rx: -0.25 }, { r: 0.1 }),
    rbox(0.14, 0.3, 0.5, c, { x: -0.34, y: 0.5 }, { r: 0.07 }),
    rbox(0.14, 0.3, 0.5, c, { x: 0.34, y: 0.5 }, { r: 0.07 }),
    rbox(0.4, 0.18, 0.12, "#e8dcc8", { y: 1.02, z: -0.38, rx: -0.25 }, { r: 0.06 }),
    cyl(0.26, 0.3, 0.22, "#2b2f3a", { y: 0.11 }),
  );
  if (g >= 2) {
    grp.add(torus(0.4, 0.05, "#b08fff", { y: 0.7, z: -0.3, rx: 0.3 }, { emissive: "#7a4fd8", emissiveI: 0.9 }));
    grp.add(rbox(0.5, 0.3, 0.5, "#5a4f8a", { y: 0.35, z: 0.3, rx: 0.2 }, { r: 0.12, opacity: 0.85 }));
    grp.add(sph(0.05, "#8ff0d8", { x: 0.34, y: 0.68, z: 0.1 }, { emissive: "#4fd6b8", emissiveI: 1.2 }, 8));
  }
  return grp;
};

const hammock: Builder = (g) => {
  const cloth = pick(["#e8a87c", "#7fb4a8", "#c8a2ff"], g);
  const grp = G(
    cyl(0.05, 0.06, 1.1, "#7a5a42", { x: -0.65, y: 0.55 }, { rough: 0.8 }, 10),
    cyl(0.05, 0.06, 1.1, "#7a5a42", { x: 0.65, y: 0.55 }, { rough: 0.8 }, 10),
    cyl(0.015, 0.015, 0.5, "#d8c8a8", { x: -0.48, y: 0.72, rz: 1.1 }, {}, 6),
    cyl(0.015, 0.015, 0.5, "#d8c8a8", { x: 0.48, y: 0.72, rz: -1.1 }, {}, 6),
    rbox(0.85, 0.08, 0.5, cloth, { y: 0.52 }, { r: 0.04, rough: 0.95 }),
    rbox(0.3, 0.1, 0.34, "#fff4e8", { x: -0.2, y: 0.6 }, { r: 0.05 }),
  );
  if (g >= 1) {
    grp.add(cyl(0.04, 0.04, 1.5, "#7a5a42", { y: 0.06, rz: Math.PI / 2 }, {}, 8));
    grp.add(sph(0.09, "#7ed694", { x: -0.65, y: 1.14 }, {}, 8));
    grp.add(sph(0.09, "#7ed694", { x: 0.65, y: 1.14 }, {}, 8));
  }
  if (g >= 2) {
    grp.add(cyl(0.04, 0.04, 1.1, "#8d99a8", { x: -0.65, y: 1.5 }, { metal: 0.5 }, 8));
    grp.add(cyl(0.04, 0.04, 1.1, "#8d99a8", { x: 0.65, y: 1.5 }, { metal: 0.5 }, 8));
    grp.add(rbox(1.5, 0.06, 0.7, "#f2e2c8", { y: 2.02 }, { r: 0.03, opacity: 0.9 }));
    grp.add(sph(0.06, "#ffd166", { y: 1.9 }, { emissive: "#ffb347", emissiveI: 1 }, 8));
  }
  return grp;
};

const telescope: Builder = (g) => {
  const tubeL = 0.55 + g * 0.2;
  const grp = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    grp.add(cyl(0.025, 0.025, 0.85, "#4a5059", { x: Math.cos(a) * 0.18, y: 0.4, z: Math.sin(a) * 0.18, rz: Math.cos(a) * -0.25, rx: Math.sin(a) * 0.25 }, { metal: 0.5 }, 8));
  }
  grp.add(cyl(0.07, 0.07, 0.08, "#2b3038", { y: 0.82 }));
  const tube = cyl(0.09 + g * 0.02, 0.11 + g * 0.02, tubeL, pick(["#5a6a8a", "#3a4a6a", "#2b2f4a"], g), { y: 1.05, z: 0.05, rx: -0.6 }, { metal: 0.4, rough: 0.4 }, 12);
  grp.add(tube);
  grp.add(cyl(0.095 + g * 0.02, 0.095 + g * 0.02, 0.03, "#bfe6ff", { y: 1.05 + Math.cos(0.6) * tubeL * 0.5, z: 0.05 - Math.sin(0.6) * tubeL * 0.5, rx: -0.6 }, { emissive: "#7fd8ff", emissiveI: 0.5, opacity: 0.9 }));
  grp.add(cyl(0.03, 0.03, 0.12, "#2b3038", { y: 0.88, z: 0.2, rx: 0.5 }));
  if (g >= 1) grp.add(cyl(0.03, 0.04, 0.14, "#8d99a8", { x: 0.12, y: 1.0, z: 0.02, rx: -0.6 }, { metal: 0.6 }));
  if (g >= 2) {
    grp.add(rbox(0.24, 0.16, 0.02, "#1d2129", { x: -0.2, y: 0.7, z: 0.15, ry: 0.4 }, { r: 0.01, emissive: "#7a4fd8", emissiveI: 0.8 }));
    grp.add(sph(0.04, "#ffd166", { x: 0.3, y: 1.3, z: -0.1 }, { emissive: "#ffb347", emissiveI: 1.4 }, 8));
    grp.add(sph(0.03, "#ffffff", { x: -0.25, y: 1.45, z: -0.15 }, { emissive: "#ffffff", emissiveI: 1.2 }, 8));
  }
  return grp;
};

export const BUILDERS: Record<string, Builder> = {
  bed,
  sofa,
  desk,
  chair,
  wardrobe,
  bookshelf,
  tv,
  pc,
  speaker,
  piano,
  plant,
  greenwall,
  aquarium,
  petbed,
  lamp,
  chandelier,
  rug,
  painting,
  curtain,
  aircon,
  purifier,
  kitchen,
  fridge,
  bathtub,
  smartlock,
  cctv,
  fireext,
  gym,
  yoga,
  soundproof,
  robot,
  clock,
  gamingsetup,
  partylight,
  shelf,
  diffuser,
  washing,
  coffee,
  bike,
  easel,
  birdcage,
  projector,
  safe,
  massage,
  hammock,
  telescope,
};

export function buildProp(defId: string, grade: number) {
  const definition = FURNITURE_MAP[defId];
  if (definition?.model) return shadowify(buildEquipment(definition, grade));
  const b = BUILDERS[defId];
  const obj = b ? b(grade) : rbox(0.4, 0.4, 0.4, "#ff77aa", { y: 0.2 }, { r: 0.08 });
  return shadowify(obj);
}
