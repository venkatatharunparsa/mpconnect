"use client";

import { useState } from "react";
import { t } from "./labels";
import type { RankBreakdown, UiLocale } from "./types";

const BREAKDOWN_KEYS: { key: string; label: string }[] = [
  { key: "affected", label: "Affected citizens" },
  { key: "urgency", label: "Urgency" },
  { key: "recurrence", label: "Recurrence" },
  { key: "equity", label: "Equity" },
  { key: "dataGap", label: "Data gap" },
];

interface ScoreBreakdownProps {
  score: number;
  breakdown?: RankBreakdown | null;
  locale: UiLocale;
}

export function ScoreBreakdown({ score, breakdown, locale }: ScoreBreakdownProps) {
  const [open, setOpen] = useState(false);
  const maxScore = 100;
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));

  const entries = breakdown
    ? [
        ...BREAKDOWN_KEYS.filter((k) => breakdown[k.key] != null).map((k) => ({
          label: k.label,
          value: breakdown[k.key] as number,
        })),
        ...Object.entries(breakdown)
          .filter(([k, v]) => !BREAKDOWN_KEYS.some((b) => b.key === k) && typeof v === "number")
          .map(([k, v]) => ({ label: k, value: v as number })),
      ]
    : [];

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{t("score", locale)}</span>
          <span className="font-semibold tabular-nums text-slate-800">{score.toFixed(1)}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
          <div className="mb-2 font-semibold text-slate-800">{t("scoreBreakdown", locale)}</div>
          {entries.length === 0 ? (
            <p className="text-slate-500">No breakdown available yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {entries.map((e) => (
                <li key={e.label} className="flex justify-between gap-2">
                  <span className="text-slate-600">{e.label}</span>
                  <span className="font-medium tabular-nums">{e.value.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
