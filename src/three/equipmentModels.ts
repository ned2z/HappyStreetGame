import * as THREE from "three";
import type { FurnitureDef } from "../game/furniture";
import { cyl, rbox, sph, torus } from "./props";

/** Each catalog model has its own silhouette; shared parts keep mobile draw costs modest. */
export function buildEquipment(def: FurnitureDef, grade: number) {
  const g = new THREE.Group();
  const c = def.accent ?? "#a9b8a0";
  const wood = ["#c9ac85", "#b8956d", "#967453"][grade];
  const trim = grade === 2 ? "#cbb16d" : "#8c9c92";
  const cream = "#f0e6d6", dark = "#3c4b4a";
  const add = (...objects: THREE.Object3D[]) => g.add(...objects);
  const rb = (w: number, h: number, d: number, color: string, x = 0, y = h / 2, z = 0) => rbox(w, h, d, color, { x, y, z }, { r: Math.min(0.055, h / 3), rough: 0.72 });
  const legs = (w: number, d: number, h: number, y = h / 2) => {
    for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) add(cyl(0.032, 0.028, h, wood, { x, y, z }, {}, 10));
  };
  const cabinet = (w = 0.8, h = 0.8, d = 0.55) => {
    add(rb(w, h, d, c));
    add(rb(w - 0.1, h - 0.12, 0.018, cream, 0, h / 2, d / 2 + 0.01));
    add(rb(0.17, 0.025, 0.04, trim, 0, h * 0.72, d / 2 + 0.04));
    add(rb(w + 0.025, 0.055, d + 0.025, wood, 0, h + 0.015));
  };
  const screen = (w: number, h: number, x: number, y: number, z: number) => {
    add(rb(w, h, 0.055, dark, x, y, z));
    add(rb(w - 0.055, h - 0.055, 0.012, "#9dd0c0", x, y, z + 0.035));
  };
  const plant = (x: number, y: number, z: number, s = 1) => {
    add(cyl(0.10 * s, 0.07 * s, 0.14 * s, wood, { x, y: y + 0.07 * s, z }, {}, 14));
    for (let i = 0; i < 4; i++) {
      const leaf = sph(0.07 * s, i % 2 ? "#8bac75" : "#658d70", { x: x + Math.cos(i * 2) * 0.055 * s, y: y + (0.19 + i * 0.018) * s, z: z + Math.sin(i * 2) * 0.05 * s }, {}, 12);
      leaf.scale.set(0.7, 1.6, 0.45); leaf.rotation.z = Math.sin(i) * 0.5; add(leaf);
    }
  };
  const mattress = (y: number, tint: string) => {
    add(rb(1.12, 0.12, 1.52, wood, 0, y));
    add(rb(1.04, 0.16, 1.40, tint, 0, y + 0.12));
    add(rb(0.65, 0.09, 0.28, cream, 0, y + 0.23, -0.48));
    add(rb(1.05, 0.04, 0.7, c, 0, y + 0.22, 0.29));
  };

  switch (def.model) {
    case "bunk": {
      mattress(0.20, "#e3dbca"); mattress(1.24, "#e0d2c4");
      for (const x of [-0.58, 0.58]) for (const z of [-0.78, 0.78]) add(rb(0.07, 1.75, 0.07, wood, x, 0.875, z));
      add(rb(1.2, 0.08, 0.055, c, 0, 1.64, 0.78), rb(1.2, 0.08, 0.055, c, 0, 1.64, -0.78));
      for (let i = 0; i < 5; i++) add(rb(0.35, 0.04, 0.06, cream, 0.33, 0.28 + i * 0.28, 0.81));
      break;
    }
    case "daybed": {
      mattress(0.27, "#f1e6d9");
      add(rb(1.18, 0.58, 0.08, c, 0, 0.63, -0.75));
      for (const x of [-0.30, 0.30]) add(rb(0.51, 0.18, 0.055, cream, x, 0.16, 0.77), rb(0.12, 0.025, 0.045, trim, x, 0.16, 0.81));
      break;
    }
    case "murphy": {
      add(rb(1.22, 1.8, 0.18, wood, 0, 0.9, -0.72)); mattress(0.18, "#d8e0d2");
      add(rb(1.04, 0.45, 0.05, cream, 0, 1.4, -0.6));
      legs(0.9, 1.25, 0.14); break;
    }
    case "study-pod": {
      add(rb(1.2, 1.55, 0.09, c, 0, 0.78, -0.4), rb(0.1, 1.55, 0.85, c, -0.55, 0.78), rb(0.1, 1.55, 0.85, c, 0.55, 0.78));
      add(rb(1.05, 0.06, 0.70, wood, 0, 0.74), rb(0.40, 0.10, 0.40, cream, 0, 0.4, 0.38));
      add(rb(0.24, 0.02, 0.20, "#e4c49a", 0, 0.79));
      add(rb(0.7, 0.026, 0.06, "#f0d595", 0, 1.41, -0.29)); break;
    }
    case "screen": {
      for (let i = 0; i < 3; i++) {
        const panel = new THREE.Group();
        panel.add(rb(0.39, 1.5, 0.06, wood), rb(0.31, 1.30, 0.035, c, 0, 0.81, 0.04));
        for (let j = 0; j < 6; j++) panel.add(rb(0.315, 0.012, 0.014, cream, 0, 0.22 + j * 0.2, 0.062));
        panel.position.x = (i - 1) * 0.39; panel.rotation.y = i % 2 ? -0.16 : 0.16; add(panel);
      }
      break;
    }
    case "curtain": {
      add(cyl(0.028, 0.028, 1.3, trim, { y: 0.63, rz: Math.PI / 2 }));
      for (let i = 0; i < 12; i++) add(cyl(0.056, 0.064, 1.14, i % 2 ? cream : c, { x: -0.55 + i * 0.1 }, { rough: 0.98 }, 12));
      break;
    }
    case "locker": {
      add(rb(0.95, 1.5, 0.45, wood));
      for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
        const x = (col - 0.5) * 0.45, y = 0.38 + row * 0.72;
        add(rb(0.41, 0.66, 0.04, c, x, y, 0.24), rb(0.09, 0.022, 0.03, trim, x + 0.09, y, 0.275));
        for (let i = 0; i < 3; i++) add(rb(0.21, 0.014, 0.015, dark, x, y + 0.16 + i * 0.04, 0.271));
      }
      break;
    }
    case "dining": {
      add(rb(0.84, 0.08, 0.84, wood, 0, 0.69)); legs(0.63, 0.63, 0.65);
      for (const [x, z] of [[-0.6, 0], [0.6, 0], [0, -0.6], [0, 0.6]]) {
        add(rb(0.32, 0.07, 0.32, c, x, 0.36, z), cyl(0.10, 0.12, 0.32, wood, { x, y: 0.17, z }));
      }
      add(cyl(0.12, 0.12, 0.016, cream, { y: 0.741 }), sph(0.045, "#bd856b", { y: 0.78 })); break;
    }
    case "beanbag": {
      const base = sph(0.42, c, { y: 0.34 }, { rough: 0.98 }, 24); base.scale.set(1, 0.65, 1); add(base);
      const back = sph(0.32, c, { y: 0.58, z: -0.13 }, { rough: 0.98 }, 22); back.scale.set(1, 1.1, 0.85); add(back);
      add(rb(0.29, 0.08, 0.23, cream, 0.07, 0.47, 0.14)); break;
    }
    case "shoe-bench": {
      add(rb(0.82, 0.08, 0.47, c, 0, 0.49), rb(0.78, 0.04, 0.43, wood, 0, 0.12)); legs(0.72, 0.36, 0.46);
      for (const x of [-0.19, 0.05, 0.23]) add(rb(0.11, 0.075, 0.21, cream, x, 0.18, 0.05)); break;
    }
    case "coffee-cart": {
      add(rb(0.9, 0.06, 0.55, wood, 0, 0.68), rb(0.82, 0.04, 0.47, wood, 0, 0.2)); legs(0.74, 0.4, 0.60, 0.4);
      for (const x of [-0.37, 0.37]) for (const z of [-0.2, 0.2]) add(torus(0.06, 0.017, dark, { x, y: 0.07, z, ry: Math.PI / 2 }));
      add(rb(0.32, 0.3, 0.27, c, -0.16, 0.86), cyl(0.045, 0.04, 0.09, cream, { x: 0.21, y: 0.76 }), cyl(0.045, 0.04, 0.09, cream, { x: 0.32, y: 0.76 })); break;
    }
    case "dishwasher": {
      cabinet(); add(rb(0.64, 0.07, 0.025, dark, 0, 0.73, 0.3));
      for (const x of [-0.17, 0, 0.17]) add(cyl(0.085, 0.085, 0.02, cream, { x, y: 0.33, z: 0.31, rx: Math.PI / 2 }));
      add(rb(0.64, 0.09, 0.04, c, 0, 0.24, 0.33)); break;
    }
    case "dryer": {
      cabinet(0.78, 0.95, 0.62);
      add(torus(0.23, 0.045, trim, { y: 0.44, z: 0.33 }), cyl(0.20, 0.20, 0.035, dark, { y: 0.44, z: 0.32, rx: Math.PI / 2 }));
      add(rb(0.19, 0.06, 0.04, "#b4d6ba", 0.13, 0.83, 0.34)); break;
    }
    case "sink": {
      cabinet(1.0, 0.8, 0.60); add(rb(0.59, 0.028, 0.42, trim, 0, 0.85), rb(0.46, 0.03, 0.31, "#75938c", 0, 0.859));
      add(cyl(0.021, 0.021, 0.27, cream, { x: 0.19, y: 0.98, z: -0.15 }), cyl(0.021, 0.021, 0.20, cream, { x: 0.19, y: 1.12, z: -0.06, rx: Math.PI / 2 })); break;
    }
    case "oven": {
      cabinet(0.9, 0.94, 0.65); screen(0.64, 0.44, 0, 0.44, 0.37);
      add(rb(0.55, 0.035, 0.06, trim, 0, 0.68, 0.4));
      for (const x of [-0.22, 0.22]) for (const z of [-0.14, 0.14]) add(torus(0.095, 0.019, dark, { x, y: 0.98, z, rx: Math.PI / 2 })); break;
    }
    case "induction": {
      add(rb(0.62, 0.065, 0.36, dark));
      for (const x of [-0.15, 0.15]) add(torus(0.095, 0.009, c, { x, y: 0.067, rx: Math.PI / 2 }));
      add(rb(0.15, 0.008, 0.025, "#cda077", 0.14, 0.072, 0.135)); break;
    }
    case "toaster": {
      add(rb(0.45, 0.30, 0.26, c));
      for (const z of [-0.058, 0.058]) { add(rb(0.30, 0.014, 0.041, dark, 0, 0.302, z)); add(rb(0.23, 0.10, 0.026, "#dcbb83", 0, 0.33, z)); }
      add(sph(0.035, trim, { x: 0.23, y: 0.15 })); break;
    }
    case "kettle": {
      add(cyl(0.14, 0.16, 0.24, c, { y: 0.16 }, {}, 24), cyl(0.16, 0.16, 0.035, wood, { y: 0.025 }, {}, 24));
      add(cyl(0.025, 0.06, 0.19, c, { x: 0.14, y: 0.22, rz: -0.65 }), torus(0.12, 0.025, trim, { x: -0.11, y: 0.2 }));
      add(sph(0.038, wood, { y: 0.31 })); break;
    }
    case "rice-cooker": {
      add(cyl(0.21, 0.19, 0.26, c, { y: 0.14 }, {}, 24), cyl(0.215, 0.21, 0.045, cream, { y: 0.30 }, {}, 24));
      add(rb(0.18, 0.025, 0.045, trim, 0, 0.35), rb(0.12, 0.06, 0.025, dark, 0, 0.13, 0.197)); break;
    }
    case "water-dispenser": {
      cabinet(0.5, 0.76, 0.42); add(cyl(0.17, 0.14, 0.34, "#a2ced4", { y: 0.99 }, { opacity: 0.7, rough: 0.18 }, 22));
      for (const [x, color] of [[-0.1, "#ae6f63"], [0.1, "#729fae"]] as const) add(rb(0.045, 0.06, 0.08, color, x, 0.61, 0.26));
      add(rb(0.28, 0.045, 0.15, trim, 0, 0.42, 0.24)); break;
    }
    case "dehumidifier": {
      add(rb(0.60, 0.88, 0.40, c), rb(0.53, 0.30, 0.022, cream, 0, 0.21, 0.21));
      for (let i = 0; i < 7; i++) add(rb(0.4, 0.015, 0.014, dark, 0, 0.42 + i * 0.045, 0.21));
      add(rb(0.13, 0.04, 0.03, "#a8cfbe", 0.12, 0.78, 0.215)); break;
    }
    case "ceiling-fan": {
      add(cyl(0.07, 0.07, 0.25, trim), sph(0.13, cream, { y: -0.16 }));
      for (let i = 0; i < 4; i++) {
        const blade = rb(0.18, 0.028, 0.57, wood, 0, -0.10, 0.36); const hub = new THREE.Group(); hub.rotation.y = i * Math.PI / 2; hub.add(blade); add(hub);
      }
      break;
    }
    case "heater": {
      add(rb(1.0, 0.6, 0.12, c));
      for (let i = 0; i < 10; i++) add(rb(0.035, 0.45, 0.035, cream, -0.40 + i * 0.09, 0.31, 0.072));
      add(rb(0.12, 0.045, 0.025, trim, 0.35, 0.53, 0.08)); break;
    }
    case "solar": {
      const panel = new THREE.Group(); panel.add(rb(1.2, 0.06, 0.85, trim, 0, 0));
      for (let x = 0; x < 4; x++) for (let z = 0; z < 3; z++) panel.add(rb(0.26, 0.013, 0.24, c, -0.42 + x * 0.28, 0.04, -0.26 + z * 0.26));
      panel.position.y = 0.68; panel.rotation.x = -0.38; add(panel); legs(1.02, 0.60, 0.45); break;
    }
    case "battery": {
      add(rb(0.66, 1.15, 0.46, c), rb(0.08, 0.94, 0.015, trim, -0.22, 0.58, 0.24));
      screen(0.30, 0.16, 0.05, 0.93, 0.24);
      for (let i = 0; i < 4; i++) add(rb(0.23, 0.05, 0.03, "#96bd91", 0.055, 0.30 + i * 0.10, 0.25)); break;
    }
    case "router": {
      add(cyl(0.11, 0.12, 0.27, c, { y: 0.135 }, {}, 24));
      add(torus(0.113, 0.009, "#9dd2b3", { y: 0.23, rx: Math.PI / 2 }));
      for (const x of [-0.13, 0.13]) add(rb(0.014, 0.22, 0.02, trim, x, 0.22)); break;
    }
    case "smart-hub": {
      add(rb(0.48, 0.34, 0.045, c, 0, 0)); screen(0.40, 0.26, 0, 0, 0.025);
      for (let i = 0; i < 4; i++) add(rb(0.07, 0.04, 0.008, cream, -0.135 + i * 0.09, -0.06, 0.065)); break;
    }
    case "turntable": {
      add(rb(0.60, 0.11, 0.40, wood)); add(cyl(0.155, 0.155, 0.018, dark, { x: -0.08, y: 0.127 }, {}, 28));
      add(cyl(0.045, 0.045, 0.02, c, { x: -0.08, y: 0.14 }));
      add(rb(0.023, 0.025, 0.26, cream, 0.16, 0.14), sph(0.035, trim, { x: 0.16, y: 0.14, z: -0.1 })); break;
    }
    case "arcade": {
      add(rb(0.76, 0.85, 0.57, c)); add(rb(0.80, 0.72, 0.3, c, 0, 1.17, -0.13));
      screen(0.62, 0.47, 0, 1.12, 0.042); add(rb(0.76, 0.12, 0.4, wood, 0, 0.84, 0.14));
      add(cyl(0.015, 0.015, 0.10, trim, { x: -0.18, y: 0.95, z: 0.2 }), sph(0.037, "#c98979", { x: -0.18, y: 1.01, z: 0.2 }));
      for (let i = 0; i < 3; i++) add(cyl(0.025, 0.025, 0.018, cream, { x: 0.05 + i * 0.075, y: 0.914, z: 0.22 })); break;
    }
    case "vr": {
      add(cyl(0.48, 0.48, 0.04, c, { y: 0.02 }, {}, 28));
      add(cyl(0.035, 0.045, 1.1, wood, { y: 0.58 }), rb(0.38, 0.18, 0.20, cream, 0, 1.12, 0.06));
      add(rb(0.31, 0.11, 0.028, dark, 0, 1.12, 0.177));
      for (const x of [-0.22, 0.22]) add(torus(0.065, 0.014, cream, { x, y: 0.85 }), cyl(0.024, 0.026, 0.16, c, { x, y: 0.74 })); break;
    }
    case "treadmill": {
      add(rb(0.78, 0.14, 1.30, c), rb(0.58, 0.025, 1.12, dark, 0, 0.15));
      for (const x of [-0.32, 0.32]) add(rb(0.055, 1.0, 0.065, trim, x, 0.62, -0.44));
      screen(0.64, 0.24, 0, 1.1, -0.42); break;
    }
    case "rowing": {
      add(rb(1.32, 0.06, 0.17, trim, 0, 0.20), rb(0.30, 0.10, 0.38, c, 0.06, 0.32));
      add(cyl(0.25, 0.25, 0.22, wood, { x: -0.44, y: 0.30, rz: Math.PI / 2 }), torus(0.16, 0.02, dark, { x: -0.56, y: 0.30, ry: Math.PI / 2 }));
      add(rb(0.44, 0.02, 0.025, dark, -0.11, 0.47), rb(0.05, 0.04, 0.28, c, 0.10, 0.47)); break;
    }
    case "punchbag": {
      add(cyl(0.29, 0.33, 0.11, dark, { y: 0.055 }, {}, 22), cyl(0.045, 0.06, 0.5, trim, { y: 0.31 }));
      add(cyl(0.21, 0.23, 0.83, c, { y: 1.0 }, { rough: 0.94 }, 24), sph(0.21, c, { y: 1.4 }));
      add(rb(0.15, 0.09, 0.008, cream, 0, 1.03, 0.235)); break;
    }
    case "meditation": {
      add(rb(0.68, 0.04, 0.62, wood), cyl(0.26, 0.29, 0.17, c, { y: 0.13 }, { rough: 0.98 }, 24));
      add(cyl(0.05, 0.05, 0.07, cream, { x: 0.25, y: 0.10, z: -0.18 }), sph(0.018, "#f0c686", { x: 0.25, y: 0.15, z: -0.18 })); break;
    }
    case "craft": {
      add(rb(1.15, 0.08, 0.69, wood, 0, 0.73)); legs(1.0, 0.52, 0.69);
      add(rb(0.32, 0.56, 0.5, c, -0.35, 0.35), rb(0.38, 0.014, 0.32, cream, 0.17, 0.78));
      for (let i = 0; i < 4; i++) add(cyl(0.027, 0.027, 0.06 + i * 0.012, ["#c98f78", "#9badce", "#a9bf88", cream][i], { x: -0.30 + i * 0.10, y: 0.81, z: -0.18 })); break;
    }
    case "sewing": {
      add(rb(0.58, 0.04, 0.29, wood), rb(0.16, 0.30, 0.20, c, 0.14, 0.19));
      add(rb(0.39, 0.10, 0.19, c, 0.015, 0.36), rb(0.025, 0.17, 0.03, trim, -0.14, 0.20));
      add(cyl(0.046, 0.046, 0.085, "#cc9c88", { x: 0.14, y: 0.45 }), torus(0.07, 0.013, cream, { x: 0.25, y: 0.27, ry: Math.PI / 2 })); break;
    }
    case "terrarium": {
      add(cyl(0.21, 0.21, 0.055, wood, { y: 0.027 }, {}, 24));
      const dome = sph(0.24, "#c4ddd4", { y: 0.22 }, { opacity: 0.25, rough: 0.1 }, 24); dome.scale.y = 1.2; add(dome);
      plant(0, 0.055, 0, 0.70); plant(0.1, 0.055, -0.04, 0.40); break;
    }
    case "hydroponic": {
      add(cyl(0.24, 0.30, 0.26, c, { y: 0.13 }, {}, 20), cyl(0.12, 0.14, 1.28, cream, { y: 0.9 }, {}, 18));
      for (let row = 0; row < 3; row++) for (const side of [-1, 1]) plant(side * 0.16, 0.38 + row * 0.37, 0.05, 0.65);
      break;
    }
    case "herbs": {
      add(rb(0.66, 0.18, 0.31, wood), rb(0.61, 0.025, 0.26, "#665945", 0, 0.18));
      for (const x of [-0.21, 0, 0.21]) plant(x, 0.18, 0, 0.6); break;
    }
    case "birdbath": {
      add(cyl(0.21, 0.25, 0.08, c, { y: 0.04 }), cyl(0.085, 0.12, 0.60, c, { y: 0.38 }));
      add(cyl(0.36, 0.18, 0.13, c, { y: 0.73 }, {}, 28), cyl(0.29, 0.29, 0.015, "#a1ced1", { y: 0.80 }, { rough: 0.15 }, 28));
      add(sph(0.058, "#b69769", { x: 0.25, y: 0.85 }), sph(0.035, "#8e8170", { x: 0.29, y: 0.91 })); break;
    }
    case "fountain": {
      add(cyl(0.32, 0.29, 0.15, c, { y: 0.075 }, {}, 24), cyl(0.26, 0.26, 0.018, "#a4ccd0", { y: 0.15 }, {}, 24));
      for (let i = 0; i < 3; i++) { const rock = sph(0.16 - i * 0.022, i % 2 ? cream : c, { y: 0.30 + i * 0.20 }, { rough: 0.9 }, 18); rock.scale.set(1.3, 0.67, 1); add(rock); }
      add(cyl(0.015, 0.024, 0.35, "#b4dfe0", { y: 0.58 }, { opacity: 0.65 })); break;
    }
    case "cat-tree": {
      add(rb(0.76, 0.07, 0.68, wood));
      for (const [x, z, h] of [[-0.22, -0.12, 1.2], [0.23, 0.13, 0.65]]) {
        add(cyl(0.055, 0.055, h, cream, { x, y: h / 2 + 0.04, z }), rb(0.39, 0.065, 0.38, c, x, h + 0.09, z));
      }
      add(rb(0.36, 0.37, 0.36, c, -0.15, 0.37, -0.1), cyl(0.10, 0.10, 0.02, dark, { x: -0.15, y: 0.40, z: 0.09, rx: Math.PI / 2 })); break;
    }
    case "feeder": {
      add(rb(0.38, 0.50, 0.31, c, 0, 0.25, -0.08), rb(0.36, 0.035, 0.3, wood, 0, 0.52, -0.08));
      add(cyl(0.17, 0.15, 0.06, trim, { y: 0.05, z: 0.22 }, {}, 24), cyl(0.13, 0.13, 0.02, "#ad8d67", { y: 0.08, z: 0.22 }));
      screen(0.16, 0.08, 0, 0.36, 0.085); break;
    }
    case "litter": {
      add(rb(0.80, 0.72, 0.73, c, 0, 0.46)); add(cyl(0.22, 0.22, 0.025, dark, { y: 0.44, z: 0.39, rx: Math.PI / 2 }, {}, 28));
      add(torus(0.22, 0.023, cream, { y: 0.44, z: 0.41 }), rb(0.84, 0.1, 0.78, wood, 0, 0.08));
      add(rb(0.11, 0.028, 0.025, "#a5c9ab", 0.22, 0.75, 0.39)); break;
    }
    case "first-aid": {
      add(rb(0.75, 0.85, 0.21, c, 0, 0)); add(rb(0.61, 0.71, 0.025, cream, 0, 0, 0.12));
      add(rb(0.32, 0.09, 0.014, "#9b7164", 0, 0, 0.143), rb(0.09, 0.32, 0.014, "#9b7164", 0, 0, 0.15));
      add(sph(0.025, trim, { x: 0.24, y: -0.1, z: 0.154 })); break;
    }
    case "smoke-alarm": {
      add(cyl(0.22, 0.24, 0.08, c, {}, {}, 28), cyl(0.17, 0.20, 0.08, cream, { y: -0.06 }, {}, 28));
      for (let i = 0; i < 8; i++) add(rb(0.04, 0.01, 0.025, dark, Math.cos(i * Math.PI / 4) * 0.12, -0.105, Math.sin(i * Math.PI / 4) * 0.12));
      add(sph(0.019, "#91bd92", { y: -0.11 })); break;
    }
    case "sprinkler": {
      add(cyl(0.16, 0.16, 0.07, cream), cyl(0.035, 0.04, 0.14, trim, { y: -0.09 }), cyl(0.11, 0.05, 0.05, trim, { y: -0.18 }));
      for (let i = 0; i < 6; i++) add(rb(0.04, 0.012, 0.025, c, Math.cos(i) * 0.10, -0.2, Math.sin(i) * 0.10)); break;
    }
    case "pendant": {
      add(cyl(0.013, 0.013, 0.38, trim, { y: 0.18 }), cyl(0.15, 0.28, 0.24, c, { y: -0.07 }, {}, 28));
      add(sph(0.11, "#f1ddb3", { y: -0.19 }, { emissive: "#eac587", emissiveI: 0.65 }, 20)); break;
    }
    case "sconce": {
      add(rb(0.16, 0.42, 0.06, wood, 0, 0));
      for (const x of [-0.25, 0.25]) {
        add(rb(0.42, 0.035, 0.055, trim, x / 2, -0.11, 0.08));
        add(cyl(0.085, 0.13, 0.22, c, { x, y: 0.06, z: 0.12 }, {}, 22), sph(0.05, "#f0d599", { x, y: -0.025, z: 0.12 }, { emissive: "#ecc17d", emissiveI: 0.5 }));
      }
      break;
    }
    case "mirror": {
      add(rb(0.79, 1.05, 0.18, wood, 0, 0), rb(0.65, 0.87, 0.025, "#c3d8d0", 0, 0, 0.105));
      add(rb(0.54, 0.017, 0.01, cream, -0.025, 0.24, 0.123));
      add(rb(0.86, 0.055, 0.25, c, 0, -0.51, 0.06), rb(0.05, 0.16, 0.03, trim, 0.30, -0.07, 0.14)); break;
    }
    default: add(rb(0.5, 0.5, 0.5, c));
  }
  if (grade > 0) {
    const bounds = new THREE.Box3().setFromObject(g), size = bounds.getSize(new THREE.Vector3());
    const plaque = rb(Math.min(0.15, size.x * 0.2), 0.026, 0.014, trim, bounds.min.x + size.x * 0.25, bounds.min.y + size.y * 0.2, bounds.max.z + 0.008);
    g.add(plaque);
    if (grade === 2) plaque.material = new THREE.MeshStandardMaterial({ color: "#d4b574", metalness: 0.55, roughness: 0.3 });
  }
  return g;
}