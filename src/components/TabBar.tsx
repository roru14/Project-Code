import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Home,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors } from "@/lib/constants";

interface TabMeta {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const LEFT_TABS: TabMeta[] = [
  { to: "/", label: "Today", Icon: Home },
  { to: "/plan", label: "Plan", Icon: CalendarDays },
];

const RIGHT_TABS: TabMeta[] = [
  { to: "/progress", label: "Progress", Icon: BarChart3 },
  { to: "/more", label: "More", Icon: MoreHorizontal },
];

function Tab({ to, label, Icon }: TabMeta) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className="flex flex-1 flex-col items-center justify-center gap-[3px]"
    >
      {({ isActive }) => (
        <>
          <Icon
            size={24}
            color={isActive ? colors.primary : colors["muted-foreground"]}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span
            className={`text-[10px] ${isActive ? "font-bold" : ""}`}
            style={{
              color: isActive ? colors.primary : colors["muted-foreground"],
            }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function TabBar({ onAddPress }: { onAddPress: () => void }) {
  return (
    <nav className="flex shrink-0 border-t border-gray-100 bg-white pb-safe pt-2">
      {LEFT_TABS.map((tab) => (
        <Tab key={tab.to} {...tab} />
      ))}

      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onAddPress}
          aria-label="Add"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95"
        >
          <Plus size={30} />
        </button>
      </div>

      {RIGHT_TABS.map((tab) => (
        <Tab key={tab.to} {...tab} />
      ))}
    </nav>
  );
}
