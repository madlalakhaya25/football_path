import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a subdirectory alongside the Expo app; pin the
  // workspace root so Turbopack doesn't pick up the repo-root lockfile.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
