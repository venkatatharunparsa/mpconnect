import { NextRequest } from "next/server";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { queryHelpDesk } from "@/server/services/helpdesk/helpdesk";
import { withTracing } from "@/server/core/logger";

export async function POST(req: NextRequest) {
  return withTracing(req, async () => {
    try {
      const body = await parseJsonBody<{
        question: string;
      }>(req);

      if (!body.question) {
        return jsonError("Missing required field: question", 400);
      }

      const res = await queryHelpDesk(body);
      return jsonOk({
        answer: res.answer,
        hasVerifiedAnswer: res.hasVerifiedAnswer,
      });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
