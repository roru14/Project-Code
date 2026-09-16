/** Local calendar date as YYYY-MM-DD. Never use toISOString() here — that
 *  shifts to UTC and puts evening entries on tomorrow's page. */
export function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

/** Parses YYYY-MM-DD into a local-midnight Date. */
export function fromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, days: number): string {
  const date = fromIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function startOfWeek(iso: string): string {
  const date = fromIso(iso);
  date.setDate(date.getDate() - date.getDay());
  return toIso(date);
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatDateHeading(iso: string): string {
  const today = todayIso();
  if (iso === today) return "Today";
  if (iso === addDays(today, -1)) return "Yesterday";
  if (iso === addDays(today, 1)) return "Tomorrow";
  return fromIso(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
