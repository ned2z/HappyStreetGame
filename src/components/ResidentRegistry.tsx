import { useMemo } from "react";
import type { FullState, Action } from "../game/store";
import type { Evaluation, Room } from "../game/engine";
import { previewJoin } from "../game/engine";
import { NEW_RESIDENTS, PROFILE_MAP, SPECIAL_RESIDENTS } from "../game/residentProfiles";
import { makeTenant, isSpecial, type Tenant } from "../game/tenants";
import { TRAITS } from "../game/traits";
import { Btn, money } from "./ui";
import { ResidentPortrait } from "./ResidentPortrait";

export function SpecialDemand({ tenant, evaluation }: { tenant: Tenant; evaluation?: Evaluation | null }) {
  if (!isSpecial(tenant)) return null;
  const requirements = PROFILE_MAP[tenant.profileId!].requirements!;
  const checklist = evaluation?.specialRequirements ?? [
    { label: "ระดับบ้าน", required: requirements.level },
    { label: "ความสะอาด", required: requirements.cleanliness },
    { label: "อุปกรณ์เกรดสูงสุด", required: requirements.premiumItems },
    { label: "ความเป็นส่วนตัว", required: requirements.privacy },
    { label: `สวนส่วนกลาง: ${TRAITS[requirements.outdoorTrait].th}`, required: requirements.outdoorScore },
  ];
  return <div className="special-demand" style={{ borderColor: `${tenant.auraColor}65` }}>
    <div className="special-heading"><span style={{ color: tenant.auraColor ?? "#d8c18b" }}>SPECIAL / VERY HARD</span><strong>เกณฑ์ความพอใจ 75%</strong></div>
    <p>ต้องการคะแนนรสนิยม 1.8 เท่าของคนทั่วไป ทนความไม่พอใจได้เพียง {tenant.patience} วัน</p>
    <dl>{checklist.map((requirement) => <div key={requirement.label}><dt>{requirement.label}</dt><dd className={"met" in requirement && requirement.met ? "met" : "unmet"}>{"current" in requirement ? `${requirement.current} / ` : "อย่างน้อย "}{requirement.required}</dd></div>)}</dl>
    {evaluation && <small>เงื่อนไขพิเศษลดความพอใจ {evaluation.specialPenalty} คะแนน / คะแนนที่คาดว่าจะได้ {evaluation.satisfaction}%</small>}
  </div>;
}

export function ResidentRegistry({ group, state, room, dispatch, onApplicants }: { group: "new" | "special"; state: FullState; room: Room | null; dispatch: (action: Action) => void; onApplicants: () => void }) {
  const list = group === "special" ? SPECIAL_RESIDENTS : NEW_RESIDENTS;
  const people = useMemo(() => list.map((profile) => makeTenant({ profileId: profile.id })), [list]);
  const fee = group === "special" ? 800 : 250;
  return <div className="resident-registry">
    <div className="registry-intro"><span className="eyebrow">{group === "special" ? "THE AURA COLLECTION" : "MEET YOUR NEW NEIGHBOURS"}</span><h3>{group === "special" ? "20 คนพิเศษ มาตรฐานไม่ธรรมดา" : "เพื่อนบ้านใหม่อีก 20 คน"}</h3><p>{group === "special" ? "แต่ละคนมีออร่าเฉพาะตัวและเงื่อนไขสุดเข้มงวด ให้ค่าเช่าสูง แต่ต้องดูแลมากเป็นพิเศษ" : "รู้จักนิสัยและรสนิยมก่อนเชิญ ทุกคนมีอาชีพ ความชอบ และหน้าตาของตัวเอง"}</p><p>ส่งคำเชิญ {money(fee)} ต่อคน / จากนั้นเลือกรับเข้าบ้านในแท็บผู้สมัคร</p></div>
    {people.map((tenant, index) => {
      const resident = Object.values(state.tenants).find((person) => person.profileId === tenant.profileId);
      const applicant = state.applicants.find((person) => person.profileId === tenant.profileId);
      const preview = room ? previewJoin(state, room, tenant) : null;
      return <article className="registry-person" key={tenant.profileId}>
        <header><ResidentPortrait tenant={tenant} size={48} /><div><span className="registry-index">{String(index + 1).padStart(2, "0")} / {group === "special" ? "SPECIAL" : "NEW RESIDENT"}</span><h4>{tenant.name}</h4><small>{tenant.job}</small></div><span className="registry-budget">x{tenant.budget.toFixed(2)}<small>กำลังจ่าย</small></span></header>
        <p>{tenant.bio}</p>
        <div className="registry-preferences">{tenant.likes.map((trait) => <span key={trait} style={{ color: TRAITS[trait].color }}>{TRAITS[trait].th}</span>)}<span className="disliked">ไม่ชอบ: {TRAITS[tenant.dislike].th}</span></div>
        {group === "special" && <details><summary>ความต้องการและความเสี่ยง</summary><SpecialDemand tenant={tenant} evaluation={preview} /></details>}
        <footer>{resident ? <span>อยู่บ้าน {resident.roomId! + 1} แล้ว</span> : applicant ? <><span>อยู่ในรายชื่อผู้สมัครแล้ว</span><Btn size="sm" tone="ghost" onClick={onApplicants}>ดูผู้สมัคร</Btn></> : <><span>{preview ? `บ้านนี้คาดว่า ${preview.satisfaction}% / ${money(preview.rent)}/วัน` : "เลือกบ้านเพื่อดูค่าเช่าคาดการณ์"}</span><Btn size="sm" tone={group === "special" ? "gold" : "primary"} disabled={state.money < fee || state.applicants.length >= 8} onClick={() => dispatch({ type: "inviteProfile", profileId: tenant.profileId! })}>เชิญ {money(fee)}</Btn></>}</footer>
      </article>;
    })}
  </div>;
}