// Renders the app icons as PNGs with no image dependencies: we rasterise a
// calorie-ring mark into an RGBA buffer and write a minimal PNG by hand.
// Run with `npm run icons` after changing the mark.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const BLUE = [0x1d, 0x63, 0xed];
const WHITE = [0xff, 0xff, 0xff];
const CARBS = [0x2b, 0xc4, 0xa6];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // 10-12 stay zero: deflate, no filter, no interlace.

  // One filter byte (0 = None) in front of every scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Smooth coverage in [0,1] for a value that should be <= 0 inside the shape. */
function coverage(signedDistance, feather = 1) {
  return Math.max(0, Math.min(1, 0.5 - signedDistance / feather));
}

function blend(target, offset, color, alpha) {
  if (alpha <= 0) return;
  for (let channel = 0; channel < 3; channel += 1) {
    const existing = target[offset + channel];
    target[offset + channel] = Math.round(
      existing * (1 - alpha) + color[channel] * alpha,
    );
  }
  target[offset + 3] = Math.round(
    target[offset + 3] * (1 - alpha) + 255 * alpha,
  );
}

/**
 * @param size    pixel dimension
 * @param bleed   true for maskable icons: fill the whole canvas and shrink the
 *                mark into the 80% safe zone.
 */
function renderIcon(size, bleed) {
  const rgba = Buffer.alloc(size * size * 4, 0);
  const center = size / 2;

  const cornerRadius = bleed ? 0 : size * 0.22;
  const markScale = bleed ? 0.62 : 0.78;
  const ringRadius = (size * markScale) / 2 - size * 0.08;
  const ringWidth = size * 0.11;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      // Rounded-square background (a plain square when bleed is on).
      const dx = Math.abs(px - center) - (center - cornerRadius);
      const dy = Math.abs(py - center) - (center - cornerRadius);
      const outside =
        Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
        Math.min(Math.max(dx, dy), 0) -
        cornerRadius;
      blend(rgba, offset, BLUE, coverage(outside));

      // Ring: an annulus, with the last ~22% of the sweep in the carbs green.
      const radial = Math.hypot(px - center, py - center);
      const ringDistance = Math.abs(radial - ringRadius) - ringWidth / 2;
      const ringAlpha = coverage(ringDistance);
      if (ringAlpha > 0) {
        // 0 at 12 o'clock, increasing clockwise.
        const angle =
          (Math.atan2(px - center, center - py) + Math.PI * 2) % (Math.PI * 2);
        const sweep = angle / (Math.PI * 2);
        blend(rgba, offset, sweep > 0.78 ? CARBS : WHITE, ringAlpha);
      }
    }
  }

  return encodePng(size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["apple-touch-icon.png", 180, true],
  ["maskable-512.png", 512, true],
];

for (const [name, size, bleed] of targets) {
  writeFileSync(join(OUT_DIR, name), renderIcon(size, bleed));
  console.log(`wrote ${name} (${size}x${size})`);
}
