import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, CircleAlert } from "lucide-react";

type ToastKind = "success" | "error";

interface ToastState {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const show = useCallback((kind: ToastKind, message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ id: (nextId.current += 1), kind, message });
    timerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const value = useMemo<ToastContextType>(
    () => ({
      success: (message: string) => show("success", message),
      error: (message: string) => show("error", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 86px)" }}
        >
          <div className="animate-toast-in flex items-center gap-2 rounded-full bg-gray-900/95 px-4 py-2.5 text-sm font-bold text-white shadow-lg">
            {toast.kind === "success" ? (
              <Check size={16} className="text-carbs" />
            ) : (
              <CircleAlert size={16} className="text-protein" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
