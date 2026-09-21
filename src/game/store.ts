import { FURNITURE_MAP, type PlaceType } from "./furniture";
import { ACTIVITY_INFO, activityLine, habitsFor } from "./activities";
import { chooseBehavior, skipBlockedBehavior } from "./life";
import { encodeSlot, placementError, slotZone, zoneCapacity, type Point3 } from "./layout";
import { navigationFor } from "./navigation";
import { validatePlacement } from "./placement";
import { roomSystems } from "./equipment";
import { COMMON_PLOTS, OUTDOOR_MAP, commonBenefits, outdoorPlacementError, outdoorPrice, outdoorUpgradePrice, type OutdoorItem } from "./commons";
import { NEW_RESIDENTS, PROFILE_MAP, SPECIAL_RESIDENTS } from "./residentProfiles";
import {
  CLEAN_COST,
  dailyUpkeep,
  evaluate,
  floorSlotCount,
  loftSlotCount,
  MAX_ROOMS,
  MAX_HOUSE_LEVEL,
  roomCapacity,
  ROOMS_PER_FLOOR,
  sellValue,
  unlockCost,
  upgradeCost,
  wallSlotCount,
  type GameState,
  type PlacedItem,
  type Room,
} from "./engine";
import {
  createBehavior,
  dislikeLine,
  floorClashLine,
  floorLine,
  idleLine,
  makeTenant,
  isSpecial,
  moodLine,
  moodOf,
  roommateLine,
  wishLine,
  type MoodKey,
  type ActivityId,
  type Tenant,
} from "./tenants";

export interface Bubble {
  text: string;
  mood: MoodKey;
  at: number;
}
export interface Toast {
  id: number;
  text: string;
  kind: "good" | "bad" | "info";
}

export interface FullState extends GameState {
  bubbles: Record<string, Bubble>;
  thoughts: Record<string, Bubble & { day: number }>;
  toasts: Toast[];
  intro: boolean;
}

export type Action =
  | { type: "tick" }
  | { type: "advanceLife"; elapsed: number }
  | { type: "arriveActivity"; tenantId: string; serial: number }
  | { type: "blockedActivity"; tenantId: string; serial: number }
  | { type: "skipActivity"; tenantId: string }
  | { type: "setActivity"; tenantId: string; activity: ActivityId }
  | { type: "chatter" }
  | { type: "selectRoom"; id: number | null }
  | { type: "selectSlot"; slot: number; place: PlaceType }
  | { type: "clearSlot" }
  | { type: "buyItem"; roomId: number; slot: number; zone: PlaceType; defId: string; grade: number; actors?: Point3[]; auto?: boolean }
  | { type: "upgradeItem"; roomId: number; uid: string; actors?: Point3[] }
  | { type: "sellItem"; roomId: number; uid: string }
  | { type: "moveItem"; roomId: number; uid: string; zone: PlaceType; slot: number; actors?: Point3[] }
  | { type: "assign"; roomId: number; tenantId: string }
  | { type: "evict"; roomId: number; tenantId: string }
  | { type: "unlockRoom"; roomId: number }
  | { type: "upgradeRoom"; roomId: number }
  | { type: "cleanRoom"; roomId: number }
  | { type: "refreshApplicants" }
  | { type: "inviteProfile"; profileId: string }
  | { type: "declineApplicant"; tenantId: string }
  | { type: "buyOutdoor"; district: number; slot: number; defId: string; grade: number }
  | { type: "upgradeOutdoor"; uid: string }
  | { type: "sellOutdoor"; uid: string }
  | { type: "moveOutdoor"; uid: string; slot: number }
  | { type: "setSpeed"; speed: number }
  | { type: "closeIntro" }
  | { type: "dismissToast"; id: number }
  | { type: "reset" };

let toastId = 1;

function makeRoom(id: number): Room {
  return {
    id,
    col: id % ROOMS_PER_FLOOR,
    floor: Math.floor(id / ROOMS_PER_FLOOR),
    level: 1,
    unlocked: id < 3,
    items: [],
    tenantIds: [],
    cleanliness: 92,
  };
}

