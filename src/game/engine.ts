import { FURNITURE_MAP, type PlaceType } from "./furniture";
import { TRAITS, affinityReason, conflictReason, type TraitId } from "./traits";
import type { Tenant } from "./tenants";
import { interactionFloor, LOFT_Y } from "./layout";
import { roomSystems } from "./equipment";
import { houseLevel, roomCapacity } from "./houseLevels";
import { commonBenefits, totalCommonsUpkeep, type OutdoorItem } from "./commons";
import { PROFILE_MAP } from "./residentProfiles";
import { isSpecial } from "./tenants";
export { MAX_HOUSE_LEVEL, HOUSE_LEVELS, houseLevel, roomCapacity } from "./houseLevels";
export { ROOM_W, LOFT_Y, roomDepth, floorSlotCount, wallSlotCount, loftSlotCount, isLoftSlot, isWallSlot, isFloorSlot, floorSlotPos, loftSlotPos, wallSlotPos, roomPosition } from "./layout";

export interface PlacedItem {
  uid: string;
  defId: string;
  grade: number; // 0,1,2
  /** <1000 = พื้นชั้นล่าง, 1000+ = ผนัง, 2000+ = พื้นชั้นลอย */
  slot: number;
}

export interface Room {
  id: number;
  col: number;
  floor: number;
  level: number; // 1..5
  unlocked: boolean;
  items: PlacedItem[];
  /** Capacity is determined by house level: 2, 2, 3, 3, 4. */
  tenantIds: string[];
  cleanliness: number;
}

export interface GameState {
  money: number;
  day: number;
  lifeMs: number;
  rooms: Room[];
  outdoorItems: OutdoorItem[];
  tenants: Record<string, Tenant>;
  applicants: Tenant[];
  selectedRoom: number | null;
  selectedSlot: { slot: number; place: PlaceType } | null;
  speed: number;
  totalEarned: number;
  history: number[];
  bestDay: number;
}

export const ROOMS_PER_FLOOR = 3;
export const MAX_ROOMS = 12;
export const MAX_TENANTS_PER_ROOM = 4;

/* ------------------------------ คะแนน / เงิน ------------------------------ */

export function roomTraitScores(room: Room, state?: Pick<GameState, "outdoorItems">): Partial<Record<TraitId, number>> {
  const out: Partial<Record<TraitId, number>> = {};
  const add = (t: TraitId, v: number) => (out[t] = (out[t] ?? 0) + v);
  for (const it of room.items) {
    const def = FURNITURE_MAP[it.defId];
    if (!def) continue;
    const mult = def.grades[it.grade].mult;
    for (const [t, v] of Object.entries(def.traits)) add(t as TraitId, (v as number) * mult);
  }
  if (room.level >= 2) {
    add("comfort", 1.5);
    add("clean", 1);
    add("light", 1);
  }
  if (room.level >= 3) {
    add("comfort", 2);
    add("luxury", 2.5);
    add("light", 1.5);
    add("quiet", 1);
  }
  // ชั้นลอย = มีพื้นที่ส่วนตัวมากขึ้น
  add("quiet", 0.8);
  add("comfort", 0.8);
  // Storage and house upgrades offset clutter without changing personal preferences.
  const shared = commonBenefits(state, Math.floor(room.id / 3));
  const equipment = roomSystems(room, shared.effects);
  const clutter = Math.max(0, room.items.length - (9 + (room.level - 1) * 3) - equipment.storage * 0.5);
  if (clutter > 0) add("minimal", -clutter * 1.4);
  add("clean", (room.cleanliness - 60) / 18);
  add("comfort", Math.min(4, equipment.climate * 0.35));
  add("clean", Math.min(3, equipment.air * 0.2));
  add("quiet", Math.min(5, Math.max(0, equipment.soundproof) * 0.3));
  for (const [trait, value] of Object.entries(shared.traits)) add(trait as TraitId, value);
  return out;
}

