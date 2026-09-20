import * as THREE from "three";
import { OUTDOOR_MAP, type OutdoorItem } from "../game/commons";
import { cyl, rbox, shadowify, sph, torus } from "./props";

export function buildOutdoor(item: OutdoorItem) {
  const def = OUTDOOR_MAP[item.defId];
  const root = new THREE.Group();
  const color = def.color, wood = ["#bfa383", "#a78d6c", "#8b745c"][item.grade], cream = "#efe7d4";
  const add = (...objects: THREE.Object3D[]) => root.add(...objects);
  const beam = (w: number, h: number, d: number, x: number, y: number, z: number, tint = wood) => rbox(w, h, d, tint, { x, y, z }, { r: 0.035, rough: 0.82 });
  const flowers = (x: number, y: number, z: number, count: number, tint: string) => {
    for (let i = 0; i < count; i++) {
      const a = i * 2.4, r = 0.1 + Math.sqrt(i / count) * 0.46;
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      add(cyl(0.012, 0.014, 0.18, "#879d74", { x: px, y: y + 0.1, z: pz }, {}, 6));
      add(sph(0.065, tint, { x: px, y: y + 0.22 + (i % 3) * 0.025, z: pz }, { rough: 0.9 }, 12));
    }
  };
  const planter = (x: number, z: number, tint: string) => {
    add(cyl(0.25, 0.19, 0.33, tint, { x, y: 0.165, z }, {}, 16));
    for (let i = 0; i < 5; i++) { const leaf = sph(0.15, i % 2 ? "#819b74" : "#a6b58a", { x: x + Math.cos(i * 1.8) * 0.15, y: 0.52 + i * 0.04, z: z + Math.sin(i * 1.8) * 0.14 }, {}, 14); leaf.scale.set(0.6, 1.6, 0.5); add(leaf); }
  };
  switch (item.defId) {
    case "roseArch":
      for (const x of [-0.7, 0.7]) { add(beam(0.12, 1.9, 0.14, x, 0.95, 0)); flowers(x, 0.16, 0, 7, color); }
      add(beam(1.64, 0.13, 0.24, 0, 1.9, 0));
      for (let i = 0; i < 9; i++) add(sph(0.13, i % 2 ? "#91a784" : color, { x: -0.72 + i * 0.18, y: 1.9 + Math.sin(i) * 0.09, z: 0.02 }, {}, 14));
      break;
    case "cherryTree":
      add(cyl(0.07, 0.15, 1.45, wood, { y: 0.72 }, {}, 14));
      for (let i = 0; i < 5; i++) { const crown = sph(0.48, i % 2 ? "#e8c9cf" : color, { x: Math.cos(i * 2) * 0.4, y: 1.45 + (i % 3) * 0.16, z: Math.sin(i * 2) * 0.36 }, {}, 20); crown.scale.y = 0.8; add(crown); }
      add(cyl(0.62, 0.66, 0.05, "#b4bea0", { y: 0.025 }, {}, 28)); break;
    case "lavenderBed":
      add(beam(1.65, 0.17, 1.1, 0, 0.085, 0));
      flowers(-0.35, 0.18, 0, 12, color); flowers(0.35, 0.18, 0, 12, "#b4a6cc"); break;
    case "koiPond": {
      add(cyl(0.95, 1.0, 0.15, "#b3b7a4", { y: 0.075 }, {}, 36), cyl(0.85, 0.85, 0.018, "#89b8b1", { y: 0.155 }, { rough: 0.19 }, 36));
      for (let i = 0; i < 4; i++) { const fish = sph(0.065, i % 2 ? "#e5bd86" : "#d7926b", { x: Math.sin(i * 2) * 0.5, y: 0.169, z: Math.cos(i * 2) * 0.45 }, {}, 12); fish.scale.set(2, 0.25, 0.7); fish.rotation.y = i; add(fish); }
      add(cyl(0.18, 0.18, 0.012, "#829e72", { x: 0.39, y: 0.17, z: -0.36 }, {}, 18)); break;
    }
    case "stoneLantern":
      add(cyl(0.30, 0.38, 0.12, color, { y: 0.06 }), beam(0.24, 0.65, 0.24, 0, 0.44, 0, color), beam(0.55, 0.1, 0.55, 0, 0.80, 0, color));
      add(beam(0.34, 0.36, 0.34, 0, 1.04, 0, cream), beam(0.15, 0.20, 0.018, 0, 1.04, 0.179, "#d8bf86"), cyl(0.07, 0.47, 0.22, color, { y: 1.34 }, {}, 4), sph(0.065, color, { y: 1.5 })); break;
    case "solarLamp":
      add(cyl(0.18, 0.24, 0.1, wood, { y: 0.05 }), cyl(0.055, 0.07, 1.68, color, { y: 0.88 }, {}, 12));
      add(beam(0.5, 0.06, 0.43, 0, 1.85, 0, "#57738b"), sph(0.18, "#f0dcb2", { y: 1.58 }, { emissive: "#e5c896", emissiveI: 0.55 }, 20)); break;
    case "pergola":
      for (const x of [-0.75, 0.75]) for (const z of [-0.65, 0.65]) add(beam(0.1, 1.86, 0.1, x, 0.93, z));
      for (let i = 0; i < 6; i++) add(beam(1.9, 0.09, 0.10, 0, 1.9, -0.8 + i * 0.32));
      add(beam(1.3, 0.08, 0.45, 0, 0.42, -0.35), beam(1.3, 0.30, 0.065, 0, 0.62, -0.58, color)); planter(-0.68, 0.52, cream); break;
    case "picnicTable":
      add(beam(1.55, 0.09, 0.7, 0, 0.77, 0), beam(1.6, 0.07, 0.23, 0, 0.44, -0.62), beam(1.6, 0.07, 0.23, 0, 0.44, 0.62));
      for (const x of [-0.55, 0.55]) { add(beam(0.07, 0.72, 0.60, x, 0.36, 0)); add(beam(0.08, 0.38, 1.35, x, 0.2, 0)); } break;
    case "gardenSwing":
      for (const x of [-0.78, 0.78]) add(beam(0.10, 1.8, 0.12, x, 0.9, 0));
      add(beam(1.84, 0.12, 0.20, 0, 1.8, 0));
      for (const x of [-0.51, 0.51]) add(cyl(0.014, 0.014, 1.18, "#879183", { x, y: 1.14 }, {}, 8));
      add(beam(1.25, 0.09, 0.50, 0, 0.51, 0, color), beam(1.25, 0.4, 0.06, 0, 0.75, -0.24, cream)); break;
    case "sculpture": {
      add(beam(0.74, 0.26, 0.74, 0, 0.13, 0, "#b7b7a5"));
      const sculpture = new THREE.Mesh(new THREE.TorusKnotGeometry(0.32, 0.075, 56, 10), new THREE.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.35 }));
      sculpture.position.y = 0.91; sculpture.scale.y = 1.45; sculpture.geometry.userData.owned = true; sculpture.material.userData.owned = true; add(sculpture); break;
    }
    case "windChimes":
      add(beam(0.08, 1.9, 0.08, -0.40, 0.95, 0), beam(0.85, 0.07, 0.08, 0, 1.89, 0));
      for (let i = 0; i < 6; i++) { const x = -0.24 + i * 0.105; add(cyl(0.007, 0.007, 0.24, wood, { x, y: 1.72 }, {}, 6)); add(cyl(0.026, 0.026, 0.5 + (i % 3) * 0.07, color, { x, y: 1.33 }, { metal: 0.35 }, 12)); } break;
    case "bambooHedge":
      add(beam(1.7, 0.15, 0.58, 0, 0.075, 0));
      for (let i = 0; i < 9; i++) { add(cyl(0.04, 0.045, 1.3 + (i % 3) * 0.12, color, { x: -0.7 + i * 0.175, y: 0.85 }, {}, 10)); for (let j = 0; j < 3; j++) add(beam(0.09, 0.02, 0.09, -0.7 + i * 0.175, 0.45 + j * 0.38, 0, "#738d62")); } break;
    case "herbSpiral":
      for (let i = 0; i < 18; i++) { const a = i * 0.46, r = 0.22 + i * 0.035; add(sph(0.10, "#b7b5a1", { x: Math.cos(a) * r, y: 0.09 + (18 - i) * 0.012, z: Math.sin(a) * r }, {}, 12)); }
      flowers(0, 0.22, 0, 12, "#91ac78"); break;
    case "birdHouse":
      add(cyl(0.04, 0.09, 1.4, wood, { y: 0.7 }, {}, 12), beam(0.6, 0.52, 0.5, 0, 1.58, 0, color));
      add(cyl(0.095, 0.095, 0.02, "#5e5748", { y: 1.57, z: 0.26, rx: Math.PI / 2 }, {}, 20), beam(0.27, 0.035, 0.2, 0, 1.4, 0.32));
      for (const side of [-1, 1]) add(rbox(0.43, 0.06, 0.65, cream, { x: side * 0.18, y: 1.9, rz: -side * 0.4 }, { r: 0.02 })); break;
    case "butterflyGarden":
      add(beam(1.65, 0.10, 1.15, 0, 0.05, 0, "#c4b091")); flowers(-0.32, 0.08, 0, 12, color); flowers(0.35, 0.08, 0, 12, "#c7a4bc");
      for (let i = 0; i < 3; i++) for (const side of [-1, 1]) { const wing = sph(0.065, "#e5c592", { x: -0.35 + i * 0.35 + side * 0.065, y: 0.6 + i * 0.09, z: 0.07 }, {}, 12); wing.scale.set(1, 0.28, 0.65); wing.rotation.z = side * 0.45; add(wing); } break;
    case "drinkingFountain":
      add(beam(0.70, 0.9, 0.45, 0, 0.45, 0, color), cyl(0.26, 0.20, 0.06, cream, { y: 0.95 }, {}, 24));
      add(cyl(0.025, 0.025, 0.14, "#8a9e9a", { y: 1.04, z: -0.08 }), beam(0.24, 0.08, 0.04, 0, 0.69, 0.24, cream)); break;
    case "recyclingStation":
      for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.51; add(beam(0.44, 0.65, 0.42, x, 0.325, 0, ["#9eafa3", "#adbabf", "#c2b496"][i]), beam(0.46, 0.055, 0.45, x, 0.71, 0, wood)); add(beam(0.19, 0.13, 0.015, x, 0.45, 0.22, cream)); } break;
    case "parcelLocker":
      add(beam(1.45, 1.4, 0.50, 0, 0.70, 0, wood));
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { add(beam(0.43, 0.40, 0.025, (x - 1) * 0.46, 0.25 + y * 0.43, 0.27, color), beam(0.08, 0.02, 0.02, (x - 1) * 0.46 + 0.11, 0.25 + y * 0.43, 0.29, cream)); } break;
    case "securityPost":
      add(beam(1.05, 1.5, 0.95, 0, 0.75, 0, color), beam(1.35, 0.1, 1.25, 0, 1.58, 0, wood));
      add(beam(0.71, 0.56, 0.025, 0, 1.14, 0.50, "#c9dfd5"), beam(0.34, 0.91, 0.04, 0.22, 0.51, 0.51, cream));
      add(cyl(0.10, 0.12, 0.09, "#d8bc84", { y: 1.68 }, { emissive: "#d8bb7b", emissiveI: 0.3 })); break;
    case "solarCanopy":
      for (const x of [-0.7, 0.7]) for (const z of [-0.55, 0.55]) add(beam(0.08, 1.7, 0.08, x, 0.85, z, "#9eaca2"));
      add(beam(1.85, 0.08, 1.5, 0, 1.72, 0, cream));
      for (let x = 0; x < 4; x++) for (let z = 0; z < 3; z++) add(beam(0.4, 0.026, 0.43, -0.64 + x * 0.43, 1.78, -0.46 + z * 0.46, color)); break;
  }
  if (item.grade >= 1) { planter(-0.86, -0.68, cream); add(beam(0.32, 0.045, 0.25, 0.76, 0.045, 0.73, cream)); }
  if (item.grade === 2) {
    add(torus(0.035, 0.008, "#d8bb76", { x: 0.76, y: 0.075, z: 0.73, rx: Math.PI / 2 }));
    flowers(0.8, 0.03, 0.55, 4, "#e1c89b");
  }
  shadowify(root);
  const bounds = new THREE.Box3().setFromObject(root), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const scale = Math.min(1, 2.25 / Math.max(size.x, size.z), 2.4 / size.y);
  root.scale.setScalar(scale); root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  return root;
}