import { TRAITS, TRAIT_LIST, type TraitId } from "./traits";
import { ACTIVITY_INFO, habitsFor, type ActivityId, type NewActivityId } from "./activities";
import { NEW_RESIDENTS, PROFILE_MAP, SPECIAL_RESIDENTS } from "./residentProfiles";
export { ACTIVITY_INFO } from "./activities";
export type { ActivityId } from "./activities";

export interface TenantLook {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  hairStyle: number;
  accessory: number;
}

/** ชั้นที่ชอบในห้อง (ห้องมี 2 ชั้น: ล่าง + ชั้นลอย) */
export type FloorPref = "down" | "up" | "any";

export interface TenantBehavior {
  activity: ActivityId;
  startedAt: number;
  endsAt: number;
  targetUid: string | null;
  phase: "walking" | "active";
  remainingMs: number;
  serial: number;
  failedActivities: ActivityId[];
  failures: number;
  travelMs: number;
  inPlace: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  profileId: string | null;
  kind: "regular" | "special";
  auraColor: string | null;
  job: string;
  emoji: string;
  bio: string;
  likes: TraitId[];
  dislike: TraitId;
  floorPref: FloorPref;
  behavior: TenantBehavior;
  habits: NewActivityId[];
  energy: number;
  budget: number; // ตัวคูณค่าเช่า 0.85 - 1.7
  patience: number; // จำนวนวันที่ทนได้เมื่อไม่พอใจ
  look: TenantLook;
  // runtime
  roomId: number | null;
  satisfaction: number;
  daysStayed: number;
  totalPaid: number;
  angryDays: number;
  lastRent: number;
}

export const FLOOR_PREF_INFO: Record<FloorPref, { th: string; emoji: string; desc: string }> = {
  down: { th: "ชอบชั้นล่าง", emoji: "⬇️", desc: "อยากได้มุมส่วนตัวชั้นล่าง" },
  up: { th: "ชอบชั้นลอย", emoji: "⬆️", desc: "อยากได้มุมส่วนตัวบนชั้นลอย" },
  any: { th: "อยู่ตรงไหนก็ได้", emoji: "🔀", desc: "ไม่มีปัญหากับชั้นไหน" },
};

const NAMES = [
  "น้องมะลิ", "พี่โอ๊ต", "ครูแนน", "หมอเบส", "เจ๊ติ๋ม", "น้าเปี๊ยก", "คุณพลอย", "ไอ้ตูน",
  "พี่แทน", "น้องข้าวปุ้น", "เฮียเล้ง", "ป้ามุก", "น้องเอิร์ธ", "พี่ฝ้าย", "ลุงชัย", "น้องมินต์",
  "พี่จิน", "น้องปิ่น", "ครูหนึ่ง", "พี่กัน", "น้องบูม", "เจ้านาย", "คุณหมิว", "พี่โบว์",
  "น้องเก้า", "ป๋าเอก", "น้องส้ม", "พี่ใบเตย", "น้องไอซ์", "พี่ต้นกล้า", "น้องหมูหวาน", "พี่เฟิร์น",
  "น้องพราว", "พี่มาร์ค", "คุณน้ำฝน", "น้องโบนัส", "พี่หลิน", "น้องภูมิ", "ครูมิ้นท์", "พี่แชมป์",
];

const JOBS = [
  "นักศึกษาปี 3", "ฟรีแลนซ์กราฟิก", "พนักงานออฟฟิศ", "คุณหมออินเทิร์น", "บาริสต้า",
  "โปรแกรมเมอร์", "ยูทูปเบอร์", "ครูสอนพิเศษ", "นักเขียนนิยาย", "พนักงานแบงก์",
  "เชฟร้านอาหาร", "เทรนเนอร์ยิม", "นักดนตรีกลางคืน", "สัตวแพทย์", "นักแปลภาษา",
  "ช่างภาพอิสระ", "พยาบาลเวรดึก", "สจ๊วต", "อินฟลูเอนเซอร์", "นักออกแบบภายใน",
  "นักพากย์", "ติวเตอร์ออนไลน์", "นักบัญชี", "คนขับแกร็บ", "แม่ค้าออนไลน์",
];

