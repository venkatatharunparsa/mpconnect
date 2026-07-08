import { describe, it, expect, vi } from "vitest";
import { ingestNewsArticle } from "@/server/services/intake/news-ingest";
import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { eq } from "drizzle-orm";

vi.mock("@/server/clients/gemini", () => ({
  extractSubmission: vi.fn().mockResolvedValue({
    needsHuman: false,
    extraction: {
      kind: "grievance",
      category: "streetlights",
      locationText: "RTC Complex Gajuwaka",
      lat: 17.6896,
      lng: 83.2185,
      ward: "Ward 60",
      urgency: "high",
      summaryEn: "Broken streetlight near GVMC park",
      summaryTe: "జీవీఎంసీ పార్క్ వద్ద విరిగిన వీధిలైటు",
      confidence: 0.95,
      lang: "te",
    },
  }),
}));

describe("news-ingest", () => {
  it("successfully ingests valid local news article and bypasses merge", async () => {
    const res = await ingestNewsArticle({
      headline: "Water stagnation in Gajuwaka ward 60",
      articleText: "Residents are facing huge issues due to water logging in Gajuwaka near park.",
      sourceUrl: "https://localnews.com/stagnation",
      publisher: "Vizag Times",
    });

    expect(res.quarantined).toBe(false);
    expect(res.ignored).toBeFalsy();
    expect(res.submissionId).toBeDefined();

    // Verify it was written with status: received and channel: news
    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, res.submissionId!))
      .limit(1);

    expect(sub).toBeDefined();
    expect(sub.channel).toBe("news");
    expect(sub.status).toBe("received");
    expect(sub.citizenKey).toBe("NEWS-Vizag Times");
  });
});
