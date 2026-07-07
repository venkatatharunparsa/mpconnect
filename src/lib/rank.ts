import { db } from "@/db";
import { demands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

export interface RankBreakdown {
  affected: number;
  urgency: number;
  recurrence: number;
  equity: number;
  dataGap: number;
}

/** Compute the rank score (0-1) and breakdown for a demand. */
export function computeRank(
  affectedCount: number,
  urgency: string,
  falseClosureCount: number,
  dataGapScore = 0
): { score: number; breakdown: RankBreakdown } {
  // Affected score: log-scaled and normalized (log(count)/log(50), capped at 1.0)
  const affectedScore = affectedCount <= 1 
    ? 0.1 
    : Math.min(1.0, Math.log(affectedCount) / Math.log(50));

  // Urgency mapping: safety=1.0, high=0.7, medium=0.4, low=0.2
  let urgencyScore = 0.4;
  if (urgency === "safety") urgencyScore = 1.0;
  else if (urgency === "high") urgencyScore = 0.7;
  else if (urgency === "medium") urgencyScore = 0.4;
  else if (urgency === "low") urgencyScore = 0.2;

  // Recurrence score: based on falseClosureCount (e.g. 0.5 per false closure, capped at 1.0)
  const recurrenceScore = Math.min(1.0, falseClosureCount * 0.5);

  // Equity score: stubbed to 0 for pilot wards as per spec
  const equityScore = 0;

  const breakdown: RankBreakdown = {
    affected: affectedScore,
    urgency: urgencyScore,
    recurrence: recurrenceScore,
    equity: equityScore,
    dataGap: dataGapScore,
  };

  const score =
    breakdown.affected * CONFIG.rank.weights.affected +
    breakdown.urgency * CONFIG.rank.weights.urgency +
    breakdown.recurrence * CONFIG.rank.weights.recurrence +
    breakdown.equity * CONFIG.rank.weights.equity +
    breakdown.dataGap * CONFIG.rank.weights.dataGap;

  return { score, breakdown };
}

/** Recompute and save the rank score for a given demand. */
export async function recomputeRank(demandId: string, dataGapScore?: number): Promise<void> {
  const [demand] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);
  if (!demand) return;

  let finalDataGap = 0;
  if (dataGapScore !== undefined) {
    finalDataGap = dataGapScore;
  } else if (demand.rankBreakdown) {
    finalDataGap = (demand.rankBreakdown as Record<string, any>).dataGap || 0;
  }

  const { score, breakdown } = computeRank(
    demand.affectedCount,
    demand.urgency,
    demand.falseClosureCount,
    finalDataGap
  );

  await db
    .update(demands)
    .set({
      rankScore: score,
      rankBreakdown: breakdown,
      updatedAt: new Date(),
    })
    .where(eq(demands.id, demandId));
}
