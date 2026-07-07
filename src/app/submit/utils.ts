import type { GeminiExtraction } from "@/lib/gemini";

/** Low location confidence or missing location → one clarifying question. */
export function needsLocationClarify(extraction: GeminiExtraction): boolean {
  const loc = extraction.locationText?.trim();
  return extraction.confidence < 0.6 || !loc || loc.length < 3;
}

export function formatStatusLines(
  lang: "en" | "te",
  t: (key: string, vars?: Record<string, string>) => string,
  refId: string,
  data: {
    status: string;
    demand?: { title: string; state: string } | null;
  },
): string {
  const lines = [t("statusTitle", { refId }), t("statusState", { status: data.status })];
  if (data.demand) {
    lines.push(t("statusDemand", { title: data.demand.title }));
    lines.push(t("statusNext", { step: data.demand.state }));
  }
  return lines.join("\n");
}
