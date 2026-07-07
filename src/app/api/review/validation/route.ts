import { jsonOk, handleApiError } from "@/server/services/api-helpers";
import { fetchValidationQueue } from "@/server/services/review-queues";

export async function GET() {
  try {
    const items = await fetchValidationQueue();
    return jsonOk(items);
  } catch (err) {
    return handleApiError(err);
  }
}
