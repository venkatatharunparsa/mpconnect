"use client";

import { ScoreBreakdown } from "./ScoreBreakdown";
import { getStateBadgeClass, formatStateLabel } from "./utils";
import type { Demand, UiLocale } from "./types";

interface MpListProps {
  demands: Demand[];
  loading: boolean;
  locale: UiLocale;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MpList({
  demands,
  loading,
  locale,
  selectedId,
  onSelect,
}: MpListProps) {
  const sorted = [...demands].sort((a, b) => b.rankScore - a.rankScore);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-5 py-4 shadow-sm shrink-0">
        <h2 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">
          {locale === "te" ? "ప్రాధాన్యతలు" : "Constituency Priorities"}
        </h2>
        {!loading && demands.length > 0 && (
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
            {sorted.length} items · Sorted by Score
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl">
            <span className="text-2xl">📋</span>
            <p className="text-xs text-slate-400 mt-2">No priorities match the current filter.</p>
          </div>
        ) : (
          sorted.map((d, i) => (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`w-full text-left bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 relative ${
                selectedId === d.id
                  ? "border-primary bg-primary/[0.02] ring-2 ring-primary/10 shadow-md scale-[1.01]"
                  : "border-slate-200/70 hover:border-primary/40 hover:shadow"
              }`}
            >
              {/* Floating rank index */}
              <span className="absolute -top-2.5 -left-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white shadow-md">
                {i + 1}
              </span>

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-extrabold text-slate-900 leading-snug text-sm">
                    {d.title}
                  </h3>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${getStateBadgeClass(d.state)}`}>
                    {formatStateLabel(d.state)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-semibold capitalize">
                  {d.ward && (
                    <span>
                      {locale === "te" ? "వార్డు" : "Ward"}: <span className="font-extrabold text-slate-800">{d.ward}</span>
                    </span>
                  )}
                  <span>
                    {locale === "te" ? "తీవ్రత" : "Urgency"}: <span className="font-extrabold text-slate-800">{d.urgency}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs font-black text-primary">
                    👍 {d.affectedCount.toLocaleString()} {locale === "te" ? "పౌరులు ప్రభావితం" : "citizens affected"}
                  </span>
                  <div className="w-24 shrink-0">
                    <ScoreBreakdown score={d.rankScore} breakdown={d.rankBreakdown} locale={locale} />
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
