/** @type {import('next').NextConfig} */
const nextConfig = {
  /* WIP codebase: allow `DEMO_BUILD=1 npm run build` for stable boss demos */
  typescript: { ignoreBuildErrors: process.env.DEMO_BUILD === '1' },
  eslint: { ignoreDuringBuilds: process.env.DEMO_BUILD === '1' },
  /* API proxy: web/app/api/v1/[...path]/route.ts (no Origin → avoids Render CORS) */
};

export default nextConfig;
