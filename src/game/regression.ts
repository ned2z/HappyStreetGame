import { ACTIVITY_INFO, ALL_ACTIVITY_IDS, NEW_ACTIVITY_IDS } from "./activities";
import { LOFT_Y, encodeSlot, placementError, roomDepth, stairs, type Point3 } from "./layout";
import { RoomNavigation, type Waypoint } from "./navigation";
import { initialState, migrate, reducer, type FullState } from "./store";
import { createBehavior, makeTenant } from "./tenants";
import { validatePlacement } from "./placement";
import { FURNITURE, FURNITURE_MAP, ZONES, allowedZones } from "./furniture";
import { EXTRA_FURNITURE } from "./equipmentCatalog";
import { houseLevel, roomCapacity, visibleHouseIds } from "./houseLevels";
import { equipmentEffects, roomSystems } from "./equipment";
import { evaluate } from "./engine";
import { buildProp } from "../three/props";
import { Box3, Vector3 } from "three";
import { advancePath, TENANTS_COLLIDE } from "./movement";
import { OUTDOOR_CATALOG, OUTDOOR_MAP, commonBenefits, commonPlotPosition, outdoorPrice, totalCommonsUpkeep } from "./commons";
import { NEW_RESIDENTS, SPECIAL_RESIDENTS, PROFILE_MAP } from "./residentProfiles";
import { isSpecial } from "./tenants";
import { buildOutdoor } from "../three/commonsModels";
import { createSpecialAura, animateSpecialAura } from "../three/aura";
import { roomTraitScores } from "./engine";

export interface CheckResult { name: string; ok: boolean; detail: string }
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function checkSweptRoute(nav: RoomNavigation, start: Point3, path: Waypoint[]) {
  let previous: Waypoint = start;
  for (const point of path) {
    if (!point.stair && !previous.stair) assert(nav.segmentClear(previous, point), "เส้นทางตัดผ่านสิ่งกีดขวาง");
    if (Math.abs(point.y - previous.y) > 0.02) {
      assert(point.stair || previous.stair, "เปลี่ยนชั้นโดยไม่ผ่านบันได");
      assert(Math.abs(point.y - previous.y) <= LOFT_Y / 12 + 0.05, "ก้าวขึ้นสูงเกินหนึ่งขั้นบันได");
    }
    previous = point;
  }
}

