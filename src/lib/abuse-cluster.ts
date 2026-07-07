/**
 * Cluster quarantine check — integration hook for merge engine (Person C).
 */
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { and, eq, gte, ne, or } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import { coordinationScore, type SubmissionForScoring } from "@/lib/abuse";
import { appendEvent } from "@/lib/events";

/** Find recent lookalike submissions and quarantine if coordination score is high. */
export async function checkCluster(submissionId: string): Promise<{
  quarantined: boolean;
  score?: number;
  clusterIds?: string[];
}> {
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub || sub.status === "quarantined") {
    return { quarantined: sub?.status === "quarantined" };
  }

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - CONFIG.abuse.burstWindowMinutes);

  const candidates = await db
    .select()
    .from(submissions)
    .where(
      and(
        gte(submissions.createdAt, windowStart),
        or(
          eq(submissions.category, sub.category ?? ""),
          eq(submissions.ward, sub.ward ?? ""),
        ),
        ne(submissions.status, "rejected"),
      ),
    );

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

  const clusterIds: string[] = [];
  for (const s of candidates) {
    if (s.status === "quarantined") continue;
    await db.update(submissions).set({ status: "quarantined" }).where(eq(submissions.id, s.id));
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
      },
    });
  }

  return { quarantined: true, score: result.score, clusterIds };
}
