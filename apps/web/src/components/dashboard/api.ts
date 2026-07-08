import { apiFetch } from "@/lib/api-client";
import type { Demand, Stats, Ward } from "./types";

async function fetchWithTimeout<T>(
  path: string,
  timeoutMs: number,
  parse: (res: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await apiFetch(path, { signal: controller.signal });
    return await parse(res);
  } finally {
    window.clearTimeout(timeout);
  }
}

// TODO: confirm shape with A â€” GET /api/demands
export async function fetchDemands(): Promise<Demand[]> {
  const timeoutMs = 8000;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetchWithTimeout("/api/demands", timeoutMs, async (res) => {
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data)) return data as Demand[];
        if (Array.isArray(data.demands)) return data.demands as Demand[];
        return [];
      });
    } catch {
      // network/transient backend errors; retry once
      if (attempt === 1) return [];
    }
  }
  return [];
}

// TODO: confirm shape with A â€” GET /api/wards
export async function fetchWards(): Promise<{ wards: Ward[]; available: boolean }> {
  try {
    const res = await apiFetch("/api/wards");
    if (!res.ok) return { wards: [], available: false };
    const data = await res.json();
    if (Array.isArray(data)) return { wards: data as Ward[], available: true };
    if (Array.isArray(data.wards)) return { wards: data.wards as Ward[], available: true };
    return { wards: [], available: true };
  } catch {
    return { wards: [], available: false };
  }
}

// TODO: confirm shape with A â€” GET /api/stats
export async function fetchStats(): Promise<Stats | null> {
  const timeoutMs = 8000;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetchWithTimeout("/api/stats", timeoutMs, async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return {
          totalDemands: data.totalDemands ?? data.total ?? 0,
          citizensHeard: data.citizensHeard ?? data.citizens ?? 0,
          verifiedResolutionRate:
            data.verifiedResolutionRate ?? data.verifiedRate ?? data.verified_rate ?? 0,
          reopenedCount: data.reopenedCount ?? data.reopened ?? 0,
        };
      });
    } catch {
      if (attempt === 1) return null;
    }
  }
  return null;
}

export function computeStatsFromDemands(demands: Demand[]): Stats {
  const totalDemands = demands.length;
  const citizensHeard = demands.reduce((sum, d) => sum + d.affectedCount, 0);
  const reopenedCount = demands.filter((d) => d.state === "reopened").length;
  const verified = demands.filter((d) => d.state === "resolved_verified").length;
  const denominator = verified + reopenedCount;
  const verifiedResolutionRate = denominator > 0 ? (verified / denominator) * 100 : 0;

  return {
    totalDemands,
    citizensHeard,
    verifiedResolutionRate,
    reopenedCount,
  };
}