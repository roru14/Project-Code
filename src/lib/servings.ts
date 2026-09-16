// Serving-size maths, ported from the original app's edit-entry screen.

const WEIGHT_UNITS: Record<string, number> = {
  g: 1,
  gr: 1,
  gram: 1,
  grams: 1,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  kg: 1000,
};

const VOLUME_UNITS: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  litre: 1000,
  cup: 240,
  cups: 240,
  "fl oz": 29.5735,
  floz: 29.5735,
};

type Canonical = "weight" | "volume" | "unit";

export interface ServingOption {
  label: string;
  canonicalGrams: number;
}

function parseServing(label: string): { amount: number; unit: string } {
  const match = label.trim().match(/([\d.]+)\s*(.*)$/);
  const amount = match ? Number.parseFloat(match[1]) : 1;
  const unit = (match && match[2] ? match[2] : "serving").trim().toLowerCase();
  return { amount: amount > 0 ? amount : 1, unit: unit || "serving" };
}

function unitInfo(unit: string): { canonical: Canonical; factor: number } {
  if (unit in WEIGHT_UNITS) {
    return { canonical: "weight", factor: WEIGHT_UNITS[unit] };
  }
  if (unit in VOLUME_UNITS) {
    return { canonical: "volume", factor: VOLUME_UNITS[unit] };
  }
  return { canonical: "unit", factor: 1 };
}

/** The base serving plus the sensible alternatives for its unit family. */
export function buildServingOptions(servingLabel: string): ServingOption[] {
  const { amount, unit } = parseServing(servingLabel);
  const { canonical, factor } = unitInfo(unit);

  const options: ServingOption[] = [
    { label: servingLabel, canonicalGrams: amount * factor },
  ];

  if (canonical === "weight") {
    options.push(
      { label: "1 g", canonicalGrams: 1 },
      { label: "100 g", canonicalGrams: 100 },
      { label: "1 oz", canonicalGrams: WEIGHT_UNITS.oz },
    );
  } else if (canonical === "volume") {
    options.push(
      { label: "1 ml", canonicalGrams: 1 },
      { label: "100 ml", canonicalGrams: 100 },
      { label: "1 fl oz", canonicalGrams: VOLUME_UNITS["fl oz"] },
    );
  } else {
    options.push({ label: `1 ${unit}`, canonicalGrams: factor });
  }

  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.label)) return false;
    seen.add(option.label);
    return true;
  });
}
