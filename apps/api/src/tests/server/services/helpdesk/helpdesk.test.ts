import { describe, it, expect } from "vitest";
import { queryHelpDesk } from "@/server/services/helpdesk/helpdesk";

describe("helpdesk", () => {
  it("answers scheme questions using the corpus keywords when GEMINI_API_KEY is mock/empty", async () => {
    const res1 = await queryHelpDesk({ question: "tell me about NTR Bharosa pension scheme" });
    expect(res1.hasVerifiedAnswer).toBe(true);
    expect(res1.answer).toContain("NTR Bharosa");

    const res2 = await queryHelpDesk({ question: "what are the guidelines for MPLADS funding" });
    expect(res2.hasVerifiedAnswer).toBe(true);
    expect(res2.answer).toContain("MPLADS");
  });

  it("refuses to answer questions unrelated to the corpus", async () => {
    const res = await queryHelpDesk({ question: "who won the cricket world cup in 2011?" });
    expect(res.hasVerifiedAnswer).toBe(false);
    expect(res.answer).toContain("I don't have verified information on that");
  });
});
