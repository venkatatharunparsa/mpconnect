import { apiFetch } from "@/lib/api-client";
import { fetchDemands } from "@/components/dashboard/api";
import type { Demand } from "@/components/dashboard/types";
import type { Authority } from "./types";

export async function fetchAuthorities(): Promise<Authority[]> {
  try {
    const res = await apiFetch("/api/authorities");
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data as Authority[];
    return [];
  } catch {
    return [];
  }
}

function demandMatchesAuthority(demand: Demand, authority: Authority): boolean {
  if (demand.authorityId === authority.id) return true;
  return authority.categories.includes(demand.category);
}

export async function fetchAuthorityDemands(authority: Authority): Promise<Demand[]> {
  const all = await fetchDemands();
  return all.filter((d) => demandMatchesAuthority(d, authority));
}
