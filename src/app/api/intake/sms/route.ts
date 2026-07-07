import { NextRequest } from "next/server";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { processIncomingSms } from "@/server/services/intake/sms-intake";
import { withTracing } from "@/server/core/logger";

export async function POST(req: NextRequest) {
  return withTracing(req, async () => {
    try {
      const body = await parseJsonBody<{
        senderPhone: string;
        smsText: string;
      }>(req);

      if (!body.senderPhone || !body.smsText) {
        return jsonError("Missing required fields: senderPhone, smsText", 400);
      }

      const res = await processIncomingSms(body);
      return jsonOk({
        submissionId: res.submissionId,
        refId: res.refId,
        status: res.status,
      });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
