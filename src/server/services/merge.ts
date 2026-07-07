import { db } from "@/server/db";
import { submissions, demands } from "@/server/db/schema";
import { eq, and, ne, gte, inArray } from "drizzle-orm";
import { checkCluster } from "@/server/services/abuse-cluster";
import { CONFIG } from "@/server/config";
import { embedText } from "@/server/services/gemini";
import { appendEvent } from "@/server/services/events";
import { checkCorroboration } from "@/server/services/corroboration";
import { recomputeRank } from "@/server/services/rank";

/** Haversine formula to compute distance in km between two lat/lng points. */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Compute dot product of two normalized vectors (cosine similarity). */
function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** Process a single submission, checking for quarantine and auto-merging/routing. */
export async function processSubmission(submissionId: string): Promise<void> {
  // 1. Call abuse defense check first. Quarantined reports never merge.
  const check = await checkCluster(submissionId);
  if (check.quarantined) {
    console.log(`Submission ${submissionId} quarantined. Skipping merge.`);
    return;
  }

  // 2. Fetch the submission details.
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub || sub.status === "quarantined" || sub.status === "rejected" || sub.status === "merged") {
    return;
  }

  // 3. Generate embedding if missing
  let submissionEmbedding = sub.embedding as number[] | null;
  if (!submissionEmbedding) {
    const textToEmbed = sub.summaryEn || sub.rawText || sub.category || "Empty";
    submissionEmbedding = await embedText(textToEmbed);
    await db
      .update(submissions)
      .set({ embedding: submissionEmbedding, status: "extracted" })
      .where(eq(submissions.id, submissionId));
  }

  // 4. Query candidate open demands in same category and time window
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - CONFIG.merge.timeWindowDays);

  const candidateDemands = await db
    .select()
    .from(demands)
    .where(
      and(
        eq(demands.category, sub.category ?? ""),
        gte(demands.updatedAt, thresholdDate),
        ne(demands.state, "resolved_verified"),
        ne(demands.state, "resolved_unverified")
      )
    );

  let bestDemand: typeof demands.$inferSelect | null = null;
  let bestScore = -1;
  let bestComponents = { text: 0, geo: 0, category: 1.0, time: 0 };

  // 5. Evaluate and score candidate demands
  for (const demand of candidateDemands) {
    // Filter candidates within geoRadius if both have coordinates
    let distKm = Infinity;
    let geoScore = 0;
    let inGeoRange = true;

    if (sub.lat != null && sub.lng != null && demand.lat != null && demand.lng != null) {
      distKm = haversineDistance(sub.lat, sub.lng, demand.lat, demand.lng);
      inGeoRange = distKm <= CONFIG.merge.geoRadiusKm;
      geoScore = Math.max(0, 1 - distKm / CONFIG.merge.geoRadiusKm);
    }

    if (!inGeoRange) continue;

    // Calculate text similarity against the average embedding of demand's submissions
    const demandSubs = await db.select().from(submissions).where(eq(submissions.demandId, demand.id));
    const subsWithEmbeddings = demandSubs.filter((s) => s.embedding != null);
    
    let textScore = 0;
    if (subsWithEmbeddings.length > 0) {
      const size = (subsWithEmbeddings[0].embedding as number[]).length;
      const avg = new Array(size).fill(0);
      for (const s of subsWithEmbeddings) {
        const emb = s.embedding as number[];
        for (let j = 0; j < size; j++) {
          avg[j] += emb[j];
        }
      }
      const mag = Math.sqrt(avg.reduce((sum, v) => sum + v * v, 0)) || 1;
      const demandEmbedding = avg.map((v) => v / mag);
      textScore = dotProduct(submissionEmbedding, demandEmbedding);
    }

    // Category score is 1.0 because we filter candidateDemands by eq(category)
    const categoryScore = 1.0;

    // Time decay score
    const ageMs = Math.abs(sub.createdAt.getTime() - demand.updatedAt.getTime());
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const timeScore = Math.max(0, 1 - ageDays / CONFIG.merge.timeWindowDays);

    const score =
      CONFIG.merge.weights.text * textScore +
      CONFIG.merge.weights.geo * geoScore +
      CONFIG.merge.weights.category * categoryScore +
      CONFIG.merge.weights.time * timeScore;

    if (score > bestScore) {
      bestScore = score;
      bestDemand = demand;
      bestComponents = { text: textScore, geo: geoScore, category: categoryScore, time: timeScore };
    }
  }

  // 6. Action decisions based on scores
  if (bestDemand && bestScore >= CONFIG.merge.thetaHi) {
    // A. Auto-merge
    await db.update(submissions).set({ demandId: bestDemand.id, status: "merged" }).where(eq(submissions.id, sub.id));

    await appendEvent({
      eventType: "MergedIntoDemand",
      demandId: bestDemand.id,
      submissionId: sub.id,
      actorType: "model",
      actorId: "gemini",
      payload: {
        score: bestScore,
        textScore: bestComponents.text,
        geoScore: bestComponents.geo,
        categoryScore: bestComponents.category,
        timeScore: bestComponents.time,
        auto: true,
      },
    });

    // Update original demand: affected count and average location coordinates
    const allSubs = await db.select().from(submissions).where(eq(submissions.demandId, bestDemand.id));
    const uniqueKeys = new Set(allSubs.map((s) => s.citizenKey));
    const withGeo = allSubs.filter((s) => s.lat != null && s.lng != null);

    const updateFields: Record<string, unknown> = {
      affectedCount: uniqueKeys.size,
      updatedAt: new Date(),
    };

    if (withGeo.length > 0) {
      updateFields.lat = withGeo.reduce((sum, s) => sum + s.lat!, 0) / withGeo.length;
      updateFields.lng = withGeo.reduce((sum, s) => sum + s.lng!, 0) / withGeo.length;
    }

    await db.update(demands).set(updateFields).where(eq(demands.id, bestDemand.id));
    await checkCorroboration(bestDemand.id);
    await recomputeRank(bestDemand.id);
    console.log(`Auto-merged submission ${sub.id} into demand ${bestDemand.id} (score: ${bestScore.toFixed(3)})`);
  } 
  else if (bestDemand && bestScore >= CONFIG.merge.thetaLo) {
    // B. Human Merge Review Queue
    await appendEvent({
      eventType: "MergeReviewQueued",
      submissionId: sub.id,
      actorType: "system",
      actorId: "merge-engine",
      payload: {
        candidateDemandId: bestDemand.id,
        score: bestScore,
        textScore: bestComponents.text,
        geoScore: bestComponents.geo,
      },
    });
    console.log(`Submission ${sub.id} routed to Merge Review Queue (score: ${bestScore.toFixed(3)})`);
  } 
  else {
    // C. Create New Demand
    const [newDemand] = await db
      .insert(demands)
      .values({
        title: sub.summaryEn || sub.rawText?.slice(0, 100) || sub.category || "New Issue",
        category: sub.category || "other",
        kind: sub.kind || "grievance",
        ward: sub.ward,
        lat: sub.lat,
        lng: sub.lng,
        affectedCount: 1,
        urgency: sub.urgency || "medium",
        state: "claimed",
        visibility: "claimed",
      })
      .returning();

    await db.update(submissions).set({ demandId: newDemand.id, status: "merged" }).where(eq(submissions.id, sub.id));

    await appendEvent({
      eventType: "DemandCreated",
      demandId: newDemand.id,
      submissionId: sub.id,
      actorType: "model",
      actorId: "gemini",
      payload: { source: "auto_merge_fallback" },
    });

    await checkCorroboration(newDemand.id);
    await recomputeRank(newDemand.id);
    console.log(`Created new demand ${newDemand.id} for submission ${sub.id}`);
  }
}

