export interface RecentSubmission {
  refId: string;
  title: string;
  category: string;
  status: "submitted" | "processing" | "clustered";
  at: string;
}

const STORAGE_KEY = "mpconnect_recent_refs";

export function saveRecentSubmission(entry: Omit<RecentSubmission, "at"> & { at?: string }) {
  if (typeof window === "undefined") return;
  const item: RecentSubmission = {
    ...entry,
    at: entry.at ?? new Date().toISOString(),
  };
  const existing = loadRecentSubmissions().filter((r) => r.refId !== item.refId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...existing].slice(0, 8)));
}

export function loadRecentSubmissions(): RecentSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
