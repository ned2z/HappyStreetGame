import * as THREE from "three";
import { ACTIVITY_INFO, type ActivityId, type Expression } from "../game/activities";
import type { Tenant } from "../game/tenants";
import { box, cyl, mat, rbox, shadowify, sph, torus } from "./props";

export interface ActorRig {
  root: THREE.Group;
  dock: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  arms: [THREE.Group, THREE.Group];
  legs: [THREE.Group, THREE.Group];
  eyes: THREE.Object3D[];
  brows: THREE.Object3D[];
  smile: THREE.Object3D;
  mouthOpen: THREE.Object3D;
  props: Record<string, THREE.Group>;
  page: THREE.Object3D;
  phase: number;
}

function heldProps() {
  const props: Record<string, THREE.Group> = {};
  for (const key of ["book", "cup", "phone", "brush", "broom", "can", "parcel", "towel", "weights"]) props[key] = new THREE.Group();
  const book = props.book;
  book.add(rbox(0.40, 0.05, 0.27, "#759c8b", {}, { r: 0.02 }));
  book.add(box(0.35, 0.025, 0.23, "#fff3d9", { y: 0.036 }));
  const page = box(0.16, 0.007, 0.22, "#fffaf0", { x: 0.085, y: 0.06 });
  book.add(page, box(0.009, 0.03, 0.23, "#cfb89a", { y: 0.05 }));
  book.position.set(0, 0.52, 0.22);
  props.cup.add(cyl(0.072, 0.06, 0.13, "#f1c48f"), torus(0.052, 0.016, "#f1c48f", { x: 0.08 }));
  props.cup.add(cyl(0.06, 0.06, 0.006, "#795438", { y: 0.067 }));
  props.cup.position.set(0.12, 0.63, 0.26);
  props.phone.add(rbox(0.14, 0.24, 0.025, "#324646", {}, { r: 0.023 }), rbox(0.114, 0.185, 0.008, "#b4d9cb", { z: 0.017 }, { r: 0.013, emissive: "#7fb6aa", emissiveI: 0.25 }));
  props.phone.position.set(0.14, 0.70, 0.30);
  props.brush.add(cyl(0.012, 0.012, 0.26, "#b88553"), rbox(0.045, 0.06, 0.035, "#ede4d0", { y: 0.13 }, { r: 0.015 }));
  props.brush.position.set(0.20, 0.64, 0.19);
  props.broom.add(cyl(0.014, 0.014, 0.74, "#b59164", { y: 0.1 }), rbox(0.24, 0.12, 0.1, "#d6b880", { y: -0.3 }, { r: 0.02 }));
  props.broom.position.set(0.18, 0.37, 0.24);
  props.can.add(cyl(0.11, 0.10, 0.18, "#7db2aa"), cyl(0.022, 0.035, 0.22, "#7db2aa", { x: 0.13, y: 0.04, rz: -0.8 }), torus(0.12, 0.022, "#6c9d91", { x: -0.07 }));
  props.can.position.set(0.13, 0.55, 0.22);
  props.parcel.add(rbox(0.37, 0.29, 0.30, "#c6a075", {}, { r: 0.018 }), box(0.055, 0.301, 0.31, "#e1c292"), box(0.13, 0.08, 0.008, "#fff5dc", { x: 0.08, z: 0.155 }));
  props.parcel.position.set(0, 0.50, 0.27);
  props.towel.add(rbox(0.30, 0.035, 0.22, "#f2d7c7", {}, { r: 0.015 }));
  props.towel.position.set(0.1, 0.54, 0.23);
  for (const x of [-0.25, 0.25]) {
    props.weights.add(cyl(0.018, 0.018, 0.15, "#738582", { x, rz: Math.PI / 2 }));
    props.weights.add(rbox(0.055, 0.10, 0.10, "#758779", { x: x - 0.085 }, { r: 0.025 }), rbox(0.055, 0.10, 0.10, "#758779", { x: x + 0.085 }, { r: 0.025 }));
  }
  props.weights.position.set(0, 0.55, 0.18);
  return { props, page };
}

