import type { TraitId } from "./traits";

export type ActivityDestination = "home" | "loft" | "terrace" | "door" | "furniture";
export type Expression = "happy" | "focused" | "sleepy" | "shy" | "surprised" | "annoyed" | "calm";
export interface ActivityDefinition {
  th: string;
  emoji: string;
  durationMs: number;
  color: string;
  destination: ActivityDestination;
  trait: TraitId;
  habit: string;
  expression: Expression;
  lines: readonly [string, string, string];
  items: readonly string[];
  prop: "none" | "book" | "cup" | "phone" | "brush" | "broom" | "can" | "parcel" | "towel" | "weights";
}
const def = (th: string, seconds: number, destination: ActivityDestination, trait: TraitId, habit: string,
  expression: Expression, lines: ActivityDefinition["lines"], items: readonly string[] = [],
  prop: ActivityDefinition["prop"] = "none"): ActivityDefinition => ({
  th, durationMs: seconds * 1000, destination, trait, habit, expression, lines, items, prop,
  emoji: "", color: destination === "terrace" ? "#b4e1af" : destination === "loft" ? "#c4b4f4" : "#e6c4a1",
});

const BASE_ACTIVITIES = {
  idle: def("พักสายตา", 18, "home", "comfort", "สบาย ๆ", "calm", ["ขอพักสักครู่นะ", "วันนี้ค่อย ๆ ทำทีละอย่าง", "ขอที่สงบสักหน่อย"]),
  reading: def("นั่งอ่านหนังสือ", 60, "furniture", "books", "หนอนหนังสือ", "focused", ["อีกบทเดียว... จริง ๆ นะ", "เรื่องนี้อ่านแล้ววางไม่ลงเลย", "เสียงดังจนอ่านไม่รู้เรื่องเลย"], ["bookshelf", "desk"], "book"),
  sleeping: def("นอนหลับ", 120, "furniture", "sleep", "นอนเต็มอิ่ม", "sleepy", ["ฝันดีนะทุกคน", "ขอชาร์จพลังสองนาที", "ขอนอนเงียบ ๆ หน่อยนะ"], ["bed", "hammock"]),
  exercising: def("ออกกำลังกาย", 60, "furniture", "fitness", "สายสุขภาพ", "focused", ["อีกสิบครั้งก็ครบแล้ว", "สุขภาพดีเริ่มที่วันนี้", "พื้นที่น้อยไปหน่อยนะ"], ["gym", "yoga", "bike"], "weights"),
  cooking: def("ทำอาหาร", 90, "furniture", "cooking", "รักการทำอาหาร", "happy", ["หอมแล้ว ใครหิวบ้าง", "วันนี้จะลองเมนูใหม่", "ครัวต้องจัดให้เป็นระเบียบหน่อย"], ["kitchen"], "brush"),
  gaming: def("เล่นเกม", 100, "furniture", "gaming", "ชอบการแข่งขัน", "focused", ["ตานี้ต้องชนะให้ได้", "ขอเซฟก่อนแล้วค่อยพัก", "เน็ตอย่าเพิ่งหลุดนะ"], ["pc", "gamingsetup", "tv"], "phone"),
  music: def("ฟังเพลง", 75, "furniture", "music", "มีดนตรีในใจ", "happy", ["เพลงโปรดมาแล้ว", "เปิดเบา ๆ ก็เพราะนะ", "อยากมีมุมฟังเพลงของตัวเอง"], ["speaker", "piano"]),
  watering: def("รดน้ำต้นไม้", 45, "furniture", "nature", "มือเย็น", "calm", ["โตไว ๆ นะเจ้าต้นน้อย", "ใบใหม่ออกมาแล้ว ดีใจจัง", "ต้องหามุมที่แสงดีกว่านี้"], ["plant", "greenwall"], "can"),
  cleaning: def("ทำความสะอาด", 50, "home", "clean", "รักสะอาด", "focused", ["สะอาดแล้วสบายใจ", "ช่วยกันดูแลห้องนะ", "ทำไมฝุ่นกลับมาไวขนาดนี้"], [], "broom"),
  relaxing: def("ผ่อนคลาย", 90, "furniture", "spa", "รักความสบาย", "calm", ["มุมนี้สบายที่สุดเลย", "สูดหายใจลึก ๆ", "อยากให้ห้องเงียบกว่านี้หน่อย"], ["sofa", "bathtub", "massage", "diffuser"]),
  socializing: def("คุยกับรูมเมต", 70, "home", "social", "ช่างพูด", "happy", ["วันนี้เป็นยังไงบ้าง", "เย็นนี้กินข้าวด้วยกันไหม", "เรามาตกลงเรื่องเสียงกันหน่อย"]),
};

