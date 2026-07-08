import { z } from "zod";
import { CATEGORY_CODES } from "@/server/core/taxonomy";

const categoryEnum = z.enum(CATEGORY_CODES as [string, ...string[]]);

export const extractionSchema = z
  .object({
    kind: z.enum(["suggestion", "grievance"]),
    category: categoryEnum,
    locationText: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    ward: z.string().optional(),
    urgency: z.enum(["low", "medium", "high", "safety"]),
    summaryEn: z.string().max(200),
    summaryTe: z.string().max(200).optional(),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export const intakeSchema = z
  .object({
    channel: z.enum(["web", "telegram", "voice", "news", "sms"]),
    citizenKey: z.string().min(1),
    rawText: z.string().optional(),
    mediaUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    lang: z.enum(["te", "en", "mixed"]).optional(),
    extraction: extractionSchema.optional(),
    /** When true, intake skips merge — corpus calls processSubmission after backdating. */
    deferMerge: z.boolean().optional(),
  })
  .strict();

export type IntakeBody = z.infer<typeof intakeSchema>;
export type ExtractionBody = z.infer<typeof extractionSchema>;
