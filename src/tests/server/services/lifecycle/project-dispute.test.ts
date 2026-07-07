import { describe, it, expect } from "vitest";
import {
  transition,
  isTerminalState,
  IllegalTransitionError,
  type DemandState,
} from "@/server/services/lifecycle/lifecycle";

describe("project and dispute lifecycles", () => {
  it("walks identified -> citizen_verified via project happy path", () => {
    let state: DemandState = "identified";
    state = transition(state, "scope", "project");
    expect(state).toBe("scoped");
    state = transition(state, "estimate_cost", "project");
    expect(state).toBe("cost_estimated");
    state = transition(state, "map_funding", "project");
    expect(state).toBe("funding_mapped");
    state = transition(state, "recommend", "project");
    expect(state).toBe("recommended");
    state = transition(state, "sanction", "project");
    expect(state).toBe("sanctioned");
    state = transition(state, "tender", "project");
    expect(state).toBe("tendered");
    state = transition(state, "execute", "project");
    expect(state).toBe("executing");
    state = transition(state, "deliver", "project");
    expect(state).toBe("delivered");
    state = transition(state, "verify_confirm", "project");
    expect(state).toBe("citizen_verified");
    expect(isTerminalState(state, "project")).toBe(true);
  });

  it("handles project holding states", () => {
    let state: DemandState = "cost_estimated";
    state = transition(state, "hold_funds", "project");
    expect(state).toBe("awaiting_funds");
    state = transition(state, "map_funding", "project");
    expect(state).toBe("funding_mapped");
  });

  it("handles dispute active append-only loop", () => {
    let state: DemandState = "dispute_active";
    state = transition(state, "append_case", "dispute");
    expect(state).toBe("dispute_active");
  });

  it("throws on illegal transitions for project/dispute", () => {
    expect(() => transition("identified", "execute", "project")).toThrow(IllegalTransitionError);
    expect(() => transition("dispute_active", "validate", "dispute")).toThrow(IllegalTransitionError);
  });
});
