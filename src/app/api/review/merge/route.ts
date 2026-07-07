import { jsonOk, handleApiError } from "@/server/services/api-helpers";
import { fetchMergeReviewQueue } from "@/server/services/review-queues";

export async function GET() {
  try {
    const items = await fetchMergeReviewQueue();
    return jsonOk(items);
  } catch (err) {
    return handleApiError(err);
  }
}
