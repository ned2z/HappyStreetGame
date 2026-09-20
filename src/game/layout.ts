import { FURNITURE_MAP, allowedZones, ZONES, type PlaceType } from "./furniture";
import type { PlacedItem, Room } from "./engine";

export interface Point3 { x: number; y: number; z: number }
export interface Bounds3 { min: Point3; max: Point3 }
export const ROOM_W = 7.4;
export const LOFT_Y = 2.5;
export const WALL_HEIGHT = 4.8;
export const FLOOR_HEIGHT = 5.35;
export const ACTOR_RADIUS = 0.25;
export const TERRACE_DEPTH = 4.15;
export const HOUSE_PITCH = 9.4;
export const STAIR_X = 3.04;
export const STAIR_WIDTH = 0.88;
export const STAIR_STEPS = 12;
export const roomDepth = (level: number) => [6.6, 8.0, 9.4, 11.2, 13.2][level - 1] ?? 6.6;
export const floorSlotCount = (level: number) => [6, 9, 12, 15, 18][level - 1] ?? 6;
export const wallSlotCount = (level: number) => [3, 4, 5, 6, 7][level - 1] ?? 3;
export const loftSlotCount = (level: number) => [3, 5, 6, 6, 9][level - 1] ?? 3;
export const isLoftSlot = (slot: number) => slot >= 2000 && slot < 3000;
export const isWallSlot = (slot: number) => slot >= 1000 && slot < 2000;
export const isFloorSlot = (slot: number) => slot >= 0 && slot < 1000;
const ZONE_OFFSET: Record<PlaceType, number> = { floor: 0, wall: 1000, loft: 2000, terrace: 3000, nook: 4000, surface: 5000, ceiling: 6000 };
export const slotZone = (slot: number): PlaceType => (["floor", "wall", "loft", "terrace", "nook", "surface", "ceiling"] as const)[Math.floor(slot / 1000)] ?? "floor";
export const encodeSlot = (zone: PlaceType, slot: number) => slot + ZONE_OFFSET[zone];
export function zoneCapacity(level: number, zone: PlaceType) {
  const index = Math.max(0, Math.min(4, level - 1));
  const capacities: Record<PlaceType, number[]> = { floor: [6, 9, 12, 15, 18], loft: [3, 5, 6, 6, 9], wall: [3, 4, 5, 6, 7], terrace: [2, 3, 4, 5, 6], nook: [2, 2, 2, 4, 4], surface: [3, 3, 4, 4, 5], ceiling: [2, 3, 4, 5, 6] };
  return capacities[zone]?.[index] ?? 0;
}
export const loftFront = (level: number) => -roomDepth(level) / 2 + ([2.8, 3.6, 4.6, 5.4, 6.4][level - 1] ?? 2.8);
export const isMountedSlot = (slot: number) => isWallSlot(slot) || slotZone(slot) === "ceiling";
export function interactionFloor(slot: number) {
  return isLoftSlot(slot) || (isWallSlot(slot) && slot < 1003) || (slotZone(slot) === "ceiling" && slot % 1000 < 3) ? LOFT_Y : 0;
}

export function floorSlotPos(level: number, i: number) {
  return { x: [-2.3, -0.5, 1.3][i % 3], y: 0, z: -roomDepth(level) / 2 + 1.05 + Math.floor(i / 3) * 1.85, rot: 0 };
}
export function loftSlotPos(level: number, i: number) {
  return { x: [-2.3, -0.5, 1.3][i % 3], y: LOFT_Y, z: -roomDepth(level) / 2 + 1.05 + Math.floor(i / 3) * 1.7, rot: 0 };
}
export function wallSlotPos(level: number, i: number) {
  if (i < 3) return { x: [-2.3, -0.5, 1.3][i], y: LOFT_Y + 1.12, z: -roomDepth(level) / 2 + 0.22, rot: 0 };
  return { x: -ROOM_W / 2 + 0.22, y: 1.35, z: -roomDepth(level) / 2 + 3.25 + (i - 3) * 1.6, rot: Math.PI / 2 };
}
export function slotPosition(room: Room, slot: number) {
  const zone = slotZone(slot), i = slot % 1000, d = roomDepth(room.level);
  if (zone === "loft") return loftSlotPos(room.level, i);
  if (zone === "wall") return wallSlotPos(room.level, i);
  if (zone === "terrace") return { x: [-2.3, 1.3, -0.5, 2.95, -2.3, 2.3][i], y: 0, z: d / 2 + (i < 4 ? 1.65 : 0.55), rot: 0 };
  if (zone === "nook") return { x: [-2.65, 2.45, -1.55, 1.45][i], y: 0, z: d / 2 - 0.85, rot: 0 };
  if (zone === "surface") return i < 3 ? { x: [-2.3, -0.5, 1.3][i], y: 1.6, z: -d / 2 + 0.34, rot: 0 } : { x: -3.15, y: 1.55, z: d / 2 - 2.6 + (i - 3) * 1.5, rot: 0 };
  if (zone === "ceiling") return { x: [-2.3, -0.5, 1.3][i % 3], y: WALL_HEIGHT - 0.40, z: i < 3 ? -d / 2 + 1.15 : loftFront(room.level) + 1.1, rot: 0 };
  return floorSlotPos(room.level, i);
}
export function roomPosition(room: Room) {
  return { x: ((room.id % 3) - 1) * HOUSE_PITCH, y: 0, z: 0 };
}
export function stairs(room: Room) {
  const front = loftFront(room.level);
  return {
    bottom: { x: STAIR_X, y: 0, z: front + 2.6 },
    top: { x: STAIR_X, y: LOFT_Y, z: front - 0.4 },
    bounds: { min: { x: STAIR_X - 0.5, y: 0, z: front - 0.1 }, max: { x: STAIR_X + 0.5, y: LOFT_Y, z: front + 2.25 } },
  };
}

