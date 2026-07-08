"use client";

import type { RankBreakdown } from "@/components/dashboard/types";

interface MatrixRow {
  key: string;
  label: string;
  value: number;
  color: string;
}

function rowsFromBreakdown(
  score: number,
  breakdown?: RankBreakdown | null,
): MatrixRow[] {
  if (breakdown && Object.keys(breakdown).length > 0) {
    const map: Record<string, { label: string; color: string }> = {
      affected: { label: "Demand (D)", color: "bg-primary" },
      urgency: { label: "Recency (R)", color: "bg-accent" },
      recurrence: { label: "Confidence (C)", color: "bg-amber-600" },
      equity: { label: "Evidence (E)", color: "bg-primary-light" },
      dataGap: { label: "Data gap", color: "bg-slate-400" },
    };
    return Object.entries(breakdown)
      .filter(([, v]) => typeof v === "number")
      .slice(0, 4)
      .map(([key, value]) => ({
        key,
        label: map[key]?.label ?? key,
        value: Math.min(100, Math.max(0, (value as number) * (value as number <= 1 ? 100 : 1))),
        color: map[key]?.color ?? "bg-primary",
      }));
  }

  const base = Math.min(100, Math.max(0, score));
  return [
    { key: "e", label: "Evidence (E)", value: Math.min(100, base * 0.88), color: "bg-primary" },
    { key: "d", label: "Demand (D)", value: Math.min(100, base * 0.92), color: "bg-primary-light" },
    { key: "c", label: "Confidence (C)", value: Math.min(100, base * 0.75), color: "bg-amber-600" },
    { key: "r", label: "Recency (R)", value: Math.min(100, base * 0.95), color: "bg-accent" },
  ];
}

interface PriorityScoreMatrixProps {
  score: number;
  breakdown?: RankBreakdown | null;
  title?: string;
}

export function PriorityScoreMatrix({ score, breakdown, title }: PriorityScoreMatrixProps) {
  const rows = rowsFromBreakdown(score, breakdown);

  return (
    <div className="rounded-card border border-slate-100 bg-white p-4 shadow-card">
      {title && <h3 className="mb-3 text-sm font-bold text-slate-900">{title}</h3>}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-slate-600">
                {row.label}
              </span>
              <span className="font-bold tabular-nums text-slate-800">{Math.round(row.value)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${row.color} transition-all`}
                style={{ width: `${row.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
