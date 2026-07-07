import { jsonOk, handleApiError } from "@/lib/api-helpers";
import { processVerificationTimeouts } from "@/lib/verification-timeout";

export async function GET() {
  try {
    const result = await processVerificationTimeouts();
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
