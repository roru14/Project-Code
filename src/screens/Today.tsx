import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Flame } from "lucide-react";
import { AppBar } from "@/components/AppBar";
import { CaloriesCard } from "@/components/CaloriesCard";
import { MacrosCard } from "@/components/MacrosCard";
import { MealCard } from "@/components/MealCard";
import { WeekStrip } from "@/components/WeekStrip";
import { ActionSheet, ConfirmSheet } from "@/components/Sheet";
import { MEALS, MEAL_LABELS, type Meal } from "@/lib/constants";
import { addDays, formatDateHeading, startOfWeek, todayIso } from "@/lib/format";
import { useDiary, type FoodEntry } from "@/providers/DiaryProvider";
import { useGoals } from "@/providers/ProfileProvider";

export function TodayScreen() {
  const navigate = useNavigate();
  const goals = useGoals();
  const {
    selectedDate,
    setSelectedDate,
    entries,
    allEntries,
    entriesByMeal,
    totals,
    removeEntries,
  } = useDiary();

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [mealToClear, setMealToClear] = useState<Meal | null>(null);

  const streak = useMemo(() => {
    const logged = new Set(allEntries.map((entry) => entry.loggedDate));
    let count = 0;
    let cursor = todayIso();
    while (logged.has(cursor)) {
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }, [allEntries]);

  const datesWithEntries = useMemo(() => {
    const weekStart = startOfWeek(selectedDate);
    const visible = new Set(
      Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    );
    const logged = new Set<string>();
    for (const entry of allEntries) {
      if (visible.has(entry.loggedDate)) logged.add(entry.loggedDate);
    }
    return logged;
  }, [allEntries, selectedDate]);

  const handleLog = (meal: Meal) => navigate(`/log-food?meal=${meal}`);

  const handlePressEntry = (entry: FoodEntry) =>
    navigate(`/edit-entry?entryId=${entry.id}`);

  const confirmClear = () => {
    if (!mealToClear) return;
    removeEntries(entriesByMeal[mealToClear].map((entry) => entry.id));
  };

  const dateOptions = [
    { label: "Today", iso: todayIso() },
    { label: "Yesterday", iso: addDays(todayIso(), -1) },
    { label: "2 days ago", iso: addDays(todayIso(), -2) },
    { label: "Tomorrow", iso: addDays(todayIso(), 1) },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 rounded-b-4xl bg-mfp-bg-top pb-4 pt-safe">
        <AppBar
          title={
            <button
              type="button"
              onClick={() => setDatePickerOpen(true)}
              className="flex items-center gap-1"
            >
              <span className="text-2xl font-extrabold text-gray-900">
                {formatDateHeading(selectedDate)}
              </span>
              <ChevronDown size={18} color="#111827" />
            </button>
          }
          rightAction={
            <div
              className="flex items-center gap-[3px]"
              title={`${streak} day logging streak`}
            >
              <span className="text-base font-bold text-gray-900">
                {streak}
              </span>
              <Flame size={16} color="#F5A623" fill="#F5A623" />
            </div>
          }
        />

        <WeekStrip
          selectedDate={selectedDate}
          datesWithEntries={datesWithEntries}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className="scroll-area">
        <div className="flex flex-col gap-3 p-4 pb-10">
          <CaloriesCard consumed={totals.calories} goal={goals.calories} />
          <MacrosCard
            carbs={totals.carbs}
            fat={totals.fat}
            protein={totals.protein}
            goals={goals}
          />

          <div className="mt-2 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-gray-900">Diary</h2>
            <span className="text-sm text-gray-400">
              {entries.length} {entries.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {MEALS.map((meal) => (
              <MealCard
                key={meal}
                meal={meal}
                entries={entriesByMeal[meal]}
                onLog={() => handleLog(meal)}
                onPressEntry={handlePressEntry}
                onClear={() => setMealToClear(meal)}
              />
            ))}
          </div>
        </div>
      </div>

      <ActionSheet
        open={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        title="Jump to a day"
        options={dateOptions.map((option) => ({
          label: option.label,
          selected: option.iso === selectedDate,
          onSelect: () => setSelectedDate(option.iso),
        }))}
      />

      <ConfirmSheet
        open={mealToClear !== null}
        onClose={() => setMealToClear(null)}
        title={mealToClear ? `Clear ${MEAL_LABELS[mealToClear]}` : ""}
        message="Remove all logged items for this meal?"
        confirmLabel="Remove"
        destructive
        onConfirm={confirmClear}
      />
    </div>
  );
}
