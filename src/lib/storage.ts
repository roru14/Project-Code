// On-device persistence. The React Native original talked to a Hono + Postgres
// backend behind Supabase auth; this build is single-user and local-first, so
// the same data lives in localStorage and the app works fully offline.

import type { DailyGoals, Meal } from "./constants";
import { defaultGoals } from "./constants";

const KEYS = {
  entries: "diary:entries:v1",
  history: "diary:history:v1",
  profile: "diary:profile:v1",
} as const;

export interface FoodEntry {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  meal: Meal;
  servingLabel: string;
  numberOfServings: number;
  caloriesPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  proteinPerServing: number;
  fiberPerServing?: number;
  sugarsPerServing?: number;
  saturatedFatPerServing?: number;
  sodiumMgPerServing?: number;
  loggedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodHistoryItem {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  servingLabel: string;
  caloriesPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  proteinPerServing: number;
}

export interface Profile {
  name: string;
  goals: DailyGoals;
  onboarded: boolean;
}

export const defaultProfile: Profile = {
  name: "",
  goals: defaultGoals,
  onboarded: false,
};

/** Safari in private mode throws on every localStorage access, so each read and
 *  write is guarded. A failed read yields the fallback; a failed write is
 *  dropped and the in-memory state stays authoritative for the session. */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or storage blocked — ignore */
  }
}

export const storage = {
  loadEntries(): FoodEntry[] {
    const entries = read<FoodEntry[]>(KEYS.entries, []);
    return Array.isArray(entries) ? entries : [];
  },
  saveEntries(entries: FoodEntry[]): void {
    write(KEYS.entries, entries);
  },

  loadHistory(): FoodHistoryItem[] {
    const history = read<FoodHistoryItem[]>(KEYS.history, []);
    return Array.isArray(history) ? history : [];
  },
  saveHistory(history: FoodHistoryItem[]): void {
    write(KEYS.history, history);
  },

  loadProfile(): Profile {
    const stored = read<Partial<Profile>>(KEYS.profile, {});
    return {
      ...defaultProfile,
      ...stored,
      goals: { ...defaultGoals, ...(stored.goals ?? {}) },
    };
  },
  saveProfile(profile: Profile): void {
    write(KEYS.profile, profile);
  },

  clearAll(): void {
    for (const key of Object.values(KEYS)) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  },
};

export interface BackupFile {
  app: "fitness-diary";
  version: 1;
  exportedAt: string;
  entries: FoodEntry[];
  history: FoodHistoryItem[];
  profile: Profile;
}

export function exportBackup(): BackupFile {
  return {
    app: "fitness-diary",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: storage.loadEntries(),
    history: storage.loadHistory(),
    profile: storage.loadProfile(),
  };
}

/** Throws with a human-readable message when the file isn't a backup. */
export function importBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  const backup = parsed as Partial<BackupFile>;
  if (backup?.app !== "fitness-diary" || !Array.isArray(backup.entries)) {
    throw new Error("That doesn't look like a Fitness Diary backup.");
  }

  storage.saveEntries(backup.entries);
  storage.saveHistory(Array.isArray(backup.history) ? backup.history : []);
  if (backup.profile) {
    storage.saveProfile({ ...defaultProfile, ...backup.profile });
  }

  return backup as BackupFile;
}
