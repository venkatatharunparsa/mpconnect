import { NextRequest } from "next/server";
import { extractSubmission } from "@/server/services/gemini";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/api-helpers";
import { z } from "zod";

const bodySchema = z
  .object({
    audioBase64: z.string().min(1),
    audioMime: z.string().min(1),
    text: z.string().optional(),
  })
  .strict();

/** Voice page fallback: multimodal extraction from recorded audio. */
export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await parseJsonBody(req));
    const result = await extractSubmission({
      audioBase64: body.audioBase64,
      audioMime: body.audioMime,
      text: body.text,
    });
    if (result.needsHuman) {
      return jsonError("Extraction needs human review", 422, { raw: result.raw });
    }
    return jsonOk({ extraction: result.extraction });
  } catch (err) {
    return handleApiError(err);
  }
}
