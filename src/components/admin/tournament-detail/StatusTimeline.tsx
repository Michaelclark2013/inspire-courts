"use client";

import { memo } from "react";
import { FileText, Globe, Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "draft", label: "Draft", icon: FileText },
  { key: "published", label: "Published", icon: Globe },
  { key: "active", label: "Active", icon: Play },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STAGES.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center w-full max-w-xl mb-6">
      {STAGES.map((stage, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const Icon = stage.icon;
        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCurrent
                    ? "bg-red/10 border-red text-red"
                    : done
                      ? "bg-success/10 border-success text-success"
                      : "bg-off-white border-border text-text-secondary/40"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider mt-1.5",
                  isCurrent ? "text-red" : done ? "text-success" : "text-text-secondary/50"
                )}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mt-[-18px]",
                  i < currentIdx ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(StatusTimeline);
