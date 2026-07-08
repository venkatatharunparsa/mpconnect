import { NextRequest } from "next/server";
import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";
import { processEscalations } from "@/server/services/lifecycle/escalation";
import { withTracing } from "@/server/core/logger";

export async function POST(req: NextRequest) {
  return withTracing(req, async () => {
    try {
      const res = await processEscalations();
      return jsonOk({
        escalatedIds: res.escalatedIds,
      });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
