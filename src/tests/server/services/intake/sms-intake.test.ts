import { describe, it, expect, vi } from "vitest";
import { processIncomingSms } from "@/server/services/intake/sms-intake";
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

describe("sms-intake", () => {
  it("successfully processes incoming SMS and inserts it into database", async () => {
    const res = await processIncomingSms({
      senderPhone: "+919876543210",
      smsText: "pothole on road near gajuwaka",
    });

    expect(res.submissionId).toBeDefined();
    expect(res.refId).toBeDefined();
    expect(res.status).toBe("extracted");

    // Verify database row
    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, res.submissionId))
      .limit(1);

    expect(sub).toBeDefined();
    expect(sub.channel).toBe("sms");
    expect(sub.citizenKey).toBe("SMS-+919876543210");
  });
});
