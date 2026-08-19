/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // mcp-handler needs a longer function duration than the Next.js default
    // for long-lived SSE connections when deployed on Vercel.
  },
  async rewrites() {
    return [
      {
        source: '/mcp',
        destination: '/api/sse',
      }
    ];
  },
};

export default nextConfig;
