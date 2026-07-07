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

  // PROJECT states
  "identified",
  "scoped",
  "cost_estimated",
  "funding_mapped",
  "recommended",
  "sanctioned",
  "tendered",
  "executing",
  "delivered",
  "citizen_verified",
  "awaiting_funds",
  "deprioritized",

  // DISPUTE states
  "dispute_active"
] as const;

export type DemandState = (typeof DEMAND_STATES)[number];

export type LifecycleEvent =
  | "validate"
  | "route"
  | "start_progress"
  | "fix_claim"
  | "verify_confirm"
  | "verify_deny"
  | "verify_timeout"
  
  // PROJECT events
  | "scope"
  | "estimate_cost"
  | "map_funding"
  | "recommend"
  | "sanction"
  | "tender"
  | "execute"
  | "deliver"
  | "hold_funds"
  | "deprioritize"
  
  // DISPUTE events
  | "append_case";

const GRIEVANCE_TRANSITIONS: Partial<Record<DemandState, Partial<Record<LifecycleEvent, DemandState>>>> = {
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

const PROJECT_TRANSITIONS: Partial<Record<DemandState, Partial<Record<LifecycleEvent, DemandState>>>> = {
  identified: { scope: "scoped", deprioritize: "deprioritized" },
  scoped: { estimate_cost: "cost_estimated", deprioritize: "deprioritized" },
  cost_estimated: { map_funding: "funding_mapped", hold_funds: "awaiting_funds", deprioritize: "deprioritized" },
  funding_mapped: { recommend: "recommended", deprioritize: "deprioritized" },
  recommended: { sanction: "sanctioned", deprioritize: "deprioritized" },
  sanctioned: { tender: "tendered", deprioritize: "deprioritized" },
  tendered: { execute: "executing" },
  executing: { deliver: "delivered" },
  delivered: { verify_confirm: "citizen_verified", verify_deny: "executing" },
  awaiting_funds: { map_funding: "funding_mapped", deprioritize: "deprioritized" },
  deprioritized: { scope: "scoped", estimate_cost: "cost_estimated" },
  citizen_verified: {},
};

const DISPUTE_TRANSITIONS: Partial<Record<DemandState, Partial<Record<LifecycleEvent, DemandState>>>> = {
  dispute_active: { append_case: "dispute_active" }
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
export function transition(state: DemandState, event: LifecycleEvent, kind: string = "grievance"): DemandState {
  let transitions = GRIEVANCE_TRANSITIONS;
  if (kind === "project") transitions = PROJECT_TRANSITIONS;
  else if (kind === "dispute") transitions = DISPUTE_TRANSITIONS;

  const next = transitions[state]?.[event];
  if (!next) throw new IllegalTransitionError(state, event);
  return next;
}

/** All legal events from a given state. */
export function legalEvents(state: DemandState, kind: string = "grievance"): LifecycleEvent[] {
  let transitions = GRIEVANCE_TRANSITIONS;
  if (kind === "project") transitions = PROJECT_TRANSITIONS;
  else if (kind === "dispute") transitions = DISPUTE_TRANSITIONS;

  return Object.keys(transitions[state] ?? {}) as LifecycleEvent[];
}

/** Whether a state is terminal (no outgoing transitions). */
export function isTerminalState(state: DemandState, kind: string = "grievance"): boolean {
  return legalEvents(state, kind).length === 0;
}
