import type { TraitId } from "./traits";
import type { ActivityId } from "./activities";
import { EXTRA_FURNITURE } from "./equipmentCatalog";

export type PlaceType = "floor" | "wall" | "loft" | "terrace" | "nook" | "surface" | "ceiling";
export type CatId = "basic" | "comfort" | "hobby" | "safety" | "green" | "deco";

export interface EquipmentEffects {
  beds?: number;
  seats?: number;
  storage?: number;
  privacy?: number;
  soundproof?: number;
  cleaning?: number;
  air?: number;
  climate?: number;
  power?: number;
  generation?: number;
  upkeep?: number;
  rent?: number;
  recovery?: number;
  security?: number;
}

export interface GradeDef {
  th: string;
  cost: number;
  mult: number;
}

export type FurnitureRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface FurnitureStatusLine {
  key: "utility" | "hygiene" | "prestige" | "noise" | "space";
  th: string;
  value: number;
  positive: boolean;
  emoji: string;
}

export interface FurnitureMeta {
  typeTh: string;
  rarity: FurnitureRarity;
  rarityTh: string;
  rarityColor: string;
  status: FurnitureStatusLine[];
}

export interface FurnitureDef {
  id: string;
  th: string;
  emoji: string;
  cat: CatId;
  /** ชนิดของ: floor = วางพื้น(ชั้นล่าง/ชั้นลอย), wall = ติดผนัง */
  place: "floor" | "wall";
  desc: string;
  /** สเตตัสแบบคละ: มีทั้งบวกและลบ (เช่น ลำโพงดัง = music+ แต่ quiet-) */
  traits: Partial<Record<TraitId, number>>;
  grades: [GradeDef, GradeDef, GradeDef];
  zones?: PlaceType[];
  effects?: EquipmentEffects;
  activities?: ActivityId[];
  useCapacity?: number;
  minLevel?: number;
  model?: string;
  accent?: string;
  footprint?: [number, number, number];
  isNew?: boolean;
}

export const CATEGORIES: { id: CatId; th: string; emoji: string }[] = [
  { id: "basic", th: "พื้นฐาน", emoji: "🧱" },
  { id: "comfort", th: "สบาย", emoji: "🛋️" },
  { id: "hobby", th: "งานอดิเรก", emoji: "🎸" },
  { id: "green", th: "ธรรมชาติ", emoji: "🌿" },
  { id: "safety", th: "ปลอดภัย", emoji: "🛡️" },
  { id: "deco", th: "ตกแต่ง", emoji: "🖼️" },
];

const g = (a: [string, number], b: [string, number], c: [string, number]): [GradeDef, GradeDef, GradeDef] => [
  { th: a[0], cost: a[1], mult: 1 },
  { th: b[0], cost: b[1], mult: 1.95 },
  { th: c[0], cost: c[1], mult: 3.2 },
];

