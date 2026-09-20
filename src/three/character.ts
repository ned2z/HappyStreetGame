import * as THREE from "three";
import { cyl, mat, rbox, shadowify, sph, torus } from "./props";
import type { Tenant } from "../game/tenants";
import type { MoodKey } from "../game/tenants";
import type { ActivityId } from "../game/tenants";

export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Group;
  body: THREE.Group;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  eyes: THREE.Object3D[];
  bubbleAnchor: THREE.Object3D;
  phase: number;
}

export function buildCharacter(t: Tenant): CharacterRig {
  const { skin, hair, shirt, pants, hairStyle, accessory } = t.look;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // ขา
  body.add(cyl(0.075, 0.08, 0.22, pants, { x: -0.085, y: 0.12 }, { rough: 0.9 }, 10));
  body.add(cyl(0.075, 0.08, 0.22, pants, { x: 0.085, y: 0.12 }, { rough: 0.9 }, 10));
  body.add(rbox(0.13, 0.07, 0.2, "#3b3f4a", { x: -0.085, y: 0.035, z: 0.03 }, { r: 0.03 }));
  body.add(rbox(0.13, 0.07, 0.2, "#3b3f4a", { x: 0.085, y: 0.035, z: 0.03 }, { r: 0.03 }));

  // ลำตัว
  body.add(rbox(0.36, 0.34, 0.26, shirt, { y: 0.4 }, { r: 0.12, rough: 0.85 }));
  body.add(rbox(0.3, 0.08, 0.22, shirt, { y: 0.24 }, { r: 0.06, rough: 0.85 }));

  // แขน
  const armL = cyl(0.055, 0.05, 0.28, shirt, { x: -0.22, y: 0.4 }, { rough: 0.85 }, 10);
  const armR = cyl(0.055, 0.05, 0.28, shirt, { x: 0.22, y: 0.4 }, { rough: 0.85 }, 10);
  armL.add(sph(0.06, skin, { y: -0.16 }, {}, 10));
  armR.add(sph(0.06, skin, { y: -0.16 }, {}, 10));
  body.add(armL, armR);

  // หัว
  const head = new THREE.Group();
  head.position.y = 0.72;
  body.add(head);
  head.add(sph(0.28, skin, {}, { rough: 0.75 }, 18));

  // ตา
  const eyeL = sph(0.052, "#2a2230", { x: -0.1, y: 0.03, z: 0.25 }, { rough: 0.3 }, 12);
  const eyeR = sph(0.052, "#2a2230", { x: 0.1, y: 0.03, z: 0.25 }, { rough: 0.3 }, 12);
  head.add(eyeL, eyeR);
  head.add(sph(0.018, "#ffffff", { x: -0.082, y: 0.055, z: 0.29 }, { emissive: "#ffffff", emissiveI: 0.35 }, 8));
  head.add(sph(0.018, "#ffffff", { x: 0.118, y: 0.055, z: 0.29 }, { emissive: "#ffffff", emissiveI: 0.35 }, 8));

  // แก้ม + ปาก
  const blush = (x: number) => {
    const m = sph(0.045, "#ff9db5", { x, y: -0.05, z: 0.245 }, { rough: 1, opacity: 0.8 }, 10);
    m.scale.set(1, 0.6, 0.3);
    return m;
  };
  head.add(blush(-0.17), blush(0.17));
  const mouth = torus(0.035, 0.012, "#b5546a", { y: -0.1, z: 0.255, rx: 0.2 }, { rough: 0.9 });
  mouth.scale.set(1, 0.6, 1);
  head.add(mouth);

  // ผม
  const hairMat = { rough: 0.7 };
  if (hairStyle === 0) {
    const cap = sph(0.295, hair, { y: 0.045 }, hairMat, 18);
    cap.scale.set(1, 0.92, 1);
    head.add(cap);
    head.add(sph(0.14, hair, { y: 0.2, z: -0.16 }, hairMat, 12));
  } else if (hairStyle === 1) {
    const cap = sph(0.3, hair, { y: 0.06 }, hairMat, 18);
    cap.scale.set(1, 0.8, 1);
    head.add(cap);
    head.add(sph(0.13, hair, { y: 0.3, z: -0.02 }, hairMat, 12));
  } else if (hairStyle === 2) {
    const cap = sph(0.3, hair, { y: 0.02 }, hairMat, 18);
    cap.scale.set(1.02, 0.95, 1.02);
    head.add(cap);
    head.add(sph(0.12, hair, { x: -0.28, y: 0.02, z: -0.04 }, hairMat, 12));
    head.add(sph(0.12, hair, { x: 0.28, y: 0.02, z: -0.04 }, hairMat, 12));
  } else if (hairStyle === 3) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      head.add(sph(0.11, hair, { x: Math.cos(a) * 0.17, y: 0.2, z: Math.sin(a) * 0.17 }, hairMat, 10));
    }
    head.add(sph(0.2, hair, { y: 0.19 }, hairMat, 12));
  } else {
    const cap = sph(0.295, hair, { y: 0.03 }, hairMat, 18);
    cap.scale.set(1, 0.9, 1);
    head.add(cap);
    head.add(cyl(0.07, 0.05, 0.4, hair, { y: -0.02, z: -0.24 }, hairMat, 10));
  }

  // ของประดับ
  if (accessory === 1) {
    head.add(torus(0.075, 0.012, "#2b3038", { x: -0.1, y: 0.03, z: 0.255 }, { metal: 0.5, rough: 0.35 }));
    head.add(torus(0.075, 0.012, "#2b3038", { x: 0.1, y: 0.03, z: 0.255 }, { metal: 0.5, rough: 0.35 }));
  } else if (accessory === 2) {
    head.add(torus(0.2, 0.035, "#ff5f8f", { y: 0.12, rx: Math.PI / 2, rz: 0.15 }, { rough: 0.5 }));
    head.add(cyl(0.07, 0.07, 0.06, "#2b3038", { x: -0.28, y: 0.09, rz: Math.PI / 2 }, { rough: 0.5 }));
    head.add(cyl(0.07, 0.07, 0.06, "#2b3038", { x: 0.28, y: 0.09, rz: Math.PI / 2 }, { rough: 0.5 }));
  } else if (accessory === 3) {
    head.add(cyl(0.3, 0.3, 0.05, "#f2d06b", { y: 0.24 }, { rough: 0.8 }, 16));
    head.add(cyl(0.22, 0.24, 0.16, "#f2d06b", { y: 0.3 }, { rough: 0.8 }, 16));
  } else if (accessory === 4) {
    head.add(sph(0.07, "#ff8fb5", { x: 0.22, y: 0.2, z: 0.12 }, { rough: 0.7 }, 10));
    head.add(sph(0.05, "#ffe36b", { x: 0.22, y: 0.24, z: 0.16 }, { rough: 0.7 }, 8));
  }

  const bubbleAnchor = new THREE.Object3D();
  bubbleAnchor.position.set(0, 1.28, 0);
  root.add(bubbleAnchor);

  shadowify(root);
  return { root, head, body, armL, armR, eyes: [eyeL, eyeR], bubbleAnchor, phase: Math.random() * Math.PI * 2 };
}

