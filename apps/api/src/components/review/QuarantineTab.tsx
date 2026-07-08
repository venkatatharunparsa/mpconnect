"use client";

import { decideQuarantine } from "./api";
import type { QuarantineCluster } from "./types";

function BurstChart({ timeline }: { timeline: QuarantineCluster["burstTimeline"] }) {
  if (!timeline?.length) {
    return (
      <p className="text-xs text-slate-400">Burst timeline unavailable — API pending.</p>
    );
  }
  const max = Math.max(...timeline.map((b) => b.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {timeline.map((b) => (
        <div key={b.bucket} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-state-reopened/80"
            style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count > 0 ? 4 : 0 }}
            title={`${b.count} at ${b.bucket}`}
          />
          <span className="text-[9px] text-slate-400 truncate w-full text-center">
            {b.bucket}
          </span>
        </div>
      ))}
    </div>
  );
}

interface QuarantineTabProps {
  clusters: QuarantineCluster[];
  loading: boolean;
  onRemoveSubmission: (clusterId: string, submissionId: string) => void;
  onError: (msg: string) => void;
}

export function QuarantineTab({
  clusters,
  loading,
  onRemoveSubmission,
  onError,
}: QuarantineTabProps) {
  const act = async (clusterId: string, submissionId: string, action: "release" | "reject") => {
    onRemoveSubmission(clusterId, submissionId);
    const ok = await decideQuarantine(submissionId, action);
    if (!ok) {
      onError(`Quarantine ${action} — API pending. Updated optimistically.`);
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-slate-100" />;
  }

  if (clusters.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
        Quarantine queue empty. Use <strong>Simulate attack</strong> (dev) to demo moment 7 when the
        platform API is wired.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {clusters.map((cluster) => (
        <article
          key={cluster.id}
          className="rounded-lg border-2 border-state-reopened/30 bg-red-50/30 p-4"
        >
          <header>
            <h3 className="font-bold text-red-900">
              Suspected coordinated activity — human decision required
            </h3>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {cluster.coordinationScore != null && (
                <span className="rounded bg-white px-2 py-0.5 font-medium tabular-nums">
                  Coordination score: {cluster.coordinationScore.toFixed(2)}
                </span>
              )}
              {cluster.textSimilarity != null && (
                <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                  Text similarity: {(cluster.textSimilarity * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </header>

          <div className="mt-4 rounded-lg bg-white p-3">
            <p className="text-xs font-medium text-slate-600">Burst timeline</p>
            <BurstChart timeline={cluster.burstTimeline} />
          </div>

          <ul className="mt-4 space-y-2">
            {cluster.submissions.map((sub) => (
              <li
                key={sub.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="font-mono text-xs text-slate-500">{sub.refId}</p>
                  <p className="text-sm text-slate-800">
                    {sub.rawText?.slice(0, 100) ?? "Templated report"}
                  </p>
                  <div className="mt-1 flex gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        sub.identityAge === "new"
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {sub.identityAge === "new" ? "New identity" : "Aged identity"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(sub.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => act(cluster.id, sub.id, "release")}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Release
                  </button>
                  <button
                    type="button"
                    onClick={() => act(cluster.id, sub.id, "reject")}
                    className="rounded-lg border border-state-reopened px-3 py-1.5 text-sm text-state-reopened"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
