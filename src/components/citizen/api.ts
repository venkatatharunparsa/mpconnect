import { apiFetch } from "@/lib/api-client";
import type { Demand, Ward } from "./types";

export async function fetchDemands(): Promise<Demand[]> {
  try {
    const res = await apiFetch("/api/demands");
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data as Demand[];
    if (Array.isArray(data.demands)) return data.demands as Demand[];
    return [];
  } catch {
    return [];
  }
}

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
