import { NextRequest } from "next/server";
import { z } from "zod";
import { extractSubmission } from "@/server/clients/gemini";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";

const bodySchema = z
  .object({
    text: z.string().optional(),
    audioBase64: z.string().optional(),
    audioMime: z.string().optional(),
    imageBase64: z.string().optional(),
    imageMime: z.string().optional(),
  })
  .strict();

/** Multimodal extraction for separated frontend (replaces server actions). */
export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await parseJsonBody(req));
    if (!body.text && !body.audioBase64 && !body.imageBase64) {
      return jsonError("At least one of text, audioBase64, or imageBase64 is required", 400);
    }
    const result = await extractSubmission(body);
    if (result.needsHuman) {
      return jsonError("Extraction needs human review", 422, { raw: result.raw });
    }
    return jsonOk({ extraction: result.extraction });
  } catch (err) {
    return handleApiError(err);
  }
}
