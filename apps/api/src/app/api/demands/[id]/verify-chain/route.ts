import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError } from "@/server/services/intake/api-helpers";
import { verifyChain } from "@/server/services/lifecycle/events";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
    if (!demand) return jsonError("Demand not found", 404);

    const chain = await verifyChain(demand.id);
    return jsonOk(chain);
  } catch (err) {
    return handleApiError(err);
  }
}
