import { useState } from "react";
import type { FullState, Action } from "../game/store";
import { ACTIVITY_INFO, activityLine } from "../game/activities";
import { isSpecial, moodOf } from "../game/tenants";
import { ResidentPortrait } from "./ResidentPortrait";

const MOODS = { happy: { text: "มีความสุข", color: "#598561" }, content: { text: "พอใจ", color: "#638e99" }, meh: { text: "ยังไม่ลงตัว", color: "#ad873f" }, angry: { text: "ต้องดูแล", color: "#b76761" } };

export function ThoughtBoard({ state, dispatch, onInspect, covered }: { state: FullState; dispatch: (action: Action) => void; onInspect: (roomId: number) => void; covered: boolean }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const residents = state.rooms.filter((room) => room.unlocked).flatMap((room) => room.tenantIds.map((id) => ({ room, tenant: state.tenants[id] })).filter(({ tenant }) => !!tenant));
  const visible = residents.filter(({ room, tenant }) => `${tenant.name} บ้าน ${room.id + 1}`.toLowerCase().includes(query.trim().toLowerCase()));
  const concerned = residents.filter(({ tenant }) => tenant.satisfaction < (isSpecial(tenant) ? 75 : 40)).length;
  return <aside className={`thought-board ${expanded ? "expanded" : ""} ${covered ? "covered" : ""}`} aria-label="ความคิดของผู้เช่าทุกบ้าน">
    <header className="thought-header">
      <div><span className="thought-eyebrow">LITTLE THOUGHTS</span><h2>ทุกคนคิดอะไรอยู่<span>{residents.length}</span></h2></div>
      <button type="button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "ย่อแผงความคิด" : "ขยายแผงความคิด"} title={expanded ? "ย่อ" : "ขยาย"}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={expanded ? "M4 9h5V4m11 11h-5v5M9 9 3 3m12 12 6 6" : "M9 4H4v5m11 11h5v-5M4 4l6 6m10 10-6-6"} /></svg>
      </button>
    </header>
    <div className="thought-toolbar"><span>ทุกบ้านในหน้าเดียว</span><span className={concerned ? "attention" : ""}>{concerned ? `ต้องดูแล ${concerned} คน` : "อ่านความคิดล่าสุด"}</span></div>
    <label className="thought-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อหรือบ้าน..." aria-label="ค้นหาความคิดผู้เช่า" /></label>
    <div className="thought-list thin-scroll" tabIndex={0} aria-label={`ความคิดผู้เช่า ${visible.length} คน เลื่อนเพื่ออ่านทุกคน`}>
      {visible.map(({ room, tenant }) => {
        const thought = state.thoughts[tenant.id];
        const mood = isSpecial(tenant) && tenant.satisfaction < 75 ? { text: "ต่ำกว่าเกณฑ์ VIP", color: "#b68153" } : MOODS[moodOf(tenant.satisfaction)];
        const definition = ACTIVITY_INFO[tenant.behavior.activity];
        const seconds = Math.ceil(tenant.behavior.remainingMs / 1000);
        return <article className="thought-row" key={tenant.id}>
          <button type="button" className="thought-person" onClick={() => onInspect(room.id)} aria-label={`ดู ${tenant.name} บ้าน ${room.id + 1}`}>
            <ResidentPortrait tenant={tenant} size={38} />
            <span className="thought-person-label"><strong>{tenant.name}{isSpecial(tenant) && <i>SPECIAL</i>}</strong><small>บ้าน {String(room.id + 1).padStart(2, "0")} / Lv.{room.level}</small></span>
            <span className="thought-score" style={{ color: mood.color }}>{tenant.satisfaction}%<small>{mood.text}</small></span>
          </button>
          <blockquote key={thought?.at ?? "initial"}>{thought?.text ?? activityLine(tenant.behavior.activity, tenant.satisfaction)}</blockquote>
          <div className="thought-activity"><span><b className={state.speed > 0 ? "live-dot" : "live-dot paused"} />{tenant.behavior.phase === "walking" ? `กำลังไป${definition.th}` : `${definition.th} ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</span><button type="button" onClick={() => dispatch({ type: "skipActivity", tenantId: tenant.id })} title="ข้ามไปทำกิจกรรมอื่น" aria-label={`ข้ามกิจกรรมของ ${tenant.name}`}>ข้าม <span aria-hidden="true">&gt;</span></button></div>
          {thought && <time className="thought-time">ข้อความล่าสุด วันที่ {thought.day} / {new Date(thought.at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</time>}
        </article>;
      })}
      {visible.length === 0 && <p className="thought-empty">{residents.length ? "ไม่พบผู้เช่าตามคำค้น" : "เมื่อมีผู้เช่าย้ายเข้า ความคิดของทุกคนจะอยู่ที่นี่"}</p>}
    </div>
    <footer className="thought-footer"><span className="live-dot" /> ข้อความล่าสุดไม่หายเมื่อบับเบิ้ลบนฉากหายไป</footer>
  </aside>;
}