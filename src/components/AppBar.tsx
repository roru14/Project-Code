import type { ReactNode } from "react";

interface AppBarProps {
  title: ReactNode;
  rightAction?: ReactNode;
}

export function AppBar({ title, rightAction }: AppBarProps) {
  return (
    <div className="flex items-center justify-between pl-6 pr-4 pt-2">
      <div className="min-w-0 flex-1">{title}</div>
      {rightAction != null && <div className="px-3 py-2">{rightAction}</div>}
    </div>
  );
}
