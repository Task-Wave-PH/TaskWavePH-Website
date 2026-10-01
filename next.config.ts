import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR ?? ".next",
  experimental: {
    turbopackFileSystemCacheForDev: process.env.NEXT_DEV_CACHE !== "false",
    turbopackFileSystemCacheForBuild: process.env.NEXT_BUILD_CACHE !== "false",
  },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
