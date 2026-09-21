import type { Action, FullState } from "../game/store";
import { roomCapacity, reputation, unlockCost, houseLevel, type Evaluation } from "../game/engine";
import { houseStoryCount } from "../game/layout";
import { FLOOR_PREF_INFO, MOOD_INFO, moodOf } from "../game/tenants";
import { Bar, money, Stars } from "./ui";
import { cn } from "../utils/cn";

export type SheetKind = "shop" | "tenant" | "applicants" | "room" | "item" | "expand" | "outdoor" | null;

const room_cleanWarn = (c: number) => c < 70;

interface Props {
  state: FullState;
  dispatch: (a: Action) => void;
  /** ประเมินรายคน (key = tenantId) */
  evals: Record<string, Evaluation>;
  roomRents: Record<number, number>;
  net: number;
  openSheet: (s: SheetKind) => void;
  sheet: SheetKind;
}

const ModeIcon = ({ name }: { name: Exclude<SheetKind, "item" | null> }) => {
  const paths: Record<typeof name, string[]> = {
    shop: ["M4 20h16M7 20V9h10v11M5 9l7-5 7 5", "M9 13h6M12 10v6"],
    outdoor: ["M12 21v-9M12 15c-4 0-6-2-6-6 4 0 6 2 6 6ZM12 12c4 0 6-2 6-6-4 0-6 2-6 6"],
    tenant: ["M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11a3 3 0 0 1 3 3v1"],
    applicants: ["M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M16 11h6"],
    room: ["m3 10 9-7 9 7v10H3ZM9 20v-7h6v7"],
    expand: ["M4 20h16M6 20V8h12v12M9 8V4h6v4M12 11v6M9 14h6"],
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name].map((d) => <path key={d} d={d} />)}</svg>;
};

export function BuildRail({ state, sheet, openSheet }: Pick<Props, "state" | "sheet" | "openSheet">) {
  const selected = state.rooms[state.selectedRoom ?? 0];
  const modes: { key: Exclude<SheetKind, "item" | null>; label: string }[] = [
    { key: "shop", label: "ตกแต่ง" },
    { key: "outdoor", label: "ส่วนกลาง" },
    { key: "tenant", label: "ผู้เช่า" },
    { key: "applicants", label: "ผู้สมัคร" },
    { key: "room", label: "จัดการบ้าน" },
    { key: "expand", label: "พัฒนาบ้าน" },
  ];
  return <nav className="build-rail" aria-label="Build Mode">
    <div className="build-rail-title"><span>BUILD</span><small>MODE</small></div>
    {modes.map((mode) => <button type="button" key={mode.key} aria-pressed={sheet === mode.key} onClick={() => openSheet(sheet === mode.key ? null : mode.key)} title={mode.label}>
      <ModeIcon name={mode.key} /><span>{mode.label}</span>
      {mode.key === "tenant" && selected?.tenantIds.length > 0 && <b>{selected.tenantIds.length}</b>}
      {mode.key === "applicants" && state.applicants.length > 0 && <b>{state.applicants.length}</b>}
    </button>)}
  </nav>;
}

export function TopBar({
  state,
  dispatch,
  net,
  onHelp,
}: {
  state: FullState;
  dispatch: (a: Action) => void;
  net: number;
  onHelp: () => void;
}) {
  const rep = reputation(state);
  const unlocked = state.rooms.filter((r) => r.unlocked);
  const tenantCount = unlocked.reduce((s, r) => s + r.tenantIds.length, 0);
  const capacity = unlocked.reduce((sum, room) => sum + roomCapacity(room), 0);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="glass pointer-events-auto rounded-2xl px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <div>
            <div className="tabular font-cute text-lg leading-none font-bold text-amber-200">{money(state.money)}</div>
            <div className={cn("tabular text-[10px] leading-tight", net >= 0 ? "text-emerald-300" : "text-rose-300")}>
              {net >= 0 ? "+" : ""}
              {money(net)} / วัน
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/60">
          <span>
            {unlocked.length} บ้าน / ผู้เช่า {tenantCount}/{capacity}
          </span>
          <Stars value={rep} />
        </div>
      </div>
      <div className="village-brand"><span>Cozy Nest</span><small>A LITTLE NEIGHBOURHOOD</small></div>

      <div className="date-bar glass pointer-events-auto flex items-center gap-1.5 rounded-2xl px-2 py-2">
        <div className="date-copy px-1 text-center">
          <div className="date-label">DAY</div>
          <div className="font-cute leading-none font-bold text-white">วันที่ {state.day}</div>
        </div>
        {[0, 1, 2, 4].map((s) => (
          <button
            key={s}
            aria-label={s === 0 ? "หยุดเวลา" : `ความเร็ว ${s} เท่า`}
            aria-pressed={state.speed === s}
            onClick={() => dispatch({ type: "setSpeed", speed: s })}
            className={cn(
              "btn-pop grid h-7 w-7 place-items-center rounded-lg text-[10px] font-bold",
              state.speed === s ? "bg-amber-300 text-[#3a2a00]" : "bg-white/10 text-white/70",
            )}
          >
            {s === 0 ? "⏸" : `${s}x`}
          </button>
        ))}
        <button onClick={onHelp} aria-label="วิธีเล่นและสิ่งที่เพิ่มใหม่" className="btn-pop grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-[11px] text-white/70">
          ?
        </button>
      </div>
    </div>
  );
}

