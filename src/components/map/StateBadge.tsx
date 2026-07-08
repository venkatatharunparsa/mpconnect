"use client";

import { getStateBadgeClass, formatStateLabel } from "./stateColors";
import type { DemandState } from "./types";

interface StateBadgeProps {
  state: DemandState;
}

export function StateBadge({ state }: StateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors ${getStateBadgeClass(
        state,
      )}`}
    >
      {formatStateLabel(state)}
    </span>
  );
}

interface UrgencyIndicatorProps {
  urgency: string;
}

export function UrgencyIndicator({ urgency }: UrgencyIndicatorProps) {
  const isUrgent = urgency === "high" || urgency === "safety";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        isUrgent ? "text-red-600" : "text-slate-500"
      }`}
    >
      {isUrgent && <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />}
      {urgency}
    </span>
  );
}
