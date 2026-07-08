"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { computeStatsFromDemands, fetchDemands, fetchWards } from "./api";
import { DemandMap } from "./DemandMap";
import type { Demand, Ward } from "./types";
import { useApp } from "@/components/shell/AppProvider";
import { shellT } from "@/components/shell/labels";

export function MapView() {
  const router = useRouter();
  const { locale } = useApp();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsAvailable, setWardsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [demandsData, wardsResult] = await Promise.all([fetchDemands(), fetchWards()]);
    setDemands(demandsData);
    setWards(wardsResult.wards);
    setWardsAvailable(wardsResult.available);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = computeStatsFromDemands(demands);
  const onMap = demands.filter((d) => d.lat != null && d.lng != null).length;

  return (
    <div className="relative h-[calc(100dvh-3.5rem-4rem)] min-h-[400px] w-full lg:h-[calc(100dvh-4rem)]">
      <DemandMap
        demands={demands}
        wards={wards}
        wardsAvailable={wardsAvailable}
        loading={loading}
        locale={locale}
        selectedId={null}
        onSelect={(id) => router.push(`/p/${id}`)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur-md">
          <h1 className="text-base font-bold text-slate-900">{shellT("hotspotMap", locale)}</h1>
          <p className="mt-0.5 text-xs text-slate-500">{shellT("constituencyShort", locale)}</p>
          {!loading && (
            <p className="mt-2 text-[11px] font-medium text-slate-500">
              {onMap} {shellT("reports", locale)} on map · {stats.totalDemands}{" "}
              {locale === "te" ? "ప్రాధాన్యతలు" : "priorities"} total
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            {locale === "te"
              ? "పిన్ నొక్కండి — వివరాలు చూడండి"
              : "Tap a pin to open the priority detail"}
          </p>
        </div>
      </div>
    </div>
  );
}
