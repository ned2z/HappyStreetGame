import type { GameState, Room } from "../game/engine";
import { HOUSE_LEVELS, houseLevel } from "../game/houseLevels";
import { roomSystems } from "../game/equipment";
import { ZONES } from "../game/furniture";
import { houseStoryCount, zoneCapacity } from "../game/layout";
import { commonBenefits } from "../game/commons";

export function HouseLevelTrack({ room }: { room: Room }) {
  const current = houseLevel(room.level);
  return <section className="level-track" aria-label="ระดับบ้าน">
    <div className="flex items-center justify-between text-[11px]"><span className="text-white/55">HOUSE EVOLUTION</span><strong style={{ color: current.color }}>{current.en}</strong></div>
    <ol className="mt-3 grid grid-cols-5 gap-1.5">
      {HOUSE_LEVELS.map((level) => <li key={level.level} aria-current={room.level === level.level ? "step" : undefined} className={level.level <= room.level ? "level-step achieved" : "level-step"}>
        <span className="block font-mono text-base">{String(level.level).padStart(2, "0")}</span>
        <span className="block text-[9px]">{level.capacity} คน</span>
      </li>)}
    </ol>
    <p className="mt-2 text-[10px] leading-relaxed text-white/55">บ้าน {houseStoryCount(room.level)} ชั้น / พื้นที่ {ZONES.reduce((n, zone) => n + zoneCapacity(room.level, zone), 0)} ช่อง / ความคาดหวัง {current.need} แต้มต่อรสนิยม</p>
  </section>;
}

export function HouseSystems({ room, state }: { room: Room; state: GameState }) {
  const shared = commonBenefits(state, Math.floor(room.id / 3));
  const systems = roomSystems(room, shared.effects);
  return <section className="house-systems" aria-label="ความพร้อมของบ้าน">
    <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-semibold text-white/90">ความพร้อมของบ้าน</h3><span className="text-[11px] text-[#dbc38b]">ดูแล {systems.dailyCost.toLocaleString("th-TH")} ฿/วัน</span></div>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
      <div className="flex justify-between"><dt className="text-white/50">ที่นอน</dt><dd>{systems.beds}/{room.tenantIds.length} คน</dd></div>
      <div className="flex justify-between"><dt className="text-white/50">ที่นั่ง</dt><dd>{systems.seats}/{room.tenantIds.length} คน</dd></div>
      <div className="flex justify-between"><dt className="text-white/50">ความเป็นส่วนตัว</dt><dd>{systems.privacy.toFixed(1)}/{systems.privacyNeed.toFixed(1)}</dd></div>
      <div className="flex justify-between"><dt className="text-white/50">ใช้ไฟสุทธิ</dt><dd className={systems.overload ? "text-amber-200" : "text-emerald-200"}>{systems.powerUse.toFixed(1)}/{systems.powerCapacity}</dd></div>
      <div className="flex justify-between"><dt className="text-white/50">คุณภาพอากาศ</dt><dd>{systems.air.toFixed(1)}</dd></div>
      <div className="flex justify-between"><dt className="text-white/50">ความปลอดภัย</dt><dd>{systems.security.toFixed(1)}</dd></div>
      <div className="flex justify-between"><dt className="text-white/50">ลดเสียงขัดแย้ง</dt><dd>{Math.round(systems.noiseProtection * 100)}%</dd></div>
      <div className="flex justify-between"><dt className="text-white/50">ความสกปรกต่อวัน</dt><dd>{systems.decay.toFixed(1)}%</dd></div>
    </dl>
    <p className="mt-3 text-[10px] text-emerald-200/80">รวมโบนัสจากของส่วนกลาง {shared.count} ชิ้นแล้ว / ค่าดูแลสวนทั้งกลุ่ม {shared.upkeep} ฿/วันคิดแยกครั้งเดียว</p>
    {systems.issues.length > 0 ? <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
      {systems.issues.map((issue) => <p key={issue.id} className="text-[10px] leading-relaxed text-amber-100/85"><span className="mr-1 font-mono text-amber-300">-{issue.loss}</span>{issue.text}</p>)}
    </div> : <p className="mt-3 border-t border-white/10 pt-2 text-[10px] text-emerald-200">ระบบพื้นฐานพร้อมสำหรับจำนวนผู้เช่าปัจจุบัน</p>}
    <p className="mt-2 text-[9px] text-white/40">เกณฑ์คนทั่วไป {room.level === 5 ? 42 : room.level >= 3 ? 37 : 32}% / ผู้เช่าพิเศษ 75% หากต่ำกว่าเกณฑ์ต่อเนื่องจะเริ่มคิดย้ายออก</p>
  </section>;
}