export function makeActor(tenant: Tenant): ActorRig {
  const { skin, shirt, hair, pants, hairStyle, accessory } = tenant.look;
  const root = new THREE.Group();
  const dock = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(0.80);
  root.add(dock);
  dock.add(body);
  const legs: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
  const arms: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    const leg = legs[i];
    leg.position.set(s * 0.085, 0.31, 0);
    leg.add(cyl(0.067, 0.06, 0.22, pants, { y: -0.1 }, { rough: 0.92 }, 16));
    leg.add(rbox(0.135, 0.09, 0.22, "#fbefda", { y: -0.265, z: 0.035 }, { r: 0.035 }), rbox(0.14, 0.024, 0.223, "#788b81", { y: -0.30, z: 0.035 }, { r: 0.009 }));
    body.add(leg);
    const arm = arms[i];
    arm.position.set(s * 0.19, 0.61, 0);
    arm.add(cyl(0.06, 0.05, 0.20, shirt, { y: -0.09 }, {}, 16), sph(0.054, skin, { y: -0.215 }, { rough: 0.58 }, 20));
    body.add(arm);
  }
  body.add(rbox(0.32, 0.38, 0.24, shirt, { y: 0.47 }, { r: 0.09, rough: 0.94 }));
  body.add(rbox(0.21, 0.22, 0.026, pants, { y: 0.41, z: 0.129 }, { r: 0.025 }));
  for (const x of [-0.072, 0.072]) {
    body.add(rbox(0.042, 0.23, 0.026, pants, { x, y: 0.56, z: 0.127 }, { r: 0.01 }));
    body.add(sph(0.015, "#eac383", { x, y: 0.51, z: 0.147 }, { metal: 0.2 }, 12));
  }
  const head = new THREE.Group();
  head.position.set(0, 0.90, 0);
  body.add(head);
  const face = sph(0.29, skin, {}, { rough: 0.6 }, 28);
  face.scale.set(1, 1.02, 0.91);
  head.add(face);
  head.add(sph(0.055, skin, { x: -0.278, y: -0.02 }, {}, 18), sph(0.055, skin, { x: 0.278, y: -0.02 }, {}, 18));
  const eyes: THREE.Object3D[] = [];
  const brows: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const eye = sph(0.042, "#302c29", { x: side * 0.10, y: 0.025, z: 0.252 }, { rough: 0.1 }, 20);
    eye.scale.set(0.88, 1.2, 0.55);
    eye.add(sph(0.013, "#ffffff", { x: -0.01, y: 0.018, z: 0.035 }, { rough: 0 }, 12));
    head.add(eye);
    eyes.push(eye);
    const cheek = sph(0.048, "#eea6a0", { x: side * 0.183, y: -0.045, z: 0.211 }, { rough: 0.9 }, 18);
    cheek.scale.set(1, 0.5, 0.18);
    head.add(cheek);
    const brow = rbox(0.06, 0.012, 0.015, hair, { x: side * 0.10, y: 0.108, z: 0.246 }, { r: 0.005 });
    head.add(brow);
    brows.push(brow);
  }
  head.add(sph(0.025, skin, { y: -0.018, z: 0.268 }, { rough: 0.55 }, 16));
  const smilePoints = Array.from({ length: 13 }, (_, i) => {
    const x = -0.045 + i * 0.0075;
    return new THREE.Vector3(x, -0.083 + 4 * x * x, 0.249);
  });
  const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePoints), 14, 0.009, 6, false), mat("#9e5550"));
  smile.geometry.userData.owned = true;
  const mouthOpen = torus(0.026, 0.009, "#9e5550", { y: -0.077, z: 0.254 });
  mouthOpen.visible = false;
  head.add(smile, mouthOpen);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.301, 28, 16, 0, Math.PI * 2, 0, 1.42), mat(hair, { rough: 0.71 }));
  cap.geometry.userData.owned = true;
  cap.position.set(0, 0.065, -0.018);
  head.add(cap);
  for (let i = 0; i < 5; i++) {
    const fringe = sph(0.073, hair, { x: -0.19 + i * 0.086, y: 0.19 + Math.sin(i) * 0.02, z: 0.17 }, { rough: 0.71 }, 18);
    fringe.scale.set(0.9, 0.8 + i * 0.09, 0.8);
    head.add(fringe);
  }
  if (hairStyle === 1 || hairStyle === 2) for (const side of [-1, 1]) head.add(sph(0.085, hair, { x: side * 0.24, y: 0.16, z: -0.04 }, {}, 22));
  if (hairStyle === 3) head.add(sph(0.12, hair, { y: 0.31, z: -0.09 }, {}, 22));
  if (hairStyle === 4) head.add(rbox(0.39, 0.26, 0.15, hair, { y: -0.10, z: -0.2 }, { r: 0.075 }));
  if (accessory === 1) for (const side of [-1, 1]) head.add(torus(0.067, 0.01, "#75634e", { x: side * 0.10, y: 0.025, z: 0.277 }, { metal: 0.4 }));
  if (accessory === 2) {
    for (const side of [-1, 1]) head.add(sph(0.07, "#dbc3b9", { x: side * 0.28, y: 0.08 }, {}, 20));
    const band = torus(0.28, 0.023, "#dbc3b9", { y: 0.08 });
    head.add(band);
  }
  if (accessory === 3) {
    head.add(cyl(0.285, 0.285, 0.04, "#d8bb87", { y: 0.25 }, {}, 28));
    head.add(cyl(0.20, 0.22, 0.14, "#e4c999", { y: 0.32 }, {}, 28));
  }
  if (accessory === 4) head.add(rbox(0.11, 0.05, 0.03, "#d38d9c", { x: 0.2, y: 0.22, z: 0.14, rz: -0.4 }, { r: 0.014 }));
  const held = heldProps();
  Object.values(held.props).forEach((prop) => { prop.visible = false; body.add(prop); });
  shadowify(root);
  return { root, dock, body, head, arms, legs, eyes, brows, smile, mouthOpen, props: held.props, page: held.page, phase: tenant.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 60 };
}

