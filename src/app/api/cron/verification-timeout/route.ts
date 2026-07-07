import { jsonOk, handleApiError } from "@/server/services/api-helpers";
import { processVerificationTimeouts } from "@/server/services/verification-timeout";

export async function GET() {
  try {
    const result = await processVerificationTimeouts();
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
