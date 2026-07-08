/** @type {import('next').NextConfig} */
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const nextConfig = {
  transpilePackages: ["@mpconnect/shared"],
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: false }];
  },
  /** Proxy /api/* to the backend in dev — avoids CORS; browser uses same-origin fetch. */
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
