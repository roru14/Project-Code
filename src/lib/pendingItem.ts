import type { FoodItem } from "./openfoodfacts";

// The Add Food screen is reached by navigation state, which is lost on reload.
// Mirroring it into sessionStorage keeps the screen usable if the PWA is
// backgrounded and restored mid-flow.
const KEY = "diary:pending-item";

export function setPendingItem(item: FoodItem): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(item));
  } catch {
    /* ignore */
  }
}

export function getPendingItem(): FoodItem | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FoodItem) : null;
  } catch {
    return null;
  }
}

export function clearPendingItem(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
