import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demands } from "@/db/schema";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";

/** Delegates to Person C's mplads.ts when available. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
    if (!demand) return jsonError("Demand not found", 404);

    try {
      const mod = await import("@/lib/mplads");
      if (typeof mod.mpladsPack === "function") {
        const pack = await mod.mpladsPack(params.id);
        return jsonOk(pack);
      }
    } catch {
      // mplads.ts not yet implemented
    }

    return jsonOk({
      demandId: params.id,
      status: "pending",
      note: "MPLADS pack generator (Person C) will populate funding recommendation",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
