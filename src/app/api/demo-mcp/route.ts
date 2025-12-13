import { NextResponse } from "next/server";

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const tools: Tool[] = [
  {
    name: "time",
    description: "Returns the current server time in ISO format.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "echo",
    description: "Echoes back the provided text.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["text"],
      properties: {
        text: { type: "string" },
      },
    },
  },
];

type McpRequest =
  | { type: "list_tools" }
  | { type: "call_tool"; name: string; input?: unknown }
  | { type: "chat"; text: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseRequest(v: unknown): McpRequest | null {
  if (!isRecord(v)) return null;
  const type = v.type;
  if (type === "list_tools") return { type: "list_tools" };
  if (type === "chat") {
    return typeof v.text === "string" ? { type: "chat", text: v.text } : null;
  }
  if (type === "call_tool") {
    return typeof v.name === "string"
      ? { type: "call_tool", name: v.name, input: v.input }
      : null;
  }
  return null;
}

function replyForChat(text: string) {
  const t = text.trim();
  const lower = t.toLowerCase();

  if (lower === "list tools" || lower === "tools") {
    return {
      reply:
        "Try clicking ‘List tools’ or type ‘list tools’. You can also type ‘time’ or ‘echo <text>’.",
    };
  }

  if (lower === "time" || lower === "what time is it" || lower === "now") {
    return { reply: `Server time: ${new Date().toISOString()}` };
  }

  if (lower.startsWith("echo ")) {
    return { reply: t.slice(5) };
  }

  return {
    reply:
      "I’m a tiny demo handler. Commands: ‘list tools’, ‘time’, ‘echo <text>’.",
  };
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const body = parseRequest(raw);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.type === "list_tools") {
    return NextResponse.json({ tools });
  }

  if (body.type === "call_tool") {
    const input = isRecord(body.input) ? body.input : {};
    if (body.name === "time") {
      return NextResponse.json({ name: body.name, output: { iso: new Date().toISOString() } });
    }
    if (body.name === "echo") {
      const text = typeof input.text === "string" ? input.text : "";
      return NextResponse.json({ name: body.name, output: { text } });
    }
    return NextResponse.json(
      { error: `Unknown tool: ${body.name}` },
      { status: 400 },
    );
  }

  if (body.type === "chat") {
    return NextResponse.json(replyForChat(body.text));
  }

  return NextResponse.json({ error: "Unknown request type" }, { status: 400 });
}
