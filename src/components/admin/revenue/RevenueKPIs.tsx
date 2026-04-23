import type { RevenueKPIData } from "@/types/revenue";

interface Props {
  kpis: RevenueKPIData[];
}

export function RevenueKPIs({ kpis }: Props) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 md:mb-8"
      role="region"
      aria-label="Revenue summary"
    >
      {kpis.map((k) => (
        <div
          key={k.label}
          className={`border rounded-sm p-3 md:p-4 ${
            k.highlight
              ? "bg-red/10 border-red/30"
              : "bg-white border-light-gray shadow-sm"
          }`}
        >
          <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">
            {k.label}
          </p>
          <p
            className={`font-bold text-xl md:text-2xl ${
              k.highlight ? "text-red" : "text-navy"
            }`}
            aria-live="polite"
          >
            {k.value}
          </p>
        </div>
      ))}
    </div>
  );
}
