import type { EquipmentEffects } from "./furniture";
import type { TraitId } from "./traits";
import type { GameState } from "./engine";

export interface OutdoorDefinition {
  id: string;
  th: string;
  desc: string;
  cost: number;
  color: string;
  traits: Partial<Record<TraitId, number>>;
  effects: EquipmentEffects;
}
export interface OutdoorItem { uid: string; defId: string; district: number; slot: number; grade: number }
const entry = (id: string, th: string, cost: number, color: string, traits: OutdoorDefinition["traits"], effects: EquipmentEffects, desc: string): OutdoorDefinition => ({ id, th, cost, color, traits, effects, desc });

export const OUTDOOR_CATALOG: OutdoorDefinition[] = [
  entry("roseArch", "ซุ้มกุหลาบ", 980, "#d3a39f", { nature: 2, art: 2, luxury: 1 }, { privacy: 1, rent: 4, upkeep: 3 }, "ทางเข้าสวนที่ช่วยให้บ้านทั้งสามหลังดูน่าอยู่ขึ้น"),
  entry("cherryTree", "ต้นซากุระ", 1850, "#ddb4c0", { nature: 4, light: 1, spa: 1 }, { air: 3, climate: 1, upkeep: 5 }, "ร่มเงาและสีอ่อน ๆ ช่วยเติมธรรมชาติให้ส่วนกลาง"),
  entry("lavenderBed", "แปลงลาเวนเดอร์", 640, "#b9add5", { spa: 3, quiet: 2, nature: 1 }, { recovery: 1, air: 1, upkeep: 2 }, "กลิ่นสวนผ่อนคลายส่งผลกับผู้เช่าทั้งกลุ่มบ้าน"),
  entry("koiPond", "บ่อปลาคาร์ป", 2400, "#91bbb8", { pets: 3, nature: 3, luxury: 1 }, { recovery: 2, air: 1, upkeep: 8 }, "มุมชมปลาแสนสงบ มีค่าบำรุงรักษาน้ำทุกวัน"),
  entry("stoneLantern", "โคมหินญี่ปุ่น", 720, "#b6bca8", { vintage: 3, quiet: 1, light: 2 }, { security: 1, rent: 3, upkeep: 2 }, "เพิ่มแสงและกลิ่นอายคลาสสิกนอกเขตบ้าน"),
  entry("solarLamp", "เสาไฟพลังงานแสงอาทิตย์", 1250, "#9aab9e", { light: 3, safety: 2, tech: 1 }, { security: 2, generation: 1, upkeep: 2 }, "ให้แสงสว่างพร้อมลดภาระไฟของกลุ่มบ้าน"),
  entry("pergola", "ศาลาไม้เลื้อย", 2600, "#a6b48e", { comfort: 3, nature: 2, books: 1 }, { privacy: 2, climate: 2, upkeep: 5 }, "ศาลาพักผ่อนเพิ่มความเป็นส่วนตัวและความร่มรื่น"),
  entry("picnicTable", "โต๊ะปิกนิกส่วนกลาง", 850, "#c5a47f", { social: 3, cooking: 2, comfort: 1 }, { recovery: 1, rent: 4, upkeep: 3 }, "มุมแบ่งอาหารกัน ไม่ทดแทนที่นั่งส่วนตัวภายในบ้าน"),
  entry("gardenSwing", "ชิงช้าในสวน", 1350, "#c3b498", { comfort: 3, sleep: 2, spa: 1 }, { recovery: 2, upkeep: 4 }, "มุมพักสบายในสวน ช่วยเสริมบรรยากาศการพักผ่อน"),
  entry("sculpture", "ประติมากรรมกลางสวน", 3100, "#d7c9a8", { art: 4, luxury: 3, minimal: 1 }, { rent: 12, upkeep: 4 }, "ผลงานศิลปะที่เพิ่มรสนิยมและมูลค่าทุกบ้าน"),
  entry("windChimes", "ระฆังลม", 460, "#bca489", { music: 3, vintage: 2, quiet: -1 }, { recovery: 1, soundproof: -1, upkeep: 1 }, "เสียงเบา ๆ ที่สายดนตรีชอบ แต่คนรักความเงียบอาจไม่ถูกใจ"),
  entry("bambooHedge", "รั้วไผ่กันเสียง", 1180, "#a6b786", { quiet: 3, nature: 2, safety: 1 }, { soundproof: 2, privacy: 2, upkeep: 3 }, "ช่วยลดเสียงและแบ่งพื้นที่ส่วนกลางให้เป็นสัดส่วน"),
  entry("herbSpiral", "สวนสมุนไพรเกลียว", 780, "#bcb286", { cooking: 3, nature: 3, clean: 1 }, { air: 2, upkeep: 3 }, "สวนวัตถุดิบสดสำหรับบรรยากาศบ้านสายทำอาหาร"),
  entry("birdHouse", "บ้านนกบนเสา", 560, "#b69876", { pets: 3, nature: 2, quiet: -1 }, { recovery: 1, upkeep: 2 }, "ต้อนรับนกน้อยเข้าสวน เพิ่มธรรมชาติแต่มีเสียงบ้าง"),
  entry("butterflyGarden", "สวนผีเสื้อ", 970, "#d9b17c", { nature: 3, art: 2, light: 1 }, { air: 2, recovery: 1, upkeep: 3 }, "ดอกไม้หลากสีเป็นพื้นที่สีเขียวให้ทุกคน"),
  entry("drinkingFountain", "จุดน้ำดื่มส่วนกลาง", 1640, "#aac7c1", { clean: 3, fitness: 2, comfort: 1 }, { recovery: 2, cleaning: 0.2, upkeep: 5 }, "เพิ่มความสะดวกและการฟื้นพลังหลังออกกำลังกาย"),
  entry("recyclingStation", "สถานีแยกขยะ", 690, "#94b4a2", { clean: 3, nature: 2, minimal: 1 }, { cleaning: 0.6, air: 1, upkeep: 3 }, "ลดความสกปรกของบ้านในกลุ่มทุกวัน"),
  entry("parcelLocker", "ตู้รับพัสดุส่วนกลาง", 1580, "#a6b5ca", { tech: 3, safety: 2, gaming: 2 }, { security: 2, rent: 5, upkeep: 3 }, "รับของเป็นระเบียบและปลอดภัย แม้ไม่มีคนอยู่บ้าน"),
  entry("securityPost", "ป้อมดูแลหมู่บ้าน", 3600, "#afc0ad", { safety: 4, comfort: 2, quiet: 1 }, { security: 4, privacy: 1, upkeep: 15 }, "ดูแลความปลอดภัยให้ทั้งกลุ่มบ้าน มีค่าบริการรายวัน"),
  entry("solarCanopy", "หลังคาโซลาร์ลานพัก", 4900, "#809eaf", { tech: 4, nature: 3, luxury: 1 }, { generation: 3, climate: 1, rent: 6, upkeep: 8 }, "สวนที่ผลิตพลังงานและช่วยลดโหลดไฟของทุกบ้าน"),
];
export const OUTDOOR_MAP = Object.fromEntries(OUTDOOR_CATALOG.map((def) => [def.id, def])) as Record<string, OutdoorDefinition>;
export const COMMON_PLOTS = 12;
export const OUTDOOR_GRADE = ["เริ่มต้น", "ร่มรื่น", "สวนพรีเมียม"];
export const outdoorPrice = (def: OutdoorDefinition, grade: number) => Math.round(def.cost * [1, 2.3, 4.8][grade]);
export const outdoorUpgradePrice = (item: OutdoorItem) => item.grade >= 2 ? 0 : outdoorPrice(OUTDOOR_MAP[item.defId], item.grade + 1) - Math.round(outdoorPrice(OUTDOOR_MAP[item.defId], item.grade) * 0.4);

