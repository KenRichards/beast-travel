import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