/** Processes a human review decision on a submission in the merge queue. */
export async function applyMergeReviewDecision(args: {
  submissionId: string;
  decision: "merge" | "new" | "attach";
  demandId?: string;
  actorId: string;
}) {
  const { submissionId, decision, demandId, actorId } = args;

  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) throw new Error("Submission not found");

  if (decision === "new" || !demandId) {
    // A. Create new demand from review
    const [newDemand] = await db
      .insert(demands)
      .values({
        title: sub.summaryEn || sub.rawText?.slice(0, 100) || sub.category || "New Issue",
        category: sub.category || "other",
        kind: sub.kind || "grievance",
        ward: sub.ward,
        lat: sub.lat,
        lng: sub.lng,
        affectedCount: 1,
        urgency: sub.urgency || "medium",
        state: "claimed",
        visibility: "claimed",
      })
      .returning();

    await db.update(submissions).set({ demandId: newDemand.id, status: "merged" }).where(eq(submissions.id, sub.id));

    await appendEvent({
      eventType: "DemandCreated",
      demandId: newDemand.id,
      submissionId: sub.id,
      actorType: "human",
      actorId,
      payload: { source: "human_review_new" },
    });

    await checkCorroboration(newDemand.id);
    await recomputeRank(newDemand.id);

    return { status: "success", demandId: newDemand.id };
  } else {
    // B. Merge or attach into existing demand
    await db.update(submissions).set({ demandId, status: "merged" }).where(eq(submissions.id, sub.id));

    await appendEvent({
      eventType: "MergedIntoDemand",
      demandId,
      submissionId: sub.id,
      actorType: "human",
      actorId,
      payload: { decision, source: "human_review" },
    });

    // Update original demand: affected count and average location coordinates
    const allSubs = await db.select().from(submissions).where(eq(submissions.demandId, demandId));
    const uniqueKeys = new Set(allSubs.map((s) => s.citizenKey));
    const withGeo = allSubs.filter((s) => s.lat != null && s.lng != null);

    const updateFields: Record<string, unknown> = {
      affectedCount: uniqueKeys.size,
      updatedAt: new Date(),
    };

    if (withGeo.length > 0) {
      updateFields.lat = withGeo.reduce((sum, s) => sum + s.lat!, 0) / withGeo.length;
      updateFields.lng = withGeo.reduce((sum, s) => sum + s.lng!, 0) / withGeo.length;
    }

    await db.update(demands).set(updateFields).where(eq(demands.id, demandId));
    await checkCorroboration(demandId);
    await recomputeRank(demandId);

    return { status: "success", demandId };
  }
}

