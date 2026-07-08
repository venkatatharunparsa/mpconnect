"use client";

import { useEffect, useMemo, useState } from "react";
import { computeStatsFromDemands, fetchDemands, fetchStats, fetchWards } from "./api";
import { useDashboard } from "./DashboardContext";
import { DemandDrawer } from "./DemandDrawer";
import { DemandList } from "./DemandList";
import { DemandMap } from "./DemandMap";
import { LocaleToggle, RoleSwitcher } from "./RoleSwitcher";
import { StatsStrip } from "./StatsStrip";
import { t } from "./labels";
import type { Demand, Stats, Ward } from "./types";

export function DashboardView() {
  const { role, locale, selectedDemandId, selectDemand } = useDashboard();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsAvailable, setWardsAvailable] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [demandsData, wardsResult, statsData] = await Promise.all([
        fetchDemands(),
        fetchWards(),
        fetchStats(),
      ]);
      if (cancelled) return;
      setDemands(demandsData);
      setWards(wardsResult.wards);
      setWardsAvailable(wardsResult.available);
      setStats(statsData ?? computeStatsFromDemands(demandsData));
      setLoading(false);
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

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="text-lg font-bold text-primary">{t("dashboardTitle", locale)}</h1>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <RoleSwitcher />
        </div>
      </header>

      <StatsStrip stats={displayStats} loading={loading} locale={locale} />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="min-h-[280px] border-b border-slate-200 lg:min-h-0 lg:border-b-0 lg:border-r">
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
        <div className="min-h-[320px] lg:min-h-0">
          <DemandList
            demands={demands}
            loading={loading}
            locale={locale}
            selectedId={selectedDemandId}
            onSelect={selectDemand}
          />
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
