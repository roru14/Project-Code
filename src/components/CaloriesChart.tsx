import { useId, useState } from "react";
import { colors } from "@/lib/constants";
import { fromIso } from "@/lib/format";

export interface DayDatum {
  iso: string;
  calories: number;
}

interface CaloriesChartProps {
  data: DayDatum[];
  goal: number;
}

const HEIGHT = 140;
const GAP = 2;
const RADIUS = 4;

/** Column with rounded top corners, square-anchored to the baseline. */
function barPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(RADIUS, width / 2, height);
  if (height <= 0) return "";
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    "Z",
  ].join(" ");
}

/**
 * Daily calories over the selected range. One series, so one hue and no legend
 * — the heading names it. The goal is a reference line rather than a second
 * series, keeping this to a single scale.
 */
export function CaloriesChart({ data, goal }: CaloriesChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  const width = 320;
  const maxValue = Math.max(goal, ...data.map((day) => day.calories), 1);
  const barWidth = Math.max(2, width / data.length - GAP);
  const goalY = HEIGHT - (goal / maxValue) * HEIGHT;

  const activeDay = active !== null ? data[active] : null;

  return (
    <div>
      <div className="flex h-5 items-center justify-between text-xs">
        <span className="text-gray-400">
          {activeDay
            ? fromIso(activeDay.iso).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "Daily calories"}
        </span>
        <span className="font-bold text-gray-900">
          {activeDay ? `${Math.round(activeDay.calories).toLocaleString()} cal` : ""}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${HEIGHT + 18}`}
        className="mt-1 w-full"
        role="img"
        aria-labelledby={titleId}
        onPointerLeave={() => setActive(null)}
      >
        <title id={titleId}>
          Daily calories for the last {data.length} days, against a goal of{" "}
          {goal} calories
        </title>

        {/* Goal reference line — recessive, dashed, labelled in the legend row. */}
        <line
          x1={0}
          x2={width}
          y1={goalY}
          y2={goalY}
          stroke="#9CA3AF"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <line
          x1={0}
          x2={width}
          y1={HEIGHT}
          y2={HEIGHT}
          stroke={colors["track-gray"]}
          strokeWidth={1}
        />

        {data.map((day, index) => {
          const x = index * (barWidth + GAP);
          const height = (day.calories / maxValue) * HEIGHT;
          const isActive = active === index;
          return (
            <g key={day.iso}>
              {/* Full-height hit target: easier to tap than the bar itself. */}
              <rect
                x={x}
                y={0}
                width={barWidth + GAP}
                height={HEIGHT}
                fill="transparent"
                onPointerDown={() => setActive(isActive ? null : index)}
                onPointerEnter={() => setActive(index)}
                style={{ cursor: "pointer" }}
              />
              {height > 0 && (
                <path
                  d={barPath(x, HEIGHT - height, barWidth, height)}
                  fill={colors.primary}
                  opacity={active === null || isActive ? 1 : 0.45}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}

        {data.map((day, index) => {
          // Label every day for a week, every 7th beyond that, so ticks never collide.
          const step = data.length <= 7 ? 1 : 7;
          if (index % step !== 0) return null;
          const x = index * (barWidth + GAP) + barWidth / 2;
          return (
            <text
              key={`label-${day.iso}`}
              x={x}
              y={HEIGHT + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#9CA3AF"
            >
              {fromIso(day.iso).toLocaleDateString(undefined, {
                weekday: data.length <= 7 ? "narrow" : undefined,
                month: data.length <= 7 ? undefined : "numeric",
                day: data.length <= 7 ? undefined : "numeric",
              })}
            </text>
          );
        })}
      </svg>

      <p className="mt-1 text-center text-xs text-gray-400">
        Dashed line = {goal.toLocaleString()} cal goal
      </p>
    </div>
  );
}