export function initialState(): FullState {
  const applicants = [makeTenant({ profileId: NEW_RESIDENTS[0].id }), makeTenant({ profileId: NEW_RESIDENTS[1].id }), makeTenant({ profileId: SPECIAL_RESIDENTS[0].id }), makeTenant({ group: "classic" })];
  const rooms = Array.from({ length: MAX_ROOMS }, (_, i) => makeRoom(i));
  // A furnished starter room makes the simulation visible immediately. Saved games keep their own rooms.
  const first = makeTenant({ group: "classic" });
  first.name = "มะลิ";
  first.look = { skin: "#f7c9a3", hair: "#624434", shirt: "#e5b99b", pants: "#719386", hairStyle: 2, accessory: 4 };
  first.likes = ["books", "quiet"]; first.dislike = "social"; first.floorPref = "up";
  first.habits = ["journal", "meditate", "inspectLoft"];
  first.roomId = 0; first.satisfaction = 88;
  first.behavior = createBehavior("inspectLoft");
  const second = makeTenant({ group: "classic" });
  second.name = "ต้น";
  second.look = { skin: "#ffdcc0", hair: "#3e3432", shirt: "#a7bd9e", pants: "#7e91a9", hairStyle: 0, accessory: 1 };
  second.likes = ["comfort", "nature"]; second.dislike = "music"; second.floorPref = "down";
  second.habits = ["freshAir", "birdwatch", "makeTea"];
  second.roomId = 0; second.satisfaction = 88;
  second.behavior = createBehavior("freshAir");
  rooms[0].tenantIds = [first.id, second.id];
  rooms[0].items = [
    { uid: "starter-bed", defId: "bed", grade: 1, slot: 2000 },
    { uid: "starter-desk", defId: "desk", grade: 0, slot: 2001 },
    { uid: "starter-books", defId: "bookshelf", grade: 1, slot: 0 },
    { uid: "starter-plant", defId: "plant", grade: 1, slot: 1 },
    { uid: "starter-robot", defId: "robot", grade: 1, slot: 2 },
    { uid: "starter-sofa", defId: "sofa", grade: 1, slot: 3 },
    { uid: "starter-lamp", defId: "lamp", grade: 1, slot: 4 },
    { uid: "starter-panel", defId: "soundproof", grade: 1, slot: 1000 },
    { uid: "starter-bed-2", defId: "bed", grade: 0, slot: 5 },
  ];
  rooms[1].items = [
    { uid: "garden-daybed", defId: "dayBed", grade: 0, slot: 2000 },
    { uid: "garden-art", defId: "painting", grade: 1, slot: 1001 },
    { uid: "garden-coffee", defId: "coffee", grade: 0, slot: 3 },
    { uid: "garden-kettle", defId: "electricKettle", grade: 0, slot: 5000 },
    { uid: "garden-herbs", defId: "herbPlanter", grade: 0, slot: 3000 },
  ];
  rooms[2].items = [
    { uid: "studio-seat", defId: "beanbag", grade: 1, slot: 3 },
    { uid: "studio-books", defId: "bookshelf", grade: 0, slot: 0 },
    { uid: "studio-plant", defId: "plant", grade: 1, slot: 2002 },
    { uid: "studio-aid", defId: "firstAidCabinet", grade: 0, slot: 1000 },
    { uid: "studio-herbs", defId: "herbPlanter", grade: 1, slot: 3001 },
  ];
  return {
    money: 12000,
    day: 1,
    lifeMs: 0,
    rooms,
    outdoorItems: [],
    tenants: { [first.id]: first, [second.id]: second },
    applicants,
    selectedRoom: 0,
    selectedSlot: null,
    speed: 1,
    totalEarned: 0,
    history: [],
    bestDay: 0,
    bubbles: {},
    thoughts: {
      [first.id]: { text: "กำลังจะขึ้นไปดูมุมอ่านหนังสือบนชั้นสอง", mood: "content", at: Date.now(), day: 1 },
      [second.id]: { text: "ขอออกไปรับลมหน้าบ้านก่อนนะ", mood: "content", at: Date.now(), day: 1 },
    },
    toasts: [],
    intro: false,
  };
}

const pushToast = (s: FullState, text: string, kind: Toast["kind"] = "info") => {
  s.toasts = [...s.toasts.slice(-3), { id: toastId++, text, kind }];
};

const clone = (s: FullState): FullState => ({
  ...s,
  rooms: s.rooms.map((r) => ({ ...r, items: r.items.map((i) => ({ ...i })), tenantIds: [...r.tenantIds] })),
  tenants: Object.fromEntries(Object.entries(s.tenants).map(([k, v]) => [k, { ...v, behavior: v.behavior ? { ...v.behavior, failedActivities: [...(v.behavior.failedActivities ?? [])] } : createBehavior() }])),
  applicants: s.applicants.map((a) => ({ ...a, behavior: a.behavior ? { ...a.behavior } : createBehavior() })),
  bubbles: { ...s.bubbles },
  thoughts: { ...s.thoughts },
  outdoorItems: s.outdoorItems.map((item) => ({ ...item })),
  toasts: [...s.toasts],
});

function freshApplicant(s: FullState): Tenant {
  const exclude = [...Object.values(s.tenants), ...s.applicants].map((t) => t.profileId).filter((id): id is string => !!id);
  return makeTenant({ exclude });
}

function skipTenant(s: FullState, tenant: Tenant, reason: string) {
  const room = tenant.roomId === null ? null : s.rooms[tenant.roomId];
  if (!room) return;
  const previous = tenant.behavior.activity;
  tenant.behavior = skipBlockedBehavior(s, room, tenant);
  s.bubbles[tenant.id] = { text: `${reason} เปลี่ยนจาก${ACTIVITY_INFO[previous].th}ไป${ACTIVITY_INFO[tenant.behavior.activity].th}ก่อนนะ`, mood: "content", at: Date.now() };
}

