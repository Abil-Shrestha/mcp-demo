import { randomUUID } from "node:crypto";

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? "3001");

const server = new McpServer({ name: "mcp-ui-demo", version: "0.1.0" });

const WIDGET_BASE_URL =
  process.env.WIDGET_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000";

const baseUrl = WIDGET_BASE_URL.replace(/\/$/, "");

async function getAppsSdkCompatibleHtml(path) {
  const res = await fetch(`${baseUrl}${path}`);
  return await res.text();
}

server.registerTool(
  "demo_widget",
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
          invoking: "Preparing widget…",
          invoked: "Widget ready",
        },
      },
    },
  },
  async ({ market } = {}) => {
    const label =
      typeof market === "string" && market.trim()
        ? market.trim()
        : "Will it rain in NYC tomorrow?";

    // xmcp-style: return the fully rendered HTML (Apps SDK compatible)
    // so ChatGPT can render it directly without an iframe URL template.
    const html = await getAppsSdkCompatibleHtml(
      `/widgets/market?market=${encodeURIComponent(label)}`,
    );

    return {
      content: [{ type: "text", text: html }],
    };
  },
);

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableJsonResponse: true,
});
await server.connect(transport);

const app = createMcpExpressApp({ host: HOST });

app.all("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

app.listen(PORT, HOST, () => {
  console.log(`MCP HTTP server listening on http://${HOST}:${PORT}/mcp`);
});
