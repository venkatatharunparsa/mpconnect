// TODO: confirm shape with A — inferred from src/db/schema.ts + docs/team-execution-plan-v1.0.md

export type DemandState =
  | "claimed"
  | "validated_public"
  | "routed"
  | "in_progress"
  | "fix_claimed"
  | "resolved_verified"
  | "reopened"
  | "resolved_unverified";

export type DemoRole = "citizen" | "official" | "mp";
export type UiLocale = "en" | "te";

export interface RankBreakdown {
  affected?: number;
  urgency?: number;
  recurrence?: number;
  equity?: number;
  dataGap?: number;
  [key: string]: number | undefined;
}

export interface Demand {
  id: string;
  title: string;
  category: string;
  kind: string;
  ward: string | null;
  lat: number | null;
  lng: number | null;
  affectedCount: number;
  urgency: string;
  state: DemandState;
  visibility?: string;
  rankScore: number;
  rankBreakdown?: RankBreakdown | null;
  falseClosureCount?: number;
  verifiedResolved?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isEscalated?: boolean;
}

export interface WardGeoJson {
  type: string;
  coordinates?: number[][][] | number[][][][];
  features?: WardGeoJson[];
  geometry?: WardGeoJson;
}

export interface Ward {
  id: string;
  name: string;
  nameTe?: string | null;
  zone?: string | null;
  geojson: WardGeoJson;
}

export interface Stats {
  totalDemands: number;
  citizensHeard: number;
  verifiedResolutionRate: number;
  reopenedCount: number;
}

export interface EvidenceRow {
  metric: string;
  value: number;
  source: string;
  sourceUrl: string;
  estimated?: boolean;
  note?: string;
}

// TODO: confirm shape with A
export interface EvidenceResponse {
  rows?: EvidenceRow[];
  narrative?: string;
  [key: string]: unknown;
}

// TODO: confirm shape with A
export interface MpladsPack {
  title?: string;
  description?: string;
  beneficiaries?: number;
  costBand?: string;
  scstEarmark?: string;
  clocks?: { label: string; days: number }[];
  watermark?: string;
  [key: string]: unknown;
}