const ORIGINAL_FURNITURE: FurnitureDef[] = [
  {
    id: "bed",
    th: "เตียงนอน",
    emoji: "🛏️",
    cat: "basic",
    place: "floor",
    desc: "ที่หลับที่นอน หัวใจของห้องเช่า",
    traits: { sleep: 4, comfort: 3 },
    grades: g(["เตียงเหล็กธรรมดา", 800], ["เตียงนุ่มสบาย", 2600], ["เตียงคิงไซส์สบายสุด ๆ", 8200]),
  },
  {
    id: "sofa",
    th: "โซฟา",
    emoji: "🛋️",
    cat: "comfort",
    place: "floor",
    desc: "นั่งเล่นชิล ๆ รับแขกได้ แต่เก็บฝุ่นง่าย",
    traits: { comfort: 3, social: 2, clean: -1 },
    grades: g(["โซฟาผ้าตัวเล็ก", 900], ["โซฟานุ่มสามที่นั่ง", 3000], ["โซฟาหนังแท้ปรับเอนได้", 9000]),
  },
  {
    id: "desk",
    th: "โต๊ะทำงาน",
    emoji: "🗄️",
    cat: "basic",
    place: "floor",
    desc: "มุมทำงาน อ่านหนังสือ",
    traits: { books: 2, tech: 1, minimal: 1 },
    grades: g(["โต๊ะไม้อัด", 500], ["โต๊ะไม้จริงกว้าง", 1800], ["โต๊ะปรับไฟฟ้า", 5600]),
  },
  {
    id: "chair",
    th: "เก้าอี้",
    emoji: "💺",
    cat: "basic",
    place: "floor",
    desc: "นั่งสบายหลังไม่พัง",
    traits: { comfort: 2, gaming: 1 },
    grades: g(["เก้าอี้พลาสติก", 350], ["เก้าอี้บุนวม", 1400], ["เก้าอี้เออร์โกโนมิก", 4800]),
  },
  {
    id: "wardrobe",
    th: "ตู้เสื้อผ้า",
    emoji: "🚪",
    cat: "basic",
    place: "floor",
    desc: "เก็บของให้ห้องโล่ง",
    traits: { clean: 2, minimal: 2 },
    grades: g(["ตู้ผ้าใบ", 450], ["ตู้ไม้บานเลื่อน", 1900], ["วอล์กอินโคลเซ็ต", 6400]),
  },
  {
    id: "bookshelf",
    th: "ชั้นหนังสือ",
    emoji: "📚",
    cat: "hobby",
    place: "floor",
    desc: "มุมหนอนหนังสือ แต่กินพื้นที่",
    traits: { books: 4, vintage: 1, minimal: -1 },
    grades: g(["ชั้นเหล็กเล็ก", 600], ["ชั้นไม้สูง", 2200], ["ห้องสมุดส่วนตัว", 7000]),
  },
  {
    id: "tv",
    th: "โทรทัศน์",
    emoji: "📺",
    cat: "comfort",
    place: "wall",
    desc: "ดูซีรีส์ยาว ๆ แต่เสียงรบกวนคนนอน",
    traits: { social: 2, tech: 2, comfort: 1, quiet: -1, sleep: -1 },
    grades: g(["ทีวี 32 นิ้ว", 900], ["สมาร์ททีวี 55 นิ้ว", 3200], ["โฮมเธียเตอร์ 8K", 9800]),
  },
  {
    id: "pc",
    th: "คอมพิวเตอร์",
    emoji: "🖥️",
    cat: "hobby",
    place: "floor",
    desc: "ทำงาน เล่นเกม ครบจบ แต่แสงแยงตาตอนดึก",
    traits: { tech: 4, gaming: 2, sleep: -1 },
    grades: g(["พีซีมือสอง", 1100], ["พีซีสเปกดี", 3800], ["เวิร์กสเตชันเรือธง", 11000]),
  },
  {
    id: "speaker",
    th: "ลำโพง",
    emoji: "🔊",
    cat: "hobby",
    place: "floor",
    desc: "เบสแน่น เสียงใส แต่ดังทะลุกำแพง",
    traits: { music: 4, social: 1, quiet: -2 },
    grades: g(["ลำโพงบลูทูธ", 500], ["ลำโพงตั้งพื้น", 2400], ["ชุดไฮไฟระดับสตูดิโอ", 8600]),
  },
  {
    id: "piano",
    th: "เครื่องดนตรี",
    emoji: "🎹",
    cat: "hobby",
    place: "floor",
    desc: "มุมแจมเพลงส่วนตัว ซ้อมดึกเพื่อนบ้านเคือง",
    traits: { music: 4, art: 2, quiet: -2 },
    grades: g(["กีตาร์โปร่ง", 900], ["คีย์บอร์ดไฟฟ้า", 3400], ["เปียโนอัพไรท์", 12000]),
  },
  {
    id: "plant",
    th: "ต้นไม้ในกระถาง",
    emoji: "🪴",
    cat: "green",
    place: "floor",
    desc: "สีเขียวสดชื่น น้องหมาน้องแมวชอบ",
    traits: { nature: 3, clean: 1, pets: 1 },
    grades: g(["กระบองเพชรจิ๋ว", 220], ["มอนสเตอร่าใบใหญ่", 1200], ["สวนในร่มขนาดย่อม", 4200]),
  },
  {
    id: "greenwall",
    th: "สวนแนวตั้ง",
    emoji: "🌿",
    cat: "green",
    place: "wall",
    desc: "ผนังต้นไม้ฟอกอากาศ ดูแพง แต่ใบไม้ร่วงบ้าง",
    traits: { nature: 4, spa: 1, luxury: 1, clean: -1 },
    grades: g(["แผงไม้เลื้อย", 900], ["สวนแนวตั้งรดน้ำอัตโนมัติ", 3600], ["ผนังป่าดิบชื้นจำลอง", 10500]),
  },
  {
    id: "aquarium",
    th: "ตู้ปลา",
    emoji: "🐠",
    cat: "green",
    place: "floor",
    desc: "ดูปลาแล้วใจเย็น แต่ต้องขยันล้างตู้",
    traits: { nature: 2, pets: 2, spa: 2, tech: 1, clean: -1 },
    grades: g(["โหลปลาทอง", 400], ["ตู้ไม้น้ำ", 2600], ["ตู้ปะการังน้ำเค็ม", 9400]),
  },
  {
    id: "petbed",
    th: "มุมสัตว์เลี้ยง",
    emoji: "🐶",
    cat: "comfort",
    place: "floor",
    desc: "ที่นอนน้องหมาน้องแมว ขนฟุ้งหน่อยนะ",
    traits: { pets: 4, comfort: 1, clean: -2, quiet: -1 },
    grades: g(["เบาะนอนนุ่ม", 380], ["คอนโดแมวไม้", 1700], ["คฤหาสน์สัตว์เลี้ยง", 5800]),
  },
  {
    id: "lamp",
    th: "โคมไฟ",
    emoji: "💡",
    cat: "deco",
    place: "floor",
    desc: "แสงอุ่น ๆ ยามค่ำ",
    traits: { light: 3, comfort: 1 },
    grades: g(["โคมไฟตั้งโต๊ะ", 260], ["โคมไฟตั้งพื้นดีไซน์", 1300], ["ชุดไฟอัจฉริยะทั้งห้อง", 4600]),
  },
  {
    id: "chandelier",
    th: "โคมระย้า",
    emoji: "✨",
    cat: "deco",
    place: "wall",
    desc: "หรูหราตั้งแต่ก้าวแรก แต่ไม่มินิมอลเลย",
    traits: { luxury: 3, light: 3, minimal: -2 },
    grades: g(["โคมกลมมินิมอล", 800], ["โคมคริสตัลชั้นเดียว", 4200], ["แชนเดอเลียร์คริสตัลแท้", 14000]),
  },
  {
    id: "rug",
    th: "พรม",
    emoji: "🧶",
    cat: "comfort",
    place: "floor",
    desc: "เดินเท้าเปล่าได้สบาย ซับเสียงด้วย แต่ซักยาก",
    traits: { comfort: 2, vintage: 2, quiet: 1, clean: -1 },
    grades: g(["พรมเช็ดเท้า", 200], ["พรมขนนุ่ม", 1100], ["พรมเปอร์เซียทอมือ", 6800]),
  },
  {
    id: "painting",
    th: "ภาพศิลปะ",
    emoji: "🖼️",
    cat: "deco",
    place: "wall",
    desc: "เติมรสนิยมให้ผนัง",
    traits: { art: 4, luxury: 1 },
    grades: g(["โปสเตอร์", 180], ["ภาพพิมพ์กรอบไม้", 1500], ["ภาพวาดสีน้ำมันต้นฉบับ", 9200]),
  },
  {
    id: "curtain",
    th: "ผ้าม่าน",
    emoji: "🪟",
    cat: "basic",
    place: "wall",
    desc: "คุมแสง คุมความเป็นส่วนตัว แต่ห้องมืดลง",
    traits: { sleep: 3, quiet: 1, comfort: 1, light: -1 },
    grades: g(["ม่านบาง", 300], ["ม่านทึบสองชั้น", 1400], ["ม่านไฟฟ้ากันแสง 100%", 5200]),
  },
  {
    id: "aircon",
    th: "เครื่องปรับอากาศ",
    emoji: "❄️",
    cat: "comfort",
    place: "wall",
    desc: "เย็นฉ่ำทั้งวัน แต่กินไฟสุด ๆ",
    traits: { comfort: 4, tech: 1, nature: -1 },
    grades: g(["พัดลมตั้งพื้น", 400], ["แอร์อินเวอร์เตอร์", 3400], ["ระบบปรับอากาศอัจฉริยะ", 10500]),
  },
  {
    id: "purifier",
    th: "เครื่องฟอกอากาศ",
    emoji: "🌬️",
    cat: "green",
    place: "floor",
    desc: "PM2.5 ไม่ต้องกลัว",
    traits: { clean: 3, nature: 1, tech: 1 },
    grades: g(["เครื่องฟอกจิ๋ว", 600], ["เครื่องฟอก HEPA", 2400], ["ระบบฟอกอากาศทั้งห้อง", 7600]),
  },
  {
    id: "kitchen",
    th: "ชุดครัว",
    emoji: "🍳",
    cat: "comfort",
    place: "floor",
    desc: "ทำกับข้าวเองได้ กลิ่นฟุ้งหน่อย",
    traits: { cooking: 4, comfort: 1, social: 1, clean: -1 },
    grades: g(["เตาไฟฟ้าตัวเดียว", 700], ["ครัวบิลท์อินเล็ก", 3200], ["ครัวเชฟพร้อมเตาอบ", 11500]),
  },
  {
    id: "fridge",
    th: "ตู้เย็น",
    emoji: "🧊",
    cat: "basic",
    place: "floor",
    desc: "เก็บของสดของหวาน ตัวใหญ่กินที่",
    traits: { cooking: 2, comfort: 2, tech: 1, minimal: -1 },
    grades: g(["ตู้เย็นมินิ", 650], ["ตู้เย็นสองประตู", 2600], ["ตู้เย็นไซด์บายไซด์", 8400]),
  },
  {
    id: "bathtub",
    th: "อ่างอาบน้ำ",
    emoji: "🛁",
    cat: "comfort",
    place: "floor",
    desc: "แช่น้ำอุ่นคลายเหนื่อย พื้นเปียกหน่อยนะ",
    traits: { spa: 4, luxury: 2, comfort: 1, clean: -1 },
    grades: g(["อ่างพลาสติก", 800], ["อ่างเซรามิกขาว", 4000], ["จากุซซี่น้ำวน", 13500]),
  },
  {
    id: "smartlock",
    th: "กลอนประตูดิจิทัล",
    emoji: "🔐",
    cat: "safety",
    place: "wall",
    desc: "ล็อกแน่นหนา อุ่นใจ",
    traits: { safety: 4, tech: 1 },
    grades: g(["กลอนสองชั้น", 400], ["ดิจิทัลล็อกสแกนนิ้ว", 2200], ["ระบบสแกนใบหน้า", 7200]),
  },
  {
    id: "cctv",
    th: "กล้องวงจรปิด",
    emoji: "📹",
    cat: "safety",
    place: "wall",
    desc: "เห็นทุกมุม ปลอดภัยทุกคืน แต่รู้สึกถูกส่อง",
    traits: { safety: 3, tech: 1, comfort: -1 },
    grades: g(["กล้องจิ๋ว", 450], ["กล้อง 2K หมุนได้", 1900], ["ระบบ AI ตรวจจับคนแปลกหน้า", 6800]),
  },
  {
    id: "fireext",
    th: "ชุดอุปกรณ์ฉุกเฉิน",
    emoji: "🧯",
    cat: "safety",
    place: "floor",
    desc: "ถังดับเพลิง + ไฟฉุกเฉิน",
    traits: { safety: 3, clean: 1 },
    grades: g(["ถังดับเพลิงเล็ก", 300], ["ชุดฉุกเฉินครบชุด", 1500], ["ระบบสปริงเกอร์อัตโนมัติ", 6200]),
  },
  {
    id: "gym",
    th: "อุปกรณ์ออกกำลังกาย",
    emoji: "🏋️",
    cat: "hobby",
    place: "floor",
    desc: "ปั๊มกล้ามในห้องเลย เสียงดังเหงื่อเยอะ",
    traits: { fitness: 4, quiet: -1, clean: -1 },
    grades: g(["ดัมเบลคู่", 500], ["ม้านั่งบาร์เบล", 2600], ["มินิยิมครบเซ็ต", 8800]),
  },
  {
    id: "yoga",
    th: "มุมโยคะ",
    emoji: "🧘",
    cat: "hobby",
    place: "floor",
    desc: "ยืดเส้นยืดสาย ใจสงบ",
    traits: { fitness: 2, spa: 2, quiet: 1 },
    grades: g(["เสื่อโยคะ", 250], ["ชุดโยคะพร้อมบล็อก", 1200], ["สตูดิโอโยคะพร้อมกระจก", 5400]),
  },
  {
    id: "soundproof",
    th: "ผนังกันเสียง",
    emoji: "🔇",
    cat: "safety",
    place: "wall",
    desc: "โลกภายนอกเงียบลงทันที ฟังเพลงเพลิน",
    traits: { quiet: 4, sleep: 1, music: 1 },
    grades: g(["แผ่นซับเสียงโฟม", 600], ["ผนังซับเสียงบุผ้า", 2800], ["ห้องเก็บเสียงระดับสตูดิโอ", 9600]),
  },
  {
    id: "robot",
    th: "หุ่นยนต์ดูดฝุ่น",
    emoji: "🤖",
    cat: "green",
    place: "floor",
    desc: "ห้องสะอาดโดยไม่ต้องขยับ มีเสียงวี้ ๆ หน่อย",
    traits: { clean: 3, tech: 2, quiet: -1 },
    grades: g(["เครื่องดูดฝุ่นมือถือ", 450], ["หุ่นยนต์ดูดฝุ่น", 2400], ["หุ่นยนต์ถูพื้นอัตโนมัติ", 7400]),
  },
  {
    id: "clock",
    th: "นาฬิกาวินเทจ",
    emoji: "🕰️",
    cat: "deco",
    place: "wall",
    desc: "กลิ่นอายยุคเก่า เสียงติ๊กต๊อกทั้งคืน",
    traits: { vintage: 4, quiet: -1 },
    grades: g(["นาฬิกาแขวนพลาสติก", 200], ["นาฬิกาไม้โบราณ", 1600], ["นาฬิกาลูกตุ้มสะสม", 7800]),
  },
  {
    id: "gamingsetup",
    th: "มุมเกมมิ่ง",
    emoji: "🎮",
    cat: "hobby",
    place: "floor",
    desc: "จอโค้ง ไฟ RGB เต็มระบบ เล่นดึกเสียงดัง",
    traits: { gaming: 4, tech: 2, social: 1, quiet: -2, sleep: -1 },
    grades: g(["เครื่องเกมพกพา", 800], ["คอนโซล + จอ", 3600], ["เกมมิ่งเซ็ตอัพ 3 จอ", 12500]),
  },
  {
    id: "partylight",
    th: "ไฟปาร์ตี้",
    emoji: "🪩",
    cat: "deco",
    place: "wall",
    desc: "เปลี่ยนห้องเป็นคลับย่อม ๆ คนชอบสงบหนีหมด",
    traits: { social: 4, music: 1, light: 2, quiet: -3, sleep: -2 },
    grades: g(["ไฟเส้น LED", 300], ["ลูกบอลดิสโก้", 1500], ["ระบบไฟเวทีซิงก์เพลง", 6600]),
  },
  {
    id: "shelf",
    th: "ชั้นวางมินิมอล",
    emoji: "⬜",
    cat: "deco",
    place: "wall",
    desc: "เรียบ เท่ ดูแพง วางหนังสือได้",
    traits: { minimal: 3, clean: 1, books: 1 },
    grades: g(["ชั้นลอยไม้", 280], ["ชั้นลอยดีไซเนอร์", 1400], ["ระบบชั้นบิลท์อินทั้งผนัง", 5800]),
  },
  {
    id: "diffuser",
    th: "เครื่องกระจายกลิ่น",
    emoji: "🕯️",
    cat: "deco",
    place: "floor",
    desc: "กลิ่นหอมผ่อนคลาย",
    traits: { spa: 3, clean: 2, nature: 1 },
    grades: g(["เทียนหอม", 150], ["ก้านไม้หอมพรีเมียม", 900], ["เครื่องพ่นอโรมาอัจฉริยะ", 4400]),
  },
  /* ------------------------------ ของใหม่ 10 ชนิด ------------------------------ */
  {
    id: "washing",
    th: "เครื่องซักผ้า",
    emoji: "🧺",
    cat: "basic",
    place: "floor",
    desc: "ผ้าหอมสะอาดทุกวัน ตอนปั่นเสียงดังหน่อย",
    traits: { clean: 3, comfort: 2, tech: 1, quiet: -1 },
    grades: g(["เครื่องซักผ้ามินิ", 700], ["เครื่องซักผ้าฝาหน้า", 2900], ["เครื่องซักอบอัจฉริยะ", 8900]),
  },
  {
    id: "coffee",
    th: "มุมกาแฟ",
    emoji: "☕",
    cat: "comfort",
    place: "floor",
    desc: "กลิ่นกาแฟหอมชวนเพื่อนมานั่ง แต่เลอะง่าย",
    traits: { cooking: 2, social: 3, comfort: 1, clean: -1 },
    grades: g(["ดริปกาแฟสด", 550], ["เครื่องชงเอสเพรสโซ", 2700], ["บาร์กาแฟพร้อมบาริสต้าโรบอท", 9800]),
  },
  {
    id: "bike",
    th: "จักรยานออกกำลังกาย",
    emoji: "🚲",
    cat: "hobby",
    place: "floor",
    desc: "ปั่นเบิร์นในห้อง ฟิตหุ่นไม่ต้องออกบ้าน",
    traits: { fitness: 4, tech: 1, quiet: -1 },
    grades: g(["จักรยานปั่นมือสอง", 650], ["จักรยานปั่นมีจอ", 3100], ["จักรยานปั่น VR ท่องโลก", 10200]),
  },
  {
    id: "easel",
    th: "ขาตั้งวาดรูป",
    emoji: "🎨",
    cat: "hobby",
    place: "floor",
    desc: "มุมศิลปินส่วนตัว สีเลอะพื้นบ้าง",
    traits: { art: 4, vintage: 1, clean: -1 },
    grades: g(["สมุดสเก็ตช์+สีไม้", 350], ["ขาตั้งไม้พร้อมสีน้ำ", 1900], ["สตูดิโอศิลปินพร้อมไฟ", 7600]),
  },
  {
    id: "birdcage",
    th: "กรงนก",
    emoji: "🦜",
    cat: "green",
    place: "floor",
    desc: "น้องนกร้องเพลงทุกเช้า ตื่นพร้อมกันทั้งห้อง",
    traits: { pets: 3, nature: 2, music: 1, quiet: -2, clean: -1 },
    grades: g(["กรงนกหงส์หยก", 480], ["กรงใหญ่พร้อมคอนไม้", 2300], ["กรงนกแก้วพูดได้", 8100]),
  },
  {
    id: "projector",
    th: "โปรเจกเตอร์",
    emoji: "📽️",
    cat: "hobby",
    place: "wall",
    desc: "โรงหนังส่วนตัว ชวนเพื่อนมาดูหนัง ต้องปิดไฟ",
    traits: { tech: 3, social: 2, gaming: 1, comfort: 1, sleep: -1, light: -1 },
    grades: g(["โปรเจกเตอร์พกพา", 850], ["โปรเจกเตอร์ Full HD", 3900], ["โปรเจกเตอร์เลเซอร์ 4K", 11800]),
  },
  {
    id: "safe",
    th: "ตู้นิรภัย",
    emoji: "🔒",
    cat: "safety",
    place: "floor",
    desc: "ของมีค่าเก็บปลอดภัย อุ่นใจสุด ๆ",
    traits: { safety: 4, luxury: 2, minimal: -1 },
    grades: g(["กล่องนิรภัยเล็ก", 600], ["ตู้นิรภัยกันไฟ", 2800], ["ตู้นิรภัยสแกนม่านตา", 9600]),
  },
  {
    id: "massage",
    th: "เก้าอี้นวด",
    emoji: "💆",
    cat: "comfort",
    place: "floor",
    desc: "นวดผ่อนคลายเหมือนมีสปาส่วนตัว",
    traits: { spa: 4, comfort: 3, luxury: 1, fitness: 1 },
    grades: g(["เบาะนวดไฟฟ้า", 950], ["เก้าอี้นวดปรับเอน", 4200], ["แคปซูลนวดทั้งตัว", 13200]),
  },
  {
    id: "hammock",
    th: "เปลญวน",
    emoji: "🏖️",
    cat: "green",
    place: "floor",
    desc: "นอนแกว่งชิล ๆ กลางธรรมชาติ",
    traits: { spa: 3, nature: 2, sleep: 2, comfort: 1 },
    grades: g(["เปลผูกเชือก", 320], ["เปลญวนมีขาตั้ง", 1600], ["เปลไฟฟ้าปรับอุณหภูมิ", 6300]),
  },
  {
    id: "telescope",
    th: "กล้องดูดาว",
    emoji: "🔭",
    cat: "hobby",
    place: "floor",
    desc: "ส่องดาวยามค่ำคืน เงียบสงบโรแมนติก",
    traits: { tech: 3, nature: 1, quiet: 1, vintage: 1 },
    grades: g(["กล้องส่องทางไกล", 500], ["กล้องดูดาวตั้งพื้น", 2600], ["หอดูดาวดิจิทัลติดตามดาว", 9400]),
  },
];

