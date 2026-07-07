"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeStatsFromDemands, fetchDemands } from "@/components/dashboard/api";
import type { Demand } from "@/components/dashboard/types";
import { useApp } from "@/components/shell/AppProvider";
import { IconDroplet, IconMegaphone } from "@/components/shell/icons";
import { shellT } from "@/components/shell/labels";
import { loadRecentSubmissions, type RecentSubmission } from "@/lib/recent-submissions";

const CATEGORY_EMOJI: Record<string, string> = {
  water: "💧",
  roads: "🛣️",
  sanitation: "🗑️",
  lighting: "💡",
  health: "🏥",
  education: "📚",
};

function categoryEmoji(category: string) {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "📋";
}

function timeAgo(iso: string, locale: "en" | "te") {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return locale === "te" ? "ఇప్పుడే" : "Just now";
  if (hours < 24) return locale === "te" ? `${hours} గంటల క్రితం` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "te" ? `${days} రోజుల క్రితం` : `${days}d ago`;
}

function statusLabel(status: RecentSubmission["status"], locale: "en" | "te") {
  if (status === "processing") return shellT("statusProcessing", locale);
  if (status === "clustered") return shellT("statusClustered", locale);
  return shellT("statusSubmitted", locale);
}

function statusClass(status: RecentSubmission["status"]) {
  if (status === "processing") return "bg-primary/10 text-primary";
  if (status === "clustered") return "bg-accent/10 text-accent-dark";
  return "bg-emerald-50 text-emerald-700";
}

function TrendingCard({
  demand,
  idx,
  locale,
}: {
  demand: Demand;
  idx: number;
  locale: "en" | "te";
}) {
  return (
    <Link
      href={`/p/${demand.id}`}
      className="block rounded-card border border-slate-100 bg-white p-4 shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
        #{idx + 1} · {demand.affectedCount} {shellT("peopleReported", locale)}
      </p>
      <p className="mt-2 line-clamp-2 font-bold leading-snug text-slate-900">{demand.title}</p>
      <p className="mt-2 text-xs capitalize text-slate-500">{demand.category}</p>
    </Link>
  );
}

export function CitizenHome() {
  const { locale } = useApp();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRecent(loadRecentSubmissions());
    let cancelled = false;
    (async () => {
      const data = await fetchDemands();
      if (!cancelled) {
        setDemands(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => computeStatsFromDemands(demands), [demands]);
  const trending = useMemo(
    () => [...demands].sort((a, b) => b.affectedCount - a.affectedCount).slice(0, 6),
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

  const pendingCount = recent.filter((r) => r.status !== "clustered").length;

  return (
    <div className="py-5 sm:py-6 lg:py-8">
      <header className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary/70">
          {shellT("constituency", locale)}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {shellT("welcome", locale)} 👋
        </h1>
      </header>

      {/* Step 1: Report */}
      <section className="relative overflow-hidden rounded-card bg-primary p-5 text-white shadow-card sm:p-6">
        <div className="pointer-events-none absolute -right-4 -top-4 opacity-10">
          <IconMegaphone className="h-28 w-28 sm:h-36 sm:w-36" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
          {locale === "te" ? "మొదటి అడుగు" : "Step 1"}
        </p>
        <h2 className="relative mt-1 text-lg font-bold sm:text-xl">{shellT("shareNeeds", locale)}</h2>
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-white/85">
          {shellT("voiceHint", locale)}
        </p>
        <Link
          href="/submit"
          className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-fab transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="text-lg">🎙</span>
          {shellT("startNow", locale)}
        </Link>
      </section>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-card border border-slate-100 bg-white p-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {shellT("submissions", locale)}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900">
            {loading ? "—" : stats.citizensHeard.toLocaleString()}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
        </div>
        <div className="rounded-card border border-slate-100 bg-white p-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {shellT("pending", locale)}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900">
            {String(pendingCount).padStart(2, "0")}
          </p>
          {pendingCount > 0 && (
            <p className="mt-1 text-[10px] font-bold uppercase text-state-reopened">
              {shellT("actionRequired", locale)}
            </p>
          )}
        </div>
      </div>

      <Link
        href="/map"
        className="mt-3 flex items-center gap-3 rounded-card bg-primary/10 px-4 py-3 transition-colors hover:bg-primary/15"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-lg">
          <IconDroplet />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary/70">
            {shellT("topCategory", locale)}
          </p>
          <p className="font-bold capitalize text-slate-800">{topCategory}</p>
        </div>
        <span className="text-xs font-semibold text-primary">{shellT("map", locale)} →</span>
      </Link>

      {/* Step 2: Your reports */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{shellT("yourRecent", locale)}</h2>
          <Link href="/submit" className="text-xs font-semibold text-primary">
            {shellT("checkRefId", locale)}
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-card border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-card">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <IconMegaphone className="h-7 w-7" />
            </div>
            <p className="mt-3 font-semibold text-slate-800">{shellT("noReports", locale)}</p>
            <p className="mt-1 text-sm text-slate-500">{shellT("noReportsHint", locale)}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.slice(0, 5).map((item) => (
              <li
                key={item.refId}
                className="flex items-center gap-3 rounded-card border border-slate-100 bg-white p-3 shadow-card"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                  {categoryEmoji(item.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {timeAgo(item.at, locale)} · {item.category}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(item.status)}`}
                >
                  {statusLabel(item.status, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Step 3: Community priorities */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{shellT("trending", locale)}</h2>
          <Link href="/dashboard" className="text-xs font-semibold text-primary">
            {shellT("viewAll", locale)}
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-card bg-slate-200/60" />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="rounded-card bg-white p-4 text-sm text-slate-500 shadow-card">
            {locale === "te"
              ? "డిమాండ్లు లోడ్ అయిన తర్వాత ఇక్కడ కనిపిస్తాయి."
              : "Community priorities appear here once data is loaded."}
          </p>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
            {trending.map((d, idx) => (
              <div key={d.id} className="w-[min(85vw,280px)] shrink-0 sm:w-auto">
                <TrendingCard demand={d} idx={idx} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
