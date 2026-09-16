import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { CaloriesChart, type DayDatum } from "@/components/CaloriesChart";
import { colors } from "@/lib/constants";
import { addDays, round1, todayIso } from "@/lib/format";
import { getEntryTotals, sumEntries, useDiary } from "@/providers/DiaryProvider";
import { useGoals } from "@/providers/ProfileProvider";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
] as const;

const MACROS = [
  { key: "carbs", label: "Carbs", color: colors.carbs },
  { key: "fat", label: "Fat", color: colors.fat },
  { key: "protein", label: "Protein", color: colors.protein },
] as const;

export function ProgressScreen() {
  const { allEntries } = useDiary();
  const goals = useGoals();
  const [days, setDays] = useState<number>(7);
  const [showTable, setShowTable] = useState(false);

  const range = useMemo<DayDatum[]>(() => {
    const start = addDays(todayIso(), -(days - 1));
    const byDate = new Map<string, number>();
    for (const entry of allEntries) {
      if (entry.loggedDate < start) continue;
      byDate.set(
        entry.loggedDate,
        (byDate.get(entry.loggedDate) ?? 0) + getEntryTotals(entry).calories,
      );
    }
    return Array.from({ length: days }, (_, index) => {
      const iso = addDays(start, index);
      return { iso, calories: byDate.get(iso) ?? 0 };
    });
  }, [allEntries, days]);

  const loggedDays = range.filter((day) => day.calories > 0).length;

  const macroTotals = useMemo(() => {
    const start = addDays(todayIso(), -(days - 1));
    return sumEntries(allEntries.filter((entry) => entry.loggedDate >= start));
  }, [allEntries, days]);

  const totalCalories = range.reduce((sum, day) => sum + day.calories, 0);
  // Averaged over days actually logged — untouched days would otherwise drag the
  // number toward zero and read as "you ate less".
  const average = loggedDays > 0 ? totalCalories / loggedDays : 0;

  return (
    <div className="flex h-full flex-col pt-safe">
      <div className="shrink-0 px-6 pb-2 pt-2">
        <h1 className="text-2xl font-extrabold text-gray-900">Progress</h1>
      </div>

      <div className="scroll-area">
        <div className="flex flex-col gap-3 p-4 pb-10">
          <div className="flex gap-2">
            {RANGES.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setDays(option.days)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-bold ${
                  days === option.days
                    ? "bg-primary text-white"
                    : "bg-white text-gray-500"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Card>
            <p className="text-sm text-gray-500">Average daily calories</p>
            <p className="mt-1 text-4xl font-extrabold text-gray-900">
              {Math.round(average).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {loggedDays} of {days} days logged · goal{" "}
              {goals.calories.toLocaleString()}
            </p>
          </Card>

          <Card>
            {loggedDays > 0 ? (
              <CaloriesChart data={range} goal={goals.calories} />
            ) : (
              <p className="py-10 text-center text-gray-400">
                Log some food and your trend will show up here.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-bold text-gray-900">
              Average macros per logged day
            </h2>
            <div className="flex flex-col gap-3">
              {MACROS.map(({ key, label, color }) => {
                const perDay =
                  loggedDays > 0 ? macroTotals[key] / loggedDays : 0;
                const goal = goals[key];
                const pct = goal > 0 ? Math.min((perDay / goal) * 100, 100) : 0;
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm font-bold text-gray-900">
                        {label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {round1(perDay)} g
                        <span className="text-gray-400"> / {goal}</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-track-gray">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <button
            type="button"
            onClick={() => setShowTable((previous) => !previous)}
            className="text-sm font-bold text-primary"
          >
            {showTable ? "Hide" : "Show"} the numbers
          </button>

          {showTable && (
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Calories logged per day over the last {days} days
                </caption>
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th scope="col" className="px-4 py-2 font-normal">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-normal">
                      Calories
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...range].reverse().map((day) => (
                    <tr key={day.iso} className="border-b border-gray-50">
                      <td className="px-4 py-2 text-gray-700">{day.iso}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900">
                        {Math.round(day.calories).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