export const FURNITURE: FurnitureDef[] = [...ORIGINAL_FURNITURE, ...EXTRA_FURNITURE];
export const FURNITURE_MAP: Record<string, FurnitureDef> = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));

export const ZONES: PlaceType[] = ["floor", "loft", "wall", "terrace", "nook", "surface", "ceiling"];
export const ZONE_LABEL: Record<PlaceType, string> = { floor: "พื้นชั้นล่าง", loft: "ชั้นสอง", wall: "ผนัง", terrace: "สวนและระเบียง", nook: "มุมหน้าห้อง", surface: "ชั้นวางบิลท์อิน", ceiling: "เพดาน" };
const OUTDOOR = new Set(["plant", "lamp", "chair", "yoga", "hammock", "telescope", "birdcage", "petbed", "coffee"]);
const SMALL = new Set(["plant", "lamp", "chair", "diffuser", "purifier", "robot", "fireext", "safe", "speaker"]);
export function allowedZones(def: FurnitureDef): PlaceType[] {
  if (def.zones) return def.zones;
  if (def.place === "wall") return ["wall", ...(["chandelier", "partylight", "aircon"].includes(def.id) ? ["ceiling" as const] : [])];
  return ["floor", "loft", ...(OUTDOOR.has(def.id) ? ["terrace" as const] : []), ...(SMALL.has(def.id) ? ["nook" as const] : []), ...(def.id === "diffuser" ? ["surface" as const] : [])];
}