/** Thirty complete behavior packs: a habit, destination, expression and three contextual lines each. */
export const EXTRA_ACTIVITIES = {
  stretch: def("บิดตัวรับวันใหม่", 32, "home", "fitness", "ตื่นเช้า", "happy", ["ยืดแขนหน่อย พร้อมเริ่มวันแล้ว", "หลังตรง หายใจลึก ๆ", "นั่งนานจนเมื่อยหมดแล้ว"]),
  meditate: def("นั่งสมาธิบนชั้นสอง", 60, "loft", "quiet", "ใจเย็น", "calm", ["ชั้นบนเงียบดีจัง", "หายใจเข้า... หายใจออก...", "ขอเวลาสงบใจสักครู่"]),
  makeTea: def("ชงชา", 40, "furniture", "spa", "ชอบดื่มชา", "calm", ["ชาร้อน ๆ ทำให้ใจสบาย", "ค่อย ๆ จิบ ไม่ต้องรีบ", "วันนี้ต้องการชาสักถ้วยจริง ๆ"], ["coffee", "kitchen"], "cup"),
  eatSnack: def("กินของว่าง", 38, "furniture", "cooking", "ชอบของว่าง", "happy", ["อร่อยจัง แบ่งให้ไหม", "เติมพลังสักนิด", "ใครกินขนมชิ้นสุดท้ายไปนะ"], ["fridge", "coffee", "kitchen"], "cup"),
  phoneCall: def("โทรหาครอบครัว", 55, "terrace", "social", "รักครอบครัว", "happy", ["แม่ ไม่ต้องห่วงนะ อยู่สบายดี", "คิดถึงบ้านจัง", "ออกมาคุยข้างนอกดีกว่า"], [], "phone"),
  selfie: def("ถ่ายรูปมุมโปรด", 26, "terrace", "art", "มั่นใจ", "happy", ["แสงสวยมาก ขออีกรูป", "ยิ้มหน่อย หนึ่ง สอง สาม", "วันนี้มุมไหนก็ไม่ถูกใจเลย"], [], "phone"),
  journal: def("เขียนบันทึก", 65, "furniture", "books", "ช่างคิด", "focused", ["วันนี้มีเรื่องดี ๆ ให้จดเยอะเลย", "จดไว้ก่อน เดี๋ยวลืม", "ขอเขียนระบายสักหน่อย"], ["desk"], "book"),
  sketch: def("วาดภาพ", 70, "furniture", "art", "สร้างสรรค์", "focused", ["สีนี้เข้ากันดีมาก", "อีกเส้นเดียวก็เสร็จ", "แสงตรงนี้ไม่พอวาดรูปเลย"], ["easel", "desk"], "brush"),
  dance: def("เต้นเบา ๆ", 35, "home", "music", "ร่าเริง", "happy", ["จังหวะนี้ห้ามอยู่นิ่ง", "เต้นเบา ๆ ไม่รบกวนใคร", "เต้นไล่ความเครียดหน่อย"]),
  humming: def("ฮัมเพลงบนชั้นสอง", 30, "loft", "music", "อารมณ์ศิลปิน", "calm", ["ทำนองนี้ติดหัวทั้งวันเลย", "ลาลา... เบา ๆ พอ", "เพลงช่วยให้อารมณ์ดีขึ้นหน่อย"]),
  feedPet: def("ให้อาหารสัตว์เลี้ยง", 40, "furniture", "pets", "อ่อนโยน", "happy", ["ได้เวลากินข้าวแล้วเจ้าตัวเล็ก", "ค่อย ๆ กินนะ", "ชามเลอะอีกแล้ว เดี๋ยวล้างให้"], ["petbed", "birdcage", "aquarium"], "cup"),
  foldLaundry: def("พับเสื้อผ้า", 45, "furniture", "clean", "เป็นระเบียบ", "focused", ["พับเสร็จแล้วห้องโล่งขึ้นเลย", "ตัวนี้ใส่พรุ่งนี้ดีกว่า", "ต้องแยกผ้าสีอีกแล้ว"], ["wardrobe", "washing"], "towel"),
  brushHair: def("หวีผม", 22, "home", "luxury", "พิถีพิถัน", "focused", ["เรียบร้อย พร้อมออกไปแล้ว", "ผมชี้อีกแล้วนะ", "วันนี้ผมไม่ยอมเข้าทรงเลย"], [], "brush"),
  brushTeeth: def("แปรงฟัน", 35, "home", "clean", "ดูแลตัวเอง", "focused", ["ฟันสะอาด ยิ้มมั่นใจ", "ต้องแปรงให้ครบทุกซี่", "ลืมซื้อยาสีฟันอีกแล้ว"], [], "brush"),
  washHands: def("ล้างมือ", 22, "home", "clean", "รักอนามัย", "calm", ["ล้างมือก่อนกินข้าวนะ", "สะอาดแล้ว", "สบู่หมดเร็วจริง ๆ"]),
  dustShelf: def("ปัดฝุ่นชั้นวาง", 35, "furniture", "clean", "เจ้าระเบียบ", "focused", ["เห็นสะอาดแบบนี้แล้วชื่นใจ", "ซอกนี้ก็ต้องเช็ดด้วย", "ฝุ่นซ่อนอยู่ตรงนี้เอง"], ["bookshelf", "shelf"], "towel"),
  checkLock: def("ตรวจประตูห้อง", 20, "door", "safety", "รอบคอบ", "focused", ["ล็อกเรียบร้อย อุ่นใจแล้ว", "ขอตรวจอีกครั้งให้แน่ใจ", "ออกห้องแล้วอย่าลืมล็อกนะ"]),
  planDay: def("วางแผนวันพรุ่งนี้", 50, "furniture", "books", "มีวินัย", "focused", ["ทำตามแผนได้ครบเลย", "พรุ่งนี้เริ่มจากเรื่องนี้ก่อน", "งานเยอะจนต้องจัดใหม่หมด"], ["desk", "pc"], "book"),
  videoCall: def("ประชุมออนไลน์", 75, "furniture", "tech", "รับผิดชอบ", "focused", ["ได้ยินชัดเจนครับ", "เดี๋ยวแชร์หน้าจอให้นะ", "ขอเงียบหน่อย กำลังประชุมอยู่"], ["pc", "gamingsetup"], "phone"),
  stargaze: def("มองท้องฟ้า", 55, "terrace", "nature", "ช่างฝัน", "calm", ["ท้องฟ้ากว้างดีจัง", "คืนนี้จะเห็นดาวไหมนะ", "อยากออกมาสูดอากาศบ้าง"]),
  birdwatch: def("มองหานก", 40, "terrace", "nature", "ช่างสังเกต", "surprised", ["นกตัวนั้นสีสวยจัง", "ได้ยินเสียงจากต้นไม้โน้น", "เสียงดังจนนกบินหนีหมดแล้ว"]),
  freshAir: def("รับลมนอกห้อง", 45, "terrace", "nature", "รักอิสระ", "calm", ["ลมเย็นกำลังดีเลย", "ออกมาพักสายตาสักนิด", "อยู่แต่ในห้องแล้วอึดอัด"]),
  collectParcel: def("รับพัสดุหน้าห้อง", 28, "door", "tech", "ขี้สงสัย", "surprised", ["ของมาถึงแล้ว ตื่นเต้นจัง", "กล่องนี้ของเราหรือเปล่า", "รอตั้งนาน ในที่สุดก็มา"], [], "parcel"),
  greetNeighbor: def("ทักทายเพื่อนบ้าน", 32, "terrace", "social", "เป็นมิตร", "happy", ["สวัสดี ไปทำงานเหรอ", "มีอะไรให้ช่วยก็บอกนะ", "วันนี้ขอคุยสั้น ๆ ก่อนนะ"]),
  briskWalk: def("เดินยืดเส้นนอกห้อง", 60, "terrace", "fitness", "กระฉับกระเฉง", "happy", ["เดินครบอีกหนึ่งรอบแล้ว", "ขยับตัวบ้างจะได้ไม่เมื่อย", "นั่งนานไปแล้ว ต้องเดินหน่อย"]),
  inspectLoft: def("เดินสำรวจชั้นสอง", 42, "loft", "books", "นักสำรวจ", "surprised", ["ขึ้นมาแล้วเห็นห้องอีกมุมเลย", "มุมนี้จัดอะไรดีนะ", "ขอพื้นที่ชั้นบนเพิ่มหน่อย"]),
  yawn: def("หาวแล้วขยี้ตา", 18, "home", "sleep", "ขี้เซา", "sleepy", ["ง่วงแล้วสิ เตียงเรียกหา", "ขอหลับตานิดเดียว", "เมื่อคืนได้นอนไม่เต็มอิ่มเลย"]),
  celebrate: def("ดีใจจนปรบมือ", 16, "home", "comfort", "มองโลกบวก", "happy", ["เย้ วันนี้มีแต่เรื่องดี ๆ", "เก่งมาก ให้รางวัลตัวเองหน่อย", "ไม่เป็นไร เดี๋ยวก็ดีขึ้น"]),
  complain: def("บ่นแล้วถอนหายใจ", 20, "home", "safety", "พูดตรง", "annoyed", ["ทุกอย่างดีแล้ว แค่ขอบ่นนิดเดียว", "มีอะไรต้องปรับอีกไหมนะ", "ขอคุยเรื่องห้องหน่อยได้ไหม"]),
  shyWave: def("โบกมืออย่างเขิน ๆ", 18, "door", "quiet", "ขี้อาย", "shy", ["สวัสดี... วันนี้อากาศดีนะ", "เราเอาขนมมาฝาก", "ขอโทษนะ ขอเดินผ่านหน่อย"]),
} as const;

export type NewActivityId = keyof typeof EXTRA_ACTIVITIES;
export type ActivityId = keyof typeof BASE_ACTIVITIES | NewActivityId;
export const ACTIVITY_INFO: Record<ActivityId, ActivityDefinition> = { ...BASE_ACTIVITIES, ...EXTRA_ACTIVITIES };
export const NEW_ACTIVITY_IDS = Object.keys(EXTRA_ACTIVITIES) as NewActivityId[];
export const ALL_ACTIVITY_IDS = Object.keys(ACTIVITY_INFO) as ActivityId[];

export function habitsFor(id: string): NewActivityId[] {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return [NEW_ACTIVITY_IDS[hash % 30], NEW_ACTIVITY_IDS[(hash + 11) % 30], NEW_ACTIVITY_IDS[(hash + 23) % 30]];
}
export function activityLine(activity: ActivityId, satisfaction: number, variant = 0) {
  const definition = ACTIVITY_INFO[activity];
  return definition.lines[satisfaction < 35 ? 2 : variant % 2];
}