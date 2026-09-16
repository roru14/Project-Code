import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MEALS, type Meal } from "@/lib/constants";
import { todayIso, uid } from "@/lib/format";
import {
  storage,
  type FoodEntry,
  type FoodHistoryItem,
} from "@/lib/storage";

export type { FoodEntry, FoodHistoryItem };

export interface FoodEntryTotals {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
}

const EMPTY_TOTALS: FoodEntryTotals = {
  calories: 0,
  carbs: 0,
  fat: 0,
  protein: 0,
};

export function getEntryTotals(entry: FoodEntry): FoodEntryTotals {
  const multiplier = entry.numberOfServings;
  return {
    calories: entry.caloriesPerServing * multiplier,
    carbs: entry.carbsPerServing * multiplier,
    fat: entry.fatPerServing * multiplier,
    protein: entry.proteinPerServing * multiplier,
  };
}

export function sumEntries(entries: FoodEntry[]): FoodEntryTotals {
  return entries.reduce((acc, entry) => {
    const totals = getEntryTotals(entry);
    return {
      calories: acc.calories + totals.calories,
      carbs: acc.carbs + totals.carbs,
      fat: acc.fat + totals.fat,
      protein: acc.protein + totals.protein,
    };
  }, EMPTY_TOTALS);
}

export interface AddEntryInput {
  name: string;
  brand?: string | null;
  barcode?: string | null;
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
  loggedDate?: string;
}

export interface UpdateEntryInput {
  name?: string;
  meal?: Meal;
  servingLabel?: string;
  numberOfServings?: number;
  caloriesPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  proteinPerServing?: number;
  loggedDate?: string;
}

interface DiaryContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  /** Entries on the selected date. */
  entries: FoodEntry[];
  /** Every entry ever logged — used by Progress. */
  allEntries: FoodEntry[];
  totals: FoodEntryTotals;
  entriesByMeal: Record<Meal, FoodEntry[]>;
  history: FoodHistoryItem[];
  addEntry: (input: AddEntryInput) => FoodEntry;
  updateEntry: (id: string, updates: UpdateEntryInput) => void;
  removeEntry: (id: string) => void;
  removeEntries: (ids: string[]) => void;
  reload: () => void;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export function useDiary(): DiaryContextType {
  const context = useContext(DiaryContext);
  if (context === undefined) {
    throw new Error("useDiary must be used within a DiaryProvider");
  }
  return context;
}

function pushHistory(item: FoodHistoryItem): FoodHistoryItem[] {
  const existing = storage.loadHistory();
  const filtered = existing.filter((entry) =>
    item.barcode ? entry.barcode !== item.barcode : entry.name !== item.name,
  );
  const next = [item, ...filtered].slice(0, 20);
  storage.saveHistory(next);
  return next;
}

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [allEntries, setAllEntries] = useState<FoodEntry[]>(storage.loadEntries);
  const [history, setHistory] = useState<FoodHistoryItem[]>(storage.loadHistory);

  const addEntry = useCallback(
    (input: AddEntryInput): FoodEntry => {
      const now = new Date().toISOString();
      const entry: FoodEntry = {
        id: uid(),
        name: input.name,
        brand: input.brand ?? null,
        barcode: input.barcode ?? null,
        meal: input.meal,
        servingLabel: input.servingLabel,
        numberOfServings: input.numberOfServings,
        caloriesPerServing: input.caloriesPerServing,
        carbsPerServing: input.carbsPerServing,
        fatPerServing: input.fatPerServing,
        proteinPerServing: input.proteinPerServing,
        fiberPerServing: input.fiberPerServing,
        sugarsPerServing: input.sugarsPerServing,
        saturatedFatPerServing: input.saturatedFatPerServing,
        sodiumMgPerServing: input.sodiumMgPerServing,
        loggedDate: input.loggedDate ?? selectedDate,
        createdAt: now,
        updatedAt: now,
      };

      setAllEntries((previous) => {
        const next = [...previous, entry];
        storage.saveEntries(next);
        return next;
      });

      setHistory(
        pushHistory({
          name: entry.name,
          brand: entry.brand,
          barcode: entry.barcode,
          servingLabel: entry.servingLabel,
          caloriesPerServing: entry.caloriesPerServing,
          carbsPerServing: entry.carbsPerServing,
          fatPerServing: entry.fatPerServing,
          proteinPerServing: entry.proteinPerServing,
        }),
      );

      return entry;
    },
    [selectedDate],
  );

  const updateEntry = useCallback((id: string, updates: UpdateEntryInput) => {
    setAllEntries((previous) => {
      const next = previous.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry,
      );
      storage.saveEntries(next);
      return next;
    });
  }, []);

  const removeEntries = useCallback((ids: string[]) => {
    const doomed = new Set(ids);
    setAllEntries((previous) => {
      const next = previous.filter((entry) => !doomed.has(entry.id));
      storage.saveEntries(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback(
    (id: string) => removeEntries([id]),
    [removeEntries],
  );

  const reload = useCallback(() => {
    setAllEntries(storage.loadEntries());
    setHistory(storage.loadHistory());
  }, []);

  const entries = useMemo(
    () =>
      allEntries
        .filter((entry) => entry.loggedDate === selectedDate)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [allEntries, selectedDate],
  );

  const totals = useMemo(() => sumEntries(entries), [entries]);

  const entriesByMeal = useMemo(() => {
    const grouped = Object.fromEntries(
      MEALS.map((meal) => [meal, [] as FoodEntry[]]),
    ) as Record<Meal, FoodEntry[]>;
    for (const entry of entries) {
      grouped[entry.meal]?.push(entry);
    }
    return grouped;
  }, [entries]);

  const value = useMemo<DiaryContextType>(
    () => ({
      selectedDate,
      setSelectedDate,
      entries,
      allEntries,
      totals,
      entriesByMeal,
      history,
      addEntry,
      updateEntry,
      removeEntry,
      removeEntries,
      reload,
    }),
    [
      selectedDate,
      entries,
      allEntries,
      totals,
      entriesByMeal,
      history,
      addEntry,
      updateEntry,
      removeEntry,
      removeEntries,
      reload,
    ],
  );

  return (
    <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>
  );
}