export function animateCharacter(rig: CharacterRig, t: number, walk: number) {
  const p = rig.phase;
  rig.body.position.y = Math.sin(t * 2.2 + p) * 0.022 + walk * Math.abs(Math.sin(t * 6)) * 0.03;
  rig.head.rotation.z = Math.sin(t * 1.4 + p) * 0.06;
  rig.head.rotation.x = Math.sin(t * 0.9 + p) * 0.04;
  rig.armL.rotation.x = Math.sin(t * 2.2 + p) * 0.18 - walk * Math.sin(t * 6) * 0.6;
  rig.armR.rotation.x = -Math.sin(t * 2.2 + p) * 0.18 + walk * Math.sin(t * 6) * 0.6;
  // กระพริบตา
  const blink = Math.sin(t * 0.7 + p * 2.3);
  const sy = blink > 0.985 ? 0.12 : 1;
  rig.eyes.forEach((e) => e.scale.set(1, sy, 1));
}

/** Activity poses keep both roommates visibly busy instead of only wandering. */
export function animateActivity(rig: CharacterRig, activity: ActivityId, t: number) {
  animateCharacter(rig, t, 0);
  const p = rig.phase;
  rig.body.rotation.set(0, 0, 0);
  rig.armL.rotation.x = Math.sin(t * 1.8 + p) * 0.12;
  rig.armR.rotation.x = -Math.sin(t * 1.8 + p) * 0.12;
  rig.head.rotation.x = Math.sin(t * 0.7 + p) * 0.04;

  if (activity === "sleeping") {
    rig.body.position.y = -0.06 + Math.sin(t * 0.65 + p) * 0.015;
    rig.body.rotation.z = 0.22;
    rig.head.rotation.x = -0.28;
    rig.eyes.forEach((eye) => eye.scale.set(1, 0.12, 1));
  } else if (activity === "reading") {
    rig.body.position.y = Math.sin(t * 1.1 + p) * 0.012;
    rig.head.rotation.x = -0.2;
    rig.armL.rotation.x = -0.85 + Math.sin(t * 1.4 + p) * 0.08;
    rig.armR.rotation.x = -0.78 - Math.sin(t * 1.4 + p) * 0.08;
  } else if (activity === "exercising") {
    rig.body.position.y = Math.abs(Math.sin(t * 4.5 + p)) * 0.1;
    rig.armL.rotation.x = Math.sin(t * 4.5 + p) * 0.9;
    rig.armR.rotation.x = -Math.sin(t * 4.5 + p) * 0.9;
    rig.head.rotation.x = -0.08;
  } else if (activity === "cooking" || activity === "cleaning" || activity === "watering") {
    rig.body.position.y = Math.sin(t * 1.8 + p) * 0.018;
    rig.head.rotation.x = -0.16;
    rig.armL.rotation.x = -0.62 + Math.sin(t * 2.5 + p) * 0.25;
    rig.armR.rotation.x = -0.62 - Math.sin(t * 2.5 + p) * 0.25;
  } else if (activity === "gaming") {
    rig.body.position.y = Math.sin(t * 1.2 + p) * 0.012;
    rig.head.rotation.x = -0.14;
    rig.armL.rotation.x = -0.76;
    rig.armR.rotation.x = -0.76;
  } else if (activity === "music") {
    rig.body.position.y = Math.sin(t * 2.1 + p) * 0.035;
    rig.body.rotation.z = Math.sin(t * 2.1 + p) * 0.1;
    rig.armL.rotation.x = Math.sin(t * 3.2 + p) * 0.5;
    rig.armR.rotation.x = -Math.sin(t * 3.2 + p) * 0.5;
  } else if (activity === "relaxing") {
    rig.body.position.y = Math.sin(t * 0.9 + p) * 0.025;
    rig.head.rotation.x = 0.12;
  } else if (activity === "socializing") {
    rig.body.position.y = Math.sin(t * 1.5 + p) * 0.025;
    rig.head.rotation.y = Math.sin(t * 1.1 + p) * 0.25;
    rig.armL.rotation.x = -0.35;
    rig.armR.rotation.x = -0.35;
  }
}

