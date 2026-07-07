import type {
  MergeReviewItem,
  QuarantineCluster,
  RejectReason,
  ValidationItem,
} from "./types";

// TODO: confirm shape with A
export async function fetchValidationQueue(): Promise<ValidationItem[]> {
  try {
    const res = await fetch("/api/review/validation");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items ?? []);
  } catch {
    return [];
  }
}

export async function fetchMergeQueue(): Promise<MergeReviewItem[]> {
  try {
    const res = await fetch("/api/review/merge");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items ?? []);
  } catch {
    return [];
  }
}

export async function fetchQuarantineQueue(): Promise<QuarantineCluster[]> {
  try {
    const res = await fetch("/api/review/quarantine");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.clusters ?? data.items ?? []);
  } catch {
    return [];
  }
}

export async function endpointExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "OPTIONS" });
    return res.status !== 404;
  } catch {
    return false;
  }
}

export async function approveValidation(
  submissionId: string,
  body: { category?: string; ward?: string },
): Promise<boolean> {
  try {
    const res = await fetch(`/api/review/validation/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", ...body }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function rejectValidation(
  submissionId: string,
  reason: RejectReason,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/review/validation/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reason }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function decideMerge(
  submissionId: string,
  decision: "merge" | "new" | "attach",
  demandId?: string,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/review/merge/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, demandId, actorId: "reviewer" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function decideQuarantine(
  submissionId: string,
  action: "release" | "reject",
): Promise<boolean> {
  try {
    const res = await fetch(`/api/review/quarantine/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function simulateAttack(): Promise<boolean> {
  try {
    const res = await fetch("/api/dev/simulate-attack", { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}
