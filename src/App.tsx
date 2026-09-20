import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { SceneManager, type PickTarget, type SceneOptions } from "./three/scene";
import { clearSave, initialState, loadState, reducer, saveState, type Action, type FullState } from "./game/store";
import { dailyUpkeep, evaluate, roomCapacity, type Evaluation } from "./game/engine";
import { BottomDock, Toasts, TopBar, type SheetKind } from "./components/Hud";
import { ApplicantSheet, ExpandSheet, ItemSheet, RoomSheet, ShopSheet, TenantSheet } from "./components/Sheets";
import { Intro } from "./components/Intro";
import { SceneTools } from "./components/SceneTools";
import { ACTIVITY_INFO } from "./game/activities";
import { ThoughtBoard } from "./components/ThoughtBoard";
import { OutdoorSheet } from "./components/OutdoorSheet";

export default function App() {
  const [state, rawDispatch] = useReducer(reducer, undefined, () => loadState() ?? initialState());
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [itemUid, setItemUid] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [sceneOptions, setSceneOptions] = useState<SceneOptions>({ scope: "building", upper: true, paths: false });
  const [graphicsError, setGraphicsError] = useState(false);
  const [outdoorSlot, setOutdoorSlot] = useState<number | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const dispatch = useCallback((action: Action) => {
    if ((action.type === "selectSlot" && action.place === "loft") || (action.type === "buyItem" && action.zone === "loft")) setSceneOptions((options) => ({ ...options, upper: true }));
    if (action.type === "setActivity" && ACTIVITY_INFO[action.activity]?.destination === "loft") setSceneOptions((options) => ({ ...options, upper: true }));
    if (action.type === "buyItem" || action.type === "upgradeItem" || action.type === "moveItem") {
      rawDispatch({ ...action, actors: sceneRef.current?.actorPositions(action.roomId) ?? [] });
    } else rawDispatch(action);
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  /* ------------------------------ three.js ------------------------------ */
  useEffect(() => {
    if (!mountRef.current) return;
    let sm: SceneManager;
    try { sm = new SceneManager(mountRef.current); }
    catch { setGraphicsError(true); return; }
    sceneRef.current = sm;
    sm.onActivity = (kind, tenantId, serial) => rawDispatch({ type: kind === "arrived" ? "arriveActivity" : "blockedActivity", tenantId, serial });
    sm.sync(stateRef.current);
    return () => {
      sm.dispose();
      sceneRef.current = null;
    };
  }, []);

  const handlePick = useCallback((t: PickTarget) => {
    switch (t.type) {
      case "room":
        dispatch({ type: "selectRoom", id: t.roomId });
        break;
      case "slot":
        dispatch({ type: "selectRoom", id: t.roomId });
        dispatch({ type: "selectSlot", slot: t.slot!, place: t.place! });
        setSheet("shop");
        break;
      case "item":
        dispatch({ type: "selectRoom", id: t.roomId });
        setItemUid(t.uid!);
        setSheet("item");
        break;
      case "tenant":
        dispatch({ type: "selectRoom", id: t.roomId });
        setSheet("tenant");
        break;
      case "locked":
        dispatch({ type: "selectRoom", id: t.roomId });
        setSheet("expand");
        break;
      case "outdoor-slot":
      case "outdoor-item":
        dispatch({ type: "selectRoom", id: (t.district ?? 0) * 3 });
        setOutdoorSlot(t.slot ?? null);
        setSheet("outdoor");
        break;
    }
  }, [dispatch]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.onPick = handlePick;
  }, [handlePick]);

  useEffect(() => {
    sceneRef.current?.sync(help ? { ...state, intro: true } : state);
  }, [state, help]);

  useEffect(() => { sceneRef.current?.configure(sceneOptions); }, [sceneOptions]);

  /* ------------------------------- เวลาเดิน ------------------------------ */
  useEffect(() => {
    if (state.speed === 0 || state.intro || help) return;
    const ms = 30000 / state.speed;
    const id = setInterval(() => { if (!document.hidden) dispatch({ type: "tick" }); }, ms);
    const chat = setInterval(() => { if (!document.hidden) dispatch({ type: "chatter" }); }, 9500);
    let last = performance.now();
    const life = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) dispatch({ type: "advanceLife", elapsed: Math.min(500, now - last) });
      last = now;
    }, 250);
    return () => {
      clearInterval(id);
      clearInterval(chat);
      clearInterval(life);
    };
  }, [state.speed, state.intro, help, dispatch]);

  /* ------------------------------- เซฟเกม ------------------------------- */
  useEffect(() => {
    const save = () => saveState(stateRef.current);
    const id = setInterval(save, 3000);
    window.addEventListener("pagehide", save);
    return () => { clearInterval(id); window.removeEventListener("pagehide", save); save(); };
  }, []);

  /* ------------------------------ คำนวณสรุป ----------------------------- */
  const { evals, roomRents, net } = useMemo(() => {
    const evals: Record<string, Evaluation> = {};
    const roomRents: Record<number, number> = {};
    let income = 0;
    for (const r of state.rooms) {
      if (!r.unlocked) continue;
      let sum = 0;
      for (const tid of r.tenantIds) {
        const t = state.tenants[tid];
        if (!t) continue;
        const e = evaluate(state as FullState, r, t);
        evals[tid] = e;
        sum += e.rent;
      }
      roomRents[r.id] = sum;
      income += sum;
    }
    return { evals, roomRents, net: income - dailyUpkeep(state) };
  }, [state]);

  const close = useCallback(() => {
    setSheet(null);
    dispatch({ type: "clearSlot" });
  }, [dispatch]);
  const openSheet = useCallback((next: SheetKind) => {
    if (next === "outdoor") {
      setSceneOptions((options) => ({ ...options, scope: "building" }));
      setOutdoorSlot(null);
    }
    setSheet(next);
  }, []);

  const selRoom = state.selectedRoom != null ? state.rooms[state.selectedRoom] : null;
  const hasVacancy = state.rooms.some((r) => r.unlocked && r.tenantIds.length < roomCapacity(r));
  const page = Math.floor((state.selectedRoom ?? 0) / 3);
  const maxPage = Math.floor((state.rooms.find((r) => !r.unlocked)?.id ?? state.rooms.length - 1) / 3);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#dce5d7] select-none">
      <div ref={mountRef} className="game-canvas" />

      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_20px_rgba(85,108,83,0.08)]" />
      {graphicsError && <div role="alert" className="absolute inset-0 grid place-items-center px-6 text-center text-[#415847]">เบราว์เซอร์นี้เปิดฉาก 3D ไม่ได้ กรุณาเปิด WebGL หรือใช้เบราว์เซอร์รุ่นล่าสุด ระบบจัดการห้องยังใช้งานได้</div>}

      <TopBar state={state} dispatch={dispatch} net={net} onHelp={() => setHelp(true)} />
      <Toasts state={state} dispatch={dispatch} />
      <BottomDock state={state} dispatch={dispatch} evals={evals} roomRents={roomRents} net={net} openSheet={openSheet} sheet={sheet} />
      {!state.intro && !help && <ThoughtBoard state={state} dispatch={dispatch} covered={sheet !== null} onInspect={(roomId) => { dispatch({ type: "selectRoom", id: roomId }); setSheet("tenant"); }} />}
      {!state.intro && !help && <SceneTools options={sceneOptions} onChange={setSceneOptions} onZoom={(amount) => sceneRef.current?.zoom(amount)} onReset={() => sceneRef.current?.resetCamera()} page={page} maxPage={maxPage} onPage={(p) => { setSceneOptions((options) => ({ ...options, scope: "building" })); dispatch({ type: "selectRoom", id: p * 3 }); }} />}

      {/* ป้ายคำแนะนำ */}
      {sheet === null && !state.intro && (
        <div className="pointer-events-none absolute top-[86px] left-1/2 w-[min(94vw,460px)] -translate-x-1/2 text-center">
          <div className="glass inline-block rounded-full px-3 py-1 text-[11px] text-white/85">
            {hasVacancy
              ? "เลือกผู้เช่าให้เข้ากับบ้าน / พัฒนาถึง Lv.5 เพื่อรับ 4 คน"
              : selRoom?.unlocked
                ? `บ้าน ${selRoom.id + 1} / Lv.${selRoom.level} / แตะวงกลมเพื่อวางอุปกรณ์`
                : "แตะห้องในตึกเพื่อเลือกห้อง"}
          </div>
        </div>
      )}

      {sheet === "shop" && <ShopSheet state={state} dispatch={dispatch} close={close} />}
      {sheet === "tenant" && <TenantSheet state={state} dispatch={dispatch} close={close} evs={evals} />}
      {sheet === "applicants" && <ApplicantSheet state={state} dispatch={dispatch} close={close} />}
      {sheet === "room" && <RoomSheet state={state} dispatch={dispatch} close={close} />}
      {sheet === "expand" && <ExpandSheet state={state} dispatch={dispatch} close={close} />}
      {sheet === "outdoor" && <OutdoorSheet key={`${page}:${outdoorSlot}`} state={state} dispatch={dispatch} close={close} initialSlot={outdoorSlot} />}
      {sheet === "item" && itemUid && <ItemSheet state={state} dispatch={dispatch} close={close} uid={itemUid} />}

      {(state.intro || help) && (
        <Intro
          onStart={() => {
            setHelp(false);
            dispatch({ type: "closeIntro" });
          }}
          onReset={() => {
            clearSave();
            setHelp(false);
            dispatch({ type: "reset" });
            dispatch({ type: "closeIntro" });
          }}
        />
      )}
    </div>
  );
}
