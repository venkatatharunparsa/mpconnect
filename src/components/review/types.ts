// TODO: confirm shape with A — inferred from team-execution-plan + schema

export interface ExtractionFields {
  kind?: string;
  category?: string;
  ward?: string;
  locationText?: string;
  urgency?: string;
  summaryEn?: string;
  summaryTe?: string;
  confidence?: number;
  needsHuman?: boolean;
}

export interface ValidationItem {
  id: string;
  refId: string;
  rawText?: string | null;
  mediaUrl?: string | null;
  audioUrl?: string | null;
  lang?: string | null;
  extraction?: ExtractionFields;
  // flat fields if API returns merged shape
  kind?: string;
  category?: string;
  ward?: string;
  locationText?: string;
  urgency?: string;
  summaryEn?: string;
  summaryTe?: string;
  confidence?: number;
  needsHuman?: boolean;
}

export interface DemandSummary {
  id: string;
  title: string;
  ward?: string | null;
  affectedCount: number;
  lat?: number | null;
  lng?: number | null;
  category?: string;
}

export interface MergeReviewItem {
  submissionId: string;
  submission: ValidationItem & { lat?: number | null; lng?: number | null };
  candidateDemand: DemandSummary;
  score: number;
  components?: {
    text?: number;
    geo?: number;
    category?: number;
    time?: number;
    [key: string]: number | undefined;
  };
}

export interface QuarantineSubmission {
  id: string;
  refId: string;
  citizenKey: string;
  rawText?: string | null;
  createdAt: string;
  identityAge?: "new" | "aged";
}

export interface QuarantineCluster {
  id: string;
  submissions: QuarantineSubmission[];
  coordinationScore?: number;
  textSimilarity?: number;
  burstTimeline?: { bucket: string; count: number }[];
}

export type RejectReason =
  | "spam"
  | "duplicate"
  | "out_of_scope"
  | "insufficient_detail"
  | "personal_category_public";

export const REJECT_REASONS: { value: RejectReason; label: string }[] = [
  { value: "spam", label: "Spam / not genuine" },
  { value: "duplicate", label: "Duplicate of existing report" },
  { value: "out_of_scope", label: "Out of constituency scope" },
  { value: "insufficient_detail", label: "Insufficient detail" },
  { value: "personal_category_public", label: "Personal matter — not for public" },
];
