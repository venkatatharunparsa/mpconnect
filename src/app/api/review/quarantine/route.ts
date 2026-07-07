import { jsonOk, handleApiError } from "@/server/services/api-helpers";
import { fetchQuarantineClusters } from "@/server/services/review-queues";

export async function GET() {
  try {
    const clusters = await fetchQuarantineClusters();
    return jsonOk(clusters);
  } catch (err) {
    return handleApiError(err);
  }
}