function faceExpression(rig: ActorRig, expression: Expression, time: number) {
  const blink = Math.sin(time * 0.73 + rig.phase) > 0.989;
  const sleepy = expression === "sleepy";
  const eyesY = blink || sleepy ? 0.14 : expression === "surprised" ? 1.5 : expression === "happy" ? 0.9 : 1.2;
  rig.eyes.forEach((e) => e.scale.set(0.88, eyesY, 0.55));
  rig.brows.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * (expression === "annoyed" ? -0.38 : expression === "shy" ? 0.24 : 0); b.position.y = expression === "surprised" ? 0.14 : 0.108; });
  rig.mouthOpen.visible = expression === "surprised" || sleepy;
  rig.smile.visible = !rig.mouthOpen.visible;
  rig.smile.rotation.z = expression === "annoyed" ? Math.PI : 0;
  rig.smile.position.y = expression === "annoyed" ? -0.16 : 0;
}

export function animateActor(rig: ActorRig, activity: ActivityId, time: number, dt: number, moving = false, climbing = false) {
  const info = ACTIVITY_INFO[activity];
  const t = time + rig.phase;
  let bx = 0, by = 0, bz = 0, rx = 0, rz = 0, hx = 0, hy = 0, hz = 0;
  let ax = 0, arx = 0, az = 0, arz = 0, lx = 0, lrx = 0;
  const cycle = Math.sin(t * (climbing ? 8 : 6));
  rig.props.brush.rotation.set(0, 0, 0);
  rig.props.cup.position.set(0.12, 0.63, 0.26);
  for (const [key, prop] of Object.entries(rig.props)) prop.visible = !moving && key === info.prop;
  if (moving) {
    by = Math.abs(cycle) * (climbing ? 0.045 : 0.028);
    ax = cycle * 0.55; arx = -ax; lx = -cycle * (climbing ? 0.65 : 0.48); lrx = -lx;
    rx = climbing ? 0.1 : 0.035;
  } else {
    by = Math.sin(t * 1.7) * 0.012;
    hz = Math.sin(t * 0.6) * 0.035;
    switch (activity) {
      case "reading": by = -0.13; ax = arx = -1.0; lx = lrx = -1.15; hx = 0.18; rig.page.rotation.z = Math.max(0, Math.sin(t * 0.32)) * 0.35; break;
      case "sleeping": rx = -Math.PI / 2; bz = 0.43; by = 0.16 + Math.sin(t * 0.8) * 0.012; ax = arx = -0.18; break;
      case "exercising": ax = -0.8 + Math.sin(t * 2.2) * 0.8; arx = -0.8 - Math.sin(t * 2.2) * 0.8; by = -Math.abs(Math.sin(t * 1.1)) * 0.12; lx = lrx = -Math.abs(Math.sin(t * 1.1)) * 0.3; break;
      case "cooking": ax = -0.8; arx = -0.7 + Math.sin(t * 3.4) * 0.22; hx = 0.14; break;
      case "gaming": by = -0.12; lx = lrx = -0.9; ax = -0.8 + Math.sin(t * 9) * 0.05; arx = -0.8 - Math.sin(t * 9) * 0.05; hx = 0.13; break;
      case "music": rz = Math.sin(t * 2) * 0.09; hz = -rz; ax = Math.sin(t * 2) * 0.2; break;
      case "watering": arx = -0.9; ax = -0.4; rx = 0.12; rig.props.can.rotation.z = -0.35 + Math.sin(t * 1.4) * 0.1; break;
      case "cleaning": arx = -0.75; ax = -0.6; hy = Math.sin(t) * 0.15; rig.props.broom.rotation.z = Math.sin(t * 2) * 0.35; break;
      case "relaxing": by = -0.1; lx = lrx = -0.9; hx = -0.14; ax = arx = -0.3; break;
      case "socializing": arx = -0.8 + Math.sin(t * 2) * 0.4; hy = Math.sin(t) * 0.14; break;
      case "stretch": ax = arx = -2.65; az = -0.3; arz = 0.3; rz = Math.sin(t * 0.7) * 0.13; break;
      case "meditate": by = -0.18; lx = lrx = -1.3; ax = arx = -0.65; hz = 0; break;
      case "makeTea": arx = -0.9 - Math.max(0, Math.sin(t * 0.8)) * 0.45; ax = -0.5; rig.props.cup.position.y = 0.64 + Math.max(0, Math.sin(t * 0.8)) * 0.16; break;
      case "eatSnack": arx = -1.2 + Math.sin(t * 2) * 0.2; hx = Math.sin(t * 2) * 0.03; rig.props.cup.position.y = 0.68; break;
      case "phoneCall": arx = -2.0; arz = 0.4; hy = Math.sin(t * 0.8) * 0.16; rig.props.phone.position.set(0.28, 0.9, 0.07); break;
      case "selfie": arx = -1.45; arz = 0.25; hz = -0.18; rig.props.phone.position.set(0.20, 0.95, 0.38); break;
      case "journal": ax = -1.0; arx = -1.0 + Math.sin(t * 6) * 0.08; hx = 0.27; break;
      case "sketch": arx = -1.15 + Math.sin(t * 2) * 0.25; hx = 0.1; hy = Math.sin(t * 0.45) * 0.15; break;
      case "dance": rz = Math.sin(t * 3) * 0.18; by = Math.abs(Math.sin(t * 3)) * 0.06; ax = -1.1 + Math.sin(t * 3) * 0.7; arx = -1.1 - Math.sin(t * 3) * 0.7; lx = Math.sin(t * 3) * 0.4; lrx = -lx; break;
      case "humming": hz = Math.sin(t * 1.6) * 0.12; arx = -0.7; break;
      case "feedPet": by = -0.12; rx = 0.32; arx = -1.0; lx = lrx = -0.3; hx = 0.3; break;
      case "foldLaundry": ax = -0.85 + Math.sin(t * 2) * 0.15; arx = -0.85 - Math.sin(t * 2) * 0.15; hx = 0.2; break;
      case "brushHair": arx = -2.5 + Math.sin(t * 2.3) * 0.2; rig.props.brush.position.set(0.19, 1.1, 0.04); break;
      case "brushTeeth": arx = -1.5; hx = 0.05; rig.props.brush.position.set(0.05 + Math.sin(t * 9) * 0.045, 0.83, 0.29); rig.props.brush.rotation.z = Math.PI / 2; break;
      case "washHands": ax = -0.9; arx = -0.9; az = Math.sin(t * 7) * 0.12; arz = -az; hx = 0.18; break;
      case "dustShelf": arx = -1.25; arz = Math.sin(t * 2.8) * 0.3; hx = 0.15; rig.props.towel.position.x = 0.08 + Math.sin(t * 2.8) * 0.1; break;
      case "checkLock": arx = -1.0 + Math.sin(t * 1.5) * 0.14; hy = Math.sin(t * 0.9) * 0.3; break;
      case "planDay": ax = -0.8; arx = -1.65; hx = 0.1; hz = 0.16; break;
      case "videoCall": arx = -1.2 + Math.sin(t * 1.3) * 0.3; hy = Math.sin(t * 0.7) * 0.09; break;
      case "stargaze": hx = -0.42; ax = arx = -0.2; break;
      case "birdwatch": hy = Math.sin(t * 0.55) * 0.5; arx = -2.2; hx = -0.22; break;
      case "freshAir": hx = -0.12; az = -0.25; arz = 0.25; by = Math.sin(t * 0.6) * 0.027; break;
      case "collectParcel": ax = arx = -0.9; hx = 0.22; by = -Math.max(0, Math.sin(t * 0.7)) * 0.045; break;
      case "greetNeighbor": arx = -2.5; arz = Math.sin(t * 5) * 0.32; hx = -0.05; break;
      case "briskWalk": ax = Math.sin(t * 3) * 0.24; arx = -ax; lx = -ax * 0.8; lrx = -lx; break;
      case "inspectLoft": hy = Math.sin(t * 0.6) * 0.5; hx = Math.sin(t * 0.5) * 0.15; arx = -0.3; break;
      case "yawn": arx = -1.8; hx = -0.12; az = -0.12; by = Math.sin(t * 0.6) * 0.02; break;
      case "celebrate": ax = arx = -1.2; az = -0.6 + Math.sin(t * 7) * 0.12; arz = -az; by = Math.abs(Math.sin(t * 2.4)) * 0.08; break;
      case "complain": ax = arx = -0.7; az = -0.2; arz = 0.2; hy = Math.sin(t * 2) * 0.16; rx = -0.05; break;
      case "shyWave": arx = -1.8; arz = Math.sin(t * 3.5) * 0.12; hz = 0.2; hx = 0.12; break;
      default: hy = Math.sin(t * 0.4) * 0.14;
    }
  }
  const k = 1 - Math.exp(-dt * 12);
  rig.body.position.lerp(new THREE.Vector3(bx, by, bz), k);
  rig.body.rotation.x = THREE.MathUtils.lerp(rig.body.rotation.x, rx, k);
  rig.body.rotation.z = THREE.MathUtils.lerp(rig.body.rotation.z, rz, k);
  rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, hx, k);
  rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, hy, k);
  rig.head.rotation.z = THREE.MathUtils.lerp(rig.head.rotation.z, hz, k);
  for (let i = 0; i < 2; i++) {
    rig.arms[i].rotation.x = THREE.MathUtils.lerp(rig.arms[i].rotation.x, i ? arx : ax, k);
    rig.arms[i].rotation.z = THREE.MathUtils.lerp(rig.arms[i].rotation.z, i ? arz : az, k);
    rig.legs[i].rotation.x = THREE.MathUtils.lerp(rig.legs[i].rotation.x, i ? lrx : lx, k);
  }
  if (activity !== "phoneCall" && activity !== "selfie") rig.props.phone.position.set(0.14, 0.70, 0.3);
  if (activity !== "brushHair" && activity !== "brushTeeth") { rig.props.brush.position.set(0.20, 0.64, 0.19); rig.props.brush.rotation.set(0, 0, 0); }
  faceExpression(rig, moving ? "focused" : info.expression, time);
}