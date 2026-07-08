import { describe, it, expect } from "vitest";
import { evaluateVerificationQuorum } from "@/server/services/lifecycle/verification";

describe("verification quorum", () => {
  it("resolves when 2 of 3 confirm with no denies", () => {
    expect(evaluateVerificationQuorum(2, 0).outcome).toBe("resolved");
  });

  it("stays pending with 1 confirm", () => {
    expect(evaluateVerificationQuorum(1, 0).outcome).toBe("pending");
  });

  it("reopens on any deny even with confirms", () => {
    expect(evaluateVerificationQuorum(2, 1).outcome).toBe("reopened");
    expect(evaluateVerificationQuorum(0, 1).outcome).toBe("reopened");
  });
});
