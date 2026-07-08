import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";

export async function GET() {
  try {
    const allDemands = await db.select().from(demands);

    const totals = {
      totalDemands: allDemands.length,
      citizensHeard: allDemands.reduce((s, d) => s + d.affectedCount, 0),
      reopenedCount: allDemands.filter((d) => d.state === "reopened").length,
      verifiedCount: allDemands.filter((d) => d.verifiedResolved).length,
      unverifiedCount: allDemands.filter((d) => d.state === "resolved_unverified").length,
      fixClaimedCount: allDemands.filter((d) => d.state === "fix_claimed").length,
    };

    const verifiedRate =
      totals.verifiedCount + totals.unverifiedCount > 0
        ? totals.verifiedCount / (totals.verifiedCount + totals.unverifiedCount)
        : 0;

    const byWard = await db
      .select({
        ward: demands.ward,
        total: sql<number>`count(*)::int`,
        verified: sql<number>`sum(case when ${demands.verifiedResolved} then 1 else 0 end)::int`,
        falseClosures: sql<number>`sum(${demands.falseClosureCount})::int`,
        reopened: sql<number>`sum(case when ${demands.state} = 'reopened' then 1 else 0 end)::int`,
      })
      .from(demands)
      .groupBy(demands.ward);

    const byAuthority = await db
      .select({
        authorityId: demands.authorityId,
        total: sql<number>`count(*)::int`,
        verified: sql<number>`sum(case when ${demands.verifiedResolved} then 1 else 0 end)::int`,
        falseClosures: sql<number>`sum(${demands.falseClosureCount})::int`,
      })
      .from(demands)
      .where(sql`${demands.authorityId} is not null`)
      .groupBy(demands.authorityId);

    return jsonOk({
      ...totals,
      verifiedRate,
      byWard: byWard.map((w) => ({
        ward: w.ward ?? "unknown",
        total: w.total,
        verified: w.verified,
        verifiedRate: w.total > 0 ? w.verified / w.total : 0,
        falseClosures: w.falseClosures,
        reopened: w.reopened,
      })),
      byAuthority: byAuthority.map((a) => ({
        authorityId: a.authorityId,
        total: a.total,
        verified: a.verified,
        verifiedRate: a.total > 0 ? a.verified / a.total : 0,
        falseClosures: a.falseClosures,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
