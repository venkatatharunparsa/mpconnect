"use client";

import { useState } from "react";
import { TAXONOMY } from "@/server/taxonomy";
import { approveValidation, rejectValidation } from "./api";
import { REJECT_REASONS, type ValidationItem } from "./types";

const PILOT_WARDS = ["gajuwaka", "mvp", "bheemili"];

function field(item: ValidationItem, key: keyof ValidationItem): string | undefined {
  const v = item[key] ?? item.extraction?.[key as keyof typeof item.extraction];
  return v != null ? String(v) : undefined;
}

function ExtractionPanel({ item }: { item: ValidationItem }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
      <div>
        <dt className="text-slate-500">Kind</dt>
        <dd className="font-medium">{field(item, "kind") ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Category</dt>
        <dd className="font-medium">{field(item, "category") ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Ward</dt>
        <dd className="font-medium">{field(item, "ward") ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Urgency</dt>
        <dd className="font-medium capitalize">{field(item, "urgency") ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Confidence</dt>
        <dd className="font-medium tabular-nums">
          {field(item, "confidence")
            ? `${(Number(field(item, "confidence")) * 100).toFixed(0)}%`
            : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-slate-500">Language</dt>
        <dd className="font-medium">{item.lang ?? "—"}</dd>
      </div>
      {field(item, "summaryEn") && (
        <div className="col-span-2">
          <dt className="text-slate-500">Summary (EN)</dt>
          <dd>{field(item, "summaryEn")}</dd>
        </div>
      )}
      {field(item, "summaryTe") && (
        <div className="col-span-2">
          <dt className="text-slate-500">Summary (TE)</dt>
          <dd>{field(item, "summaryTe")}</dd>
        </div>
      )}
    </dl>
  );
}

interface ValidationTabProps {
  items: ValidationItem[];
  loading: boolean;
  onRemove: (id: string) => void;
  onError: (msg: string) => void;
}

export function ValidationTab({ items, loading, onRemove, onError }: ValidationTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [category, setCategory] = useState<Record<string, string>>({});
  const [ward, setWard] = useState<Record<string, string>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const handleApprove = async (item: ValidationItem) => {
    onRemove(item.id);
    const ok = await approveValidation(item.id, {
      category: category[item.id] ?? field(item, "category"),
      ward: ward[item.id] ?? field(item, "ward"),
    });
    if (!ok) {
      onError("Approve failed — API pending. Item removed optimistically.");
    }
  };

  const handleReject = async (item: ValidationItem) => {
    const reason = rejectReason[item.id];
    if (!reason) {
      onError("Select a rejection reason first.");
      return;
    }
    onRemove(item.id);
    const ok = await rejectValidation(item.id, reason as (typeof REJECT_REASONS)[number]["value"]);
    if (!ok) {
      onError("Reject failed — API pending. Item removed optimistically.");
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-slate-100" />;
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
        No submissions awaiting validation. Low-confidence extractions appear here when the intake API
        flags <code className="text-xs">needs_human</code>.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const expanded = expandedId === item.id;
        const conf = Number(field(item, "confidence") ?? 0);
        return (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-slate-500">{item.refId}</p>
                <p className="mt-1 font-medium text-slate-900">
                  {item.rawText?.slice(0, 120) ?? field(item, "summaryEn") ?? "No transcript"}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {(item.needsHuman || item.extraction?.needsHuman) && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
                      needs human
                    </span>
                  )}
                  {conf > 0 && conf < 0.6 && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">
                      low confidence
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(item)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {expanded ? "Less" : "Correct"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              {item.mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.mediaUrl}
                  alt="Submission media"
                  className="h-20 w-20 rounded border object-cover"
                />
              )}
              {item.audioUrl && (
                <audio controls src={item.audioUrl} className="h-10 max-w-xs" preload="none" />
              )}
            </div>

            <ExtractionPanel item={item} />

            {expanded && (
              <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="text-slate-600">Category correction</span>
                  <select
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
                    value={category[item.id] ?? field(item, "category") ?? ""}
                    onChange={(e) => setCategory((s) => ({ ...s, [item.id]: e.target.value }))}
                  >
                    <option value="">—</option>
                    {TAXONOMY.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.nameEn}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Ward correction</span>
                  <select
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
                    value={ward[item.id] ?? field(item, "ward") ?? ""}
                    onChange={(e) => setWard((s) => ({ ...s, [item.id]: e.target.value }))}
                  >
                    <option value="">—</option>
                    {PILOT_WARDS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-slate-600">Reject reason</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <select
                      className="flex-1 rounded border border-slate-300 px-2 py-1.5"
                      value={rejectReason[item.id] ?? ""}
                      onChange={(e) =>
                        setRejectReason((s) => ({ ...s, [item.id]: e.target.value }))
                      }
                    >
                      <option value="">Select reason…</option>
                      {REJECT_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleReject(item)}
                      className="rounded-lg border border-state-reopened px-4 py-2 text-sm font-medium text-state-reopened"
                    >
                      Reject
                    </button>
                  </div>
                </label>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
