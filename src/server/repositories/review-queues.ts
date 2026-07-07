/**
 * Review queue queries for the human-gate console.
 */
import { db } from "@/server/db";
import { demands, events, submissions } from "@/server/db/schema";
import { and, desc, eq, inArray, lt, or, isNull, isNotNull } from "drizzle-orm";
import { CONFIG } from "@/server/core/config";
import { proposeRouting } from "@/server/services/lifecycle/routing";

function submissionToValidationItem(s: typeof submissions.$inferSelect) {
  const needsHuman =
    s.confidence != null && s.confidence < CONFIG.extraction.minConfidence;
  return {
    id: s.id,
    refId: s.refId,
    rawText: s.rawText,
    mediaUrl: s.mediaUrl,
    audioUrl: s.audioUrl,
    lang: s.lang,
    kind: s.kind,
    category: s.category,
    ward: s.ward,
    locationText: s.locationText,
    urgency: s.urgency,
    summaryEn: s.summaryEn,
    summaryTe: s.summaryTe,
    confidence: s.confidence,
    channel: s.channel,
    needsHuman,
  };
}

/** Submissions awaiting human validation (low confidence / received without merge). */
export async function fetchValidationQueue() {
  const rows = await db
    .select()
    .from(submissions)
    .where(
      and(
        inArray(submissions.status, ["received", "extracted"]),
        or(
          isNull(submissions.confidence),
          lt(submissions.confidence, CONFIG.extraction.minConfidence),
          eq(submissions.channel, "news"),
        ),
        or(isNull(submissions.demandId), eq(submissions.status, "received")),
      ),
    );

  const mergePendingIds = await pendingMergeSubmissionIds();
  const mergeSet = new Set(mergePendingIds);

  const items = rows
    .filter((s) => !mergeSet.has(s.id) || s.status === "received")
    .map(submissionToValidationItem);

  return items;
}

async function pendingMergeSubmissionIds(): Promise<string[]> {
  const queued = await db
    .select()
    .from(events)
    .where(eq(events.eventType, "MergeReviewQueued"))
    .orderBy(desc(events.id));

  const latestBySubmission = new Map<string, (typeof queued)[0]>();
  for (const ev of queued) {
    if (!ev.submissionId) continue;
    if (!latestBySubmission.has(ev.submissionId)) {
      latestBySubmission.set(ev.submissionId, ev);
    }
  }

  const ids: string[] = [];
  for (const [submissionId] of latestBySubmission) {
    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);
    if (sub && sub.status !== "merged" && sub.status !== "rejected") {
      ids.push(submissionId);
    }
  }
  return ids;
}

/** Ambiguous-band merge review items (thetaLo..thetaHi). */
export async function fetchMergeReviewQueue() {
  const submissionIds = await pendingMergeSubmissionIds();
  if (!submissionIds.length) return [];

  const items = [];
  for (const submissionId of submissionIds) {
    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);
    if (!sub) continue;

    const mergeEvent = await db.query.events.findFirst({
      where: and(
        eq(events.submissionId, submissionId),
        eq(events.eventType, "MergeReviewQueued"),
      ),
      orderBy: [desc(events.id)],
    });
    if (!mergeEvent) continue;

    const payload = mergeEvent.payload as Record<string, unknown>;
    const candidateDemandId = payload.candidateDemandId as string | undefined;
    if (!candidateDemandId) continue;

    const [candidate] = await db
      .select()
      .from(demands)
      .where(eq(demands.id, candidateDemandId))
      .limit(1);
    if (!candidate) continue;

    items.push({
      submissionId: sub.id,
      submission: {
        ...submissionToValidationItem(sub),
        lat: sub.lat,
        lng: sub.lng,
      },
      candidateDemand: {
        id: candidate.id,
        title: candidate.title,
        ward: candidate.ward,
        affectedCount: candidate.affectedCount,
        lat: candidate.lat,
        lng: candidate.lng,
        category: candidate.category,
      },
      score: (payload.score as number) ?? 0,
      components: {
        text: payload.textScore as number | undefined,
        geo: payload.geoScore as number | undefined,
      },
    });
  }

  return items;
}

/** Quarantined submissions grouped for the coordination review tab. */
export async function fetchQuarantineClusters() {
  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.status, "quarantined"));

  if (!rows.length) return [];

  const byKey = new Map<string, typeof rows>();
  for (const s of rows) {
    const key = `${s.category ?? "unknown"}:${s.ward ?? "unknown"}`;
    const list = byKey.get(key) ?? [];
    list.push(s);
    byKey.set(key, list);
  }

  return Array.from(byKey.entries()).map(([key, subs]) => ({
    id: key,
    submissions: subs.map((s) => ({
      id: s.id,
      refId: s.refId,
      citizenKey: s.citizenKey,
      rawText: s.rawText,
      createdAt: s.createdAt.toISOString(),
      identityAge:
        s.citizenKey.startsWith("ATTACK-") ||
        s.citizenKey.startsWith("COLD-") ||
        s.citizenKey.startsWith("SYN-")
          ? ("new" as const)
          : ("aged" as const),
    })),
    coordinationScore: undefined,
    textSimilarity: undefined,
  }));
}

export async function fetchRoutingAmbiguityQueue() {
  const rows = await db
    .select()
    .from(demands)
    .where(
      and(
        eq(demands.state, "validated_public"),
        isNull(demands.authorityId)
      )
    );

  const items = [];
  for (const demand of rows) {
    const proposal = await proposeRouting({
      category: demand.category,
      ward: demand.ward,
    });

    if ("needsHuman" in proposal && proposal.needsHuman) {
      items.push({
        demandId: demand.id,
        title: demand.title,
        category: demand.category,
        ward: demand.ward,
        urgency: demand.urgency,
        reason: proposal.reason,
        candidates: proposal.candidates,
      });
    }
  }
  return items;
}

export async function fetchTranscriptionQueue() {
  return db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.status, "received"),
        or(
          and(
            eq(submissions.channel, "voice"),
            or(
              isNull(submissions.confidence),
              lt(submissions.confidence, CONFIG.extraction.minConfidence)
            )
          ),
          lt(submissions.asrConfidence, CONFIG.extraction.minConfidence)
        )
      )
    )
    .then(rows => rows.map(submissionToValidationItem));
}