function reduceGame(state: FullState, action: Action): FullState {
  switch (action.type) {
    case "tick":
      if (state.speed === 0 || state.intro) return state;
      return tick(state);

    case "advanceLife": {
      if (state.speed === 0 || state.intro || !Number.isFinite(action.elapsed)) return state;
      const elapsed = Math.max(0, Math.min(1000, action.elapsed)) * state.speed;
      const s = clone(state);
      s.lifeMs += elapsed;
      for (const room of s.rooms) for (const tid of room.tenantIds) {
        const tenant = s.tenants[tid];
        if (!tenant) continue;
        const behavior = tenant.behavior;
        if (behavior.phase === "active") {
          behavior.remainingMs = Math.max(0, behavior.remainingMs - elapsed);
          const recovery = roomSystems(room, commonBenefits(s, Math.floor(room.id / 3)).effects).recovery;
          const resting = ["sleeping", "relaxing", "meditate", "makeTea"].includes(behavior.activity);
          const rate = behavior.activity === "sleeping" ? 0.3 + Math.min(0.18, recovery * 0.008) : resting ? 0.04 + Math.min(0.1, recovery * 0.005) : -0.065;
          tenant.energy = Math.max(0, Math.min(100, tenant.energy + elapsed / 1000 * rate));
        } else behavior.travelMs += elapsed;
        const deletedTarget = behavior.targetUid && !room.items.some((i) => i.uid === behavior.targetUid);
        if (deletedTarget || (behavior.phase === "walking" && behavior.travelMs > 45000)) {
          skipTenant(s, tenant, deletedTarget ? "ของที่กำลังจะใช้ถูกย้ายออกแล้ว" : "ใช้เวลาเดินนานเกินไป");
        } else if (behavior.remainingMs <= 0) {
          if (["cleaning", "dustShelf", "foldLaundry"].includes(behavior.activity)) room.cleanliness = Math.min(100, room.cleanliness + 4);
          tenant.behavior = chooseBehavior(s, room, tenant)!;
        }
      }
      return s;
    }
    case "arriveActivity": {
      const original = state.tenants[action.tenantId];
      if (!original || original.behavior.serial !== action.serial || original.behavior.phase === "active") return state;
      const s = clone(state);
      const tenant = s.tenants[action.tenantId];
      tenant.behavior.phase = "active";
      tenant.behavior.startedAt = s.lifeMs;
      tenant.behavior.endsAt = s.lifeMs + tenant.behavior.remainingMs;
      tenant.behavior.travelMs = 0;
      tenant.behavior.failedActivities = [];
      tenant.behavior.failures = 0;
      s.bubbles[tenant.id] = { text: activityLine(tenant.behavior.activity, tenant.satisfaction, action.serial), mood: moodOf(tenant.satisfaction), at: Date.now() };
      return s;
    }
    case "blockedActivity": {
      const original = state.tenants[action.tenantId];
      if (!original || original.behavior.serial !== action.serial) return state;
      const s = clone(state);
      const tenant = s.tenants[action.tenantId];
      skipTenant(s, tenant, "ทางไปกิจกรรมนี้ไม่พร้อม");
      return s;
    }
    case "skipActivity": {
      if (!state.tenants[action.tenantId]) return state;
      const s = clone(state);
      skipTenant(s, s.tenants[action.tenantId], "ลองทำอย่างอื่นบ้าง");
      return s;
    }
    case "setActivity": {
      const original = state.tenants[action.tenantId];
      if (!original || original.roomId === null || !ACTIVITY_INFO[action.activity]) return state;
      const s = clone(state);
      const tenant = s.tenants[action.tenantId];
      const behavior = chooseBehavior(s, s.rooms[tenant.roomId!], tenant, action.activity);
      if (!behavior) { pushToast(s, "ต้องมีเฟอร์นิเจอร์ที่เข้าถึงได้และยังไม่มีใครใช้อยู่", "bad"); return s; }
      tenant.behavior = behavior;
      return s;
    }

    case "chatter": {
      const s = clone(state);
      for (const room of s.rooms) if (room.unlocked) for (const id of room.tenantIds) {
        const tenant = s.tenants[id]; if (!tenant) continue;
        s.bubbles[id] = { text: speakLine(s, room, tenant), mood: moodOf(tenant.satisfaction), at: Date.now() };
      }
      return s;
    }

    case "selectRoom": {
      const s = clone(state);
      s.selectedRoom = action.id;
      s.selectedSlot = null;
      return s;
    }
    case "selectSlot": {
      const s = clone(state);
      s.selectedSlot = { slot: action.slot, place: action.place };
      return s;
    }
    case "clearSlot": {
      const s = clone(state);
      s.selectedSlot = null;
      return s;
    }
    case "buyItem": {
      const def = FURNITURE_MAP[action.defId];
      const s = clone(state);
      const room = s.rooms[action.roomId];
      let candidateSlot = action.slot;
      let error = validatePlacement(room, action.defId, action.grade, action.zone, candidateSlot, undefined, action.actors);
      if (error && action.auto && room?.unlocked && def?.grades[action.grade]) {
        for (let slot = 0; slot < zoneCapacity(room.level, action.zone); slot++) {
          if (slot === candidateSlot || placementError(room, action.defId, action.grade, action.zone, slot, undefined, action.actors)) continue;
          const candidateError = validatePlacement(room, action.defId, action.grade, action.zone, slot, undefined, action.actors);
          if (!candidateError) { candidateSlot = slot; error = null; break; }
        }
      }
      if (error) { pushToast(s, error, "bad"); return s; }
      const cost = def.grades[action.grade].cost;
      if (state.money < cost) { pushToast(s, "เงินไม่พอสำหรับเฟอร์นิเจอร์ชิ้นนี้", "bad"); return s; }
      const slot = encodeSlot(action.zone, candidateSlot);
      s.money -= cost;
      const item: PlacedItem = {
        uid: `i_${Math.random().toString(36).slice(2, 9)}`,
        defId: def.id,
        grade: action.grade,
        slot,
      };
      room.items = [...room.items, item];
      room.cleanliness = Math.min(100, room.cleanliness + 2);
      // Keep the build catalogue open, but return placement to automatic selection after every purchase.
      s.selectedSlot = null;
      for (const tid of room.tenantIds) {
        const t = s.tenants[tid];
        if (!t) continue;
        const likes = t.likes.some((l) => (def.traits[l] ?? 0) > 0);
        const hates = (def.traits[t.dislike] ?? 0) > 0;
        s.bubbles[t.id] = {
          text: hates
            ? `เอ๋ ${def.th}เนี่ยนะ... ไม่ชอบเลยอ่ะ ${def.emoji}`
            : likes
              ? `ว้าว! ${def.th}${def.emoji} ชอบมาก ๆ เลย`
              : `อืม ${def.th}สินะ... ขอบคุณนะ`,
          mood: hates ? "meh" : likes ? "happy" : "content",
          at: Date.now(),
        };
      }
      pushToast(s, `ติดตั้ง ${def.emoji} ${def.grades[action.grade].th}`, "good");
      return s;
    }
    case "upgradeItem": {
      const s = clone(state);
      const room = s.rooms[action.roomId];
      const item = room?.items.find((i) => i.uid === action.uid);
      if (!item) return state;
      const def = FURNITURE_MAP[item.defId];
      if (!def || item.grade >= 2) return state;
      const error = validatePlacement(room, item.defId, item.grade + 1, slotZone(item.slot), item.slot % 1000, item.uid, action.actors);
      if (error) { pushToast(s, error, "bad"); return s; }
      const cost = def.grades[item.grade + 1].cost - Math.round(def.grades[item.grade].cost * 0.4);
      if (s.money < cost) return state;
      s.money -= cost;
      item.grade += 1;
      for (const tid of room.tenantIds) {
        const t = s.tenants[tid];
        if (t)
          s.bubbles[t.id] = {
            text: `อัปเกรด${def.th}แล้ว! ดีขึ้นเยอะเลย ${def.emoji}`,
            mood: "happy",
            at: Date.now(),
          };
      }
      pushToast(s, `อัปเกรดเป็น ${def.grades[item.grade].th}`, "good");
      return s;
    }
    case "sellItem": {
      const s = clone(state);
      const room = s.rooms[action.roomId];
      const item = room.items.find((i) => i.uid === action.uid);
      if (!item) return state;
      const v = sellValue(item.defId, item.grade);
      s.money += v;
      room.items = room.items.filter((i) => i.uid !== action.uid);
      s.selectedSlot = null;
      pushToast(s, `ขายออก +฿${v.toLocaleString()}`, "info");
      return s;
    }
    case "moveItem": {
      const room = state.rooms[action.roomId];
      const original = room?.items.find((item) => item.uid === action.uid);
      if (!original) return state;
      const error = validatePlacement(room, original.defId, original.grade, action.zone, action.slot, original.uid, action.actors);
      const s = clone(state);
      if (error) { pushToast(s, error, "bad"); return s; }
      const item = s.rooms[action.roomId].items.find((entry) => entry.uid === action.uid)!;
      item.slot = encodeSlot(action.zone, action.slot);
      s.selectedSlot = null;
      pushToast(s, "ย้ายอุปกรณ์แล้ว โดยไม่มีค่าใช้จ่าย", "good");
      return s;
    }
    case "assign": {
      const s = clone(state);
      const room = s.rooms[action.roomId];
      if (!room?.unlocked || room.tenantIds.length >= roomCapacity(room)) {
        if (room?.unlocked) pushToast(s, `บ้านระดับ ${room.level} รับได้ ${roomCapacity(room)} คน ต้องอัปเกรดก่อน`, "bad");
        return s;
      }
      const idx = s.applicants.findIndex((a) => a.id === action.tenantId);
      if (idx < 0) return state;
      const tenant = s.applicants[idx];
      if (tenant.profileId && Object.values(s.tenants).some((t) => t.profileId === tenant.profileId)) { pushToast(s, "ผู้เช่าคนนี้อยู่ในหมู่บ้านแล้ว", "bad"); return s; }
      s.applicants = s.applicants.filter((_, i) => i !== idx);
      tenant.roomId = room.id;
      tenant.daysStayed = 0;
      room.tenantIds = [...room.tenantIds, tenant.id];
      s.tenants[tenant.id] = tenant;
      const ev = evaluate(s, room, tenant);
      tenant.satisfaction = ev.satisfaction;
      const mate = room.tenantIds.length > 1;
      tenant.behavior = chooseBehavior(s, room, tenant)!;
      s.bubbles[tenant.id] = {
        text: mate ? `สวัสดีรูมเมท! ฝากตัวด้วยนะ ${tenant.emoji}` : `สวัสดีค่ะ! ฝากตัวด้วยนะ ${tenant.emoji}`,
        mood: "content",
        at: Date.now(),
      };
      pushToast(s, `${tenant.name} ย้ายเข้าบ้าน ${action.roomId + 1} แล้ว (${room.tenantIds.length}/${roomCapacity(room)})`, "good");
      if (s.applicants.length < 4) s.applicants.push(freshApplicant(s));
      return s;
    }
    case "evict": {
      const s = clone(state);
      const room = s.rooms[action.roomId];
      if (!room.tenantIds.includes(action.tenantId)) return state;
      const t = s.tenants[action.tenantId];
      delete s.tenants[action.tenantId];
      room.tenantIds = room.tenantIds.filter((id) => id !== action.tenantId);
      pushToast(s, `${t?.name ?? "ผู้เช่า"} ย้ายออกจากห้อง ${room.id + 1} แล้ว`, "bad");
      return s;
    }
    case "unlockRoom": {
      const s = clone(state);
      const unlockedCount = s.rooms.filter((r) => r.unlocked).length;
      const cost = unlockCost(unlockedCount);
      const room = s.rooms[action.roomId];
      if (!room || room.unlocked || s.money < cost || room.id !== s.rooms.find((r) => !r.unlocked)?.id) return state;
      s.money -= cost;
      room.unlocked = true;
      s.selectedRoom = room.id;
      pushToast(s, `เปิดห้องใหม่! ห้อง ${room.id + 1} พร้อมให้เช่า 🎉`, "good");
      return s;
    }
    case "upgradeRoom": {
      const s = clone(state);
      const room = s.rooms[action.roomId];
      if (!room?.unlocked || room.level >= MAX_HOUSE_LEVEL) return state;
      const cost = upgradeCost(room.level);
      if (s.money < cost) return state;
      s.money -= cost;
      room.level += 1;
      s.selectedSlot = null;
      room.cleanliness = Math.min(100, room.cleanliness + 10);
      for (const tid of room.tenantIds) {
        const t = s.tenants[tid];
        if (t) s.bubbles[t.id] = { text: "ห้องกว้างขึ้นเยอะเลย! ขอบคุณนะ 🥰", mood: "happy", at: Date.now() };
      }
      pushToast(s, `บ้าน ${room.id + 1} ระดับ ${room.level} รับผู้เช่าได้ ${roomCapacity(room)} คน`, "good");
      return s;
    }
    case "cleanRoom": {
      const s = clone(state);
      const room = s.rooms[action.roomId];
      if (!room?.unlocked) return state;
      if (room.cleanliness >= 100) { pushToast(s, "บ้านสะอาดเต็ม 100% แล้ว", "info"); return s; }
      if (s.money < CLEAN_COST) { pushToast(s, `ต้องใช้ ${CLEAN_COST} บาทเพื่อทำความสะอาดบ้าน`, "bad"); return s; }
      s.money -= CLEAN_COST;
      room.cleanliness = 100;
      for (const tid of room.tenantIds) {
        const t = s.tenants[tid];
        if (t) s.bubbles[t.id] = { text: "ห้องหอมสะอาดเลย! ✨", mood: "happy", at: Date.now() };
      }
      pushToast(s, "ทำความสะอาดห้องเรียบร้อย ✨", "good");
      return s;
    }
    case "refreshApplicants": {
      if (state.money < 250) return state;
      const s = clone(state);
      s.money -= 250;
      s.applicants = s.applicants.filter(isSpecial);
      while (s.applicants.length < 4) s.applicants.push(freshApplicant(s));
      pushToast(s, "ลงประกาศใหม่ มีผู้สนใจเข้ามาแล้ว", "info");
      return s;
    }
    case "inviteProfile": {
      const profile = PROFILE_MAP[action.profileId]; if (!profile) return state;
      const s = clone(state);
      if ([...Object.values(s.tenants), ...s.applicants].some((t) => t.profileId === profile.id)) { pushToast(s, "คนนี้เป็นผู้สมัครหรืออยู่ในหมู่บ้านแล้ว", "info"); return s; }
      if (s.applicants.length >= 8) { pushToast(s, "ผู้สมัครเต็ม 8 คน รับผู้เช่าหรือประกาศใหม่ก่อน", "bad"); return s; }
      const fee = profile.special ? 800 : 250;
      if (s.money < fee) { pushToast(s, "เงินไม่พอสำหรับส่งคำเชิญ", "bad"); return s; }
      s.money -= fee;
      s.applicants.push(makeTenant({ profileId: profile.id }));
      pushToast(s, `${profile.name} ตอบรับคำเชิญแล้ว ดูในรายชื่อผู้สมัคร`, "good");
      return s;
    }
    case "declineApplicant": {
      if (!state.applicants.some((tenant) => tenant.id === action.tenantId)) return state;
      const s = clone(state);
      s.applicants = s.applicants.filter((tenant) => tenant.id !== action.tenantId);
      pushToast(s, "นำผู้สมัครออกแล้ว สามารถเชิญคนใหม่ได้", "info");
      return s;
    }
    case "buyOutdoor": {
      const s = clone(state);
      const error = outdoorPlacementError(s, action.defId, action.grade, action.district, action.slot);
      if (error) { pushToast(s, error, "bad"); return s; }
      const cost = outdoorPrice(OUTDOOR_MAP[action.defId], action.grade);
      if (s.money < cost) { pushToast(s, "เงินไม่พอตกแต่งส่วนกลาง", "bad"); return s; }
      s.money -= cost;
      s.outdoorItems.push({ uid: `o_${Math.random().toString(36).slice(2, 10)}`, defId: action.defId, grade: action.grade, district: action.district, slot: action.slot });
      pushToast(s, `ติดตั้ง${OUTDOOR_MAP[action.defId].th}แล้ว โบนัสส่งถึงบ้านทั้ง 3 หลัง`, "good");
      return s;
    }
    case "upgradeOutdoor": {
      const s = clone(state), item = s.outdoorItems.find((i) => i.uid === action.uid);
      if (!item || item.grade >= 2) return state;
      const cost = outdoorUpgradePrice(item);
      if (s.money < cost) { pushToast(s, "เงินไม่พออัปเกรด", "bad"); return s; }
      s.money -= cost; item.grade++;
      pushToast(s, "อัปเกรดสวนส่วนกลางแล้ว", "good");
      return s;
    }
    case "sellOutdoor": {
      const s = clone(state), item = s.outdoorItems.find((i) => i.uid === action.uid);
      if (!item) return state;
      const value = Math.round(outdoorPrice(OUTDOOR_MAP[item.defId], item.grade) * 0.45);
      s.money += value; s.outdoorItems = s.outdoorItems.filter((i) => i.uid !== item.uid);
      pushToast(s, `ขายของตกแต่งส่วนกลาง +฿${value.toLocaleString("th-TH")}`, "info");
      return s;
    }
    case "moveOutdoor": {
      const s = clone(state), item = s.outdoorItems.find((i) => i.uid === action.uid);
      if (!item) return state;
      const error = outdoorPlacementError(s, item.defId, item.grade, item.district, action.slot, item.uid);
      if (error) { pushToast(s, error, "bad"); return s; }
      item.slot = action.slot; pushToast(s, "ย้ายของตกแต่งส่วนกลางแล้ว", "good"); return s;
    }
    case "setSpeed": {
      if (![0, 1, 2, 4].includes(action.speed)) return state;
      const s = clone(state);
      s.speed = action.speed;
      return s;
    }
    case "closeIntro": {
      const s = clone(state);
      s.intro = false;
      return s;
    }
    case "dismissToast": {
      const s = clone(state);
      s.toasts = s.toasts.filter((t) => t.id !== action.id);
      return s;
    }
    case "reset":
      return initialState();
    default:
      return state;
  }
}

