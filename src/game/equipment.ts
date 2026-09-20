import { FURNITURE_MAP, type EquipmentEffects, type FurnitureDef } from "./furniture";
import type { Room } from "./engine";
import { houseLevel } from "./houseLevels";

export type EffectKey = keyof EquipmentEffects;
export const EFFECT_INFO: Record<EffectKey, { th: string; unit: string; good: boolean }> = {
  beds: { th: "ที่นอน", unit: "คน", good: true },
  seats: { th: "ที่นั่ง", unit: "คน", good: true },
  storage: { th: "จัดเก็บ / ลดความรก", unit: "แต้ม", good: true },
  privacy: { th: "ความเป็นส่วนตัว", unit: "แต้ม", good: true },
  soundproof: { th: "ลดเสียงรบกวน", unit: "แต้ม", good: true },
  cleaning: { th: "ช่วยทำความสะอาด", unit: "%/วัน", good: true },
  air: { th: "คุณภาพอากาศ", unit: "แต้ม", good: true },
  climate: { th: "ความสบายอุณหภูมิ", unit: "แต้ม", good: true },
  power: { th: "ใช้ไฟฟ้า", unit: "หน่วย", good: false },
  generation: { th: "ผลิต / ประหยัดไฟ", unit: "หน่วย", good: true },
  upkeep: { th: "ค่าดูแลอุปกรณ์", unit: "บาท/วัน", good: false },
  rent: { th: "มูลค่าเช่าเพิ่มต่อคน", unit: "บาท/วัน", good: true },
  recovery: { th: "ฟื้นพลังงาน", unit: "แต้ม", good: true },
  security: { th: "ความปลอดภัยร่วม", unit: "แต้ม", good: true },
};

const ORIGINAL_EFFECTS: Record<string, EquipmentEffects> = {
  bed: { beds: 1, recovery: 2 }, sofa: { seats: 2, recovery: 1 }, chair: { seats: 1 },
  desk: { storage: 1, privacy: 1 }, wardrobe: { storage: 4, privacy: 1 }, bookshelf: { storage: 3 },
  tv: { power: 3, soundproof: -1 }, pc: { power: 4, rent: 4 }, speaker: { power: 2, soundproof: -2 },
  piano: { soundproof: -2, rent: 4 }, plant: { air: 2 }, greenwall: { air: 4, upkeep: 2 },
  aquarium: { air: 1, power: 1, cleaning: -0.3 }, petbed: { cleaning: -1, upkeep: 2 },
  lamp: { power: 0.5 }, chandelier: { power: 1.5, rent: 8 }, rug: { soundproof: 1, cleaning: -0.2 },
  painting: { rent: 5 }, curtain: { privacy: 2, climate: 1 }, aircon: { power: 4, climate: 4, upkeep: 3 },
  purifier: { air: 4, cleaning: 0.5, power: 2 }, kitchen: { power: 3, cleaning: -0.6 },
  fridge: { power: 2, recovery: 1 }, bathtub: { recovery: 4, upkeep: 3 }, smartlock: { security: 3, power: 0.25 },
  cctv: { security: 3, power: 0.5 }, fireext: { security: 3 }, gym: { recovery: 3, soundproof: -1 },
  yoga: { recovery: 2 }, soundproof: { soundproof: 4, privacy: 1 }, robot: { cleaning: 2, power: 1, upkeep: 2 },
  clock: { rent: 2 }, gamingsetup: { power: 5, rent: 6, soundproof: -1 }, partylight: { power: 2, privacy: -1 },
  shelf: { storage: 3 }, diffuser: { recovery: 2, power: 0.5 }, washing: { cleaning: 1, power: 3, upkeep: 2 },
  coffee: { recovery: 2, power: 1, rent: 3 }, bike: { recovery: 3 }, easel: { rent: 4 },
  birdcage: { cleaning: -0.6 }, projector: { power: 3, rent: 6 }, safe: { security: 4 },
  massage: { recovery: 5, power: 3 }, hammock: { beds: 1, seats: 1, recovery: 2 }, telescope: { rent: 4 },
};

