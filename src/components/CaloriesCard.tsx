import { Card } from "@/components/Card";

interface CaloriesCardProps {
  consumed: number;
  goal: number;
}

export function CaloriesCard({ consumed, goal }: CaloriesCardProps) {
  const left = Math.round(goal - consumed);
  const pct = goal > 0 ? Math.max(0, Math.min(consumed / goal, 1)) : 0;

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-gray-500">Calories</span>
        <span className="text-sm text-gray-400">
          {Math.abs(left).toLocaleString()} {left < 0 ? "over" : "left"}
        </span>
      </div>
      <div className="mb-3 flex items-baseline">
        <span className="text-3xl font-extrabold text-gray-900">
          {Math.round(consumed).toLocaleString()} cal
        </span>
        <span className="text-base text-gray-400">
          &nbsp;/ {goal.toLocaleString()}
        </span>
      </div>
      <div className="track">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </Card>
  );
}
