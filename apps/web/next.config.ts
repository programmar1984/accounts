import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "path";

loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@shime/db", "@shime/shared"],
  // PDFKit loads Helvetica.afm from disk at runtime; bundling breaks the path.
  serverExternalPackages: ["pdfkit", "fontkit"],
  // Embed Japanese font for invoice PDFs in production server bundles.
  outputFileTracingIncludes: {
    "/*": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
