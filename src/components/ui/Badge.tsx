import { cn } from "@/lib/utils";

const VARIANT_CLASSES: Record<string, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-danger/10 text-danger border-danger/20",
  info: "bg-blue-50 text-blue-600 border-blue-200",
  neutral: "bg-bg text-text-secondary border-border",
  accent: "bg-accent/10 text-accent border-accent/20",
  purple: "bg-purple-50 text-purple-600 border-purple-200",
};

interface BadgeProps {
  variant?: keyof typeof VARIANT_CLASSES;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border",
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
