export const dynamic = "force-dynamic";

import { db } from "@/server/db";
import { authorities } from "@/server/db/schema";
import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";

export async function GET() {
  try {
    const rows = await db.select().from(authorities);
    return jsonOk(
      rows.map((a) => ({
        id: a.id,
        name: a.name,
        org: a.org,
        level: a.level,
        categories: a.categories,
        verified: a.verified,
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
