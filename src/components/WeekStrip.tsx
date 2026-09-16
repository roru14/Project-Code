import { Check } from "lucide-react";
import { fromIso, startOfWeek, toIso } from "@/lib/format";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface WeekStripProps {
  selectedDate: string;
  /** ISO dates in the visible week that have at least one entry. */
  datesWithEntries: Set<string>;
  onSelectDate: (date: string) => void;
}

export function WeekStrip({
  selectedDate,
  datesWithEntries,
  onSelectDate,
}: WeekStripProps) {
  const weekStart = fromIso(startOfWeek(selectedDate));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  });

  return (
    <div className="mt-5 flex justify-between px-6">
      {days.map((date, index) => {
        const iso = toIso(date);
        const isSelected = iso === selectedDate;
        const isLogged = datesWithEntries.has(iso);

        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelectDate(iso)}
            className="flex flex-col items-center"
            aria-pressed={isSelected}
            aria-label={date.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          >
            <span
              className="mb-1 h-1 w-1 rounded-full bg-gray-900"
              style={{ opacity: isSelected ? 1 : 0 }}
            />
            <span
              className={`mb-1 text-xs ${
                isSelected ? "font-bold text-gray-900" : "text-gray-400"
              }`}
            >
              {DAY_LABELS[index]}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                isLogged
                  ? "border-gray-900 bg-gray-900 text-white"
                  : isSelected
                    ? "border-gray-900 text-gray-900"
                    : "border-gray-300 text-gray-400"
              }`}
            >
              {isLogged ? <Check size={14} /> : date.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
