import * as THREE from "three";

export interface SpecialAura { root: THREE.Group; particles: THREE.Points; inner: THREE.Mesh; outer: THREE.Mesh }

export function createSpecialAura(color: string): SpecialAura {
  const root = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  ringMaterial.userData.owned = true;
  const inner = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.35, 48), ringMaterial);
  const outer = new THREE.Mesh(new THREE.RingGeometry(0.43, 0.45, 64), ringMaterial.clone());
  inner.rotation.x = outer.rotation.x = -Math.PI / 2;
  inner.position.y = 0.022; outer.position.y = 0.027;
  root.add(inner, outer);
  const positions = new Float32Array(24 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.userData.owned = true;
  const pixels = new Uint8Array(16 * 16 * 4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const alpha = Math.max(0, 1 - Math.hypot(x - 7.5, y - 7.5) / 7.5);
    const i = (y * 16 + x) * 4;
    pixels.set([255, 255, 255, Math.round(alpha * alpha * 255)], i);
  }
  const texture = new THREE.DataTexture(pixels, 16, 16); texture.needsUpdate = true;
  const material = new THREE.PointsMaterial({ color, size: 5.5, sizeAttenuation: false, map: texture, transparent: true, opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  material.userData.owned = true;
  const particles = new THREE.Points(geometry, material);
  particles.frustumCulled = false;
  root.add(particles);
  animateSpecialAura({ root, particles, inner, outer }, 0);
  return { root, particles, inner, outer };
}

export function animateSpecialAura(aura: SpecialAura, time: number) {
  const points = aura.particles.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < points.count; i++) {
    const phase = (time * 0.21 + i / points.count) % 1;
    const angle = i * 2.399 + time * 0.75;
    const radius = 0.33 + Math.sin(i) * 0.08 + phase * 0.08;
    points.setXYZ(i, Math.cos(angle) * radius, 0.08 + phase * 1.3, Math.sin(angle) * radius);
  }
  points.needsUpdate = true;
  aura.inner.scale.setScalar(1 + Math.sin(time * 1.8) * 0.055);
  aura.outer.scale.setScalar(1 + Math.sin(time * 1.8 + 1) * 0.07);
  (aura.outer.material as THREE.MeshBasicMaterial).opacity = 0.38 + Math.sin(time * 1.1) * 0.1;
}