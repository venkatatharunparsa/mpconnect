import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demands } from "@/db/schema";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";

/** Delegates to Person C's evidence.ts when available. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
    if (!demand) return jsonError("Demand not found", 404);

    try {
      const mod = await import("@/lib/evidence");
      if (typeof mod.evidenceFor === "function") {
        const evidence = await mod.evidenceFor(params.id);
        return jsonOk(evidence);
      }
    } catch {
      // evidence.ts not yet implemented
    }

    return jsonOk({
      demandId: params.id,
      demandStats: {
        title: demand.title,
        affectedCount: demand.affectedCount,
        ward: demand.ward,
        category: demand.category,
      },
      status: "pending",
      note: "Evidence module (Person C) will populate dataset fusion + narrative",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
