"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Zap } from "lucide-react";
import type { RegistrationStep } from "@/types/portal";

type Props = {
  steps: RegistrationStep[];
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
};

export function RegistrationProgress({ steps, completedSteps, totalSteps, progressPercent }: Props) {
  if (steps.length === 0) return null;
  return (
    <div className="mb-6 bg-white shadow-sm border border-light-gray rounded-2xl p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-red" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-navy font-bold text-sm">Event Registration</h2>
            <p className="text-text-muted text-xs">
              {completedSteps === totalSteps
                ? "All set! You're fully registered."
                : `${completedSteps} of ${totalSteps} steps complete`}
            </p>
          </div>
        </div>
        <span className="text-navy font-bold text-lg tabular-nums">{progressPercent}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Registration progress: ${progressPercent}% complete`}
        className="w-full h-2 bg-light-gray rounded-full mb-5 overflow-hidden"
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPercent}%`,
            background:
              progressPercent === 100
                ? "linear-gradient(90deg, #22C55E, #16A34A)"
                : "linear-gradient(90deg, #CC0000, #E31B23)",
          }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          return (
            <Link
              key={i}
              href={step.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all group focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none ${
                step.done ? "bg-emerald-50 hover:bg-emerald-100" : "bg-off-white hover:bg-navy/[0.04]"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-light-gray flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${step.done ? "text-emerald-600" : "text-navy"}`}>
                  {step.label}
                </p>
                <p className="text-text-muted text-xs truncate">{step.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-light-gray group-hover:text-navy/40 transition-colors flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
