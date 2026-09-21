import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { FullState } from "../game/store";
import type { PlacedItem, Room } from "../game/engine";
import { FURNITURE_MAP, ZONES, type PlaceType } from "../game/furniture";
import { houseLevel, roomCapacity, visibleHouseIds } from "../game/houseLevels";
import { ACTIVITY_INFO } from "../game/activities";
import type { Tenant } from "../game/tenants";
import {
  ROOM_W, STORY_HEIGHT, TERRACE_DEPTH, encodeSlot, furnitureSize, houseHeight, houseStoryCount, isMountedSlot, interactionFloor,
  loftFront, roomDepth, roomPosition, slotPosition, slotZone, zoneCapacity, type Point3,
} from "../game/layout";
import { layoutKey, navigationFor, type RoomNavigation, type Waypoint } from "../game/navigation";
import { advancePath } from "../game/movement";
import { makeActor, animateActor, type ActorRig } from "./actors";
import { makeBubble } from "./character";
import { buildProp, rbox } from "./props";
import { contactShadow, disposeWorldTextures, garden, roomShell } from "./world";
import { COMMON_PLOTS, commonPlotPosition } from "../game/commons";
import { buildOutdoor } from "./commonsModels";
import { isSpecial } from "../game/tenants";
import { animateSpecialAura, createSpecialAura, type SpecialAura } from "./aura";

export interface PickTarget {
  type: "room" | "slot" | "item" | "tenant" | "locked" | "outdoor-slot" | "outdoor-item" | "clean";
  roomId: number;
  slot?: number;
  place?: PlaceType;
  uid?: string;
  tenantId?: string;
  district?: number;
}
export interface SceneOptions { scope: "room" | "building"; upper: boolean; paths: boolean }
interface Actor {
  rig: ActorRig;
  serial: number;
  path: Waypoint[];
  goal: Waypoint | null;
  reported: number;
  waiting: number;
  loopTime: number;
  loopIndex: number;
  bubble: THREE.Sprite | null;
  bubbleAt: number;
  label: THREE.Sprite | null;
  labelText: string;
  route: THREE.Line | null;
  shadow: THREE.Mesh;
  aura: SpecialAura | null;
  blockedSerial: number;
  stillTime: number;
  lastPosition: THREE.Vector3;
}
interface ItemView { root: THREE.Group; item: PlacedItem; fit: number; born: number }
interface RoomView {
  group: THREE.Group;
  shell: THREE.Group;
  upper: THREE.Group;
  items: Map<string, ItemView>;
  actors: Map<string, Actor>;
  pads: THREE.Group;
  padKey: string;
  key: string;
  shellKey: string;
  nav: RoomNavigation;
  badge: THREE.Sprite | null;
  badgeText: string;
  selection: THREE.Mesh | null;
  clean: THREE.Sprite | null;
  cleanKey: string;
}

function label(text: string, color = "#344f45", background = "#fffaf0", size = 32) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = `600 ${size}px "Noto Sans Thai", sans-serif`;
  canvas.width = Math.ceil(context.measureText(text).width) + 38;
  canvas.height = size + 26;
  context.font = `600 ${size}px "Noto Sans Thai", sans-serif`;
  context.fillStyle = background;
  context.beginPath(); context.roundRect(0, 0, canvas.width, canvas.height, 14); context.fill();
  context.textAlign = "center"; context.textBaseline = "middle"; context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
  sprite.scale.set(canvas.width / canvas.height * 0.34, 0.34, 1);
  sprite.renderOrder = 30;
  return sprite;
}

