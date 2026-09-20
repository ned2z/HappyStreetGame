export type TraitId =
  | "clean"
  | "comfort"
  | "safety"
  | "quiet"
  | "nature"
  | "tech"
  | "books"
  | "music"
  | "art"
  | "cooking"
  | "fitness"
  | "pets"
  | "luxury"
  | "gaming"
  | "social"
  | "sleep"
  | "light"
  | "minimal"
  | "vintage"
  | "spa";

export interface Trait {
  id: TraitId;
  th: string;
  emoji: string;
  color: string;
  /** สิ่งที่ผู้เช่าคนนี้มองหา */
  want: string;
}

export const TRAITS: Record<TraitId, Trait> = {
  clean: { id: "clean", th: "รักสะอาด", emoji: "🧼", color: "#7ee0e8", want: "ห้องต้องเอี่ยม ไร้ฝุ่น กลิ่นหอมสดชื่น" },
  comfort: { id: "comfort", th: "ความสะดวกสบาย", emoji: "🛋️", color: "#ffb37a", want: "เฟอร์นิเจอร์นุ่ม ๆ แอร์เย็นฉ่ำ ครบครัน" },
  safety: { id: "safety", th: "ความปลอดภัย", emoji: "🛡️", color: "#8fb9ff", want: "กล้องวงจรปิด กลอนดิจิทัล อุปกรณ์ฉุกเฉิน" },
  quiet: { id: "quiet", th: "ความสงบ", emoji: "🤫", color: "#c3b7ff", want: "เงียบสงบ ผนังกันเสียง ไม่มีเสียงรบกวน" },
  nature: { id: "nature", th: "รักธรรมชาติ", emoji: "🌿", color: "#8ee6a0", want: "ต้นไม้เยอะ ๆ อากาศบริสุทธิ์ สีเขียวเต็มห้อง" },
  tech: { id: "tech", th: "ชอบเทคโนโลยี", emoji: "🤖", color: "#6fe3ff", want: "ของเล่นไฮเทค สมาร์ทโฮม เน็ตแรง" },
  books: { id: "books", th: "ชอบหนังสือ", emoji: "📚", color: "#e0b485", want: "ชั้นหนังสือ มุมอ่านเงียบ ๆ ไฟอ่านหนังสือ" },
  music: { id: "music", th: "ชอบเสียงเพลง", emoji: "🎵", color: "#ff9ad5", want: "ลำโพงเทพ เครื่องดนตรี มุมแจม" },
  art: { id: "art", th: "ชอบศิลปะ", emoji: "🎨", color: "#ffa0a0", want: "ภาพวาด สีสัน มุมทำงานคราฟต์" },
  cooking: { id: "cooking", th: "ชอบทำอาหาร", emoji: "🍳", color: "#ffd166", want: "ครัวดี ๆ ตู้เย็นใหญ่ ๆ อุปกรณ์ครบ" },
  fitness: { id: "fitness", th: "รักการออกกำลังกาย", emoji: "💪", color: "#ff8d6b", want: "มุมฟิตเนส เสื่อโยคะ พื้นที่ขยับตัว" },
  pets: { id: "pets", th: "รักสัตว์เลี้ยง", emoji: "🐾", color: "#f7b267", want: "ที่นอนน้องหมาน้องแมว พื้นที่วิ่งเล่น" },
  luxury: { id: "luxury", th: "ชอบความหรูหรา", emoji: "💎", color: "#f0c674", want: "ของแพง ๆ โคมระย้า อ่างจากุซซี่" },
  gaming: { id: "gaming", th: "ชอบเล่นเกม", emoji: "🎮", color: "#b28dff", want: "เกมมิ่งเซ็ตอัพ ไฟ RGB จอใหญ่" },
  social: { id: "social", th: "ชอบสังสรรค์", emoji: "🎉", color: "#ff7fa8", want: "โซฟาใหญ่ ไฟปาร์ตี้ พื้นที่ชวนเพื่อนมาเล่น" },
  sleep: { id: "sleep", th: "ชอบนอน", emoji: "😴", color: "#9fa8ff", want: "เตียงนุ่ม ๆ ผ้าม่านทึบ ห้องมืดสบาย" },
  light: { id: "light", th: "ชอบแสงสว่าง", emoji: "🌞", color: "#ffe28a", want: "ไฟสว่าง หน้าต่างใหญ่ โคมไฟอบอุ่น" },
  minimal: { id: "minimal", th: "ชอบมินิมอล", emoji: "⬜", color: "#dfe6ee", want: "ของน้อยชิ้นแต่ดี โทนสีสะอาดตา" },
  vintage: { id: "vintage", th: "ชอบของวินเทจ", emoji: "🕰️", color: "#d9a066", want: "ของเก่าเล่าเรื่อง ไม้ ๆ กลิ่นอายยุคเก่า" },
  spa: { id: "spa", th: "ชอบผ่อนคลาย", emoji: "🛁", color: "#9be7d8", want: "อ่างอาบน้ำ กลิ่นหอม มุมชิลผ่อนคลาย" },
};

