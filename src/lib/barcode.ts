// Barcode scanning with two backends:
//   1. The native BarcodeDetector API (Chrome/Android, Edge) — fastest, no JS decode.
//   2. ZXing compiled to JS — the fallback that covers iOS Safari, which has no
//      BarcodeDetector.
// Both read from the same <video> element fed by getUserMedia.

import type { IScannerControls } from "@zxing/browser";

const FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
] as const;

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: readonly string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

function nativeDetector(): BarcodeDetectorConstructor | undefined {
  return (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
}

export function isCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    // getUserMedia only exists on secure origins; localhost counts as secure.
    (window.isSecureContext ?? false)
  );
}

export interface ScannerHandle {
  stop: () => void;
}

/**
 * Starts the rear camera and calls `onResult` with the first barcode found.
 * Rejects when permission is denied or no camera is available.
 */
export async function startScanner(
  video: HTMLVideoElement,
  onResult: (value: string) => void,
): Promise<ScannerHandle> {
  const Detector = nativeDetector();

  if (Detector) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });

    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play();

    const detector = new Detector({ formats: FORMATS });
    let stopped = false;
    let frame = 0;

    const tick = async () => {
      if (stopped) return;
      try {
        const results = await detector.detect(video);
        const value = results[0]?.rawValue?.trim();
        if (value) {
          onResult(value);
          return;
        }
      } catch {
        /* a dropped frame is not fatal — keep scanning */
      }
      frame = requestAnimationFrame(() => void tick());
    };

    void tick();

    return {
      stop: () => {
        stopped = true;
        cancelAnimationFrame(frame);
        for (const track of stream.getTracks()) track.stop();
        video.srcObject = null;
      },
    };
  }

  // ZXing is ~400 kB — only browsers without BarcodeDetector (notably iOS
  // Safari) ever pay for it, and only when the scanner is actually opened.
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
    await Promise.all([import("@zxing/browser"), import("@zxing/library")]);

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
  ]);
  const reader = new BrowserMultiFormatReader(hints);

  let stopped = false;

  const controls: IScannerControls = await reader.decodeFromConstraints(
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    video,
    (result) => {
      if (stopped || !result) return;
      const value = result.getText().trim();
      if (value) onResult(value);
    },
  );

  return {
    stop: () => {
      stopped = true;
      controls.stop();
    },
  };
}
