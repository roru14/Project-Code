import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { MEAL_LABELS, type Meal } from "@/lib/constants";
import type { FoodItem } from "@/lib/openfoodfacts";

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
  meal: Meal;
  onAdd: (item: FoodItem) => void;
}

const FIELDS = [
  { key: "calories", label: "Calories", suffix: "cal" },
  { key: "carbs", label: "Carbs", suffix: "g" },
  { key: "fat", label: "Fat", suffix: "g" },
  { key: "protein", label: "Protein", suffix: "g" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

const EMPTY: Record<FieldKey, string> = {
  calories: "",
  carbs: "",
  fat: "",
  protein: "",
};

/** Logs raw numbers with no product behind them — the "Quick add" action. */
export function QuickAddSheet({
  open,
  onClose,
  meal,
  onAdd,
}: QuickAddSheetProps) {
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<FieldKey, string>>(EMPTY);

  const reset = () => {
    setName("");
    setValues(EMPTY);
  };

  const close = () => {
    reset();
    onClose();
  };

  const toNumber = (raw: string) => {
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const handleSubmit = () => {
    const calories = toNumber(values.calories);
    const carbs = toNumber(values.carbs);
    const fat = toNumber(values.fat);
    const protein = toNumber(values.protein);

    if (calories <= 0 && carbs <= 0 && fat <= 0 && protein <= 0) return;

    onAdd({
      id: `quick-${Date.now()}`,
      name: name.trim() || "Quick add",
      verified: false,
      servingLabel: "1 serving",
      // If only macros were given, derive calories the usual 4/9/4 way.
      caloriesPerServing:
        calories > 0 ? calories : carbs * 4 + fat * 9 + protein * 4,
      carbsPerServing: carbs,
      fatPerServing: fat,
      proteinPerServing: protein,
    });
    close();
  };

  return (
    <Sheet open={open} onClose={close} label="Quick add">
      <form
        className="px-4 pb-6 pt-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <p className="px-2 pb-3 text-center text-sm text-gray-500">
          Quick add to {MEAL_LABELS[meal]}
        </p>

        <div className="overflow-hidden rounded-2xl bg-white">
          <label className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-base text-gray-800">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Optional"
              className="min-w-0 flex-1 bg-transparent text-right text-base font-bold text-primary outline-none placeholder:font-normal placeholder:text-gray-300"
            />
          </label>

          {FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3"
            >
              <span className="text-base text-gray-800">{field.label}</span>
              <span className="flex items-baseline gap-1">
                <input
                  value={values[field.key]}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      [field.key]: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder="0"
                  className="w-20 bg-transparent text-right text-base font-bold text-primary outline-none placeholder:font-normal placeholder:text-gray-300"
                />
                <span className="text-sm text-gray-400">{field.suffix}</span>
              </span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="mt-3 w-full rounded-2xl bg-primary px-4 py-4 text-base font-bold text-white active:opacity-90"
        >
          Add
        </button>
      </form>
    </Sheet>
  );
}
