// ─── SQP Keyword Detail Drawer ───────────────────────────────────────────
// Slide-in side panel that opens when a keyword is selected from the table
// or the map. Shows everything the user needs to act without leaving the
// page: weekly SQP trend, ASIN breakdown, paid vs organic, market-vs-brand
// rates, and the recommended action.

import { useEffect } from 'react';
import { X, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import type { KeywordRow } from '../../data/sqpData';
import {
  keywordDiagnosis, DIAGNOSIS_STYLE, IMPRESSION_SHARE_CEILING, IMPRESSION_SHARE_STRONG,
  QUADRANT_LABEL, QUADRANT_STYLE, keywordQuadrant, sqpSummary,
} from '../../data/sqpData';

export default function KeywordDetailDrawer({
  keyword,
  onClose,
}: {
  keyword: KeywordRow | null;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    if (!keyword) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyword, onClose]);

  const open = keyword !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-screen w-full max-w-[520px] bg-white shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}
        aria-hidden={!open}
      >
        {keyword && <DrawerContent keyword={keyword} onClose={onClose} />}
      </aside>
    </>
  );
}

function DrawerContent({ keyword: k, onClose }: { keyword: KeywordRow; onClose: () => void }) {
  const quadrant = keywordQuadrant(k, sqpSummary.volumeMedian, sqpSummary.avgClickShare);
  const quadStyle = QUADRANT_STYLE[quadrant];
  const dx = keywordDiagnosis(k);
  const dxStyle = DIAGNOSIS_STYLE[dx.key];

  // Per-keyword paid vs organic estimate.
  // Synthetic for the wireframe: ACoS implies paid share — higher ACoS,
  // higher paid weight. Pin to plausible bounds.
  const paidWeight = Math.min(0.65, Math.max(0.15, k.ppc.acos / 60));
  const yourPurchases = k.purchases.brandCount;
  const paidPurchases = Math.round(yourPurchases * paidWeight);
  const organicPurchases = yourPurchases - paidPurchases;

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3 z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ring-1 ring-inset ${quadStyle.bg} ${quadStyle.text} ${quadStyle.ring}`}>
              {QUADRANT_LABEL[quadrant]}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{k.intent}{k.branded ? ' · branded' : ''}</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 leading-tight">{k.query}</h2>
          <div className="text-[11px] text-gray-500 mt-1">
            Market volume {k.marketVolume.toLocaleString()}/wk · Opportunity €{k.opportunityEur.toLocaleString()}/wk
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Diagnosis + recommended action — the why-you-opened-this */}
      <div className="px-5 py-3 bg-amber-50/40 border-b border-amber-100">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Diagnosis</div>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${dxStyle.bg} ${dxStyle.text} ${dxStyle.ring}`}>
                {dx.label}
              </span>
            </div>
            <div className="text-[11px] text-gray-600 mt-1">{dx.detail}</div>
            <div className="text-[13px] font-semibold text-gray-900 mt-1.5">→ {dx.action}</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Section 1 — Weekly SQP trend */}
        <Section title="Weekly trend (12w)" subtitle="Your share at each funnel stage">
          <KeywordTrend k={k} />
        </Section>

        {/* Section 2 — Market vs brand CTR / CVR (real, from SQP counts) */}
        <Section title="You vs market" subtitle="Your conversion rate vs the market's on the same searches">
          <div className="grid grid-cols-2 gap-3">
            <RateCompare label="CTR (Impr → Click)" yours={dx.yourCtr} market={dx.marketCtr} />
            <RateCompare label="CVR (Click → Purchase)" yours={dx.yourCvr} market={dx.marketCvr} />
          </div>
        </Section>

        {/* Section 3 — Your funnel shares (real, no synthetic benchmark) */}
        <Section title="Your share by funnel stage" subtitle={`As a guide, impression share rarely tops ~${IMPRESSION_SHARE_CEILING}% per ASIN, so ~${IMPRESSION_SHARE_STRONG}%+ is often already strong`}>
          <div className="space-y-1.5">
            <ShareBar label="Impressions" share={k.impressions.share} showCeiling />
            <ShareBar label="Clicks"      share={k.clicks.share} />
            <ShareBar label="Cart Adds"   share={k.cartAdds.share} />
            <ShareBar label="Purchases"   share={k.purchases.share} />
          </div>
        </Section>

        {/* Section 4 — Top ASIN */}
        <Section title="Which ASINs get the purchases" subtitle="Top winner of this keyword in your brand">
          <div className="flex items-start gap-3 p-3 bg-gray-50/60 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-mono text-gray-500 flex-shrink-0">
              {k.topAsin.asin.slice(-4)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-mono text-gray-500">{k.topAsin.asin}</div>
              <div className="text-[13px] font-semibold text-gray-900 leading-tight" title={k.topAsin.title}>{k.topAsin.title}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                Captures <span className="font-bold text-gray-900 tabular-nums">{k.topAsin.brandShare.toFixed(1)}%</span> of brand purchases on this query
              </div>
            </div>
          </div>
        </Section>

        {/* Section 5 — Paid vs organic */}
        <Section title="Paid vs organic contribution" subtitle={`Estimated split of your ${yourPurchases.toLocaleString()} weekly purchases`}>
          <PaidVsOrganic paid={paidPurchases} organic={organicPurchases} ppcSpend={k.ppc.spend} acos={k.ppc.acos} />
        </Section>
      </div>
    </>
  );
}

