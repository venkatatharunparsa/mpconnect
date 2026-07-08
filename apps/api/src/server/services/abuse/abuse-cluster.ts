/**
 * Cluster quarantine check — integration hook for merge engine (Person C).
 */
import { CONFIG } from "@/server/core/config";
import {
  coordinationScore,
  textSimilarity,
  type SubmissionForScoring,
} from "@/server/services/abuse/abuse";
import { appendEvent } from "@/server/services/lifecycle/events";
import { getSubmissionById, updateSubmission, getRecentIntakeCandidates } from "@/server/repositories/submission";

/** Pick the longest rawText as the cluster's dominant template for per-sub similarity. */
export function dominantTemplate(cluster: SubmissionForScoring[]): string {
  let best = "";
  for (const s of cluster) {
    const t = s.rawText?.trim() ?? "";
    if (t.length > best.length) best = t;
  }
  return best;
}

/** Submissions that should be quarantined given a suspicious coordination score. */
export function submissionsToQuarantine(
  candidates: SubmissionForScoring[],
  template: string,
): string[] {
  if (!template) return [];
  const threshold = CONFIG.abuse.textSimilaritySuspicious;
  return candidates
    .filter((s) => {
      const text = s.rawText?.trim() ?? "";
      return text.length > 0 && textSimilarity(text, template) >= threshold;
    })
    .map((s) => s.id);
}

/** Find recent lookalike submissions and quarantine if coordination score is high. */
export async function checkCluster(submissionId: string): Promise<{
  quarantined: boolean;
  score?: number;
  clusterIds?: string[];
 }> {
  const sub = await getSubmissionById(submissionId);
  if (!sub || sub.status === "quarantined") {
    return { quarantined: sub?.status === "quarantined" };
  }

  if (!sub.category || !sub.ward) {
    return { quarantined: false };
  }

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - CONFIG.abuse.burstWindowMinutes);

  const candidates = await getRecentIntakeCandidates(windowStart, sub.category, sub.ward);

  const cluster: SubmissionForScoring[] = candidates.map((s) => ({
    id: s.id,
    citizenKey: s.citizenKey,
    rawText: s.rawText,
    lat: s.lat,
    lng: s.lng,
    createdAt: s.createdAt,
  }));

  const result = coordinationScore(cluster);
  if (!result.suspicious) return { quarantined: false, score: result.score };

  const template = dominantTemplate(cluster);
  const toQuarantine = new Set(submissionsToQuarantine(cluster, template));
  if (!toQuarantine.size) return { quarantined: false, score: result.score };

  const clusterIds: string[] = [];
  for (const s of candidates) {
    if (!toQuarantine.has(s.id)) continue;

    await updateSubmission(s.id, { status: "quarantined" });
    clusterIds.push(s.id);

    await appendEvent({
      eventType: "ClusterQuarantined",
      submissionId: s.id,
      demandId: s.demandId,
      actorType: "system",
      actorId: "abuse-detector",
      payload: {
        coordinationScore: result.score,
        signals: result.signals,
        clusterSize: cluster.length,
        textSimilarityToTemplate: textSimilarity(s.rawText ?? "", template),
      },
    });
  }

  return {
    quarantined: clusterIds.length > 0,
    score: result.score,
    clusterIds,
  };
}
