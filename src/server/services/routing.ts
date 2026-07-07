/**
 * KB-based routing (sacred contract #2: citation-or-silence).
 * Never auto-propose unverified authorities.
 */
import { db } from "@/server/db";
import { authorities } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export interface RoutingProposal {
  authorityId: number;
  authorityName: string;
  basis: "kb";
}

export interface RoutingNeedsHuman {
  needsHuman: true;
  candidates: Array<{
    id: number;
    name: string;
    org: string;
    verified: boolean;
  }>;
  reason: string;
}

export type RoutingResult = RoutingProposal | RoutingNeedsHuman;

function categoryMatches(authorityCategories: unknown, category: string): boolean {
  if (!Array.isArray(authorityCategories)) return false;
  return authorityCategories.includes(category);
}

function wardMatches(authorityWards: unknown, ward: string | null | undefined): boolean {
  if (!ward) return true;
  if (authorityWards == null) return true;
  if (!Array.isArray(authorityWards)) return false;
  return authorityWards.includes(ward);
}

/** Propose routing for a demand based on category + ward. */
export async function proposeRouting(demand: {
  category: string;
  ward?: string | null;
}): Promise<RoutingResult> {
  const all = await db.select().from(authorities);

  const matching = all.filter(
    (a) => categoryMatches(a.categories, demand.category) && wardMatches(a.wards, demand.ward),
  );

  const verified = matching.filter((a) => a.verified);

  if (verified.length === 1) {
    return {
      authorityId: verified[0].id,
      authorityName: verified[0].name,
      basis: "kb",
    };
  }

  const reason =
    verified.length === 0
      ? matching.length > 0
        ? "Only unverified authorities match — human review required"
        : "No authority in KB for this category/ward"
      : `Multiple verified authorities match (${verified.length})`;

  return {
    needsHuman: true,
    candidates: matching.map((a) => ({
      id: a.id,
      name: a.name,
      org: a.org,
      verified: a.verified,
    })),
    reason,
  };
}

/** Verify an authority exists and is verified before routing approval. */
export async function getVerifiedAuthority(authorityId: number) {
  const [row] = await db
    .select()
    .from(authorities)
    .where(eq(authorities.id, authorityId))
    .limit(1);
  if (!row) return null;
  if (!row.verified) return null;
  return row;
}
