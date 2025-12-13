"use client";

import { useMemo, useState } from "react";

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function errorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : "Unknown error";
}

function uuid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: uuid(),
      role: "assistant",
      content:
        "This is a minimal MCP-style demo. Try: ‘list tools’, ‘time’, or ‘echo hello’.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "user") return messages[i]!.content;
    }
    return "";
  }, [messages]);

  async function callApi<T>(payload: unknown): Promise<T> {
    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json: unknown = await res.json();
    if (!res.ok) {
      const apiErr =
        isRecord(json) && typeof json.error === "string" ? json.error : null;
      throw new Error(apiErr ?? `Request failed (${res.status})`);
    }
    return json as T;
  }

  async function onSend(text?: string) {
    const t = (text ?? input).trim();
    if (!t || busy) return;

    setInput("");
    const userMsg: ChatMsg = { id: uuid(), role: "user", content: t };
    setMessages((m) => [...m, userMsg]);

    setBusy(true);
    try {
      const json = await callApi<unknown>({ type: "chat", text: t });
      const reply =
        isRecord(json) && typeof json.reply === "string" ? json.reply : null;
      const assistantMsg: ChatMsg = {
        id: uuid(),
        role: "assistant",
        content: reply ?? "(no reply)",
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e: unknown) {
      setMessages((m) => [
        ...m,
        { id: uuid(), role: "assistant", content: `Error: ${errorMessage(e)}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function onListTools() {
    if (busy) return;
    setBusy(true);
    try {
      const json = await callApi<unknown>({ type: "list_tools" });
      const toolsRaw =
        isRecord(json) && Array.isArray(json.tools) ? json.tools : [];
      const tools: Tool[] = toolsRaw
        .filter(isRecord)
        .filter(
          (t): t is Tool =>
            typeof t.name === "string" &&
            typeof t.description === "string" &&
            isRecord(t.inputSchema),
        )
        .map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        }));
      const content =
        tools.length === 0
          ? "No tools registered."
          : [
              "Available tools:",
              ...tools.map((t) => `- ${t.name}: ${t.description}`),
            ].join("\n");
      setMessages((m) => [...m, { id: uuid(), role: "assistant", content }]);
    } catch (e: unknown) {
      setMessages((m) => [
        ...m,
        { id: uuid(), role: "assistant", content: `Error: ${errorMessage(e)}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-text-primary)]">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">MCP UI Demo</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Local demo that mimics MCP concepts (tools + chat) via a Next.js API
            route.
          </p>
        </header>

        <section className="flex flex-1 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 text-sm">
            <div className="text-[var(--color-text-secondary)]">
              Status: {busy ? "working…" : "idle"}
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-button-secondary-bg)] px-3 py-1.5 text-[var(--color-button-secondary-text)] hover:bg-[var(--color-button-secondary-bg-hover)] disabled:opacity-50"
                onClick={onListTools}
                disabled={busy}
              >
                List tools
              </button>
              <button
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-button-secondary-bg)] px-3 py-1.5 text-[var(--color-button-secondary-text)] hover:bg-[var(--color-button-secondary-bg-hover)] disabled:opacity-50"
                onClick={() => onSend("time")}
                disabled={busy}
                title={`Last user: ${lastUserText || "(none)"}`}
              >
                Ask time
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto w-fit max-w-[90%] rounded-2xl bg-[var(--color-button-primary-bg)] px-4 py-2 text-sm text-[var(--color-button-primary-text)]"
                    : "mr-auto w-fit max-w-[90%] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-2 text-sm text-[var(--color-text-primary)]"
                }
              >
                <div className="whitespace-pre-wrap leading-6">{m.content}</div>
              </div>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-[var(--color-border)] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void onSend();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message… (e.g. 'list tools', 'echo hello')"
              className="flex-1 rounded-xl border border-[var(--color-input-outlined-border)] bg-[var(--color-input-filled-bg)] px-3 py-2 text-sm outline-none placeholder:text-[var(--color-input-filled-text-placeholder)] focus:ring-2 focus:ring-[var(--color-border-active)]"
              disabled={busy}
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-button-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--color-button-primary-text)] hover:bg-[var(--color-button-primary-bg-hover)] disabled:opacity-50"
              disabled={busy}
            >
              Send
            </button>
          </form>
        </section>

        <footer className="mt-6 text-xs text-[var(--color-text-secondary)]">
          Note: ChatGPT can’t run a local web server inside this chat, but you
          can run this demo locally with <code className="font-mono">npm run dev</code>.
        </footer>
      </main>
    </div>
  );
}
