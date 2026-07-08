"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuthority } from "@/components/authority/AuthorityContext";
import { fetchAuthorityDemands } from "@/components/authority/api";
import { DemandMap } from "@/components/dashboard/DemandMap";
import { fetchWards } from "@/components/dashboard/api";
import type { Demand, Ward } from "@/components/dashboard/types";
import { useApp } from "@/components/shell/AppProvider";

const t = {
  en: {
    title: "Department map",
    subtitle: "Issues scoped to your department",
    loading: "Loading map…",
    pickDept: "Choose a department to see scoped map pins.",
    goPick: "Choose department",
    onMap: "on map",
    total: "department priorities",
  },
  te: {
    title: "డిపార్ట్‌మెంట్ మ్యాప్",
    subtitle: "మీ డిపార్ట్‌మెంట్‌కు పరిమితం చేసిన సమస్యలు",
    loading: "మ్యాప్ లోడ్ అవుతోంది…",
    pickDept: "స్కోప్ చేసిన మ్యాప్ పిన్లు చూడడానికి డిపార్ట్‌మెంట్ ఎంచుకోండి.",
    goPick: "డిపార్ట్‌మెంట్ ఎంచుకోండి",
    onMap: "మ్యాప్‌పై",
    total: "డిపార్ట్‌మెంట్ ప్రాధాన్యతలు",
  },
};

export function AuthorityMapView() {
  const router = useRouter();
  const { locale } = useApp();
  const { authority, authorityId } = useAuthority();
  const copy = locale === "te" ? t.te : t.en;

  const [demands, setDemands] = useState<Demand[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsAvailable, setWardsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!authority) {
      setDemands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [demandsData, wardsResult] = await Promise.all([
      fetchAuthorityDemands(authority),
      fetchWards(),
    ]);
    setDemands(demandsData);
    setWards(wardsResult.wards);
    setWardsAvailable(wardsResult.available);
    setLoading(false);
  }, [authority]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!authorityId || !authority) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="text-sm text-on-surface-variant">{copy.pickDept}</p>
        <button
          type="button"
          onClick={() => router.push("/authority/pick")}
          className="mt-4 rounded-xl bg-authority-indigo px-5 py-2.5 text-sm font-semibold text-white"
        >
          {copy.goPick}
        </button>
      </div>
    );
  }

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
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-outline-variant/60 bg-white/95 p-4 shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-authority-indigo">{authority.name}</p>
          <h1 className="text-base font-bold text-on-surface">{copy.title}</h1>
          <p className="mt-0.5 text-xs text-on-surface-variant">{copy.subtitle}</p>
          {!loading && (
            <p className="mt-2 text-[11px] font-medium text-on-surface-variant">
              {onMap} {copy.onMap} · {demands.length} {copy.total}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
