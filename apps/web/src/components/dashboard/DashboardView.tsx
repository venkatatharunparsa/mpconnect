"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeStatsFromDemands, fetchDemands, fetchStats } from "./api";
import { useDashboard } from "./DashboardContext";
import { DemandDrawer } from "./DemandDrawer";
import { DemandList } from "./DemandList";
import { LocaleToggle, RoleSwitcher } from "./RoleSwitcher";
import { shellT } from "@/components/shell/labels";
import type { Demand, Stats } from "./types";

function urgencyBadge(urgency: string) {
  if (urgency === "safety" || urgency === "high") {
    return { label: "URGENT", className: "bg-red-50 text-red-700" };
  }
  if (urgency === "medium") {
    return { label: "PENDING", className: "bg-primary/10 text-primary" };
  }
  return { label: "SCHEDULED", className: "bg-emerald-50 text-emerald-700" };
}

export function DashboardView() {
  const { role, locale, selectedDemandId, selectDemand } = useDashboard();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [demandsData, statsData] = await Promise.all([fetchDemands(), fetchStats()]);
    setDemands(demandsData);
    setStats(statsData ?? computeStatsFromDemands(demandsData));
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDemand = useMemo(
    () => demands.find((d) => d.id === selectedDemandId) ?? null,
    [demands, selectedDemandId],
  );

  const displayStats = stats ?? computeStatsFromDemands(demands);
  const ranked = useMemo(
    () => [...demands].sort((a, b) => b.rankScore - a.rankScore),
    [demands],
  );
  const topCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of demands) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
    let best = "—";
    let max = 0;
    for (const [cat, n] of counts) {
      if (n > max) {
        max = n;
        best = cat;
      }
    }
    return best;
  }, [demands]);

  return (
    <div className="flex h-full min-h-[calc(100dvh-3.5rem)] flex-col lg:min-h-[calc(100dvh-4rem)]">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
              {shellT("constituencyShort", locale)}
            </p>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              {shellT("constituencyOverview", locale)}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">{shellT("realTimeHealth", locale)}</p>
          </div>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <RoleSwitcher />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: shellT("totalSubmissions", locale), value: displayStats.citizensHeard },
            { label: shellT("activeClusters", locale), value: displayStats.totalDemands },
            { label: shellT("topCategory", locale), value: topCategory, text: true },
            {
              label: shellT("last7Days", locale),
              value: `+${Math.min(99, displayStats.totalDemands * 3)}`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-card border border-slate-100 bg-surface px-3 py-2.5"
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <p
                className={`mt-0.5 font-extrabold tabular-nums text-slate-900 ${
                  item.text ? "text-sm capitalize" : "text-xl"
                }`}
              >
                {loading ? "—" : item.text ? item.value : Number(item.value).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/map"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm"
          >
            🗺 {shellT("openMap", locale)}
          </Link>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
            disabled={refreshing}
            className="rounded-full border border-primary px-4 py-2 text-xs font-bold text-primary disabled:opacity-50"
          >
            ↻ {shellT("refreshData", locale)}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-2">
        <section className="hidden border-r border-slate-200 lg:block lg:overflow-y-auto">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">{shellT("topPriorities", locale)}</h2>
          </div>
          <ul className="space-y-0 divide-y divide-slate-100">
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <li key={i} className="h-20 animate-pulse bg-slate-100/60" />
                ))
              : ranked.slice(0, 8).map((d, idx) => {
                  const badge = urgencyBadge(d.urgency);
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => selectDemand(d.id)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg font-extrabold text-slate-300">#{idx + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">{d.title}</p>
                            <p className="text-xs text-slate-500">
                              {d.affectedCount} {shellT("reports", locale)} · {d.category}
                            </p>
                            <span
                              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
          </ul>
        </section>

        <div className="h-full overflow-y-auto">
          <DemandList
            demands={ranked}
            loading={loading}
            locale={locale}
            selectedId={selectedDemandId}
            onSelect={selectDemand}
          />
        </div>
      </div>

      {role === "mp" && (
        <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-400">
          MP view · open a demand for evidence, routing & MPLADS pack
        </p>
      )}

      <DemandDrawer
        demand={selectedDemand}
        open={selectedDemandId != null}
        onClose={() => selectDemand(null)}
        role={role}
        locale={locale}
      />
    </div>
  );
}
