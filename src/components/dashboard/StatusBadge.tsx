import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  "Registration Open": "bg-success/10 text-success border-success/20",
  "In Progress": "bg-accent/10 text-accent border-accent/20",
  Planning: "bg-warning/10 text-warning border-warning/20",
  Completed: "bg-text-secondary/10 text-text-secondary border-border",
  Active: "bg-success/10 text-success border-success/20",
  Hot: "bg-danger/10 text-danger border-danger/20",
  Warm: "bg-warning/10 text-warning border-warning/20",
  Cold: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  New: "bg-accent/10 text-accent border-accent/20",
  Reviewed: "bg-warning/10 text-warning border-warning/20",
  Responded: "bg-success/10 text-success border-success/20",
  Prospect: "bg-text-secondary/10 text-text-secondary border-border",
  Contacted: "bg-warning/10 text-warning border-warning/20",
  Pitched: "bg-accent/10 text-accent border-accent/20",
  Negotiating: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || "bg-bg text-text-secondary border-border";
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border",
        colors
      )}
    >
      {status}
    </span>
  );
}
