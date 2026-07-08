"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PERSONAL_CATEGORIES } from "@mpconnect/shared";
import { useAuthority } from "./AuthorityContext";
import { fetchDemands } from "@/components/dashboard/api";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { DemandDrawer } from "@/components/dashboard/DemandDrawer";
import { DemandList } from "@/components/dashboard/DemandList";
import type { Demand } from "@/components/dashboard/types";

export function AuthorityDashboard() {
  const { authority, demandMatchesAuthority } = useAuthority();
  const { locale, selectedDemandId, selectDemand } = useDashboard();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchDemands();
      if (!cancelled) {
        setDemands(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authority?.id]);

  const myDemands = useMemo(
    () => demands.filter(demandMatchesAuthority),
    [demands, demandMatchesAuthority],
  );

  const publicAssigned = useMemo(
    () => myDemands.filter((d) => !PERSONAL_CATEGORIES.includes(d.category)),
    [myDemands],
  );

  const solved = myDemands.filter((d) => d.state === "resolved_verified").length;
  const inProgress = myDemands.filter((d) =>
    ["routed", "in_progress", "fix_claimed"].includes(d.state),
  ).length;
  const pending = myDemands.filter((d) => ["claimed", "validated_public"].includes(d.state)).length;

  const selectedDemand = useMemo(
    () => myDemands.find((d) => d.id === selectedDemandId) ?? null,
    [myDemands, selectedDemandId],
  );

  const preview = useMemo(
    () => [...publicAssigned].sort((a, b) => b.rankScore - a.rankScore).slice(0, 5),
    [publicAssigned],
  );

  return (
    <div className="flex h-full min-h-[calc(100dvh-3.5rem)] flex-col lg:min-h-[calc(100dvh-4rem)]">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Authority dashboard</p>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{authority?.name ?? "Your office"}</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {authority?.org} · issues in your category jurisdiction
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Assigned", value: myDemands.length },
            { label: "Pending", value: pending },
            { label: "In progress", value: inProgress },
            { label: "Solved", value: solved },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className="mt-1 text-xl font-extrabold text-primary">{loading ? "—" : s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/authority/workspace"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm"
          >
            Open workspace
          </Link>
          <Link
            href="/authority/map"
            className="rounded-full border border-primary px-4 py-2 text-xs font-bold text-primary"
          >
            View on map
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <DemandList
          demands={preview}
          loading={loading}
          locale={locale}
          selectedId={selectedDemandId}
          onSelect={selectDemand}
          headerTitle="Current issues in your patch"
          headerSubtitle={
            loading ? undefined : `${publicAssigned.length} public · ${myDemands.length} total assigned`
          }
        />
      </div>

      <DemandDrawer
        demand={selectedDemand}
        open={selectedDemandId != null}
        onClose={() => selectDemand(null)}
        role="official"
        locale={locale}
      />
    </div>
  );
}