export function BottomDock({ state, dispatch, evals, roomRents, openSheet }: Props) {
  const unlockedRooms = state.rooms.filter((r) => r.unlocked);
  const nextLocked = state.rooms.find((r) => !r.unlocked);
  const cost = nextLocked ? unlockCost(unlockedRooms.length) : 0;
  const sel = state.selectedRoom;

  return (
    <div className="house-strip pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* แถบห้องทั้งหมด */}
      <div className="house-dock no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto pb-1">
        {unlockedRooms.map((r) => {
          const tenants = r.tenantIds.map((id) => state.tenants[id]).filter(Boolean);
          const avg = tenants.length ? tenants.reduce((s, t) => s + t.satisfaction, 0) / tenants.length : 0;
          const avgMood = moodOf(avg);
          const roomEvs = tenants.map((t) => evals[t.id]).filter(Boolean);
          const hasRmBad = roomEvs.some((e) => e.roommate.some((n) => !n.good));
          const hasRmGood = roomEvs.some((e) => e.roommate.some((n) => n.good));
          const hasNbBad = roomEvs.some((e) => e.neighbors.some((n) => !n.good));
          return (
            <button
              key={r.id}
              onClick={() => dispatch({ type: "selectRoom", id: r.id })}
              className={cn(
                "house-tile btn-pop glass w-[152px] shrink-0 rounded-2xl px-2.5 py-2 text-left",
                sel === r.id ? "ring-2 ring-amber-300" : "",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-cute text-xs font-bold text-white">บ้าน {r.id + 1}</span>
                <span className="text-[10px]" style={{ color: houseLevel(r.level).color }}>Lv.{r.level} / {houseStoryCount(r.level)}F</span>
              </div>
              {tenants.length > 0 ? (
                <>
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {tenants.slice(0, 2).map((t) => {
                      const mood = moodOf(t.satisfaction);
                      return (
                        <div key={t.id} className="flex items-center gap-1">
                          <span className="text-base leading-none">{t.emoji}</span>
                          <span className="truncate text-[11px] text-white/80">{t.name}</span>
                          <span className="text-[9px]">{FLOOR_PREF_INFO[t.floorPref].emoji}</span>
                          <span className="ml-auto text-xs">{MOOD_INFO[mood].emoji}</span>
                        </div>
                      );
                    })}
                    {tenants.length > 2 && <div className="text-[10px] text-white/55">และรูมเมตอีก {tenants.length - 2} คน</div>}
                    {tenants.length < roomCapacity(r) && (
                      <div className="text-[10px] text-white/40">ว่างอีก {roomCapacity(r) - tenants.length} / {roomCapacity(r)} ที่</div>
                    )}
                  </div>
                  <div className="mt-1">
                    <Bar value={avg} color={MOOD_INFO[avgMood].color} height={5} />
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="tabular text-[10px] text-emerald-300">+{money(roomRents[r.id] ?? 0)}/วัน</span>
                    {hasRmBad && <span className="text-[10px]" title="รูมเมทไม่ถูกกัน">💢</span>}
                    {hasRmGood && !hasRmBad && <span className="text-[10px]" title="รูมเมทถูกคอ">💚</span>}
                    {hasNbBad && <span className="text-[10px]" title="มีปัญหากับห้องข้างๆ">😡</span>}
                    {room_cleanWarn(r.cleanliness) && <span className="text-[10px]">🧹</span>}
                  </div>
                </>
              ) : (
                <div className="mt-1 text-[11px] text-white/45">
                  <div className="text-lg">🪧</div>
                  ว่าง {roomCapacity(r)} ที่ / รอผู้เช่า
                </div>
              )}
            </button>
          );
        })}
        {nextLocked && (
          <button
            onClick={() => {
              dispatch({ type: "selectRoom", id: nextLocked.id });
              openSheet("expand");
            }}
            className="btn-pop glass w-[124px] shrink-0 rounded-2xl border-dashed px-2.5 py-2 text-left"
          >
            <div className="font-cute text-xs font-bold text-amber-200">+ เปิดบ้านใหม่</div>
            <div className="mt-2 text-2xl">🏗️</div>
            <div className="tabular mt-1 text-[10px] text-white/60">{money(cost)}</div>
          </button>
        )}
      </div>

    </div>
  );
}

export function Toasts({ state, dispatch }: { state: FullState; dispatch: (a: Action) => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none absolute top-[126px] left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col items-center gap-1.5">
      {state.toasts.map((t) => (
        <div
          key={t.id}
          onAnimationEnd={() => dispatch({ type: "dismissToast", id: t.id })}
          className={cn(
            "anim-float rounded-full px-3.5 py-1.5 text-center text-[12px] font-semibold shadow-lg",
            t.kind === "good"
              ? "bg-emerald-400/95 text-emerald-950"
              : t.kind === "bad"
                ? "bg-rose-400/95 text-rose-950"
                : "bg-white/90 text-slate-800",
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
