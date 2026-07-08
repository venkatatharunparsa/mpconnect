"use client";

import { PERSONAL_CATEGORIES } from "@mpconnect/shared";
import { StateBadge, UrgencyIndicator } from "./StateBadge";
import { t } from "./labels";
import { demandPhotoUrl } from "@/lib/demand-photo";
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
  const isPublic = !PERSONAL_CATEGORIES.includes(demand.category);

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

        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={demandPhotoUrl(demand)}
            alt=""
            className="h-16 w-16 rounded-md border border-slate-200 object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold leading-snug text-slate-900">{demand.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-bold ${
                    isPublic
                      ? "bg-primary/10 text-primary"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {isPublic ? "Public" : "Personal"}
                </span>
                {demand.ward && (
                  <span className="text-slate-600">
                    {t("ward", locale)}: <span className="font-medium">{demand.ward}</span>
                  </span>
                )}
              </div>
            </div>
            <StateBadge state={demand.state} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <UrgencyIndicator urgency={demand.urgency} />
          </div>

          <p className="mt-2 text-sm font-bold text-primary">
            {demand.affectedCount.toLocaleString()} {t("citizens", locale)}
          </p>
        </div>
      </div>
    </button>
  );
}
