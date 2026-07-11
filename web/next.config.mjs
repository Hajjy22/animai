import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The `animai` package is linked from the repo root (file:..), one level
  // above web/. Point tracing at the monorepo root so the /api/mcp route's
  // serverless bundle includes the linked package's dist/, and to silence the
  // multiple-lockfiles workspace-root warning.
  outputFileTracingRoot: path.join(process.cwd(), ".."),
};

export default nextConfig;
