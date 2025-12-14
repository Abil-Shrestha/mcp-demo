import type { NextApiRequest, NextApiResponse } from "next";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createUIResource } from "@mcp-ui/server";
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

    // Bump template URI to avoid ChatGPT-side caching of the widget template.
    const TEMPLATE_URI = "ui://mcp-ui-demo/market-v2";
    const baseUrl = getWidgetBaseUrl();
    const MARKET_WIDGET_URL = `${baseUrl}/widgets/market-ssr`;

    const appsSdkTemplate = createUIResource({
      uri: TEMPLATE_URI,
      encoding: "text",
      adapters: { appsSdk: { enabled: true, config: { intentHandling: "prompt" } } },
      content: {
        type: "externalUrl",
        iframeUrl: `${MARKET_WIDGET_URL}?v=2`,
      },
      metadata: {
        "openai/widgetDescription": "Fake Polymarket-style trading UI (simulated)",
        "openai/widgetPrefersBorder": true,
      },
    });

    server.registerResource(
      "demo_market_template_v2",
      TEMPLATE_URI,
      {
        title: "Demo market widget template",
        description: "Apps SDK template that points to the hosted /widgets/market page.",
      },
      async () => ({
        contents: [appsSdkTemplate.resource],
      }),
    );

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
          "openai/outputTemplate": TEMPLATE_URI,
          "openai/widgetAccessible": true,
          "openai/toolInvocation/invoking": "Opening market…",
          "openai/toolInvocation/invoked": "Market opened",
        },
      },
      async ({ market } = {}) => {
        const label =
          typeof market === "string" && market.trim()
            ? market.trim()
            : "Will it rain in NYC tomorrow?";
        return {
          content: [{ type: "text", text: `Opened demo market widget: ${label}` }],
          structuredContent: { market: label },
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
