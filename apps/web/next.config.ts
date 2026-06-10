import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "path";

loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@shime/db", "@shime/shared"],
};

export default nextConfig;
