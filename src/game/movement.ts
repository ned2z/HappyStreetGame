import type { Point3 } from "./layout";
import type { RoomNavigation, Waypoint } from "./navigation";

export const TENANTS_COLLIDE = false;

/** Only the static floor plan is queried. Other residents cannot block this motion. */
export function advancePath(nav: RoomNavigation, position: Point3, path: Waypoint[], budget: number) {
  let moved = false, blocked = false;
  let heading: number | null = null;
  while (budget > 0 && path.length) {
    const next = path[0];
    const dx = next.x - position.x, dy = next.y - position.y, dz = next.z - position.z;
    const distance = Math.hypot(dx, dy, dz);
    if (distance < 0.012) {
      position.x = next.x; position.y = next.y; position.z = next.z;
      path.shift(); continue;
    }
    const step = Math.min(distance, budget, 0.05);
    const point = { x: position.x + dx * step / distance, y: position.y + dy * step / distance, z: position.z + dz * step / distance };
    if (!next.stair && Math.abs(dy) < 0.02 && !nav.segmentClear(position, point)) { blocked = true; break; }
    position.x = point.x; position.y = point.y; position.z = point.z;
    if (Math.abs(dx) + Math.abs(dz) > 0.001) heading = Math.atan2(dx, dz);
    moved = true; budget -= step;
    if (distance <= step + 0.001) path.shift();
  }
  return { moved, blocked, heading };
}