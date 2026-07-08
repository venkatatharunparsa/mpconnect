import { extractSubmission } from "@/server/clients/gemini";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { generateRefId } from "@/server/services/intake/refid";
import { appendEvent } from "@/server/services/lifecycle/events";

export interface NewsIngestInput {
  headline: string;
  articleText: string;
  sourceUrl: string;
  publisher?: string;
}

export interface NewsIngestResult {
  submissionId?: string;
  refId?: string;
  quarantined: boolean;
  ignored?: boolean;
}

/** Ingests local news articles, extracts candidate problems, and registers them. */
export async function ingestNewsArticle(input: NewsIngestInput): Promise<NewsIngestResult> {
  const combinedText = `HEADLINE: ${input.headline}\nCONTENT: ${input.articleText}`;
  
  // Call AI client to extract structured problem fields
  const extractionResult = await extractSubmission({ text: combinedText });
  if (extractionResult.needsHuman) {
    // If the news article couldn't be parsed or has zero confidence, ignore or skip it
    return { quarantined: false, ignored: true };
  }

  const { extraction } = extractionResult;

  // News items must contain valid Vizag public problems
  const refId = await generateRefId();
  const citizenKey = `NEWS-${input.publisher || "local"}`;

  // Insert submission with channel="news"
  const [row] = await db
    .insert(submissions)
    .values({
      refId,
      channel: "news",
      citizenKey,
      rawText: combinedText,
      mediaUrl: input.sourceUrl, // Store source url here
      lang: extraction.lang,
      kind: extraction.kind,
      category: extraction.category,
      locationText: extraction.locationText,
      urgency: extraction.urgency,
      summaryEn: extraction.summaryEn,
      summaryTe: extraction.summaryTe,
      confidence: extraction.confidence,
      status: "received", // Starts as received, bypassing auto-merge
    })
    .returning();

  await appendEvent({
    eventType: "SubmissionReceived",
    submissionId: row.id,
    actorType: "system",
    actorId: "news-scraper",
    payload: {
      channel: "news",
      refId,
      headline: input.headline,
      sourceUrl: input.sourceUrl,
    },
  });

  return {
    submissionId: row.id,
    refId,
    quarantined: false,
  };
}
