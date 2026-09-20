import type { PlacedItem, Room } from "./engine";
import type { PlaceType } from "./furniture";
import { encodeSlot, placementError, zoneCapacity, type Point3 } from "./layout";
import { RoomNavigation } from "./navigation";

export function validatePlacement(room: Room, defId: string, grade: number, zone: PlaceType, slot: number, ignoreUid?: string, actors: Point3[] = []) {
  const error = placementError(room, defId, grade, zone, slot, ignoreUid, actors);
  if (error) return error;
  const item: PlacedItem = { uid: ignoreUid ?? "preview", defId, grade, slot: encodeSlot(zone, slot) };
  const preview = { ...room, items: [...room.items.filter((i) => i.uid !== ignoreUid), item] };
  if (!new RoomNavigation(preview).routesRemainOpen()) return "ตำแหน่งนี้ปิดทางเข้าถึงเฟอร์นิเจอร์หรือบันได กรุณาเว้นทางเดิน";
  return null;
}

export function findPlacement(room: Room, defId: string, grade: number, zone: PlaceType) {
  for (let slot = 0; slot < zoneCapacity(room.level, zone); slot++) {
    if (!placementError(room, defId, grade, zone, slot)) return slot;
  }
  return -1;
}