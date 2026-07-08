/** Client-safe shared types and constants (no server imports). */

export interface GeminiExtraction {
  kind: "suggestion" | "grievance";
  category: string;
  locationText?: string;
  urgency: "low" | "medium" | "high" | "safety";
  summaryEn: string;
  summaryTe: string;
  lang: "te" | "en" | "mixed";
  confidence: number;
}

export type ExtractSubmissionResult =
  | { needsHuman: true; raw: unknown }
  | { needsHuman: false; extraction: GeminiExtraction };

export function isValidRefIdFormat(refId: string): boolean {
  return /^VZG-\d{4}-\d{5}$/.test(refId);
}

export { TAXONOMY, CATEGORY_CODES, PERSONAL_CATEGORIES } from "./taxonomy";
export type { Category } from "./taxonomy";
