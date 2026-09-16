import { Coffee, Cookie, MoreHorizontal, Sandwich, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MEAL_LABELS, colors, type Meal } from "@/lib/constants";
import { getEntryTotals, type FoodEntry } from "@/providers/DiaryProvider";

const MEAL_ICONS: Record<Meal, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sandwich,
  dinner: UtensilsCrossed,
  snacks: Cookie,
};

interface MealCardProps {
  meal: Meal;
  entries: FoodEntry[];
  onLog: () => void;
  onPressEntry: (entry: FoodEntry) => void;
  onClear: () => void;
}

export function MealCard({
  meal,
  entries,
  onLog,
  onPressEntry,
  onClear,
}: MealCardProps) {
  const hasEntries = entries.length > 0;
  const totalCalories = entries.reduce(
    (sum, entry) => sum + getEntryTotals(entry).calories,
    0,
  );
  const extraCount = entries.length - 1;
  const Icon = MEAL_ICONS[meal];

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
        <Icon size={18} color={colors.primary} />
      </div>

      <button
        type="button"
        onClick={() => hasEntries && onPressEntry(entries[0])}
        disabled={!hasEntries}
        className="min-w-0 flex-1 text-left"
      >
        <div className="text-base font-bold text-gray-900">
          {MEAL_LABELS[meal]}
        </div>
        {hasEntries && (
          <>
            <div className="mt-0.5 truncate text-sm text-gray-400">
              {entries[0].name}
              {extraCount > 0 ? ` and ${extraCount} more` : ""}
            </div>
            <div className="mt-0.5 text-xs text-gray-400">
              {Math.round(totalCalories)} cal
            </div>
          </>
        )}
      </button>

      {hasEntries && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${MEAL_LABELS[meal]}`}
          className="p-1 text-gray-400"
        >
          <MoreHorizontal size={18} />
        </button>
      )}

      <button type="button" onClick={onLog} className="pill-button shrink-0">
        Log
      </button>
    </div>
  );
}