export function reducer(state: FullState, action: Action): FullState {
  const next = reduceGame(state, action);
  if (next === state) return state;
  const thoughts = { ...next.thoughts };
  for (const [id, bubble] of Object.entries(next.bubbles)) {
    if (next.tenants[id] && bubble !== state.bubbles[id]) thoughts[id] = { ...bubble, day: next.day };
  }
  for (const id of Object.keys(thoughts)) if (!next.tenants[id]) delete thoughts[id];
  return { ...next, thoughts };
}

/** เลือกประโยคที่ผู้เช่าจะพูดตามสถานการณ์จริงในห้อง */
function speakLine(s: FullState, room: Room, tenant: Tenant): string {
  const ev = evaluate(s, room, tenant);
  const mood = moodOf(tenant.satisfaction);
  const r = Math.random();
  const issue = roomSystems(room, commonBenefits(s, Math.floor(room.id / 3)).effects).issues;
  if (isSpecial(tenant)) {
    const missing = ev.specialRequirements.filter((requirement) => !requirement.met);
    if (missing.length && r < 0.6) {
      const requirement = missing[Math.floor(Math.random() * missing.length)];
      return `${tenant.name}: ${requirement.label}ยังได้ ${requirement.current} ต้องการอย่างน้อย ${requirement.required}`;
    }
    if (!missing.length && r < 0.4) return "รายละเอียดเริ่มได้มาตรฐานแล้ว ช่วยรักษาคุณภาพแบบนี้ทุกวันนะ";
  }
  if (issue.length && r < 0.24) return issue[Math.floor(Math.random() * issue.length)].text;
  if (tenant.behavior.phase === "active" && r < 0.45) return activityLine(tenant.behavior.activity, tenant.satisfaction, Math.floor(Math.random() * 2));
  if (room.cleanliness < 32 && r < 0.24) return "ห้องเริ่มสกปรกแล้วนะ 🧹";
  // รูมเมท
  const rmBad = ev.roommate.filter((n) => !n.good);
  const rmGood = ev.roommate.filter((n) => n.good);
  if (rmBad.length && r < 0.42) {
    const n = rmBad[Math.floor(Math.random() * rmBad.length)];
    return n.reason.includes("แย่งมุม") ? floorClashLine() : `${n.otherName}... ${n.reason}`;
  }
  if (rmGood.length && r < 0.5) return roommateLine(true);
  // ชั้นที่ชอบ
  if (tenant.floorPref !== "any" && tenant.floorPref !== ev.floorZone && r < 0.58) return floorLine(tenant.floorPref);
  if (ev.missing.length && r < 0.72) return wishLine(ev.missing[Math.floor(Math.random() * ev.missing.length)]);
  if (ev.dislikeHit > 4 && r < 0.8) return dislikeLine(tenant.dislike);
  if (ev.neighbors.length && r < 0.86) {
    const n = ev.neighbors[Math.floor(Math.random() * ev.neighbors.length)];
    return n.good ? `${n.otherName} ข้างห้องน่ารักมาก ${n.reason}` : `${n.otherName} ข้างห้อง... ${n.reason}`;
  }
  if (r < 0.94) return moodLine(mood);
  return idleLine();
}

