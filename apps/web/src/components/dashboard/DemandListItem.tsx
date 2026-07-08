"use client";

import { ScoreBreakdown } from "./ScoreBreakdown";
import { StateBadge, UrgencyIndicator } from "./StateBadge";
import { t } from "./labels";
import type { Demand, UiLocale } from "./types";

interface DemandListItemProps {
  demand: Demand;
  locale: UiLocale;
  selected: boolean;
  onSelect: (id: string) => void;
  rank?: number;
}

export function DemandListItem({
  demand,
  locale,
  selected,
  onSelect,
  rank,
}: DemandListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(demand.id)}
      className={`w-full rounded-card border p-4 text-left shadow-card transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-slate-100 bg-white hover:border-primary/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {rank != null && (
          <span className="text-lg font-extrabold text-slate-300">#{rank}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold leading-snug text-slate-900">{demand.title}</h3>
            <StateBadge state={demand.state} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            {demand.ward && (
              <span>
                {t("ward", locale)}: <span className="font-medium">{demand.ward}</span>
              </span>
            )}
            <UrgencyIndicator urgency={demand.urgency} />
          </div>
          <p className="mt-2 text-sm font-bold text-primary">
            {demand.affectedCount.toLocaleString()} {t("citizens", locale)}
          </p>
          <div className="mt-3">
            <ScoreBreakdown
              score={demand.rankScore}
              breakdown={demand.rankBreakdown}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
