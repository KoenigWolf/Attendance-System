import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