export const GRADE_LABEL = ["ธรรมดา", "สบาย", "สบายสุด ๆ"];
export const GRADE_COLOR = ["#a9b4c9", "#7fd5ff", "#ffd166"];

const RARITY_META: Record<FurnitureRarity, { th: string; color: string }> = {
  common: { th: "ธรรมดา", color: "#a9b4c9" },
  uncommon: { th: "ไม่ธรรมดา", color: "#7ee6a8" },
  rare: { th: "หายาก", color: "#7fd5ff" },
  epic: { th: "มหากาพย์", color: "#c8a2ff" },
  legendary: { th: "ตำนาน", color: "#ffd166" },
};

const CAT_LABEL: Record<CatId, string> = {
  basic: "พื้นฐาน",
  comfort: "ความสะดวกสบาย",
  hobby: "งานอดิเรก",
  safety: "ความปลอดภัย",
  green: "ธรรมชาติ",
  deco: "ตกแต่ง",
};

function rarityOf(def: FurnitureDef): FurnitureRarity {
  const topCost = def.grades[2].cost;
  if (topCost >= 12000) return "legendary";
  if (topCost >= 8000) return "epic";
  if (topCost >= 4000) return "rare";
  if (topCost >= 1500) return "uncommon";
  return "common";
}

/** Derives readable, mixed furniture status from the preference traits. */
export function furnitureMeta(def: FurnitureDef, grade = 0): FurnitureMeta {
  const mult = def.grades[grade]?.mult ?? 1;
  const t = def.traits;
  const utility = (t.comfort ?? 0) * 0.7 + (t.tech ?? 0) * 0.5 + (t.cooking ?? 0) * 0.75 + (t.safety ?? 0) * 0.55 + (t.fitness ?? 0) * 0.3;
  const hygiene = (t.clean ?? 0) * 0.9 + (t.nature ?? 0) * 0.25 + (t.pets ?? 0) * -0.35 + (t.cooking ?? 0) * -0.2;
  const prestige = (t.luxury ?? 0) * 0.9 + (t.art ?? 0) * 0.65 + (t.vintage ?? 0) * 0.35 + (t.tech ?? 0) * 0.2;
  const noise = (t.music ?? 0) * 0.65 + (t.social ?? 0) * 0.45 + (t.gaming ?? 0) * 0.3 + (t.quiet ?? 0) * -0.6;
  const space = (t.minimal ?? 0) * 0.55 + (def.place === "wall" ? 0.5 : -0.2);
  const raw: FurnitureStatusLine[] = [
    { key: "utility", th: "ประโยชน์ใช้สอย", value: utility, positive: utility >= 0, emoji: "🧰" },
    { key: "hygiene", th: "ความสะอาด", value: hygiene, positive: hygiene >= 0, emoji: "🧼" },
    { key: "prestige", th: "ความหรูหรา", value: prestige, positive: prestige >= 0, emoji: "💎" },
    { key: "noise", th: "เสียงรบกวน", value: noise, positive: noise <= 0, emoji: "🔊" },
    { key: "space", th: "ประหยัดพื้นที่", value: space, positive: space >= 0, emoji: "📐" },
  ];
  return {
    typeTh: CAT_LABEL[def.cat],
    rarity: rarityOf(def),
    rarityTh: RARITY_META[rarityOf(def)].th,
    rarityColor: RARITY_META[rarityOf(def)].color,
    status: raw
      .map((line) => ({ ...line, value: Math.round(line.value * mult * 10) / 10 }))
      .filter((line) => Math.abs(line.value) >= 0.2),
  };
}

/** ค่าเช่าที่เฟอร์นิเจอร์ช่วยดันขึ้น ต่อวัน */
export function furnitureValue(defId: string, grade: number): number {
  const def = FURNITURE_MAP[defId];
  if (!def) return 0;
  return Math.round(def.grades[grade].cost * 0.02);
}
