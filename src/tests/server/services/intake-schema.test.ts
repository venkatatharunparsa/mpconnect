import { describe, it, expect } from "vitest";
import { intakeSchema } from "@/server/models/intake-schema";

describe("intake schema", () => {
  it("accepts valid submission with extraction", () => {
    const body = intakeSchema.parse({
      channel: "web",
      citizenKey: "demo-user-1",
      rawText: "School needs upgrade",
      extraction: {
        kind: "suggestion",
        category: "school_upgrade",
        locationText: "Gajuwaka",
        ward: "gajuwaka",
        urgency: "medium",
        summaryEn: "Upgrade government school in Gajuwaka",
        confidence: 0.9,
      },
    });
    expect(body.channel).toBe("web");
  });

  it("rejects unknown fields (strict mode)", () => {
    expect(() =>
      intakeSchema.parse({
        channel: "web",
        citizenKey: "x",
        extraField: "nope",
      }),
    ).toThrow();
  });

  it("rejects invalid category codes", () => {
    expect(() =>
      intakeSchema.parse({
        channel: "web",
        citizenKey: "x",
        extraction: {
          kind: "grievance",
          category: "fake_category",
          urgency: "low",
          summaryEn: "test",
          confidence: 0.5,
        },
      }),
    ).toThrow();
  });
});
