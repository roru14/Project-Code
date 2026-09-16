import { useNavigate } from "react-router-dom";
import {
  Camera,
  Dumbbell,
  Mic,
  PlusCircle,
  ScanLine,
  Scale,
  Search,
  Droplet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { useToast } from "@/providers/ToastProvider";
import type { Meal } from "@/lib/constants";

interface AddMenuProps {
  open: boolean;
  onClose: () => void;
  meal?: Meal;
}

interface Tile {
  key: string;
  label: string;
  Icon: LucideIcon;
  bg: string;
  color: string;
  onSelect: () => void;
}

interface Row {
  key: string;
  label: string;
  Icon: LucideIcon;
  color: string;
}

export function AddMenu({ open, onClose, meal }: AddMenuProps) {
  const navigate = useNavigate();
  const toast = useToast();

  const notAvailable = () => {
    onClose();
    toast.error("Not available in this version");
  };

  const go = (path: string) => {
    onClose();
    navigate(meal ? `${path}?meal=${meal}` : path);
  };

  const tiles: Tile[] = [
    {
      key: "log-food",
      label: "Log Food",
      Icon: Search,
      bg: "#E7EEFE",
      color: "#1D63ED",
      onSelect: () => go("/log-food"),
    },
    {
      key: "barcode",
      label: "Barcode Scan",
      Icon: ScanLine,
      bg: "#FDE7EC",
      color: "#E1436B",
      onSelect: () => go("/barcode-scan"),
    },
    {
      key: "voice",
      label: "Voice Log",
      Icon: Mic,
      bg: "#F1E9FB",
      color: "#7A3FB3",
      onSelect: notAvailable,
    },
    {
      key: "meal-scan",
      label: "Meal Scan",
      Icon: Camera,
      bg: "#E1F7F2",
      color: "#0FA487",
      onSelect: notAvailable,
    },
  ];

  const rows: Row[] = [
    { key: "water", label: "Water", Icon: Droplet, color: "#1D63ED" },
    { key: "weight", label: "Weight", Icon: Scale, color: "#0FA487" },
    { key: "exercise", label: "Exercise", Icon: Dumbbell, color: "#F5A623" },
  ];

  return (
    <Sheet open={open} onClose={onClose} label="Add to your diary">
      <div className="px-4 pb-8 pt-2">
        <div className="grid grid-cols-2 gap-3">
          {tiles.map(({ key, label, Icon, bg, color, onSelect }) => (
            <button
              key={key}
              type="button"
              onClick={onSelect}
              className="flex flex-col items-center justify-center rounded-2xl bg-white py-6 active:bg-gray-50"
            >
              <span
                className="mb-2 flex h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: bg }}
              >
                <Icon size={20} color={color} />
              </span>
              <span className="text-sm font-bold text-gray-900">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          {rows.map(({ key, label, Icon, color }, index) => (
            <button
              key={key}
              type="button"
              onClick={notAvailable}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left active:bg-gray-50 ${
                index > 0 ? "border-t border-gray-100" : ""
              }`}
            >
              <Icon size={18} color={color} />
              <span className="text-base text-gray-900">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 px-2 text-xs text-gray-400">
          <PlusCircle size={14} />
          Quick add is available from the Log Food screen.
        </div>
      </div>
    </Sheet>
  );
}
