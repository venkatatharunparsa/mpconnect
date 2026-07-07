export type SubmitLocale = "en" | "te";

export const SUBMIT_LABELS = {
  title: { en: "Tell us your problem", te: "మీ సమస్య చెప్పండి" },
  placeholder: { en: "Type in Telugu or English…", te: "తెలుగు లేదా ఇంగ్లీష్ లో టైప్ చేయండి…" },
  send: { en: "Send", te: "పంపు" },
  mic: { en: "Hold to record", te: "రికార్డ్ చేయండి" },
  photo: { en: "Photo", te: "ఫోటో" },
  safety: {
    en: "Safety notice: Officials carry ID. Never pay unofficial fees. Your report is logged with a reference ID.",
    te: "భద్రతా నోటీసు: అధికారులు గుర్తింపు చూపుతారు. అనధికార ఫీజులు చెల్లించవద్దు.",
  },
  thinking: { en: "Understanding your message…", te: "మీ సందేశం అర్థం చేసుకుంటున్నాం…" },
  apiPending: {
    en: "Intake API pending — your message was captured locally for demo.",
    te: "API వేచి ఉంది — డెమో కోసం సందేశం స్థానికంగా సేవ్ అయింది.",
  },
  refLookup: { en: "Looking up reference…", te: "రిఫరెన్స్ చూస్తున్నాం…" },
  demoIdentity: { en: "Demo identity", te: "డెమో గుర్తింపు" },
} as const;

export function t(key: keyof typeof SUBMIT_LABELS, locale: SubmitLocale): string {
  return SUBMIT_LABELS[key][locale];
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  mediaUrl?: string;
  audioUrl?: string;
}
