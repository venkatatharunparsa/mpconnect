import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { appendEvent } from "@/server/services/lifecycle/events";
import { withTracing } from "@/server/core/logger";

const bodySchema = z
  .object({
    actorId: z.string().min(1),
    entryType: z.enum(["complaint", "response", "inspection", "media"]),
    description: z.string().min(1),
    mediaHash: z.string().optional(),
  })
  .strict();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withTracing(req, async () => {
    try {
      const body = bodySchema.parse(await parseJsonBody(req));
      const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
      if (!demand) return jsonError("Demand not found", 404);
      if (demand.kind !== "dispute") {
        return jsonError("Demand is not classified as a DISPUTE", 400);
      }

      await appendEvent({
        eventType: "DisputeEntryAppended",
        demandId: params.id,
        actorType: "human",
        actorId: body.actorId,
        payload: {
          entryType: body.entryType,
          description: body.description,
          mediaHash: body.mediaHash ?? null,
        },
      });

      return jsonOk({
        demandId: params.id,
        success: true,
      });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
