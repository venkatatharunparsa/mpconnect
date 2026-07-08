import { apiFetch } from "@/lib/api-client";
import type { TimelineEvent } from "./timeline/types";
import type { Demand } from "./dashboard/types";

// TODO: confirm shape with A â€” GET /api/demands/[id]
export interface DemandDetailResponse {
  demand?: Demand;
  timeline?: TimelineEvent[];
  events?: TimelineEvent[];
  chainVerification?: { ok: boolean; brokenAtEventId?: number };
}

export async function fetchDemandDetail(id: string): Promise<DemandDetailResponse | null> {
  try {
    const res = await apiFetch(`/api/demands/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as DemandDetailResponse;
  } catch {
    return null;
  }
}

export function extractDemand(data: DemandDetailResponse | null): Demand | null {
  if (!data) return null;
  if (data.demand) return data.demand;
  // TODO: confirm shape with A â€” some APIs may return demand fields at root
  const maybe = data as unknown as Demand;
  if (maybe.id && maybe.title) return maybe;
  return null;
}

export function extractTimeline(data: DemandDetailResponse | null): TimelineEvent[] {
  if (!data) return [];
  if (data.timeline?.length) return data.timeline;
  if (data.events?.length) return data.events;
  return [];
}