/* ─────── Sub-components ─────── */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2">
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-700">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function RateCompare({ label, yours, market }: { label: string; yours: number; market: number }) {
  const delta = +(yours - market).toFixed(1);
  const beats = delta >= 0;
  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span className={`text-xl font-bold tabular-nums ${beats ? 'text-emerald-700' : 'text-rose-700'}`}>{yours.toFixed(1)}%</span>
        <span className={`text-[11px] font-semibold inline-flex items-center gap-0.5 ${beats ? 'text-emerald-700' : 'text-rose-700'}`}>
          {beats ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta > 0 ? '+' : ''}{delta}pp
        </span>
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5">Market {market.toFixed(1)}%</div>
    </div>
  );
}

function ShareBar({ label, share, showCeiling = false }: { label: string; share: number; showCeiling?: boolean }) {
  // Scale to a fixed 20% so bars are comparable across keywords; the ~7%
  // impression-share ceiling sits at a stable position on the impressions row.
  const maxScale = 20;
  const sharePct = Math.min(100, (share / maxScale) * 100);
  const ceilingPct = (IMPRESSION_SHARE_CEILING / maxScale) * 100;
  return (
    <div className="px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/40">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 w-20">{label}</span>
        <div className="relative flex-1 h-2.5 bg-white rounded-full overflow-hidden border border-gray-100">
          <div className="h-full bg-cx-500" style={{ width: `${sharePct}%` }} />
          {showCeiling && (
            <div className="absolute top-0 bottom-0 border-l border-dashed border-gray-400" style={{ left: `${ceilingPct}%` }} title={`~${IMPRESSION_SHARE_CEILING}% — typical practical max, for reference`} />
          )}
        </div>
        <span className="text-[11px] font-bold text-gray-900 tabular-nums w-10 text-right">{share.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function PaidVsOrganic({ paid, organic, ppcSpend, acos }: { paid: number; organic: number; ppcSpend: number; acos: number }) {
  const total = paid + organic;
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const organicPct = 100 - paidPct;
  return (
    <div className="space-y-2">
      <div className="flex h-7 rounded-md overflow-hidden border border-gray-200">
        <div className="bg-cx-500 text-white text-[10px] font-bold flex items-center justify-center" style={{ width: `${paidPct}%` }}>
          {paidPct >= 12 && <span>Paid {paidPct}%</span>}
        </div>
        <div className="bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center" style={{ width: `${organicPct}%` }}>
          {organicPct >= 12 && <span>Organic {organicPct}%</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-md bg-gray-50/60 border border-gray-200 p-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Paid</div>
          <div className="text-[13px] font-bold text-gray-900 tabular-nums mt-0.5">{paid.toLocaleString()} units</div>
          <div className="text-[10px] text-gray-500 mt-0.5">€{ppcSpend}/wk spend · ACOS {acos.toFixed(1)}%</div>
        </div>
        <div className="rounded-md bg-gray-50/60 border border-gray-200 p-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Organic</div>
          <div className="text-[13px] font-bold text-gray-900 tabular-nums mt-0.5">{organic.toLocaleString()} units</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Earned, no ad cost</div>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 italic">Paid/organic split estimated from ACOS — Brand Analytics doesn't publish per-keyword paid attribution.</p>
    </div>
  );
}

function KeywordTrend({ k }: { k: KeywordRow }) {
  const points = k.trendValues;
  if (!points || points.length === 0) return <div className="text-[11px] text-gray-400">No trend data</div>;
  const series: { key: 'yourClickShare' | 'yourPurchaseShare'; label: string; color: string }[] = [
    { key: 'yourClickShare',    label: 'Click share',    color: '#0EA5E9' },
    { key: 'yourPurchaseShare', label: 'Purchase share', color: '#10B981' },
  ];
  const W = 460, H = 110, pad = 16;
  const allVals = points.flatMap((p) => series.map((s) => Number(p[s.key])));
  const min = Math.min(...allVals) * 0.8;
  const max = Math.max(...allVals) * 1.15;
  const range = max - min || 1;
  const xStep = points.length > 1 ? (W - pad * 2) / (points.length - 1) : 0;
  const yPos = (v: number) => pad + (1 - (v - min) / range) * (H - pad * 2);
  const xPos = (i: number) => pad + i * xStep;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block">
        {series.map((s) => {
          const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(Number(p[s.key])).toFixed(1)}`).join(' ');
          const lastY = yPos(Number(points[points.length - 1][s.key]));
          return (
            <g key={s.key}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={xPos(points.length - 1)} cy={lastY} r={3} fill={s.color} />
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1 text-gray-500">
            <span className="w-3 h-0.5" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-gray-400">12 weeks</span>
      </div>
    </div>
  );
}