function tick(state: FullState): FullState {
  const s = clone(state);
  s.day += 1;
  let income = 0;
  const now = Date.now();
  let bubbleBudget = 3;

  for (const room of s.rooms) {
    if (!room.unlocked) continue;
    const systems = roomSystems(room, commonBenefits(s, Math.floor(room.id / 3)).effects);
    room.cleanliness = Math.max(0, Math.min(100, room.cleanliness - systems.decay));

    for (const tid of [...room.tenantIds]) {
      const tenant = s.tenants[tid];
      if (!tenant) continue;
      const ev = evaluate(s, room, tenant);
      tenant.satisfaction = Math.round(tenant.satisfaction * 0.45 + ev.satisfaction * 0.55);
      tenant.lastRent = ev.rent;
      tenant.totalPaid += ev.rent;
      tenant.daysStayed += 1;
      income += ev.rent;

      const mood = moodOf(tenant.satisfaction);
      const unhappy = tenant.satisfaction < (isSpecial(tenant) ? 75 : room.level === 5 ? 42 : room.level >= 3 ? 37 : 32);
      if (unhappy && tenant.daysStayed > 2) tenant.angryDays += 1;
      else tenant.angryDays = Math.max(0, tenant.angryDays - 1);
      if (tenant.angryDays === tenant.patience)
        pushToast(s, `⚠️ ${tenant.name} (ห้อง ${room.id + 1}) กำลังจะย้ายออก! รีบแก้ห้องด่วน`, "bad");

      if (bubbleBudget > 0 && Math.random() < (mood === "angry" ? 0.85 : 0.45)) {
        bubbleBudget--;
        s.bubbles[tenant.id] = { text: speakLine(s, room, tenant), mood, at: now };
      }

      if (tenant.angryDays > tenant.patience) {
        pushToast(s, `😢 ${tenant.name} ทนไม่ไหว ย้ายออกจากห้อง ${room.id + 1}`, "bad");
        delete s.tenants[tenant.id];
        room.tenantIds = room.tenantIds.filter((id) => id !== tenant.id);
      }
    }
  }

  const upkeep = dailyUpkeep(s);
  const net = income - upkeep;
  s.money += net;
  if (s.money < 0) {
    s.money = 0;
    pushToast(s, "💸 เงินหมดเกลี้ยง! ลองขายของหรือหาผู้เช่าเพิ่มด่วน", "bad");
  }
  s.totalEarned += Math.max(0, income);
  s.history = [...s.history.slice(-29), net];
  s.bestDay = Math.max(s.bestDay, net);

  if (s.day % 4 === 0) {
    if (s.applicants.length < 5) s.applicants.push(freshApplicant(s));
    else {
      const oldestRegular = s.applicants.findIndex((t) => !isSpecial(t));
      if (oldestRegular >= 0) { s.applicants.splice(oldestRegular, 1); s.applicants.push(freshApplicant(s)); }
    }
  }
  for (const [k, b] of Object.entries(s.bubbles)) {
    if (now - b.at > 9000 || !s.tenants[k]) delete s.bubbles[k];
  }
  return s;
}

