import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demands, verifications } from "@/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/lib/api-helpers";
import { appendEvent } from "@/lib/events";
import { transition } from "@/lib/lifecycle";
import type { DemandState } from "@/lib/lifecycle";
import { evaluateVerificationQuorum } from "@/lib/verification";

const bodySchema = z
  .object({
    response: z.enum(["confirm", "deny"]),
    photoUrl: z.string().url().optional(),
    citizenKey: z.string().min(1),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = bodySchema.parse(await parseJsonBody(req));
    const verificationId = Number(params.id);
    if (Number.isNaN(verificationId)) return jsonError("Invalid verification ID", 400);

    const [v] = await db
      .select()
      .from(verifications)
      .where(eq(verifications.id, verificationId))
      .limit(1);

    if (!v) return jsonError("Verification not found", 404);
    if (v.citizenKey !== body.citizenKey) {
      return jsonError("Verification does not belong to this citizen", 403);
    }
    if (v.status !== "pending") {
      return jsonError(`Verification already ${v.status}`, 409);
    }

    const [demand] = await db.select().from(demands).where(eq(demands.id, v.demandId)).limit(1);
    if (!demand) return jsonError("Demand not found", 404);

    if (body.response === "deny") {
      await db
        .update(verifications)
        .set({
          status: "denied",
          photoUrl: body.photoUrl,
          respondedAt: new Date(),
        })
        .where(eq(verifications.id, verificationId));

      const newState = transition(demand.state as DemandState, "verify_deny");

      await db
        .update(demands)
        .set({
          state: newState,
          falseClosureCount: demand.falseClosureCount + 1,
          verifiedResolved: false,
          updatedAt: new Date(),
        })
        .where(eq(demands.id, v.demandId));

      await appendEvent({
        eventType: "VerificationDenied",
        demandId: v.demandId,
        actorType: "citizen",
        actorId: body.citizenKey,
        payload: { verificationId, photoUrl: body.photoUrl ?? null },
      });

      await appendEvent({
        eventType: "DemandReopened",
        demandId: v.demandId,
        actorType: "system",
        actorId: "verification-loop",
        payload: { reason: "citizen_denied_fix", falseClosureCount: demand.falseClosureCount + 1 },
      });

      return jsonOk({
        verificationId,
        demandId: v.demandId,
        state: newState,
        falseClosureCount: demand.falseClosureCount + 1,
      });
    }

    await db
      .update(verifications)
      .set({ status: "confirmed", respondedAt: new Date() })
      .where(eq(verifications.id, verificationId));

    await appendEvent({
      eventType: "VerificationConfirmed",
      demandId: v.demandId,
      actorType: "citizen",
      actorId: body.citizenKey,
      payload: { verificationId },
    });

    const allForDemand = await db
      .select()
      .from(verifications)
      .where(eq(verifications.demandId, v.demandId));

    const confirms = allForDemand.filter((x) => x.status === "confirmed").length;
    const denies = allForDemand.filter((x) => x.status === "denied").length;
    const quorum = evaluateVerificationQuorum(confirms, denies);

    if (quorum.outcome === "reopened") {
      return jsonOk({ verificationId, status: "confirmed", demandState: demand.state });
    }

    if (quorum.outcome === "resolved") {
      const newState = transition(demand.state as DemandState, "verify_confirm");
      await db
        .update(demands)
        .set({
          state: newState,
          verifiedResolved: true,
          updatedAt: new Date(),
        })
        .where(eq(demands.id, v.demandId));

      await appendEvent({
        eventType: "DemandResolvedVerified",
        demandId: v.demandId,
        actorType: "system",
        actorId: "verification-quorum",
        payload: { confirms, quorum: quorum.quorumNeeded },
      });

      return jsonOk({ verificationId, demandId: v.demandId, state: newState, verified: true });
    }

    return jsonOk({
      verificationId,
      status: "confirmed",
      confirms,
      quorumNeeded: quorum.quorumNeeded,
      demandState: demand.state,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
