// Brand colors + default chart palette, split out from Charts.tsx so
// consumers that only need color constants (e.g. sheet list views that
// render colored badges/bars by hand) don't transitively import recharts
// and its ~100KB of tree-shaken deps.

export const BRAND = {
  red: "#CC0000",
  redLight: "#E31B23",
  navy: "#0B1D3A",
  navyLight: "#132B52",
  blue1: "#1e40af",
  blue2: "#2563eb",
  blue3: "#3b82f6",
  blue4: "#60a5fa",
  blue5: "#93c5fd",
  green: "#22C55E",
  yellow: "#EAB308",
  orange: "#f97316",
  purple: "#a855f7",
};

export const CHART_COLORS = [
  BRAND.red,
  BRAND.blue2,
  BRAND.green,
  BRAND.yellow,
  BRAND.orange,
  BRAND.purple,
  BRAND.blue4,
  BRAND.blue1,
];
