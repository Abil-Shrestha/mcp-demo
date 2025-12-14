import type { NextConfig } from "next";

const baseURL = (
  process.env.WIDGET_BASE_URL ??
  process.env.BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Important for ChatGPT Apps SDK: the sandbox may load the page HTML into about:blank,
  // so relative /_next asset URLs can break. Using assetPrefix makes asset URLs absolute.
  assetPrefix: baseURL || undefined,
  async rewrites() {
    // Local-only convenience: let a single ngrok tunnel (to :3000) also expose the MCP server on :3001.
    // In production we don't rewrite to localhost.
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/mcp",
        destination: "http://127.0.0.1:3001/mcp",
      },
      {
        source: "/healthz",
        destination: "http://127.0.0.1:3001/healthz",
      },
    ];
  },
  async headers() {
    return [
      {
        // Match the xmcp arcade approach: permissive framing and allow the Apps SDK helper origin.
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://apps-sdk-everything.vercel.app; frame-ancestors *;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
