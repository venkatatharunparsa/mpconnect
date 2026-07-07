"use server";

import { runExtraction, submitExtracted } from "@/app/submit/actions";
import type { GeminiExtraction } from "@/lib/gemini";

export async function extractVoiceTranscript(text: string) {
  return runExtraction({ text });
}

export async function submitVoiceSubmission(payload: {
  citizenKey: string;
  rawText: string;
  extraction: GeminiExtraction;
}) {
  return submitExtracted({
    citizenKey: payload.citizenKey,
    rawText: payload.rawText,
    extraction: payload.extraction,
    channel: "voice",
  });
}
