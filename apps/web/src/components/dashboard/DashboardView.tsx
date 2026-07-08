"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PERSONAL_CATEGORIES } from "@mpconnect/shared";
import { computeStatsFromDemands, fetchDemands, fetchStats } from "./api";
import { useDashboard } from "./DashboardContext";
import { DemandDrawer } from "./DemandDrawer";
import { DemandList } from "./DemandList";
import { shellT } from "@/components/shell/labels";
import type { Demand, Stats } from "./types";

type DashboardTab = "personal" | "public" | "all";

function urgencyRank(urgency: string) {
  if (urgency === "safety" || urgency === "high") return 0;
  if (urgency === "medium") return 1;
  return 2; // low / scheduled / other
}

function sortTriage(a: Demand, b: Demand) {
  const du = urgencyRank(a.urgency) - urgencyRank(b.urgency);
  if (du !== 0) return du;
  return b.rankScore - a.rankScore;
}

export function DashboardView({ variant = "home" }: { variant?: "home" | "issues" }) {
  const { role, locale, selectedDemandId, selectDemand } = useDashboard();
  const mapHref =
    role === "citizen" ? "/user/map" : role === "official" ? "/authority/map" : "/mp/map";

  const [demands, setDemands] = useState<Demand[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<DashboardTab>("personal");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (variant === "issues") setTab("personal");
  }, [variant]);

  const selectedDemand = useMemo(
    () => demands.find((d) => d.id === selectedDemandId) ?? null,
    [demands, selectedDemandId],
  );

  const isFeed = variant === "home";
  const isDashboard = variant === "issues";

  const personalDemands = useMemo(() => {
    return demands.filter((d) => PERSONAL_CATEGORIES.includes(d.category));
  }, [demands]);

  const publicDemands = useMemo(() => {
    // Public = any non-personal category. Personal categories (land/revenue,
    // pensions/welfare) are private matters and never appear in the public feed.
    return demands.filter((d) => !PERSONAL_CATEGORIES.includes(d.category));
  }, [demands]);

  const sortedPersonal = useMemo(() => [...personalDemands].sort(sortTriage), [personalDemands]);
  const sortedPublic = useMemo(() => [...publicDemands].sort(sortTriage), [publicDemands]);
  const sortedAll = useMemo(() => [...demands].sort(sortTriage), [demands]);

  const listDemands = useMemo(() => {
    if (isFeed) return sortedPublic;
    if (!isDashboard) return sortedPublic;
    if (tab === "personal") return sortedPersonal;
    if (tab === "public") return sortedPublic;
    return sortedAll;
  }, [isDashboard, isFeed, sortedAll, sortedPersonal, sortedPublic, tab]);

  const headerTitle = useMemo(() => {
    if (isFeed) return "Public issues feed";
    if (tab === "personal") return "Your personal issues";
    if (tab === "public") return "Public issues";
    return "All issues";
  }, [isFeed, tab]);

  const publicCount = publicDemands.length;
  const personalCount = personalDemands.length;
  const urgentPublicCount = publicDemands.filter((d) => d.urgency === "high" || d.urgency === "safety").length;

  const headerSubtitle = useMemo(() => {
    if (loading) return undefined;
    if (isFeed) return `${publicCount} public issues · ${urgentPublicCount} urgent`;
    if (tab === "personal") return `${personalCount} personal matters`;
    if (tab === "public") return `${publicCount} public issues`;
    return `${demands.length} total issues`;
  }, [demands.length, isFeed, loading, personalCount, publicCount, tab, urgentPublicCount]);

  const displayStats = stats ?? computeStatsFromDemands(demands);

  return (
    <div className="flex h-full min-h-[calc(100dvh-3.5rem)] flex-col lg:min-h-[calc(100dvh-4rem)]">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {isFeed ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                  {shellT("issues", locale)}
                </p>
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{headerTitle}</h1>
                <p className="mt-0.5 text-xs text-slate-500">Only public problems are shown, with photo thumbnails.</p>
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  {role === "citizen" ? "Citizen workspace" : "Authority workspace"}
                </p>
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{headerTitle}</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Personal vs public categories, plus an “All issues” view.
                </p>
              </>
            )}
          </div>
        </div>

        {isDashboard && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setTab("personal")}
              className={`rounded-full px-4 py-2 font-semibold ${
                tab === "personal" ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Personal ({loading ? "—" : personalCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("public")}
              className={`rounded-full px-4 py-2 font-semibold ${
                tab === "public" ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Public ({loading ? "—" : publicCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-full px-4 py-2 font-semibold ${
                tab === "all" ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              All ({loading ? "—" : demands.length})
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {role === "mp" && isFeed && (
            <Link
              href="/mp/feed"
              className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-primary shadow-sm"
            >
              📡 {shellT("liveFeed", locale)}
            </Link>
          )}

          <Link
            href={mapHref}
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        <DemandList
          demands={listDemands}
          loading={loading}
          locale={locale}
          selectedId={selectedDemandId}
          onSelect={selectDemand}
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
        />
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

