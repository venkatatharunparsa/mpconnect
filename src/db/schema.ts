/**
 * MPconnect schema — hackathon edition.
 * Sacred contract #1: `events` is append-only, hash-chained per demand.
 * Current state lives in `demands`/`submissions` but is always derivable from events.
 */
import {
  pgTable, text, timestamp, integer, real, boolean, jsonb, serial, uuid,
} from "drizzle-orm/pg-core";

/** Append-only event ledger. NEVER update or delete rows. */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // e.g. SubmissionReceived, DemandCreated, MergedIntoDemand, RoutingProposed, RoutingApproved, FixClaimed, VerificationConfirmed, VerificationDenied, DemandReopened, Quarantined
  demandId: uuid("demand_id"), // null until a demand exists
  submissionId: uuid("submission_id"),
  actorType: text("actor_type").notNull(), // 'citizen' | 'model' | 'human' | 'system'
  actorId: text("actor_id").notNull(),
  payload: jsonb("payload").notNull(),
  prevHash: text("prev_hash").notNull(), // SHA-256 of previous event in this demand's chain (or genesis)
  hash: text("hash").notNull(), // SHA-256 of this event's canonical form
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

/** One citizen submission via any channel. */
export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  refId: text("ref_id").notNull().unique(), // VZG-2607-00042
  channel: text("channel").notNull(), // 'web' | 'telegram' | 'voice'
  citizenKey: text("citizen_key").notNull(), // phone/chat identity (one voice per demand)
  rawText: text("raw_text"),
  mediaUrl: text("media_url"),
  audioUrl: text("audio_url"),
  lang: text("lang"), // 'te' | 'en' | 'mixed'
  // Gemini extraction (sacred contract #3: schema-validated before persist)
  kind: text("kind"), // 'suggestion' | 'grievance'
  category: text("category"), // taxonomy code from src/lib/taxonomy.ts
  locationText: text("location_text"),
  lat: real("lat"),
  lng: real("lng"),
  ward: text("ward"),
  urgency: text("urgency"), // 'low' | 'medium' | 'high' | 'safety'
  summaryEn: text("summary_en"),
  summaryTe: text("summary_te"),
  confidence: real("confidence"),
  embedding: jsonb("embedding"), // number[] — Gemini embedding for merge matching
  status: text("status").default("received").notNull(), // received | extracted | merged | quarantined | rejected
  demandId: uuid("demand_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Master Problem — the consolidated Demand. The system's atomic unit. */
export const demands = pgTable("demands", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  kind: text("kind").notNull(), // suggestion | grievance
  ward: text("ward"),
  lat: real("lat"),
  lng: real("lng"),
  affectedCount: integer("affected_count").default(1).notNull(), // distinct citizenKeys
  urgency: text("urgency").default("medium").notNull(),
  state: text("state").default("claimed").notNull(),
  // claimed -> validated_public -> routed -> in_progress -> fix_claimed -> resolved_verified | reopened | resolved_unverified
  visibility: text("visibility").default("claimed").notNull(), // claimed (unverified) | public
  authorityId: integer("authority_id"),
  rankScore: real("rank_score").default(0).notNull(),
  rankBreakdown: jsonb("rank_breakdown"), // {affected, urgency, recurrence, equity, dataGap}
  falseClosureCount: integer("false_closure_count").default(0).notNull(),
  verifiedResolved: boolean("verified_resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Authority registry — sacred contract #2 (citation-or-silence).
 * sourceUrl + verifiedOn are NOT NULL by design: an uncited authority cannot exist.
 * verified=false rows must never be auto-used for routing (human queue only).
 */
export const authorities = pgTable("authorities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // designation, not person: "GVMC Zonal Commissioner, Zone 4"
  org: text("org").notNull(), // 'GVMC' | 'Revenue' | 'APEPDCL' | 'Central' ...
  level: text("level").notNull(), // ward | zone | district | state | central
  categories: jsonb("categories").notNull(), // taxonomy codes this authority owns
  wards: jsonb("wards"), // ward ids covered, null = all
  escalationParentId: integer("escalation_parent_id"),
  sourceUrl: text("source_url").notNull(),
  sourceNote: text("source_note"),
  verifiedOn: text("verified_on").notNull(),
  verified: boolean("verified").notNull(), // false = quarantined from auto-routing
});

/** Public datasets for evidence panels (UDISE, Census). Real or explicitly estimated. */
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  ward: text("ward").notNull(),
  source: text("source").notNull(), // 'UDISE+' | 'Census 2011' ...
  sourceUrl: text("source_url").notNull(),
  metric: text("metric").notNull(), // 'school_enrollment' | 'classrooms' | 'nearest_school_km' | 'population' | 'literacy_rate'
  value: real("value").notNull(),
  estimated: boolean("estimated").default(false).notNull(), // true = render as estimate, always
  note: text("note"),
});

/** Pilot ward geometry (GeoJSON polygons; hackathon: 3 wards). */
export const wards = pgTable("wards", {
  id: text("id").primaryKey(), // 'gajuwaka' | 'mvp' | 'bheemili'
  name: text("name").notNull(),
  nameTe: text("name_te"),
  zone: text("zone"),
  geojson: jsonb("geojson").notNull(),
});

/** Citizen verification poll after an official fix claim. */
export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  demandId: uuid("demand_id").notNull(),
  citizenKey: text("citizen_key").notNull(),
  status: text("status").default("pending").notNull(), // pending | confirmed | denied
  photoUrl: text("photo_url"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