/** Runs on demand in Help, against isolated state. Never touches the player's save. */
export function runRegressionChecks(): CheckResult[] {
  const results: CheckResult[] = [];
  const test = (name: string, action: () => void) => {
    try { action(); results.push({ name, ok: true, detail: "ผ่าน" }); }
    catch (error) { results.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) }); }
  };
  const fresh = (): FullState => {
    const state = initialState();
    return { ...state, intro: false, money: 1000000, tenants: {}, thoughts: {}, outdoorItems: [], applicants: Array.from({ length: 4 }, () => makeTenant({ group: "classic" })), rooms: state.rooms.map((room) => ({ ...room, items: [], tenantIds: [] })) };
  };

  test("มีพฤติกรรมใหม่ 30 แบบ พร้อมนิสัยและบทพูด", () => {
    assert(NEW_ACTIVITY_IDS.length === 30 && ALL_ACTIVITY_IDS.length === 41, "จำนวนพฤติกรรมไม่ครบ");
    assert(NEW_ACTIVITY_IDS.every((id) => ACTIVITY_INFO[id].lines.length === 3 && ACTIVITY_INFO[id].habit && ACTIVITY_INFO[id].expression), "ข้อมูลพฤติกรรมไม่ครบ");
  });
  test("ห้องเริ่มต้นมีทางเดินถึงของทุกชิ้นและชั้นสอง", () => {
    const room = initialState().rooms[0];
    assert(new RoomNavigation(room).routesRemainOpen(), "ห้องเริ่มต้นมีเฟอร์นิเจอร์ขวางทาง");
  });
  for (const level of [1, 2, 3, 4, 5]) test(`เดินขึ้นและลงบันไดจริง / บ้านระดับ ${level}`, () => {
    const room = { ...fresh().rooms[0], level };
    const nav = new RoomNavigation(room);
    const start = { x: 0, y: 0, z: roomDepth(level) / 2 + 0.65 };
    const goal = nav.safePoint({ x: -0.9, y: LOFT_Y, z: stairs(room).top.z });
    assert(goal, "ชั้นสองไม่มีพื้นที่เดินได้");
    const up = nav.findPath(start, goal);
    assert(up && up.some((p) => p.stair), "ไม่มีเส้นทางขึ้นบันได");
    checkSweptRoute(nav, start, up);
    const down = nav.findPath(goal, start);
    assert(down && down.some((p) => p.stair), "ไม่มีเส้นทางกลับลงชั้นล่าง");
    checkSweptRoute(nav, goal, down);
  });
  test("เดินออกนอกห้องและกลับผ่านทางเข้า", () => {
    const room = fresh().rooms[0], nav = new RoomNavigation(room), d = roomDepth(room.level);
    const start = { x: 0, y: 0, z: d / 2 - 0.8 }, end = { x: 0.8, y: 0, z: d / 2 + 0.8 };
    const path = nav.findPath(start, end);
    assert(path && path.at(-1)!.z > d / 2, "เดินออกจากห้องไม่ได้");
    checkSweptRoute(nav, start, path);
  });
  test("เดินอ้อมเฟอร์นิเจอร์ ไม่เดินตัดผ่านกลางชิ้นงาน", () => {
    const room = fresh().rooms[0];
    room.items = [{ uid: "obstacle", defId: "bed", grade: 0, slot: 0 }];
    const nav = new RoomNavigation(room);
    const start = { x: -3.32, y: 0, z: -2.25 }, end = { x: -1.25, y: 0, z: -2.25 };
    assert(!nav.segmentClear(start, end), "ตรวจไม่พบเตียงกลางเส้นทาง");
    const path = nav.findPath(start, end);
    assert(path && path.length > 1, "ไม่พบทางอ้อมเตียง");
    checkSweptRoute(nav, start, path);
  });
  test("กดซื้อซ้ำช่องเดิมไม่เสียเงินและไม่เพิ่มของซ้อน", () => {
    const before = fresh();
    const action = { type: "buyItem" as const, roomId: 0, slot: 0, zone: "floor" as const, defId: "bed", grade: 0 };
    const bought = reducer(before, action);
    assert(bought.rooms[0].items.length === 1, bought.toasts.at(-1)?.text ?? "ซื้อชิ้นแรกไม่ได้");
    const repeated = reducer(bought, action);
    assert(repeated.rooms[0].items.length === 1 && repeated.money === bought.money, "ซื้อทับช่องเดิมได้");
  });
  test("ช่องติดผนังและชั้นสองกันการซื้อทับเช่นเดียวกัน", () => {
    for (const zone of ["wall", "loft"] as const) {
      const initial = fresh(), defId = zone === "wall" ? "painting" : "plant";
      const action = { type: "buyItem" as const, roomId: 0, slot: 0, zone, defId, grade: 0 };
      const placed = reducer(initial, action), duplicate = reducer(placed, action);
      assert(placed.rooms[0].items.some((i) => i.slot === encodeSlot(zone, 0)), "ติดตั้งชิ้นแรกไม่ได้");
      assert(duplicate.rooms[0].items.length === 1 && duplicate.money === placed.money, "ซื้อทับผนังหรือชั้นสองได้");
    }
  });
  test("ปฏิเสธช่องผิดประเภท เกรดผิด และช่องนอกห้อง", () => {
    const room = fresh().rooms[0];
    assert(placementError(room, "bed", 0, "wall", 0), "วางเตียงบนผนังได้");
    assert(placementError(room, "bed", 3, "floor", 0), "ยอมรับเกรดผิด");
    assert(placementError(room, "bed", 0, "floor", -1), "ยอมรับช่องติดลบ");
    assert(placementError(room, "bed", 0, "loft", 99), "ยอมรับช่องนอกพื้นที่");
  });
  test("ไม่ติดตั้งทับตำแหน่งที่ผู้เช่ายืนอยู่", () => {
    const room = fresh().rooms[0];
    assert(validatePlacement(room, "bed", 0, "floor", 0, undefined, [{ x: -2.3, y: 0, z: -2.25 }]), "วางทับตัวละครได้");
  });
  test("ของคนละชั้นไม่ถูกนับว่าเป็นพื้นที่ทับกัน", () => {
    const room = fresh().rooms[0];
    room.items = [{ uid: "lower", defId: "plant", grade: 0, slot: 0 }];
    assert(!validatePlacement(room, "plant", 0, "loft", 0), "แยกความสูงของสองชั้นไม่ถูกต้อง");
  });
  test("กิจกรรมเริ่มจับเวลาหลังเดินถึง และพักเวลาได้", () => {
    let state = fresh();
    const tenant = makeTenant(); tenant.roomId = 0; tenant.behavior = createBehavior("reading", 0, null, 11);
    state.tenants[tenant.id] = tenant; state.rooms[0].tenantIds = [tenant.id];
    state = reducer(state, { type: "advanceLife", elapsed: 1000 });
    assert(state.tenants[tenant.id].behavior.remainingMs === 60000, "จับเวลาระหว่างเดิน");
    state = reducer(state, { type: "arriveActivity", tenantId: tenant.id, serial: 11 });
    for (let i = 0; i < 59; i++) state = reducer(state, { type: "advanceLife", elapsed: 1000 });
    assert(state.tenants[tenant.id].behavior.remainingMs === 1000, "อ่านหนังสือไม่ครบหนึ่งนาที");
    const paused = reducer({ ...state, speed: 0 }, { type: "advanceLife", elapsed: 1000 });
    assert(paused.tenants[tenant.id].behavior.remainingMs === 1000, "เวลาเดินต่อระหว่างพักเกม");
    state = reducer(state, { type: "advanceLife", elapsed: 1000 });
    assert(state.tenants[tenant.id].behavior.serial > 11, "กิจกรรมไม่เปลี่ยนเมื่อหมดเวลา");
    assert(ACTIVITY_INFO.sleeping.durationMs === 120000, "เวลานอนไม่ครบสองนาที");
  });
  test("ผู้เช่าทั้งสองคนมีนาฬิกาและกิจกรรมของตัวเอง", () => {
    let state = fresh();
    const a = makeTenant(), b = makeTenant();
    a.roomId = b.roomId = 0;
    a.behavior = createBehavior("meditate", 0, null, 21); b.behavior = createBehavior("freshAir", 0, null, 31);
    state.tenants = { [a.id]: a, [b.id]: b }; state.rooms[0].tenantIds = [a.id, b.id];
    state = reducer(state, { type: "arriveActivity", tenantId: a.id, serial: 21 });
    state = reducer(state, { type: "arriveActivity", tenantId: b.id, serial: 31 });
    state = reducer(state, { type: "advanceLife", elapsed: 1000 });
    assert(state.tenants[a.id].behavior.remainingMs === 59000 && state.tenants[b.id].behavior.remainingMs === 44000, "กิจกรรมของรูมเมตถูกแชร์หรือรีเซ็ต");
  });
  test("ไม่แย่งใช้เฟอร์นิเจอร์ชิ้นเดียวกันพร้อมกัน", () => {
    let state = fresh();
    state = reducer(state, { type: "buyItem", roomId: 0, defId: "bed", grade: 0, zone: "floor", slot: 0 });
    const bed = state.rooms[0].items[0]; assert(bed, "เตรียมเตียงไม่ได้");
    const a = makeTenant(), b = makeTenant(); a.roomId = b.roomId = 0;
    a.behavior = createBehavior("sleeping", 0, bed.uid); b.behavior = createBehavior("idle");
    state.tenants = { [a.id]: a, [b.id]: b }; state.rooms[0].tenantIds = [a.id, b.id];
    state = reducer(state, { type: "setActivity", tenantId: b.id, activity: "sleeping" });
    assert(state.tenants[b.id].behavior.targetUid !== bed.uid, "รูมเมตใช้เตียงที่ถูกจองแล้ว");
  });
  test("อุปกรณ์เพิ่ม 50 ชนิด มี 50 โมเดลและ 150 รุ่นเกรด", () => {
    assert(EXTRA_FURNITURE.length === 50, "จำนวนอุปกรณ์ใหม่ไม่ครบ 50");
    assert(new Set(EXTRA_FURNITURE.map((f) => f.id)).size === 50, "มีชื่อรหัสอุปกรณ์ซ้ำ");
    assert(new Set(EXTRA_FURNITURE.map((f) => f.model)).size === 50, "ชนิดโมเดลซ้ำ");
    assert(FURNITURE.length === 96 && new Set(FURNITURE.map((f) => f.id)).size === 96, "รายการรวมไม่ครบหรือซ้ำ");
    for (const def of EXTRA_FURNITURE) for (let grade = 0; grade < 3; grade++) {
      const object = buildProp(def.id, grade);
      const size = new Box3().setFromObject(object).getSize(new Vector3());
      assert(size.toArray().every((n) => Number.isFinite(n) && n > 0), `ขนาดโมเดลผิด: ${def.id} / ${grade}`);
      assert(def.grades[grade].cost > 0 && allowedZones(def).length, `ข้อมูลซื้อไม่ครบ: ${def.id}`);
    }
  });
  test("อัปเกรดได้ครบ 5 ระดับและห้ามจ่ายเงินเมื่อเต็มแล้ว", () => {
    let state = fresh();
    for (let level = 1; level < 5; level++) {
      const previous = state.money;
      state = reducer(state, { type: "upgradeRoom", roomId: 0 });
      assert(state.rooms[0].level === level + 1, `อัปเกรดจากระดับ ${level} ไม่ได้`);
      assert(state.money === previous - houseLevel(level).upgrade, "ค่าปรับปรุงไม่ตรงราคา");
    }
    const maxed = reducer(state, { type: "upgradeRoom", roomId: 0 });
    assert(maxed.money === state.money && maxed.rooms[0].level === 5, "ซื้อระดับ 6 ได้หรือถูกหักเงินซ้ำ");
  });
  test("ความจุ 2/2/3/3/4 คน บังคับใช้กับการรับผู้สมัคร", () => {
    for (const level of [1, 2, 3, 4, 5]) {
      let state = fresh(); state.rooms[0].level = level;
      const cap = [2, 2, 3, 3, 4][level - 1];
      assert(roomCapacity(state.rooms[0]) === cap, "ความจุไม่ตรงระดับ");
      for (let i = 0; i < cap + 1; i++) state = reducer(state, { type: "assign", roomId: 0, tenantId: state.applicants[0].id });
      assert(state.rooms[0].tenantIds.length === cap, "รับผู้เช่าเกินความจุ");
    }
  });
  test("พื้นที่ติดตั้งใหม่ใช้ได้จริงทั้ง 7 โซน", () => {
    const examples = { floor: "bed", loft: "dayBed", wall: "firstAidCabinet", terrace: "herbPlanter", nook: "waterDispenser", surface: "electricKettle", ceiling: "pendantLight" };
    for (const zone of ZONES) {
      const state = fresh(); state.rooms[0].level = 5;
      const next = reducer(state, { type: "buyItem", roomId: 0, defId: examples[zone], grade: 0, zone, slot: 0 });
      assert(next.rooms[0].items.length === 1, `${zone}: ${next.toasts.at(-1)?.text ?? "ติดตั้งไม่ได้"}`);
    }
  });
  test("อุปกรณ์ทุกแบบมีโซนและความสามารถที่นำไปใช้ได้", () => {
    for (const def of EXTRA_FURNITURE) {
      const effects = equipmentEffects(def, 0);
      assert(Object.values(effects).some((n) => n !== 0), `ไม่มีความสามารถ: ${def.id}`);
      assert(allowedZones(def).every((zone) => ZONES.includes(zone)), `โซนผิด: ${def.id}`);
      assert((def.minLevel ?? 1) <= 5, `อุปกรณ์ปลดล็อกไม่ได้: ${def.id}`);
    }
  });
  test("บ้าน 4 คนกดดันมากขึ้น และโซลาร์/ความสะอาดมีผลจริง", () => {
    const state = fresh(), room = state.rooms[0]; room.level = 5;
    for (let i = 0; i < 4; i++) { const tenant = makeTenant(); tenant.roomId = 0; state.tenants[tenant.id] = tenant; room.tenantIds.push(tenant.id); }
    room.items = Array.from({ length: 7 }, (_, i) => ({ uid: `oven${i}`, defId: "ovenRange", grade: 2, slot: i }));
    const before = roomSystems(room);
    assert(before.overload > 0 && before.penalty > 0, "ไม่มีแรงกดดันจากคนหรือโหลดไฟ");
    room.items.push({ uid: "solar", defId: "solarPanel", grade: 2, slot: 3000 }, { uid: "clean", defId: "dishWasher", grade: 0, slot: 7 });
    const after = roomSystems(room);
    assert(after.powerUse < before.powerUse && after.dailyCost < before.dailyCost && after.decay < before.decay, "ความสามารถอุปกรณ์ไม่กระทบระบบบ้าน");
    const tenant = state.tenants[room.tenantIds[0]];
    assert(evaluate(state, room, tenant).need > evaluate(state, { ...room, level: 1 }, tenant).need, "บ้านระดับสูงไม่เพิ่มความคาดหวัง");
  });
  test("เตียงสองชั้นรองรับ 2 คน และเกรดไม่สร้างจำนวนเตียงปลอม", () => {
    let state = fresh(); state.rooms[0].level = 5;
    state = reducer(state, { type: "buyItem", roomId: 0, defId: "bunkBed", grade: 0, zone: "floor", slot: 0 });
    const bed = state.rooms[0].items[0]; assert(bed, "ติดตั้งเตียงสองชั้นไม่ได้");
    const a = makeTenant(), b = makeTenant(); a.roomId = b.roomId = 0;
    a.behavior = createBehavior("sleeping", 0, bed.uid); b.behavior = createBehavior("idle");
    state.tenants = { [a.id]: a, [b.id]: b }; state.rooms[0].tenantIds = [a.id, b.id];
    state = reducer(state, { type: "setActivity", tenantId: b.id, activity: "sleeping" });
    assert(state.tenants[b.id].behavior.targetUid === bed.uid, "ผู้เช่าคนที่สองใช้เตียงสองชั้นไม่ได้");
    assert(equipmentEffects(FURNITURE_MAP.bunkBed, 2).beds === 2, "จำนวนที่นอนผิดเมื่ออัปเกรดเกรด");
  });
  test("ย้ายตำแหน่งฟรีและไม่วางทับของเดิม", () => {
    let state = fresh(); state.rooms[0].level = 5;
    state = reducer(state, { type: "buyItem", roomId: 0, defId: "plant", grade: 0, zone: "floor", slot: 0 });
    const uid = state.rooms[0].items[0]?.uid; assert(uid, "เตรียมอุปกรณ์ไม่ได้");
    const funds = state.money;
    state = reducer(state, { type: "moveItem", roomId: 0, uid, zone: "terrace", slot: 0 });
    assert(state.money === funds && state.rooms[0].items[0].slot === 3000, "ย้ายแล้วหักเงินหรือย้ายไม่ได้");
    const duplicate = reducer(state, { type: "buyItem", roomId: 0, defId: "plant", grade: 0, zone: "terrace", slot: 0 });
    assert(duplicate.money === funds && duplicate.rooms[0].items.length === 1, "วางซ้อนในสวนได้");
  });
  test("โหลดเซฟบ้านระดับ 5 แล้วผู้เช่าทั้ง 4 คนยังอยู่", () => {
    const state = fresh(); state.rooms[0].level = 5;
    for (let i = 0; i < 4; i++) { const tenant = makeTenant(); tenant.roomId = 0; state.tenants[tenant.id] = tenant; state.rooms[0].tenantIds.push(tenant.id); }
    const data = migrate(JSON.parse(JSON.stringify(state))) as unknown as FullState;
    assert(data.rooms[0].level === 5 && data.rooms[0].tenantIds.length === 4 && data.money === state.money, "เซฟบ้านระดับสูงถูกตัดข้อมูล");
  });
  test("มุมมองหมู่บ้านเลือกทีละ 3 หลังครบทุกกลุ่ม", () => {
    for (let id = 0; id < 12; id++) {
      const visible = visibleHouseIds(id);
      assert(visible.length === 3 && visible.includes(id) && visible[2] - visible[0] === 2, "มุมมองไม่ได้แสดง 3 หลัง");
    }
  });
  test("ตัวละครเดินสวนทะลุกันได้ทั้งทางเดินและบันได", () => {
    assert(TENANTS_COLLIDE === false, "ยังเปิดการชนระหว่างตัวละคร");
    const room = fresh().rooms[0], nav = new RoomNavigation(room);
    const a = { x: 0, y: 0, z: roomDepth(room.level) / 2 + 0.65 };
    const b = nav.safePoint({ x: -1.0, y: LOFT_Y, z: stairs(room).top.z });
    assert(b, "ไม่มีจุดทดสอบชั้นสอง");
    const startA = { ...a }, startB = { ...b };
    const pathA = nav.findPath(a, b), pathB = nav.findPath(b, a);
    assert(pathA && pathB, "หาเส้นทางสวนกันไม่ได้");
    for (let frame = 0; frame < 1800 && (pathA.length || pathB.length); frame++) {
      advancePath(nav, a, pathA, 0.055);
      advancePath(nav, b, pathB, 0.055);
    }
    assert(!pathA.length && !pathB.length, "มีตัวละครติดทางระหว่างสวนกัน");
    assert(Math.hypot(a.x - startB.x, a.y - startB.y, a.z - startB.z) < 0.05 && Math.hypot(b.x - startA.x, b.y - startA.y, b.z - startA.z) < 0.05, "เดินไม่ถึงปลายทาง");
  });
  test("ผู้เช่าใหม่ 20 คนและ Special 20 ชื่อตรงตามรายการ", () => {
    assert(NEW_RESIDENTS.length === 20 && new Set(NEW_RESIDENTS.map((p) => p.id)).size === 20, "รายชื่อทั่วไปไม่ครบหรือซ้ำ");
    const expected = ["P'Ped", "KarnKeyes", "Unberler", "DoY", "TokTek", "Nedyus", "Anna", "Boba", "Haruyes", "KuKKui", "TeeMOCA", "noni", "TIME", "HyperShark", "Shell", "Stang", "MissA", "Alizza", "ROOT", "WhiteBear"];
    assert(JSON.stringify(SPECIAL_RESIDENTS.map((p) => p.name)) === JSON.stringify(expected), "ชื่อ Special ไม่ตรง");
    for (const profile of [...NEW_RESIDENTS, ...SPECIAL_RESIDENTS]) {
      const person = makeTenant({ profileId: profile.id });
      assert(person.name === profile.name && person.likes.length >= 3 && !person.likes.includes(person.dislike), "โปรไฟล์มีความชอบขัดแย้งภายใน");
      if (profile.special) assert(isSpecial(person) && person.auraColor && person.patience === 2 && person.likes.length === 4, "ข้อมูลผู้เช่าพิเศษไม่ครบ");
    }
  });
  test("เชิญ Special คนเดิมซ้ำไม่ได้และไม่หักเงินซ้ำ", () => {
    const before = fresh();
    const invited = reducer(before, { type: "inviteProfile", profileId: "special-0" });
    const duplicate = reducer(invited, { type: "inviteProfile", profileId: "special-0" });
    assert(invited.money === before.money - 800, "ค่าคำเชิญผิด");
    assert(duplicate.money === invited.money && duplicate.applicants.filter((t) => t.profileId === "special-0").length === 1, "มี Special ซ้ำ");
  });
  test("ความคิดทุกคนรวมบ้านนอกจอ และข้อความยังอยู่หลังบับเบิ้ลหาย", () => {
    let state = fresh(); state.rooms[3].unlocked = true;
    for (const roomId of [0, 0, 1, 3]) {
      const tenant = makeTenant({ group: "classic" }); tenant.roomId = roomId;
      state.tenants[tenant.id] = tenant; state.rooms[roomId].tenantIds.push(tenant.id);
    }
    state = reducer(state, { type: "chatter" });
    assert(Object.keys(state.thoughts).length === 4 && Object.values(state.thoughts).every((thought) => thought.text.length > 0), "ข้อความผู้เช่าไม่ครบทุกบ้าน");
    const saved = { ...state.thoughts };
    state.bubbles = {};
    state = reducer(state, { type: "setSpeed", speed: 0 });
    assert(Object.keys(state.thoughts).length === 4 && Object.entries(saved).every(([id, thought]) => state.thoughts[id].text === thought.text), "ความคิดหายตามบับเบิ้ล");
  });
  test("กิจกรรมติดแล้วเปลี่ยนทันทีและไม่วนค้างเมื่อหลายกิจกรรมเข้าไม่ได้", () => {
    let state = fresh();
    const tenant = makeTenant({ group: "classic" }); tenant.roomId = 0; tenant.behavior = createBehavior("reading", 0, "missing-book", 20);
    state.tenants[tenant.id] = tenant; state.rooms[0].tenantIds = [tenant.id];
    state = reducer(state, { type: "blockedActivity", tenantId: tenant.id, serial: 20 });
    assert(state.tenants[tenant.id].behavior.activity !== "reading" && state.tenants[tenant.id].behavior.serial === 21, "ไม่ข้ามกิจกรรมที่ติด");
    assert(!!state.thoughts[tenant.id]?.text, "ไม่มีข้อความอธิบายการข้าม");
    for (let i = 0; i < 2; i++) state = reducer(state, { type: "blockedActivity", tenantId: tenant.id, serial: state.tenants[tenant.id].behavior.serial });
    const behavior = state.tenants[tenant.id].behavior;
    assert(behavior.inPlace && behavior.phase === "active" && !behavior.targetUid, "ไม่มีการกู้คืนปลอดภัยเมื่อหาเส้นทางไม่ได้ซ้ำ");
    const ignored = reducer(state, { type: "blockedActivity", tenantId: tenant.id, serial: 20 });
    assert(ignored === state, "รับ callback เก่าของกิจกรรมที่ข้ามแล้ว");
  });
  test("ตัวจับเวลาป้องกันเดินค้างทำงานและหยุดเมื่อพักเกม", () => {
    let state = fresh(); const tenant = makeTenant({ group: "classic" }); tenant.roomId = 0;
    tenant.behavior = createBehavior("inspectLoft", 0, null, 17); state.tenants[tenant.id] = tenant; state.rooms[0].tenantIds = [tenant.id];
    for (let i = 0; i < 46; i++) state = reducer(state, { type: "advanceLife", elapsed: 1000 });
    assert(state.tenants[tenant.id].behavior.serial > 17, "ตัวจับเวลาไม่ข้ามกิจกรรมเดินค้าง");
    const paused = { ...state, speed: 0 };
    assert(reducer(paused, { type: "advanceLife", elapsed: 1000 }) === paused, "ตัวจับเวลาเดินต่อเมื่อพักเกม");
  });
  test("ของส่วนกลางใหม่ 20 ชนิดมีโมเดลครบทั้ง 3 เกรด", () => {
    assert(OUTDOOR_CATALOG.length === 20 && new Set(OUTDOOR_CATALOG.map((d) => d.id)).size === 20, "รายการส่วนกลางไม่ครบ");
    for (const def of OUTDOOR_CATALOG) for (let grade = 0; grade < 3; grade++) {
      const object = buildOutdoor({ uid: "test", defId: def.id, district: 0, slot: 0, grade });
      const size = new Box3().setFromObject(object).getSize(new Vector3());
      assert(size.toArray().every((n) => Number.isFinite(n) && n > 0), `โมเดลผิด ${def.id}`);
      assert(size.x <= 2.26 && size.z <= 2.26, "โมเดลกว้างเกินแปลง");
    }
    for (let slot = 0; slot < 12; slot++) assert(commonPlotPosition(slot).z > roomDepth(5) / 2 + 4.15, "วางของส่วนกลางในเขตบ้าน");
  });
  test("สวนเพิ่ม Status ทุกบ้านในกลุ่ม ไม่ข้ามไปกลุ่มอื่น และคิดค่าดูแลครั้งเดียว", () => {
    let state = fresh(); state.rooms[3].unlocked = true;
    const previous = roomTraitScores(state.rooms[0], state).nature ?? 0;
    state = reducer(state, { type: "buyOutdoor", district: 0, slot: 0, defId: "cherryTree", grade: 1 });
    assert(state.outdoorItems.length === 1 && state.rooms.every((r) => r.items.length === 0), "ของส่วนกลางใช้ช่องบ้าน");
    for (const id of [0, 1, 2]) assert((roomTraitScores(state.rooms[id], state).nature ?? 0) > previous, "ไม่ได้โบนัสครบ 3 บ้าน");
    assert((roomTraitScores(state.rooms[3], state).nature ?? 0) === previous, "โบนัสข้ามกลุ่มบ้าน");
    assert(totalCommonsUpkeep(state) === Math.round(OUTDOOR_MAP.cherryTree.effects.upkeep! * 1.25), "คิดค่าดูแลซ้ำตามบ้าน");
  });
  test("ซื้อส่วนกลางทับที่เดิมหรือชนิดเดิมซ้ำไม่ได้", () => {
    const before = fresh();
    const bought = reducer(before, { type: "buyOutdoor", district: 0, slot: 0, defId: "roseArch", grade: 0 });
    const overlapped = reducer(bought, { type: "buyOutdoor", district: 0, slot: 0, defId: "lavenderBed", grade: 0 });
    const duplicated = reducer(bought, { type: "buyOutdoor", district: 0, slot: 1, defId: "roseArch", grade: 0 });
    assert(bought.money === before.money - outdoorPrice(OUTDOOR_MAP.roseArch, 0), "ราคาของส่วนกลางไม่ตรง");
    assert(overlapped.money === bought.money && duplicated.money === bought.money && duplicated.outdoorItems.length === 1, "ของทับหรือซ้ำได้");
  });
  test("ผู้เช่าพิเศษต้องการมากกว่าปกติอย่างชัดเจน", () => {
    const state = fresh(), room = state.rooms[0];
    const vip = makeTenant({ profileId: "special-0" }); vip.roomId = 0;
    room.tenantIds = [vip.id]; state.tenants[vip.id] = vip;
    const standard = { ...vip, kind: "regular" as const, profileId: null, auraColor: null };
    const ordinary = evaluate(state, room, standard), special = evaluate(state, room, vip);
    assert(special.need >= ordinary.need * 1.7 && special.specialRequirements.length === 5 && special.specialPenalty > 0, "เกณฑ์พิเศษไม่ต่างจากคนทั่วไป");
    assert(special.satisfaction <= ordinary.satisfaction, "คนพิเศษพอใจง่ายกว่าปกติในบ้านว่าง");
  });
  test("เงื่อนไขสวนของ Special ทุกคนสามารถทำถึงได้จริง", () => {
    for (const profile of SPECIAL_RESIDENTS) {
      const demand = profile.requirements!;
      const maximum = Math.min(12, OUTDOOR_CATALOG.reduce((sum, item) => sum + Math.max(0, item.traits[demand.outdoorTrait] ?? 0) * 2.2, 0));
      assert(maximum >= demand.outdoorScore, `โบนัสสวนของ ${profile.name} ทำถึงไม่ได้`);
    }
  });
  test("ออร่ามีรูปทรงและอนุภาคที่อัปเดตได้", () => {
    const aura = createSpecialAura("#c8aaef"); animateSpecialAura(aura, 5.5);
    const points = aura.particles.geometry.getAttribute("position");
    assert(points.count === 24 && Number.isFinite(points.getY(5)) && aura.root.children.length >= 3, "ออร่าไม่สมบูรณ์");
    aura.particles.geometry.dispose();
  });
  test("เซฟเก่าอัปเดตได้ และเซฟใหม่เก็บ Special สวนและความคิด", () => {
    let state = fresh(); const vip = makeTenant({ profileId: "special-19" }); vip.roomId = 0;
    state.rooms[0].tenantIds = [vip.id]; state.tenants[vip.id] = vip;
    state = reducer(state, { type: "chatter" });
    state = reducer(state, { type: "buyOutdoor", district: 0, slot: 0, defId: "solarLamp", grade: 2 });
    const saved = migrate(JSON.parse(JSON.stringify(state))) as unknown as FullState;
    assert(saved.outdoorItems.length === 1 && saved.thoughts[vip.id].text === state.thoughts[vip.id].text && isSpecial(saved.tenants[vip.id]) && saved.tenants[vip.id].auraColor === PROFILE_MAP["special-19"].color, "ข้อมูลใหม่หายหลังโหลด");
    const old = JSON.parse(JSON.stringify(fresh())); delete old.outdoorItems; delete old.thoughts;
    const migrated = migrate(old) as unknown as FullState;
    assert(Array.isArray(migrated.outdoorItems) && !!migrated.thoughts, "โหลดเซฟที่ไม่มีข้อมูลใหม่ไม่ได้");
    assert(commonBenefits(saved, 0).count === 1, "โบนัสสวนหายหลังโหลด");
  });
  return results;
}