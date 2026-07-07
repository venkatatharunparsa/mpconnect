"use client";

import { DemandListItem } from "./DemandListItem";
import { EmptyDemandState } from "./EmptyState";
import { DemandListSkeleton } from "./LoadingSkeleton";
import { t } from "./labels";
import type { Demand, UiLocale } from "./types";

interface DemandListProps {
  demands: Demand[];
  loading: boolean;
  locale: UiLocale;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DemandList({
  demands,
  loading,
  locale,
  selectedId,
  onSelect,
}: DemandListProps) {
  const sorted = [...demands].sort((a, b) => b.rankScore - a.rankScore);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="font-semibold text-slate-900">{t("rankedDemands", locale)}</h2>
        {!loading && demands.length > 0 && (
          <p className="text-xs text-slate-500">{sorted.length} demands · by priority score</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <DemandListSkeleton locale={locale} />
        ) : sorted.length === 0 ? (
          <EmptyDemandState locale={locale} />
        ) : (
          <div className="space-y-2 p-3">
            {sorted.map((d, i) => (
              <div key={d.id} className="relative">
                <span className="absolute -left-1 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <div className="pl-4">
                  <DemandListItem
                    demand={d}
                    locale={locale}
                    selected={selectedId === d.id}
                    onSelect={onSelect}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
