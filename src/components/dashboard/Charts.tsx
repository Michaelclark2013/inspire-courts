"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

// ── Brand colors ──────────────────────────────────────────────────────────────

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

// ── Shared tooltip style ──────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: "#132B52",
  border: "1px solid #2A3A55",
  borderRadius: "4px",
  color: "#fff",
  fontSize: 12,
};

// ── Vertical Bar Chart ────────────────────────────────────────────────────────

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface AdminBarChartProps {
  data: BarItem[];
  height?: number;
  color?: string;
  unit?: string;
  valueFormatter?: (v: number) => string;
}

export function AdminBarChart({
  data,
  height = 220,
  color = BRAND.red,
  unit = "",
  valueFormatter,
}: AdminBarChartProps) {
  const fmt = valueFormatter || ((v: number) => `${v}${unit}`);
  const chartData = data.map((d) => ({ name: d.label, value: d.value, fill: d.color || color }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A3A55" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#8B95B1", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8B95B1", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) => [fmt(Number(v)), "Value"]}
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Donut / Pie Chart ─────────────────────────────────────────────────────────

interface PieItem {
  label: string;
  value: number;
  color?: string;
}

interface AdminDonutChartProps {
  data: PieItem[];
  height?: number;
  valueFormatter?: (v: number) => string;
  innerRadius?: number;
  outerRadius?: number;
}

export function AdminDonutChart({
  data,
  height = 220,
  valueFormatter,
  innerRadius = 55,
  outerRadius = 80,
}: AdminDonutChartProps) {
  const fmt = valueFormatter || ((v: number) => `${v}`);
  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: d.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) => [fmt(Number(v)), ""]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: "#8B95B1", fontSize: 11 }}>{value}</span>
          )}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Horizontal Bar (CSS) ──────────────────────────────────────────────────────

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

// ── Funnel Chart ──────────────────────────────────────────────────────────────

interface FunnelItem {
  label: string;
  value: number;
  color?: string;
}

interface AdminFunnelProps {
  data: FunnelItem[];
  height?: number;
}

export function AdminFunnel({ data, height = 220 }: AdminFunnelProps) {
  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: d.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <FunnelChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Funnel dataKey="value" data={chartData} isAnimationActive>
          <LabelList
            position="right"
            fill="#8B95B1"
            stroke="none"
            dataKey="name"
            style={{ fontSize: 11 }}
          />
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

// ── Simple Stat Row (for tables w/ mini bar) ─────────────────────────────────

interface StatRowProps {
  label: string;
  value: number | string;
  sublabel?: string;
  pct?: number; // 0-100
  color?: string;
}

export function StatRow({ label, value, sublabel, pct, color = BRAND.red }: StatRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-navy font-medium truncate">{label}</p>
        {sublabel && <p className="text-xs text-text-secondary">{sublabel}</p>}
      </div>
      {pct !== undefined && (
        <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      )}
      <span className="text-sm font-bold text-navy flex-shrink-0 w-16 text-right">
        {value}
      </span>
    </div>
  );
}
