import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { CalorieRing } from "@/components/CalorieRing";
import { ActionSheet, ConfirmSheet } from "@/components/Sheet";
import { MEALS, MEAL_LABELS, colors, isMeal, type Meal } from "@/lib/constants";
import { addDays, fromIso, round1 } from "@/lib/format";
import type { FoodItem } from "@/lib/openfoodfacts";
import { clearPendingItem, getPendingItem } from "@/lib/pendingItem";
import { buildServingOptions, type ServingOption } from "@/lib/servings";
import { useDiary } from "@/providers/DiaryProvider";
import { useGoals } from "@/providers/ProfileProvider";
import { useToast } from "@/providers/ToastProvider";

interface NutritionBase {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  verified: boolean;
  servingLabel: string;
  caloriesPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  proteinPerServing: number;
  fiberPerServing?: number;
  sugarsPerServing?: number;
  saturatedFatPerServing?: number;
  sodiumMgPerServing?: number;
}

function MacroColumn({
  label,
  pct,
  value,
  color,
}: {
  label: string;
  pct: number;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-xs font-bold" style={{ color }}>
        {Math.round(pct)}%
      </span>
      <span className="text-lg font-extrabold text-gray-900">
        {round1(value)} g
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function GoalBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-track-gray">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function NutritionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}

export function EditEntryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const goals = useGoals();
  const { entries, selectedDate, addEntry, updateEntry, removeEntry } =
    useDiary();

  const entryId = searchParams.get("entryId");
  const existingEntry = entryId
    ? entries.find((entry) => entry.id === entryId)
    : undefined;
  const isEditing = !!existingEntry;

  // Navigation state is the fast path; sessionStorage survives a reload.
  const incomingItem = useMemo<FoodItem | null>(() => {
    const fromState = (location.state as { item?: FoodItem } | null)?.item;
    return fromState ?? getPendingItem();
  }, [location.state]);

  const base = useMemo<NutritionBase>(() => {
    if (existingEntry) {
      return {
        name: existingEntry.name,
        brand: existingEntry.brand,
        barcode: existingEntry.barcode,
        verified: !!existingEntry.barcode,
        servingLabel: existingEntry.servingLabel,
        caloriesPerServing: existingEntry.caloriesPerServing,
        carbsPerServing: existingEntry.carbsPerServing,
        fatPerServing: existingEntry.fatPerServing,
        proteinPerServing: existingEntry.proteinPerServing,
        fiberPerServing: existingEntry.fiberPerServing,
        sugarsPerServing: existingEntry.sugarsPerServing,
        saturatedFatPerServing: existingEntry.saturatedFatPerServing,
        sodiumMgPerServing: existingEntry.sodiumMgPerServing,
      };
    }
    if (incomingItem) return { ...incomingItem };
    return {
      name: "Food",
      verified: false,
      servingLabel: "1 serving",
      caloriesPerServing: 0,
      carbsPerServing: 0,
      fatPerServing: 0,
      proteinPerServing: 0,
    };
  }, [existingEntry, incomingItem]);

  const mealParam = searchParams.get("meal");
  const initialMeal: Meal | null =
    existingEntry?.meal ?? (isMeal(mealParam) ? mealParam : null);

  const [meal, setMeal] = useState<Meal | null>(initialMeal);
  const [servingsText, setServingsText] = useState(
    String(existingEntry?.numberOfServings ?? 1),
  );
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [servingPickerOpen, setServingPickerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showNutritionFacts, setShowNutritionFacts] = useState(false);

  const servingOptions = useMemo(
    () => buildServingOptions(base.servingLabel),
    [base.servingLabel],
  );
  const baseCanonicalGrams = servingOptions[0]?.canonicalGrams || 1;
  const [serving, setServing] = useState<ServingOption>(() => servingOptions[0]);
  const servingScale = serving.canonicalGrams / baseCanonicalGrams;

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index)),
    [selectedDate],
  );
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    () => new Set([selectedDate]),
  );

  const toggleDay = (iso: string) =>
    setSelectedDays((previous) => {
      const next = new Set(previous);
      if (next.has(iso)) {
        next.delete(iso);
      } else {
        next.add(iso);
      }
      return next;
    });

  const numberOfServings = Math.max(
    0,
    Number.parseFloat(servingsText.replace(",", ".")) || 0,
  );
  const multiplier = servingScale * numberOfServings;

  const totals = useMemo(
    () => ({
      calories: base.caloriesPerServing * multiplier,
      carbs: base.carbsPerServing * multiplier,
      fat: base.fatPerServing * multiplier,
      protein: base.proteinPerServing * multiplier,
    }),
    [base, multiplier],
  );

  const macroSplit = useMemo(() => {
    const carbCals = totals.carbs * 4;
    const fatCals = totals.fat * 9;
    const proteinCals = totals.protein * 4;
    const sum = carbCals + fatCals + proteinCals;
    if (sum <= 0) return { carbs: 0, fat: 0, protein: 0 };
    return {
      carbs: (carbCals / sum) * 100,
      fat: (fatCals / sum) * 100,
      protein: (proteinCals / sum) * 100,
    };
  }, [totals]);

  const goalPct = {
    calories: goals.calories > 0 ? (totals.calories / goals.calories) * 100 : 0,
    carbs: goals.carbs > 0 ? (totals.carbs / goals.carbs) * 100 : 0,
    fat: goals.fat > 0 ? (totals.fat / goals.fat) * 100 : 0,
    protein: goals.protein > 0 ? (totals.protein / goals.protein) * 100 : 0,
  };

  const handleSave = () => {
    if (numberOfServings <= 0) {
      toast.error("Enter a number of servings greater than 0");
      return;
    }
    if (!meal) {
      toast.error("Choose which meal to log this to");
      return;
    }

    const perServing = {
      caloriesPerServing: base.caloriesPerServing * servingScale,
      carbsPerServing: base.carbsPerServing * servingScale,
      fatPerServing: base.fatPerServing * servingScale,
      proteinPerServing: base.proteinPerServing * servingScale,
    };

    if (existingEntry) {
      updateEntry(existingEntry.id, {
        meal,
        numberOfServings,
        servingLabel: serving.label,
        ...perServing,
      });
    } else {
      const days = selectedDays.size > 0 ? [...selectedDays] : [selectedDate];
      for (const loggedDate of days) {
        addEntry({
          name: base.name,
          brand: base.brand,
          barcode: base.barcode,
          meal,
          servingLabel: serving.label,
          numberOfServings,
          ...perServing,
          fiberPerServing: base.fiberPerServing,
          sugarsPerServing: base.sugarsPerServing,
          saturatedFatPerServing: base.saturatedFatPerServing,
          sodiumMgPerServing: base.sodiumMgPerServing,
          loggedDate,
        });
      }
    }

    clearPendingItem();
    toast.success(isEditing ? "Entry updated!" : "Food logged!");
    navigate("/", { replace: true });
  };

  const handleDelete = () => {
    if (!existingEntry) return;
    removeEntry(existingEntry.id);
    toast.success("Entry removed");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-white pt-safe">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-[#F6F7F9] px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="p-1 text-gray-900"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="text-base font-bold text-gray-900">
          {isEditing ? "Edit Entry" : "Add Food"}
        </span>
        <button
          type="button"
          onClick={handleSave}
          className="p-1 text-base font-bold text-primary"
        >
          {isEditing ? <Check size={24} /> : "Log"}
        </button>
      </div>

      {!isEditing && base.barcode && (
        <div className="shrink-0 bg-mfp-bg-top px-5 py-3">
          <p className="truncate text-sm text-gray-700">
            This barcode was matched to: “{base.name}”
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-bold text-primary"
          >
            Find a better match
          </button>
        </div>
      )}

      <div className="scroll-area pb-10">
        <div className="px-5 pb-4 pt-5">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {base.name}
            </h1>
            {base.verified && (
              <CheckCircle2 size={18} className="shrink-0 text-carbs" />
            )}
          </div>
          {!!base.brand && (
            <p className="mt-1 text-sm text-gray-400">{base.brand}</p>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        <div className="px-5">
          <button
            type="button"
            onClick={() => setServingPickerOpen(true)}
            className="flex w-full items-center justify-between py-4"
          >
            <span className="text-base text-gray-800">Serving Size</span>
            <span className="min-w-[100px] rounded-lg border border-gray-300 px-4 py-2 text-right text-sm font-bold text-primary">
              {serving.label}
            </span>
          </button>

          <label className="flex items-center justify-between py-4">
            <span className="text-base text-gray-800">Number of Servings</span>
            <span className="min-w-[100px] rounded-lg border border-gray-300 px-4 py-2">
              <input
                value={servingsText}
                onChange={(event) => setServingsText(event.target.value)}
                inputMode="decimal"
                aria-label="Number of servings"
                className="w-full bg-transparent text-right text-sm font-bold text-primary outline-none"
              />
            </span>
          </label>

          <button
            type="button"
            onClick={() => setMealPickerOpen(true)}
            className="flex w-full items-center justify-between py-4"
          >
            <span className="text-base text-gray-800">Meal</span>
            <span
              className="min-w-[100px] rounded-lg border border-gray-300 px-4 py-2 text-right text-sm font-bold"
              style={{ color: meal ? colors.primary : colors.danger }}
            >
              {meal ? MEAL_LABELS[meal] : "Select a Meal"}
            </span>
          </button>
        </div>

        {!isEditing && (
          <>
            <div className="px-5 pb-1 pt-2">
              <h2 className="text-base font-bold text-gray-900">
                Add to Multiple Days
              </h2>
            </div>
            <div className="flex justify-between px-5 pb-4 pt-3">
              {weekDays.map((iso) => {
                const date = fromIso(iso);
                const isSelected = selectedDays.has(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => toggleDay(iso)}
                    className="flex flex-col items-center"
                    aria-pressed={isSelected}
                  >
                    <span
                      className={`mb-1.5 text-xs ${
                        isSelected ? "font-bold text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {date.toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="h-px bg-gray-100" />

        <div className="flex items-center px-5 py-6">
          <CalorieRing
            calories={totals.calories}
            segments={[
              { pct: macroSplit.carbs, color: colors.carbs },
              { pct: macroSplit.fat, color: colors.fat },
              { pct: macroSplit.protein, color: colors.protein },
            ]}
          />
          <div className="ml-5 flex flex-1 justify-between">
            <MacroColumn
              label="Carbs"
              pct={macroSplit.carbs}
              value={totals.carbs}
              color={colors.carbs}
            />
            <MacroColumn
              label="Fat"
              pct={macroSplit.fat}
              value={totals.fat}
              color={colors.fat}
            />
            <MacroColumn
              label="Protein"
              pct={macroSplit.protein}
              value={totals.protein}
              color={colors.protein}
            />
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="px-5 py-5">
          <h2 className="mb-3 text-base font-bold text-gray-900">
            Percent of Daily Goals
          </h2>
          <div className="flex gap-2.5">
            <GoalBar
              label="Calories"
              pct={goalPct.calories}
              color={colors.primary}
            />
            <GoalBar label="Carbs" pct={goalPct.carbs} color={colors.carbs} />
            <GoalBar label="Fat" pct={goalPct.fat} color={colors.fat} />
            <GoalBar
              label="Protein"
              pct={goalPct.protein}
              color={colors.protein}
            />
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <button
          type="button"
          onClick={() => setShowNutritionFacts((previous) => !previous)}
          className="flex w-full items-center justify-between px-5 py-5"
          aria-expanded={showNutritionFacts}
        >
          <span className="text-base font-bold text-gray-900">
            Nutrition Facts
          </span>
          <span className="flex items-center gap-1 text-sm font-bold text-primary">
            {showNutritionFacts ? "Hide" : "Show"}
            {showNutritionFacts ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </span>
        </button>

        {showNutritionFacts && (
          <div className="px-5 pb-2">
            <NutritionRow
              label="Calories"
              value={`${Math.round(totals.calories)}`}
            />
            <NutritionRow
              label="Total Carbohydrates"
              value={`${round1(totals.carbs)} g`}
            />
            <NutritionRow label="Total Fat" value={`${round1(totals.fat)} g`} />
            <NutritionRow label="Protein" value={`${round1(totals.protein)} g`} />
            {base.saturatedFatPerServing !== undefined && (
              <NutritionRow
                label="Saturated Fat"
                value={`${round1(base.saturatedFatPerServing * multiplier)} g`}
              />
            )}
            {base.fiberPerServing !== undefined && (
              <NutritionRow
                label="Dietary Fiber"
                value={`${round1(base.fiberPerServing * multiplier)} g`}
              />
            )}
            {base.sugarsPerServing !== undefined && (
              <NutritionRow
                label="Sugars"
                value={`${round1(base.sugarsPerServing * multiplier)} g`}
              />
            )}
            {base.sodiumMgPerServing !== undefined && (
              <NutritionRow
                label="Sodium"
                value={`${Math.round(base.sodiumMgPerServing * multiplier)} mg`}
              />
            )}
          </div>
        )}

        {isEditing && (
          <div className="px-5 pt-4">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="w-full rounded-2xl border border-danger px-4 py-3 text-base font-bold text-danger"
            >
              Delete Entry
            </button>
          </div>
        )}
      </div>

      <ActionSheet
        open={mealPickerOpen}
        onClose={() => setMealPickerOpen(false)}
        title="Meal"
        options={MEALS.map((option) => ({
          label: MEAL_LABELS[option],
          selected: option === meal,
          onSelect: () => setMeal(option),
        }))}
      />

      <ActionSheet
        open={servingPickerOpen}
        onClose={() => setServingPickerOpen(false)}
        title="Serving Size"
        options={servingOptions.map((option) => ({
          label: option.label,
          selected: option.label === serving.label,
          onSelect: () => setServing(option),
        }))}
      />

      <ConfirmSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this entry?"
        message={base.name}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
