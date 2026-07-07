import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { evidenceFor } from "@/server/services/evidence";

const COST_BANDS: Record<string, string> = {
  school_upgrade: "₹15,00,000 - ₹25,00,000 (demo band)",
  health_facility: "₹20,00,000 - ₹35,00,000 (demo band)",
  drainage: "₹8,00,000 - ₹15,00,000 (demo band)",
  streetlights: "₹3,00,000 - ₹6,00,000 (demo band)",
  other: "₹5,00,000 - ₹10,00,000 (demo band)",
};

export interface MpladsPackResult {
  workTitle: string;
  description: string;
  location: string;
  estimatedBeneficiaries: string;
  costBand: string;
  earmarkNote: string;
  statutoryClocks: {
    rejectionNoticeDays: number;
    sanctionDays: number;
    source: string;
  };
  watermark: string;
}

/** Generates a recommended MPLADS project pack for a demand. */
export async function mpladsPack(demandId: string): Promise<MpladsPackResult> {
  const [demand] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);
  if (!demand) throw new Error("Demand not found");

  // Load evidence comparison narrative to integrate into project description
  let narrativeSnippet = "";
  try {
    const evidence = await evidenceFor(demandId);
    narrativeSnippet = ` ${evidence.narrative}`;
  } catch (err) {
    console.warn("Could not load evidence for MPLADS description:", err);
  }

  const categoryKey = demand.category in COST_BANDS ? demand.category : "other";
  const costBand = COST_BANDS[categoryKey];

  const workTitle = `MPLADS Recommendation: ${demand.title}`;
  const description = `This proposal recommends funding under MPLADS for: ${demand.title}. Category: ${demand.category}. Ward: ${demand.ward}.${narrativeSnippet}`;
  const location = demand.ward ?? "Visakhapatnam Lok Sabha Constituency";
  
  // Calculate beneficiaries (affectedCount * average household size of 5)
  const householdCoefficient = 5;
  const estimatedBeneficiaries = `${demand.affectedCount * householdCoefficient} (estimate)`;

  // SC/ST earmarks note from standard MPLADS guidelines
  const earmarkNote = "Statutory Earmark Warning: Annual guidelines require MPs to recommend at least 15% of total annual allocations for areas inhabited by SC population and 7.5% for areas inhabited by ST population.";

  return {
    workTitle,
    description,
    location,
    estimatedBeneficiaries,
    costBand,
    earmarkNote,
    statutoryClocks: {
      rejectionNoticeDays: 45,
      sanctionDays: 75,
      source: "https://mplads.gov.in/mplads/Guidelines/Guidelines2023.pdf",
    },
    watermark: "AI-prepared advisory — decision and execution rest with the competent authority.",
  };
}
