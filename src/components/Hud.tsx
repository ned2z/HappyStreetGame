import type { Action, FullState } from "../game/store";
import { roomCapacity, reputation, unlockCost, houseLevel, type Evaluation } from "../game/engine";
import { FLOOR_PREF_INFO, MOOD_INFO, moodOf } from "../game/tenants";
import { Bar, money, Stars } from "./ui";
import { cn } from "../utils/cn";

export type SheetKind = "shop" | "tenant" | "applicants" | "room" | "item" | "expand" | "outdoor" | null;

const room_cleanWarn = (c: number) => c < 45;

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

      <div className="glass pointer-events-auto flex items-center gap-1 rounded-2xl px-1.5 py-1.5">
        <div className="px-1 text-center">
          <div className="font-cute text-xs leading-none font-bold text-white">วันที่ {state.day}</div>
          <div className="hidden text-[9px] text-white/50 sm:block">Cozy Nest</div>
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

export function BottomDock({ state, dispatch, evals, roomRents, openSheet, sheet }: Props) {
  const unlockedRooms = state.rooms.filter((r) => r.unlocked);
  const nextLocked = state.rooms.find((r) => !r.unlocked);
  const cost = nextLocked ? unlockCost(unlockedRooms.length) : 0;
  const sel = state.selectedRoom;
  const selRoom = sel != null ? state.rooms[sel] : null;
  const selFirst = selRoom?.tenantIds[0] ? state.tenants[selRoom.tenantIds[0]] : null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                <span className="text-[10px]" style={{ color: houseLevel(r.level).color }}>Lv.{r.level}/5</span>
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

      {/* เมนูหลัก */}
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-2xl p-1.5">
        {[
          { k: "shop" as const, icon: "🛒", label: "ตกแต่ง" },
          { k: "outdoor" as const, icon: "S", label: "ส่วนกลาง" },
          { k: "tenant" as const, icon: selFirst ? selFirst.emoji : "👤", label: "ผู้เช่า" },
          { k: "applicants" as const, icon: "👥", label: `ผู้สมัคร (${state.applicants.length})` },
          { k: "room" as const, icon: "🏠", label: "บ้าน" },
          { k: "expand" as const, icon: "🏗️", label: "ขยาย" },
        ].map((b) => (
          <button
            key={b.k}
            onClick={() => openSheet(sheet === b.k ? null : b.k)}
            className={cn(
              "btn-pop flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold",
              sheet === b.k ? "bg-amber-300 text-[#3a2a00]" : "text-white/75 hover:bg-white/10",
            )}
          >
            <span className="text-lg leading-none">{b.icon}</span>
            <span className="truncate">{b.label}</span>
          </button>
        ))}
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
