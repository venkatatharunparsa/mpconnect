"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthority } from "@/components/authority/AuthorityContext";
import { fetchAuthorityDemands } from "@/components/authority/api";
import {
  demandStateChipClass,
  demandStateLabel,
  urgencyChipClass,
  urgencyLabel,
} from "@/components/civic/demandState";
import type { Demand } from "@/components/dashboard/types";
import { useApp } from "@/components/shell/AppProvider";

const t = {
  en: {
    workspace: "Workspace",
    subtitle: "Action queue for your department",
    routed: "Routed",
    inProgress: "In Progress",
    fixClaimed: "Fix Claimed",
    empty: "No items",
    loading: "Loading queue…",
    pickDept: "Choose a department to open your workspace.",
    goPick: "Choose department",
  },
  te: {
    workspace: "వర్క్‌స్పేస్",
    subtitle: "మీ డిపార్ట్‌మెంట్ కోసం యాక్షన్ క్యూ",
    routed: "రూట్ చేయబడింది",
    inProgress: "ప్రగతిలో",
    fixClaimed: "సరిచేయబడింది",
    empty: "అంశాలు లేవు",
    loading: "క్యూ లోడ్ అవుతోంది…",
    pickDept: "వర్క్‌స్పేస్ తెరవడానికి డిపార్ట్‌మెంట్ ఎంచుకోండి.",
    goPick: "డిపార్ట్‌మెంట్ ఎంచుకోండి",
  },
};

function KanbanCard({ demand, onOpen }: { demand: Demand; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(demand.id)}
      className="w-full rounded-xl border border-outline-variant/60 bg-white p-3 text-left shadow-sm transition hover:border-authority-indigo/40 hover:shadow-md"
    >
      <p className="line-clamp-2 text-sm font-semibold text-on-surface">{demand.title}</p>
      <p className="mt-1 truncate text-[11px] text-on-surface-variant">{demand.ward ?? demand.category}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${urgencyChipClass(demand.urgency)}`}>
          {urgencyLabel(demand.urgency)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${demandStateChipClass(demand.state)}`}
        >
          {demandStateLabel(demand.state)}
        </span>
      </div>
      {demand.affectedCount > 0 && (
        <p className="mt-2 text-[10px] font-medium text-on-surface-variant">
          {demand.affectedCount} affected
        </p>
      )}
    </button>
  );
}

function KanbanColumn({
  title,
  count,
  items,
  accent,
  onOpen,
  emptyLabel,
}: {
  title: string;
  count: number;
  items: Demand[];
  accent: string;
  onOpen: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-2xl border border-outline-variant/50 bg-surface-container-low p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          <h3 className="text-sm font-bold text-on-surface">{title}</h3>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">{count}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {items.length === 0 ? (
          <p className="py-8 text-center text-xs text-on-surface-variant">{emptyLabel}</p>
        ) : (
          items.map((d) => <KanbanCard key={d.id} demand={d} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}

export function AuthorityWorkspace() {
  const router = useRouter();
  const { locale } = useApp();
  const { authority, authorityId } = useAuthority();
  const copy = locale === "te" ? t.te : t.en;

  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!authority) {
      setDemands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchAuthorityDemands(authority);
    setDemands(data);
    setLoading(false);
  }, [authority]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(() => {
    const routed = demands.filter((d) => ["claimed", "validated_public", "routed"].includes(d.state));
    const inProgress = demands.filter((d) => d.state === "in_progress");
    const fixClaimed = demands.filter((d) => d.state === "fix_claimed");
    return { routed, inProgress, fixClaimed };
  }, [demands]);

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

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 pb-safe-nav lg:pb-6">
      <div>
        <h1 className="text-xl font-extrabold text-on-surface">{copy.workspace}</h1>
        <p className="text-sm text-on-surface-variant">
          {copy.subtitle} · {authority.name}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">{copy.loading}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <KanbanColumn
            title={copy.routed}
            count={columns.routed.length}
            items={columns.routed}
            accent="bg-blue-500"
            onOpen={(id) => router.push(`/p/${id}`)}
            emptyLabel={copy.empty}
          />
          <KanbanColumn
            title={copy.inProgress}
            count={columns.inProgress.length}
            items={columns.inProgress}
            accent="bg-indigo-500"
            onOpen={(id) => router.push(`/p/${id}`)}
            emptyLabel={copy.empty}
          />
          <KanbanColumn
            title={copy.fixClaimed}
            count={columns.fixClaimed.length}
            items={columns.fixClaimed}
            accent="bg-purple-500"
            onOpen={(id) => router.push(`/p/${id}`)}
            emptyLabel={copy.empty}
          />
        </div>
      )}
    </div>
  );
}
