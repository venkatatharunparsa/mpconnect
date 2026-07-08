import type { DemandState } from "./types";

export function getStateHex(state: string): string {
  switch (state) {
    case "claimed":
    case "fix_claimed":
      return "#f59e0b";
    case "validated_public":
    case "routed":
    case "in_progress":
      return "#3b82f6";
    case "reopened":
      return "#ef4444";
    case "resolved_verified":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
}

export function getStateBadgeClass(state: string): string {
  switch (state) {
    case "claimed":
    case "fix_claimed":
      return "bg-state-claimed/15 text-amber-800 border-state-claimed/40";
    case "validated_public":
    case "routed":
    case "in_progress":
      return "bg-state-active/15 text-blue-900 border-state-active/40";
    case "reopened":
      return "bg-state-reopened/15 text-red-900 border-state-reopened/40";
    case "resolved_verified":
      return "bg-state-resolved/15 text-green-900 border-state-resolved/40";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

export function formatStateLabel(state: DemandState): string {
  return state.replace(/_/g, " ");
}

export function markerRadius(affectedCount: number): number {
  const min = 10;
  const max = 44;
  const scaled = min + Math.log2(Math.max(1, affectedCount)) * 6;
  return Math.min(max, Math.max(min, scaled));
}
