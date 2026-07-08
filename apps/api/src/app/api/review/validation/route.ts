import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";
import { fetchValidationQueue } from "@/server/repositories/review-queues";

export async function GET() {
  try {
    const items = await fetchValidationQueue();
    return jsonOk(items);
  } catch (err) {
    return handleApiError(err);
  }
}
