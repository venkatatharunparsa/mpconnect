import { NextRequest } from "next/server";
import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";
import { fetchTranscriptionQueue } from "@/server/repositories/review-queues";
import { withTracing } from "@/server/core/logger";

export async function GET(req: NextRequest) {
  return withTracing(req, async () => {
    try {
      const items = await fetchTranscriptionQueue();
      return jsonOk(items);
    } catch (err) {
      return handleApiError(err);
    }
  });
}
