import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.13.20.119",
    "10.13.20.*",
    "*.bps1300.lan"
  ]
};

export default nextConfig;
