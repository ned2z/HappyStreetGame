import { useState } from "react";
import type { FullState, Action } from "../game/store";
import { COMMON_PLOTS, OUTDOOR_CATALOG, OUTDOOR_MAP, OUTDOOR_GRADE, commonBenefits, outdoorPrice, outdoorUpgradePrice } from "../game/commons";
import { EFFECT_INFO, type EffectKey } from "../game/equipment";
import { TRAITS, type TraitId } from "../game/traits";
import { Sheet, Btn, money } from "./ui";

export function OutdoorSheet({ state, dispatch, close, initialSlot }: { state: FullState; dispatch: (action: Action) => void; close: () => void; initialSlot: number | null }) {
  const district = Math.floor((state.selectedRoom ?? 0) / 3);
  const [selectedId, setSelectedId] = useState(OUTDOOR_CATALOG[0].id);
  const [grade, setGrade] = useState(0);
  const [plot, setPlot] = useState(initialSlot ?? -1);
  const [confirmSell, setConfirmSell] = useState<string | null>(null);
  const existing = state.outdoorItems.filter((item) => item.district === district);
  const effects = commonBenefits(state, district);
  const def = OUTDOOR_MAP[selectedId];
  const factor = [1, 1.5, 2.2][grade];
  const freeSlot = Array.from({ length: COMMON_PLOTS }, (_, i) => i).find((slot) => !existing.some((item) => item.slot === slot));
  const selectedSlot = plot < 0 ? freeSlot ?? -1 : plot;
  const occupied = existing.find((item) => item.slot === selectedSlot);
  const duplicate = existing.find((item) => item.defId === selectedId);
  const canBuild = state.rooms.some((room) => room.unlocked && Math.floor(room.id / 3) === district);
  const cost = outdoorPrice(def, grade);
  const blocked = !canBuild || !!occupied || !!duplicate || selectedSlot < 0 || state.money < cost;
  const reason = !canBuild ? "เปิดบ้านในกลุ่มนี้ก่อน" : occupied ? "ตำแหน่งนี้มีของแล้ว เลือกตำแหน่งอื่นหรืออัปเกรดชิ้นเดิม" : duplicate ? "มีของชนิดนี้แล้ว อัปเกรดด้านล่างเพื่อเพิ่มโบนัส" : selectedSlot < 0 ? "พื้นที่ส่วนกลางเต็มแล้ว" : state.money < cost ? "เงินไม่พอ" : null;
  return <Sheet title="สวนส่วนกลาง" subtitle={`นอกเขตบ้าน / กลุ่ม ${district + 1} / โบนัสถึงบ้าน ${district * 3 + 1}-${district * 3 + 3}`} icon={<span className="font-mono text-sm">S</span>} onClose={close} footer={<div className="flex items-center gap-3"><div className="min-w-0 flex-1"><strong className="block truncate text-xs text-white">{def.th}</strong><span className="text-[10px] text-white/50">{selectedSlot >= 0 ? `ตำแหน่ง S${String(selectedSlot + 1).padStart(2, "0")}` : "ไม่มีที่ว่าง"} / {OUTDOOR_GRADE[grade]}</span></div><Btn tone="gold" disabled={blocked} onClick={() => { dispatch({ type: "buyOutdoor", district, slot: selectedSlot, defId: def.id, grade }); setPlot(selectedSlot); }}>{money(cost)} / ติดตั้ง</Btn></div>}>
    <div className="commons-intro"><span className="eyebrow">A GARDEN FOR EVERYONE</span><h3>ความสุขเริ่มจากนอกบ้าน</h3><p>20 ชนิดสำหรับพื้นที่ส่วนกลางโดยเฉพาะ ไม่ใช้ช่องภายในบ้าน โบนัสส่งถึงบ้านทั้งสามหลังในกลุ่มนี้ทันที</p></div>
    <div className="commons-summary"><span>ติดตั้ง {existing.length}/{COMMON_PLOTS} แปลง</span><span>ดูแล {money(effects.upkeep)}/วันทั้งกลุ่ม</span></div>
    <label className="outdoor-label">ตำแหน่งนอกบ้าน<select value={plot} onChange={(e) => setPlot(Number(e.target.value))}><option value={-1}>เลือกแปลงว่างอัตโนมัติ</option>{Array.from({ length: COMMON_PLOTS }, (_, slot) => { const current = existing.find((item) => item.slot === slot); return <option key={slot} value={slot}>S{String(slot + 1).padStart(2, "0")} / {current ? OUTDOOR_MAP[current.defId].th : "ว่าง"}</option>; })}</select></label>
    <div className="outdoor-catalog" role="group" aria-label="เลือกของตกแต่งส่วนกลาง">
      {OUTDOOR_CATALOG.map((entry, index) => <button type="button" key={entry.id} aria-pressed={selectedId === entry.id} onClick={() => setSelectedId(entry.id)}><span className="outdoor-code" style={{ color: entry.color }}>{String(index + 1).padStart(2, "0")}</span><span><strong>{entry.th}</strong><small>เริ่ม {money(entry.cost)}</small></span></button>)}
    </div>
    <section className="outdoor-detail"><h3>{def.th}</h3><p>{def.desc}</p><div className="outdoor-grades">{OUTDOOR_GRADE.map((name, index) => <button type="button" aria-pressed={index === grade} onClick={() => setGrade(index)} key={name}><span>{name}</span><strong>{money(outdoorPrice(def, index))}</strong></button>)}</div>
      <h4>โบนัสต่อบ้านในกลุ่มนี้</h4>
      <dl>{Object.entries(def.traits).map(([trait, value]) => <div key={trait}><dt>{TRAITS[trait as TraitId].th}</dt><dd className={value < 0 ? "negative" : ""}>{value > 0 ? "+" : ""}{(value * factor).toFixed(1)}</dd></div>)}{Object.entries(def.effects).filter(([key]) => key !== "upkeep").map(([key, value]) => <div key={key}><dt>{EFFECT_INFO[key as EffectKey].th}</dt><dd>{value > 0 ? "+" : ""}{(value * factor).toFixed(1)} {EFFECT_INFO[key as EffectKey].unit}</dd></div>)}</dl>
      <p className="outdoor-note">ค่าดูแลรวม {money(Math.round((def.effects.upkeep ?? 0) * (1 + grade * 0.25)))}/วัน / โบนัสรสนิยมส่วนกลางสะสมสูงสุด 12 ต่อประเภท / สถานะระบบมีเพดาน ตรวจผลจริงได้ในเมนูบ้าน / ของชนิดเดียวติดตั้งได้หนึ่งชิ้นต่อกลุ่ม</p>
      {reason && <p role="status" className="outdoor-warning">{reason}</p>}
    </section>
    <details className="outdoor-totals"><summary>สถานะรวมจากสวนนี้ ({effects.count} ชิ้น)</summary><dl>{Object.entries(effects.traits).map(([trait, value]) => <div key={trait}><dt>{TRAITS[trait as TraitId].th}</dt><dd>{value > 0 ? "+" : ""}{value}</dd></div>)}</dl>{!effects.count && <p>ยังไม่มีโบนัส ติดตั้งของชิ้นแรกเพื่อเริ่มพัฒนาสวน</p>}</details>
    <h3 className="mt-5 text-xs font-bold text-white/75">ของที่ติดตั้งในส่วนกลาง</h3>
    <div className="outdoor-installed">{existing.map((item) => <div key={item.uid}><header><span>S{String(item.slot + 1).padStart(2, "0")}</span><strong>{OUTDOOR_MAP[item.defId].th}</strong><small>{OUTDOOR_GRADE[item.grade]}</small></header><div className="flex flex-wrap gap-2"><Btn size="sm" tone="gold" disabled={item.grade === 2 || state.money < outdoorUpgradePrice(item)} onClick={() => dispatch({ type: "upgradeOutdoor", uid: item.uid })}>{item.grade === 2 ? "สูงสุดแล้ว" : `อัปเกรด ${money(outdoorUpgradePrice(item))}`}</Btn><Btn size="sm" tone="ghost" onClick={() => { if (confirmSell === item.uid) { dispatch({ type: "sellOutdoor", uid: item.uid }); setConfirmSell(null); } else setConfirmSell(item.uid); }}>{confirmSell === item.uid ? "ยืนยันขาย" : `ขาย ${money(Math.round(outdoorPrice(OUTDOOR_MAP[item.defId], item.grade) * 0.45))}`}</Btn><select aria-label={`ย้าย ${OUTDOOR_MAP[item.defId].th}`} value={item.slot} onChange={(e) => dispatch({ type: "moveOutdoor", uid: item.uid, slot: Number(e.target.value) })}>{Array.from({ length: COMMON_PLOTS }, (_, slot) => <option value={slot} key={slot} disabled={existing.some((other) => other.uid !== item.uid && other.slot === slot)}>S{String(slot + 1).padStart(2, "0")}{slot === item.slot ? " / ปัจจุบัน" : " / ย้ายมาที่นี่"}</option>)}</select></div></div>)}</div>
  </Sheet>;
}