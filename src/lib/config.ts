/** Thresholds & weights — sacred contract #5 (config-not-code). Tune here only. */
export const CONFIG = {
  merge: {
    thetaHi: 0.82, // >= auto-merge
    thetaLo: 0.6, // < new demand; between = human review queue
    geoRadiusKm: 1.5,
    timeWindowDays: 60,
    weights: { text: 0.55, geo: 0.25, category: 0.15, time: 0.05 },
  },
  extraction: {
    minConfidence: 0.6, // below → human validation queue
  },
  corroboration: {
    // abuse-defense L3: publish only with k independent voices OR strong evidence
    k: 3,
    publishWithEvidenceAnd: 1,
  },
  abuse: {
    maxSubmissionsPerIdentityPerDay: 3, // soft cap → review queue, never drop
    burstWindowMinutes: 30,
    burstCountSuspicious: 8,
    textSimilaritySuspicious: 0.93, // templated wording
  },
  rank: {
    weights: { affected: 0.35, urgency: 0.2, recurrence: 0.1, equity: 0.1, dataGap: 0.25 },
  },
  verification: {
    timeoutDays: 14,
    pollReporters: 3,
  },
  refIdPrefix: "VZG",
} as const;
