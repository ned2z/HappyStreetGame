import { useMemo, useState } from "react";
import type { Action, FullState } from "../game/store";
import {
  CLEAN_COST,
  evaluate,
  floorSlotCount,
  loftSlotCount,
  MAX_HOUSE_LEVEL,
  roomCapacity,
  houseLevel,
  previewJoin,
  roomDiversity,
  roomRent,
  roomTraitScores,
  sellValue,
  unlockCost,
  upgradeCost,
  wallSlotCount,
  type Evaluation,
  type Room,
  type SocialNote,
} from "../game/engine";
import { CATEGORIES, FURNITURE, FURNITURE_MAP, allowedZones, ZONES, ZONE_LABEL, furnitureMeta, GRADE_COLOR, GRADE_LABEL, type CatId, type FurnitureDef, type PlaceType } from "../game/furniture";
import { TRAITS, type TraitId } from "../game/traits";
import { ACTIVITY_INFO, FLOOR_PREF_INFO, MOOD_INFO, moodOf, isSpecial, type Tenant } from "../game/tenants";
import { Bar, Btn, Chip, money, Sheet } from "./ui";
import { cn } from "../utils/cn";
import { ALL_ACTIVITY_IDS, EXTRA_ACTIVITIES } from "../game/activities";
import { encodeSlot, houseStoryCount, placementError, slotStory, slotStoryLabel, zoneCapacity, slotZone } from "../game/layout";
import { findPlacement } from "../game/placement";
import { EFFECT_INFO, equipmentEffects, type EffectKey } from "../game/equipment";
import { HouseLevelTrack, HouseSystems } from "./HouseSystems";
import { SpecialDemand, ResidentRegistry } from "./ResidentRegistry";
import { ResidentPortrait } from "./ResidentPortrait";

interface Base {
  state: FullState;
  dispatch: (a: Action) => void;
  close: () => void;
}

type Zone = PlaceType;

export function firstFreeSlot(room: Room, zone: Zone) {
  const used = new Set(room.items.map((i) => i.slot));
  const n = zoneCapacity(room.level, zone);
  for (let i = 0; i < n; i++) {
    const s = encodeSlot(zone, i);
    if (!used.has(s)) return i;
  }
  return -1;
}

function freeCounts(room: Room) {
  return Object.fromEntries(ZONES.map((zone) => [zone, zoneCapacity(room.level, zone) - room.items.filter((i) => slotZone(i.slot) === zone).length])) as Record<PlaceType, number>;
}

/** ชิปสเตตัสแบบคละ (+เขียว / -แดง) */
function StatChips({ traits, mult = 1 }: { traits: Partial<Record<TraitId, number>>; mult?: number }) {
  return (
    <>
      {Object.entries(traits).map(([t, v]) => {
        const tr = TRAITS[t as TraitId];
        const val = Math.round(((v as number) * mult) * 10) / 10;
        const neg = val < 0;
        return (
          <span
            key={t}
            className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
            style={
              neg
                ? { background: "rgba(255,90,90,0.14)", color: "#ff9d9d", border: "1px solid rgba(255,90,90,0.4)" }
                : { background: `${tr.color}22`, color: tr.color, border: `1px solid ${tr.color}55` }
            }
          >
            {tr.emoji} {tr.th} {val > 0 ? `+${val}` : val}
          </span>
        );
      })}
    </>
  );
}

function FurnitureStatus({ def, grade = 0 }: { def: FurnitureDef; grade?: number }) {
  const meta = furnitureMeta(def, grade);
  const effects = equipmentEffects(def, grade);
  const active = (Object.keys(effects) as EffectKey[]).filter((key) => effects[key] !== 0);
  return (
    <div className="mt-1.5 rounded-xl bg-black/20 px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
        <span className="font-bold text-white/70">ความสามารถในเกม</span>
        <span className="rounded-md px-1.5 py-0.5 font-bold" style={{ color: meta.rarityColor, background: `${meta.rarityColor}1f` }}>
          {meta.rarityTh}
        </span>
      </div>
      <div className="space-y-1">
        {active.map((key) => <div key={key} className="flex justify-between gap-2 text-[10px]">
          <span className="text-white/60">{EFFECT_INFO[key].th}</span>
          <span className={(effects[key] > 0) === EFFECT_INFO[key].good ? "text-emerald-200" : "text-amber-200"}>{effects[key] > 0 ? "+" : ""}{effects[key]} {EFFECT_INFO[key].unit}</span>
        </div>)}
        {!active.length && <p className="text-[10px] text-white/50">เพิ่มคะแนนความชอบและมูลค่าการตกแต่ง</p>}
      </div>
      <div className="mt-2 text-[9px] text-white/40">{meta.typeTh} / {ZONE_LABEL[allowedZones(def)[0]]} / เกรด {grade + 1} / บ้าน Lv.{def.minLevel ?? 1}+</div>
    </div>
  );
}

/* --------------------------------- ร้านค้า -------------------------------- */

