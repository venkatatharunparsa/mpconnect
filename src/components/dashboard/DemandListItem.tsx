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
}

export function DemandListItem({ demand, locale, selected, onSelect }: DemandListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(demand.id)}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-slate-900">{demand.title}</h3>
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
      <p className="mt-2 text-base font-bold text-primary">
        {t("affects", locale)} {demand.affectedCount.toLocaleString()} {t("citizens", locale)}
      </p>
      <div className="mt-3">
        <ScoreBreakdown
          score={demand.rankScore}
          breakdown={demand.rankBreakdown}
          locale={locale}
        />
      </div>
    </button>
  );
}
