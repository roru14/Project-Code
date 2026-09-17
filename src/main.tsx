import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Offline support is a bonus, not a requirement: some hosts (sandboxed
// embeds, insecure origins) refuse service-worker registration, and that must
// never stop the app from rendering.
async function registerServiceWorker() {
  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch {
    /* no offline support here — the app still works online */
  }
}

void registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
