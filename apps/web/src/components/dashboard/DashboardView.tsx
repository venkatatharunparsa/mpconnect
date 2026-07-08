"use client";

import { useEffect, useMemo, useState } from "react";
import { computeStatsFromDemands, fetchDemands, fetchStats, fetchWards } from "./api";
import { useDashboard } from "./DashboardContext";
import { DemandDrawer } from "./DemandDrawer";
import { DemandList } from "./DemandList";
import { DemandMap } from "./DemandMap";
import { LocaleToggle, RoleSwitcher } from "./RoleSwitcher";
import { shellT } from "@/components/shell/labels";
import type { Demand, Stats, Ward } from "./types";

type DashTab = "overview" | "map" | "list";

function urgencyBadge(urgency: string) {
  if (urgency === "safety" || urgency === "high") {
    return { label: "CRITICAL", className: "bg-red-50 text-red-700" };
  }
  if (urgency === "medium") {
    return { label: "PENDING", className: "bg-primary/10 text-primary" };
  }
  return { label: "SCHEDULED", className: "bg-emerald-50 text-emerald-700" };
}

function OverviewPanel({
  locale,
  loading,
  displayStats,
  topCategory,
  topPriorities,
  onOpenList,
  onOpenMap,
  onSelectDemand,
  onRefresh,
  refreshing,
  role,
}: {
  locale: "en" | "te";
  loading: boolean;
  displayStats: Stats;
  topCategory: string;
  topPriorities: Demand[];
  onOpenList: () => void;
  onOpenMap: () => void;
  onSelectDemand: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  role: string;
}) {
  return (
    <div className="space-y-4 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="rounded-card bg-primary p-4 text-white shadow-card">
        <h2 className="text-lg font-bold">{shellT("constituencyOverview", locale)}</h2>
        <p className="text-sm text-white/80">{shellT("realTimeHealth", locale)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            className="rounded-card border border-slate-100 bg-white p-3 shadow-card"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p
              className={`mt-1 font-extrabold tabular-nums text-slate-900 ${
                item.text ? "text-base capitalize" : "text-2xl"
              }`}
            >
              {loading ? "—" : item.text ? item.value : Number(item.value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <button
          type="button"
          onClick={onOpenList}
          className="rounded-card bg-primary px-3 py-3 text-left text-sm font-bold text-white shadow-card"
        >
          ⚠ {shellT("viewPriorities", locale)}
        </button>
        <button
          type="button"
          onClick={onOpenMap}
          className="rounded-card bg-primary px-3 py-3 text-left text-sm font-bold text-white shadow-card"
        >
          🗺 {shellT("hotspotMap", locale)}
        </button>
        <button
          type="button"
          disabled
          className="rounded-card bg-slate-100 px-3 py-3 text-left text-sm font-semibold text-slate-400"
        >
          ↓ Export
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-card border-2 border-primary bg-white px-3 py-3 text-left text-sm font-bold text-primary"
        >
          ↻ {shellT("refreshData", locale)}
        </button>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold">{shellT("topPriorities", locale)}</h3>
          <button
            type="button"
            onClick={onOpenList}
            className="text-xs font-semibold text-primary"
          >
            {shellT("viewAll", locale)}
          </button>
        </div>
        <ul className="space-y-2">
          {loading
            ? [1, 2, 3].map((i) => (
                <li key={i} className="h-20 animate-pulse rounded-card bg-slate-200/60" />
              ))
            : topPriorities.map((d, idx) => {
                const badge = urgencyBadge(d.urgency);
                const barPct = Math.min(
                  100,
                  (d.affectedCount / Math.max(topPriorities[0]?.affectedCount ?? 1, 1)) * 100,
                );
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => onSelectDemand(d.id)}
                      className="w-full rounded-card border border-slate-100 bg-white p-3 text-left shadow-card"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-extrabold text-slate-300">#{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">{d.title}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {d.ward ?? shellT("constituencyShort", locale)} · {d.affectedCount}{" "}
                            {shellT("reports", locale)}
                          </p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                badge.label === "CRITICAL" ? "bg-red-500" : "bg-primary"
                              }`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
        </ul>
      </section>

      <button
        type="button"
        onClick={onOpenMap}
        className="w-full overflow-hidden rounded-card bg-gradient-to-br from-primary/90 to-primary-dark p-4 text-left text-white shadow-card"
      >
        <p className="text-sm font-bold">{shellT("hotspotBanner", locale)}</p>
        <p className="mt-1 text-xs text-white/75">{shellT("hotspots", locale)} →</p>
      </button>

      {role === "mp" && (
        <p className="text-center text-xs text-slate-400">
          MP view · evidence & MPLADS in demand drawer
        </p>
      )}
    </div>
  );
}

export function DashboardView() {
  const { role, locale, selectedDemandId, selectDemand } = useDashboard();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsAvailable, setWardsAvailable] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DashTab>("overview");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [demandsData, wardsResult, statsData] = await Promise.all([
      fetchDemands(),
      fetchWards(),
      fetchStats(),
    ]);
    setDemands(demandsData);
    setWards(wardsResult.wards);
    setWardsAvailable(wardsResult.available);
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
  const topPriorities = useMemo(
    () => [...demands].sort((a, b) => b.rankScore - a.rankScore).slice(0, 5),
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

  const overviewProps = {
    locale,
    loading,
    displayStats,
    topCategory,
    topPriorities,
    onOpenList: () => setTab("list"),
    onOpenMap: () => setTab("map"),
    onSelectDemand: selectDemand,
    onRefresh: () => {
      setRefreshing(true);
      void load();
    },
    refreshing,
    role,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">{shellT("realTimeHealth", locale)}</p>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <RoleSwitcher />
          </div>
        </div>

        <div className="mt-3 flex gap-1 rounded-full bg-slate-100 p-1 text-xs font-semibold lg:hidden">
          {(
            [
              ["overview", shellT("priorities", locale)],
              ["map", shellT("hotspotMap", locale)],
              ["list", shellT("viewAll", locale)],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-full py-1.5 transition-colors ${
                tab === key ? "bg-white text-primary shadow-sm" : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "overview" && (
          <div className="h-full overflow-y-auto lg:hidden">
            <OverviewPanel {...overviewProps} />
          </div>
        )}
        {tab === "map" && (
          <div className="h-full min-h-[360px] lg:hidden">
            <DemandMap
              demands={demands}
              wards={wards}
              wardsAvailable={wardsAvailable}
              loading={loading}
              locale={locale}
              selectedId={selectedDemandId}
              onSelect={selectDemand}
            />
          </div>
        )}
        {tab === "list" && (
          <div className="h-full overflow-y-auto lg:hidden">
            <DemandList
              demands={demands}
              loading={loading}
              locale={locale}
              selectedId={selectedDemandId}
              onSelect={selectDemand}
            />
          </div>
        )}

        <div className="hidden h-full flex-col overflow-y-auto lg:flex">
          <OverviewPanel {...overviewProps} />
          <div className="grid min-h-[420px] flex-1 grid-cols-2 border-t border-slate-200">
            <DemandMap
              demands={demands}
              wards={wards}
              wardsAvailable={wardsAvailable}
              loading={loading}
              locale={locale}
              selectedId={selectedDemandId}
              onSelect={selectDemand}
            />
            <DemandList
              demands={demands}
              loading={loading}
              locale={locale}
              selectedId={selectedDemandId}
              onSelect={selectDemand}
            />
          </div>
        </div>
      </div>

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
