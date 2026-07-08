export const dynamic = "force-dynamic";

import { db } from "@/server/db";
import { wards } from "@/server/db/schema";
import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";

export async function GET() {
  try {
    const rows = await db.select().from(wards);
    return jsonOk(rows);
  } catch (err) {
    return handleApiError(err);
  }
}
