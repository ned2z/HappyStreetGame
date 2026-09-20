export const MAX_HOUSE_LEVEL = 5;
export const HOUSE_LEVELS = [
  { level: 1, name: "บ้านเริ่มต้น", en: "Little Loft", capacity: 2, upgrade: 7200, rent: 380, upkeep: 55, power: 12, need: 8.5, color: "#93ad94" },
  { level: 2, name: "บ้านแสนสบาย", en: "Garden Home", capacity: 2, upgrade: 21000, rent: 640, upkeep: 120, power: 20, need: 10, color: "#a2b9c3" },
  { level: 3, name: "บ้านแชร์อบอุ่น", en: "Shared Cottage", capacity: 3, upgrade: 44000, rent: 980, upkeep: 235, power: 28, need: 12, color: "#c6a69a" },
  { level: 4, name: "บ้านพรีเมียม", en: "Premium Retreat", capacity: 3, upgrade: 88000, rent: 1480, upkeep: 410, power: 36, need: 14, color: "#acabd0" },
  { level: 5, name: "วิลล่ารูมเมต", en: "Co-living Villa", capacity: 4, upgrade: 0, rent: 2100, upkeep: 780, power: 45, need: 17, color: "#cdb176" },
] as const;

export function houseLevel(level: number) {
  return HOUSE_LEVELS[Number.isFinite(level) ? Math.max(0, Math.min(4, Math.round(level) - 1)) : 0];
}
export function roomCapacity(room: { level: number }) { return houseLevel(room.level).capacity; }

export function visibleHouseIds(selectedId: number, total = 12) {
  const start = Math.floor(Math.max(0, Math.min(total - 1, selectedId)) / 3) * 3;
  return Array.from({ length: Math.min(3, total - start) }, (_, i) => start + i);
}