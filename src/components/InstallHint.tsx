import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "diary:install-hint-dismissed";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag.
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Nudges the user to install. Chrome/Android gives us a real install prompt;
 * iOS Safari has no API, so there we explain the Share → Add to Home Screen
 * route instead.
 */
export function InstallHint() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (dismissed || isStandalone()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIos()) setShowIosHint(true);

    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setPrompt(null);
    setShowIosHint(false);
  };

  if (!prompt && !showIosHint) return null;

  return (
    <div className="shrink-0 border-t border-blue-100 bg-mfp-bg-top px-4 py-2.5">
      <div className="flex items-center gap-2">
        <p className="flex-1 text-xs text-gray-700">
          {prompt ? (
            "Install this app for full-screen, offline use."
          ) : (
            <>
              Add to your Home Screen: tap{" "}
              <Share size={12} className="inline align-[-1px]" /> then “Add to
              Home Screen”.
            </>
          )}
        </p>
        {prompt && (
          <button
            type="button"
            onClick={async () => {
              await prompt.prompt();
              await prompt.userChoice;
              dismiss();
            }}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 text-gray-400"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
