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
  isEscalated?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
