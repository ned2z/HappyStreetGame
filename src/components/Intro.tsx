import { useState } from "react";
import { Btn } from "./ui";
import { FURNITURE } from "../game/furniture";
import { EXTRA_ACTIVITIES } from "../game/activities";
import { runRegressionChecks, type CheckResult } from "../game/regression";
import { SPECIAL_RESIDENTS } from "../game/residentProfiles";

export function Intro({ onStart, onReset }: { onStart: () => void; onReset: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#283f35]/45 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="intro-title" className="glass anim-pop thin-scroll max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-[26px] p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#b8cbaa]">A LITTLE HOME. A LITTLE LIFE.</div>
        <h1 id="intro-title" className="font-cute mt-2 text-4xl font-bold text-[#f0d7a5]">Cozy Nest</h1>
        <p className="mt-2 text-sm text-white/70">หมู่บ้านเล็ก ๆ ที่ทุกคนมีชีวิตของตัวเอง</p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#c9d8ba]">เกมใหม่เริ่มพร้อมบ้าน 3 หลังและรูมเมต 2 คน มองเห็น 3 หลังในจอเดียว และซูมเจาะบ้านที่เลือกได้ / เซฟเดิมยังเล่นต่อได้</p>
        <div className="my-5 space-y-4 border-y border-white/10 py-5 text-xs leading-relaxed text-white/65">
          <p><strong className="block text-white">อ่านความคิดทุกคนในหน้าเดียว</strong>แผงด้านข้างรวมผู้เช่าทุกบ้าน รวมบ้านที่อยู่นอกมุมกล้อง ข้อความล่าสุดยังคงอยู่เมื่อบับเบิ้ลหาย และค้นหาชื่อหรือขยายแผงได้</p>
          <p><strong className="block text-white">กิจกรรมติดขัดก็ข้ามได้ทันที</strong>หาเส้นทางไม่ได้หรือเดินค้างจะเลือกกิจกรรมถัดไปให้อัตโนมัติ มีปุ่มข้ามรายคน และกู้คืนด้วยกิจกรรมที่ทำได้ตรงจุดเดิมเมื่อเข้าไม่ได้หลายครั้ง</p>
          <p><strong className="block text-white">สวนส่วนกลางใหม่ 20 ชนิด</strong>แตะเมนูส่วนกลางหรือแปลง S01-S12 นอกเขตบ้าน โบนัสรสนิยมและระบบส่งถึงบ้านสามหลังในกลุ่ม ค่าดูแลคิดครั้งเดียวต่อชิ้นต่อวัน</p>
          <p><strong className="block text-white">ผู้เช่าใหม่ 20 คน + Special 20 คน</strong>รู้จักและเชิญได้จากเมนูผู้สมัคร ผู้เช่าพิเศษมีออร่า ค่าเช่าสูง ความต้องการ 1.8 เท่า เกณฑ์ความพอใจ 75% และความอดทนเพียง 2 วัน ควรอ่านเงื่อนไขก่อนรับเข้า</p>
          <p><strong className="block text-white">บ้านใหญ่ขึ้นและอัปเกรดได้ 5 ระดับ</strong>Lv.1-2 มี 2 ชั้น, Lv.3-4 มี 3 ชั้น และ Lv.5 มี 4 ชั้นจริง พร้อมบันไดเชื่อมทุกชั้น ความจุเป็น 2 / 2 / 3 / 3 / 4 คน บ้านใหญ่มีค่าดูแลและความคาดหวังสูงขึ้น</p>
          <p><strong className="block text-white">เพิ่มอุปกรณ์ 50 ชนิด รวม {FURNITURE.length} แบบ</strong>วางได้ 7 โซน: ชั้นล่าง ชั้นสอง ผนัง สวนและระเบียง มุมหน้าห้อง ชั้นบิลท์อิน และเพดาน ย้ายอุปกรณ์ได้ฟรีโดยยังไม่วางทับกัน</p>
          <p><strong className="block text-white">ความสามารถที่เปลี่ยนวิธีเล่น</strong>เตียงสองชั้นนอนได้สองคน โซลาร์ช่วยไฟ เครื่องล้างจานช่วยความสะอาด ฉากกั้นลดความอึดอัด อุปกรณ์หลายชิ้นกินไฟหรือสร้างเสียง เลือกให้สมดุล</p>
          <p><strong className="block text-white">ผู้เช่าเดินผ่านกันได้</strong>ไม่ต้องรอหรือหลบกันบนบันได แต่ยังหาเส้นทางอ้อมเฟอร์นิเจอร์ ลองสั่งกิจกรรมของผู้เช่าแต่ละคนได้ในเมนูผู้เช่า</p>
          <p><strong className="block text-white">เพิ่มชีวิตประจำวันอีก 30 แบบ</strong>มีนิสัย ท่าทาง สีหน้า และบทพูดเฉพาะตัว กิจกรรมจับเวลาหลังเดินถึง อ่านหนังสือ 1 นาที นอน 2 นาที ที่ความเร็ว 1x</p>
        </div>
        <p className="text-[10px] leading-relaxed text-white/50">ลากเพื่อหมุน / หุบนิ้วเพื่อซูม / แตะตัวละครเพื่อดูข้อมูล<br/>ซ่อนชั้นสองได้จากแถบมุมมอง / 1 วันเกม = 30 วินาทีที่ 1x<br/>เมนูนี้หยุดเวลาให้ชั่วคราว และเกมบันทึกอัตโนมัติ</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Btn onClick={onStart} className="flex-1">เข้าไปดูห้อง</Btn>
          <Btn tone="ghost" size="sm" onClick={() => { if (confirmReset) onReset(); else setConfirmReset(true); }}>{confirmReset ? "ยืนยันล้างเซฟ" : "เริ่มเกมใหม่"}</Btn>
        </div>
        {confirmReset && <p className="mt-3 text-[10px] text-rose-200">กดอีกครั้งเพื่อลบความคืบหน้าเดิม หรือกดเข้าไปดูห้องเพื่อเล่นต่อ</p>}
        <details className="mt-6 border-t border-white/10 pt-3 text-xs text-white/65">
          <summary className="cursor-pointer py-1">ดูพฤติกรรมใหม่ทั้ง 30 แบบ</summary>
          <div className="mt-3 space-y-3">
            {Object.entries(EXTRA_ACTIVITIES).map(([id, activity], index) => <div key={id} className="flex gap-3"><span className="pt-0.5 font-mono text-[10px] text-[#cbb488]">{String(index + 1).padStart(2, "0")}</span><div><div className="text-white/90">{activity.th}</div><div className="text-[10px] text-white/45">นิสัย: {activity.habit} / {activity.durationMs / 1000} วินาที</div></div></div>)}
          </div>
        </details>
        <details className="mt-3 border-t border-white/10 pt-3 text-xs text-white/65"><summary className="cursor-pointer py-1">รายชื่อ Special ทั้ง 20 คน</summary><div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">{SPECIAL_RESIDENTS.map((profile) => <span key={profile.id} style={{ color: profile.color }}>{profile.name}</span>)}</div><p className="mt-3 text-[10px] text-white/45">ส่งคำเชิญ 800 บาทในแท็บ Special / คนทั่วไปใหม่เชิญได้ในราคา 250 บาท</p></details>
        <details className="mt-3 border-t border-white/10 pt-3 text-xs text-white/65">
          <summary className="cursor-pointer py-1">ตรวจระบบบ้าน สวน ผู้เช่าพิเศษ และการข้ามกิจกรรม</summary>
          <p className="mt-2 text-[10px] text-white/45">ทดสอบด้วยข้อมูลแยก ไม่กระทบเงิน ผู้เช่า หรือเซฟของคุณ</p>
          <button type="button" disabled={checking} className="mt-3 rounded-lg border border-white/20 px-3 py-2 text-[11px] text-white" onClick={() => {
            setChecking(true);
            setTimeout(() => { setChecks(runRegressionChecks()); setChecking(false); }, 30);
          }}>{checking ? "กำลังตรวจ..." : "เริ่มตรวจสอบ"}</button>
          {checks && <div className="mt-3 space-y-2" aria-live="polite">
            <p className="text-white">ผ่าน {checks.filter((c) => c.ok).length} / {checks.length} กรณี</p>
            {checks.map((result) => <div key={result.name} className={result.ok ? "text-emerald-200" : "text-rose-200"}><span className="mr-2 text-[9px]">{result.ok ? "PASS" : "FAIL"}</span><span className="text-[10px]">{result.name}</span>{!result.ok && <p className="text-[10px]">{result.detail}</p>}</div>)}
          </div>}
        </details>
      </section>
    </div>
  );
}
