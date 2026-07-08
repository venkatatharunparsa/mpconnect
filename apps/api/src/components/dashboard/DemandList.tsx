"use client";

import { useState } from "react";
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
  const [filterEscalated, setFilterEscalated] = useState(false);
  
  const sorted = [...demands].sort((a, b) => b.rankScore - a.rankScore);
  const filtered = filterEscalated ? sorted.filter((d) => d.isEscalated) : sorted;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{t("rankedDemands", locale)}</h2>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterEscalated}
              onChange={(e) => setFilterEscalated(e.target.checked)}
              className="accent-rose-600"
            />
            ⚠ SLA Escalated Only
          </label>
        </div>
        {!loading && demands.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">{filtered.length} demands · by priority score</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <DemandListSkeleton locale={locale} />
        ) : filtered.length === 0 ? (
          <EmptyDemandState locale={locale} />
        ) : (
          <div className="space-y-2 p-3">
            {filtered.map((d, i) => (
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
