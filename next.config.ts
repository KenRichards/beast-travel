import type { NextConfig } from "next";

const deploymentId =
  process.env.NEXT_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA;

const nextConfig: NextConfig = {
  ...(deploymentId ? { deploymentId } : {}),
  serverExternalPackages: ["pdf-parse"],
  allowedDevOrigins: [
    "192.168.86.61",
    "localhost",
    "127.0.0.1",
    "beastnas",
    "beastnas-r640",
    "*.beast-home.com",
  ],
};

export default nextConfig;