const FOOTPRINTS: Record<string, [number, number, number]> = {
  bed: [1.28, 1.34, 1.1], sofa: [1.3, 0.82, 0.9], desk: [1.25, 0.8, 1.2], chair: [0.64, 0.68, 1.15],
  wardrobe: [1.1, 0.66, 1.8], bookshelf: [1.2, 0.6, 1.8], piano: [1.25, 1.05, 1.3], gym: [1.3, 1.12, 1.6],
  plant: [0.64, 0.64, 1.35], lamp: [0.65, 0.65, 1.7], diffuser: [0.4, 0.4, 0.65], fireext: [0.62, 0.5, 1.25],
  pc: [1.3, 0.8, 1.35], gamingsetup: [1.3, 0.82, 1.3], bathtub: [1.3, 0.8, 0.7], fridge: [0.72, 0.66, 1.75],
  rug: [1.3, 1.18, 0.05], yoga: [1.14, 1.25, 1.5], petbed: [0.8, 0.7, 1.12], aquarium: [1.22, 0.6, 1.35],
  washing: [0.78, 0.72, 1.1], coffee: [1.22, 0.7, 1.22], bike: [1.2, 0.86, 1.42], safe: [0.75, 0.7, 1.2],
  massage: [1.0, 1.2, 1.32], hammock: [1.28, 0.9, 1.25], telescope: [0.8, 0.85, 1.45], easel: [0.85, 0.7, 1.7],
};

/** The renderer fits its mesh inside this same envelope used by placement and navigation. */
export function furnitureSize(defId: string, grade: number, zone: PlaceType) {
  const def = FURNITURE_MAP[defId];
  if (zone === "wall") return { width: 1.28, depth: 0.27, height: 1.2 };
  if (zone === "ceiling") return { width: 1.2, depth: 1.0, height: 0.65 };
  const [w, d, h] = def?.footprint ?? FOOTPRINTS[defId] ?? [0.92, 0.82, 1.45];
  const multiplier = 0.92 + Math.max(0, Math.min(2, grade)) * 0.04;
  return {
    width: Math.min(w * multiplier, zone === "surface" ? 0.54 : zone === "nook" ? 0.68 : 1.35),
    depth: Math.min(d * multiplier, zone === "surface" ? 0.30 : zone === "nook" ? 0.62 : 1.34),
    height: Math.min(h * multiplier, zone === "surface" ? 0.58 : zone === "loft" ? 1.85 : 2.1),
  };
}
export function itemBounds(room: Room, item: PlacedItem): Bounds3 {
  const zone = slotZone(item.slot);
  const p = slotPosition(room, item.slot);
  const size = furnitureSize(item.defId, item.grade, zone);
  const width = p.rot ? size.depth : size.width;
  const depth = p.rot ? size.width : size.depth;
  const y = zone === "wall" || zone === "ceiling" ? p.y - size.height / 2 : p.y;
  return { min: { x: p.x - width / 2, y, z: p.z - depth / 2 }, max: { x: p.x + width / 2, y: y + size.height, z: p.z + depth / 2 } };
}
export function intersects(a: Bounds3, b: Bounds3, padding = 0.015) {
  return a.min.x < b.max.x + padding && a.max.x > b.min.x - padding &&
    a.min.y < b.max.y - 0.005 && a.max.y > b.min.y + 0.005 &&
    a.min.z < b.max.z + padding && a.max.z > b.min.z - padding;
}
export function pointInBounds(p: Point3, box: Bounds3, radius = 0) {
  return p.x >= box.min.x - radius && p.x <= box.max.x + radius && p.z >= box.min.z - radius && p.z <= box.max.z + radius;
}

