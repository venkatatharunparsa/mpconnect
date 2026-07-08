/**
 * API client for separated frontend (web + api on different Vercel projects).
 * Always calls the backend origin directly — CORS is configured on apps/api.
 */
function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  // Vercel web deploys without NEXT_PUBLIC_API_URL still need the production API (SSR + client).
  if (process.env.VERCEL === "1") {
    return "https://mpconnect-api.vercel.app";
  }
  if (typeof window !== "undefined" && window.location.hostname === "mpconnect-web.vercel.app") {
    return "https://mpconnect-api.vercel.app";
  }
  return "http://localhost:3000";
}

const API_URL = resolveApiUrl();

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/** Server-side fetch base (SSR / metadata). */
export function serverApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}