/** Reversibly splits specified submissions out of a demand into a new separate demand. */
export async function split(
  demandId: string,
  submissionIds: string[],
  actorId = "human-operator"
): Promise<{ newDemandId: string }> {
  const splitSubs = await db.select().from(submissions).where(inArray(submissions.id, submissionIds));
  if (splitSubs.length === 0) throw new Error("No submissions found to split");

  const foreign = splitSubs.filter((s) => s.demandId !== demandId);
  if (foreign.length > 0) {
    throw new Error("One or more submissions do not belong to the source demand");
  }

  // Create new demand from first split submission
  const refSub = splitSubs[0];
  const [newDemand] = await db
    .insert(demands)
    .values({
      title: refSub.summaryEn || refSub.rawText?.slice(0, 100) || refSub.category || "Split Issue",
      category: refSub.category || "other",
      kind: refSub.kind || "grievance",
      ward: refSub.ward,
      lat: refSub.lat,
      lng: refSub.lng,
      affectedCount: 0,
      urgency: refSub.urgency || "medium",
      state: "claimed",
      visibility: "claimed",
    })
    .returning();

  // Re-associate split submissions to the new demand
  for (const sub of splitSubs) {
    await db.update(submissions).set({ demandId: newDemand.id }).where(eq(submissions.id, sub.id));
  }

  // Recalculate original demand
  const originalSubs = await db.select().from(submissions).where(eq(submissions.demandId, demandId));
  if (originalSubs.length > 0) {
    const uniqueKeys = new Set(originalSubs.map((s) => s.citizenKey));
    const withGeo = originalSubs.filter((s) => s.lat != null && s.lng != null);

    const updateFields: Record<string, unknown> = {
      affectedCount: uniqueKeys.size,
      updatedAt: new Date(),
    };

    if (withGeo.length > 0) {
      updateFields.lat = withGeo.reduce((sum, s) => sum + s.lat!, 0) / withGeo.length;
      updateFields.lng = withGeo.reduce((sum, s) => sum + s.lng!, 0) / withGeo.length;
    } else {
      updateFields.lat = null;
      updateFields.lng = null;
    }

    await db.update(demands).set(updateFields).where(eq(demands.id, demandId));

    await appendEvent({
      eventType: "ProblemSplit",
      demandId,
      actorType: "human",
      actorId,
      payload: {
        action: "split_from",
        toDemandId: newDemand.id,
        splitSubmissionIds: submissionIds,
      },
    });

    await recomputeRank(demandId);
    await checkCorroboration(demandId);
  } else {
    const [origin] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);
    await db
      .update(demands)
      .set({
        affectedCount: 0,
        title: `${origin?.title ?? "Demand"} (closed — split)`,
        updatedAt: new Date(),
      })
      .where(eq(demands.id, demandId));

    await appendEvent({
      eventType: "DemandEmptied",
      demandId,
      actorType: "system",
      actorId: actorId,
      payload: { reason: "all_submissions_split_out", toDemandId: newDemand.id },
    });
  }

  // Recalculate new demand
  const newDemandSubs = await db.select().from(submissions).where(eq(submissions.demandId, newDemand.id));
  const uniqueKeysNew = new Set(newDemandSubs.map((s) => s.citizenKey));
  const withGeoNew = newDemandSubs.filter((s) => s.lat != null && s.lng != null);

  const updateFieldsNew: Record<string, unknown> = {
    affectedCount: uniqueKeysNew.size,
    updatedAt: new Date(),
  };

  if (withGeoNew.length > 0) {
    updateFieldsNew.lat = withGeoNew.reduce((sum, s) => sum + s.lat!, 0) / withGeoNew.length;
    updateFieldsNew.lng = withGeoNew.reduce((sum, s) => sum + s.lng!, 0) / withGeoNew.length;
  }

  await db.update(demands).set(updateFieldsNew).where(eq(demands.id, newDemand.id));

  // Record split events on the new demand
  await appendEvent({
    eventType: "DemandCreated",
    demandId: newDemand.id,
    submissionId: refSub.id,
    actorType: "human",
    actorId,
    payload: { source: "split", fromDemandId: demandId },
  });

  await appendEvent({
    eventType: "ProblemSplit",
    demandId: newDemand.id,
    actorType: "human",
    actorId,
    payload: {
      action: "split_to",
      fromDemandId: demandId,
      splitSubmissionIds: submissionIds,
    },
  });

  await recomputeRank(newDemand.id);
  await checkCorroboration(newDemand.id);

  return { newDemandId: newDemand.id };
}