export function ShopSheet({ state, dispatch, close }: Base) {
  const [cat, setCat] = useState<CatId | "all">("all");
  const [preference, setPreference] = useState<TraitId | "all">("all");
  const [zonePref, setZonePref] = useState<PlaceType | "auto">("auto");
  const [newOnly, setNewOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(18);
  const roomId = state.selectedRoom ?? 0;
  const room = state.rooms[roomId];
  const tenants = room?.tenantIds.map((id) => state.tenants[id]).filter(Boolean) ?? [];
  const target = state.selectedSlot;

  const list = useMemo(() => {
    let l = FURNITURE;
    if (cat !== "all") l = l.filter((f) => f.cat === cat);
    if (preference !== "all") l = l.filter((f) => (f.traits[preference] ?? 0) > 0);
    if (newOnly) l = l.filter((f) => f.isNew);
    if (query.trim()) l = l.filter((f) => `${f.th} ${f.desc}`.includes(query.trim()));
    if (target) l = l.filter((f) => allowedZones(f).includes(target.place));
    else if (zonePref !== "auto") l = l.filter((f) => allowedZones(f).includes(zonePref));
    if (tenants.length) {
      l = [...l].sort((a, b) => scoreAll(b, tenants) - scoreAll(a, tenants));
    }
    return l;
  }, [cat, preference, target, state.tenants, room?.tenantIds, newOnly, query, zonePref]);

  if (!room?.unlocked)
    return (
      <Sheet title="ยังไม่ได้เลือกห้อง" icon="🛒" onClose={close}>
        <p className="text-sm text-white/70">แตะที่ห้องในตึกเพื่อเลือกห้องที่จะตกแต่งก่อนนะ</p>
      </Sheet>
    );

  const free = freeCounts(room);

  return (
    <Sheet
      title={`แต่งบ้าน ${roomId + 1} / ${FURNITURE.length} แบบ`}
      subtitle={
        target
          ? `กำลังวาง ${slotStoryLabel(room.level, target.place, target.slot)} / ${ZONE_LABEL[target.place]} #${target.slot + 1}`
          : `บ้าน Lv.${room.level} / พื้นที่ว่าง ${Object.values(free).reduce((sum, n) => sum + n, 0)} ช่อง / 7 โซน`
      }
      icon="🛒"
      onClose={close}
    >
      <label className="mb-3 block text-[11px] text-white/70">
        ตำแหน่งติดตั้ง
        <select
          value={target ? `${target.place}:${target.slot}` : "auto"}
          onChange={(e) => {
            if (e.target.value === "auto") dispatch({ type: "clearSlot" });
            else {
              const [place, slot] = e.target.value.split(":");
              dispatch({ type: "selectSlot", place: place as Zone, slot: Number(slot) });
            }
          }}
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#243e35] px-3 py-2 text-xs text-white"
        >
          <option value="auto">เลือกช่องว่างให้อัตโนมัติ</option>
          {ZONES.map((zone) => (
            <optgroup key={zone} label={ZONE_LABEL[zone]}>
              {Array.from({ length: zoneCapacity(room.level, zone) }, (_, slot) => {
                const item = room.items.find((i) => i.slot === encodeSlot(zone, slot));
                return <option key={slot} value={`${zone}:${slot}`} disabled={!!item}>
                  {slotStoryLabel(room.level, zone, slot)} / จุด {slot + 1}{item ? ` / ${FURNITURE_MAP[item.defId]?.th ?? "ติดตั้งแล้ว"}` : " / ว่าง"}
                </option>;
              })}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="floor-install-map" aria-label="จำนวนจุดติดตั้งแยกตามชั้น">
        {Array.from({ length: houseStoryCount(room.level) }, (_, story) => {
          const slots = ZONES.reduce((sum, zone) => sum + Array.from({ length: zoneCapacity(room.level, zone) }, (_, slot) => Number(slotStory(room.level, zone, slot) === story)).reduce((a, b) => a + b, 0), 0);
          const used = room.items.filter((item) => slotStory(room.level, slotZone(item.slot), item.slot % 1000) === story).length;
          return <span key={story}><strong>ชั้น {story + 1}</strong>{used}/{slots} จุด</span>;
        })}
      </div>
      <p className="mb-3 text-[10px] leading-relaxed text-[#b7d2af]">ติดตั้งได้ 7 โซน และย้ายของได้ฟรีในเมนูอุปกรณ์ ระบบยังป้องกันวางทับของและปิดทางเดิน</p>
      {!target && (
        <label className="mb-3 block text-[10px] text-white/50">โซนที่ต้องการ
          <select value={zonePref} onChange={(e) => { setZonePref(e.target.value as PlaceType | "auto"); setShown(18); }} className="mt-1 w-full rounded-xl border border-white/15 bg-[#243e35] px-3 py-2 text-xs text-white">
            <option value="auto">ทุกโซน / หาตำแหน่งที่เหมาะสมให้อัตโนมัติ</option>
            {ZONES.map((zone) => <option key={zone} value={zone}>{ZONE_LABEL[zone]} / ว่าง {free[zone]}</option>)}
          </select>
        </label>
      )}
      <div className="mb-3 flex items-center gap-2">
        <input aria-label="ค้นหาอุปกรณ์" value={query} onChange={(e) => { setQuery(e.target.value); setShown(18); }} placeholder="ค้นหาชื่อหรือความสามารถ..." className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#243e35] px-3 py-2 text-xs text-white" />
        <button type="button" aria-pressed={newOnly} onClick={() => { setNewOnly(!newOnly); setShown(18); }} className={`rounded-xl px-3 py-2 text-[11px] ${newOnly ? "bg-[#d6bd89] text-[#344537]" : "bg-white/10 text-white/70"}`}>ใหม่ 50</button>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <label className="text-[10px] text-white/50">
          ประเภทเฟอร์นิเจอร์
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value as CatId | "all")}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#211839] px-2 py-2 text-[11px] text-white outline-none"
          >
            <option value="all">ทั้งหมด</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.th}</option>)}
          </select>
        </label>
        <label className="text-[10px] text-white/50">
          ตรงกับความชอบ
          <select
            value={preference}
            onChange={(e) => setPreference(e.target.value as TraitId | "all")}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#211839] px-2 py-2 text-[11px] text-white outline-none"
          >
            <option value="all">ทุกความชอบ</option>
            {Object.values(TRAITS).map((trait) => <option key={trait.id} value={trait.id}>{trait.emoji} {trait.th}</option>)}
          </select>
        </label>
      </div>
      <p className="mb-3 text-[10px] text-white/45">พบ {list.length} แบบ / แสดงค่าสถานะเกรดธรรมดาก่อนเลือกซื้อ</p>
      {list.length === 0 && <p className="py-6 text-center text-xs text-white/65">ไม่พบเฟอร์นิเจอร์ในตัวกรองนี้ ลองเลือกประเภทอื่น</p>}

      <div className="flex flex-col gap-2">
        {list.slice(0, shown).map((def) => {
          const zones = allowedZones(def);
          const zone: Zone = target ? target.place : zonePref !== "auto" ? zonePref : zones.find((z) => findPlacement(room, def.id, 0, z) >= 0) ?? zones[0];
          const slotIdx = target ? target.slot : findPlacement(room, def.id, 0, zone);
          const full = slotIdx < 0;
          const error = room.level < (def.minLevel ?? 1) ? `ปลดล็อกเมื่อบ้านระดับ ${def.minLevel}` : full ? "พื้นที่นี้เต็มแล้ว กรุณาเลือกตำแหน่งอื่น" : placementError(room, def.id, 0, zone, slotIdx);
          const likedBy = tenants.filter((t) => t.likes.some((l) => (def.traits[l] ?? 0) > 0));
          const hatedBy = tenants.filter((t) => (def.traits[t.dislike] ?? 0) > 0);
          return (
            <div key={def.id} className="card-soft rounded-2xl p-2.5">
              <div className="flex items-start gap-2">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/25 text-xl" style={{ color: def.accent }}>{def.emoji || <span className="font-mono text-xs">{def.model?.slice(0, 2).toUpperCase()}</span>}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-cute truncate text-sm font-bold text-white">{def.th}</span>
                    <span className="rounded-md bg-white/10 px-1 text-[9px] text-white/50">
                      {def.isNew ? "NEW" : ZONE_LABEL[zone]}
                    </span>
                    {likedBy.map((t) => (
                      <span key={t.id} className="rounded-md bg-emerald-400/20 px-1 text-[9px] font-bold text-emerald-300">
                        {t.emoji} ตรงใจ!
                      </span>
                    ))}
                    {hatedBy.map((t) => (
                      <span key={t.id} className="rounded-md bg-rose-400/20 px-1 text-[9px] font-bold text-rose-300">
                        {t.emoji} ไม่ชอบ
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] leading-relaxed text-white/55">{def.desc}</p>
                  <p className="mt-1 text-[9px] text-white/40">{zones.map((z) => ZONE_LABEL[z]).join(" / ")}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <StatChips traits={def.traits} />
                  </div>
                  <FurnitureStatus def={def} />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {def.grades.map((gr, gi) => {
                  const afford = state.money >= gr.cost;
                  const actualSlot = target ? slotIdx : findPlacement(room, def.id, gi, zone);
                  const blocked = actualSlot < 0 || !!placementError(room, def.id, gi, zone, actualSlot);
                  return (
                    <button
                      key={gi}
                      disabled={!afford || blocked}
                      title={blocked ? error ?? "ตำแหน่งนี้ไม่พร้อมติดตั้ง" : !afford ? "เงินไม่เพียงพอ" : `ซื้อ ${gr.th}`}
                      onClick={() => dispatch({ type: "buyItem", roomId, slot: actualSlot, zone, defId: def.id, grade: gi, auto: !target })}
                      className={cn(
                        "btn-pop rounded-xl border px-1.5 py-1.5 text-left",
                        afford && !blocked ? "border-white/15 bg-white/8 hover:bg-white/15" : "cursor-not-allowed border-white/5 bg-black/20 opacity-45",
                      )}
                    >
                      <div className="text-[9px] font-bold" style={{ color: GRADE_COLOR[gi] }}>
                        {"◆".repeat(gi + 1)} {GRADE_LABEL[gi]}
                      </div>
                      <div className="truncate text-[10px] text-white/70">{gr.th}</div>
                      <div className="tabular text-[11px] font-bold text-amber-200">{money(gr.cost)}</div>
                    </button>
                  );
                })}
              </div>
              {error && <div className="mt-2 text-[10px] text-rose-200">{error}</div>}
            </div>
          );
        })}
      </div>
      {list.length > shown && <button type="button" className="mt-4 w-full rounded-xl border border-white/20 px-3 py-2 text-xs text-white/75" onClick={() => setShown(shown + 18)}>ดูอีก {Math.min(18, list.length - shown)} แบบ ({shown}/{list.length})</button>}
    </Sheet>
  );
}

function scoreAll(def: FurnitureDef, ts: Tenant[]) {
  let s = 0;
  for (const t of ts) {
    t.likes.forEach((l) => (s += (def.traits[l] ?? 0) * 2));
    s -= (def.traits[t.dislike] ?? 0) * 2;
    // ของที่มีข้อเสียแรง ๆ โดนหักนิดหน่อย
    for (const v of Object.values(def.traits)) if ((v as number) < 0) s += (v as number) * 0.5;
  }
  return s;
}

/* ------------------------------- ข้อมูลผู้เช่า ------------------------------ */

function TenantCard({
  state,
  room,
  tenant,
  ev,
  dispatch,
  onObserve,
  dialogue,
}: {
  state: FullState;
  room: Room;
  tenant: Tenant;
  ev: Evaluation;
  dispatch: (a: Action) => void;
  onObserve: () => void;
  dialogue?: string;
}) {
  const mood = moodOf(tenant.satisfaction);
  const scores = roomTraitScores(room, state);
  const fp = FLOOR_PREF_INFO[tenant.floorPref];
  return (
    <div className="card-soft rounded-2xl p-3">
      <div className="flex items-start gap-2">
        <ResidentPortrait tenant={tenant} size={44} />
        <div className="min-w-0 flex-1">
          <div className="font-cute text-sm font-bold text-white">{tenant.name}{isSpecial(tenant) && <span className="ml-2 font-sans text-[9px] tracking-widest" style={{ color: tenant.auraColor! }}>SPECIAL</span>}</div>
          <div className="text-[11px] text-white/50">
            {tenant.job} • อยู่มา {tenant.daysStayed} วัน
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px]">
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-white/70">
              {fp.emoji} {fp.th}
            </span>
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-white/70">
              มุมประจำ{ev.floorZone === "up" ? "⬆️ ชั้นลอย" : "⬇️ ชั้นล่าง"}
              {ev.floorBonus > 0 ? <span className="text-emerald-300"> (+{ev.floorBonus})</span> : ev.floorBonus < 0 ? <span className="text-rose-300"> ({ev.floorBonus})</span> : null}
            </span>
            {tenant.behavior && (
              <span className="rounded-md bg-cyan-400/12 px-1.5 py-0.5 text-cyan-200">
                {ACTIVITY_INFO[tenant.behavior.activity].emoji} {ACTIVITY_INFO[tenant.behavior.activity].th}
                {tenant.behavior.phase === "walking" ? " / กำลังเดินไป" : ` / เหลือ ${Math.ceil(tenant.behavior.remainingMs / 1000)} วิ`}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg">{MOOD_INFO[mood].emoji}</div>
          <div className="tabular text-sm font-bold" style={{ color: MOOD_INFO[mood].color }}>
            {tenant.satisfaction}%
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Bar value={tenant.satisfaction} color={MOOD_INFO[mood].color} />
      </div>
      {dialogue && <blockquote className="mt-2 border-l-2 border-[#cfb487] pl-2 text-[11px] leading-relaxed text-[#e8d7b5]">{dialogue}</blockquote>}
      <SpecialDemand tenant={tenant} evaluation={ev} />
      <div className="mt-3 text-[11px] leading-relaxed text-white/65">
        <span className="text-white/40">นิสัย: </span>
        {tenant.habits.map((id) => EXTRA_ACTIVITIES[id]?.habit).filter(Boolean).join(" / ")}
        <div className="mt-2 flex items-center gap-2 text-[10px]"><span>พลังงาน</span><div className="flex-1"><Bar value={tenant.energy} color="#c8dca2" height={4} /></div><span>{Math.round(tenant.energy)}%</span></div>
      </div>
      <div className="life-actions">
        <label className="mb-1 block text-[10px] text-white/55" htmlFor={`activity-${tenant.id}`}>กิจกรรมของผู้เช่าคนนี้ / เลือกให้ลองทำได้</label>
        <select id={`activity-${tenant.id}`} value={tenant.behavior.activity} onChange={(e) => dispatch({ type: "setActivity", tenantId: tenant.id, activity: e.target.value as Tenant["behavior"]["activity"] })}>
          <optgroup label="กิจกรรมประจำวัน">
            {ALL_ACTIVITY_IDS.filter((id) => !(id in EXTRA_ACTIVITIES)).map((id) => <option key={id} value={id}>{ACTIVITY_INFO[id].th} / {ACTIVITY_INFO[id].durationMs / 1000} วิ</option>)}
          </optgroup>
          <optgroup label="30 พฤติกรรมใหม่">
            {Object.entries(EXTRA_ACTIVITIES).map(([id, info]) => <option key={id} value={id}>{info.th} / {info.durationMs / 1000} วิ</option>)}
          </optgroup>
        </select>
        <div className="quick-actions">
          <button type="button" onClick={() => { dispatch({ type: "setActivity", tenantId: tenant.id, activity: "inspectLoft" }); onObserve(); }}>เดินขึ้นชั้นสอง</button>
          <button type="button" onClick={() => { dispatch({ type: "setActivity", tenantId: tenant.id, activity: "freshAir" }); onObserve(); }}>เดินออกนอกห้อง</button>
          <button type="button" onClick={onObserve}>ดูในฉาก</button>
          <button type="button" onClick={() => dispatch({ type: "skipActivity", tenantId: tenant.id })}>กิจกรรมถัดไป</button>
        </div>
        <p className="mt-2 text-[9px] text-white/40">เวลานับหลังเดินถึง / หยุดเมื่อพักเกม / ตัวละครเดินผ่านกันได้ / เตียงสองชั้นและโต๊ะอาหารรองรับผู้ใช้หลายคน</p>
      </div>
      {tenant.angryDays > 0 && (
        <div className="mt-2 rounded-xl bg-rose-500/15 px-2 py-1 text-[11px] text-rose-200">
          ⚠️ ไม่พอใจมา {tenant.angryDays} วัน — เกิน {tenant.patience} วันจะย้ายออก!
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        {ev.fills.map(({ trait, fill }) => {
          const tr = TRAITS[trait];
          return (
            <div key={trait}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold" style={{ color: tr.color }}>
                  {tr.emoji} {tr.th}
                </span>
                <span className="tabular text-[10px] text-white/60">
                  {Math.round((scores[trait] ?? 0) * 10) / 10} / {ev.need}
                </span>
              </div>
              <Bar value={(fill / 1.12) * 100} color={tr.color} height={5} />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="font-bold" style={{ color: TRAITS[tenant.dislike].color }}>
          🚫 ไม่ชอบ: {TRAITS[tenant.dislike].emoji} {TRAITS[tenant.dislike].th}
        </span>
        <span className="text-rose-300">{ev.dislikeHit > 0.5 ? `-${Math.round(ev.dislikeHit)}` : "ไม่มีในห้อง ✓"}</span>
      </div>
      {ev.systemPenalty > 0 && <p className="mt-2 text-[10px] leading-relaxed text-amber-200">ความพร้อมของบ้านลดความพอใจ {Math.round(ev.systemPenalty)} คะแนน ดูปัญหาเตียง พื้นที่ส่วนตัว และไฟฟ้าในเมนูบ้าน</p>}
      {ev.outdoorBonus > 0 && <p className="mt-2 text-[10px] text-emerald-200">สวนส่วนกลางช่วยรสนิยมที่ชอบรวม +{ev.outdoorBonus.toFixed(1)} แต้ม (รวมในแถบด้านบนแล้ว)</p>}

      {ev.roommate.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {ev.roommate.map((n, i) => (
            <SocialRow key={i} n={n} prefix="🧑‍🤝‍🧑 รูมเมท" />
          ))}
        </div>
      )}
      {ev.neighbors.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          {ev.neighbors.slice(0, 3).map((n, i) => (
            <SocialRow key={i} n={n} prefix="🏠 ข้างห้อง" />
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
        <Btn tone="ghost" size="sm" onClick={() => dispatch({ type: "evict", roomId: room.id, tenantId: tenant.id })}>
          ไล่ออก
        </Btn>
        <div className="tabular text-right">
          <div className="text-[9px] text-white/50">จ่าย/วัน (×{tenant.budget.toFixed(2)} • สังคม ×{ev.socialMult.toFixed(2)})</div>
          <div className="font-cute text-base leading-none font-bold text-emerald-300">{money(ev.rent)}</div>
        </div>
      </div>
      <div className="tabular mt-1 text-right text-[10px] text-white/40">จ่ายให้แล้วทั้งหมด {money(tenant.totalPaid)}</div>
    </div>
  );
}

function SocialRow({ n, prefix }: { n: SocialNote; prefix: string }) {
  return (
    <div className={cn("rounded-xl px-2.5 py-1.5 text-[11px]", n.good ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200")}>
      {n.good ? "💚" : "💢"} {prefix} {n.otherName}: {n.reason}
    </div>
  );
}

export function TenantSheet({ state, dispatch, close, evs }: Base & { evs: Record<string, Evaluation> }) {
  const roomId = state.selectedRoom ?? 0;
  const room = state.rooms[roomId];
  const tenants = room?.tenantIds.map((id) => state.tenants[id]).filter(Boolean) ?? [];

  if (!tenants.length)
    return (
      <Sheet title={`ห้อง ${roomId + 1} ยังว่างอยู่`} icon="🪧" onClose={close}>
        <p className="text-sm text-white/70">เลือกผู้สมัครเข้าบ้านนี้ได้สูงสุด {roomCapacity(room)} คน เมื่ออัปเกรดถึงระดับ 5 จะรับได้ 4 คน</p>
      </Sheet>
    );

  return (
    <Sheet
      title={`ผู้เช่าบ้าน ${roomId + 1} (${tenants.length}/${roomCapacity(room)})`}
      subtitle={`ค่าเช่ารวม ${money(roomRent(state, room))}/วัน`}
      icon="👥"
      onClose={close}
    >
      <div className="flex flex-col gap-2">
        {tenants.map((t) => (
          <TenantCard key={t.id} state={state} room={room} tenant={t} ev={evs[t.id] ?? evaluate(state, room, t)} dispatch={dispatch} onObserve={close} dialogue={state.thoughts[t.id]?.text ?? state.bubbles[t.id]?.text} />
        ))}
      </div>
      {tenants.length < roomCapacity(room) && (
        <p className="mt-2 text-center text-[11px] text-amber-200">ยังว่างอีก {roomCapacity(room) - tenants.length} ที่ เลือกรูมเมตที่เข้ากันได้</p>
      )}
    </Sheet>
  );
}

/* -------------------------------- ผู้สมัคร -------------------------------- */

export function ApplicantSheet({ state, dispatch, close }: Base) {
  const [group, setGroup] = useState<"applicants" | "new" | "special">("applicants");
  const vacant = state.rooms.filter((r) => r.unlocked && r.tenantIds.length < roomCapacity(r));
  const [roomId, setRoomId] = useState<number>(
    state.selectedRoom != null && vacant.some((v) => v.id === state.selectedRoom) ? state.selectedRoom : (vacant[0]?.id ?? -1),
  );
  const room = vacant.find((r) => r.id === roomId) ?? vacant[0] ?? null;
  const mates = room ? room.tenantIds.map((id) => state.tenants[id]).filter(Boolean) : [];

  return (
    <Sheet
      title="ผู้สนใจเช่าห้อง"
      subtitle={room ? `บ้าน ${room.id + 1} / Lv.${room.level} / ${room.tenantIds.length}/${roomCapacity(room)} คน` : "ทุกบ้านเต็มแล้ว"}
      icon="👥"
      onClose={close}
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/50">สุ่มคนทั่วไปใหม่ / คงผู้สมัคร Special ไว้</span>
          <Btn tone="gold" size="sm" disabled={state.money < 250} onClick={() => dispatch({ type: "refreshApplicants" })}>
            📣 ประกาศใหม่ {money(250)}
          </Btn>
        </div>
      }
    >
      <nav className="registry-tabs" aria-label="ประเภทผู้สมัคร">
        <button type="button" aria-pressed={group === "applicants"} onClick={() => setGroup("applicants")}>ผู้สมัคร {state.applicants.length}</button>
        <button type="button" aria-pressed={group === "new"} onClick={() => setGroup("new")}>ใหม่ 20 คน</button>
        <button type="button" aria-pressed={group === "special"} onClick={() => setGroup("special")}>Special 20</button>
      </nav>
      {vacant.length > 1 && (
        <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
          {vacant.map((v) => (
            <Chip key={v.id} active={roomId === v.id} onClick={() => setRoomId(v.id)}>
              บ้าน {v.id + 1} ({v.tenantIds.length}/{roomCapacity(v)})
            </Chip>
          ))}
        </div>
      )}
      {mates.length > 0 && (
        <div className="mb-2 rounded-2xl bg-white/5 p-2 text-[11px] text-white/60">
          🧑‍🤝‍🧑 รูมเมทที่อยู่แล้ว: {mates.map((m) => `${m.emoji} ${m.name}`).join(" • ")} — เลือกคนที่เข้ากันได้!
        </div>
      )}
      {!room && <p className="mb-2 text-[11px] text-amber-200">ทุกห้องเต็มแล้ว — สร้างห้องใหม่เพื่อรับผู้เช่าเพิ่ม</p>}

      {group !== "applicants" ? <ResidentRegistry group={group} state={state} room={room} dispatch={dispatch} onApplicants={() => setGroup("applicants")} /> : <div className="flex flex-col gap-2">
        {state.applicants.map((a) => {
          const preview = room ? previewJoin(state, room, a) : null;
          const mood = preview ? moodOf(preview.satisfaction) : null;
          const bad = preview?.compat.filter((n) => !n.good) ?? [];
          const good = preview?.compat.filter((n) => n.good) ?? [];
          const fp = FLOOR_PREF_INFO[a.floorPref];
          const floorClash =
            room && a.floorPref !== "any" && mates.filter((m) => m.floorPref === a.floorPref).length >= Math.ceil(roomCapacity(room) / 2)
              ? `จะแย่ง${a.floorPref === "up" ? "ชั้นลอย" : "ชั้นล่าง"}กับรูมเมท!`
              : null;
          return (
            <div key={a.id} className="card-soft rounded-2xl p-3">
              <div className="flex items-start gap-2">
                <ResidentPortrait tenant={a} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="font-cute text-sm font-bold text-white">{a.name}{isSpecial(a) && <span className="ml-2 font-sans text-[9px] tracking-widest" style={{ color: a.auraColor! }}>SPECIAL</span>}</div>
                  <div className="text-[11px] text-white/50">{a.job}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/50">กำลังจ่าย</div>
                  <div className="text-xs font-bold text-amber-200">×{a.budget.toFixed(2)}</div>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-white/45 italic">“{a.bio}”</p>
              <SpecialDemand tenant={a} evaluation={preview} />
              <div className="mt-2 flex flex-wrap gap-1">
                {a.likes.map((l) => (
                  <Chip key={l} color={TRAITS[l].color}>
                    {TRAITS[l].emoji} {TRAITS[l].th}
                  </Chip>
                ))}
                <Chip color="#ff8f8f">🚫 {TRAITS[a.dislike].th}</Chip>
                <Chip>
                  {fp.emoji} {fp.th}
                </Chip>
                <Chip>😤 ทนได้ {a.patience} วัน</Chip>
              </div>
              {preview && (
                <>
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/25 px-2.5 py-1.5">
                    <span className="text-lg">{MOOD_INFO[mood!].emoji}</span>
                    <div className="flex-1">
                      <div className="text-[10px] text-white/50">ถ้าเข้าอยู่บ้าน {room!.id + 1} ตอนนี้</div>
                      <Bar value={preview.satisfaction} color={MOOD_INFO[mood!].color} height={5} />
                    </div>
                    <div className="text-right">
                      <div className="tabular text-sm font-bold text-emerald-300">{money(preview.rent)}</div>
                      <div className="text-[9px] text-white/40">ต่อวัน</div>
                    </div>
                  </div>
                  {preview.systemPenalty > 0 && <p className="mt-1.5 text-[10px] text-amber-200">บ้านยังไม่พร้อมสำหรับคนเพิ่ม: ลดความพอใจ {Math.round(preview.systemPenalty)} คะแนน ควรตรวจเตียง ไฟฟ้า และพื้นที่ส่วนตัวก่อนรับ</p>}
                  {(good.length > 0 || bad.length > 0 || floorClash) && (
                    <div className="mt-1.5 flex flex-col gap-1">
                      {good.map((n, i) => (
                        <SocialRow key={`g${i}`} n={n} prefix="💚" />
                      ))}
                      {bad.map((n, i) => (
                        <SocialRow key={`b${i}`} n={n} prefix="⚠️" />
                      ))}
                      {floorClash && (
                        <div className="rounded-xl bg-amber-400/15 px-2.5 py-1.5 text-[11px] text-amber-200">⬆️⬇️ {floorClash}</div>
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <Btn size="sm" tone="ghost" onClick={() => dispatch({ type: "declineApplicant", tenantId: a.id })}>ปฏิเสธ</Btn>
                <Btn
                  size="sm"
                  disabled={!room}
                  onClick={() => {
                    dispatch({ type: "assign", roomId: room!.id, tenantId: a.id });
                    close();
                  }}
                >
                  ✍️ ให้เช่าห้อง {room ? room.id + 1 : ""}
                </Btn>
              </div>
            </div>
          );
        })}
      </div>}
    </Sheet>
  );
}

/* --------------------------------- ห้อง --------------------------------- */

export function RoomSheet({ state, dispatch, close }: Base) {
  const roomId = state.selectedRoom ?? 0;
  const room = state.rooms[roomId];
  if (!room?.unlocked)
    return (
      <Sheet title="ห้องนี้ยังไม่ได้เปิด" icon="🏠" onClose={close}>
        <p className="text-sm text-white/70">ไปที่เมนู 🏗️ ขยาย เพื่อปลดล็อกห้องใหม่</p>
      </Sheet>
    );

  const scores = roomTraitScores(room, state);
  const top = Object.entries(scores)
    .filter(([, v]) => (v as number) > 0.4)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 8);
  const bad = Object.entries(scores)
    .filter(([, v]) => (v as number) < -0.5)
    .sort((a, b) => (a[1] as number) - (b[1] as number))
    .slice(0, 4);
  const cost = upgradeCost(room.level);
  const free = freeCounts(room);
  const div = roomDiversity(room, state);
  const tenants = room.tenantIds.map((id) => state.tenants[id]).filter(Boolean);

  return (
    <Sheet
      title={`บ้าน ${roomId + 1} / ${houseLevel(room.level).name}`}
      subtitle={`ระดับ ${room.level}/5 / ${houseStoryCount(room.level)} ชั้น / ของ ${room.items.length} ชิ้น / ผู้เช่า ${tenants.length}/${roomCapacity(room)}`}
      icon="🏠"
      onClose={close}
      footer={
        <div className="flex gap-2">
          <Btn tone="ghost" size="sm" disabled={state.money < CLEAN_COST} onClick={() => dispatch({ type: "cleanRoom", roomId })}>
            🧹 {money(CLEAN_COST)}
          </Btn>
          <Btn
            tone="gold"
            size="sm"
            className="flex-1"
            disabled={room.level >= MAX_HOUSE_LEVEL || state.money < cost}
            onClick={() => dispatch({ type: "upgradeRoom", roomId })}
          >
            {room.level >= MAX_HOUSE_LEVEL ? "ระดับสูงสุด 5" : `อัปเกรด Lv.${room.level + 1} / ${money(cost)}`}
          </Btn>
        </div>
      }
    >
      <HouseLevelTrack room={room} />
      <HouseSystems room={room} state={state} />
      <div className="card-soft rounded-2xl p-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-white/60">ความสะอาด</span>
          <span className="tabular font-bold text-white">{Math.round(room.cleanliness)}%</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-white/55">
          {ZONES.filter((z) => !["floor", "loft", "wall"].includes(z)).map((z) => <div key={z}>{ZONE_LABEL[z]} {zoneCapacity(room.level, z) - free[z]}/{zoneCapacity(room.level, z)}</div>)}
        </div>
        <Bar value={room.cleanliness} color={room.cleanliness > 60 ? "#8ef0d0" : room.cleanliness > 30 ? "#ffd166" : "#ff8f8f"} />
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-white/60">
          <span>⬇️ ช่องพื้นชั้นล่าง</span>
          <span className="text-right text-white">
            {floorSlotCount(room.level) - free.floor}/{floorSlotCount(room.level)}
          </span>
          <span>⬆️ ช่องพื้นชั้นลอย</span>
          <span className="text-right text-white">
            {loftSlotCount(room.level) - free.loft}/{loftSlotCount(room.level)}
          </span>
          <span>🧱 ช่องติดผนัง</span>
          <span className="text-right text-white">
            {wallSlotCount(room.level) - free.wall}/{wallSlotCount(room.level)}
          </span>
        </div>
        <div className="mt-2 border-t border-white/10 pt-2">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-white/60">🌈 ความหลากหลาย ({div.covered} รสนิยม)</span>
            <span className="font-bold text-emerald-300">+{Math.round(div.score * 6)} คะแนน</span>
          </div>
          <Bar value={div.score * 100} color="#c8a2ff" height={6} />
            <p className="mt-1 text-[10px] text-white/40">ห้องที่ตอบโจทย์หลายรสนิยมช่วยให้ผู้เช่าทุกคนพอใจ</p>
        </div>
      </div>

      {tenants.length > 0 && (
        <>
          <h3 className="mt-3 mb-1.5 text-xs font-bold text-white/70">ผู้เช่าในห้อง</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {tenants.map((t) => {
              const mood = moodOf(t.satisfaction);
              return (
                <div key={t.id} className="card-soft flex flex-1 items-center gap-2 rounded-2xl p-2">
                  <span className="text-xl">{t.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-bold text-white">{t.name}</div>
                    <Bar value={t.satisfaction} color={MOOD_INFO[mood].color} height={4} />
                  </div>
                  <span className="text-sm">{MOOD_INFO[mood].emoji}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h3 className="mt-3 mb-1.5 text-xs font-bold text-white/70">บรรยากาศห้องตอนนี้</h3>
      {top.length === 0 ? (
        <p className="text-[11px] text-white/45">ห้องยังว่างเปล่า ลองซื้อเฟอร์นิเจอร์มาใส่ดูสิ</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {top.map(([t, v]) => {
            const tr = TRAITS[t as TraitId];
            return (
              <Chip key={t} color={tr.color}>
                {tr.emoji} {tr.th} {Math.round((v as number) * 10) / 10}
              </Chip>
            );
          })}
          {bad.map(([t, v]) => {
            const tr = TRAITS[t as TraitId];
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                style={{ background: "rgba(255,90,90,0.14)", color: "#ff9d9d", border: "1px solid rgba(255,90,90,0.4)" }}
              >
                {tr.emoji} {tr.th} {Math.round((v as number) * 10) / 10}
              </span>
            );
          })}
        </div>
      )}

      <h3 className="mt-3 mb-1.5 text-xs font-bold text-white/70">ของในห้อง</h3>
      <div className="flex flex-col gap-1.5">
        {room.items.length === 0 && <p className="text-[11px] text-white/45">ยังไม่มีของเลย แตะจุดเรืองแสงในห้องเพื่อวางของ</p>}
        {room.items.map((it) => {
          const def = FURNITURE_MAP[it.defId];
          if (!def) return null;
          const nextCost = it.grade < 2 ? def.grades[it.grade + 1].cost - Math.round(def.grades[it.grade].cost * 0.4) : 0;
          const zoneEmoji = ZONE_LABEL[slotZone(it.slot)];
          return (
            <div key={it.uid} className="card-soft flex items-center gap-2 rounded-2xl p-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/25 text-lg">{def.emoji || <span className="font-mono text-[10px]">{def.model?.slice(0, 2).toUpperCase()}</span>}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-white">{def.grades[it.grade].th}</div>
                <div className="text-[10px]" style={{ color: GRADE_COLOR[it.grade] }}>
                  {"◆".repeat(it.grade + 1)} {GRADE_LABEL[it.grade]} • {zoneEmoji}
                </div>
              </div>
              {it.grade < 2 && (
                <Btn size="sm" tone="gold" disabled={state.money < nextCost} onClick={() => dispatch({ type: "upgradeItem", roomId, uid: it.uid })}>
                  ⬆ {money(nextCost)}
                </Btn>
              )}
              <Btn size="sm" tone="ghost" onClick={() => dispatch({ type: "sellItem", roomId, uid: it.uid })}>
                ขาย {money(sellValue(it.defId, it.grade))}
              </Btn>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/* --------------------------------- ขยาย --------------------------------- */

export function ExpandSheet({ state, dispatch, close }: Base) {
  const unlocked = state.rooms.filter((r) => r.unlocked);
  const next = state.rooms.find((r) => !r.unlocked);
  const cost = next ? unlockCost(unlocked.length) : 0;

  return (
    <Sheet title="พัฒนาบ้านเช่า" subtitle="5 ระดับ / 2, 2, 3, 3, 4 คน / บ้านใหญ่ต้องบริหารมากขึ้น" icon="🏗️" onClose={close}>
      <div className="card-soft rounded-2xl p-3">
        <div className="font-cute text-sm font-bold text-amber-200">เปิดบ้านหลังใหม่ เริ่มที่ระดับ 1</div>
        {next ? (
          <>
            <p className="mt-1 text-[11px] text-white/55">
              บ้านถัดไปคือ <b className="text-white">หลัง {next.id + 1}</b> (กลุ่มบ้าน {Math.floor(next.id / 3) + 1}) ราคาก่อสร้างสูงขึ้นตามจำนวนบ้าน
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="tabular text-lg font-bold text-white">{money(cost)}</span>
              <Btn disabled={state.money < cost} onClick={() => dispatch({ type: "unlockRoom", roomId: next.id })}>
                🔨 สร้างเลย
              </Btn>
            </div>
          </>
        ) : (
          <p className="mt-1 text-[11px] text-emerald-300">สร้างครบทุกห้องแล้ว! คุณคือเจ้าพ่อหอพักตัวจริง 👑</p>
        )}
      </div>

      <h3 className="mt-3 mb-1.5 text-xs font-bold text-white/70">อัปเกรดห้องที่มีอยู่</h3>
      <div className="flex flex-col gap-1.5">
        {unlocked.map((r) => {
          const c = upgradeCost(r.level);
          const ts = r.tenantIds.map((id) => state.tenants[id]).filter(Boolean);
          return (
            <div key={r.id} className="card-soft flex items-center gap-2 rounded-2xl p-2.5">
              <div className="grid h-9 min-w-9 place-items-center rounded-xl bg-black/25 px-1 text-base">
                {ts.length ? ts.map((t) => t.emoji).join("") : "🪧"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">
                  บ้าน {r.id + 1} <span className="text-white/40">({ts.length}/{roomCapacity(r)} คน / {houseStoryCount(r.level)} ชั้น)</span>
                </div>
                <div className="text-[10px] text-amber-200">Lv.{r.level}/5 / {houseLevel(r.level).name}</div>
                {r.level < 5 && <div className="text-[9px] text-white/45">ขั้นถัดไป {roomCapacity({ level: r.level + 1 })} คน / ค่าดูแลพื้นฐาน {houseLevel(r.level + 1).upkeep}/วัน</div>}
              </div>
              <Btn
                size="sm"
                tone={r.level >= MAX_HOUSE_LEVEL ? "ghost" : "gold"}
                disabled={r.level >= MAX_HOUSE_LEVEL || state.money < c}
                onClick={() => dispatch({ type: "upgradeRoom", roomId: r.id })}
              >
                {r.level >= MAX_HOUSE_LEVEL ? "Lv.5 สูงสุด" : `Lv.${r.level + 1} / ${money(c)}`}
              </Btn>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl bg-white/5 p-3 text-[11px] leading-relaxed text-white/55">
        <b className="text-white/80">บ้านระดับ 5:</b> รับได้ 4 คน ต้องมีที่นอน ที่นั่ง อากาศ และพื้นที่ส่วนตัวเพียงพอ การใช้ไฟเกินกำลังบ้านทำให้ค่าดูแลสูงขึ้นและผู้เช่าไม่พอใจ ควรเลือกคนและอุปกรณ์ให้สมดุล
      </div>
    </Sheet>
  );
}

/* ------------------------------- ของชิ้นเดียว ------------------------------ */

export function ItemSheet({ state, dispatch, close, uid }: Base & { uid: string }) {
  const roomId = state.selectedRoom ?? 0;
  const room = state.rooms[roomId];
  const item = room?.items.find((i) => i.uid === uid);
  if (!item) return null;
  const def = FURNITURE_MAP[item.defId];
  const nextCost = item.grade < 2 ? def.grades[item.grade + 1].cost - Math.round(def.grades[item.grade].cost * 0.4) : 0;
  const tenants = room.tenantIds.map((id) => state.tenants[id]).filter(Boolean);

  return (
    <Sheet title={def.grades[item.grade].th} subtitle={`${def.th} • ห้อง ${roomId + 1}`} icon={def.emoji} onClose={close}>
      <div className="flex flex-wrap gap-1">
        <StatChips traits={def.traits} mult={def.grades[item.grade].mult} />
      </div>
      <FurnitureStatus def={def} grade={item.grade} />
      <ItemLocation key={uid} room={room} uid={uid} dispatch={dispatch} />
      {tenants.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {tenants.map((t) => {
            const liked = t.likes.filter((l) => (def.traits[l] ?? 0) > 0);
            const hated = (def.traits[t.dislike] ?? 0) > 0;
            return (
              <div key={t.id} className="text-[11px] text-white/60">
                {t.emoji} {t.name}:{" "}
                {liked.length > 0 ? <span className="text-emerald-300">💖 ตรงใจ ({liked.map((l) => TRAITS[l].th).join(", ")})</span> : <span className="text-white/40">เฉย ๆ</span>}{" "}
                {hated && <span className="text-rose-300">💔 ไม่ชอบ{ TRAITS[t.dislike].th}</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {def.grades.map((gr, gi) => (
          <div
            key={gi}
            className={cn(
              "flex items-center gap-2 rounded-2xl p-2.5",
              gi === item.grade ? "bg-white/15 ring-1 ring-white/30" : "card-soft opacity-70",
            )}
          >
            <span className="text-xs font-bold" style={{ color: GRADE_COLOR[gi] }}>
              {"◆".repeat(gi + 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-white">{gr.th}</div>
              <div className="text-[10px] text-white/45">คะแนนความชอบ ×{gr.mult} / สมรรถนะ ×{[1, 1.5, 2.15][gi]} (จำนวนที่นอนคงเดิม)</div>
            </div>
            {gi === item.grade ? (
              <span className="rounded-lg bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">ใช้อยู่</span>
            ) : gi === item.grade + 1 ? (
              <Btn size="sm" tone="gold" disabled={state.money < nextCost} onClick={() => dispatch({ type: "upgradeItem", roomId, uid })}>
                อัปเกรด {money(nextCost)}
              </Btn>
            ) : (
              <span className="tabular text-[10px] text-white/40">{money(gr.cost)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Btn
          tone="danger"
          size="sm"
          onClick={() => {
            dispatch({ type: "sellItem", roomId, uid });
            close();
          }}
        >
          🗑 ขายทิ้ง +{money(sellValue(item.defId, item.grade))}
        </Btn>
      </div>
    </Sheet>
  );
}

function ItemLocation({ room, uid, dispatch }: { room: Room; uid: string; dispatch: (action: Action) => void }) {
  const item = room.items.find((i) => i.uid === uid)!;
  const def = FURNITURE_MAP[item.defId];
  const [target, setTarget] = useState(String(item.slot));
  const encoded = Number(target), zone = slotZone(encoded), slot = encoded % 1000;
  const error = placementError(room, item.defId, item.grade, zone, slot, uid);
  return <section className="mt-4 border-y border-white/10 py-3">
    <label htmlFor={`move-${uid}`} className="mb-1 block text-[11px] text-white/65">ย้ายอุปกรณ์ / ไม่มีค่าใช้จ่าย</label>
    <select id={`move-${uid}`} value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-lg border border-white/15 bg-[#243e35] px-3 py-2 text-xs text-white">
      {allowedZones(def).map((area) => <optgroup key={area} label={ZONE_LABEL[area]}>
        {Array.from({ length: zoneCapacity(room.level, area) }, (_, index) => {
          const candidate = encodeSlot(area, index);
          const blocked = placementError(room, def.id, item.grade, area, index, uid);
          return <option key={candidate} value={candidate} disabled={!!blocked}>{slotStoryLabel(room.level, area, index)} / จุด {index + 1}{candidate === item.slot ? " / ตำแหน่งปัจจุบัน" : blocked ? " / ไม่ว่าง" : " / ว่าง"}</option>;
        })}
      </optgroup>)}
    </select>
    <button type="button" disabled={!!error || encoded === item.slot} className="mt-2 w-full rounded-lg bg-[#b7cba1] py-2 text-xs font-semibold text-[#253f32] disabled:cursor-not-allowed disabled:opacity-35" onClick={() => dispatch({ type: "moveItem", roomId: room.id, uid, zone, slot })}>ย้ายไปตำแหน่งนี้</button>
    {error && <p className="mt-1 text-[10px] text-amber-200">{error}</p>}
  </section>;
}
