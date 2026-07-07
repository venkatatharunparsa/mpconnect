import { db } from "@/db";
import { wards } from "@/db/schema";
import { jsonOk, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const rows = await db.select().from(wards);
    return jsonOk(rows);
  } catch (err) {
    return handleApiError(err);
  }
}
