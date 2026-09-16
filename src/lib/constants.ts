// Single source of truth for app colors.
// Mirrored in tailwind.config.js — change both together.
export const colors = {
  primary: "#1D63ED",
  "primary-foreground": "#FFFFFF",
  "muted-foreground": "#9D9D9D",
  white: "#FFFFFF",
  "mfp-bg": "#EEF1F5",
  "mfp-bg-top": "#E4EEFB",
  carbs: "#2BC4A6",
  fat: "#7A3FB3",
  protein: "#F5A623",
  "track-gray": "#E7E9EC",
  danger: "#E11D48",
} as const;

export interface DailyGoals {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
}

// Defaults match the reference UI:
// 366g carbs * 4 + 98g fat * 9 + 146g protein * 4 = 2930 kcal
export const defaultGoals: DailyGoals = {
  calories: 2930,
  carbs: 366,
  fat: 98,
  protein: 146,
};

export const MEALS = ["breakfast", "lunch", "dinner", "snacks"] as const;
export type Meal = (typeof MEALS)[number];

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export function isMeal(value: unknown): value is Meal {
  return MEALS.includes(value as Meal);
}
