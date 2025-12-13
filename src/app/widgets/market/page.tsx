"use client";

import type { CSSProperties } from "react";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Side = "YES" | "NO";
type Action = "BUY" | "SELL";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

function fmtPct(p: number) {
  return `${Math.round(p * 100)}%`;
}

function fmtUsd(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}



function MarketWidgetInner() {
  const searchParams = useSearchParams();
  const marketFromQuery = useMemo(() => {
    const raw = searchParams?.get("market") ?? null;
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  }, [searchParams]);

  const [marketTitle] = useState(() => marketFromQuery ?? "Will it rain in NYC tomorrow?");
  const [yes, setYes] = useState(0.62);
  const no = useMemo(() => clamp(1 - yes, 0, 1), [yes]);

  const [action, setAction] = useState<Action>("BUY");
  const [side, setSide] = useState<Side>("YES");
  const [size, setSize] = useState(50);
  const [cash, setCash] = useState(1000);
  const [posYes, setPosYes] = useState(0);
  const [posNo, setPosNo] = useState(0);

  const price = side === "YES" ? yes : no;
  const notional = size * price;

  const volume24h = useMemo(() => 182_450 + Math.round(yes * 50_000), [yes]);

  const suggestedMarkets = useMemo(() => {
    const items = [
      "Will Anthropic have the best AI model?",
      "Will OpenAI lead in 2026?",
      "Will Google win?",
    ];
    return items.map((m, i) => {
      const p = 0.35 + hash01(`${marketTitle}:${m}:${i}`) * 0.35;
      return { title: m, pct: Math.round(p * 100) };
    });
  }, [marketTitle]);

  function simulateImpact(deltaShares: number) {
    const impact = clamp(deltaShares / 2000, -0.08, 0.08);
    const nextYes = clamp(yes + (side === "YES" ? impact : -impact), 0.01, 0.99);
    setYes(nextYes);
  }

  function placeOrder() {
    if (size <= 0) return;

    if (action === "BUY") {
      if (cash < notional) return;
      setCash((c) => c - notional);
      if (side === "YES") setPosYes((p) => p + size);
      else setPosNo((p) => p + size);
      simulateImpact(size);

      return;
    }

    // SELL
    if (side === "YES") {
      if (posYes < size) return;
      setPosYes((p) => p - size);
    } else {
      if (posNo < size) return;
      setPosNo((p) => p - size);
    }
    setCash((c) => c + notional);
    simulateImpact(-size);

  }

  const disabled =
    size <= 0 ||
    (action === "BUY" && cash < notional) ||
    (action === "SELL" && (side === "YES" ? posYes < size : posNo < size));

  return (
    <div
      className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]"
      style={
        {
          "--color-background": "#1d2b3a",
          "--color-surface-1": "#0f1623",
          "--color-surface-2": "#121b2a",
          "--color-border": "rgba(255, 255, 255, 0.10)",
          "--color-text-primary": "#f3f4f6",
          "--color-text-secondary": "rgba(255, 255, 255, 0.62)",
          "--color-text-inverse": "#0b0f17",
          "--color-chart-orange": "#FF812E",
          "--color-yes": "#00BA7C",
          "--color-no": "#FC4B44",
          "--color-yes-tint": "rgba(0, 186, 124, 0.15)",
          "--color-no-tint": "rgba(252, 75, 68, 0.15)",
          "--color-button-primary-bg": "#f3f4f6",
          "--color-button-primary-text": "#0b0f17",
          "--color-button-secondary-bg": "rgba(255, 255, 255, 0.06)",
          "--color-button-secondary-bg-hover": "rgba(255, 255, 255, 0.10)",
          "--shadow-md": "0 10px 30px rgba(0, 0, 0, 0.35)",
          fontFamily:
            "Open Sauce One, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        } as CSSProperties
      }
    >
      <style jsx global>{`
        @font-face {
          font-family: "Open Sauce One";
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: url("https://polymarket.com/_next/static/media/open-sauce-one-latin-400-normal.69e44276.woff2")
            format("woff2");
        }
        @font-face {
          font-family: "Open Sauce One";
          font-style: normal;
          font-display: swap;
          font-weight: 600;
          src: url("https://polymarket.com/_next/static/media/open-sauce-one-latin-600-normal.5337efa3.woff2")
            format("woff2");
        }
        @font-face {
          font-family: "Open Sauce One";
          font-style: normal;
          font-display: swap;
          font-weight: 700;
          src: url("https://polymarket.com/_next/static/media/open-sauce-one-latin-700-normal.60b729ab.woff2")
            format("woff2");
        }
      `}</style>

      <div className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(15,22,35,0.65)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1240px] items-center gap-3 overflow-x-auto px-4 py-2 text-xs text-[var(--color-text-secondary)]">
          {[
            "Trending",
            "Breaking",
            "New",
            "Politics",
            "Sports",
            "Finance",
            "Crypto",
            "Geopolitics",
            "Earnings",
            "Tech",
            "Culture",
            "World",
          ].map((t) => (
            <button
              key={t}
              className={
                t === "Politics"
                  ? "whitespace-nowrap rounded-full bg-[rgba(255,255,255,0.10)] px-3 py-1 text-[var(--color-text-primary)]"
                  : "whitespace-nowrap rounded-full px-3 py-1 hover:bg-[rgba(255,255,255,0.06)]"
              }
              type="button"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1240px] px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] text-[var(--color-text-secondary)]">
            Fake demo • not affiliated with Polymarket • simulation only
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-[rgba(18,27,42,0.7)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
            Connected
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                ← Back to Markets
              </button>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-border)] bg-[rgba(18,27,42,0.6)] px-2 py-1 text-[11px] hover:bg-[rgba(18,27,42,0.9)]"
                >
                  Share
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-border)] bg-[rgba(18,27,42,0.6)] px-2 py-1 text-[11px] hover:bg-[rgba(18,27,42,0.9)]"
                >
                  Save
                </button>
              </div>
            </div>

            <h1 className="mt-3 text-xl font-semibold leading-snug">
              {marketTitle}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <span className="opacity-70">Vol</span>
                <span className="text-[var(--color-text-primary)]">{fmtCompact(volume24h)}</span>
              </span>
              <span className="h-3 w-px bg-[var(--color-border)]" />
              <span className="inline-flex items-center gap-1">
                <span className="opacity-70">Liquidity</span>
                <span className="text-[var(--color-text-primary)]">{fmtUsd(56488)}</span>
              </span>
              <span className="h-3 w-px bg-[var(--color-border)]" />
              <span className="inline-flex items-center gap-1">
                <span className="opacity-70">Ends</span>
                <span className="text-[var(--color-text-primary)]">Dec 31, 2025</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["1H", "6H", "1D", "1W", "1M", "ALL"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={
                    k === "ALL"
                      ? "rounded-full bg-[rgba(255,255,255,0.10)] px-3 py-1.5 text-[11px] text-[var(--color-text-primary)]"
                      : "rounded-full px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.06)]"
                  }
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[rgba(18,27,42,0.35)] p-3">
              <svg viewBox="0 0 800 320" className="block h-[260px] w-full" role="img">
                <path
                  d="M0 250 C 70 260, 120 130, 200 160 S 330 180, 400 150 S 540 120, 620 170 S 720 220, 800 140"
                  fill="none"
                  stroke="rgba(120,170,255,0.95)"
                  strokeWidth="3"
                />
                <path
                  d="M0 220 C 100 240, 160 210, 240 240 S 380 260, 460 190 S 560 140, 640 210 S 740 250, 800 200"
                  fill="none"
                  stroke="var(--color-chart-orange)"
                  strokeWidth="3"
                />
                <path
                  d="M0 300 C 90 295, 160 298, 260 296 S 420 294, 520 296 S 660 298, 800 297"
                  fill="none"
                  stroke="rgba(240,190,60,0.95)"
                  strokeWidth="2"
                />
              </svg>
              <div className="mt-2 text-[11px] text-[var(--color-text-secondary)]">
                Synthetic chart for demo purposes
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                <div className="uppercase tracking-wider">Outcomes</div>
                <div className="uppercase tracking-wider">% chance</div>
              </div>

              <div className="mt-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(18,27,42,0.55)]">
                {[{ name: "YES", pct: yes }, { name: "NO", pct: no }].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] p-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[rgba(255,255,255,0.06)]" />
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {row.name}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-secondary)]">
                          Vol {fmtCompact(Math.round(volume24h / 3))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-[90px] text-right text-base font-semibold">
                        {fmtPct(row.pct)}
                      </div>
                      <button
                        type="button"
                        className={
                          row.name === "YES"
                            ? "rounded-xl bg-[var(--color-yes)] px-3 py-2 text-[12px] font-semibold text-[var(--color-text-inverse)]"
                            : "rounded-xl bg-[var(--color-no)] px-3 py-2 text-[12px] font-semibold text-[var(--color-text-inverse)]"
                        }
                        onClick={() => setSide(row.name as Side)}
                      >
                        Buy {row.name} {(row.pct * 100).toFixed(1)}¢
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[rgba(255,255,255,0.06)] font-bold">
                  AI
                </div>
                <div className="text-sm font-semibold">Market</div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-[var(--color-border)] bg-[rgba(18,27,42,0.6)] px-2 py-1 text-[11px] text-[var(--color-text-secondary)]"
              >
                Market ▾
              </button>
            </div>

            <div className="mt-3 flex gap-3 text-sm">
              <button
                type="button"
                className={
                  action === "BUY"
                    ? "border-b-2 border-[var(--color-text-primary)] pb-2 font-semibold"
                    : "border-b-2 border-transparent pb-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }
                onClick={() => setAction("BUY")}
              >
                Buy
              </button>
              <button
                type="button"
                className={
                  action === "SELL"
                    ? "border-b-2 border-[var(--color-text-primary)] pb-2 font-semibold"
                    : "border-b-2 border-transparent pb-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }
                onClick={() => setAction("SELL")}
              >
                Sell
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide("YES")}
                className={
                  side === "YES"
                    ? "rounded-xl bg-[var(--color-yes)] px-3 py-3 text-sm font-semibold text-[var(--color-text-inverse)]"
                    : "rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm font-semibold text-[var(--color-text-secondary)]"
                }
              >
                Yes {(yes * 100).toFixed(1)}¢
              </button>
              <button
                type="button"
                onClick={() => setSide("NO")}
                className={
                  side === "NO"
                    ? "rounded-xl bg-[var(--color-no)] px-3 py-3 text-sm font-semibold text-[var(--color-text-inverse)]"
                    : "rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm font-semibold text-[var(--color-text-secondary)]"
                }
              >
                No {(no * 100).toFixed(1)}¢
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs font-semibold">Amount</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">Balance {fmtUsd(cash)}</div>
                </div>
                <div className="text-3xl font-semibold">{fmtUsd(notional)}</div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {[{ label: "+$1", v: 1 }, { label: "+$20", v: 20 }, { label: "+$100", v: 100 }].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    className="rounded-lg border border-[var(--color-border)] bg-[rgba(255,255,255,0.04)] px-2 py-1.5 text-[11px] text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.08)]"
                    onClick={() => {
                      const addShares = Math.max(1, Math.round((b.v / price) * 10) / 10);
                      setSize((s) => clamp(s + addShares, 0, 10000));
                    }}
                  >
                    {b.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-border)] bg-[rgba(255,255,255,0.04)] px-2 py-1.5 text-[11px] text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.08)]"
                  onClick={() => {
                    const maxShares = Math.floor((cash / price) * 10) / 10;
                    setSize(maxShares);
                  }}
                >
                  Max
                </button>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                  <span>Shares</span>
                  <span className="font-mono text-[var(--color-text-primary)]">{size.toFixed(1)}</span>
                </div>
                <input
                  className="mt-2 w-full"
                  type="range"
                  min={0}
                  max={500}
                  step={0.5}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                />
              </div>

              <button
                type="button"
                className={
                  disabled
                    ? "mt-4 w-full cursor-not-allowed rounded-xl bg-[rgba(255,255,255,0.10)] px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)]"
                    : "mt-4 w-full rounded-xl bg-[var(--color-button-primary-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-button-primary-text)]"
                }
                onClick={placeOrder}
                disabled={disabled}
              >
                {disabled ? "Unavailable" : `${action} ${side}`}
              </button>

              <div className="mt-2 text-center text-[11px] text-[var(--color-text-secondary)]">
                By trading, you agree to the Terms of Use (demo)
              </div>
            </div>

            <div className="mt-4 border-t border-[rgba(255,255,255,0.06)] pt-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                <button type="button" className="rounded-full bg-[rgba(255,255,255,0.10)] px-2 py-1">
                  All
                </button>
                <button type="button" className="rounded-full px-2 py-1 hover:bg-[rgba(255,255,255,0.06)]">
                  Tech
                </button>
              </div>
              <div className="space-y-2">
                {suggestedMarkets.map((m) => (
                  <button
                    key={m.title}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(18,27,42,0.55)] px-3 py-2 text-left hover:bg-[rgba(18,27,42,0.8)]"
                  >
                    <span className="line-clamp-1 text-[12px] text-[var(--color-text-secondary)]">{m.title}</span>
                    <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                      {m.pct}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketWidgetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1d2b3a]" />}> 
      <MarketWidgetInner />
    </Suspense>
  );
}
