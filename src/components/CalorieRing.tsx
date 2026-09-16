export interface RingSegment {
  pct: number;
  color: string;
}

interface CalorieRingProps {
  calories: number;
  segments: RingSegment[];
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({
  calories,
  segments,
  size = 150,
  strokeWidth = 14,
}: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativePct = 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(calories)} calories`}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E7E9EC"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((segment, index) => {
          if (segment.pct <= 0) return null;
          const length = (segment.pct / 100) * circumference;
          const dashOffset = -1 * (cumulativePct / 100) * circumference;
          cumulativePct += segment.pct;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-gray-900">
          {Math.round(calories)}
        </span>
        <span className="text-xs text-gray-400">cal</span>
      </div>
    </div>
  );
}
