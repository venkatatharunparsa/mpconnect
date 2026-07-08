/**
 * Corroboration gate — promote claimed demands when k independent voices reached.
 */
import { CONFIG } from "@/server/core/config";
import { appendEvent } from "@/server/services/lifecycle/events";
import { transition } from "@/server/services/lifecycle/lifecycle";
import type { DemandState } from "@/server/services/lifecycle/lifecycle";
import { getDemandById, updateDemand } from "@/server/repositories/demand";
import { notifyReportersForDemand } from "@/server/services/notifications/notify";

/** Auto-promote demand if affectedCount >= corroboration.k and still claimed. */
export async function checkCorroboration(demandId: string): Promise<boolean> {
  const demand = await getDemandById(demandId);
  if (!demand) return false;
  if (demand.state !== "claimed") return false;
  if (demand.affectedCount < CONFIG.corroboration.k) return false;

  const newState = transition(demand.state as DemandState, "validate");

  await updateDemand(demandId, {
    state: newState,
    visibility: "public",
    updatedAt: new Date(),
  });

  await appendEvent({
    eventType: "DemandCorroborated",
    demandId,
    actorType: "system",
    actorId: "corroboration-gate",
    payload: {
      affectedCount: demand.affectedCount,
      k: CONFIG.corroboration.k,
      newState,
    },
  });

  await notifyReportersForDemand(demandId, "validated");

  return true;
}
