import type { Demand, Stats, Ward } from "./types";

// TODO: confirm shape with A — GET /api/demands
export async function fetchDemands(): Promise<Demand[]> {
  try {
    const res = await fetch("/api/demands");
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data as Demand[];
    if (Array.isArray(data.demands)) return data.demands as Demand[];
    return [];
  } catch {
    return [];
  }
}

// TODO: confirm shape with A — GET /api/wards
export async function fetchWards(): Promise<{ wards: Ward[]; available: boolean }> {
  try {
    const res = await fetch("/api/wards");
    if (!res.ok) return { wards: [], available: false };
    const data = await res.json();
    if (Array.isArray(data)) return { wards: data as Ward[], available: true };
    if (Array.isArray(data.wards)) return { wards: data.wards as Ward[], available: true };
    return { wards: [], available: true };
  } catch {
    return { wards: [], available: false };
  }
}

// TODO: confirm shape with A — GET /api/stats
export async function fetchStats(): Promise<Stats | null> {
  try {
    const res = await fetch("/api/stats");
    if (!res.ok) return null;
    const data = await res.json();
    return {
      totalDemands: data.totalDemands ?? data.total ?? 0,
      citizensHeard: data.citizensHeard ?? data.citizens ?? 0,
      verifiedResolutionRate:
        data.verifiedResolutionRate ?? data.verifiedRate ?? data.verified_rate ?? 0,
      reopenedCount: data.reopenedCount ?? data.reopened ?? 0,
    };
  } catch {
    return null;
  }
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
