/**
 * API client for separated frontend.
 * Browser: same-origin /api/* (proxied by next.config rewrites → backend).
 * SSR: direct to NEXT_PUBLIC_API_URL or localhost:3000.
 */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Client-side: use relative path → Next.js dev proxy handles routing to API
  if (typeof window !== "undefined") {
    return normalized;
  }
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
