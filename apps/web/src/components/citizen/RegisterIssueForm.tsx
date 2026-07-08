"use client";

import { useMemo, useState } from "react";
import { getDemoCitizenKey } from "@/components/citizenIdentity";
import { runExtraction, submitExtracted } from "@/lib/intake";
import { saveRecentSubmission } from "@/lib/recent-submissions";

type InputMode = "text" | "voice" | "photo";

const PUBLIC_CATEGORIES = [
  "water_supply",
  "water_leakage",
  "potholes_roads",
  "streetlights",
  "garbage",
  "drainage",
  "safety_hazard",
] as const;

const PERSONAL_CATEGORIES = ["pensions_welfare", "land_revenue"] as const;

export function RegisterIssueForm() {
  const [mode, setMode] = useState<InputMode>("text");
  const [rawText, setRawText] = useState("");
  const [isPersonal, setIsPersonal] = useState(false);
  const [ward, setWard] = useState("mvp");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ refId: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestedCategory = useMemo(
    () => (isPersonal ? PERSONAL_CATEGORIES[0] : PUBLIC_CATEGORIES[0]),
    [isPersonal],
  );

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const citizenKey = getDemoCitizenKey();
      const extractionRes = await runExtraction({ text: rawText });
      if (extractionRes.needsHuman || !extractionRes.extraction) {
        throw new Error("Could not extract issue details. Please add more detail and retry.");
      }
      const extraction = {
        ...extractionRes.extraction,
        category: suggestedCategory,
        ward,
      };
      const response = await submitExtracted({
        citizenKey,
        rawText,
        extraction,
        channel: mode === "voice" ? "voice" : "web",
      });
      saveRecentSubmission({
        refId: response.refId,
        title: extraction.summaryEn || rawText.slice(0, 60) || "New issue",
        category: extraction.category,
        status:
          response.status === "received"
            ? "submitted"
            : response.status === "extracted"
              ? "processing"
              : "clustered",
      });
      setResult({ refId: response.refId, status: response.status });
      setRawText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 py-4">
      <div>
        <h2 className="text-2xl font-bold text-on-surface">Voice your concern</h2>
        <p className="text-sm text-on-surface-variant">
          Submit a civic issue or personal request in Visakhapatnam.
        </p>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-outline-variant bg-surface-container-low p-1">
        {(["text", "voice", "photo"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-xl py-3 text-sm font-semibold capitalize transition ${
              mode === m ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder={
          mode === "voice"
            ? "Paste transcript from voice note..."
            : mode === "photo"
              ? "Describe what is visible in the photo..."
              : "Describe the issue in detail..."
        }
        className="min-h-[170px] w-full rounded-2xl border-outline-variant bg-surface-container-lowest p-4"
      />

      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-on-surface">Demand visibility</h3>
          <button
            type="button"
            onClick={() => setIsPersonal((p) => !p)}
            className="rounded-full border border-outline-variant bg-white px-3 py-1 text-xs font-bold"
          >
            {isPersonal ? "Private" : "Public"}
          </button>
        </div>
        <p className="text-sm text-on-surface-variant">
          {isPersonal
            ? "Personal requests stay private between you and the relevant authority."
            : "Public issues can appear in the community feed for support."}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Ward</span>
          <select
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            className="w-full rounded-xl border-outline-variant bg-white"
          >
            <option value="mvp">MVP</option>
            <option value="gajuwaka">Gajuwaka</option>
            <option value="bheemili">Bheemili</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Suggested category
          </span>
          <input
            readOnly
            value={suggestedCategory}
            className="w-full rounded-xl border-outline-variant bg-surface-container-high text-on-surface"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void submit()}
        disabled={submitting || rawText.trim().length < 8}
        className="h-12 w-full rounded-2xl bg-primary-container text-sm font-bold text-on-primary-container disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Demand"}
      </button>

      {result && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Submitted successfully. Reference ID: <strong>{result.refId}</strong> ({result.status})
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}

