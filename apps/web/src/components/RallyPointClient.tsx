"use client";

import { apiFetch } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getDemoCitizenKey } from "./citizenIdentity";
import {
  extractDemand,
  extractTimeline,
  fetchDemandDetail,
} from "./demandApi";
import { StateBadge } from "./dashboard/StateBadge";
import { Timeline } from "./Timeline";
import { PriorityScoreMatrix } from "./ui/PriorityScoreMatrix";
import { useApp } from "./shell/AppProvider";
import { shellT } from "./shell/labels";
import type { Demand } from "./dashboard/types";

interface RallyPointClientProps {
  demandId: string;
  isPersonal: boolean;
}

export function RallyPointClient({ demandId, isPersonal }: RallyPointClientProps) {
  const { locale } = useApp();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [affectedCount, setAffectedCount] = useState(0);
  const [supporting, setSupporting] = useState(false);
  const [supportMsg, setSupportMsg] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState(
    [] as ReturnType<typeof extractTimeline>,
  );

  useEffect(() => {
    if (isPersonal) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchDemandDetail(demandId);
      if (cancelled) return;
      const d = extractDemand(data);
      if (!d) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setDemand(d);
      setAffectedCount(d.affectedCount);
      setTimelineEvents(extractTimeline(data));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [demandId, isPersonal]);

  const handleAffectedToo = useCallback(async () => {
    if (!demand || supporting) return;
    setSupporting(true);
    setSupportMsg(null);

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 60000,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      setSupportMsg("Location permission needed to verify you're in the area.");
      setSupporting(false);
      return;
    }

    const citizenKey = getDemoCitizenKey();
    const body = {
      channel: "web",
      citizenKey,
      demandId: demand.id,
      category: demand.category,
      kind: demand.kind,
      lat,
      lng,
      supportMarker: true,
    };

    try {
      const res = await apiFetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAffectedCount((c) => c + 1);
        setSupportMsg("You're counted. Thank you for standing with your neighbours.");
      } else {
        setAffectedCount((c) => c + 1);
        setSupportMsg("Counted locally (API pending) — your support is noted.");
      }
    } catch {
      setAffectedCount((c) => c + 1);
      setSupportMsg("Counted locally (API pending) — your support is noted.");
    }
    setSupporting(false);
  }, [demand, supporting]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  if (isPersonal) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="text-xl font-bold text-slate-900">This is a personal matter</h1>
        <p className="mt-2 text-slate-600">
          This demand involves a personal category and is not shown publicly. Check your reference
          ID for status.
        </p>
        <Link href="/submit" className="mt-4 inline-block text-sm font-semibold text-primary">
          {shellT("checkRefId", locale)}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 px-4 py-6">
        <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded-card bg-slate-100" />
        <div className="h-48 animate-pulse rounded-card bg-slate-100" />
      </div>
    );
  }

  if (notFound || !demand) {
    return (
      <div className="px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Demand not found</h1>
        <p className="mt-2 text-slate-600">
          This priority doesn&apos;t exist yet, or data hasn&apos;t loaded. Try{" "}
          <code className="text-sm">pnpm seed</code> on the API.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block font-semibold text-primary">
          {shellT("viewPriorities", locale)}
        </Link>
      </div>
    );
  }

  const isUrgent = demand.urgency === "high" || demand.urgency === "safety";

  return (
    <article className="py-4 pb-8 sm:py-6 lg:py-8">
      <div className="lg:grid lg:grid-cols-5 lg:gap-8 xl:gap-10">
        <div className="lg:col-span-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
              {demand.category}
            </span>
            {isUrgent && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold uppercase text-red-700">
                ! {locale === "te" ? "అత్యవసరం" : "Urgent"}
              </span>
            )}
            <StateBadge state={demand.state} />
          </div>

          <h1 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {demand.title}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["MS", "AK", "+"].map((initial, i) => (
                <span
                  key={initial}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold ${
                    i === 2 ? "bg-slate-200 text-slate-600" : "bg-primary text-white"
                  }`}
                >
                  {initial}
                </span>
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-600 sm:text-base">
              {affectedCount.toLocaleString()} {shellT("citizensReported", locale)}
            </p>
          </div>

          <section className="mt-5 rounded-card border border-slate-100 bg-white p-4 shadow-card sm:p-5">
            <h2 className="text-sm font-bold text-slate-900">{shellT("theIssue", locale)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {demand.ward
                ? `${demand.title} — reported across ${demand.ward} ward in the Visakhapatnam Lok Sabha constituency.`
                : `${demand.title} — a consolidated demand from citizen submissions in Visakhapatnam.`}
            </p>
            {demand.updatedAt && (
              <p className="mt-3 text-xs text-primary">
                🕐 {locale === "te" ? "చివరి నివేదిక" : "Last reported"}{" "}
                {new Date(demand.updatedAt).toLocaleDateString()}
              </p>
            )}
          </section>

          <section className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-slate-900 sm:text-base">
              {locale === "te" ? "కాలక్రమం" : "What happened"}
            </h2>
            <Timeline demandId={demandId} events={timelineEvents} publicSafe />
          </section>
        </div>

        <div className="mt-6 space-y-4 lg:col-span-2 lg:mt-0">
          <PriorityScoreMatrix
            score={demand.rankScore}
            breakdown={demand.rankBreakdown}
            title={shellT("priorityMatrix", locale)}
          />

          {demand.ward && (
            <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card sm:p-5">
              <h2 className="text-sm font-bold">{shellT("affectedArea", locale)}</h2>
              <p className="mt-1 text-sm text-slate-600">{demand.ward} ward</p>
              <Link
                href="/map"
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-primary"
              >
                📍 {shellT("openMap", locale)}
              </Link>
            </section>
          )}

          <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card sm:p-5">
            <button
              type="button"
              onClick={handleAffectedToo}
              disabled={supporting}
              className="w-full rounded-full bg-accent py-3.5 text-base font-bold text-white shadow-fab transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {supporting ? "…" : shellT("imAffectedToo", locale)}
            </button>
            {supportMsg && <p className="mt-3 text-center text-sm text-slate-600">{supportMsg}</p>}
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Geo-verified support — no comment box, by design.
            </p>
          </section>

          <section className="rounded-card border border-slate-100 bg-slate-50 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-slate-800">{shellT("getUpdates", locale)}</h2>
            {subscribed ? (
              <p className="mt-2 text-sm text-state-resolved">Subscribed! (demo)</p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white sm:shrink-0"
                >
                  OK
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}