const EMOJIS = ["🐣", "🐼", "🦊", "🐨", "🐸", "🐰", "🐥", "🦉", "🐙", "🐧", "🦄", "🐯", "🐻", "🐹", "🐬", "🦖", "🐞", "🦋", "🐢", "🦩"];

const SKINS = ["#ffdcc0", "#f7c9a3", "#e8ab7d", "#c98a5e", "#8d5a3b", "#ffe3cf"];
const HAIRS = ["#2f2235", "#4a2c1d", "#7b4b2a", "#c96f3b", "#e8c07d", "#2b3a55", "#8e5fa8", "#d45b7a", "#3c3c46"];
const SHIRTS = ["#ff8fab", "#7fd1ff", "#9ee493", "#ffd166", "#c8a2ff", "#ff9f68", "#6fe3c8", "#f2f2f2", "#ff6f91"];
const PANTS = ["#44507a", "#5c4a6b", "#38574a", "#7a4b3a", "#3a3f52", "#6b6f8d"];

const BIOS = [
  "ย้ายมาจากต่างจังหวัด อยากได้ห้องที่รู้สึกเหมือนบ้าน",
  "ทำงานดึกเป็นประจำ กลับมาก็อยากเจอห้องที่ถูกใจ",
  "เพิ่งเริ่มต้นชีวิตวัยทำงาน งบไม่เยอะแต่เรื่องมากนิดหน่อย",
  "อยู่คนเดียวมานาน มีความชอบเฉพาะตัวสูง",
  "ชอบถ่ายรูปห้องลงโซเชียล ถ้าห้องสวยจะรีวิวให้",
  "เป็นคนง่าย ๆ แต่ถ้าอะไรไม่ถูกใจจะบ่นเบา ๆ ทุกวัน",
  "มองหาที่อยู่ระยะยาว ถ้าถูกใจจะอยู่ไม่ย้ายไปไหน",
  "ขอแค่ห้องตรงสเปกก็ยอมจ่ายแพงกว่าที่อื่น",
  "เคยอยู่หอแย่มาก่อน รอบนี้ขอเลือกเยอะหน่อย",
  "เป็นคนติดเพื่อน ถ้ารูมเมทน่ารักจะอยู่ยาวเลย",
];

const newId = () => `t_${Math.random().toString(36).slice(2, 9)}`;
const rnd = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rint = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export function createBehavior(activity: ActivityId = "idle", now = 0, targetUid: string | null = null, serial = 1): TenantBehavior {
  return { activity, startedAt: now, endsAt: 0, targetUid, phase: "walking", remainingMs: ACTIVITY_INFO[activity].durationMs, serial, failedActivities: [], failures: 0, travelMs: 0, inPlace: false };
}

