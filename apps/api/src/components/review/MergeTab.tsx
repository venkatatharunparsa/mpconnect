"use client";

import { useMemo, useState } from "react";
import { decideMerge } from "./api";
import type { DemandSummary, MergeReviewItem } from "./types";

const COMPONENT_LABELS: Record<string, string> = {
  text: "Text similarity",
  geo: "Geo distance",
  category: "Category match",
  time: "Time decay",
};

function ScoreBars({ components, score }: { components?: MergeReviewItem["components"]; score: number }) {
  const entries = components
    ? Object.entries(components).filter(([, v]) => typeof v === "number")
    : [];

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Combined score</span>
        <span className="font-bold tabular-nums">{score.toFixed(2)}</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-400">No component breakdown from API yet.</p>
      ) : (
        entries.map(([key, val]) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{COMPONENT_LABELS[key] ?? key}</span>
              <span className="tabular-nums">{(val as number).toFixed(2)}</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (val as number) * 100)}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SideCard({
  title,
  subtitle,
  ward,
  extra,
}: {
  title: string;
  subtitle?: string;
  ward?: string | null;
  extra?: string;
}) {
  return (
    <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 font-semibold text-slate-900">{subtitle}</p>
      {ward && <p className="mt-1 text-sm text-slate-600">Ward: {ward}</p>}
      {extra && <p className="mt-1 text-sm text-primary">{extra}</p>}
      <div className="mt-3 flex h-24 items-center justify-center rounded border border-dashed border-slate-300 bg-white text-xs text-slate-400">
        Map thumbnail — API pending
      </div>
    </div>
  );
}

interface MergeTabProps {
  items: MergeReviewItem[];
  allDemands: DemandSummary[];
  loading: boolean;
  onRemove: (submissionId: string) => void;
  onError: (msg: string) => void;
}

export function MergeTab({ items, allDemands, loading, onRemove, onError }: MergeTabProps) {
  const [attachSearch, setAttachSearch] = useState<Record<string, string>>({});
  const [attachTarget, setAttachTarget] = useState<Record<string, string>>({});

  const searchResults = useMemo(() => {
    const map: Record<string, DemandSummary[]> = {};
    for (const item of items) {
      const q = (attachSearch[item.submissionId] ?? "").toLowerCase();
      if (!q) {
        map[item.submissionId] = [];
        continue;
      }
      map[item.submissionId] = allDemands
        .filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            (d.ward?.toLowerCase().includes(q) ?? false),
        )
        .slice(0, 5);
    }
    return map;
  }, [items, attachSearch, allDemands]);

  const act = async (
    submissionId: string,
    decision: "merge" | "new" | "attach",
    demandId?: string,
  ) => {
    onRemove(submissionId);
    const ok = await decideMerge(submissionId, decision, demandId);
    if (!ok) {
      onError(`Merge decision (${decision}) — API pending. Removed optimistically.`);
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-slate-100" />;
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
        No merge-review cases. Submissions scoring between θ<sub>lo</sub> and θ<sub>hi</sub> land
        here for a human merge / new / attach decision.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <article key={item.submissionId} className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-mono text-xs text-slate-500">{item.submission.refId}</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row">
            <SideCard
              title="Incoming submission"
              subtitle={
                item.submission.summaryEn ??
                item.submission.rawText?.slice(0, 80) ??
                "—"
              }
              ward={item.submission.ward ?? item.submission.extraction?.ward}
            />
            <SideCard
              title="Candidate demand"
              subtitle={item.candidateDemand.title}
              ward={item.candidateDemand.ward}
              extra={`affects ${item.candidateDemand.affectedCount} citizens`}
            />
            <div className="w-full lg:w-48">
              <ScoreBars components={item.components} score={item.score} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => act(item.submissionId, "merge", item.candidateDemand.id)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Merge into this demand
            </button>
            <button
              type="button"
              onClick={() => act(item.submissionId, "new")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
            >
              Create new demand
            </button>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-600">Attach to a different demand</p>
            <input
              type="search"
              placeholder="Search by title or ward…"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={attachSearch[item.submissionId] ?? ""}
              onChange={(e) =>
                setAttachSearch((s) => ({ ...s, [item.submissionId]: e.target.value }))
              }
            />
            {searchResults[item.submissionId]?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {searchResults[item.submissionId].map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachTarget((s) => ({ ...s, [item.submissionId]: d.id }))
                      }
                      className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-slate-50 ${
                        attachTarget[item.submissionId] === d.id ? "bg-primary/10" : ""
                      }`}
                    >
                      {d.title} · {d.ward ?? "—"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              disabled={!attachTarget[item.submissionId]}
              onClick={() =>
                act(item.submissionId, "attach", attachTarget[item.submissionId])
              }
              className="mt-2 rounded-lg border border-primary px-3 py-1.5 text-sm text-primary disabled:opacity-40"
            >
              Attach to selected
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
