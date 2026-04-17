import { cn } from "@/lib/utils";

const VARIANT_CLASSES: Record<string, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-danger/10 text-danger border-danger/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  neutral: "bg-bg text-text-secondary border-border",
  accent: "bg-accent/10 text-accent border-accent/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
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
        "inline-block px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider border",
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
