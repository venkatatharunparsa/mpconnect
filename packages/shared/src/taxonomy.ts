/**
 * Problem taxonomy — sacred contract #5 (config-not-code).
 * Seeded from empirically documented GVMC complaint categories
 * (docs/functional-requirements-v1.0.md FR-UND-02; eGov/CEPT field study).
 * TODO_TE strings need native-speaker review before non-dev use.
 */
export interface Category {
  code: string;
  nameEn: string;
  nameTe: string; // TODO_TE where unreviewed
  defaultUrgency: "low" | "medium" | "high";
  lifecycleHint: "grievance" | "suggestion" | "either";
}

export const TAXONOMY: Category[] = [
  { code: "streetlights", nameEn: "Streetlights", nameTe: "వీధి దీపాలు", defaultUrgency: "medium", lifecycleHint: "grievance" },
  { code: "potholes_roads", nameEn: "Potholes / road damage", nameTe: "గుంతలు / రోడ్డు నష్టం", defaultUrgency: "medium", lifecycleHint: "grievance" },
  { code: "garbage", nameEn: "Garbage removal", nameTe: "చెత్త తొలగింపు", defaultUrgency: "medium", lifecycleHint: "grievance" },
  { code: "drainage", nameEn: "Drainage / desilting / stagnation", nameTe: "డ్రైనేజీ సమస్య", defaultUrgency: "medium", lifecycleHint: "grievance" },
  { code: "water_supply", nameEn: "Drinking water supply", nameTe: "తాగునీటి సరఫరా", defaultUrgency: "high", lifecycleHint: "either" },
  { code: "water_leakage", nameEn: "Water pipe leakage", nameTe: "నీటి పైపు లీకేజీ", defaultUrgency: "medium", lifecycleHint: "grievance" },
  { code: "electricity", nameEn: "Electricity issues", nameTe: "విద్యుత్ సమస్యలు", defaultUrgency: "high", lifecycleHint: "grievance" },
  { code: "school_upgrade", nameEn: "School infrastructure / upgrade", nameTe: "పాఠశాల మౌలిక సదుపాయాలు", defaultUrgency: "medium", lifecycleHint: "suggestion" },
  { code: "health_facility", nameEn: "Health centre / hospital needs", nameTe: "ఆరోగ్య కేంద్రం అవసరాలు", defaultUrgency: "high", lifecycleHint: "suggestion" },
  { code: "parks_playgrounds", nameEn: "Parks / playgrounds", nameTe: "పార్కులు / ఆట స్థలాలు", defaultUrgency: "low", lifecycleHint: "suggestion" },
  { code: "community_infra", nameEn: "Community infrastructure (halls, centres)", nameTe: "సామాజిక మౌలిక సదుపాయాలు", defaultUrgency: "low", lifecycleHint: "suggestion" },
  { code: "vocational_training", nameEn: "Vocational / skill centre", nameTe: "వృత్తి శిక్షణ కేంద్రం", defaultUrgency: "medium", lifecycleHint: "suggestion" },
  { code: "transport", nameEn: "Bus / transport connectivity", nameTe: "రవాణా సదుపాయం", defaultUrgency: "medium", lifecycleHint: "suggestion" },
  { code: "land_revenue", nameEn: "Land records / revenue (PERSONAL)", nameTe: "భూమి రికార్డులు", defaultUrgency: "medium", lifecycleHint: "grievance" },
  { code: "pensions_welfare", nameEn: "Pensions / welfare delivery (PERSONAL)", nameTe: "పింఛన్లు / సంక్షేమం", defaultUrgency: "high", lifecycleHint: "grievance" },
  { code: "pollution", nameEn: "Pollution / environment", nameTe: "కాలుష్యం", defaultUrgency: "high", lifecycleHint: "either" },
  { code: "encroachment", nameEn: "Encroachment of public space", nameTe: "ఆక్రమణ", defaultUrgency: "medium", lifecycleHint: "grievance" },
  { code: "safety_hazard", nameEn: "SAFETY HAZARD (live wire, collapse, sewage-in-water)", nameTe: "ప్రమాద హెచ్చరిక", defaultUrgency: "high", lifecycleHint: "grievance" },
  { code: "other", nameEn: "Other", nameTe: "ఇతర", defaultUrgency: "low", lifecycleHint: "either" },
];

export const CATEGORY_CODES = TAXONOMY.map((c) => c.code);
export const PERSONAL_CATEGORIES = ["land_revenue", "pensions_welfare"];
