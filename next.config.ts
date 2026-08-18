import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Run pdf-parse as a native Node module instead of bundling it (avoids
  // webpack trying to bundle pdfjs-dist's worker/canvas internals).
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
