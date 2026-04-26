import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  "Registration Open": "bg-success/10 text-success border-success/20",
  "In Progress": "bg-red/10 text-red border-red/20",
  Planning: "bg-warning/10 text-warning border-warning/20",
  Completed: "bg-text-secondary/10 text-text-secondary border-border",
  Active: "bg-success/10 text-success border-success/20",
  Hot: "bg-danger/10 text-danger border-danger/20",
  Warm: "bg-warning/10 text-warning border-warning/20",
  Cold: "bg-blue-50 text-blue-600 border-blue-100",
  New: "bg-red/10 text-red border-red/20",
  Reviewed: "bg-warning/10 text-warning border-warning/20",
  Responded: "bg-success/10 text-success border-success/20",
  Prospect: "bg-text-secondary/10 text-text-secondary border-border",
  Contacted: "bg-warning/10 text-warning border-warning/20",
  Pitched: "bg-red/10 text-red border-red/20",
  Negotiating: "bg-purple-50 text-purple-600 border-purple-100",
};

export default function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || "bg-white text-text-secondary border-border";
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