export function commonPlotPosition(slot: number) {
  return { x: [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5][slot % 6], y: -0.29, z: 13.5 + Math.floor(slot / 6) * 3.1 };
}

type SharedState = Pick<GameState, "outdoorItems">;
export function commonBenefits(state: SharedState | undefined, district: number) {
  const traits: Partial<Record<TraitId, number>> = {};
  const effects: EquipmentEffects = {};
  let upkeep = 0;
  let count = 0;
  for (const item of state?.outdoorItems ?? []) {
    if (item.district !== district) continue;
    const def = OUTDOOR_MAP[item.defId]; if (!def) continue;
    const factor = [1, 1.5, 2.2][item.grade] ?? 1;
    count++;
    for (const [key, value] of Object.entries(def.traits)) traits[key as TraitId] = (traits[key as TraitId] ?? 0) + value * factor;
    for (const [key, value] of Object.entries(def.effects)) {
      if (key === "upkeep") { upkeep += Math.round(value * (1 + item.grade * 0.25)); continue; }
      effects[key as keyof EquipmentEffects] = (effects[key as keyof EquipmentEffects] ?? 0) + value * factor;
    }
  }
  for (const key of Object.keys(traits) as TraitId[]) traits[key] = Math.round(Math.max(-8, Math.min(12, traits[key]!)) * 10) / 10;
  const caps: Partial<Record<keyof EquipmentEffects, number>> = { privacy: 4, soundproof: 6, air: 12, security: 8, generation: 8, cleaning: 2, climate: 4, recovery: 6, rent: 60 };
  for (const key of Object.keys(effects) as (keyof EquipmentEffects)[]) effects[key] = Math.round(Math.min(caps[key] ?? 10, effects[key]!) * 10) / 10;
  return { traits, effects, upkeep, count };
}
export function totalCommonsUpkeep(state: SharedState) {
  return [0, 1, 2, 3].reduce((sum, district) => sum + commonBenefits(state, district).upkeep, 0);
}

export function outdoorPlacementError(state: Pick<GameState, "rooms" | "outdoorItems">, defId: string, grade: number, district: number, slot: number, ignoreUid?: string) {
  if (!OUTDOOR_MAP[defId] || !Number.isInteger(grade) || grade < 0 || grade > 2) return "ไม่พบชนิดหรือเกรดของตกแต่ง";
  if (!Number.isInteger(district) || !state.rooms.some((r) => r.unlocked && Math.floor(r.id / 3) === district)) return "ต้องเปิดบ้านในกลุ่มนี้ก่อนตกแต่งส่วนกลาง";
  if (!Number.isInteger(slot) || slot < 0 || slot >= COMMON_PLOTS) return "ตำแหน่งอยู่นอกพื้นที่ส่วนกลาง";
  if (state.outdoorItems.some((item) => item.uid !== ignoreUid && item.district === district && item.slot === slot)) return "ตำแหน่งนี้มีของตกแต่งแล้ว ไม่สามารถวางทับได้";
  if (state.outdoorItems.some((item) => item.uid !== ignoreUid && item.district === district && item.defId === defId)) return "กลุ่มบ้านนี้มีของชนิดนี้แล้ว อัปเกรดชิ้นเดิมเพื่อเพิ่มสถานะได้";
  return null;
}