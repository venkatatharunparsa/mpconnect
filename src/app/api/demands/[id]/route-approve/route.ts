import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { appendEvent } from "@/server/services/lifecycle/events";
import { transition } from "@/server/services/lifecycle/lifecycle";
import type { DemandState } from "@/server/services/lifecycle/lifecycle";
import { proposeRouting, getVerifiedAuthority } from "@/server/services/lifecycle/routing";

const bodySchema = z
  .object({
    authorityId: z.number().int().positive(),
    actorId: z.string().min(1),
    proposedAuthorityId: z.number().int().positive().optional(),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = bodySchema.parse(await parseJsonBody(req));
    const [demand] = await db.select().from(demands).where(eq(demands.id, params.id)).limit(1);
    if (!demand) return jsonError("Demand not found", 404);

    if (demand.state !== "validated_public" && demand.state !== "routed") {
      return jsonError(`Cannot route from state: ${demand.state}`, 409);
    }

    const authority = await getVerifiedAuthority(body.authorityId);
    if (!authority) {
      return jsonError("Authority not found or not verified — cannot auto-route", 400);
    }

    const proposal = await proposeRouting({ category: demand.category, ward: demand.ward });
    const newState =
      demand.state === "validated_public"
        ? transition(demand.state as DemandState, "route")
        : (demand.state as DemandState);

    await db
      .update(demands)
      .set({
        state: newState,
        authorityId: body.authorityId,
        updatedAt: new Date(),
      })
      .where(eq(demands.id, params.id));

    await appendEvent({
      eventType: "RoutingApproved",
      demandId: params.id,
      actorType: "human",
      actorId: body.actorId,
      payload: {
        authorityId: body.authorityId,
        authorityName: authority.name,
      },
    });

    if (
      body.proposedAuthorityId &&
      body.proposedAuthorityId !== body.authorityId &&
      !("needsHuman" in proposal)
    ) {
      await appendEvent({
        eventType: "RoutingCorrected",
        demandId: params.id,
        actorType: "human",
        actorId: body.actorId,
        payload: {
          proposedAuthorityId: body.proposedAuthorityId,
          correctedTo: body.authorityId,
        },
      });
    }

    return jsonOk({ demandId: params.id, state: newState, authorityId: body.authorityId });
  } catch (err) {
    return handleApiError(err);
  }
}
