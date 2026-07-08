import { formatStateLabel, getStateBadgeClass } from "./stateColors";
import type { DemandState } from "./types";

export function StateBadge({ state }: { state: DemandState | string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getStateBadgeClass(state)}`}
    >
      {formatStateLabel(state as DemandState)}
    </span>
  );
}

export function UrgencyIndicator({ urgency }: { urgency: string }) {
  const levels: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    safety: 4,
  };
  const level = levels[urgency] ?? 2;

  return (
    <span className="inline-flex items-center gap-0.5" title={urgency}>
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-1 rounded-sm ${
            i < level
              ? urgency === "safety"
                ? "bg-state-reopened"
                : urgency === "high"
                  ? "bg-state-claimed"
                  : "bg-state-active"
              : "bg-slate-200"
          }`}
        />
      ))}
    </span>
  );
}