/* ------------------------------ speech bubble ----------------------------- */

const MOOD_BG: Record<MoodKey, string> = {
  happy: "#e8fff1",
  content: "#ffffff",
  meh: "#fff8e0",
  angry: "#ffe8ea",
};
const MOOD_EDGE: Record<MoodKey, string> = {
  happy: "#4fd48a",
  content: "#7fb8e8",
  meh: "#f0b429",
  angry: "#f2635f",
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeBubble(text: string, mood: MoodKey): THREE.Sprite {
  const W = 512;
  const pad = 26;
  const fontSize = 34;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `600 ${fontSize}px "Noto Sans Thai", "Mali", sans-serif`;

  // ตัดบรรทัดตามความกว้าง
  const maxW = W - pad * 2 - 20;
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur.length > 0) {
      lines.push(cur);
      cur = ch;
    } else cur = test;
  }
  if (cur) lines.push(cur);

  const lineH = fontSize * 1.32;
  const boxH = lines.length * lineH + pad * 1.6;
  const H = Math.ceil(boxH + 34);
  canvas.width = W;
  canvas.height = H;

  const c = canvas.getContext("2d")!;
  c.font = `600 ${fontSize}px "Noto Sans Thai", "Mali", sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";

  c.shadowColor = "rgba(20,10,40,0.35)";
  c.shadowBlur = 16;
  c.shadowOffsetY = 6;
  c.fillStyle = MOOD_BG[mood];
  roundRect(c, 8, 4, W - 16, boxH, 30);
  c.fill();
  // หางบับเบิ้ล
  c.beginPath();
  c.moveTo(W / 2 - 22, boxH);
  c.lineTo(W / 2 + 6, boxH + 28);
  c.lineTo(W / 2 + 18, boxH - 2);
  c.closePath();
  c.fill();
  c.shadowColor = "transparent";

  c.strokeStyle = MOOD_EDGE[mood];
  c.lineWidth = 4;
  roundRect(c, 8, 4, W - 16, boxH, 30);
  c.stroke();

  c.fillStyle = "#2c2340";
  lines.forEach((ln, i) => c.fillText(ln, W / 2, pad * 0.8 + lineH * (i + 0.5) + 2));

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  spr.renderOrder = 999;
  const scale = 1.55;
  spr.scale.set(scale, (scale * H) / W, 1);
  spr.center.set(0.5, 0);
  return spr;
}

export function moodEmojiSprite(emoji: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const c = canvas.getContext("2d")!;
  c.font = "96px serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(emoji, 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.renderOrder = 998;
  spr.scale.set(0.42, 0.42, 1);
  return spr;
}

export const unusedMat = mat;
