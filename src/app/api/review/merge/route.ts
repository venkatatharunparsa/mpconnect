import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";
import { fetchMergeReviewQueue } from "@/server/repositories/review-queues";

export async function GET() {
  try {
    const items = await fetchMergeReviewQueue();
    return jsonOk(items);
  } catch (err) {
    return handleApiError(err);
  }
}
