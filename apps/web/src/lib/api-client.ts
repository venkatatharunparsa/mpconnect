/**
 * API client for separated frontend (web + api on different Vercel projects).
 * Browser: same-origin /api/* proxied by next.config rewrites (no CORS).
 * SSR: direct call to the backend origin.
 */
export const PRODUCTION_API = "https://mpconnect-api.vercel.app";

export function isValidApiOrigin(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return false;
    // Reject Vercel dashboard/deployment page URLs (not the API hostname).
    if (hostname === "vercel.com") return false;
    if (hostname === "localhost") return true;
    if (hostname.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

export function resolveApiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured && isValidApiOrigin(configured)) return configured;
  if (process.env.VERCEL === "1") return PRODUCTION_API;
  if (typeof window !== "undefined" && window.location.hostname === "mpconnect-web.vercel.app") {
    return PRODUCTION_API;
  }
  return "http://localhost:3000";
}

const API_ORIGIN = resolveApiOrigin();

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Browser: same-origin → Next.js rewrite proxies to the API (avoids CORS).
  if (typeof window !== "undefined") return normalized;
  return `${API_ORIGIN}${normalized}`;
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
  return `${API_ORIGIN}${normalized}`;
}
