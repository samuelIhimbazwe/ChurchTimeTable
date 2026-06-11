/** @type {import('next').NextConfig} */
const nextConfig = {
  /* WIP codebase: allow `DEMO_BUILD=1 npm run build` for stable boss demos */
  typescript: { ignoreBuildErrors: process.env.DEMO_BUILD === '1' },
  eslint: { ignoreDuringBuilds: process.env.DEMO_BUILD === '1' },
  /** Single-origin demo: browser calls /api/v1 on the web host; Next proxies to Nest. */
  async rewrites() {
    const raw = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000';
    const apiOrigin = /^https?:\/\//i.test(raw)
      ? raw.replace(/\/$/, '')
      : `https://${raw.replace(/\/$/, '')}`;
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