export function makeTenant(options: { group?: "classic" | "new" | "special"; profileId?: string; exclude?: string[] } = {}): Tenant {
  const pool = [...TRAIT_LIST];
  const likes: TraitId[] = [];
  const count = Math.random() < 0.45 ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    likes.push(pool.splice(idx, 1)[0].id);
  }
  const dislike = pool[Math.floor(Math.random() * pool.length)].id;
  const budget = Math.round((0.85 + Math.random() * 0.85 + (count === 3 ? 0.12 : 0)) * 100) / 100;
  // ชั้นที่ชอบ: 35% ล่าง / 35% ลอย / 30% ได้หมด
  const fr = Math.random();
  const floorPref: FloorPref = fr < 0.35 ? "down" : fr < 0.7 ? "up" : "any";
  const id = newId();
  const tenant: Tenant = {
    id,
    name: rnd(NAMES),
    profileId: null,
    kind: "regular",
    auraColor: null,
    job: rnd(JOBS),
    emoji: rnd(EMOJIS),
    bio: rnd(BIOS),
    likes,
    dislike,
    floorPref,
    behavior: createBehavior(),
    habits: habitsFor(id),
    energy: rint(55, 95),
    budget,
    patience: rint(4, 8),
    look: {
      skin: rnd(SKINS),
      hair: rnd(HAIRS),
      shirt: rnd(SHIRTS),
      pants: rnd(PANTS),
      hairStyle: rint(0, 4),
      accessory: rint(0, 4),
    },
    roomId: null,
    satisfaction: 55,
    daysStayed: 0,
    totalPaid: 0,
    angryDays: 0,
    lastRent: 0,
  };
  const roll = Math.random();
  const group = options.group ?? (roll < 0.12 ? "special" : roll < 0.65 ? "new" : "classic");
  const registry = group === "special" ? SPECIAL_RESIDENTS : group === "new" ? NEW_RESIDENTS : [];
  const candidates = registry.filter((p) => !options.exclude?.includes(p.id));
  const profile = options.profileId ? PROFILE_MAP[options.profileId] : candidates.length ? rnd(candidates) : null;
  if (!profile) return tenant;
  const index = [...NEW_RESIDENTS, ...SPECIAL_RESIDENTS].findIndex((p) => p.id === profile.id);
  return {
    ...tenant, profileId: profile.id, kind: profile.special ? "special" : "regular", auraColor: profile.special ? profile.color : null,
    name: profile.name, job: profile.job, bio: profile.bio, likes: [...profile.likes], dislike: profile.dislike, habits: [...profile.habits],
    budget: profile.budget, patience: profile.special ? 2 : 6, floorPref: index % 3 === 0 ? "up" : index % 3 === 1 ? "down" : "any",
    look: { skin: SKINS[index % SKINS.length], hair: HAIRS[index % HAIRS.length], shirt: profile.color, pants: PANTS[index % PANTS.length], hairStyle: index % 5, accessory: (index + 1) % 5 },
  };
}

export function isSpecial(tenant: Tenant) { return tenant.kind === "special" && !!tenant.profileId && !!PROFILE_MAP[tenant.profileId]?.special; }

/* ----------------------------- บทพูดน่ารัก ๆ ----------------------------- */

const HAPPY = [
  "ห้องนี้ดีต่อใจมากเลย~ 💕",
  "อยู่แล้วไม่อยากออกไปไหนเลยอ่ะ",
  "จ่ายค่าเช่าอย่างมีความสุข ✨",
  "เพื่อน ๆ มาเห็นห้องแล้วอิจฉากันใหญ่",
  "เจ้าของหอใจดีที่สุดในสามโลก!",
  "คืนนี้หลับสบายแน่นอน 😴",
  "จะรีวิวห้าดาวให้เลยนะเนี่ย ⭐",
];
const CONTENT = [
  "ก็โอเคนะ อยู่ได้สบาย ๆ",
  "ห้องกำลังดีเลย ไม่มีอะไรติ",
  "วันนี้อากาศดี ห้องก็ดี~",
  "เริ่มชินกับที่นี่แล้วล่ะ",
  "ถ้าเพิ่มอะไรอีกนิดจะเพอร์เฟกต์",
];
const MEH = [
  "เอ่อ... ก็พออยู่ได้มั้ง",
  "ห้องยังขาดอะไรไปบางอย่างนะ",
  "เดือนหน้าอาจต้องหาที่ใหม่แล้วมั้ง",
  "ค่าเช่าเท่านี้ควรได้มากกว่านี้นะ",
  "หืม... เงียบ ๆ ไว้ดีกว่า",
];
const ANGRY = [
  "แบบนี้ไม่ไหวแล้วนะ! 😤",
  "ขอคุยกับเจ้าของหอหน่อยค่ะ!",
  "จะย้ายออกจริง ๆ นะ เตือนแล้ว",
  "นี่มันห้องหรือโกดังเนี่ย...",
  "อยู่ไม่ได้แล้ว ปวดหัวมาก",
];
const IDLE = [
  "วันนี้กินอะไรดีนะ 🤔",
  "เงินเดือนออกเมื่อไหร่นะ...",
  "ง่วง... แต่ต้องทำงานต่อ",
  "ได้ยินเสียงแมวข้างล่างรึเปล่า",
  "ฝนจะตกอีกแล้วมั้ง",
  "ขอเวลาอยู่เฉย ๆ สักห้านาที",
  "อยากสั่งชานมแต่ต้องประหยัด",
  "ลืมซักผ้าอีกแล้ว 🧺",
];

