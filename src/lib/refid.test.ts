import { describe, it, expect } from "vitest";
import { isValidRefIdFormat } from "@/lib/refid";

describe("refid", () => {
  it("accepts valid VZG-YYMM-NNNNN format", () => {
    expect(isValidRefIdFormat("VZG-2607-00042")).toBe(true);
    expect(isValidRefIdFormat("VZG-2512-99999")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidRefIdFormat("VZG-2607-42")).toBe(false);
    expect(isValidRefIdFormat("HYD-2607-00042")).toBe(false);
    expect(isValidRefIdFormat("")).toBe(false);
  });
});
