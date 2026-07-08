import { getUnresolvedDemands, updateDemand } from "@/server/repositories/demand";
import { getVerifiedAuthorityById } from "@/server/repositories/authority";
import { appendEvent } from "@/server/services/lifecycle/events";

const SLA_DAYS: Record<string, number> = {
  streetlights: 3,
  potholes_roads: 7,
  garbage: 2,
  drainage: 3,
  water_supply: 1,
  water_leakage: 2,
  electricity: 1,
  school_upgrade: 30,
  health_facility: 30,
  parks_playgrounds: 14,
  community_infra: 30,
  vocational_training: 30,
  transport: 14,
  land_revenue: 15,
  pensions_welfare: 7,
  pollution: 10,
  encroachment: 15,
  safety_hazard: 1,
};

function getSlaDays(category: string): number {
  return SLA_DAYS[category] ?? 15; // default 15 days SLA
}

/** Checks all unresolved demands for SLA breaches and escalates them up the authority hierarchy. */
export async function processEscalations(): Promise<{ escalatedIds: string[] }> {
  const demandsList = await getUnresolvedDemands();
  const escalatedIds: string[] = [];

  for (const demand of demandsList) {
    if (!demand.authorityId) continue;

    // Check if SLA has breached
    const slaDays = getSlaDays(demand.category);
    const breachThreshold = new Date(demand.updatedAt);
    breachThreshold.setDate(breachThreshold.getDate() + slaDays);

    if (new Date() > breachThreshold) {
      // Fetch current authority to find its parent
      const currentAuth = await getVerifiedAuthorityById(demand.authorityId);
      if (currentAuth && currentAuth.escalationParentId) {
        // Escalate to parent!
        const parentAuth = await getVerifiedAuthorityById(currentAuth.escalationParentId);
        const parentName = parentAuth ? parentAuth.name : `Authority ID ${currentAuth.escalationParentId}`;

        await updateDemand(demand.id, {
          authorityId: currentAuth.escalationParentId,
          updatedAt: new Date(),
        });

        await appendEvent({
          eventType: "Escalated",
          demandId: demand.id,
          actorType: "system",
          actorId: "escalation-engine",
          payload: {
            reason: "SLA_breach",
            previousAuthorityId: currentAuth.id,
            previousAuthorityName: currentAuth.name,
            newAuthorityId: currentAuth.escalationParentId,
            newAuthorityName: parentName,
            slaDays,
          },
        });

        escalatedIds.push(demand.id);
      }
    }
  }

  return { escalatedIds };
}
