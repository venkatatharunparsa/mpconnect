/** @type {import('next').NextConfig} */
const PRODUCTION_API = "https://mpconnect-api.vercel.app";

function resolveApiOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) {
    try {
      const { hostname, protocol } = new URL(configured);
      if (
        (protocol === "http:" || protocol === "https:") &&
        hostname !== "vercel.com" &&
        (hostname === "localhost" || hostname.endsWith(".vercel.app"))
      ) {
        return configured;
      }
    } catch {
      // fall through
    }
  }
  if (process.env.VERCEL === "1") return PRODUCTION_API;
  return "http://localhost:3000";
}

const apiOrigin = resolveApiOrigin();

const nextConfig = {
  transpilePackages: ["@mpconnect/shared"],
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: false }];
  },
  /** Proxy /api/* to the backend — browser stays same-origin (no CORS). */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
