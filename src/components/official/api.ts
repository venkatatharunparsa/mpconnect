import { apiFetch } from "@/lib/api-client";
import type { Demand } from "./types";

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
