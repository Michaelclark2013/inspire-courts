"use client";

interface ProgressRingProps {
  /** 0-100 percentage */
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function ProgressRing({
  percent,
  size = 36,
  strokeWidth = 3,
  className = "",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-label={`${Math.round(clamped)}% complete`}
      role="img"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-light-gray"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={clamped >= 100 ? "text-success" : clamped >= 50 ? "text-red" : "text-warning"}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      {/* Percentage text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-navy text-[9px] font-bold"
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
