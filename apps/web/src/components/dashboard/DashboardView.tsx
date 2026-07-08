"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PERSONAL_CATEGORIES } from "@mpconnect/shared";
import { computeStatsFromDemands, fetchDemands, fetchStats } from "./api";
import { useDashboard } from "./DashboardContext";
import { DemandDrawer } from "./DemandDrawer";
import { apiFetch } from "@/lib/api-client";
import { demandPhotoUrl } from "@/lib/demand-photo";
import { getDemoCitizenKey } from "@/components/citizenIdentity";
import type { Demand, Stats } from "./types";

type VerificationPrompt = { id: number; demandTitle: string };

export function DashboardView({ variant = "home" }: { variant?: "home" | "issues" }) {
  const { role, locale, selectedDemandId, selectDemand } = useDashboard();
  const mapHref =
    role === "citizen" ? "/user/map" : role === "official" ? "/authority/map" : "/mp/map";

  const [demands, setDemands] = useState<Demand[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState<VerificationPrompt[]>([]);

  const load = async () => {
    const cacheDemandsKey = "mpconnect:demands:v1";
    const cacheStatsKey = "mpconnect:stats:v1";

    const [demandsData, statsData] = await Promise.all([fetchDemands(), fetchStats()]);

    let finalDemands = demandsData;
    let finalStats = statsData;

    // When the backend returns 500, fetchDemands() may resolve to [] (by design).
    // If that happens, show the last known good demands so the UI doesn't get stuck.
    if (finalDemands.length === 0) {
      try {
        const cached = localStorage.getItem(cacheDemandsKey);
        if (cached) {
          const parsed = JSON.parse(cached) as Demand[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            finalDemands = parsed;
          }
        }
      } catch {
        // ignore cache errors
      }

      if (!finalStats) {
        try {
          const cachedStats = localStorage.getItem(cacheStatsKey);
          if (cachedStats) finalStats = JSON.parse(cachedStats) as Stats;
        } catch {
          // ignore cache errors
        }
      }
    }

    setDemands(finalDemands);
    setStats(finalStats ?? computeStatsFromDemands(finalDemands));

    // Store last known good view so we can recover quickly from transient backend errors.
    if (demandsData.length > 0) {
      try {
        localStorage.setItem(cacheDemandsKey, JSON.stringify(demandsData));
        if (statsData) localStorage.setItem(cacheStatsKey, JSON.stringify(statsData));
      } catch {
        // ignore quota/storage errors
      }
    }

    setLoading(false);
    setRefreshing(false);
  };

  const loadPendingVerifications = async () => {
    if (role !== "citizen") return;
    try {
      const citizenKey = getDemoCitizenKey();
      const res = await apiFetch(`/api/verifications?citizenKey=${encodeURIComponent(citizenKey)}`);
      if (!res.ok) {
        setPendingVerifications([]);
        return;
      }
      const data = (await res.json()) as Array<{ id: number; demandTitle: string }>;
      setPendingVerifications(data.map((v) => ({ id: v.id, demandTitle: v.demandTitle })));
    } catch {
      setPendingVerifications([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      await loadPendingVerifications();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDemand = useMemo(
    () => demands.find((d) => d.id === selectedDemandId) ?? null,
    [demands, selectedDemandId],
  );

  const publicDemands = useMemo(() => {
    return demands.filter((d) => !PERSONAL_CATEGORIES.includes(d.category));
  }, [demands]);

  const displayStats = stats ?? computeStatsFromDemands(demands);
  const sortedPublic = useMemo(
    () => [...publicDemands].sort((a, b) => b.rankScore - a.rankScore),
    [publicDemands],
  );
  const myRecent = useMemo(() => [...demands].slice(0, 8), [demands]);

  const statusChip = (state: string) => {
    if (state === "resolved_verified") return "bg-green-100 text-green-700";
    if (state === "fix_claimed") return "bg-purple-100 text-purple-700";
    if (state === "in_progress" || state === "routed") return "bg-indigo-100 text-indigo-700";
    if (state === "reopened") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  const stateLabel = (state: string) => state.replace(/_/g, " ");

  const DemandCard = ({ demand, rank }: { demand: Demand; rank?: number }) => (
    <button
      type="button"
      onClick={() => selectDemand(demand.id)}
      className="w-full rounded-xl border border-outline-variant bg-white text-left shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-40 overflow-hidden rounded-t-xl bg-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={demandPhotoUrl(demand)}
          alt={demand.title}
          className="h-full w-full object-cover"
        />
        {rank != null && (
          <div className="absolute left-3 top-3 rounded-lg bg-tertiary px-2 py-1 text-[11px] font-bold text-white">
            Rank {String(rank).padStart(2, "0")}
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-on-surface">{demand.title}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusChip(demand.state)}`}>
            {stateLabel(demand.state)}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant">
          {demand.ward ?? "Ward unknown"} · {demand.category}
        </p>
        <div className="flex items-center justify-between border-t border-outline-variant pt-3 text-sm">
          <span className="text-on-surface-variant">{demand.affectedCount} affected</span>
          <span className="font-semibold text-primary">Score {demand.rankScore.toFixed(1)}</span>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface px-4 pb-24 pt-4 sm:px-6 lg:min-h-[calc(100dvh-4rem)]">
      {role === "citizen" && variant === "home" && (
        <>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-primary">Citizen Lens</h2>
            <p className="text-sm text-on-surface-variant">
              Public civic issues in Visakhapatnam. Tap a card for evidence and timeline.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              sortedPublic.map((d) => <DemandCard key={d.id} demand={d} />)
            )}
          </div>
        </>
      )}

      {role === "citizen" && variant === "issues" && (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-primary">My Activity</h2>
              <p className="text-sm text-on-surface-variant">Track your reports and pending verifications.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-outline-variant bg-white px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Reported</p>
                <p className="text-2xl font-bold text-primary">{demands.length}</p>
              </div>
              <div className="rounded-xl border border-outline-variant bg-white px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Resolved</p>
                <p className="text-2xl font-bold text-primary">
                  {demands.filter((d) => d.state === "resolved_verified").length}
                </p>
              </div>
            </div>
          </div>

          <section className="mb-6 space-y-3">
            <h3 className="text-lg font-semibold text-on-surface">Awaiting my verification</h3>
            {pendingVerifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
                No pending fix confirmations right now.
              </div>
            ) : (
              pendingVerifications.map((v) => (
                <div key={v.id} className="rounded-xl border border-outline-variant bg-white p-4">
                  <p className="font-semibold text-on-surface">{v.demandTitle}</p>
                  <p className="text-sm text-on-surface-variant">Please confirm if this issue was actually fixed.</p>
                </div>
              ))
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-on-surface">My reports</h3>
            {myRecent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
                No reports yet. Use Register tab to submit your first issue.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {myRecent.map((d) => (
                  <DemandCard key={d.id} demand={d} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {role === "mp" && variant === "home" && (
        <>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-tertiary">MP lens</p>
            <h2 className="text-3xl font-bold text-on-surface">Constituency priorities</h2>
            <p className="text-sm text-on-surface-variant">Ranked public demands by impact and urgency.</p>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              sortedPublic.map((d, i) => <DemandCard key={d.id} demand={d} rank={i + 1} />)
            )}
          </div>
        </>
      )}

      {role === "mp" && variant === "issues" && (
        <>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">Constituency command</h2>
            <p className="text-sm text-on-surface-variant">
              Live honesty metrics and demand trends across wards.
            </p>
          </div>
          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-outline-variant bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Total demands</p>
              <p className="text-3xl font-bold text-tertiary">{displayStats.totalDemands}</p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Citizens heard</p>
              <p className="text-3xl font-bold text-tertiary">{displayStats.citizensHeard}</p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Verified rate</p>
              <p className="text-3xl font-bold text-tertiary">
                {displayStats.verifiedResolutionRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Reopened</p>
              <p className="text-3xl font-bold text-tertiary">{displayStats.reopenedCount}</p>
            </div>
          </section>
          <section className="rounded-2xl border border-outline-variant bg-white p-5">
            <h3 className="text-lg font-semibold text-on-surface">Top priority list</h3>
            <div className="mt-4 space-y-3">
              {sortedPublic.slice(0, 6).map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDemand(d.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-outline-variant px-4 py-3 text-left hover:bg-surface-container-low"
                >
                  <div>
                    <p className="text-xs font-semibold text-tertiary">Rank {i + 1}</p>
                    <p className="font-semibold text-on-surface">{d.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {d.ward ?? "Ward unknown"} · {d.affectedCount} affected
                    </p>
                  </div>
                  <span className="font-bold text-tertiary">{d.rankScore.toFixed(1)}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {role === "official" && (
        <div className="rounded-xl border border-outline-variant bg-white p-4 text-sm text-on-surface-variant">
          Authority uses dedicated pages: Dashboard and Workspace.
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={mapHref}
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm"
        >
          Open map
        </Link>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void load();
            void loadPendingVerifications();
          }}
          disabled={refreshing}
          className="rounded-full border border-primary px-4 py-2 text-xs font-bold text-primary disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh data"}
        </button>
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

