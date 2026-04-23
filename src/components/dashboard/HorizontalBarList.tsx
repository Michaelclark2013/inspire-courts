// Pure-CSS bar-list widget. Split out from Charts.tsx so list/sheet
// views that only want the bar visualization don't transitively pull
// recharts (which Charts.tsx imports for its bigger chart types).

import { BRAND } from "./chart-colors";

interface HBarItem {
  label: string;
  value: number;
  color?: string;
  sublabel?: string;
}

interface HorizontalBarListProps {
  data: HBarItem[];
  max?: number;
  valueFormatter?: (v: number) => string;
}

export function HorizontalBarList({
  data,
  max,
  valueFormatter,
}: HorizontalBarListProps) {
  const maxVal = max ?? Math.max(...data.map((d) => d.value), 1);
  const fmt = valueFormatter || ((v: number) => `${v}`);

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 flex-shrink-0 text-right">
            <span className="text-xs text-text-secondary truncate block">{item.label}</span>
            {item.sublabel && (
              <span className="text-[10px] text-text-secondary/60">{item.sublabel}</span>
            )}
          </div>
          <div className="flex-1 h-5 bg-white rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-500"
              style={{
                width: `${Math.max((item.value / maxVal) * 100, 2)}%`,
                backgroundColor: item.color || BRAND.red,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-navy w-12 flex-shrink-0">
            {fmt(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
