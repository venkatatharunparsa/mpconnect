"use client";

import { apiFetch } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import {
  endpointExists,
  fetchMergeQueue,
  fetchQuarantineQueue,
  fetchValidationQueue,
  simulateAttack,
} from "./api";
import { MergeTab } from "./MergeTab";
import { QuarantineTab } from "./QuarantineTab";
import { Toast } from "./Toast";
import { ValidationTab } from "./ValidationTab";
import type { DemandSummary, MergeReviewItem, QuarantineCluster, ValidationItem } from "./types";

type Tab = "validation" | "merge" | "quarantine";

export function ReviewConsole() {
  const [tab, setTab] = useState<Tab>("validation");
  const [validation, setValidation] = useState<ValidationItem[]>([]);
  const [merge, setMerge] = useState<MergeReviewItem[]>([]);
  const [quarantine, setQuarantine] = useState<QuarantineCluster[]>([]);
  const [demands, setDemands] = useState<DemandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [attackApi, setAttackApi] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "info" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [v, m, q] = await Promise.all([
      fetchValidationQueue(),
      fetchMergeQueue(),
      fetchQuarantineQueue(),
    ]);
    setValidation(v);
    setMerge(m);
    setQuarantine(q);
    // TODO: confirm shape with A â€” demand search for attach
    try {
      const res = await apiFetch("/api/demands");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.demands ?? []);
        setDemands(list);
      }
    } catch {
      /* empty */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    endpointExists("/api/dev/simulate-attack").then(setAttackApi);
  }, [load]);

  const showError = (msg: string) => setToast({ msg, type: "error" });

  const handleSimulateAttack = async () => {
    if (!attackApi) return;
    setSimulating(true);
    const ok = await simulateAttack();
    if (ok) {
      await load();
      setTab("quarantine");
      setToast({ msg: "Attack simulated â€” check quarantine queue.", type: "info" });
    } else {
      showError("Simulate attack failed.");
    }
    setSimulating(false);
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "validation", label: "Validation", count: validation.length },
    { id: "merge", label: "Merge review", count: merge.length },
    { id: "quarantine", label: "Quarantine", count: quarantine.reduce((n, c) => n + c.submissions.length, 0) },
  ];

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Human review console</h1>
          <p className="mt-1 text-sm text-slate-600">
            Validation gate Â· merge band Â· coordination quarantine (abuse-defense L3/L4/L6)
          </p>
        </div>
        <button
          type="button"
          disabled={!attackApi || simulating}
          title={!attackApi ? "Waiting on platform API." : undefined}
          onClick={handleSimulateAttack}
          className="rounded-lg border-2 border-dashed border-red-500 bg-red-50 px-4 py-2 text-sm font-bold uppercase tracking-wide text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {simulating ? "Simulatingâ€¦" : "âš  Simulate attack (dev only)"}
        </button>
      </div>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs tabular-nums">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "validation" && (
          <ValidationTab
            items={validation}
            loading={loading}
            onRemove={(id) => setValidation((v) => v.filter((x) => x.id !== id))}
            onError={showError}
          />
        )}
        {tab === "merge" && (
          <MergeTab
            items={merge}
            allDemands={demands}
            loading={loading}
            onRemove={(id) => setMerge((m) => m.filter((x) => x.submissionId !== id))}
            onError={showError}
          />
        )}
        {tab === "quarantine" && (
          <QuarantineTab
            clusters={quarantine}
            loading={loading}
            onRemoveSubmission={(clusterId, subId) =>
              setQuarantine((clusters) =>
                clusters
                  .map((c) =>
                    c.id === clusterId
                      ? { ...c, submissions: c.submissions.filter((s) => s.id !== subId) }
                      : c,
                  )
                  .filter((c) => c.submissions.length > 0),
              )
            }
            onError={showError}
          />
        )}
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}