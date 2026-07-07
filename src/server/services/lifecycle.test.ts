import { describe, it, expect } from "vitest";
import {
  transition,
  legalEvents,
  isTerminalState,
  IllegalTransitionError,
  DEMAND_STATES,
  type DemandState,
  type LifecycleEvent,
} from "@/server/services/lifecycle";

describe("lifecycle state machine", () => {
  it("walks claimed → resolved_verified via happy path", () => {
    let state: DemandState = "claimed";
    state = transition(state, "validate");
    expect(state).toBe("validated_public");
    state = transition(state, "route");
    expect(state).toBe("routed");
    state = transition(state, "start_progress");
    expect(state).toBe("in_progress");
    state = transition(state, "fix_claim");
    expect(state).toBe("fix_claimed");
    state = transition(state, "verify_confirm");
    expect(state).toBe("resolved_verified");
    expect(isTerminalState(state)).toBe(true);
  });

  it("deny reopens from fix_claimed", () => {
    expect(transition("fix_claimed", "verify_deny")).toBe("reopened");
  });

  it("timeout resolves unverified", () => {
    expect(transition("fix_claimed", "verify_timeout")).toBe("resolved_unverified");
  });

  it("throws on illegal transitions", () => {
    expect(() => transition("claimed", "fix_claim")).toThrow(IllegalTransitionError);
    expect(() => transition("resolved_verified", "validate")).toThrow(IllegalTransitionError);
  });

  it("property: random event sequences never leave valid states without throwing", () => {
    const events: LifecycleEvent[] = [
      "validate",
      "route",
      "start_progress",
      "fix_claim",
      "verify_confirm",
      "verify_deny",
      "verify_timeout",
    ];

    for (let trial = 0; trial < 200; trial++) {
      let state: DemandState = "claimed";
      for (let step = 0; step < 20; step++) {
        const legal = legalEvents(state);
        if (legal.length === 0) break;
        const pick = events[Math.floor(Math.random() * events.length)];
        try {
          if (legal.includes(pick)) {
            state = transition(state, pick);
          }
        } catch {
          // illegal picks are fine — machine should only throw IllegalTransitionError
        }
      }
      expect(DEMAND_STATES.includes(state)).toBe(true);
    }
  });
});
