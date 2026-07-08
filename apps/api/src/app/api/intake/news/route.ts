import { NextRequest } from "next/server";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { ingestNewsArticle } from "@/server/services/intake/news-ingest";
import { withTracing } from "@/server/core/logger";

export async function POST(req: NextRequest) {
  return withTracing(req, async () => {
    try {
      const body = await parseJsonBody<{
        headline: string;
        articleText: string;
        sourceUrl: string;
        publisher?: string;
      }>(req);

      if (!body.headline || !body.articleText || !body.sourceUrl) {
        return jsonError("Missing required fields: headline, articleText, sourceUrl", 400);
      }

      const res = await ingestNewsArticle(body);
      if (res.ignored) {
        return jsonOk({ status: "ignored" });
      }

      return jsonOk({
        submissionId: res.submissionId,
        refId: res.refId,
        status: "received",
      });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
