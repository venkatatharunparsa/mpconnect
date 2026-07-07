import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError } from "@/server/services/api-helpers";
import { withTracing } from "@/server/utils/logger";

/** Delegates to Person C's mplads.ts when available. */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  return withTracing(req, async () => {
    try {
      const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
      if (!demand) return jsonError("Demand not found", 404);

      try {
        const mod = await import("@/server/services/mplads");
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
  });
}
