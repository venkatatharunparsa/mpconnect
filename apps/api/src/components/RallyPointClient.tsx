"use client";

import { useCallback, useEffect, useState } from "react";
import { getDemoCitizenKey } from "./citizenIdentity";
import {
  extractDemand,
  extractTimeline,
  fetchDemandDetail,
} from "./demandApi";
import { StateBadge } from "./dashboard/StateBadge";
import { Timeline } from "./Timeline";
import type { Demand } from "./dashboard/types";

interface RallyPointClientProps {
  demandId: string;
  isPersonal: boolean;
}

export function RallyPointClient({ demandId, isPersonal }: RallyPointClientProps) {
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
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAffectedCount((c) => c + 1);
        setSupportMsg("You're counted. Thank you for standing with your neighbours.");
      } else {
        // TODO: wire POST /api/submissions — optimistic local count until A ships API
        setAffectedCount((c) => c + 1);
        setSupportMsg("Counted locally (API pending) — your support is noted.");
      }
    } catch {
      // TODO: wire POST /api/submissions
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
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="text-xl font-bold text-slate-900">This is a personal matter</h1>
        <p className="mt-2 text-slate-600">
          This demand involves a personal category (land records, pensions, or welfare) and is
          not shown publicly. If this is your submission, check your reference ID for status.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <div className="h-10 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded bg-slate-100" />
        <div className="h-48 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (notFound || !demand) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Demand not found</h1>
        <p className="mt-2 text-slate-600">
          This rally point doesn&apos;t exist yet, or the platform API hasn&apos;t loaded seeded
          data. Check the link or try again after <code className="text-sm">pnpm seed</code>.
        </p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-2xl py-6">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <StateBadge state={demand.state} />
          {demand.ward && (
            <span className="text-sm font-medium text-slate-600">{demand.ward} ward</span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
          {demand.title}
        </h1>
        <p className="mt-4 text-5xl font-extrabold tabular-nums text-primary sm:text-6xl">
          {affectedCount.toLocaleString()}
        </p>
        <p className="text-lg font-medium text-slate-600">citizens affected</p>
      </header>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
        <button
          type="button"
          onClick={handleAffectedToo}
          disabled={supporting}
          className="w-full rounded-lg bg-primary py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {supporting ? "Verifying location…" : "I'm affected too"}
        </button>
        {supportMsg && (
          <p className="mt-3 text-center text-sm text-slate-600">{supportMsg}</p>
        )}
        <p className="mt-2 text-center text-xs text-slate-400">
          Geo-verified support — no comment box, by design.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">What happened</h2>
        <Timeline demandId={demandId} events={timelineEvents} publicSafe />
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Get updates</h2>
        {subscribed ? (
          <p className="mt-2 text-sm text-state-resolved">Subscribed! (demo — nothing stored)</p>
        ) : (
          <form onSubmit={handleSubscribe} className="mt-2 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white"
            >
              Subscribe
            </button>
          </form>
        )}
      </section>
    </article>
  );
}
