import type { UiLocale } from "./types";

const LABELS = {
  dashboardTitle: { en: "MP Command Center", te: "ఎంపీ కమాండ్ సెంటర్" },
  rankedDemands: { en: "Ranked demands", te: "అగ్ర ప్రాధాన్య డిమాండ్లు" },
  totalDemands: { en: "Total demands", te: "మొత్తం డిమాండ్లు" },
  citizensHeard: { en: "Citizens heard", te: "విన్న పౌరులు" },
  verifiedRate: { en: "Verified resolution rate", te: "ధృవీకరించిన పరిష్కార రేటు" },
  reopened: { en: "Reopened", te: "మళ్లీ తెరిచినవి" },
  noDemands: { en: "No demands yet", te: "ఇంకా డిమాండ్లు లేవు" },
  noDemandsHint: {
    en: "Citizen submissions will appear here once merged into demands.",
    te: "పౌరుల సమర్పణలు డిమాండ్లుగా కలిసిన తర్వాత ఇక్కడ కనిపిస్తాయి.",
  },
  affects: { en: "affects", te: "ప్రభావితం" },
  citizens: { en: "citizens", te: "పౌరులు" },
  urgency: { en: "Urgency", te: "అత్యవసరత" },
  score: { en: "Priority score", te: "ప్రాధాన్య స్కోర్" },
  timeline: { en: "Timeline", te: "కాలక్రమం" },
  evidence: { en: "Evidence", te: "సాక్ష్యం" },
  mplads: { en: "MPLADS", te: "ఎంపీఎల్ఏడీఎస్" },
  roleCitizen: { en: "Citizen", te: "పౌరుడు" },
  roleOfficial: { en: "Official", te: "అధికారి" },
  roleMp: { en: "MP", te: "ఎంపీ" },
  markWorkDone: { en: "Mark work done", te: "పని పూర్తయింది" },
  approveRouting: { en: "Approve routing", te: "రూటింగ్ ఆమోదించు" },
  waitingApi: { en: "Waiting on platform API.", te: "ప్లాట్‌ఫారమ్ API కోసం వేచి ఉంది." },
  mapUnavailable: { en: "Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_KEY", te: "మ్యాప్ అందుబాటులో లేదు" },
  loading: { en: "Loading demands…", te: "డిమాండ్లు లోడ్ అవుతున్నాయి…" },
  scoreBreakdown: { en: "Score breakdown", te: "స్కోర్ వివరణ" },
  ward: { en: "Ward", te: "వార్డు" },
  category: { en: "Category", te: "వర్గం" },
  state: { en: "State", te: "స్థితి" },
} as const;

export type LabelKey = keyof typeof LABELS;

export function t(key: LabelKey, locale: UiLocale): string {
  return LABELS[key][locale];
}
