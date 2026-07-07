import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands, verifications } from "@/server/db/schema";
import { jsonOk, handleApiError } from "@/server/services/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const citizenKey = req.nextUrl.searchParams.get("citizenKey");
    if (!citizenKey) {
      return jsonOk([]);
    }

    const pending = await db
      .select({
        id: verifications.id,
        demandId: verifications.demandId,
        status: verifications.status,
        createdAt: verifications.createdAt,
        demandTitle: demands.title,
        demandState: demands.state,
        ward: demands.ward,
      })
      .from(verifications)
      .innerJoin(demands, eq(verifications.demandId, demands.id))
      .where(
        and(eq(verifications.citizenKey, citizenKey), eq(verifications.status, "pending")),
      );

    return jsonOk(pending);
  } catch (err) {
    return handleApiError(err);
  }
}
