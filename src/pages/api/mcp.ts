import type { NextApiRequest, NextApiResponse } from "next";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type GlobalWithMcp = typeof globalThis & {
  __mcpServer?: McpServer;
  __mcpTransport?: StreamableHTTPServerTransport;
  __mcpReady?: Promise<void>;
};

function getWidgetBaseUrl() {
  const explicit = process.env.WIDGET_BASE_URL ?? process.env.BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/$/, "");

  return "http://localhost:3000";
}

async function ensureMcp() {
  const g = globalThis as GlobalWithMcp;
  if (g.__mcpReady) return g.__mcpReady;

  g.__mcpReady = (async () => {
    const server = new McpServer({ name: "mcp-ui-demo", version: "0.1.0" });
    const transport = new StreamableHTTPServerTransport({
      // Stateless mode for serverless runtimes
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    const baseUrl = getWidgetBaseUrl();

    async function getAppsSdkCompatibleHtml(path: string): Promise<string> {
      const res = await fetch(`${baseUrl}${path}`);
      return await res.text();
    }

    server.registerTool(
      "open_demo_market",
      {
        title: "Open demo market",
        description: "Opens a fake Polymarket-style trading UI (simulated) inside ChatGPT.",
        inputSchema: z
          .object({
            market: z.string().optional().describe("Optional market label"),
          })
          .strict(),
        _meta: {
          openai: {
            widgetAccessible: true,
            resultCanProduceWidget: true,
            toolInvocation: {
              invoking: "Opening market…",
              invoked: "Market opened",
            },
          },
        },
      },
      async ({ market } = {}) => {
        const label =
          typeof market === "string" && market.trim()
            ? market.trim()
            : "Will it rain in NYC tomorrow?";

        const html = await getAppsSdkCompatibleHtml(
          `/widgets/market?market=${encodeURIComponent(label)}`,
        );
        return {
          content: [{ type: "text", text: html }],
        };
      },
    );

    await server.connect(transport);

    g.__mcpServer = server;
    g.__mcpTransport = transport;
  })();

  return g.__mcpReady;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureMcp();
  const g = globalThis as GlobalWithMcp;
  const transport = g.__mcpTransport;
  if (!transport) {
    res.status(500).json({ error: "MCP transport not initialized" });
    return;
  }

  await transport.handleRequest(req, res, req.body);
}
