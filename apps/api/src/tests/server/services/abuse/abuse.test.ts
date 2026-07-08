import { describe, it, expect } from "vitest";
import { coordinationScore, textSimilarity } from "@/server/services/abuse/abuse";

describe("abuse coordination scoring", () => {
  const now = new Date();

  it("detects templated text similarity", () => {
    const a = "There is a major pothole on Main Road near the bus stop";
    const b = "There is a major pothole on Main Road near the bus stop please fix";
    expect(textSimilarity(a, b)).toBeGreaterThan(0.8);
  });

  it("scores low for diverse organic cluster", () => {
    const subs = [
      { id: "1", citizenKey: "user-a", rawText: "Garbage not collected for weeks", createdAt: now },
      { id: "2", citizenKey: "user-b", rawText: "Street light broken near temple", createdAt: now },
    ];
    const result = coordinationScore(subs);
    expect(result.suspicious).toBe(false);
  });

  it("flags burst of templated cold identities", () => {
    const template =
      "There is a major pothole on Main Road near the bus stop causing accidents daily";
    const subs = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      citizenKey: `ATTACK-COLD-${i}`,
      rawText: template,
      lat: 17.6868,
      lng: 83.2185,
      createdAt: new Date(now.getTime() + i * 1000),
    }));
    const result = coordinationScore(subs);
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.signals.textTemplating).toBeGreaterThan(0.9);
    expect(result.signals.burst).toBeGreaterThan(0);
  });
});
