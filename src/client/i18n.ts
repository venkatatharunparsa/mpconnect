export type Lang = "en" | "te";

export const STRINGS = {
  en: {
    title: "Tell us your problem",
    placeholder: "Type your message…",
    send: "Send",
    micStart: "Hold to record",
    micStop: "Release to send",
    photo: "Photo",
    safetyNotice:
      "Safety notice: Officials carry ID. Never pay unofficial fees. This line is for community development needs only.",
    registered:
      "Your issue is registered. Ref: {refId}. Track anytime by sending this ID.",
    readbackPrompt: "Is this correct?\n{summary}\n\n1 = correct · 2 = fix",
    readbackCorrect: "Thanks — confirmed.",
    readbackFix: "Please type or say the correction.",
    locationClarify: "Which area? (ward or landmark)",
    extractionFailed: "We could not understand that. A human reviewer will look at it.",
    statusTitle: "Status for {refId}",
    statusState: "State: {status}",
    statusDemand: "Merged into demand: {title}",
    statusNext: "Next: {step}",
    verificationPrompt: "Was this fixed? — {title}",
    confirmFixed: "Yes, fixed",
    denyNotFixed: "No, not fixed",
    demoIdentity: "Demo identity",
    thinking: "…",
    rateCapReview:
      "Your report was received — it is under human review awaiting corroboration.",
  },
  te: {
    title: "మీ సమస్య చెప్పండి", // TODO_TE
    placeholder: "సందేశం టైప్ చేయండి…", // TODO_TE
    send: "పంపు", // TODO_TE
    micStart: "రికార్డ్ చేయడానికి నొక్కి ఉంచండి", // TODO_TE
    micStop: "పంపడానికి వదలండి", // TODO_TE
    photo: "ఫోటో", // TODO_TE
    safetyNotice:
      "భద్రతా నోటీసు: అధికారులు ID తో వస్తారు. అనధికార ఫీజులు చెల్లించవద్దు.", // TODO_TE
    registered:
      "మీ సమస్య నమోదైంది. Ref: {refId}. ఈ ID పంపిస్తే స్థితి తెలుసుకోవచ్చు.", // TODO_TE
    readbackPrompt: "సరైనదేనా?\n{summary}\n\n1 = సరి · 2 = మార్చు", // TODO_TE
    readbackCorrect: "ధన్యవాదాలు — నిర్ధారించబడింది.", // TODO_TE
    readbackFix: "దయచేసి సరిదిద్దుకోండి.", // TODO_TE
    locationClarify: "ఏ ప్రాంతంలో? / Which area?", // TODO_TE
    extractionFailed: "అర్థం కాలేదు. మనుషులు చూస్తారు.", // TODO_TE
    statusTitle: "{refId} స్థితి", // TODO_TE
    statusState: "స్థితి: {status}", // TODO_TE
    statusDemand: "డిమాండ్: {title}", // TODO_TE
    statusNext: "తదుపరి: {step}", // TODO_TE
    verificationPrompt: "పరిష్కరించారా? — {title}", // TODO_TE
    confirmFixed: "అవును, పరిష్కరించారు", // TODO_TE
    denyNotFixed: "లేదు, పరిష్కరించలేదు", // TODO_TE
    demoIdentity: "డెమో గుర్తింపు", // TODO_TE
    thinking: "…", // TODO_TE
    rateCapReview:
      "మీ నివేదిక స్వీకరించబడింది — ధృవీకరణ కోసం మానవ సమీక్షలో ఉంది.", // TODO_TE
  },
} as const;

export function t(lang: Lang, key: keyof (typeof STRINGS)["en"], vars?: Record<string, string>): string {
  let s: string = STRINGS[lang][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, v);
    }
  }
  return s;
}
