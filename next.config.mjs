/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "10mb" } }, // voice notes & photos
};

export default nextConfig;
