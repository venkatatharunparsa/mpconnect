import { jsonOk, handleApiError } from "@/server/services/intake/api-helpers";
import { fetchQuarantineClusters } from "@/server/repositories/review-queues";

export async function GET() {
  try {
    const clusters = await fetchQuarantineClusters();
    return jsonOk(clusters);
  } catch (err) {
    return handleApiError(err);
  }
}