/* ------------------------------- save / load ------------------------------ */

const KEY = "cozy-nest-save-v2";
const OLD_KEY = "cozy-nest-save-v1";

export function saveState(s: FullState) {
  try {
    const { bubbles, toasts, intro, ...rest } = s;
    void bubbles;
    void toasts;
    void intro;
    localStorage.setItem(KEY, JSON.stringify({ ...rest, schemaVersion: 4 }));
  } catch {
    /* ignore */
  }
}

export function migrate(data: Record<string, unknown>): Record<string, unknown> {
  const rooms = data.rooms as { tenantId?: string | null; tenantIds?: string[] }[] | undefined;
  if (Array.isArray(rooms)) {
    for (const r of rooms) {
      if (!Array.isArray(r.tenantIds)) {
        r.tenantIds = r.tenantId ? [r.tenantId] : [];
      }
      delete r.tenantId;
    }
  }
  const tenants = data.tenants as Record<string, Tenant> | undefined;
  if (tenants) {
    for (const t of Object.values(tenants)) {
      if (!t.floorPref) t.floorPref = "any";
      const old = t.behavior;
      t.behavior = createBehavior(old?.activity && ACTIVITY_INFO[old.activity] ? old.activity : "idle", 0, old?.targetUid ?? null, (old?.serial ?? 0) + 1);
      if (old?.remainingMs && Number.isFinite(old.remainingMs)) t.behavior.remainingMs = Math.min(old.remainingMs, ACTIVITY_INFO[t.behavior.activity].durationMs);
      t.habits = Array.isArray(t.habits) && t.habits.length ? t.habits.filter((id) => ACTIVITY_INFO[id]) : habitsFor(t.id);
      if (!Number.isFinite(t.energy)) t.energy = 75;
      t.profileId = t.profileId && PROFILE_MAP[t.profileId] ? t.profileId : null;
      t.kind = t.profileId && PROFILE_MAP[t.profileId].special ? "special" : "regular";
      t.auraColor = t.kind === "special" ? PROFILE_MAP[t.profileId!].color : null;
    }
  }
  const applicants = data.applicants as Tenant[] | undefined;
  if (Array.isArray(applicants)) {
    for (const a of applicants) {
      if (!a.floorPref) a.floorPref = "any";
      a.behavior = createBehavior();
      if (!a.habits?.length) a.habits = habitsFor(a.id);
      if (!Number.isFinite(a.energy)) a.energy = 80;
      a.profileId = a.profileId && PROFILE_MAP[a.profileId] ? a.profileId : null;
      a.kind = a.profileId && PROFILE_MAP[a.profileId].special ? "special" : "regular";
      a.auraColor = a.kind === "special" ? PROFILE_MAP[a.profileId!].color : null;
    }
  }
  if (!Number.isFinite(data.lifeMs)) data.lifeMs = 0;
  // Older saves occasionally contained duplicate or invalid slots. Keep one and refund the rest.
  let refunded = 0;
  if (Array.isArray(data.rooms)) for (const room of data.rooms as Room[]) {
    room.level = Math.max(1, Math.min(MAX_HOUSE_LEVEL, Math.round(Number(room.level) || 1)));
    room.col = room.id % 3;
    room.floor = Math.floor(room.id / 3);
    const original = room.items ?? [];
    room.items = [];
    room.tenantIds = [...new Set(room.tenantIds.filter((id) => !!id && !!tenants?.[id]))].slice(0, roomCapacity(room));
    for (const item of original) {
      if (placementError(room, item.defId, item.grade, slotZone(item.slot), item.slot % 1000)) {
        const refund = FURNITURE_MAP[item.defId]?.grades[item.grade]?.cost ?? 0;
        data.money = Number(data.money ?? 0) + refund;
        refunded += refund;
      } else room.items.push(item);
    }
    while (room.items.length && !navigationFor(room).routesRemainOpen()) {
      const item = room.items.pop()!;
      const refund = FURNITURE_MAP[item.defId]?.grades[item.grade]?.cost ?? 0;
      data.money = Number(data.money ?? 0) + refund;
      refunded += refund;
    }
  }
  data.migrationRefund = refunded;
  const outdoorItems: OutdoorItem[] = [];
  for (const item of Array.isArray(data.outdoorItems) ? data.outdoorItems as OutdoorItem[] : []) {
    if (!OUTDOOR_MAP[item.defId] || !Number.isInteger(item.grade) || item.grade < 0 || item.grade > 2 || !Number.isInteger(item.district) || item.district < 0 || item.district > 3 || !Number.isInteger(item.slot) || item.slot < 0 || item.slot >= COMMON_PLOTS) continue;
    if (outdoorItems.some((i) => i.uid === item.uid || (i.district === item.district && (i.slot === item.slot || i.defId === item.defId)))) continue;
    outdoorItems.push({ ...item });
  }
  data.outdoorItems = outdoorItems;
  const thoughts = (data.thoughts && typeof data.thoughts === "object" ? data.thoughts : {}) as FullState["thoughts"];
  data.thoughts = Object.fromEntries(Object.values(tenants ?? {}).map((t) => [t.id, typeof thoughts[t.id]?.text === "string" ? thoughts[t.id] : { text: activityLine(t.behavior.activity, t.satisfaction), at: Date.now(), day: Number(data.day) || 1, mood: moodOf(t.satisfaction) }]));
  return data;
}

export function loadState(): FullState | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    const data = migrate(JSON.parse(raw));
    if (!data || !Array.isArray((data as { rooms: unknown }).rooms)) return null;
    const refund = Number(data.migrationRefund ?? 0);
    delete data.migrationRefund;
    const result: FullState = { ...initialState(), ...data, bubbles: {}, toasts: [], intro: false };
    if (!result.rooms[result.selectedRoom ?? 0]) result.selectedRoom = 0;
    if (refund) pushToast(result, `ปรับผังให้เดินได้ คืนเงินของที่ทับหรือปิดทาง ฿${refund.toLocaleString("th-TH")}`, "info");
    return result;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(OLD_KEY);
  } catch {
    /* ignore */
  }
}

export { floorSlotCount, wallSlotCount, loftSlotCount };
