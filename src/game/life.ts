import { ACTIVITY_INFO, ALL_ACTIVITY_IDS, type ActivityId } from "./activities";
import type { GameState, Room } from "./engine";
import { isLoftSlot, roomDepth } from "./layout";
import { navigationFor } from "./navigation";
import { createBehavior, type Tenant } from "./tenants";
import { FURNITURE_MAP } from "./furniture";

export function activityTarget(state: GameState, room: Room, tenant: Tenant, activity: ActivityId) {
  const definition = ACTIVITY_INFO[activity];
  if (definition.destination !== "furniture") return { uid: null, allowed: true };
  const claims = room.tenantIds.filter((id) => id !== tenant.id).map((id) => state.tenants[id]?.behavior.targetUid).filter(Boolean);
  const nav = navigationFor(room);
  const entrance = { x: 0, y: 0, z: roomDepth(room.level) / 2 + 0.6 };
  const candidates = room.items.filter((i) => {
    const def = FURNITURE_MAP[i.defId];
    return (definition.items.includes(i.defId) || def?.activities?.includes(activity)) && claims.filter((uid) => uid === i.uid).length < (def?.useCapacity ?? 1);
  })
    .filter((item) => nav.accessPoint(item, entrance))
    .sort((a, b) => Number(isLoftSlot(b.slot) === (tenant.floorPref === "up")) - Number(isLoftSlot(a.slot) === (tenant.floorPref === "up")));
  return { uid: candidates[0]?.uid ?? null, allowed: candidates.length > 0 };
}

export function chooseBehavior(state: GameState, room: Room, tenant: Tenant, requested?: ActivityId, excluded: ActivityId[] = []) {
  const serial = (tenant.behavior?.serial ?? 0) + 1;
  if (requested) {
    const target = activityTarget(state, room, tenant, requested);
    return target.allowed ? createBehavior(requested, state.lifeMs, target.uid, serial) : null;
  }
  const candidates = ALL_ACTIVITY_IDS.filter((id) => id !== tenant.behavior?.activity && !excluded.includes(id)).map((id) => {
    const info = ACTIVITY_INFO[id];
    const target = activityTarget(state, room, tenant, id);
    let weight = id === "idle" ? 0.35 : 1;
    if (tenant.likes.includes(info.trait)) weight += 2;
    if ((tenant.habits as string[]).includes(id)) weight += 5;
    if (id === "sleeping" && tenant.energy < 40) weight += 12;
    if (id === "complain") weight *= tenant.satisfaction < 40 ? 4 : 0.15;
    if (id === "celebrate" && tenant.satisfaction < 40) weight *= 0.15;
    if (id === "socializing" && room.tenantIds.length < 2) weight = 0;
    if (serial % 5 === 2 && info.destination === "loft") weight += 16;
    if (serial % 5 === 4 && (info.destination === "terrace" || info.destination === "door")) weight += 7;
    return { id, target, weight: target.allowed ? weight : 0 };
  }).filter((c) => c.weight > 0);
  let roll = Math.random() * candidates.reduce((sum, c) => sum + c.weight, 0);
  const selected = candidates.find((c) => (roll -= c.weight) <= 0) ?? candidates[0];
  return createBehavior(selected?.id ?? "idle", state.lifeMs, selected?.target.uid ?? null, serial);
}

export function skipBlockedBehavior(state: GameState, room: Room, tenant: Tenant) {
  const old = tenant.behavior;
  const failed = [...new Set([...(old.failedActivities ?? []), old.activity])].slice(-8);
  const failures = (old.failures ?? 0) + 1;
  let next = chooseBehavior(state, room, tenant, undefined, failed)!;
  if (failures >= 3) {
    next = createBehavior(old.activity === "stretch" ? "yawn" : "stretch", state.lifeMs, null, old.serial + 1);
    next.inPlace = true;
    next.phase = "active";
    next.endsAt = state.lifeMs + next.remainingMs;
  }
  return { ...next, failedActivities: failed, failures };
}