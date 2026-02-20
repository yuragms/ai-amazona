import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production: minified JS + no HMR WebSocket → better Lighthouse (minify, bfcache). Use "npm run start:prod".
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io", pathname: "/**" },
      { protocol: "https", hostname: "uig754c7gt.ufs.sh", pathname: "/**" },
    ],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
