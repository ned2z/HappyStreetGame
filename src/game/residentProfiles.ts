import type { TraitId } from "./traits";
import type { NewActivityId } from "./activities";

export interface SpecialRequirements {
  level: number;
  cleanliness: number;
  premiumItems: number;
  privacy: number;
  outdoorTrait: TraitId;
  outdoorScore: number;
  satisfaction: number;
}
export interface ResidentProfile {
  id: string;
  name: string;
  job: string;
  bio: string;
  likes: TraitId[];
  dislike: TraitId;
  habits: NewActivityId[];
  color: string;
  special: boolean;
  requirements?: SpecialRequirements;
  budget: number;
}

function resident(id: string, name: string, job: string, likes: TraitId[], dislike: TraitId, habits: NewActivityId[], color: string, bio: string): ResidentProfile {
  return { id, name, job, likes, dislike, habits, color, bio, special: false, budget: 1.25 + likes.length * 0.09 };
}

export const NEW_RESIDENTS: ResidentProfile[] = [
  resident("r-pun", "ปัน", "นักแปลวรรณกรรม", ["books", "quiet", "comfort"], "music", ["journal", "makeTea", "meditate"], "#bca487", "อยากมีมุมอ่านหนังสือเงียบ ๆ หลังเลิกงาน"),
  resident("r-nara", "นารา", "นักออกแบบสวน", ["nature", "spa", "light"], "gaming", ["birdwatch", "freshAir", "sketch"], "#92b59c", "เห็นสีเขียวแล้วความเหนื่อยหายไปครึ่งหนึ่ง"),
  resident("r-kiri", "คิริ", "นักพัฒนาแอป", ["tech", "gaming", "minimal"], "vintage", ["videoCall", "planDay", "stretch"], "#95adc7", "ขอเน็ตดี โต๊ะเป็นระเบียบ และไม่รบกวนใคร"),
  resident("r-mochi", "โมจิ", "นักทำขนม", ["cooking", "clean", "social"], "pets", ["eatSnack", "makeTea", "washHands"], "#d4adab", "ถ้าครัวดีจะอบขนมมาแบ่งเพื่อนบ้าน"),
  resident("r-porjai", "พอใจ", "ผู้สอนโยคะ", ["fitness", "spa", "quiet"], "gaming", ["stretch", "meditate", "briskWalk"], "#b4b09a", "ร่างกายกับใจต้องได้พักพอ ๆ กัน"),
  resident("r-rin", "ริน", "นักวาดภาพประกอบ", ["art", "light", "nature"], "minimal", ["sketch", "selfie", "birdwatch"], "#c3a5cc", "แสงเช้ากับโต๊ะวาดรูปคือความสุขเล็ก ๆ"),
  resident("r-tao", "เต๋า", "วิศวกรระบบ", ["safety", "tech", "quiet"], "social", ["checkLock", "planDay", "inspectLoft"], "#8fa8b2", "ขอตรวจระบบบ้านให้มั่นใจก่อนนอน"),
  resident("r-fahmai", "ฟ้าใหม่", "ครูดนตรี", ["music", "art", "comfort"], "minimal", ["humming", "dance", "greetNeighbor"], "#aab7d6", "ชอบดนตรีแต่จะพยายามซ้อมไม่ดึก"),
  resident("r-sai", "สายไหม", "พยาบาลเด็ก", ["clean", "sleep", "safety"], "music", ["washHands", "yawn", "phoneCall"], "#d6c2d4", "หลังเข้าเวรอยากกลับมานอนอย่างสบายใจ"),
  resident("r-bento", "เบนโตะ", "เชฟอาหารญี่ปุ่น", ["cooking", "minimal", "clean"], "pets", ["foldLaundry", "eatSnack", "planDay"], "#b5c2a8", "ครัวเล็กก็ทำอาหารดีได้ถ้าจัดของเป็น"),
  resident("r-aun", "อุ่น", "นักจิตวิทยา", ["spa", "quiet", "books"], "social", ["meditate", "journal", "makeTea"], "#ccbaa3", "อยากกลับมาพักในที่ที่ใจไม่ต้องเร่งรีบ"),
  resident("r-tonhom", "ต้นหอม", "ผู้ดูแลสัตว์", ["pets", "nature", "comfort"], "luxury", ["feedPet", "birdwatch", "freshAir"], "#a0bba2", "ถ้าสัตว์เลี้ยงมีความสุข เราก็มีความสุข"),
  resident("r-neo", "นีโอ", "นักกีฬาอีสปอร์ต", ["gaming", "tech", "comfort"], "vintage", ["videoCall", "stretch", "celebrate"], "#9b9cc9", "เล่นเกมจริงจัง แต่พักสายตาตามเวลา"),
  resident("r-ploysai", "พลอยใส", "ภัณฑารักษ์", ["art", "vintage", "luxury"], "gaming", ["sketch", "inspectLoft", "journal"], "#c1a386", "ของชิ้นโปรดต้องมีพื้นที่ให้เล่าเรื่อง"),
  resident("r-kaofoon", "ข้าวฟ่าง", "นักโภชนาการ", ["fitness", "cooking", "clean"], "social", ["eatSnack", "briskWalk", "washHands"], "#c3b57f", "อยากมีครัวสำหรับมื้อสุขภาพของตัวเอง"),
  resident("r-sunday", "ซันเดย์", "ช่างภาพท่องเที่ยว", ["light", "nature", "art"], "sleep", ["selfie", "stargaze", "freshAir"], "#d4b78c", "ทุกมุมบ้านมีภาพดี ๆ ซ่อนอยู่"),
  resident("r-namwan", "น้ำหวาน", "บาริสต้าชา", ["spa", "social", "cooking"], "tech", ["makeTea", "greetNeighbor", "phoneCall"], "#c9ada1", "แก้วชาอุ่น ๆ ช่วยให้เพื่อนบ้านคุยกันง่ายขึ้น"),
  resident("r-pakin", "ภาคิน", "นักบัญชีอิสระ", ["minimal", "safety", "books"], "music", ["planDay", "checkLock", "journal"], "#a7b4ae", "ห้องเป็นระเบียบช่วยให้ทำงานได้ทั้งวัน"),
  resident("r-mira", "มีรา", "นักวิจัยสิ่งแวดล้อม", ["nature", "tech", "clean"], "luxury", ["birdwatch", "videoCall", "inspectLoft"], "#89b5b4", "ชอบบ้านที่ใช้ทรัพยากรอย่างคุ้มค่า"),
  resident("r-haru", "ฮานะ", "นักเย็บตุ๊กตา", ["art", "vintage", "quiet"], "social", ["foldLaundry", "sketch", "shyWave"], "#d1b2ba", "โต๊ะทำงานเล็ก ๆ กับเพลงเบา ๆ ก็พอใจแล้ว"),
];

