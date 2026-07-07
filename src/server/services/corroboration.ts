/**
 * Corroboration gate — promote claimed demands when k independent voices reached.
 */
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { CONFIG } from "@/server/config";
import { appendEvent } from "@/server/services/events";
import { transition } from "@/server/services/lifecycle";
import type { DemandState } from "@/server/services/lifecycle";

/** Auto-promote demand if affectedCount >= corroboration.k and still claimed. */
export async function checkCorroboration(demandId: string): Promise<boolean> {
  const [demand] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);
  if (!demand) return false;
  if (demand.state !== "claimed") return false;
  if (demand.affectedCount < CONFIG.corroboration.k) return false;

  const newState = transition(demand.state as DemandState, "validate");

  await db
    .update(demands)
    .set({
      state: newState,
      visibility: "public",
      updatedAt: new Date(),
    })
    .where(eq(demands.id, demandId));

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

  return true;
}
