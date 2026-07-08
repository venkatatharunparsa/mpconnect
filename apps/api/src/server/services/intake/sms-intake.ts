import { extractSubmission } from "@/server/clients/gemini";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { generateRefId } from "@/server/services/intake/refid";
import { appendEvent } from "@/server/services/lifecycle/events";
import { triggerMergeProcessing } from "@/server/services/engine/merge-hook";
import { getTraceId } from "@/server/core/logger";

export interface SmsIntakeInput {
  senderPhone: string;
  smsText: string;
}

export interface SmsIntakeResult {
  submissionId: string;
  refId: string;
  status: string;
}

/** Receives SMS from citizens, extracts structured data, and queues for merge. */
export async function processIncomingSms(input: SmsIntakeInput): Promise<SmsIntakeResult> {
  const cleanPhone = input.senderPhone.trim();
  const citizenKey = `SMS-${cleanPhone}`;

  // Call Gemini extraction to structure SMS content
  const extractionResult = await extractSubmission({ text: input.smsText });
  
  let status: "received" | "extracted" = "received";
  let extraction = undefined;
  if (!extractionResult.needsHuman) {
    status = "extracted";
    extraction = extractionResult.extraction;
  }

  const refId = await generateRefId();

  const [row] = await db
    .insert(submissions)
    .values({
      refId,
      channel: "sms",
      citizenKey,
      rawText: input.smsText,
      lang: extraction?.lang,
      kind: extraction?.kind,
      category: extraction?.category,
      locationText: extraction?.locationText,
      urgency: extraction?.urgency,
      summaryEn: extraction?.summaryEn,
      summaryTe: extraction?.summaryTe,
      confidence: extraction?.confidence,
      status,
    })
    .returning();

  await appendEvent({
    eventType: "SubmissionReceived",
    submissionId: row.id,
    actorType: "citizen",
    actorId: citizenKey,
    payload: {
      channel: "sms",
      refId,
      phone: cleanPhone,
    },
  });

  // If extraction succeeded, trigger merge processing
  if (status === "extracted" && extraction) {
    const traceId = getTraceId();
    await triggerMergeProcessing(row.id, traceId);
  }

  return {
    submissionId: row.id,
    refId,
    status,
  };
}
