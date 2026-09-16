import { useEffect, type ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name for the sheet's dialog role. */
  label: string;
}

/** Bottom sheet: backdrop tap and Escape both dismiss. */
export function Sheet({ open, onClose, children, label }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="animate-sheet-in relative w-full max-w-[480px] rounded-t-3xl bg-mfp-bg pb-safe"
      >
        <div className="flex justify-center pb-1 pt-3">
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        {children}
      </div>
    </div>
  );
}

export interface ActionSheetOption {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  selected?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

/** Stands in for the native `Alert.alert` option lists in the original app. */
export function ActionSheet({
  open,
  onClose,
  title,
  options,
}: ActionSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} label={title ?? "Choose an option"}>
      <div className="px-4 pb-4 pt-1">
        {title && (
          <p className="px-2 pb-2 pt-1 text-center text-sm text-gray-500">
            {title}
          </p>
        )}
        <div className="overflow-hidden rounded-2xl bg-white">
          {options.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                option.onSelect();
                onClose();
              }}
              className={`flex w-full items-center justify-between px-4 py-4 text-left text-base active:bg-gray-50 ${
                index > 0 ? "border-t border-gray-100" : ""
              } ${option.destructive ? "font-bold text-danger" : "text-gray-900"}`}
            >
              {option.label}
              {option.selected && (
                <span className="text-sm font-bold text-primary">Selected</span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-2xl bg-white px-4 py-4 text-base font-bold text-gray-900 active:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmSheet({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} label={title}>
      <div className="px-4 pb-4 pt-1">
        <div className="rounded-2xl bg-white px-4 py-4 text-center">
          <p className="text-base font-bold text-gray-900">{title}</p>
          {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`mt-3 w-full rounded-2xl bg-white px-4 py-4 text-base font-bold active:bg-gray-50 ${
            destructive ? "text-danger" : "text-primary"
          }`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-2xl bg-white px-4 py-4 text-base font-bold text-gray-900 active:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
