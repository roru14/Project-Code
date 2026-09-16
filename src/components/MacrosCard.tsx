import { Card } from "@/components/Card";
import type { DailyGoals } from "@/lib/constants";

interface MacroColumnProps {
  label: string;
  grams: number;
  goal: number;
  barClassName: string;
}

function MacroColumn({ label, grams, goal, barClassName }: MacroColumnProps) {
  const pct = goal > 0 ? Math.max(0, Math.min(grams / goal, 1)) : 0;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-sm font-bold text-gray-900">{label}</div>
      <div className="mb-2 flex items-baseline">
        <span className="text-base font-bold text-gray-900">
          {Math.round(grams)} g
        </span>
        <span className="text-xs text-gray-400">&nbsp;/ {goal}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-track-gray">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${barClassName}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

interface MacrosCardProps {
  carbs: number;
  fat: number;
  protein: number;
  goals: DailyGoals;
}

export function MacrosCard({ carbs, fat, protein, goals }: MacrosCardProps) {
  return (
    <Card>
      <div className="flex gap-4">
        <MacroColumn
          label="Carbs"
          grams={carbs}
          goal={goals.carbs}
          barClassName="bg-carbs"
        />
        <MacroColumn
          label="Fat"
          grams={fat}
          goal={goals.fat}
          barClassName="bg-fat"
        />
        <MacroColumn
          label="Protein"
          grams={protein}
          goal={goals.protein}
          barClassName="bg-protein"
        />
      </div>
    </Card>
  );
}
