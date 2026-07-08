"use server";

import { extractSubmission, type ExtractSubmissionInput, type GeminiExtraction } from "@/server/clients/gemini";
import type { IntakeBody } from "@/server/models/intake-schema";

function apiBase(): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function runExtraction(input: ExtractSubmissionInput) {
  return extractSubmission(input);
}

export async function postSubmission(body: IntakeBody) {
  const res = await fetch(`${apiBase()}/api/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Submission failed");
  }
  return data as { refId: string; submissionId: string; status: string; flags?: Record<string, unknown> };
}

export type SubmitPayload = {
  citizenKey: string;
  rawText?: string;
  extraction: GeminiExtraction;
  channel?: "web" | "voice";
};

export async function submitExtracted(payload: SubmitPayload) {
  return postSubmission({
    channel: payload.channel ?? "web",
    citizenKey: payload.citizenKey,
    rawText: payload.rawText,
    lang: payload.extraction.lang,
    extraction: {
      kind: payload.extraction.kind,
      category: payload.extraction.category,
      locationText: payload.extraction.locationText,
      urgency: payload.extraction.urgency,
      summaryEn: payload.extraction.summaryEn,
      summaryTe: payload.extraction.summaryTe,
      confidence: payload.extraction.confidence,
    },
  });
}
