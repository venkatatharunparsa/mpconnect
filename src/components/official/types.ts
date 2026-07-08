export type DemandState =
  | "claimed"
  | "validated_public"
  | "routed"
  | "in_progress"
  | "fix_claimed"
  | "resolved_verified"
  | "reopened"
  | "resolved_unverified";

export type UiLocale = "en" | "te";

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
  falseClosureCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isEscalated?: boolean;
  authorityId?: number | null;
}
