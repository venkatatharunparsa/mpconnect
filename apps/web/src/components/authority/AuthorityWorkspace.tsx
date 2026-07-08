"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthority } from "./AuthorityContext";
import { fetchDemands } from "@/components/dashboard/api";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { DemandDrawer } from "@/components/dashboard/DemandDrawer";
import { DemandList } from "@/components/dashboard/DemandList";
import type { Demand } from "@/components/dashboard/types";

function urgencyRank(urgency: string) {
  if (urgency === "safety" || urgency === "high") return 0;
  if (urgency === "medium") return 1;
  return 2;
}

function sortTriage(a: Demand, b: Demand) {
  const du = urgencyRank(a.urgency) - urgencyRank(b.urgency);
  if (du !== 0) return du;
  return b.rankScore - a.rankScore;
}

export function AuthorityWorkspace() {
  const { authority, demandMatchesAuthority } = useAuthority();
  const { locale, selectedDemandId, selectDemand } = useDashboard();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await fetchDemands();
    setDemands(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authority?.id]);

  const myDemands = useMemo(
    () => demands.filter(demandMatchesAuthority).sort(sortTriage),
    [demands, demandMatchesAuthority],
  );

  const selectedDemand = useMemo(
    () => myDemands.find((d) => d.id === selectedDemandId) ?? null,
    [myDemands, selectedDemandId],
  );

  const actionNeeded = myDemands.filter((d) =>
    ["claimed", "validated_public", "routed", "in_progress"].includes(d.state),
  ).length;

  return (
    <div className="flex h-full min-h-[calc(100dvh-3.5rem)] flex-col lg:min-h-[calc(100dvh-4rem)]">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Execution workspace</p>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Your allotted issues</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {authority?.name} — accept, update status, or mark work done with evidence.
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
            disabled={refreshing}
            className="rounded-full border border-primary px-4 py-2 text-xs font-bold text-primary disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh queue"}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <DemandList
          demands={myDemands}
          loading={loading}
          locale={locale}
          selectedId={selectedDemandId}
          onSelect={selectDemand}
          headerTitle="Action queue"
          headerSubtitle={
            loading ? undefined : `${myDemands.length} assigned · ${actionNeeded} need action`
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
