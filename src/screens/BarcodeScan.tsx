import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Keyboard, X } from "lucide-react";
import { isMeal, type Meal } from "@/lib/constants";
import { getProductByBarcode } from "@/lib/openfoodfacts";
import { setPendingItem } from "@/lib/pendingItem";
import { isCameraSupported, startScanner, type ScannerHandle } from "@/lib/barcode";
import { useToast } from "@/providers/ToastProvider";

type Status = "starting" | "scanning" | "looking-up" | "denied" | "unsupported";

export function BarcodeScanScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const mealParam = searchParams.get("meal");
  const meal: Meal = isMeal(mealParam) ? mealParam : "breakfast";

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<ScannerHandle | null>(null);
  const handlingRef = useRef(false);

  const [status, setStatus] = useState<Status>("starting");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const stopScanner = useCallback(() => {
    scannerRef.current?.stop();
    scannerRef.current = null;
  }, []);

  const lookUp = useCallback(
    async (barcode: string) => {
      if (handlingRef.current) return;
      handlingRef.current = true;
      setStatus("looking-up");

      try {
        const item = await getProductByBarcode(barcode);
        if (!item) {
          toast.error("Not found in Open Food Facts");
          handlingRef.current = false;
          setStatus("scanning");
          return;
        }

        stopScanner();
        setPendingItem(item);
        navigate(`/edit-entry?meal=${meal}`, {
          replace: true,
          state: { item },
        });
      } catch {
        toast.error("Lookup failed. Try again.");
        handlingRef.current = false;
        setStatus("scanning");
      }
    },
    [meal, navigate, stopScanner, toast],
  );

  useEffect(() => {
    if (!isCameraSupported()) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;

    const run = async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const handle = await startScanner(video, (value) => void lookUp(value));
        if (cancelled) {
          handle.stop();
          return;
        }
        scannerRef.current = handle;
        setStatus("scanning");
      } catch {
        if (!cancelled) setStatus("denied");
      }
    };

    void run();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [lookUp, stopScanner]);

  const cameraLive = status === "scanning" || status === "looking-up";

  return (
    <div className="relative flex h-full flex-col bg-black">
      <video
        ref={videoRef}
        muted
        playsInline
        className={`absolute inset-0 h-full w-full object-cover ${
          cameraLive ? "opacity-100" : "opacity-0"
        }`}
      />

      {(status === "denied" || status === "unsupported") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-base text-white">
            {status === "unsupported"
              ? "Your browser can't open the camera here. Camera access needs an https:// page."
              : "Camera access is needed to scan barcodes. Allow it in your browser settings, or type the number instead."}
          </p>
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="rounded-2xl bg-primary px-5 py-3 text-base font-bold text-white"
          >
            Enter barcode manually
          </button>
        </div>
      )}

      <div
        className="absolute inset-x-0 flex items-center justify-between px-4"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
        >
          <X size={22} />
        </button>
        <span className="text-base font-bold text-white">Scan a Barcode</span>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          aria-label="Enter barcode manually"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
        >
          <Keyboard size={20} />
        </button>
      </div>

      {cameraLive && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-40 w-[260px] rounded-2xl border-2 border-white/90" />
        </div>
      )}

      {status === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-base text-white">Starting camera…</p>
        </div>
      )}

      {status === "looking-up" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <p className="text-base font-bold text-white">Looking up product…</p>
        </div>
      )}

      {manualOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 px-6">
          <form
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const code = manualCode.trim();
              if (!/^\d{6,14}$/.test(code)) {
                toast.error("Enter the digits under the barcode");
                return;
              }
              setManualOpen(false);
              void lookUp(code);
            }}
          >
            <h2 className="text-base font-bold text-gray-900">Enter barcode</h2>
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              inputMode="numeric"
              autoFocus
              placeholder="e.g. 5000159484695"
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-base font-bold text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-base font-bold text-white"
              >
                Look up
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
