function fmtUsd(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

// Server-rendered version of the market widget.
// ChatGPT's widget sandbox sometimes fails to hydrate client-only Next.js pages.
export default function MarketWidgetSsrPage({
  searchParams,
}: {
  searchParams?: { market?: string | string[] };
}) {
  const raw = searchParams?.market;
  const marketTitle = (Array.isArray(raw) ? raw[0] : raw)?.trim() || "Will it rain in NYC tomorrow?";

  const yes = 0.62;
  const no = 1 - yes;
  const yesCents = Math.round(yes * 100);
  const noCents = Math.round(no * 100);

  const volume24h = 182_450 + Math.round(yes * 50_000);
  const liquidity = 92_000;

  return (
    <div className="min-h-screen bg-[#1d2b3a] text-[#f3f4f6]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root{
              --neutral-0:#1d2b3a;
              --neutral-50:#121b2a;
              --neutral-100:#0f1623;
              --border:rgba(255,255,255,.08);
              --text-0:#f3f4f6;
              --text-1:rgba(243,244,246,.78);
              --text-2:rgba(243,244,246,.58);
              --yes:#00BA7C;
              --no:#FC4B44;
            }
            html,body{height:100%}
            body{margin:0;background:var(--neutral-0);color:var(--text-0);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial}
            .card{background:var(--neutral-100);border:1px solid var(--border);border-radius:14px}
            .chip{background:#172235;border:1px solid var(--border);border-radius:999px;padding:6px 10px;font-size:12px;color:var(--text-1)}
            .btn{border-radius:12px;padding:10px 12px;font-weight:700;font-size:14px;border:1px solid transparent}
            .btnYes{background:rgba(0,186,124,.14);color:var(--yes);border-color:rgba(0,186,124,.22)}
            .btnNo{background:rgba(252,75,68,.14);color:var(--no);border-color:rgba(252,75,68,.22)}
          `,
        }}
      />

      <div className="sticky top-0 z-10 border-b border-[rgba(255,255,255,.08)] bg-[rgba(29,43,58,.85)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          {[
            "Trending",
            "Breaking",
            "New",
            "Politics",
            "Crypto",
            "Sports",
            "Business",
          ].map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
          <div className="ml-auto hidden text-xs text-[rgba(243,244,246,.58)] sm:block">Demo UI</div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="card p-4">
            <div className="text-xs text-[rgba(243,244,246,.78)]">Polymarket • Single market</div>
            <h1 className="mt-1 text-xl font-bold leading-snug">{marketTitle}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="chip">24h Vol: {fmtUsd(volume24h)}</span>
              <span className="chip">Liquidity: {fmtUsd(liquidity)}</span>
              <span className="chip">Ends: Dec 31, 2025</span>
            </div>

            <div className="mt-4 rounded-xl border border-[rgba(255,255,255,.08)] bg-[rgba(18,27,42,.7)] p-3">
              <div className="h-44 w-full">
                <svg viewBox="0 0 600 220" width="100%" height="100%" preserveAspectRatio="none">
                  <path d="M0,140 C80,120 120,160 180,145 C240,130 260,110 320,120 C380,130 420,90 480,105 C540,120 560,110 600,95" fill="none" stroke="rgba(0,186,124,.9)" strokeWidth="3" />
                  <path d="M0,160 C70,150 140,175 210,155 C280,135 320,165 380,150 C440,135 500,155 600,140" fill="none" stroke="rgba(252,75,68,.85)" strokeWidth="3" />
                  <path d="M0,110 C90,100 170,130 260,118 C350,106 420,128 520,112 C570,104 590,90 600,88" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" />
                </svg>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-[rgba(243,244,246,.58)]">
                <span>Price history (synthetic)</span>
                <span>Last: {yesCents}¢ / {noCents}¢</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">YES</div>
                  <div className="text-xs text-[rgba(243,244,246,.78)]">{yesCents}¢</div>
                </div>
                <button className="btn btnYes" type="button">Buy Yes {yesCents}¢</button>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,.08)]">
                <div style={{ width: `${yesCents}%` }} className="h-full bg-[var(--yes)]" />
              </div>
              <div className="mt-2 text-xs text-[rgba(243,244,246,.58)]">Implied: {yesCents}%</div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">NO</div>
                  <div className="text-xs text-[rgba(243,244,246,.78)]">{noCents}¢</div>
                </div>
                <button className="btn btnNo" type="button">Buy No {noCents}¢</button>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,.08)]">
                <div style={{ width: `${noCents}%` }} className="h-full bg-[var(--no)]" />
              </div>
              <div className="mt-2 text-xs text-[rgba(243,244,246,.58)]">Implied: {noCents}%</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">Trade</div>
              <div className="text-xs text-[rgba(243,244,246,.78)]">Simulated • No real trading</div>
            </div>
            <span className="chip">Balance: {fmtUsd(1000)}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn" style={{ background: "rgba(255,255,255,.06)", color: "var(--text-0)" }} type="button">Buy</button>
            <button className="btn" style={{ background: "transparent", color: "var(--text-1)", border: "1px solid var(--border)" }} type="button">Sell</button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn btnYes" type="button">YES {yesCents}¢</button>
            <button className="btn btnNo" type="button">NO {noCents}¢</button>
          </div>

          <div className="mt-4 rounded-xl border border-[rgba(255,255,255,.08)] bg-[rgba(18,27,42,.55)] p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-[rgba(243,244,246,.78)]">Amount</span>
              <span className="text-[rgba(243,244,246,.58)]">Min $1</span>
            </div>
            <div className="text-2xl font-bold">$50</div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              {["+$1", "+$20", "+$100", "Max"].map((t) => (
                <button key={t} type="button" className="rounded-xl border border-[rgba(255,255,255,.10)] bg-[rgba(255,255,255,.04)] px-3 py-2 text-[rgba(243,244,246,.78)]">
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btnYes mt-4 w-full" type="button">Buy YES</button>
          <div className="mt-3 text-[11px] text-[rgba(243,244,246,.58)]">
            Related markets: {fmtCompact(47)}¢ • {fmtCompact(54)}¢ • {fmtCompact(61)}¢
          </div>
        </div>
      </div>
    </div>
  );
}