function cleanBadge(value: number) {
  const canvas = document.createElement("canvas"); canvas.width = 560; canvas.height = 116;
  const c = canvas.getContext("2d")!;
  c.shadowColor = "rgba(74,54,32,.20)"; c.shadowBlur = 12; c.shadowOffsetY = 5;
  c.fillStyle = "#fff8e9"; c.beginPath(); c.roundRect(5, 5, 550, 98, 34); c.fill(); c.shadowColor = "transparent";
  c.strokeStyle = value < 40 ? "#c36c58" : "#d1a05b"; c.lineWidth = 4; c.beginPath(); c.roundRect(5, 5, 550, 98, 34); c.stroke();
  c.fillStyle = value < 40 ? "#bd705b" : "#be9251"; c.beginPath(); c.arc(59, 54, 34, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#fff7e6"; c.lineWidth = 7; c.lineCap = "round";
  c.beginPath(); c.moveTo(47, 32); c.lineTo(69, 69); c.stroke();
  c.fillStyle = "#fff7e6"; c.beginPath(); c.moveTo(63, 65); c.lineTo(84, 75); c.lineTo(69, 88); c.closePath(); c.fill();
  c.font = '800 31px "Noto Sans Thai", sans-serif'; c.fillStyle = "#514936"; c.textAlign = "left"; c.fillText("CLEAN HOUSE", 110, 45);
  c.font = '600 22px "Noto Sans Thai", sans-serif'; c.fillStyle = value < 40 ? "#a8574b" : "#88775e"; c.fillText(`ความสะอาด ${Math.round(value)}%  /  กดทำความสะอาด`, 110, 77);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
  sprite.scale.set(4.35, 0.9, 1); sprite.renderOrder = 42; return sprite;
}

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly controls: OrbitControls;
  onPick: (target: PickTarget) => void = () => {};
  onActivity: (kind: "arrived" | "blocked", tenantId: string, serial: number) => void = () => {};
  private state: FullState | null = null;
  private views = new Map<number, RoomView>();
  private options: SceneOptions = { scope: "building", upper: true, paths: false };
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private clock = new THREE.Clock();
  private simulationTime = 0;
  private frame = 0;
  private raf = 0;
  private destroyed = false;
  private desiredTarget = new THREE.Vector3();
  private cameraGoal = new THREE.Vector3();
  private focusRemaining = 0;
  private sunlight: THREE.DirectionalLight;
  private envTarget: THREE.WebGLRenderTarget;
  private observer: ResizeObserver;
  private press = { x: 0, y: 0, at: 0 };
  private pointers = new Set<number>();
  private multiTouch = false;
  private lastDay = 0;
  private commons = new THREE.Group();
  private commonsKey = "";
  private commonsBounds = new THREE.Group();
  private floaters: { object: THREE.Sprite; born: number }[] = [];
  private padMaterials = ["#8aaf98", "#b4a3c9", "#8facbf", "#c1b97c", "#c39f89", "#9dc4c0", "#ddc98b"].map((color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.40, side: THREE.DoubleSide, depthWrite: false }));

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 1.85));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.domElement.style.cssText = "display:block;touch-action:none;width:100%;height:100%;cursor:grab";
    this.renderer.domElement.setAttribute("aria-label", "ฉากห้องเช่า 3D ลากเพื่อหมุนและใช้ปุ่มควบคุมมุมมองเพื่อซูม");
    container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color("#dce5d7");
    this.scene.fog = new THREE.Fog("#dce5d7", 44, 95);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const environment = new RoomEnvironment();
    this.envTarget = pmrem.fromScene(environment, 0.055);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = 0.48;
    environment.dispose(); pmrem.dispose();
    this.camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 150);
    this.camera.position.set(13, 12, 17);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.10;
    this.controls.enablePan = false;
    this.controls.minZoom = 0.12; this.controls.maxZoom = 2.5;
    this.controls.minPolarAngle = 0.42; this.controls.maxPolarAngle = 1.28;
    this.controls.minAzimuthAngle = -1.10; this.controls.maxAzimuthAngle = 1.22;
    this.controls.rotateSpeed = 0.6;
    this.controls.addEventListener("start", () => { this.focusRemaining = 0; });
    this.scene.add(new THREE.HemisphereLight("#f4f7ed", "#a4b19a", 1.4));
    this.sunlight = new THREE.DirectionalLight("#fff0d6", 3.0);
    this.sunlight.position.set(-7, 14, 9);
    this.sunlight.castShadow = true;
    const shadowSize = window.innerWidth < 760 ? 1024 : 2048;
    this.sunlight.shadow.mapSize.set(shadowSize, shadowSize);
    this.sunlight.shadow.camera.left = -18; this.sunlight.shadow.camera.right = 18;
    this.sunlight.shadow.camera.top = 18; this.sunlight.shadow.camera.bottom = -18;
    this.sunlight.shadow.camera.near = 0.5; this.sunlight.shadow.camera.far = 75;
    this.sunlight.shadow.normalBias = 0.022; this.sunlight.shadow.bias = -0.00025;
    this.scene.add(this.sunlight, this.sunlight.target);
    const fill = new THREE.DirectionalLight("#d5e5f0", 0.75);
    fill.position.set(8, 5, -6); this.scene.add(fill);
    this.scene.add(garden());
    const commonsGround = rbox(31, 0.07, 6.7, "#c3d0b4", { y: -0.39, z: 14.9 }, { r: 0.025, rough: 1 });
    commonsGround.receiveShadow = true;
    this.commonsBounds.add(commonsGround);
    this.commonsBounds.add(rbox(30.5, 0.045, 0.34, "#e5ddc8", { y: -0.325, z: 14.95 }, { r: 0.02 }));
    this.scene.add(this.commons, this.commonsBounds);
    const element = this.renderer.domElement;
    element.addEventListener("pointerdown", this.pointerDown);
    element.addEventListener("pointerup", this.pointerUp);
    element.addEventListener("pointercancel", this.pointerUp);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(container);
    this.resize(); this.animate();
  }

  private resize = () => {
    const width = Math.max(1, this.container.clientWidth), height = Math.max(1, this.container.clientHeight);
    const aspect = width / height;
    const halfHeight = aspect < 1 ? 6.8 / aspect : 7.2;
    this.camera.left = -halfHeight * aspect; this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight; this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height, false);
    if (this.state) this.focus();
    this.renderer.shadowMap.needsUpdate = true;
  };
  private pointerDown = (e: PointerEvent) => {
    this.pointers.add(e.pointerId);
    if (this.pointers.size > 1) this.multiTouch = true;
    else this.press = { x: e.clientX, y: e.clientY, at: performance.now() };
    this.renderer.domElement.style.cursor = "grabbing";
  };
  private pointerUp = (e: PointerEvent) => {
    const ignore = this.multiTouch || e.type === "pointercancel";
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) { this.multiTouch = false; this.renderer.domElement.style.cursor = "grab"; }
    if (ignore) return;
    if (Math.hypot(e.clientX - this.press.x, e.clientY - this.press.y) > 10 || performance.now() - this.press.at > 700) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, 1 - (e.clientY - rect.top) / rect.height * 2);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objects = [...this.views.values()].filter((v) => v.group.visible).map((v) => v.group);
    if (this.commons.visible) objects.push(this.commons);
    for (const hit of this.raycaster.intersectObjects(objects, true)) {
      let visible = true;
      let object: THREE.Object3D | null = hit.object;
      let target: PickTarget | undefined;
      while (object) {
        if (!object.visible) { visible = false; break; }
        target ??= object.userData.pick as PickTarget | undefined;
        object = object.parent;
      }
      if (visible && target) { this.onPick(target); return; }
    }
  };

  configure(options: SceneOptions) {
    const scopeChanged = this.options.scope !== options.scope;
    this.options = options; this.updateVisibility();
    if (scopeChanged) this.focus();
    this.renderer.shadowMap.needsUpdate = true;
  }
  zoom(amount: number) { this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom * amount, 0.12, 2.5); this.camera.updateProjectionMatrix(); }
  resetCamera() { this.focus(); }
  actorPositions(roomId: number): Point3[] {
    return [...(this.views.get(roomId)?.actors.values() ?? [])].map((a) => ({ x: a.rig.root.position.x, y: a.rig.root.position.y, z: a.rig.root.position.z }));
  }

  sync(state: FullState) {
    if (this.destroyed) return;
    const selectedChanged = this.state?.selectedRoom !== state.selectedRoom;
    this.state = state;
    this.syncCommons(state);
    const next = state.rooms.find((r) => !r.unlocked)?.id;
    const page = Math.floor((state.selectedRoom ?? 0) / 3);
    let dirty = false;
    for (const room of state.rooms) {
      if (!room.unlocked && room.id !== next && Math.floor(room.id / 3) !== page) continue;
      let view = this.views.get(room.id);
      if (!view) {
        const group = new THREE.Group(); const p = roomPosition(room); group.position.set(p.x, p.y, p.z);
        this.scene.add(group);
        view = { group, shell: new THREE.Group(), upper: new THREE.Group(), items: new Map(), actors: new Map(), pads: new THREE.Group(), key: "", shellKey: "", padKey: "", nav: navigationFor(room), badge: null, badgeText: "", selection: null, clean: null, cleanKey: "" };
        group.add(view.pads); this.views.set(room.id, view);
      }
      const shellKey = `${room.unlocked}:${room.level}`, key = layoutKey(room);
      if (view.shellKey !== shellKey) {
        this.remove(view.shell);
        if (room.unlocked) {
          const shell = roomShell(room); view.shell = shell.root; view.upper = shell.upper;
          view.shell.userData.pick = { type: "room", roomId: room.id } satisfies PickTarget;
        } else {
          const shell = roomShell(room); view.shell = shell.root; view.upper = shell.upper;
          view.shell.userData.pick = { type: "locked", roomId: room.id } satisfies PickTarget;
        }
        if (view.selection) this.remove(view.selection);
        const outline = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.52, 40), new THREE.MeshBasicMaterial({ color: "#dcc283", transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
        outline.rotation.x = -Math.PI / 2; outline.position.set(0, 0.025, roomDepth(room.level) / 2 + 0.65);
        view.group.add(outline); view.selection = outline;
        view.group.add(view.shell); view.shellKey = shellKey;
        for (const it of view.items.values()) this.remove(it.root);
        view.items.clear(); dirty = true;
      }
      const badgeText = room.unlocked ? `${String(room.id + 1).padStart(2, "0")}  ${houseLevel(room.level).en}  /  Lv.${room.level}  /  ${houseStoryCount(room.level)}F  /  ${room.tenantIds.length}/${roomCapacity(room)}` : `${String(room.id + 1).padStart(2, "0")}  /  บ้านรอเปิดให้เช่า`;
      if (view.badgeText !== badgeText || dirty) {
        if (view.badge) this.remove(view.badge);
        view.badge = label(badgeText, "#eff0e1", room.unlocked ? "#4b6656" : "#83917f", 30);
        view.badge.position.set(0, 0.6, roomDepth(room.level) / 2 + TERRACE_DEPTH + 0.15);
        view.badge.userData.pick = { type: room.unlocked ? "room" : "locked", roomId: room.id } satisfies PickTarget;
        view.group.add(view.badge); view.badgeText = badgeText;
      }
      const cleanKey = room.unlocked && room.cleanliness < 70 ? String(Math.round(room.cleanliness)) : "";
      if (cleanKey !== view.cleanKey) {
        if (view.clean) this.remove(view.clean);
        view.clean = null; view.cleanKey = cleanKey;
        if (cleanKey) {
          view.clean = cleanBadge(room.cleanliness);
          // House name is at y=.6; the larger clean action sits directly underneath it.
          view.clean.position.set(0, 0.10, roomDepth(room.level) / 2 + TERRACE_DEPTH + 0.34);
          view.clean.userData.pick = { type: "clean", roomId: room.id } satisfies PickTarget;
          view.group.add(view.clean);
        }
      }
      if (!room.unlocked) continue;
      if (key !== view.key) {
        view.nav = navigationFor(room); view.key = key; this.syncItems(view, room);
        for (const actor of view.actors.values()) {
          const p = actor.rig.root.position;
          const onStory = Math.abs(p.y / STORY_HEIGHT - Math.round(p.y / STORY_HEIGHT)) < 0.02;
          if (onStory && !view.nav.isClear(p)) {
            const safe = view.nav.safePoint(p); if (safe) p.set(safe.x, safe.y, safe.z);
          }
          actor.serial = -1;
        }
        dirty = true;
      }
      this.syncActors(view, room, state);
      const padKey = `${key}:${state.selectedRoom}:${state.selectedSlot?.place}:${state.selectedSlot?.slot}`;
      if (view.padKey !== padKey) { this.syncPads(view, room); view.padKey = padKey; }
    }
    for (const [id, view] of this.views) if (!state.rooms[id]?.unlocked && id !== next && Math.floor(id / 3) !== page) { this.remove(view.group); this.views.delete(id); }
    this.updateVisibility();
    if (selectedChanged || dirty) this.focus();
    if (this.lastDay && state.day > this.lastDay) {
      const room = state.rooms[state.selectedRoom ?? 0];
      const rent = room.tenantIds.reduce((sum, id) => sum + (state.tenants[id]?.lastRent ?? 0), 0);
      if (rent) {
        const p = roomPosition(room); const floater = label(`+${rent.toLocaleString("th-TH")} ฿`, "#467250", "#eef6df");
        floater.position.set(p.x, p.y + 2.3, roomDepth(room.level) / 2 + 0.4);
        this.scene.add(floater); this.floaters.push({ object: floater, born: performance.now() });
      }
    }
    this.lastDay = state.day;
    if (dirty) this.renderer.shadowMap.needsUpdate = true;
  }

  private syncCommons(state: FullState) {
    const district = Math.floor((state.selectedRoom ?? 0) / 3);
    const items = state.outdoorItems.filter((item) => item.district === district);
    const key = `${district}|${items.map((i) => `${i.uid}:${i.defId}:${i.grade}:${i.slot}`).join("|")}`;
    if (key === this.commonsKey) return;
    for (const child of [...this.commons.children]) this.remove(child);
    this.commonsKey = key;
    for (let slot = 0; slot < COMMON_PLOTS; slot++) {
      const p = commonPlotPosition(slot);
      const item = items.find((i) => i.slot === slot);
      const plot = new THREE.Group(); plot.position.set(p.x, p.y, p.z);
      plot.add(rbox(2.55, 0.035, 2.55, slot % 2 ? "#b9c6a7" : "#b4c3a0", { y: -0.016 }, { r: 0.015, rough: 1 }));
      if (item) {
        plot.add(buildOutdoor(item));
        plot.add(contactShadow(2.6, 2.6, 0.28));
        plot.userData.pick = { type: "outdoor-item", roomId: district * 3, district, slot, uid: item.uid } satisfies PickTarget;
      } else {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.20, 0.23, 32), new THREE.MeshBasicMaterial({ color: "#75927b", opacity: 0.55, transparent: true, side: THREE.DoubleSide }));
        (ring.material as THREE.Material).userData.owned = true;
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.015; plot.add(ring);
        plot.userData.pick = { type: "outdoor-slot", roomId: district * 3, district, slot } satisfies PickTarget;
      }
      const number = label(`S${String(slot + 1).padStart(2, "0")}`, "#58715d", "#eee9d8", 24);
      number.position.set(0, 0.10, 1.31); number.scale.multiplyScalar(0.52); plot.add(number);
      this.commons.add(plot);
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  private syncItems(view: RoomView, room: Room) {
    for (const [uid, entry] of view.items) {
      const current = room.items.find((i) => i.uid === uid);
      if (!current || current.grade !== entry.item.grade || current.slot !== entry.item.slot) { this.remove(entry.root); view.items.delete(uid); }
    }
    for (const item of room.items) {
      if (view.items.has(item.uid) || !FURNITURE_MAP[item.defId]) continue;
      const object = buildProp(item.defId, item.grade);
      const bounds = new THREE.Box3().setFromObject(object), raw = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      const size = furnitureSize(item.defId, item.grade, slotZone(item.slot));
      const fit = Math.min(1, size.width / Math.max(raw.x, 0.01), size.depth / Math.max(raw.z, 0.01), size.height / Math.max(raw.y, 0.01));
      object.scale.setScalar(fit);
      object.position.set(-center.x * fit, (isMountedSlot(item.slot) ? -center.y : -bounds.min.y) * fit, -center.z * fit);
      const root = new THREE.Group(), p = slotPosition(room, item.slot);
      root.position.set(p.x, p.y, p.z); root.rotation.y = p.rot; root.add(object);
      if (!isMountedSlot(item.slot)) root.add(contactShadow(size.width * 1.4, size.depth * 1.4, 0.37));
      root.userData.pick = { type: "item", roomId: room.id, uid: item.uid } satisfies PickTarget;
      view.group.add(root); view.items.set(item.uid, { root, item: { ...item }, fit, born: performance.now() });
    }
  }
  private syncPads(view: RoomView, room: Room) {
    for (const child of [...view.pads.children]) this.remove(child);
    if (this.state?.selectedRoom !== room.id) return;
    for (const zone of ZONES) for (let slot = 0; slot < zoneCapacity(room.level, zone); slot++) {
      if (room.items.some((i) => i.slot === encodeSlot(zone, slot))) continue;
      const p = slotPosition(room, encodeSlot(zone, slot));
      const geometry = zone === "wall" ? new THREE.PlaneGeometry(0.32, 0.32) : new THREE.RingGeometry(0.18, 0.215, 28);
      const pad = new THREE.Mesh(geometry, this.padMaterials[ZONES.indexOf(zone)]);
      pad.position.set(p.x, p.y + (zone === "wall" ? 0 : 0.024), p.z + (zone === "wall" ? 0.18 : 0));
      if (zone === "wall") pad.rotation.y = p.rot; else pad.rotation.x = -Math.PI / 2;
      pad.userData.pick = { type: "slot", roomId: room.id, slot, place: zone } satisfies PickTarget; view.pads.add(pad);
    }
  }
  private syncActors(view: RoomView, room: Room, state: FullState) {
    for (const [id, actor] of view.actors) if (!room.tenantIds.includes(id) || !state.tenants[id]) {
      this.remove(actor.rig.root); this.remove(actor.shadow); if (actor.route) this.remove(actor.route);
      view.actors.delete(id);
    }
    for (const [index, tid] of room.tenantIds.entries()) {
      const tenant = state.tenants[tid]; if (!tenant) continue;
      let actor = view.actors.get(tid);
      if (!actor) {
        const rig = makeActor(tenant);
        const spawn = view.nav.safePoint({ x: index % 2 ? 0.5 : -0.5, y: 0, z: roomDepth(room.level) / 2 + 0.65 + Math.floor(index / 2) * 0.75 });
        if (!spawn) continue;
        rig.root.position.set(spawn.x, spawn.y, spawn.z);
        rig.root.userData.pick = { type: "tenant", roomId: room.id, tenantId: tid } satisfies PickTarget;
        const shadow = contactShadow(0.8, 0.8, 0.6); view.group.add(rig.root, shadow);
        const aura = isSpecial(tenant) ? createSpecialAura(tenant.auraColor ?? "#d7bb82") : null;
        if (aura) rig.dock.add(aura.root);
        actor = { rig, serial: -1, path: [], goal: null, reported: -1, waiting: 0, loopTime: 0, loopIndex: 0, bubble: null, bubbleAt: 0, label: null, labelText: "", route: null, shadow, aura, blockedSerial: -1, stillTime: 0, lastPosition: rig.root.position.clone() };
        view.actors.set(tid, actor);
      }
      if (actor.serial !== tenant.behavior.serial) this.plan(view, room, tenant, actor, index);
      const bubble = state.bubbles[tid];
      if (bubble && bubble.at !== actor.bubbleAt && Date.now() - bubble.at < 6500) {
        if (actor.bubble) this.remove(actor.bubble);
        actor.bubble = makeBubble(bubble.text, bubble.mood); actor.bubble.scale.multiplyScalar(1.1);
        actor.rig.root.add(actor.bubble); actor.bubbleAt = bubble.at;
      }
    }
  }

  private plan(view: RoomView, room: Room, tenant: Tenant, actor: Actor, index: number) {
    actor.serial = tenant.behavior.serial; actor.reported = -1; actor.blockedSerial = -1; actor.waiting = 0; actor.loopTime = 0;
    actor.stillTime = 0; actor.lastPosition.copy(actor.rig.root.position);
    if (tenant.behavior.inPlace) {
      actor.goal = { x: actor.rig.root.position.x, y: actor.rig.root.position.y, z: actor.rig.root.position.z };
      actor.path = []; this.route(view, actor); return;
    }
    const info = ACTIVITY_INFO[tenant.behavior.activity], from = actor.rig.root.position;
    const d = roomDepth(room.level);
    let goal: Waypoint | null = null;
    if (tenant.behavior.targetUid) {
      const item = room.items.find((i) => i.uid === tenant.behavior.targetUid);
      if (item) goal = view.nav.accessPoint(item, from);
    } else {
      const x = [-0.7, 0.7, -1.65, 1.65][index % 4];
      let p: Point3 = { x, y: 0, z: d / 2 - 1.4 };
      if (info.destination === "loft") p = { x, y: (houseStoryCount(room.level) - 1) * STORY_HEIGHT, z: loftFront(room.level) - 0.5 };
      if (info.destination === "terrace") p = { x, y: 0, z: d / 2 + 2.6 };
      if (info.destination === "door") p = { x: index % 2 ? 0.45 : -0.45, y: 0, z: d / 2 + 0.65 + Math.floor(index / 2) * 0.4 };
      goal = view.nav.safePoint(p);
    }
    actor.goal = goal;
    const path = goal ? view.nav.findPath(from, goal) : null;
    actor.path = path ?? [];
    if (!path) this.report("blocked", tenant.id, actor);
    this.route(view, actor);
  }
  private report(kind: "arrived" | "blocked", tid: string, actor: Actor) {
    const serial = actor.serial;
    if (kind === "blocked") {
      if (actor.blockedSerial === serial) return;
      actor.blockedSerial = serial; actor.path = []; actor.goal = null;
      if (actor.route) { this.remove(actor.route); actor.route = null; }
    } else {
      if (actor.reported === serial || actor.blockedSerial === serial) return;
      actor.reported = serial;
    }
    queueMicrotask(() => { if (!this.destroyed) this.onActivity(kind, tid, serial); });
  }
  private route(view: RoomView, actor: Actor) {
    if (actor.route) this.remove(actor.route);
    if (!actor.path.length) { actor.route = null; return; }
    const positions = [actor.rig.root.position, ...actor.path].map((p) => new THREE.Vector3(p.x, p.y + 0.045, p.z));
    actor.route = new THREE.Line(new THREE.BufferGeometry().setFromPoints(positions), new THREE.LineBasicMaterial({ color: "#dfaa52", transparent: true, opacity: 0.85, depthTest: false }));
    actor.route.renderOrder = 4; actor.route.visible = this.options.paths; view.group.add(actor.route);
  }
  private move(view: RoomView, tid: string, actor: Actor, dt: number) {
    const motion = advancePath(view.nav, actor.rig.root.position, actor.path, dt * 1.18);
    if (motion.blocked) {
      this.report("blocked", tid, actor);
    } else actor.waiting = 0;
    if (motion.heading !== null) {
      const difference = Math.atan2(Math.sin(motion.heading - actor.rig.root.rotation.y), Math.cos(motion.heading - actor.rig.root.rotation.y));
      actor.rig.root.rotation.y += difference * Math.min(1, dt * 9);
    }
    return motion.moved;
  }

  private updateVisibility() {
    const selected = this.state?.selectedRoom ?? 0;
    const page = Math.floor(selected / 3);
    this.commons.visible = this.commonsBounds.visible = this.options.scope === "building";
    for (const [id, view] of this.views) {
      view.group.visible = this.options.scope === "building" ? Math.floor(id / 3) === page : id === selected;
      view.upper.visible = this.options.upper;
      if (view.selection) view.selection.visible = id === selected;
      for (const child of view.shell.children) if (child instanceof THREE.PointLight) child.visible = view.group.visible;
      for (const item of view.items.values()) item.root.visible = this.options.upper || interactionFloor(item.item.slot, this.state!.rooms[id].level) === 0;
      for (const pad of view.pads.children) {
        const pick = pad.userData.pick as PickTarget;
        pad.visible = (this.options.scope === "room" || id === selected) && (this.options.upper || interactionFloor(encodeSlot(pick.place!, pick.slot!), this.state!.rooms[id].level) === 0);
      }
      for (const actor of view.actors.values()) if (actor.route) actor.route.visible = this.options.paths;
    }
  }
  private focus() {
    if (!this.state) return;
    const selected = this.state.selectedRoom ?? 0;
    const houses = this.options.scope === "room" ? [this.state.rooms[selected]] : visibleHouseIds(selected, this.state.rooms.length).map((id) => this.state!.rooms[id]);
    const direction = new THREE.Vector3(this.options.scope === "room" ? 12 : 8, 18, 30).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const points: THREE.Vector3[] = [];
    const bounds = new THREE.Box3();
    for (const room of houses) {
      const p = roomPosition(room), d = roomDepth(room.level);
      for (const x of [p.x - ROOM_W / 2 - 0.5, p.x + ROOM_W / 2 + 0.5]) for (const y of [-0.5, houseHeight(room.level) + 2.65]) for (const z of [-d / 2 - 0.7, d / 2 + TERRACE_DEPTH + 0.8]) {
        const point = new THREE.Vector3(x, y, z); points.push(point); bounds.expandByPoint(point);
      }
    }
    if (this.options.scope === "building") for (const x of [-14.4, 14.4]) for (const y of [-0.5, 2.2]) for (const z of [12.15, 18.2]) {
      const point = new THREE.Vector3(x, y, z); points.push(point); bounds.expandByPoint(point);
    }
    const center = bounds.getCenter(new THREE.Vector3());
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const point of points) {
      const relative = point.clone().sub(center), x = relative.dot(right), y = relative.dot(up);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const height = Math.max(1, this.container.clientHeight);
    const topMargin = this.container.clientWidth < 760 ? 160 : 118;
    const bottomMargin = this.container.clientWidth < 760 ? 172 : 188;
    const usableHeight = Math.max(0.32, (height - topMargin - bottomMargin) / height);
    const zoom = Math.min((this.camera.right - this.camera.left) * 0.92 / (maxX - minX), (this.camera.top - this.camera.bottom) * usableHeight / (maxY - minY));
    this.camera.zoom = THREE.MathUtils.clamp(zoom, 0.12, 2.0);
    const screenShift = (bottomMargin - topMargin) / height * (this.camera.top - this.camera.bottom) / (2 * this.camera.zoom);
    this.desiredTarget.copy(center).addScaledVector(up, -screenShift);
    this.cameraGoal.copy(this.desiredTarget).addScaledVector(direction, 38);
    this.camera.updateProjectionMatrix(); this.focusRemaining = 1.1;
    this.sunlight.target.position.copy(this.desiredTarget);
    this.sunlight.position.copy(this.desiredTarget).add(new THREE.Vector3(-7, 14, 9));
    this.renderer.shadowMap.needsUpdate = true;
  }

  private animate = () => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.animate);
    const realDt = Math.min(0.05, this.clock.getDelta());
    const running = !!this.state && !this.state.intro && this.state.speed > 0;
    const dt = running ? realDt * this.state!.speed : 0;
    this.simulationTime += dt; this.frame++;
    if (this.focusRemaining > 0) {
      this.focusRemaining -= realDt; this.controls.target.lerp(this.desiredTarget, 0.08); this.camera.position.lerp(this.cameraGoal, 0.08);
    }
    this.controls.update();
    const now = Date.now();
    for (const [id, view] of this.views) {
      const room = this.state?.rooms[id]; if (!room?.unlocked) continue;
      for (const item of view.items.values()) {
        const k = Math.min(1, (performance.now() - item.born) / 350); item.root.scale.setScalar(1 - Math.pow(1 - k, 3));
        if (item.item.defId === "ceilingFan" && item.root.children[0]) item.root.children[0].rotation.y += dt * 1.25;
      }
      if (view.badge) {
        const targetWidth = Math.min(this.container.clientWidth < 760 ? 116 : 222, this.container.clientWidth / (this.options.scope === "building" ? 3.6 : 2));
        const image = view.badge.material.map?.image as { width: number; height: number } | undefined;
        const worldPerPixel = (this.camera.right - this.camera.left) / (this.container.clientWidth * this.camera.zoom);
        if (image) view.badge.scale.set(targetWidth * worldPerPixel, targetWidth * worldPerPixel * image.height / image.width, 1);
      }
      if (view.clean) {
        const scale = 1 + Math.sin(this.simulationTime * 2.1 + id) * 0.035;
        view.clean.scale.set(4.35 * scale, 0.9 * scale, 1);
        view.clean.position.y = 0.10 + Math.sin(this.simulationTime * 1.5 + id) * 0.055;
      }
      const newestBubble = [...view.actors.values()].filter((a) => a.bubble).sort((a, b) => b.bubbleAt - a.bubbleAt)[0];
      for (const [tid, actor] of view.actors) {
        const tenant = this.state!.tenants[tid]; if (!tenant) continue;
        const behavior = tenant.behavior, activity = ACTIVITY_INFO[behavior.activity], p = actor.rig.root.position;
        let moving = false;
        if (behavior.inPlace) actor.rig.dock.position.lerp(new THREE.Vector3(), Math.min(1, dt * 8));
        if (actor.path.length) {
          actor.rig.dock.position.lerp(new THREE.Vector3(), Math.min(1, dt * 10));
          if (actor.rig.dock.position.length() < 0.04 && Math.abs(actor.rig.body.rotation.x) < 0.35 && Math.abs(actor.rig.body.position.z) < 0.1 && running) moving = this.move(view, tid, actor, dt);
        }
        if (actor.path.length && running) {
          if (p.distanceToSquared(actor.lastPosition) > 0.000036) { actor.stillTime = 0; actor.lastPosition.copy(p); }
          else actor.stillTime += dt;
          if (actor.stillTime > 2.5) this.report("blocked", tid, actor);
        } else actor.stillTime = 0;
        const nearestStory = Math.round(p.y / STORY_HEIGHT) * STORY_HEIGHT;
        const climbing = Math.abs(p.y - nearestStory) > 0.02 || !!actor.path[0]?.stair;
        if (!actor.path.length && actor.goal && running && behavior.phase === "walking") this.report("arrived", tid, actor);
        if (behavior.phase === "active" && !actor.path.length) {
          actor.loopTime += dt;
          if (["briskWalk", "inspectLoft"].includes(behavior.activity) && actor.loopTime > 5.5) {
            actor.loopTime = 0; actor.loopIndex++;
            const up = behavior.activity === "inspectLoft";
            const goal = view.nav.safePoint({ x: actor.loopIndex % 2 ? -1.25 : 1.3, y: up ? (houseStoryCount(room.level) - 1) * STORY_HEIGHT : 0, z: up ? loftFront(room.level) - 0.55 : roomDepth(room.level) / 2 + 0.7 });
            const path = goal && view.nav.findPath(p, goal);
            if (path) { actor.goal = goal; actor.path = path; this.route(view, actor); }
          }
          if (behavior.activity === "sleeping" && behavior.targetUid) {
            const item = view.items.get(behavior.targetUid);
            if (item) {
              actor.rig.root.rotation.y += Math.atan2(Math.sin(-actor.rig.root.rotation.y), Math.cos(-actor.rig.root.rotation.y)) * Math.min(1, dt * 8);
              const sleepers = room.tenantIds.filter((id) => this.state!.tenants[id]?.behavior.targetUid === behavior.targetUid);
              const upperBed = FURNITURE_MAP[item.item.defId]?.model === "bunk" && sleepers.indexOf(tid) > 0;
              const dock = item.root.position.clone().sub(p); dock.y += (upperBed ? 1.48 : 0.56) * item.fit;
              dock.applyAxisAngle(new THREE.Vector3(0, 1, 0), -actor.rig.root.rotation.y);
              actor.rig.dock.position.lerp(dock, Math.min(1, dt * 3.5));
            }
          } else if (behavior.targetUid) {
            const item = view.items.get(behavior.targetUid);
            if (item) {
              const heading = Math.atan2(item.root.position.x - p.x, item.root.position.z - p.z);
              actor.rig.root.rotation.y += Math.atan2(Math.sin(heading - actor.rig.root.rotation.y), Math.cos(heading - actor.rig.root.rotation.y)) * Math.min(1, dt * 5);
            }
          } else actor.rig.root.rotation.y += Math.atan2(Math.sin(-actor.rig.root.rotation.y), Math.cos(-actor.rig.root.rotation.y)) * Math.min(1, dt * 4);
        }
        if (dt > 0) animateActor(actor.rig, behavior.phase === "active" ? behavior.activity : "idle", this.simulationTime, dt, moving, climbing);
        if (actor.aura) animateSpecialAura(actor.aura, this.simulationTime + actor.rig.phase);
        actor.rig.root.visible = this.options.upper || p.y < 0.05;
        actor.shadow.visible = actor.rig.root.visible && !climbing && !(behavior.activity === "sleeping" && behavior.phase === "active");
        actor.shadow.position.set(p.x, p.y + 0.018, p.z);
        const walkingText = actor.waiting > 0.4 ? "รอให้ทางว่าง" : climbing ? "เดินขึ้น / ลงบันได" : "กำลังเดิน";
        const seconds = Math.ceil(behavior.remainingMs / 1000);
        const current = `${isSpecial(tenant) ? "SPECIAL / " : ""}${tenant.name}  |  ${behavior.phase === "walking" || moving ? walkingText : activity.th}${behavior.phase === "active" && !moving ? ` ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : ""}`;
        if (current !== actor.labelText) {
          if (actor.label) this.remove(actor.label);
          actor.label = label(current, "#3c5048", isSpecial(tenant) ? tenant.auraColor ?? "#e8d8ab" : "#fffbef", 25);
          actor.label.scale.multiplyScalar(Math.min(0.9, 3.1 / actor.label.scale.x)); actor.rig.root.add(actor.label); actor.labelText = current;
        }
        if (actor.bubble && now - actor.bubbleAt > 6500) { this.remove(actor.bubble); actor.bubble = null; }
        if (actor.label) {
          actor.label.visible = (!actor.bubble || actor !== newestBubble) && (this.options.scope === "room" || id === this.state?.selectedRoom);
          actor.label.position.copy(actor.rig.dock.position).add(new THREE.Vector3(0, 1.30, 0));
        }
        if (actor.bubble) {
          actor.bubble.visible = (this.options.scope === "room" || id === this.state?.selectedRoom) && actor === newestBubble;
          const worldPerPixel = (this.camera.right - this.camera.left) / (this.container.clientWidth * this.camera.zoom);
          const pixelWidth = Math.min(240, Math.max(190, this.container.clientWidth * 0.24));
          const image = actor.bubble.material.map?.image as { width: number; height: number } | undefined;
          if (image) actor.bubble.scale.set(pixelWidth * worldPerPixel, pixelWidth * worldPerPixel * image.height / image.width, 1);
          actor.bubble.position.copy(actor.rig.dock.position).add(new THREE.Vector3(0, 1.22 + Math.sin(this.simulationTime * 1.6) * 0.02, 0));
          const projected = actor.rig.root.localToWorld(actor.bubble.position.clone()).project(this.camera);
          const screenX = (projected.x + 1) * this.container.clientWidth / 2;
          const left = Math.max(8, Math.min(this.container.clientWidth - pixelWidth - 8, screenX - pixelWidth / 2));
          actor.bubble.center.x = (screenX - left) / pixelWidth;
        }
      }
    }
    const pulse = 0.38 + Math.sin(this.simulationTime * 1.7) * 0.08; this.padMaterials.forEach((m) => { m.opacity = pulse; });
    this.floaters = this.floaters.filter((f) => {
      const age = (performance.now() - f.born) / 2200;
      if (age > 1) { this.remove(f.object); return false; }
      f.object.position.y += realDt * 0.55; f.object.material.opacity = Math.min(1, (1 - age) * 2); return true;
    });
    if (running && this.frame % 4 === 0) this.renderer.shadowMap.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  };

  private remove(object: THREE.Object3D) {
    object.removeFromParent();
    object.traverse((child) => {
      if (child instanceof THREE.Sprite) { child.material.map?.dispose(); child.material.dispose(); }
      if (child instanceof THREE.Line) { child.geometry.dispose(); (child.material as THREE.Material).dispose(); }
      if (child instanceof THREE.Points) { child.geometry.dispose(); const material = child.material as THREE.PointsMaterial; material.map?.dispose(); material.dispose(); }
      if (child instanceof THREE.Mesh && (child.geometry instanceof THREE.PlaneGeometry || child.geometry instanceof THREE.RingGeometry)) child.geometry.dispose();
      if (child instanceof THREE.Mesh) {
        if (child.geometry.userData.owned) child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => { if (material.userData.owned) material.dispose(); });
      }
    });
  }
  dispose() {
    this.destroyed = true; cancelAnimationFrame(this.raf); this.observer.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.pointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.pointerUp);
    this.renderer.domElement.removeEventListener("pointercancel", this.pointerUp);
    this.controls.dispose(); this.envTarget.dispose();
    const geometry = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points) { geometry.add(o.geometry); const list = Array.isArray(o.material) ? o.material : [o.material]; list.forEach((m) => materials.add(m)); if (o instanceof THREE.Points) (o.material as THREE.PointsMaterial).map?.dispose(); }
      if (o instanceof THREE.Sprite) { o.material.map?.dispose(); materials.add(o.material); }
    });
    geometry.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose());
    disposeWorldTextures();
    this.renderer.dispose(); this.renderer.domElement.remove(); this.views.clear();
  }
}