/** คะแนนแยกตามโซน (ล่าง / ลอย) — ใช้เช็คความชอบชั้น */
export function zoneTraitScores(room: Room): { down: Partial<Record<TraitId, number>>; up: Partial<Record<TraitId, number>> } {
  const down: Partial<Record<TraitId, number>> = {};
  const up: Partial<Record<TraitId, number>> = {};
  const add = (o: Partial<Record<TraitId, number>>, t: TraitId, v: number) => (o[t] = (o[t] ?? 0) + v);
  for (const it of room.items) {
    const def = FURNITURE_MAP[it.defId];
    if (!def) continue;
    const mult = def.grades[it.grade].mult;
    const target = interactionFloor(it.slot, room.level) >= LOFT_Y ? up : down;
    for (const [t, v] of Object.entries(def.traits)) add(target, t as TraitId, (v as number) * mult);
  }
  return { down, up };
}

export const NEED = 8.5;

/** ความหลากหลายของห้อง (0..1) — ยิ่งครอบคลุมหลายรสนิยมยิ่งดี */
export function roomDiversity(room: Room, state?: Pick<GameState, "outdoorItems">): { score: number; covered: number } {
  const scores = roomTraitScores(room, state);
  const covered = Object.values(scores).filter((v) => (v as number) >= 3).length;
  return { score: Math.min(1, covered / 8), covered };
}

export interface SocialNote {
  otherName: string;
  reason: string;
  good: boolean;
  /** roommate = รูมเมทห้องเดียวกัน (แรงกว่า), neighbor = ห้องข้าง ๆ */
  kind: "roommate" | "neighbor";
}

function pairNotes(a: Tenant, b: Tenant, kind: SocialNote["kind"]): SocialNote[] {
  const notes: SocialNote[] = [];
  for (const x of a.likes) {
    for (const y of b.likes) {
      const bad = conflictReason(x, y);
      if (bad) notes.push({ otherName: b.name, reason: bad, good: false, kind });
      const good = affinityReason(x, y);
      if (good) notes.push({ otherName: b.name, reason: good, good: true, kind });
    }
  }
  return notes;
}

