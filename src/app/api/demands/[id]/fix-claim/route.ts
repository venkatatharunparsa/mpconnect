import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { demands, submissions, verifications } from "@/server/db/schema";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { CONFIG } from "@/server/core/config";
import { appendEvent } from "@/server/services/lifecycle/events";
import { transition } from "@/server/services/lifecycle/lifecycle";
import type { DemandState } from "@/server/services/lifecycle/lifecycle";

const bodySchema = z
  .object({
    actorId: z.string().min(1),
    evidenceUrl: z.string().url().optional(),
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

    const currentState = demand.state as DemandState;
    let newState: DemandState;
    try {
      newState = transition(currentState, "fix_claim");
    } catch {
      try {
        newState = transition(currentState, "start_progress");
        await db
          .update(demands)
          .set({ state: newState, updatedAt: new Date() })
          .where(eq(demands.id, params.id));
        await appendEvent({
          eventType: "WorkStarted",
          demandId: params.id,
          actorType: "human",
          actorId: body.actorId,
          payload: {},
        });
        newState = transition(newState, "fix_claim");
      } catch {
        return jsonError(`Cannot fix-claim from state: ${demand.state}`, 409);
      }
    }

    await db
      .update(demands)
      .set({ state: newState, updatedAt: new Date() })
      .where(eq(demands.id, params.id));

    await appendEvent({
      eventType: "FixClaimed",
      demandId: params.id,
      actorType: "human",
      actorId: body.actorId,
      payload: { evidenceUrl: body.evidenceUrl ?? null },
    });

    const reporters = await db
      .select({ citizenKey: submissions.citizenKey, createdAt: submissions.createdAt })
      .from(submissions)
      .where(eq(submissions.demandId, params.id));

    const seen = new Set<string>();
    const distinct = reporters
      .filter((r) => {
        if (seen.has(r.citizenKey)) return false;
        seen.add(r.citizenKey);
        return true;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, CONFIG.verification.pollReporters);

    const createdVerifications = [];
    for (const r of distinct) {
      const [v] = await db
        .insert(verifications)
        .values({ demandId: params.id, citizenKey: r.citizenKey })
        .returning();
      createdVerifications.push(v);
    }

    return jsonOk({
      demandId: params.id,
      state: newState,
      verifications: createdVerifications.map((v) => ({
        id: v.id,
        citizenKey: v.citizenKey,
        status: v.status,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
