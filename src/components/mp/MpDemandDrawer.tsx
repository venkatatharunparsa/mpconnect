"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api-client";
import { Timeline } from "@/components/Timeline";
import type { Demand, EvidenceResponse, MpladsPack, UiLocale } from "./types";

type DrawerTab = "timeline" | "evidence" | "mplads";

interface MpDemandDrawerProps {
  demand: Demand | null;
  open: boolean;
  onClose: () => void;
  locale: UiLocale;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(apiUrl(path));
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function EvidenceTab({ demandId }: { demandId: string }) {
  const [data, setData] = useState<EvidenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetchJson<EvidenceResponse>(`/api/demands/${demandId}/evidence`);
      if (!cancelled) {
        setData(res);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demandId]);

  if (loading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (!data?.rows?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
        No evidence narratives compiled.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
            <th className="pb-2">Metric</th>
            <th className="pb-2">Value</th>
            <th className="pb-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row: any) => (
            <tr key={row.metric} className="border-b border-slate-100 text-slate-700 font-medium">
              <td className="py-2.5">{row.metric}</td>
              <td className="py-2.5 font-bold">
                {row.value}
                {row.estimated && (
                  <span className="ml-1.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5">
                    est.
                  </span>
                )}
              </td>
              <td className="py-2.5">
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold"
                >
                  {row.source}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.narrative && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs leading-relaxed text-slate-600 font-medium italic">
          {data.narrative}
        </div>
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
    return <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (!pack) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
        No MPLADS recommendations configured.
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {pack.watermark && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-3xl font-black text-slate-100/50 rotate-[-12deg] uppercase">
          {pack.watermark}
        </div>
      )}
      <div>
        <h4 className="font-extrabold text-sm text-slate-900">{pack.title ?? "MPLADS recommendation"}</h4>
        {pack.description && <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">{pack.description}</p>}
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
        {pack.beneficiaries != null && (
          <p>
            Estimated Beneficiaries: <strong className="text-slate-900">{pack.beneficiaries.toLocaleString()}</strong>
          </p>
        )}
        {pack.costBand && (
          <p>
            Funding Cost Band: <strong className="text-slate-900">{pack.costBand}</strong>
          </p>
        )}
        {pack.clocks && pack.clocks.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Project statutory clocks</p>
            <ul className="space-y-1 pl-3 list-disc">
              {pack.clocks.map((c: any) => (
                <li key={c.label} className="text-[11px]">
                  {c.label}: <strong className="text-slate-900">{c.days} days</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function MpDemandDrawer({ demand, open, onClose, locale }: MpDemandDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("timeline");

  useEffect(() => {
    if (demand) setTab("timeline");
  }, [demand?.id]);

  if (!open || !demand) return null;

  const tabs: { id: DrawerTab; label: string }[] = [
    { id: "timeline", label: locale === "te" ? "టైమ్ లైన్" : "Ledger Timeline" },
    { id: "evidence", label: locale === "te" ? "ఆధారాలు" : "Narrative Evidence" },
    { id: "mplads", label: locale === "te" ? "నిధులు" : "MPLADS Drafts" },
  ];

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:top-14 sm:h-[calc(100%-3.5rem)] rounded-l-3xl border-l border-slate-200">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="min-w-0 pr-4 space-y-2">
            <h2 className="text-base font-extrabold leading-snug text-slate-900">{demand.title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/10 text-primary text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                {demand.state.replace(/_/g, " ")}
              </span>
              {demand.ward && (
                <span className="text-xs text-slate-500 font-bold uppercase">
                  Ward: {demand.ward}
                </span>
              )}
            </div>
            <p className="text-sm font-black text-primary">
              Affected: {demand.affectedCount.toLocaleString()} Citizens
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 shrink-0 bg-slate-50/50">
          <div className="flex gap-6">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`border-b-2 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                  tab === tb.id
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <dl className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 pb-5">
            <div>
              <dt className="text-slate-400 font-black uppercase tracking-wider">Category</dt>
              <dd className="font-bold text-slate-800 capitalize mt-0.5">{demand.category}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-black uppercase tracking-wider">Urgency</dt>
              <dd className="font-bold text-slate-800 capitalize mt-0.5">{demand.urgency}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-black uppercase tracking-wider">Rank Score</dt>
              <dd className="font-bold text-slate-800 mt-0.5">{demand.rankScore.toFixed(1)}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-black uppercase tracking-wider">SLA Status</dt>
              <dd className="font-bold text-slate-800 capitalize mt-0.5">
                {demand.isEscalated ? "⚠️ SLA Breached" : "Within Limit"}
              </dd>
            </div>
          </dl>

          {tab === "timeline" && <Timeline demandId={demand.id} />}
          {tab === "evidence" && <EvidenceTab demandId={demand.id} />}
          {tab === "mplads" && <MpladsTab demandId={demand.id} />}
        </div>
      </aside>
    </>
  );
}
