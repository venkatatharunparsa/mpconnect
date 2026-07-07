"use client";

import { useEffect, useState } from "react";
import { Timeline } from "@/components/Timeline";
import { StateBadge } from "./StateBadge";
import { t } from "./labels";
import type { Demand, DemoRole, EvidenceResponse, MpladsPack, UiLocale } from "./types";

type DrawerTab = "timeline" | "evidence" | "mplads";

interface DemandDrawerProps {
  demand: Demand | null;
  open: boolean;
  onClose: () => void;
  role: DemoRole;
  locale: UiLocale;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function endpointExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "OPTIONS" });
    return res.status !== 404;
  } catch {
    return false;
  }
}

function EvidenceTab({ demandId }: { demandId: string }) {
  const [data, setData] = useState<EvidenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // TODO: confirm shape with A — GET /api/demands/[id]/evidence
      const res = await fetchJson<EvidenceResponse>(`/api/demands/${demandId}/evidence`);
      if (!cancelled) {
        setAvailable(res != null);
        setData(res);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demandId]);

  if (loading) {
    return <div className="h-24 animate-pulse rounded bg-slate-100" />;
  }

  if (!available || !data?.rows?.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Evidence panel — waiting on GET /api/demands/[id]/evidence
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-slate-500">
            <th className="pb-2">Metric</th>
            <th className="pb-2">Value</th>
            <th className="pb-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.metric} className="border-b border-slate-100">
              <td className="py-2">{row.metric}</td>
              <td className="py-2 tabular-nums">
                {row.value}
                {row.estimated && (
                  <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">
                    est.
                  </span>
                )}
              </td>
              <td className="py-2">
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {row.source}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.narrative && (
        <p className="text-sm leading-relaxed text-slate-700">{data.narrative}</p>
      )}
    </div>
  );
}

function MpladsTab({ demandId }: { demandId: string }) {
  const [pack, setPack] = useState<MpladsPack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // TODO: confirm shape with A — GET /api/demands/[id]/mplads-pack
      const res = await fetchJson<MpladsPack>(`/api/demands/${demandId}/mplads-pack`);
      if (!cancelled) {
        setPack(res);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demandId]);

  if (loading) {
    return <div className="h-24 animate-pulse rounded bg-slate-100" />;
  }

  if (!pack) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        MPLADS pack — waiting on GET /api/demands/[id]/mplads-pack
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-4">
      {pack.watermark && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl font-bold text-slate-100 rotate-[-12deg]">
          {pack.watermark}
        </div>
      )}
      <h4 className="font-semibold">{pack.title ?? "MPLADS recommendation"}</h4>
      {pack.description && <p className="mt-2 text-sm text-slate-600">{pack.description}</p>}
      {pack.beneficiaries != null && (
        <p className="mt-2 text-sm">
          Beneficiaries: <strong>{pack.beneficiaries.toLocaleString()}</strong>
        </p>
      )}
      {pack.costBand && (
        <p className="text-sm">
          Cost band: <strong>{pack.costBand}</strong>
        </p>
      )}
      {pack.clocks && pack.clocks.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {pack.clocks.map((c) => (
            <li key={c.label}>
              {c.label}: <strong>{c.days} days</strong> (statutory)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OfficialActions({
  demandId,
  state,
  locale,
}: {
  demandId: string;
  state: string;
  locale: UiLocale;
}) {
  const [fixClaimApi, setFixClaimApi] = useState(false);
  const [routeApi, setRouteApi] = useState(false);

  useEffect(() => {
    endpointExists(`/api/demands/${demandId}/fix-claim`).then(setFixClaimApi);
    endpointExists(`/api/demands/${demandId}/route-approve`).then(setRouteApi);
  }, [demandId]);

  const showRouting = ["claimed", "validated_public", "routed"].includes(state);
  const showFixClaim = ["routed", "in_progress", "fix_claimed"].includes(state);

  if (!showRouting && !showFixClaim) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
      {showFixClaim && (
        <button
          type="button"
          disabled={!fixClaimApi}
          title={!fixClaimApi ? t("waitingApi", locale) : undefined}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("markWorkDone", locale)}
        </button>
      )}
      {showRouting && (
        <button
          type="button"
          disabled={!routeApi}
          title={!routeApi ? t("waitingApi", locale) : undefined}
          className="rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("approveRouting", locale)}
        </button>
      )}
    </div>
  );
}

export function DemandDrawer({ demand, open, onClose, role, locale }: DemandDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("timeline");

  useEffect(() => {
    if (demand) setTab("timeline");
  }, [demand?.id]);

  if (!open || !demand) return null;

  const tabs: { id: DrawerTab; label: string }[] = [
    { id: "timeline", label: t("timeline", locale) },
    { id: "evidence", label: t("evidence", locale) },
    { id: "mplads", label: t("mplads", locale) },
  ];

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl sm:top-14 sm:h-[calc(100%-3.5rem)]">
        <div className="flex items-start justify-between border-b border-slate-200 p-4">
          <div className="min-w-0 pr-4">
            <h2 className="text-lg font-bold leading-snug text-slate-900">{demand.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StateBadge state={demand.state} />
              {demand.ward && (
                <span className="text-sm text-slate-600">
                  {t("ward", locale)}: {demand.ward}
                </span>
              )}
            </div>
            <p className="mt-2 text-lg font-bold text-primary">
              {t("affects", locale)} {demand.affectedCount.toLocaleString()}{" "}
              {t("citizens", locale)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-slate-200 px-4">
          <div className="flex gap-4">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`border-b-2 py-2 text-sm font-medium transition-colors ${
                  tab === tb.id
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-slate-500">{t("category", locale)}</dt>
              <dd className="font-medium">{demand.category}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("urgency", locale)}</dt>
              <dd className="font-medium capitalize">{demand.urgency}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("score", locale)}</dt>
              <dd className="font-medium tabular-nums">{demand.rankScore.toFixed(1)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("state", locale)}</dt>
              <dd className="font-medium capitalize">{demand.state.replace(/_/g, " ")}</dd>
            </div>
          </dl>

          {tab === "timeline" && <Timeline demandId={demand.id} />}
          {tab === "evidence" && <EvidenceTab demandId={demand.id} />}
          {tab === "mplads" && <MpladsTab demandId={demand.id} />}

          {role === "official" && (
            <OfficialActions demandId={demand.id} state={demand.state} locale={locale} />
          )}
        </div>
      </aside>
    </>
  );
}
