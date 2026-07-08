"use client";

import { getStateBadgeClass, formatStateLabel } from "./utils";
import type { Demand, UiLocale } from "./types";

interface OfficialListProps {
  demands: Demand[];
  loading: boolean;
  locale: UiLocale;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OfficialList({
  demands,
  loading,
  locale,
  selectedId,
  onSelect,
}: OfficialListProps) {
  const sorted = [...demands].sort((a, b) => b.rankScore - a.rankScore);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-5 py-4 shadow-sm shrink-0">
        <h2 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">
          Jurisdiction Queue ({demands.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-2xl h-20" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl">
            <span className="text-2xl">📋</span>
            <p className="text-xs text-slate-400 mt-2">All tasks completed in your jurisdiction!</p>
          </div>
        ) : (
          sorted.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`w-full text-left bg-white border rounded-2xl p-4 shadow-sm transition-all duration-300 relative ${
                selectedId === d.id
                  ? "border-primary bg-primary/[0.01] ring-2 ring-primary/10"
                  : "border-slate-200/70 hover:border-primary/40"
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-bold text-slate-900 leading-snug text-sm">
                    {d.title}
                  </h3>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${getStateBadgeClass(d.state)}`}>
                    {formatStateLabel(d.state)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Category: {d.category} · Ward: {d.ward}</span>
                  {d.isEscalated && (
                    <span className="text-rose-600 font-black">⚠️ SLA Overdue</span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
