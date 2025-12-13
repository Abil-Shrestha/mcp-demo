import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createUIResource } from "@mcp-ui/server";
import { z } from "zod";

const server = new McpServer({ name: "mcp-ui-demo", version: "0.1.0" });

const TEMPLATE_URI = "ui://mcp-ui-demo/market";
const WIDGET_BASE_URL =
  process.env.WIDGET_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000";
const MARKET_WIDGET_URL = `${WIDGET_BASE_URL.replace(/\/$/, "")}/widgets/market`;

// 1) Apps SDK template resource (ChatGPT uses this, via openai/outputTemplate)
const appsSdkTemplate = createUIResource({
  uri: TEMPLATE_URI,
  encoding: "text",
  adapters: {
    appsSdk: {
      enabled: true,
      config: { intentHandling: "prompt" },
    },
  },
  content: {
    type: "externalUrl",
    iframeUrl: MARKET_WIDGET_URL,
  },
  metadata: {
    "openai/widgetDescription": "Fake Polymarket-style trading UI (simulated)",
    "openai/widgetPrefersBorder": true,
  },
});

server.registerResource(
  "demo_market_template",
  TEMPLATE_URI,
  {
    title: "Demo market widget template",
    description: "Apps SDK template that points to the hosted /widgets/market page.",
  },
  async () => ({
    contents: [appsSdkTemplate.resource],
  }),
);

// 2) Tool that returns both Apps SDK structuredContent and an embedded MCP-UI resource (for MCP-native hosts)
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
      "openai/outputTemplate": TEMPLATE_URI,
      "openai/toolInvocation/invoking": "Preparing widget…",
      "openai/toolInvocation/invoked": "Widget ready",
      "openai/widgetAccessible": true,
    },
  },
  async ({ market } = {}) => {
    const label =
      typeof market === "string" && market.trim()
        ? market.trim()
        : "Will it rain in NYC tomorrow?";
    const timestamp = new Date().toISOString();
    const widgetUrl = `${MARKET_WIDGET_URL}?market=${encodeURIComponent(label)}`;

    return {
      content: [{ type: "text", text: `Opened demo market widget: ${label}` }],
      structuredContent: { market: label, timestamp, widgetUrl },
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
