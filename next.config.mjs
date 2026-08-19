/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // mcp-handler needs a longer function duration than the Next.js default
    // for long-lived SSE connections when deployed on Vercel.
  },
};

export default nextConfig;
