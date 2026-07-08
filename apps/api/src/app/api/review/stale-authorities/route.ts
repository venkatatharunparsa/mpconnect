import { NextRequest } from "next/server";
import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";
import { fetchStaleAuthorities } from "@/server/repositories/authority";
import { withTracing } from "@/server/core/logger";

export async function GET(req: NextRequest) {
  return withTracing(req, async () => {
    try {
      const items = await fetchStaleAuthorities();
      return jsonOk(items);
    } catch (err) {
      return handleApiError(err);
    }
  });
}