export const TRAIT_LIST = Object.values(TRAITS);

/** คู่ที่อยู่ห้องติดกันแล้วทะเลาะกัน (ค่าเช่าลด) */
export const CONFLICTS: [TraitId, TraitId, string][] = [
  ["quiet", "music", "เสียงเพลงทะลุกำแพงทั้งคืน"],
  ["quiet", "social", "ปาร์ตี้ข้างห้องไม่เลิกสักที"],
  ["quiet", "gaming", "เสียงเมาส์คลิกรัว ๆ ดังมาก"],
  ["sleep", "social", "กลับดึกเสียงดังทุกคืน"],
  ["sleep", "fitness", "ตื่นตีห้ามากระโดดเชือก"],
  ["clean", "pets", "ขนน้องหมาปลิวมาถึงห้องเลย"],
  ["clean", "cooking", "กลิ่นผัดกระเพราลอยมาทุกวัน"],
  ["minimal", "vintage", "รกไปหมด ของเก่าเต็มระเบียง"],
  ["minimal", "luxury", "อวดของแพงจนน่ารำคาญ"],
  ["nature", "tech", "เครื่องเซิร์ฟเวอร์เสียงดังไล่ผีเสื้อหมด"],
  ["books", "gaming", "สปอยล์เนื้อเรื่องเสียงดังตลอด"],
  ["spa", "gaming", "ไฟ RGB ส่องเข้าห้องจนผ่อนคลายไม่ได้"],
  ["safety", "social", "เปิดประตูให้คนแปลกหน้าเข้าตึกบ่อย"],
  ["art", "minimal", "เลอะสีเต็มทางเดินส่วนกลาง"],
];

/** คู่ที่อยู่ติดกันแล้วถูกคอ (ค่าเช่าเพิ่ม) */
export const AFFINITIES: [TraitId, TraitId, string][] = [
  ["nature", "spa", "ชวนกันรดน้ำต้นไม้ตอนเช้า"],
  ["books", "quiet", "แชร์หนังสือกันทุกสัปดาห์"],
  ["tech", "gaming", "ตั้งวงแลนปาร์ตี้กันสนุกมาก"],
  ["music", "art", "แจมเพลงแล้ววาดรูปด้วยกัน"],
  ["cooking", "social", "ทำกับข้าวแบ่งกันกินทุกเย็น"],
  ["fitness", "clean", "ชวนกันวิ่งตอนเช้าแล้วเก็บขยะ"],
  ["pets", "nature", "พาน้องหมาไปเดินสวนด้วยกัน"],
  ["luxury", "vintage", "คุยเรื่องของสะสมได้ทั้งคืน"],
  ["light", "minimal", "ห้องสว่างสะอาดตาเหมือนกัน"],
  ["sleep", "quiet", "ตกลงกันว่าสี่ทุ่มเงียบทั้งชั้น"],
  ["safety", "clean", "ช่วยกันดูแลตึกให้เรียบร้อย"],
  ["comfort", "spa", "แลกสูตรชาอุ่น ๆ ก่อนนอน"],
];

const conflictKey = (a: TraitId, b: TraitId) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const CONFLICT_MAP = new Map<string, string>();
CONFLICTS.forEach(([a, b, reason]) => CONFLICT_MAP.set(conflictKey(a, b), reason));
const AFFINITY_MAP = new Map<string, string>();
AFFINITIES.forEach(([a, b, reason]) => AFFINITY_MAP.set(conflictKey(a, b), reason));

export function conflictReason(a: TraitId, b: TraitId): string | undefined {
  return CONFLICT_MAP.get(conflictKey(a, b));
}
export function affinityReason(a: TraitId, b: TraitId): string | undefined {
  return AFFINITY_MAP.get(conflictKey(a, b));
}
