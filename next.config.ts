import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        source: "/widgets/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://chat.openai.com https://chatgpt.com https://*.chatgpt.com https://*.openai.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