/** โน้ตจากรูมเมทในห้องเดียวกัน */
export function roommateNotes(state: GameState, room: Room, tenant: Tenant): SocialNote[] {
  const notes: SocialNote[] = [];
  for (const tid of room.tenantIds) {
    if (tid === tenant.id) continue;
    const other = state.tenants[tid];
    if (!other) continue;
    notes.push(...pairNotes(tenant, other, "roommate"));
    // ชนชั้นที่ชอบ
    const floorLimit = Math.ceil(roomCapacity(room) / 2);
    const sameFloorCount = room.tenantIds.filter((id) => state.tenants[id]?.floorPref === tenant.floorPref).length;
    if (tenant.floorPref !== "any" && tenant.floorPref === other.floorPref && sameFloorCount > floorLimit) {
      notes.push({
        otherName: other.name,
        reason: `แย่งมุม${tenant.floorPref === "up" ? "ชั้นลอย" : "ชั้นล่าง"}กันทุกวัน`,
        good: false,
        kind: "roommate",
      });
    } else if (
      tenant.floorPref !== "any" &&
      other.floorPref !== "any" &&
      tenant.floorPref !== other.floorPref
    ) {
      notes.push({
        otherName: other.name,
        reason: "แบ่งชั้นกันอยู่ลงตัว ไม่กวนกันเลย",
        good: true,
        kind: "roommate",
      });
    }
  }
  const seen = new Set<string>();
  return notes.filter((n) => {
    const k = n.otherName + n.reason;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** โน้ตจากห้องข้างเคียง */
export function neighborNotes(state: GameState, room: Room, tenant: Tenant): SocialNote[] {
  const notes: SocialNote[] = [];
  for (const other of state.rooms) {
    if (!other.unlocked || other.id === room.id) continue;
    if (other.floor !== room.floor || Math.abs(other.col - room.col) !== 1) continue;
    for (const tid of other.tenantIds) {
      const ot = state.tenants[tid];
      if (!ot) continue;
      notes.push(...pairNotes(tenant, ot, "neighbor"));
    }
  }
  const seen = new Set<string>();
  return notes.filter((n) => {
    const k = n.otherName + n.reason;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export interface Evaluation {
  satisfaction: number;
  rent: number;
  baseRent: number;
  fills: { trait: TraitId; fill: number }[];
  dislikeHit: number;
  roommate: SocialNote[];
  neighbors: SocialNote[];
  socialMult: number;
  floorBonus: number;
  floorZone: "up" | "down";
  diversityBonus: number;
  missing: TraitId[];
  need: number;
  systemPenalty: number;
  specialPenalty: number;
  specialRequirements: { label: string; current: number; required: number; met: boolean }[];
  outdoorBonus: number;
}

/** ว่าผู้เช่าได้อยู่ชั้นไหน (จากความชอบ + ใครมาก่อน) */
export function tenantFloorZone(room: Room, tenant: Tenant, residents?: Record<string, Tenant>): "up" | "down" {
  let up = 0, down = 0;
  const limit = Math.ceil(roomCapacity(room) / 2);
  for (const id of room.tenantIds) {
    const current = id === tenant.id ? tenant : residents?.[id];
    const pref = current?.floorPref ?? "any";
    const chosen = pref === "up" ? (up < limit ? "up" : "down") : pref === "down" ? (down < limit ? "down" : "up") : up < down ? "up" : "down";
    if (id === tenant.id) return chosen;
    if (chosen === "up") up++; else down++;
  }
  return tenant.floorPref === "up" ? "up" : "down";
}

export function evaluate(state: GameState, room: Room, tenant: Tenant): Evaluation {
  const scores = roomTraitScores(room, state);
  const shared = commonBenefits(state, Math.floor(room.id / 3));
  const systems = roomSystems(room, shared.effects);
  const vip = isSpecial(tenant);
  const requirements = vip ? PROFILE_MAP[tenant.profileId!].requirements : undefined;
  const level = houseLevel(room.level);
  const need = Math.round((level.need + Math.max(0, room.tenantIds.length - 2) * 0.75) * (vip ? 1.8 : 1) * 10) / 10;
  const per = 62 / tenant.likes.length;
  let sat = 34 + (room.level - 1) * 3;
  const fills: { trait: TraitId; fill: number }[] = [];
  const missing: TraitId[] = [];
  for (const t of tenant.likes) {
    const fill = Math.max(0, Math.min(1.12, (scores[t] ?? 0) / need));
    fills.push({ trait: t, fill });
    sat += fill * per;
    if (fill < 0.72) missing.push(t);
  }
  const dislikeHit = Math.min(vip ? 24 : 14, Math.max(0, scores[tenant.dislike] ?? 0) * (vip ? 2.4 : 1.5));
  sat -= dislikeHit;
  sat += (room.cleanliness - 65) * 0.12;

  // รูมเมทมีผลแรงกว่าเพื่อนบ้านห้องข้าง ๆ
  const roommate = roommateNotes(state, room, tenant);
  const neighbors = neighborNotes(state, room, tenant);
  const rmBad = roommate.filter((n) => !n.good).length;
  const rmGood = roommate.filter((n) => n.good).length;
  const nbBad = neighbors.filter((n) => !n.good).length;
  const nbGood = neighbors.filter((n) => n.good).length;
  const socialLoss = (rmBad * 7 + nbBad * 4) * (1 - systems.noiseProtection);
  sat += Math.min(14, rmGood * 5 + nbGood * 3) - Math.min(32, socialLoss);
  sat -= systems.penalty;

  // โบนัสชั้นที่ชอบ: ของที่ชอบอยู่บนชั้นที่ตัวเองอยู่ไหม
  const zone = tenantFloorZone(room, tenant, state.tenants);
  const zones = zoneTraitScores(room);
  const myZone = zone === "up" ? zones.up : zones.down;
  let floorBonus = 0;
  if (tenant.floorPref !== "any") {
    const gotZone = tenant.floorPref === zone;
    if (gotZone) {
      floorBonus += 4;
      // ของที่ชอบอยู่บนชั้นตัวเองด้วยยิ่งดี
      let zoneFill = 0;
      for (const t of tenant.likes) zoneFill += Math.max(0, Math.min(1, (myZone[t] ?? 0) / need));
      zoneFill /= tenant.likes.length;
      floorBonus += Math.round(zoneFill * 5);
    } else {
      floorBonus -= 6;
    }
  }
  sat += floorBonus;

  // โบนัสความหลากหลาย
  const div = roomDiversity(room, state);
  const diversityBonus = Math.round(div.score * 6);
  sat += diversityBonus;

  const specialRequirements: Evaluation["specialRequirements"] = [];
  if (requirements) {
    const add = (label: string, current: number, required: number) => specialRequirements.push({ label, current, required, met: current >= required });
    add("ระดับบ้าน", room.level, requirements.level);
    add("ความสะอาด", Math.round(room.cleanliness), requirements.cleanliness);
    add("อุปกรณ์เกรดสูงสุด", room.items.filter((item) => item.grade === 2).length, requirements.premiumItems);
    add("ความเป็นส่วนตัว", Math.round(systems.privacy * 10) / 10, requirements.privacy);
    add(`สวนส่วนกลาง: ${TRAITS[requirements.outdoorTrait].th}`, shared.traits[requirements.outdoorTrait] ?? 0, requirements.outdoorScore);
  }
  const specialPenalty = Math.min(40, specialRequirements.filter((req) => !req.met).length * 7 + (vip ? 4 : 0));
  sat -= specialPenalty;

  sat = Math.max(0, Math.min(100, Math.round(sat)));

  const itemValue = room.items.reduce((s, it) => {
    const def = FURNITURE_MAP[it.defId];
    return def ? s + def.grades[it.grade].cost * 0.021 : s;
  }, 0);
  // Rent is per resident; shared housing has a lower base rate per person.
  const baseRent = (level.rent + itemValue + Math.min(160, systems.rent)) * 0.78;
  const socialMult = Math.max(
    0.45,
    1 + Math.min(0.3, rmGood * 0.06 + nbGood * 0.04) - (rmBad * 0.10 + nbBad * 0.06) * (1 - systems.noiseProtection),
  );
  const rent = Math.round(baseRent * tenant.budget * (0.5 + (sat / 100) * 0.85) * socialMult);
  return {
    satisfaction: sat,
    rent,
    baseRent: Math.round(baseRent),
    fills,
    dislikeHit,
    roommate,
    neighbors,
    socialMult,
    floorBonus,
    floorZone: zone,
    diversityBonus,
    missing,
    need,
    systemPenalty: systems.penalty,
    specialPenalty,
    specialRequirements,
    outdoorBonus: tenant.likes.reduce((sum, trait) => sum + Math.max(0, shared.traits[trait] ?? 0), 0),
  };
}

/** ประเมินผู้สมัคร "ถ้า" เข้ามาอยู่ห้องนี้ (รวมผลรูมเมทที่จะเจอ) */
export function previewJoin(state: GameState, room: Room, applicant: Tenant): Evaluation & { compat: SocialNote[] } {
  const fake: GameState = {
    ...state,
    rooms: state.rooms.map((r) => (r.id === room.id ? { ...r, tenantIds: [...r.tenantIds, applicant.id] } : r)),
    tenants: { ...state.tenants, [applicant.id]: { ...applicant, roomId: room.id } },
  };
  const ev = evaluate(fake, fake.rooms[room.id], fake.tenants[applicant.id]);
  return { ...ev, compat: ev.roommate };
}

/** ค่าเช่ารวมของห้อง */
export function roomRent(state: GameState, room: Room): number {
  let sum = 0;
  for (const tid of room.tenantIds) {
    const t = state.tenants[tid];
    if (t) sum += evaluate(state, room, t).rent;
  }
  return sum;
}

export function roomTenants(state: GameState, room: Room): Tenant[] {
  return room.tenantIds.map((id) => state.tenants[id]).filter(Boolean);
}

export function unlockCost(unlockedCount: number) {
  return Math.round(4800 * Math.pow(1.62, unlockedCount - 2));
}

export function upgradeCost(level: number) {
  return houseLevel(level).upgrade;
}

export const CLEAN_COST = 320;

export function dailyUpkeep(state: GameState) {
  let sum = totalCommonsUpkeep(state);
  for (const r of state.rooms) {
    if (!r.unlocked) continue;
    sum += roomSystems(r, commonBenefits(state, Math.floor(r.id / 3)).effects).dailyCost;
  }
  return Math.round(sum);
}

export function sellValue(defId: string, grade: number) {
  const def = FURNITURE_MAP[defId];
  if (!def) return 0;
  return Math.round(def.grades[grade].cost * 0.45);
}

export function reputation(state: GameState) {
  const ts = Object.values(state.tenants).filter((t) => t.roomId !== null);
  if (!ts.length) return 3;
  const avg = ts.reduce((s, t) => s + t.satisfaction, 0) / ts.length;
  return Math.max(1, Math.min(5, Math.round((avg / 20) * 10) / 10));
}
