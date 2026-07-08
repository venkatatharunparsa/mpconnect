import { apiFetch } from "@/lib/api-client";
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
