import type { ExtractSubmissionResult, GeminiExtraction } from "@mpconnect/shared";
import { apiFetch } from "./api-client";

export type ExtractInput = {
  text?: string;
  audioBase64?: string;
  audioMime?: string;
  imageBase64?: string;
  imageMime?: string;
};

export async function runExtraction(input: ExtractInput): Promise<ExtractSubmissionResult> {
  const res = await apiFetch("/api/intake/extract", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    return { needsHuman: true, raw: data };
  }
  return { needsHuman: false, extraction: data.extraction as GeminiExtraction };
}

export async function submitExtracted(payload: {
  citizenKey: string;
  rawText?: string;
  extraction: GeminiExtraction;
  channel?: "web" | "voice";
}) {
  const res = await apiFetch("/api/submissions", {
    method: "POST",
    body: JSON.stringify({
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
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Submission failed");
  return data as {
    refId: string;
    submissionId: string;
    status: string;
    flags?: Record<string, unknown>;
  };
}

export async function extractVoiceTranscript(text: string) {
  return runExtraction({ text });
}

export async function submitVoiceSubmission(payload: {
  citizenKey: string;
  rawText: string;
  extraction: GeminiExtraction;
}) {
  return submitExtracted({ ...payload, channel: "voice" });
}