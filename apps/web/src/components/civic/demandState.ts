import type { Demand } from "@/components/dashboard/types";

export function demandStateLabel(state: string) {
  return state.replace(/_/g, " ");
}

export function demandStateChipClass(state: string) {
  if (state === "resolved_verified") return "bg-green-100 text-green-700";
  if (state === "fix_claimed") return "bg-purple-100 text-purple-700";
  if (state === "in_progress" || state === "routed") return "bg-indigo-100 text-indigo-700";
  if (state === "reopened") return "bg-red-100 text-red-700";
  if (state === "validated_public") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

export function urgencyLabel(urgency: string) {
  if (urgency === "safety" || urgency === "high") return "Critical";
  if (urgency === "medium") return "Medium";
  return "Low";
}

export function urgencyChipClass(urgency: string) {
  if (urgency === "safety" || urgency === "high") return "bg-red-50 text-red-700 border-red-100";
  if (urgency === "medium") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-slate-50 text-slate-600 border-outline-variant";
}

export function sortByTriage(a: Demand, b: Demand) {
  const rank = (u: string) => (u === "safety" || u === "high" ? 0 : u === "medium" ? 1 : 2);
  const du = rank(a.urgency) - rank(b.urgency);
  if (du !== 0) return du;
  return b.rankScore - a.rankScore;
}