export function terraceFixtures(room: Room): Bounds3[] {
  const z = roomDepth(room.level) / 2;
  const fixtures = [
    { min: { x: -3.22, y: 0, z: z + 3.00 }, max: { x: -1.65, y: 1, z: z + 3.60 } },
    { min: { x: 2.65, y: 0, z: z + 3.01 }, max: { x: 3.24, y: 1.3, z: z + 3.63 } },
  ];
  if (room.level >= 2) for (const sign of [-1, 1]) fixtures.push({ min: { x: sign * 3.53 - 0.06, y: 0, z: z + 3.76 }, max: { x: sign * 3.53 + 0.06, y: 2.3, z: z + 3.88 } });
  if (room.level === 5) for (const sign of [-1, 1]) fixtures.push({ min: { x: sign * 3.25 - 0.22, y: 0, z: z + 2.38 }, max: { x: sign * 3.25 + 0.22, y: 0.4, z: z + 2.82 } });
  return fixtures;
}

export function placementError(room: Room | undefined, defId: string, grade: number, zone: PlaceType, slot: number, ignoreUid?: string, actors: Point3[] = []): string | null {
  const def = FURNITURE_MAP[defId];
  if (!room?.unlocked) return "กรุณาเลือกห้องที่เปิดให้เช่าแล้ว";
  if (!def || !Number.isInteger(grade) || grade < 0 || grade > 2) return "ไม่พบเฟอร์นิเจอร์หรือเกรดนี้";
  if (!ZONES.includes(zone) || !allowedZones(def).includes(zone)) return "อุปกรณ์นี้ไม่เหมาะกับโซนที่เลือก";
  if (room.level < (def.minLevel ?? 1)) return `ต้องอัปเกรดบ้านเป็นระดับ ${def.minLevel} ก่อน`;
  if (!Number.isInteger(slot) || slot < 0 || slot >= zoneCapacity(room.level, zone)) return "ช่องติดตั้งนี้อยู่นอกห้อง";
  const encoded = encodeSlot(zone, slot);
  if (room.items.some((i) => i.uid !== ignoreUid && i.slot === encoded)) return "ช่องนี้มีเฟอร์นิเจอร์แล้ว ไม่สามารถวางทับได้";
  const bounds = itemBounds(room, { uid: "preview", defId, grade, slot: encoded });
  if (room.items.some((i) => i.uid !== ignoreUid && intersects(bounds, itemBounds(room, i)))) return "พื้นที่ทับกับเฟอร์นิเจอร์ข้างเคียง กรุณาเลือกช่องอื่น";
  if (zone === "floor" || zone === "loft" || zone === "nook" || zone === "terrace") {
    const d = roomDepth(room.level);
    const end = zone === "loft" ? loftFront(room.level) - 0.22 : zone === "terrace" ? d / 2 + TERRACE_DEPTH - 0.2 : zone === "nook" ? d / 2 - 0.28 : d / 2 - 0.6;
    if (bounds.min.x < -ROOM_W / 2 + 0.2 || bounds.max.x > ROOM_W / 2 - 0.2 || bounds.min.z < -d / 2 + 0.2 || bounds.max.z > end) return "พื้นที่ไม่พอสำหรับเฟอร์นิเจอร์ชิ้นนี้";
    const stairBox = stairs(room).bounds;
    if (bounds.max.x > stairBox.min.x - 0.15 && bounds.max.z > stairBox.min.z - 0.35 && bounds.min.z < stairBox.max.z + 0.3) return "ต้องเว้นพื้นที่บันไดและทางเดิน";
    if (actors.some((p) => p.y < bounds.max.y + 0.1 && p.y + 1.15 > bounds.min.y && pointInBounds(p, bounds, ACTOR_RADIUS))) return "มีผู้เช่าอยู่ในพื้นที่นี้ รอให้เดินพ้นก่อนติดตั้ง";
    if (zone === "terrace" && terraceFixtures(room).some((fixed) => intersects(bounds, fixed))) return "ทับพื้นที่ม้านั่งหรือสวนเดิม กรุณาเลือกช่องอื่น";
  }
  return null;
}