"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthority } from "@/components/authority/AuthorityContext";
import { fetchAuthorityDemands } from "@/components/authority/api";
import {
  demandStateChipClass,
  demandStateLabel,
  sortByTriage,
  urgencyChipClass,
  urgencyLabel,
} from "@/components/civic/demandState";
import type { Demand } from "@/components/dashboard/types";
import { useApp } from "@/components/shell/AppProvider";

const t = {
  en: {
    dashboard: "Dashboard",
    workspace: "Workspace",
    routed: "Routed",
    inProgress: "In Progress",
    fixClaimed: "Fix Claimed",
    resolved: "Resolved",
    resolutionRate: "Resolution Rate",
    highPriority: "High Priority",
    viewAll: "View all",
    openWorkspace: "Open workspace",
    departmentMap: "Department map",
    noDemands: "No demands assigned to this department yet.",
    loading: "Loading department data…",
    pickDept: "Pick a department",
    pickDeptSub: "Choose your department to see scoped dashboard data.",
    goPick: "Choose department",
  },
  te: {
    dashboard: "డాష్‌బోర్డ్",
    workspace: "వర్క్‌స్పేస్",
    routed: "రూట్ చేయబడింది",
    inProgress: "ప్రగతిలో",
    fixClaimed: "సరిచేయబడింది",
    resolved: "పరిష్కరించబడింది",
    resolutionRate: "పరిష్కార రేటు",
    highPriority: "అత్యవసరం",
    viewAll: "అన్నీ చూడండి",
    openWorkspace: "వర్క్‌స్పేస్ తెరవండి",
    departmentMap: "డిపార్ట్‌మెంట్ మ్యాప్",
    noDemands: "ఈ డిపార్ట్‌మెంట్‌కు ఇంకా డిమాండ్లు లేవు.",
    loading: "డిపార్ట్‌మెంట్ డేటా లోడ్ అవుతోంది…",
    pickDept: "డిపార్ట్‌మెంట్ ఎంచుకోండి",
    pickDeptSub: "స్కోప్ చేసిన డాష్‌బోర్డ్ కోసం మీ డిపార్ట్‌మెంట్‌ను ఎంచుకోండి.",
    goPick: "డిపార్ట్‌మెంట్ ఎంచుకోండి",
  },
};

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-on-surface">{value}</p>
        </div>
        <span className={`material-symbols-outlined rounded-xl p-2 text-xl ${accent}`}>{icon}</span>
      </div>
    </div>
  );
}

export function AuthorityDashboard() {
  const router = useRouter();
  const { locale } = useApp();
  const { authority, authorityId, loading: authLoading } = useAuthority();
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

  const counts = useMemo(() => {
    const routed = demands.filter((d) => ["claimed", "validated_public", "routed"].includes(d.state)).length;
    const inProgress = demands.filter((d) => d.state === "in_progress").length;
    const fixClaimed = demands.filter((d) => d.state === "fix_claimed").length;
    const resolved = demands.filter((d) => d.state === "resolved_verified").length;
    const total = demands.length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { routed, inProgress, fixClaimed, resolved, total, resolutionRate };
  }, [demands]);

  const highPriority = useMemo(() => [...demands].sort(sortByTriage).slice(0, 4), [demands]);

  if (authLoading) {
    return <div className="p-6 text-sm text-slate-500">{copy.loading}</div>;
  }

  if (!authorityId || !authority) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <div className="rounded-3xl border border-outline-variant/60 bg-white p-8 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-authority-indigo">domain</span>
          <h2 className="mt-3 text-lg font-bold text-on-surface">{copy.pickDept}</h2>
          <p className="mt-2 text-sm text-on-surface-variant">{copy.pickDeptSub}</p>
          <Link
            href="/authority/pick"
            className="mt-5 inline-flex rounded-xl bg-authority-indigo px-5 py-2.5 text-sm font-semibold text-white"
          >
            {copy.goPick}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-safe-nav lg:pb-6">
      <div className="authority-gradient rounded-3xl p-5 text-white shadow-lg sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{copy.dashboard}</p>
        <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">{authority.name}</h1>
        <p className="mt-1 text-sm text-white/80">{authority.org} · {authority.level}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/authority/workspace"
            className="rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/25"
          >
            {copy.openWorkspace}
          </Link>
          <Link
            href="/authority/map"
            className="rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/25"
          >
            {copy.departmentMap}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">{copy.loading}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={copy.routed} value={counts.routed} icon="route" accent="bg-blue-50 text-blue-600" />
            <StatCard
              label={copy.inProgress}
              value={counts.inProgress}
              icon="pending_actions"
              accent="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              label={copy.fixClaimed}
              value={counts.fixClaimed}
              icon="task_alt"
              accent="bg-purple-50 text-purple-600"
            />
            <StatCard
              label={copy.resolved}
              value={counts.resolved}
              icon="verified"
              accent="bg-green-50 text-green-600"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant/60 bg-white p-5 shadow-sm lg:col-span-1">
              <p className="text-sm font-bold text-on-surface">{copy.resolutionRate}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-authority-indigo">{counts.resolutionRate}%</span>
                <span className="mb-1 text-xs text-on-surface-variant">of {counts.total}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-authority-indigo transition-all"
                  style={{ width: `${counts.resolutionRate}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5 lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-on-surface">{copy.highPriority}</h2>
                <Link href="/authority/workspace" className="text-xs font-semibold text-authority-indigo">
                  {copy.viewAll}
                </Link>
              </div>
              {highPriority.length === 0 ? (
                <p className="mt-4 text-sm text-on-surface-variant">{copy.noDemands}</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {highPriority.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => router.push(`/p/${d.id}`)}
                      className="flex w-full items-start gap-3 rounded-xl border border-outline-variant/50 bg-white p-3 text-left transition hover:border-authority-indigo/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-on-surface">{d.title}</p>
                        <p className="mt-0.5 truncate text-xs text-on-surface-variant">{d.ward ?? d.category}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${urgencyChipClass(d.urgency)}`}
                          >
                            {urgencyLabel(d.urgency)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${demandStateChipClass(d.state)}`}
                          >
                            {demandStateLabel(d.state)}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