function special(index: number, name: string, job: string, likes: TraitId[], dislike: TraitId, color: string, line: string): ResidentProfile {
  const gardenPreferences: Partial<Record<TraitId, TraitId>> = { music: "art", books: "nature", sleep: "quiet", fitness: "nature", gaming: "tech" };
  return {
    id: `special-${index}`, name, job, likes, dislike, color, special: true, bio: line,
    habits: ["inspectLoft", "planDay", index % 2 ? "complain" : "meditate"],
    budget: Math.round((2.8 + (index % 6) * 0.25) * 100) / 100,
    requirements: { level: index % 3 === 0 ? 5 : 4, cleanliness: 90 + (index % 5) * 2, premiumItems: 4 + index % 3,
      privacy: 14 + index % 4 * 2, outdoorTrait: gardenPreferences[likes[0]] ?? likes[0], outdoorScore: 6 + index % 3 * 2, satisfaction: 75 },
  };
}

export const SPECIAL_RESIDENTS: ResidentProfile[] = [
  special(0, "P'Ped", "นักสะสมบ้านระดับตำนาน", ["luxury", "clean", "comfort", "safety"], "pets", "#e4c46d", "ยอมจ่ายเต็มที่ แต่ทุกรายละเอียดต้องสมบูรณ์แบบ"),
  special(1, "KarnKeyes", "สถาปนิกสมาร์ทโฮม", ["tech", "minimal", "safety", "quiet"], "vintage", "#80cbdc", "บ้านฉลาดต้องไม่ส่งเสียงรบกวนและไม่รก"),
  special(2, "Unberler", "ภัณฑารักษ์คอลเลกชันหายาก", ["art", "books", "vintage", "luxury"], "gaming", "#b798ed", "รสนิยมที่ดีวัดจากรายละเอียด ไม่ใช่จำนวนของ"),
  special(3, "DoY", "นักกีฬาสายวินัย", ["fitness", "nature", "clean", "comfort"], "social", "#98ce86", "ที่พักต้องพร้อมสำหรับการฝึกและการฟื้นตัว"),
  special(4, "TokTek", "วิศวกรเสียง", ["music", "tech", "art", "safety"], "pets", "#e3a386", "เสียงดีต้องมาพร้อมระบบที่ดูแลอย่างดี"),
  special(5, "Nedyus", "นักวิจัยการนอน", ["sleep", "quiet", "spa", "comfort"], "light", "#929fe2", "อย่ารบกวนเวลาพัก และอย่าปล่อยให้ห้องสกปรก"),
  special(6, "Anna", "นักออกแบบสวนหรู", ["nature", "light", "luxury", "art"], "gaming", "#e1aece", "สวนด้านนอกต้องสวยไม่แพ้ภายในบ้าน"),
  special(7, "Boba", "นักชิมชาและของหวาน", ["cooking", "spa", "clean", "social"], "pets", "#c9ad8c", "มุมชาที่ดีต้องสะอาด สงบ และนั่งสบาย"),
  special(8, "Haruyes", "นักเขียนผู้รักฤดูใบไม้ผลิ", ["books", "nature", "quiet", "light"], "music", "#b8d788", "อยากให้บ้านเหมือนสวนเงียบ ๆ ที่มีห้องสมุด"),
  special(9, "KuKKui", "ผู้เชี่ยวชาญสัตว์เลี้ยง", ["pets", "nature", "safety", "comfort"], "luxury", "#e5b982", "ทุกชีวิตในบ้านต้องได้รับการดูแลเท่า ๆ กัน"),
  special(10, "TeeMOCA", "ผู้อำนวยการแกลเลอรี", ["art", "luxury", "light", "minimal"], "cooking", "#c2a3e1", "แสง สัดส่วน และพื้นที่ว่างต้องลงตัว"),
  special(11, "noni", "นักบำบัดด้วยความสงบ", ["quiet", "spa", "clean", "nature"], "social", "#a4d4c4", "ความสงบเป็นสิ่งจำเป็น ไม่ใช่สิ่งเสริม"),
  special(12, "TIME", "นักสะสมนาฬิกา", ["vintage", "luxury", "books", "safety"], "gaming", "#d4bc83", "บ้านต้องมีเรื่องราว และดูแลของสะสมได้จริง"),
  special(13, "HyperShark", "นักแข่งเกมระดับอาชีพ", ["gaming", "tech", "fitness", "comfort"], "vintage", "#6ebce3", "พร้อมจ่ายเพื่อระบบที่เสถียรและการพักที่ดี"),
  special(14, "Shell", "นักชีววิทยาทางทะเล", ["nature", "pets", "clean", "spa"], "music", "#87d3cf", "น้ำ อากาศ และความสะอาดต้องไว้ใจได้"),
  special(15, "Stang", "ผู้จัดการพลังงาน", ["tech", "nature", "minimal", "safety"], "luxury", "#adc67c", "อยากเห็นเทคโนโลยีที่ประหยัดจริง ไม่ใช่แค่สวย"),
  special(16, "MissA", "ดีไซเนอร์แฟชั่น", ["luxury", "art", "clean", "light"], "pets", "#df9faf", "ห้องต้องพร้อมสำหรับวันทำงานและวันพักผ่อน"),
  special(17, "Alizza", "เชฟอาหารเพื่อสุขภาพ", ["cooking", "clean", "nature", "comfort"], "gaming", "#deb48c", "ครัวสะอาดและสวนที่ดีคือมาตรฐานขั้นต่ำ"),
  special(18, "ROOT", "ผู้วางระบบความปลอดภัย", ["safety", "tech", "quiet", "minimal"], "social", "#88c5a5", "ระบบต้องปลอดภัย เป็นระเบียบ และตรวจสอบได้"),
  special(19, "WhiteBear", "นักเดินทางรักความสบาย", ["comfort", "sleep", "spa", "clean"], "music", "#b5d4ec", "ขอที่พักที่สบายที่สุด และรักษามาตรฐานทุกวัน"),
];

export const RESIDENT_PROFILES = [...NEW_RESIDENTS, ...SPECIAL_RESIDENTS];
export const PROFILE_MAP = Object.fromEntries(RESIDENT_PROFILES.map((p) => [p.id, p])) as Record<string, ResidentProfile>;