const ROOMMATE_GOOD = [
  "รูมเมทน่ารักมาก ชวนกันกินข้าวทุกวัน 🥰",
  "อยู่กับรูมเมทคนนี้สบายใจจัง",
  "เมื่อคืนนั่งคุยกับรูมเมทจนดึกเลย",
  "ได้รูมเมทดีเหมือนถูกลอตเตอรี่ 🎉",
];
const ROOMMATE_BAD = [
  "รูมเมทคนนี้... เข้ากันไม่ได้เลย 😩",
  "เมื่อไหร่รูมเมทจะย้ายออกนะ",
  "ต้องทนอยู่กับคนแบบนี้อีกนานแค่ไหน",
  "ขอห้องใหม่ได้ไหม ไม่อยากอยู่ด้วยกันแล้ว",
];
const FLOOR_WANT_UP = [
  "อยากได้มุมบนชั้นลอยจัง ⬆️ วิวดีกว่าเยอะ",
  "เมื่อไหร่จะได้ขึ้นไปอยู่ชั้นลอยนะ",
  "ชั้นลอยน่านอนกว่าตั้งเยอะ",
];
const FLOOR_WANT_DOWN = [
  "ขี้เกียจปีนขึ้นชั้นลอยอ่ะ ขออยู่ชั้นล่างนะ ⬇️",
  "ชั้นล่างเดินสะดวกกว่าเยอะเลย",
  "ใครจะขึ้นชั้นลอยก็ขึ้นไป เราขออยู่ข้างล่าง",
];
const FLOOR_CLASH = [
  "แย่งมุมโปรดกันทุกวันเลย เบื่อ 😤",
  "รูมเมทก็อยากได้ชั้นเดียวกับเราอีก",
  "ชั้นนี้ของเรานะ! จองแล้ว!",
];

export type MoodKey = "happy" | "content" | "meh" | "angry";

export function moodOf(sat: number): MoodKey {
  if (sat >= 78) return "happy";
  if (sat >= 55) return "content";
  if (sat >= 32) return "meh";
  return "angry";
}

export const MOOD_INFO: Record<MoodKey, { th: string; emoji: string; color: string }> = {
  happy: { th: "มีความสุขมาก", emoji: "😍", color: "#6ee7a8" },
  content: { th: "พอใจ", emoji: "🙂", color: "#8fd3ff" },
  meh: { th: "เฉย ๆ", emoji: "😐", color: "#ffd166" },
  angry: { th: "ไม่พอใจ", emoji: "😤", color: "#ff7d7d" },
};

export function wishLine(trait: TraitId): string {
  const t = TRAITS[trait];
  const pat = [
    `อยากได้${t.th}มากกว่านี้ ${t.emoji}`,
    `${t.emoji} ${t.want} จะดีมากเลย`,
    `ถ้าห้องมี${t.th}กว่านี้จะรักเจ้าของหอเลยนะ`,
    `ขอแบบ${t.th}หน่อยได้ไหม ${t.emoji}`,
  ];
  return pat[Math.floor(Math.random() * pat.length)];
}

export function dislikeLine(trait: TraitId): string {
  const t = TRAITS[trait];
  return `ไม่ชอบ${t.th}เลยอ่ะ ${t.emoji} เอาออกได้ไหม`;
}

export function moodLine(mood: MoodKey): string {
  const table = { happy: HAPPY, content: CONTENT, meh: MEH, angry: ANGRY }[mood];
  return rnd(table);
}

export function idleLine(): string {
  return rnd(IDLE);
}

export function roommateLine(good: boolean): string {
  return rnd(good ? ROOMMATE_GOOD : ROOMMATE_BAD);
}

export function floorLine(pref: FloorPref): string {
  if (pref === "up") return rnd(FLOOR_WANT_UP);
  if (pref === "down") return rnd(FLOOR_WANT_DOWN);
  return rnd(IDLE);
}

export function floorClashLine(): string {
  return rnd(FLOOR_CLASH);
}
