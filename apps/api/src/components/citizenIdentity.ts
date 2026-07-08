const STORAGE_KEY = "mpconnect:citizenKey";

/** Stable demo identity — same pattern as team plan (localStorage pseudo-phone). */
export function getDemoCitizenKey(): string {
  if (typeof window === "undefined") return "demo-server";
  let key = localStorage.getItem(STORAGE_KEY);
  if (!key) {
    key = `demo-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_KEY, key);
  }
  return key;
}
