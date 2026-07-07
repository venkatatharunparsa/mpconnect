/**
 * Demand lifecycle state machine (sacred contract #4: human gate on key transitions).
 * claimed → validated_public → routed → in_progress → fix_claimed →
 *   resolved_verified | reopened | resolved_unverified
 */

export const DEMAND_STATES = [
  "claimed",
  "validated_public",
  "routed",
  "in_progress",
  "fix_claimed",
  "resolved_verified",
  "reopened",
  "resolved_unverified",
] as const;

export type DemandState = (typeof DEMAND_STATES)[number];

export type LifecycleEvent =
  | "validate"
  | "route"
  | "start_progress"
  | "fix_claim"
  | "verify_confirm"
  | "verify_deny"
  | "verify_timeout";

const TRANSITIONS: Record<DemandState, Partial<Record<LifecycleEvent, DemandState>>> = {
  claimed: { validate: "validated_public" },
  validated_public: { route: "routed" },
  routed: { start_progress: "in_progress", fix_claim: "fix_claimed" },
  in_progress: { fix_claim: "fix_claimed" },
  fix_claimed: {
    verify_confirm: "resolved_verified",
    verify_deny: "reopened",
    verify_timeout: "resolved_unverified",
  },
  reopened: { start_progress: "in_progress", fix_claim: "fix_claimed" },
  resolved_verified: {},
  resolved_unverified: {},
};

export class IllegalTransitionError extends Error {
  constructor(
    public readonly from: DemandState,
    public readonly event: LifecycleEvent,
  ) {
    super(`Illegal transition: ${from} + ${event}`);
    this.name = "IllegalTransitionError";
  }
}

/** Pure transition function. Throws on illegal transitions. */
export function transition(state: DemandState, event: LifecycleEvent): DemandState {
  const next = TRANSITIONS[state]?.[event];
  if (!next) throw new IllegalTransitionError(state, event);
  return next;
}

/** All legal events from a given state. */
export function legalEvents(state: DemandState): LifecycleEvent[] {
  return Object.keys(TRANSITIONS[state] ?? {}) as LifecycleEvent[];
}

/** Whether a state is terminal (no outgoing transitions). */
export function isTerminalState(state: DemandState): boolean {
  return legalEvents(state).length === 0;
}
