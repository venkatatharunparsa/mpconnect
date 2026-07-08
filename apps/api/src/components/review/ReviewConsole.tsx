"use client";

import { useCallback, useEffect, useState } from "react";
import {
  endpointExists,
  fetchMergeQueue,
  fetchQuarantineQueue,
  fetchValidationQueue,
  fetchRoutingQueue,
  fetchTranscriptionQueue,
  fetchStaleAuthorities,
  routeApprove,
  transcribeSubmission,
  simulateAttack,
} from "./api";
import { MergeTab } from "./MergeTab";
import { QuarantineTab } from "./QuarantineTab";
import { Toast } from "./Toast";
import { ValidationTab } from "./ValidationTab";
import type { DemandSummary, MergeReviewItem, QuarantineCluster, ValidationItem } from "./types";

type Tab = "validation" | "merge" | "quarantine" | "routing" | "transcription" | "staleKb";

export function ReviewConsole() {
  const [tab, setTab] = useState<Tab>("validation");
  const [validation, setValidation] = useState<ValidationItem[]>([]);
  const [merge, setMerge] = useState<MergeReviewItem[]>([]);
  const [quarantine, setQuarantine] = useState<QuarantineCluster[]>([]);
  const [routing, setRouting] = useState<any[]>([]);
  const [transcription, setTranscription] = useState<any[]>([]);
  const [staleAuthorities, setStaleAuthorities] = useState<any[]>([]);
  const [demands, setDemands] = useState<DemandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [attackApi, setAttackApi] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "info" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [v, m, q, r, t, s] = await Promise.all([
      fetchValidationQueue(),
      fetchMergeQueue(),
      fetchQuarantineQueue(),
      fetchRoutingQueue(),
      fetchTranscriptionQueue(),
      fetchStaleAuthorities(),
    ]);
    setValidation(v);
    setMerge(m);
    setQuarantine(q);
    setRouting(r);
    setTranscription(t);
    setStaleAuthorities(s);
    // TODO: confirm shape with A — demand search for attach
    try {
      const res = await fetch("/api/demands");
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
      setToast({ msg: "Attack simulated — check quarantine queue.", type: "info" });
    } else {
      showError("Simulate attack failed.");
    }
    setSimulating(false);
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "validation", label: "Validation", count: validation.length },
    { id: "merge", label: "Merge review", count: merge.length },
    { id: "quarantine", label: "Quarantine", count: quarantine.reduce((n, c) => n + c.submissions.length, 0) },
    { id: "routing", label: "Routing ambiguity", count: routing.length },
    { id: "transcription", label: "Transcription", count: transcription.length },
    { id: "staleKb", label: "Stale KB", count: staleAuthorities.length },
  ];

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Human review console</h1>
          <p className="mt-1 text-sm text-slate-600">
            Validation gate · merge band · coordination quarantine (abuse-defense L3/L4/L6)
          </p>
        </div>
        <button
          type="button"
          disabled={!attackApi || simulating}
          title={!attackApi ? "Waiting on platform API." : undefined}
          onClick={handleSimulateAttack}
          className="rounded-lg border-2 border-dashed border-red-500 bg-red-50 px-4 py-2 text-sm font-bold uppercase tracking-wide text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {simulating ? "Simulating…" : "⚠ Simulate attack (dev only)"}
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
        {tab === "routing" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Loading routing queue…</p>
            ) : routing.length === 0 ? (
              <p className="text-slate-500">No demands require manual routing review.</p>
            ) : (
              routing.map((item) => (
                <div key={item.demandId} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">{item.title}</h3>
                      <p className="text-sm text-slate-500">
                        Category: <span className="font-medium text-slate-700">{item.category}</span> · Ward: <span className="font-medium text-slate-700">{item.ward ?? "All"}</span>
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                      item.urgency === "safety" ? "bg-red-100 text-red-800" :
                      item.urgency === "high" ? "bg-amber-100 text-amber-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {item.urgency}
                    </span>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                    <strong>Ambiguity Reason:</strong> {item.reason}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Select Authority for Routing:</label>
                    <div className="flex gap-2">
                      <select
                        id={`routing-select-${item.demandId}`}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Select Candidate --</option>
                        {item.candidates.map((cand: any) => (
                          <option key={cand.id} value={cand.id}>
                            {cand.name} ({cand.org}) {cand.verified ? "✓ Verified" : "Unverified"}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={async () => {
                          const select = document.getElementById(`routing-select-${item.demandId}`) as HTMLSelectElement;
                          const authId = parseInt(select.value, 10);
                          if (isNaN(authId)) {
                            showError("Please select a valid authority.");
                            return;
                          }
                          const ok = await routeApprove(item.demandId, authId);
                          if (ok) {
                            setToast({ msg: "Routing approved successfully.", type: "info" });
                            load();
                          } else {
                            showError("Failed to approve routing.");
                          }
                        }}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
                      >
                        Approve Route
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {tab === "transcription" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Loading transcription queue…</p>
            ) : transcription.length === 0 ? (
              <p className="text-slate-500">No submissions require manual transcription correction.</p>
            ) : (
              transcription.map((item) => (
                <div key={item.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-800">Ref: {item.refId}</h3>
                      <p className="text-sm text-slate-500">
                        Channel: <span className="font-medium text-slate-700">{item.channel}</span> · Language: <span className="font-medium text-slate-700">{item.lang ?? "Unknown"}</span>
                      </p>
                    </div>
                    {item.confidence != null && (
                      <span className="text-xs text-slate-400">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                    )}
                  </div>

                  {item.audioUrl && (
                    <div className="py-2">
                      <audio src={item.audioUrl} controls className="w-full h-8" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Corrected Transcript text:</label>
                    <textarea
                      id={`trans-input-${item.id}`}
                      defaultValue={item.rawText ?? ""}
                      placeholder="Type the exact Telugu or English speech transcript..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          const text = (document.getElementById(`trans-input-${item.id}`) as HTMLTextAreaElement).value.trim();
                          if (!text) {
                            showError("Please enter a non-empty transcript.");
                            return;
                          }
                          const ok = await transcribeSubmission(item.id, text);
                          if (ok) {
                            setToast({ msg: "Submission transcript processed and ingested.", type: "info" });
                            load();
                          } else {
                            showError("Failed to update transcription.");
                          }
                        }}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
                      >
                        Submit Correction
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {tab === "staleKb" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Loading stale authorities…</p>
            ) : staleAuthorities.length === 0 ? (
              <p className="text-slate-500">No authorities require re-verification (all records verified within 180 days).</p>
            ) : (
              staleAuthorities.map((auth) => (
                <div key={auth.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">{auth.name}</h3>
                      <p className="text-sm text-slate-500">
                        Org: <span className="font-medium text-slate-700">{auth.org}</span> · Level: <span className="font-medium text-slate-700">{auth.level}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded uppercase bg-rose-100 text-rose-800">
                      Stale
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 space-y-1">
                    <div><strong>Last Verified:</strong> <span className="text-rose-600 font-medium">{auth.verifiedOn}</span> (older than 180 days)</div>
                    {auth.sourceNote && <div><strong>Source Note:</strong> {auth.sourceNote}</div>}
                    <div>
                      <strong>Citation Link:</strong>{" "}
                      <a
                        href={auth.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-medium break-all"
                      >
                        {auth.sourceUrl}
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
