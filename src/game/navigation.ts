import type { PlacedItem, Room } from "./engine";
import {
  ACTOR_RADIUS, LOFT_Y, ROOM_W, STAIR_STEPS, TERRACE_DEPTH, isWallSlot, interactionFloor, slotZone,
  itemBounds, loftFront, pointInBounds, roomDepth, slotPosition, stairs, terraceFixtures,
  type Bounds3, type Point3,
} from "./layout";

export interface Waypoint extends Point3 { stair?: boolean }
interface Node extends Waypoint { edges: number[] }
const STEP = 0.2;
const distance = (a: Point3, b: Point3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function layoutKey(room: Room) {
  return `${room.level}|${room.items.map((i) => `${i.uid}:${i.defId}:${i.grade}:${i.slot}`).join("|")}`;
}

const cache = new Map<string, RoomNavigation>();
export function navigationFor(room: Room) {
  const key = layoutKey(room);
  let nav = cache.get(key);
  if (!nav) {
    nav = new RoomNavigation(room);
    cache.set(key, nav);
    if (cache.size > 36) cache.delete(cache.keys().next().value!);
  }
  return nav;
}

/** Two walkable grids joined only by the physical staircase, never by a vertical teleport. */
export class RoomNavigation {
  readonly room: Room;
  readonly nodes: Node[] = [];
  readonly obstacles: Bounds3[];
  private reachable = new Set<number>();

  constructor(room: Room) {
    this.room = { ...room, items: room.items.map((item) => ({ ...item })), tenantIds: [...room.tenantIds] };
    const d = roomDepth(room.level);
    const front = loftFront(room.level);
    this.obstacles = [
      ...room.items.filter((i) => i.defId !== "rug" && !(i.defId === "yoga" && i.grade < 2)).map((i) => itemBounds(room, i)),
      stairs(room).bounds,
      ...terraceFixtures(room),
      { min: { x: -ROOM_W / 2, y: 0, z: d / 2 - 0.07 }, max: { x: -0.92, y: 0.6, z: d / 2 + 0.07 } },
      { min: { x: 0.92, y: 0, z: d / 2 - 0.07 }, max: { x: ROOM_W / 2, y: 0.6, z: d / 2 + 0.07 } },
      { min: { x: 0.92, y: 0, z: d / 2 - 1.1 }, max: { x: 1.05, y: 1.84, z: d / 2 + 0.10 } },
      { min: { x: -3.48, y: 0, z: front - 0.11 }, max: { x: -3.32, y: LOFT_Y - 0.1, z: front + 0.11 } },
    ];
    this.buildGrid(0, d / 2 + TERRACE_DEPTH - 0.34);
    this.buildGrid(LOFT_Y, front - 0.30);
    const stair = stairs(room);
    const bottomId = this.addNode({ ...stair.bottom, stair: true });
    this.connectLanding(bottomId, 0);
    let previous = bottomId;
    for (let i = 1; i <= STAIR_STEPS; i++) {
      const ratio = i / STAIR_STEPS;
      const id = this.addNode({ x: stair.bottom.x, y: LOFT_Y * ratio, z: stair.bottom.z + (stair.top.z - stair.bottom.z) * ratio, stair: true });
      this.link(previous, id);
      previous = id;
    }
    this.connectLanding(previous, LOFT_Y);
    const seed = this.nearest({ x: 0, y: 0, z: d / 2 + 0.65 });
    if (seed >= 0) {
      const queue = [seed];
      this.reachable.add(seed);
      for (let at = 0; at < queue.length; at++) {
        for (const id of this.nodes[queue[at]].edges) if (!this.reachable.has(id)) {
          this.reachable.add(id);
          queue.push(id);
        }
      }
    }
  }

  isClear(p: Point3, radius = ACTOR_RADIUS, avoid: Point3[] = []) {
    const d = roomDepth(this.room.level);
    if (p.x < -ROOM_W / 2 + radius + 0.11 || p.x > ROOM_W / 2 - radius - 0.11) return false;
    const upper = p.y > LOFT_Y / 2;
    const maxZ = upper ? loftFront(this.room.level) - radius : d / 2 + TERRACE_DEPTH - radius;
    if (p.z < -d / 2 + radius + 0.13 || p.z > maxZ) return false;
    if (this.obstacles.some((b) => p.y < b.max.y - 0.02 && p.y + 1.12 > b.min.y + 0.03 && pointInBounds(p, b, radius))) return false;
    return !avoid.some((a) => Math.abs(a.y - p.y) < 0.6 && Math.hypot(a.x - p.x, a.z - p.z) < radius * 2 + 0.08);
  }

  segmentClear(a: Point3, b: Point3, avoid: Point3[] = []) {
    if (Math.abs(a.y - b.y) > 0.03) return false;
    const n = Math.max(1, Math.ceil(distance(a, b) / 0.07));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      if (!this.isClear({ x: a.x + (b.x - a.x) * k, y: a.y, z: a.z + (b.z - a.z) * k }, ACTOR_RADIUS, avoid)) return false;
    }
    return true;
  }

  private addNode(p: Waypoint) {
    this.nodes.push({ ...p, edges: [] });
    return this.nodes.length - 1;
  }
  private link(a: number, b: number) {
    this.nodes[a].edges.push(b);
    this.nodes[b].edges.push(a);
  }
  private buildGrid(y: number, endZ: number) {
    const lookup = new Map<string, number>();
    const startX = -ROOM_W / 2 + 0.38;
    const startZ = -roomDepth(this.room.level) / 2 + 0.40;
    for (let iz = 0; startZ + iz * STEP <= endZ; iz++) {
      for (let ix = 0; startX + ix * STEP <= ROOM_W / 2 - 0.38; ix++) {
        const p = { x: startX + ix * STEP, y, z: startZ + iz * STEP };
        if (!this.isClear(p)) continue;
        const id = this.addNode(p);
        lookup.set(`${ix},${iz}`, id);
        for (const [dx, dz] of [[-1, 0], [0, -1], [-1, -1], [1, -1]]) {
          const other = lookup.get(`${ix + dx},${iz + dz}`);
          if (other !== undefined && this.segmentClear(p, this.nodes[other])) this.link(id, other);
        }
      }
    }
  }
  private connectLanding(id: number, y: number) {
    const candidates = this.nodes.map((n, index) => ({ n, index, d: distance(n, this.nodes[id]) }))
      .filter(({ n, d }) => !n.stair && Math.abs(n.y - y) < 0.02 && d < 0.65)
      .sort((a, b) => a.d - b.d);
    for (const { n, index } of candidates.slice(0, 8)) if (this.segmentClear(this.nodes[id], n)) this.link(id, index);
  }
  nearest(p: Point3, reachableOnly = false, avoid: Point3[] = []) {
    let best = -1;
    let cost = Infinity;
    this.nodes.forEach((n, id) => {
      if (reachableOnly && !this.reachable.has(id)) return;
      if (avoid.some((a) => distance(a, n) < 0.61)) return;
      const d = distance(p, n);
      if (d < cost) { best = id; cost = d; }
    });
    return best;
  }
  safePoint(p: Point3, avoid: Point3[] = []): Waypoint | null {
    const candidates = this.nodes.map((n, id) => ({ n, id, d: distance(p, n) }))
      .filter(({ n, id }) => !n.stair && this.reachable.has(id) && Math.abs(n.y - p.y) < 0.1 && !avoid.some((a) => distance(a, n) < 0.7))
      .sort((a, b) => a.d - b.d);
    return candidates[0] ? { x: candidates[0].n.x, y: candidates[0].n.y, z: candidates[0].n.z } : null;
  }

  accessPoint(item: PlacedItem, from: Point3, avoid: Point3[] = []): Waypoint | null {
    const bounds = itemBounds(this.room, item);
    const p = slotPosition(this.room, item.slot);
    const y = interactionFloor(item.slot);
    const margin = ACTOR_RADIUS + 0.14;
    const points: Point3[] = [
      { x: p.x, y, z: bounds.max.z + margin },
      { x: bounds.min.x - margin, y, z: p.z },
      { x: bounds.max.x + margin, y, z: p.z },
      { x: p.x, y, z: bounds.min.z - margin },
    ];
    if (isWallSlot(item.slot) || slotZone(item.slot) === "surface" || slotZone(item.slot) === "ceiling") {
      for (const reach of [0.8, 1.5, 2.3, 3.0]) points.push({ x: p.x + (p.rot ? reach : 0), y, z: p.z + (p.rot ? 0 : reach) });
    }
    if (item.defId === "rug" || (item.defId === "yoga" && item.grade < 2)) points.unshift({ x: p.x, y, z: p.z });
    const valid = points.filter((q) => this.isClear(q, ACTOR_RADIUS, avoid))
      .map((q) => ({ q, node: this.nearest(q, true, avoid) }))
      .filter(({ q, node }) => node >= 0 && distance(q, this.nodes[node]) < 0.42 && this.segmentClear(q, this.nodes[node], avoid))
      .sort((a, b) => distance(a.q, from) - distance(b.q, from));
    return valid[0]?.q ?? null;
  }

  findPath(start: Point3, goal: Point3, avoid: Point3[] = []): Waypoint[] | null {
    if (this.segmentClear(start, goal, avoid)) return [{ ...goal }];
    const startId = this.nearest(start, false);
    const endId = this.nearest(goal, true, avoid);
    if (startId < 0 || endId < 0 || distance(start, this.nodes[startId]) > 0.65 || distance(goal, this.nodes[endId]) > 0.65) return null;
    if (!this.nodes[startId].stair && !this.segmentClear(start, this.nodes[startId])) return null;
    if (!this.segmentClear(this.nodes[endId], goal, avoid)) return null;
    const g = new Float64Array(this.nodes.length).fill(Infinity);
    const parent = new Int32Array(this.nodes.length).fill(-1);
    const closed = new Uint8Array(this.nodes.length);
    const open = new Set<number>([startId]);
    g[startId] = 0;
    while (open.size) {
      let current = -1;
      let min = Infinity;
      for (const id of open) {
        const f = g[id] + distance(this.nodes[id], this.nodes[endId]);
        if (f < min) { min = f; current = id; }
      }
      if (current === endId) {
        const chain: Waypoint[] = [{ ...goal }];
        for (let at = current; at >= 0; at = parent[at]) {
          const n = this.nodes[at];
          chain.push({ x: n.x, y: n.y, z: n.z, stair: n.stair });
        }
        chain.reverse();
        const path: Waypoint[] = [];
        let anchor: Waypoint = { ...start };
        for (let i = 0; i < chain.length; i++) {
          let end = i;
          if (!chain[i].stair && !anchor.stair) {
            while (end + 1 < chain.length && !chain[end + 1].stair && this.segmentClear(anchor, chain[end + 1], avoid)) end++;
          }
          path.push(chain[end]);
          anchor = chain[end];
          i = end;
        }
        return path;
      }
      open.delete(current);
      closed[current] = 1;
      for (const next of this.nodes[current].edges) {
        if (closed[next]) continue;
        if (next !== startId && avoid.some((a) => distance(a, this.nodes[next]) < 0.60)) continue;
        const score = g[current] + distance(this.nodes[current], this.nodes[next]);
        if (score >= g[next]) continue;
        g[next] = score;
        parent[next] = current;
        open.add(next);
      }
    }
    return null;
  }

  routesRemainOpen() {
    const top = stairs(this.room).top;
    const topId = this.nearest(top, true);
    if (topId < 0 || distance(top, this.nodes[topId]) > 0.4) return false;
    const door = { x: 0, y: 0, z: roomDepth(this.room.level) / 2 + 0.6 };
    return this.room.items.every((item) => this.accessPoint(item, door) !== null);
  }
}