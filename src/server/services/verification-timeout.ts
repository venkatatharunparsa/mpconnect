/**
 * Verification timeout — fix_claimed demands past timeoutDays → resolved_unverified.
 * NEVER counted as verified anywhere.
 */
import { db } from "@/server/db";
import { demands, events } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { CONFIG } from "@/server/config";
import { appendEvent } from "@/server/services/events";
import { transition } from "@/server/services/lifecycle";
import type { DemandState } from "@/server/services/lifecycle";

export async function processVerificationTimeouts(): Promise<{ timedOut: string[] }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CONFIG.verification.timeoutDays);

  const fixClaimed = await db
    .select()
    .from(demands)
    .where(eq(demands.state, "fix_claimed"));

  const timedOut: string[] = [];

  for (const demand of fixClaimed) {
    const fixEvent = await db.query.events.findFirst({
      where: and(eq(events.demandId, demand.id), eq(events.eventType, "FixClaimed")),
      orderBy: [desc(events.id)],
    });

    if (!fixEvent || fixEvent.occurredAt > cutoff) continue;

    const newState = transition(demand.state as DemandState, "verify_timeout");

    await db
      .update(demands)
      .set({
        state: newState,
        verifiedResolved: false,
        updatedAt: new Date(),
      })
      .where(eq(demands.id, demand.id));

    await appendEvent({
      eventType: "VerificationTimedOut",
      demandId: demand.id,
      actorType: "system",
      actorId: "verification-timeout",
      payload: { previousState: demand.state, newState, timeoutDays: CONFIG.verification.timeoutDays },
    });

    timedOut.push(demand.id);
  }

  return { timedOut };
}
