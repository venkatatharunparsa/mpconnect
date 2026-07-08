/**
 * Verification timeout — fix_claimed demands past timeoutDays → resolved_unverified.
 * NEVER counted as verified anywhere.
 */
import { CONFIG } from "@/server/core/config";
import { appendEvent } from "@/server/services/lifecycle/events";
import { transition } from "@/server/services/lifecycle/lifecycle";
import type { DemandState } from "@/server/services/lifecycle/lifecycle";
import { getDemandsByState, updateDemand } from "@/server/repositories/demand";
import { findFirstEventByType } from "@/server/repositories/event";
import { notifyReportersForDemand } from "@/server/services/notifications/notify";

export async function processVerificationTimeouts(): Promise<{ timedOut: string[] }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CONFIG.verification.timeoutDays);

  const fixClaimed = await getDemandsByState("fix_claimed");

  const timedOut: string[] = [];

  for (const demand of fixClaimed) {
    const fixEvent = await findFirstEventByType(demand.id, "FixClaimed");

    if (!fixEvent || fixEvent.occurredAt > cutoff) continue;

    const newState = transition(demand.state as DemandState, "verify_timeout");

    await updateDemand(demand.id, {
      state: newState,
      verifiedResolved: false,
      updatedAt: new Date(),
    });

    await appendEvent({
      eventType: "VerificationTimedOut",
      demandId: demand.id,
      actorType: "system",
      actorId: "verification-timeout",
      payload: { previousState: demand.state, newState, timeoutDays: CONFIG.verification.timeoutDays },
    });

    await notifyReportersForDemand(demand.id, "resolved_unverified");

    timedOut.push(demand.id);
  }

  return { timedOut };
}
