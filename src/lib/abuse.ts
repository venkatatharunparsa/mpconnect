/**
 * Abuse defense — coordination scoring (docs/abuse-defense-v1.0.md L4).
 */
import { CONFIG } from "@/lib/config";

export interface SubmissionForScoring {
  id: string;
  citizenKey: string;
  rawText?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: Date;
}

export interface CoordinationSignals {
  burst: number;
  identityColdness: number;
  textTemplating: number;
  geoImplausibility: number;
}

export interface CoordinationResult {
  score: number;
  signals: CoordinationSignals;
  suspicious: boolean;
}

/** Trigram set for Jaccard similarity. */
function trigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const grams = new Set<string>();
  for (let i = 0; i < normalized.length - 2; i++) {
    grams.add(normalized.slice(i, i + 3));
  }
  return grams;
}

/** Jaccard similarity between two strings (0-1). */
export function textSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 && tb.size === 0) return 1;
  let intersection = 0;
  for (const g of ta) {
    if (tb.has(g)) intersection++;
  }
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Pairwise max text similarity across cluster. */
function maxTextSimilarity(submissions: SubmissionForScoring[]): number {
  let max = 0;
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const a = submissions[i].rawText ?? "";
      const b = submissions[j].rawText ?? "";
      max = Math.max(max, textSimilarity(a, b));
    }
  }
  return max;
}

/** Score burst: submissions within burstWindowMinutes vs threshold. */
function burstScore(submissions: SubmissionForScoring[]): number {
  if (submissions.length < 2) return 0;
  const sorted = [...submissions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const windowMs = CONFIG.abuse.burstWindowMinutes * 60 * 1000;
  let maxInWindow = 1;
  for (let i = 0; i < sorted.length; i++) {
    let count = 1;
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].createdAt.getTime() - sorted[i].createdAt.getTime() <= windowMs) {
        count++;
      } else break;
    }
    maxInWindow = Math.max(maxInWindow, count);
  }
  return Math.min(1, maxInWindow / CONFIG.abuse.burstCountSuspicious);
}

/** Share of citizenKeys that look "cold" (SYN- prefix or ATTACK- for demo). */
function identityColdnessScore(submissions: SubmissionForScoring[]): number {
  if (submissions.length === 0) return 0;
  const cold = submissions.filter(
    (s) =>
      s.citizenKey.startsWith("SYN-") ||
      s.citizenKey.startsWith("ATTACK-") ||
      s.citizenKey.startsWith("COLD-"),
  ).length;
  return cold / submissions.length;
}

/** Geo implausibility: missing coords or all identical. */
function geoImplausibilityScore(submissions: SubmissionForScoring[]): number {
  if (submissions.length < 2) return 0;
  const withGeo = submissions.filter((s) => s.lat != null && s.lng != null);
  if (withGeo.length === 0) return 0.8;
  const first = `${withGeo[0].lat},${withGeo[0].lng}`;
  const allSame = withGeo.every((s) => `${s.lat},${s.lng}` === first);
  return allSame ? 1 : 0.2;
}

/**
 * Compute coordination score 0-1 from recent submissions in a candidate cluster.
 * Weights: burst 0.3, identity 0.25, text 0.3, geo 0.15.
 */
export function coordinationScore(submissions: SubmissionForScoring[]): CoordinationResult {
  if (submissions.length < 2) {
    return {
      score: 0,
      signals: { burst: 0, identityColdness: 0, textTemplating: 0, geoImplausibility: 0 },
      suspicious: false,
    };
  }

  const signals: CoordinationSignals = {
    burst: burstScore(submissions),
    identityColdness: identityColdnessScore(submissions),
    textTemplating: maxTextSimilarity(submissions),
    geoImplausibility: geoImplausibilityScore(submissions),
  };

  const score =
    signals.burst * 0.3 +
    signals.identityColdness * 0.25 +
    signals.textTemplating * 0.3 +
    signals.geoImplausibility * 0.15;

  return {
    score,
    signals,
    suspicious: score >= CONFIG.abuse.coordinationScoreThreshold,
  };
}
