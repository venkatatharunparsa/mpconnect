import { db } from "@/db";
import { demands, datasets } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { recomputeRank } from "@/lib/rank";
import { narrateComparison } from "@/lib/gemini";

export interface EvidenceResult {
  demandStats: {
    id: string;
    title: string;
    category: string;
    ward: string;
    affectedCount: number;
    rankScore: number;
  };
  datasetRows: Array<{
    metric: string;
    value: number;
    source: string;
    sourceUrl: string;
    estimated: boolean;
  }>;
  competitor: {
    id: string;
    title: string;
    category: string;
    rankScore: number;
  } | null;
  narrative: string;
}

/** Pulls dataset rows, computes dataGap, re-ranks, finds competitors, and generates narration. */
export async function evidenceFor(demandId: string): Promise<EvidenceResult> {
  // 1. Fetch current demand details
  const [demand] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);
  if (!demand) throw new Error("Demand not found");

  // 2. Fetch all dataset rows for the ward
  const allWardData = await db
    .select()
    .from(datasets)
    .where(eq(datasets.ward, demand.ward ?? ""));

  // Filter based on category mappings:
  // school_upgrade -> school_enrollment, classrooms, nearest_govt_school_km
  let datasetRows = allWardData;
  if (demand.category === "school_upgrade") {
    datasetRows = allWardData.filter((r) =>
      ["school_enrollment", "classrooms", "nearest_govt_school_km"].includes(r.metric)
    );
  }

  // 3. Compute dataGap heuristic component
  // RTE Act norm is 30 students per classroom.
  // Student-to-classroom ratio deficit is used as the data gap indicator.
  let dataGapScore = 0.0;
  if (demand.category === "school_upgrade") {
    const enrollment = datasetRows.find((r) => r.metric === "school_enrollment")?.value || 0;
    const classrooms = datasetRows.find((r) => r.metric === "classrooms")?.value ?? 0;
    
    // If classrooms are 0 or extremely low, we have a significant infrastructure deficit
    const ratio = classrooms > 0 ? enrollment / classrooms : enrollment;
    if (ratio > 30) {
      dataGapScore = Math.min(1.0, (ratio - 30) / 100);
    }
  } else {
    // Default fallback gap score for other category statistics
    dataGapScore = 0.1;
  }

  // 4. Update the demand's rank score with the computed dataGapScore
  await recomputeRank(demandId, dataGapScore);

  // Re-fetch demand to get updated rank score and breakdown
  const [updatedDemand] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);

  // 5. Find competing demands in the same ward (sorted by rankScore desc)
  const competingDemands = await db
    .select()
    .from(demands)
    .where(and(eq(demands.ward, demand.ward ?? ""), ne(demands.id, demandId)));

  let competitor: EvidenceResult["competitor"] = null;
  if (competingDemands.length > 0) {
    competingDemands.sort((a, b) => b.rankScore - a.rankScore);
    competitor = {
      id: competingDemands[0].id,
      title: competingDemands[0].title,
      category: competingDemands[0].category,
      rankScore: competingDemands[0].rankScore,
    };
  }

  // 6. Format numbers payload for strict, numbers-only Gemini comparison narrative
  const numbers: Record<string, unknown> = {
    demandAffectedCount: updatedDemand.affectedCount,
  };

  for (const r of datasetRows) {
    const label = r.estimated ? `${r.metric} (estimate)` : r.metric;
    numbers[label] = r.value;
  }

  if (competitor) {
    numbers.competitorRankScore = competitor.rankScore;
  }

  const narrative = await narrateComparison(numbers);

  return {
    demandStats: {
      id: updatedDemand.id,
      title: updatedDemand.title,
      category: updatedDemand.category,
      ward: updatedDemand.ward ?? "",
      affectedCount: updatedDemand.affectedCount,
      rankScore: updatedDemand.rankScore,
    },
    datasetRows: datasetRows.map((r) => ({
      metric: r.metric,
      value: r.value,
      source: r.source,
      sourceUrl: r.sourceUrl,
      estimated: r.estimated ?? false,
    })),
    competitor,
    narrative,
  };
}
