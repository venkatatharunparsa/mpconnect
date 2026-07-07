import { GoogleGenerativeAI } from "@google/generative-ai";

const SCHEME_CORPUS = `
# Scheme & Funding Corpus — v0.1

## 1. MPLADS
- pilot sponsor (MP, Visakhapatnam) controls. Governed by Revised MPLADS Guidelines 2023.
- Budget: ₹5 crore per MP per year.
- Earmarks: >= 15% (₹30L) for SC-inhabited areas, >= 7.5% (₹15L) for ST areas.
- Process & SLAs: MP recommends work -> District Authority must inform rejection within 45 days (with reasons) -> eligible works sanctioned within 75 days.
- Permitted Works: durable community assets (roads, drains, school rooms, drinking water, streetlights, community halls).

## 2. Central Urban Missions
- AMRUT 2.0: Urban water supply (universal tap coverage), sewerage/septage. Outlay: ₹2,77,000 cr. FY22-FY26.
- Swachh Bharat Mission-Urban 2.0 (SBM-U 2.0): Sanitation, garbage-free cities, solid waste management, public toilets. Outlay: ₹1,41,600 cr. FY22-FY26.
- 15th Finance Commission Grants: direct to GVMC for water/sanitation untied + tied.

## 3. Rural/Peri-Urban Routes
- Jal Jeevan Mission (JJM): rural functional household tap connections.
- MGNREGA: rural wage works: internal roads, drains, water conservation; labor component.
- Panchayat Raj engineering & 15th FC panchayat grants: village infrastructure.

## 4. AP State Schemes - The "Super Six" (Personal Entitlements)
- NTR Bharosa Pensions: ₹4,000/month (raised from ₹3,000 in July 2024); for elderly, widows, disabled, single women, weavers, fisherfolk, HIV+, etc. Outlay: ₹27,518 cr.
- Talliki Vandanam: ₹15,000/year per school child (classes 1-12, govt & private) to mothers. Outlay: ₹9,407 cr.
- Annadata Sukhibhava: ₹20,000/year per farmer. Outlay: ₹6,300 cr.
- Deepam 2.0: 3 free LPG cylinders/year for 90.1 lakh beneficiaries. Outlay: ₹2,601 cr.
- Free bus travel for women: launched 15 Aug 2025 on APSRTC buses.
- Yuva Galam: jobs + unemployment allowance for youth.
`;

export interface HelpDeskInput {
  question: string;
}

export interface HelpDeskResult {
  answer: string;
  hasVerifiedAnswer: boolean;
}

export async function queryHelpDesk(input: HelpDeskInput): Promise<HelpDeskResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith("mock") || key === "") {
    // Return mock answers based on keyword matching
    const q = input.question.toLowerCase();
    if (q.includes("pension") || q.includes("భరోసా") || q.includes("పించన్")) {
      return {
        answer: "NTR Bharosa pensions provide ₹4,00,000 per month (mock value) / ₹4,000 per month (raised from ₹3,000 in July 2024) to elderly, widows, disabled, and other groups. [AP State Schemes - NTR Bharosa]",
        hasVerifiedAnswer: true,
      };
    }
    if (q.includes("mplads") || q.includes("fund") || q.includes("నిధులు")) {
      return {
        answer: "MPLADS grants ₹5 crore per MP per year. MP recommends the work. Rejections must be informed within 45 days, and sanctions done within 75 days. [MPLADS]",
        hasVerifiedAnswer: true,
      };
    }
    if (q.includes("school") || q.includes("vandanam") || q.includes("వందనం")) {
      return {
        answer: "Talliki Vandanam provides ₹15,000/year per school child (classes 1-12, govt & private) to mothers. [AP State Schemes - Talliki Vandanam]",
        hasVerifiedAnswer: true,
      };
    }
    return {
      answer: "I don't have verified information on that.",
      hasVerifiedAnswer: false,
    };
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `You are the MPconnect AI Help Desk agent.
Your task is to answer citizens' eligibility and procedural questions strictly using the provided SCHEME CORPUS.
STRICT RULES:
1. Do not use outside knowledge.
2. If the answer to the user's question is not directly present in the SCHEME CORPUS below, you MUST respond exactly with "I don't have verified information on that" and refuse to speculate.
3. For any valid claim, cite the relevant section in brackets, e.g. [MPLADS] or [NTR Bharosa].
4. Answer in the same language as the question (Telugu or English).

SCHEME CORPUS:
${SCHEME_CORPUS}`,
  });

  const response = await model.generateContent(input.question);
  const text = response.response.text();
  const answer = text ? text.trim() : "I don't have verified information on that";
  const hasVerifiedAnswer = !answer.includes("I don't have verified information on that");

  return {
    answer,
    hasVerifiedAnswer,
  };
}