export function equipmentEffects(def: FurnitureDef, grade = 0): Required<EquipmentEffects> {
  const raw = def.effects ?? ORIGINAL_EFFECTS[def.id] ?? {};
  const out = {} as Required<EquipmentEffects>;
  for (const key of Object.keys(EFFECT_INFO) as EffectKey[]) {
    const scale = key === "beds" || key === "seats" ? 1 : key === "power" || key === "upkeep" ? 1 + grade * 0.15 : [1, 1.5, 2.15][grade] ?? 1;
    out[key] = Math.round((raw[key] ?? 0) * scale * 10) / 10;
  }
  return out;
}

export interface SystemIssue { id: string; text: string; loss: number }
export function roomSystems(room: Room, shared: EquipmentEffects = {}) {
  const stats = Object.fromEntries(Object.keys(EFFECT_INFO).map((key) => [key, 0])) as Required<EquipmentEffects>;
  for (const key of Object.keys(stats) as EffectKey[]) stats[key] = shared[key] ?? 0;
  for (const item of room.items) {
    const def = FURNITURE_MAP[item.defId]; if (!def) continue;
    const itemStats = equipmentEffects(def, item.grade);
    for (const key of Object.keys(stats) as EffectKey[]) stats[key] += itemStats[key];
  }
  const count = room.tenantIds.length;
  const level = houseLevel(room.level);
  const powerUse = Math.max(0, stats.power - stats.generation);
  const overload = Math.max(0, powerUse - level.power);
  const privacyNeed = Math.max(0, count - 1) * 3.5 + (count > 0 ? Math.max(0, room.level - 2) : 0);
  const shortPrivacy = Math.max(0, privacyNeed - stats.privacy);
  const issues: SystemIssue[] = [];
  const add = (id: string, text: string, loss: number) => { if (loss > 0) issues.push({ id, text, loss: Math.round(loss * 10) / 10 }); };
  if (count) {
    add("beds", `ที่นอน ${stats.beds}/${count} คน: เพิ่มเตียงหรือเตียงสองชั้น`, Math.min(20, Math.max(0, count - stats.beds) * 7));
    add("privacy", `พื้นที่ส่วนตัว ${stats.privacy.toFixed(1)}/${privacyNeed.toFixed(1)}: เพิ่มฉากกั้นหรือบูธส่วนตัว`, Math.min(14, shortPrivacy * 1.1));
    add("power", `ใช้ไฟ ${powerUse.toFixed(1)}/${level.power} หน่วย: เพิ่มโซลาร์หรือถอดเครื่องใช้บางชิ้น`, Math.min(16, overload * 1.8));
    if (count >= 3) {
      add("seats", `ที่นั่ง ${stats.seats}/${count} คน: เพิ่มโต๊ะอาหารหรือม้านั่ง`, Math.max(0, count - stats.seats) * 2.5);
      add("air", `อากาศ ${stats.air.toFixed(1)}/${count * 2}: เพิ่มเครื่องฟอกหรือต้นไม้`, Math.min(8, Math.max(0, count * 2 - stats.air) * 0.8));
      add("security", `ความปลอดภัย ${stats.security.toFixed(1)}/${count * 2}: เพิ่มระบบเตือนภัย`, Math.min(8, Math.max(0, count * 2 - stats.security) * 0.6));
    }
  }
  const penalty = Math.min(45, issues.reduce((sum, issue) => sum + issue.loss, 0));
  const noiseProtection = Math.min(0.65, Math.max(0, stats.soundproof) * 0.03 + Math.max(0, stats.privacy) * 0.01);
  const decay = Math.max(-0.5, 2.6 + room.items.length * 0.09 + count * 1.55 + Math.max(0, room.level - 2) * 0.65 - Math.min(10, stats.cleaning));
  const dailyCost = Math.round(level.upkeep + room.items.length * 4 + count * 32 + powerUse * 4.5 + stats.upkeep + overload * 9);
  return { ...stats, powerUse, powerCapacity: level.power, overload, privacyNeed, issues, penalty, noiseProtection, decay, dailyCost };
}