// ─── Funnel Diagnostic Components ───────────────────────────────────────────
// Shared components used by:
//   - Traffic page (brand-level funnel)
//   - SQP keyword detail panel (per-keyword scoped funnel)
//
// Designed for the "Reads left-to-right as a story in 5 seconds" treatment
// described in the May 25 spec.

import { useState, useRef } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, ChevronRight, Target, ArrowRight } from 'lucide-react';
import type { FunnelDiagnostic, FunnelStage, FunnelStageKey, ConversionRate, StageTrendPoint, RecommendedAction, TrafficSourceFunnel } from '../../data/funnelDiagnosticData';
import InfoTooltip from '../InfoTooltip';

// Plain-English explainers for every level of the funnel — shown as hover ⓘ on
// each stage card and conversion chip so an executive can read the funnel
// without an analyst. Generalized (value-agnostic) so they stay correct as the
// numbers change; the live figures are already on the card.
const STAGE_EXPLAINER: Record<FunnelStageKey, string> = {
  impressions: 'Impression share — of all the times ANY product appeared in results for this query, yours appeared this often. It is your visibility at the top of the funnel, driven by organic rank and sponsored placements. As a rough rule of thumb (not a hard limit), impression share rarely climbs above ~7% per ASIN because one ASIN can only hold so many page-one slots — so ~4%+ per ASIN is often already strong, and double-digit brand share usually means multiple ASINs or heavy ad coverage.',
  clicks: 'Click share — your share of all clicks for this query. Read it against your impression share: click share HIGHER than impression share is the healthy pattern — you turn visibility into interest more efficiently than the average competitor (an above-market CTR). Lower means shoppers see you but pick someone else.',
  cartAdds: 'Basket-add share — your share of all basket-adds for this query. This is where product-detail-page quality shows up. If it drops well below your click share, shoppers are landing on your page and leaving without adding — a conversion problem decided by price, images/A+, reviews, delivery and stock, not by traffic.',
  purchases: 'Purchase share — your final share of all purchases from this query. Read it against your click share: if purchase share sits well below click share, you are paying (in ads and rank effort) for traffic you are not fully monetizing down the funnel.',
};

// Keyed by the transition's "to" stage: clicks = CTR, cartAdds = Click→Basket Add,
// purchases = Basket Add→Purchase.
const CONVERSION_EXPLAINER: Record<string, string> = {
  clicks: 'CTR = clicks ÷ impressions — of the people who SAW you, how many clicked, vs the market average on the same searches. Above market means your main image, title, price, rating and badges win the search-results page. Below market is a CTR problem — fix the main image, title and price first.',
  cartAdds: 'Basket-add rate = basket-adds ÷ clicks, vs market. This stage is decided entirely on your product detail page: price vs competitors, images/A+ content, review count & rating, delivery speed / Prime badge, stock and variations. Below market means shoppers bounce after clicking — the classic "you do not need more traffic, you need a better page" signal.',
  purchases: 'Purchase rate = purchases ÷ basket-adds, vs market. This is the checkout stage: final price, shipping cost and delivery date. Above market means the people who commit do buy — checkout is not scaring them off.',
};

const FUNNEL_READING_GUIDE = 'Read left → right: your SHARE at each stage, with the conversion RATE vs market in the chips between them. The leak is wherever your share drops fastest vs the previous stage, or your rate falls below market. A leak at Click → Basket Add points to the product page (price / images / reviews / delivery), not to traffic; a leak at CTR points to the search-results presentation (main image / title / price); a leak at Basket Add → Purchase points to checkout (final price / shipping / delivery date).';

// Exact wording requested: how brand-level shares are built from ASIN data.
const CALCULATION_NOTE = 'Shares are calculated as brand ASIN counts divided by market totals. Market totals are deduplicated by search query and week. Do not average ASIN shares. (Brand share = summed ASIN counts ÷ deduplicated market totals — not an average of ASIN shares.)';

// ─── Headline insight strip ────────────────────────────────────────────────

export function InsightStrip({ diagnostic, kpis }: {
  diagnostic: FunnelDiagnostic;
  kpis?: { label: string; value: string | number; wow: number; isPp?: boolean }[];
}) {
  return (
    <div className="bg-gradient-to-r from-slate-50 via-white to-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-6 flex-wrap">
      <div className="flex items-start gap-3 max-w-3xl min-w-0">
        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-[13px] text-gray-800 leading-relaxed">{diagnostic.insight}</p>
      </div>
      {kpis && kpis.length > 0 && (
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[110px]">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{k.label}</div>
              <div className="text-base font-bold text-gray-900 tabular-nums leading-tight mt-0.5">{k.value}</div>
              <div className={`text-[10px] font-medium mt-0.5 inline-flex items-center gap-0.5 ${k.wow > 0 ? 'text-emerald-700' : k.wow < 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                {k.wow > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : k.wow < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                {k.wow > 0 ? '+' : ''}{k.wow.toFixed(2)}{k.isPp ? 'pp' : '%'} WoW
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Funnel stage cards + conversion chips ─────────────────────────────────

export function FunnelStageCards({ diagnostic }: { diagnostic: FunnelDiagnostic }) {
  const leakIdx = diagnostic.biggestOpportunityIdx;
  const leakConv  = diagnostic.conversions[leakIdx - 1];
  const soWhat = leakConv
    ? `Your ${leakConv.shortLabel} is ${leakConv.yourRate.toFixed(1)}% vs the market's ${leakConv.marketRate.toFixed(1)}% — a ${Math.abs(leakConv.delta).toFixed(1)}pp gap. The other transitions match or beat the market, so the loss is concentrated here.`
    : '';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
            Funnel diagnostic
            <InfoTooltip content={FUNNEL_READING_GUIDE} wide />
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
            Calculation note <InfoTooltip content={CALCULATION_NOTE} wide />
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Your share at each stage; the chips read your CTR / basket-add / CVR against the market rate on the same searches. Hover any ⓘ for what the level means.
        </p>
        {soWhat && (
          <p className="text-[12px] text-gray-700 leading-relaxed mt-1 max-w-3xl">
            <span className="font-semibold">So what:</span>{' '}
            <span className="text-gray-600">{soWhat}</span>
          </p>
        )}
      </div>
      <div className="px-5 py-5">
        <div className="flex items-stretch gap-2 flex-wrap">
          {diagnostic.stages.map((s, i) => (
            <div key={s.key} className="flex items-stretch gap-2 min-w-0">
              <StageCard
                stage={s}
                isBiggest={i === diagnostic.biggestOpportunityIdx}
                status={stageStatus(diagnostic, i)}
              />
              {i < diagnostic.stages.length - 1 && (
                <ConversionChip conv={diagnostic.conversions[i]} isLeak={i + 1 === diagnostic.biggestOpportunityIdx} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Status pill for a stage card (skip for the leak stage — its badge says it). */
function stageStatus(d: FunnelDiagnostic, i: number): { label: string; cls: string } | null {
  if (i === d.biggestOpportunityIdx) return null;
  if (i === 0) {
    const s = d.stages[0].share;                        // impression share (brand-level)
    if (s >= 4) return { label: 'Healthy', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
    if (s >= 2) return { label: 'Watch', cls: 'bg-amber-50 text-amber-700 ring-amber-200' };
    return { label: 'Opportunity', cls: 'bg-amber-50 text-amber-700 ring-amber-200' };
  }
  const into = d.conversions[i - 1];                    // conversion INTO this stage
  return into && into.delta >= 0
    ? { label: 'Good', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
    : { label: 'Watch', cls: 'bg-amber-50 text-amber-700 ring-amber-200' };
}

function StageCard({ stage, isBiggest, status }: {
  stage: FunnelStage;
  isBiggest: boolean;
  status: { label: string; cls: string } | null;
}) {
  const bg = isBiggest ? 'bg-amber-50/60' : 'bg-gray-50/50';
  const border = isBiggest ? 'border-amber-400 ring-1 ring-amber-300' : 'border-gray-200';
  const wow = stage.shareWow;

  return (
    <div className={`relative flex-1 min-w-[180px] rounded-lg border ${border} ${bg} p-3.5 flex flex-col gap-1.5`}>
      {isBiggest && (
        <span className="absolute -top-2 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider">
          <Target className="w-2.5 h-2.5" />
          Where you leak
        </span>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {stage.label} share
          <InfoTooltip content={STAGE_EXPLAINER[stage.key]} wide />
        </span>
        {status && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ring-1 ring-inset ${status.cls}`}>{status.label}</span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{stage.share.toFixed(1)}%</span>
        {Math.abs(wow) >= 0.05 && (
          <span className={`text-[11px] font-semibold tabular-nums inline-flex items-center gap-0.5 ${wow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {wow >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {wow > 0 ? '+' : ''}{wow.toFixed(1)}pp WoW
          </span>
        )}
      </div>
      <div className="text-[10px] text-gray-500">
        {stage.brandCount.toLocaleString()} · {stage.key === 'impressions' ? 'of total market impressions' : `of total market ${stage.label.toLowerCase()}`}
      </div>
    </div>
  );
}

function ConversionChip({ conv, isLeak = false }: { conv: ConversionRate; isLeak?: boolean }) {
  const beats = conv.delta >= 0;
  return (
    <div className="flex items-center self-center px-1 flex-shrink-0">
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
      <div className={`px-2 py-1.5 border rounded-md text-[10px] flex flex-col items-start min-w-[120px] -ml-1 ${isLeak ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' : 'bg-white border-gray-200'}`}>
        <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
          {conv.shortLabel}
          <InfoTooltip content={CONVERSION_EXPLAINER[conv.toKey]} wide />
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-bold text-gray-900 tabular-nums">{conv.yourRate.toFixed(1)}%</span>
          <span className="text-gray-400 tabular-nums">vs {conv.marketRate.toFixed(1)}%</span>
        </div>
        <span className={`text-[9px] font-semibold mt-0.5 ${beats ? 'text-emerald-700' : 'text-rose-700'}`}>
          {conv.delta > 0 ? '+' : ''}{conv.delta.toFixed(1)}pp
        </span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 -ml-1" />
    </div>
  );
}

// ─── Stage trends — 4 small SVG line charts ────────────────────────────────

export function StageTrendCharts({ diagnostic }: { diagnostic: FunnelDiagnostic }) {
  // Diagnose: is the leak-stage share trending down (structural) or recovering?
  const leakStage = diagnostic.stages[diagnostic.biggestOpportunityIdx];
  const leakSeries = diagnostic.stageTrends[leakStage.key];
  const first = leakSeries[0]?.yourShare ?? 0;
  const last = leakSeries[leakSeries.length - 1]?.yourShare ?? 0;
  const change = +(last - first).toFixed(1);
  const soWhat = change < -0.5
    ? `Your ${leakStage.label.toLowerCase()} share fell from ${first.toFixed(1)}% to ${last.toFixed(1)}% over the last ${leakSeries.length} weeks (${change}pp) — a persistent slide, not a one-off dip. Treat it as structural (content, price, traffic mix).`
    : change > 0.5
      ? `Your ${leakStage.label.toLowerCase()} share rose from ${first.toFixed(1)}% to ${last.toFixed(1)}% over ${leakSeries.length} weeks (+${change}pp) — recent fixes are working; keep pushing the same levers.`
      : `Your ${leakStage.label.toLowerCase()} share held around ${last.toFixed(1)}% over ${leakSeries.length} weeks — the leak is steady-state, so the gap vs market is a fixed listing/traffic issue, not a fresh dip.`;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Stage trends</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">Your share at each funnel stage over the last 12 weeks.</p>
        <p className="text-[12px] text-gray-700 leading-relaxed mt-1 max-w-3xl">
          <span className="font-semibold">So what:</span>{' '}
          <span className="text-gray-600">{soWhat}</span>
        </p>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {diagnostic.stages.map((s, i) => (
          <StageMiniChart
            key={s.key}
            label={s.label}
            data={diagnostic.stageTrends[s.key]}
            currentShare={s.share}
            highlight={i === diagnostic.biggestOpportunityIdx}
          />
        ))}
      </div>
    </div>
  );
}

function StageMiniChart({ label, data, currentShare, highlight = false }: {
  label: string;
  data: StageTrendPoint[];
  currentShare: number;
  /** When true, render with a stronger border to mark the leak stage. */
  highlight?: boolean;
}) {
  const w = 240, h = 80, pad = 8;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) return null;
  const allVals = data.map((d) => d.yourShare);
  const min = Math.min(...allVals) * 0.85;
  const max = Math.max(...allVals) * 1.15;
  const range = max - min || 1;
  const xStep = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;

  const yPos = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);
  const xPos = (i: number) => pad + i * xStep;

  const yourPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(d.yourShare).toFixed(1)}`).join(' ');

  // Color reflects the 12-week trend direction (rising share = good).
  const last = data[data.length - 1];
  const rising = last.yourShare >= data[0].yourShare;
  const yourColor = rising ? '#10B981' : '#EF4444';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    // Map pixel x → SVG viewBox x, then to index
    const xView = (xPx / rect.width) * w;
    if (xView < pad || xView > w - pad) { setHoverIdx(null); return; }
    const idx = Math.round((xView - pad) / xStep);
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const handleMouseLeave = () => setHoverIdx(null);

  const hovered = hoverIdx != null ? data[hoverIdx] : null;

  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-amber-50/60 border-2 border-amber-300 ring-1 ring-amber-200' : 'bg-gray-50/40 border border-gray-100'}`}>
      {/* Header — flips to hover read-out when a point is selected */}
      <div className="flex items-center justify-between mb-1 min-h-[14px]">
        {hovered ? (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {label} · <span className="text-gray-700">{hovered.week}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: yourColor }} />
              <span className="font-bold text-gray-900">{hovered.yourShare.toFixed(1)}%</span>
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label} share</span>
            <span className={`text-[11px] font-bold tabular-nums ${rising ? 'text-emerald-700' : 'text-rose-700'}`}>{currentShare.toFixed(1)}%</span>
          </>
        )}
      </div>
      <svg
        ref={svgRef}
        width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
        className="block cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Your share line — color reflects 12-week trend direction */}
        <path d={yourPath} fill="none" stroke={yourColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* Endpoint */}
        <circle cx={xPos(data.length - 1)} cy={yPos(last.yourShare)} r={3} fill={yourColor} />
        {/* Hover indicator: vertical line + dot */}
        {hovered && hoverIdx != null && (
          <g pointerEvents="none">
            <line
              x1={xPos(hoverIdx)} y1={pad}
              x2={xPos(hoverIdx)} y2={h - pad}
              stroke="#0F172A" strokeWidth={1} strokeDasharray="2 2" opacity={0.4}
            />
            <circle cx={xPos(hoverIdx)} cy={yPos(hovered.yourShare)} r={3.5} fill={yourColor} stroke="white" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      {/* Footer */}
      <div className="flex items-center justify-between mt-1 min-h-[12px]">
        <div className="flex items-center gap-1 text-[9px] text-gray-400">
          <span className="w-3 h-0.5" style={{ backgroundColor: yourColor }} />
          <span>Your share · 12w</span>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel contribution by source ─────────────────────────────────────────

const SOURCE_COLOR: Record<TrafficSourceFunnel['source'], string> = {
  'Organic':              '#10B981', // emerald — earned traffic
  'Sponsored Products':   '#0E5A8A', // cx-deep — your primary paid lever
  'Sponsored Brands':     '#6366F1', // indigo
  'Sponsored Display':    '#F59E0B', // amber
};

const STAGE_LABELS: { key: 'impressions' | 'clicks' | 'cartAdds' | 'purchases'; label: string }[] = [
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks',      label: 'Clicks' },
  { key: 'cartAdds',    label: 'Basket Adds' },
  { key: 'purchases',   label: 'Purchases' },
];

export function TrafficSourceDecomposition({ funnels }: { funnels: TrafficSourceFunnel[] }) {
  // Each row is a funnel stage. The stacked bar shows what % of your total
  // at that stage came from each source. Bars sum to 100% per row.
  //
  // What this reveals: if Organic is 56% of impressions but 72% of purchases,
  // your paid funnel is leaking — paid drives volume but organic drives value.

  const totalRevenue = funnels.reduce((s, f) => s + f.revenue, 0);

  // Derive the lead insight: how does Organic's share change down the funnel?
  const organic = funnels.find((f) => f.source === 'Organic');
  const totalImpressions = funnels.reduce((s, f) => s + f.counts.impressions, 0);
  const totalPurchases   = funnels.reduce((s, f) => s + f.counts.purchases,   0);
  const organicImpressionPct = organic ? Math.round((organic.counts.impressions / totalImpressions) * 100) : 0;
  const organicPurchasePct   = organic ? Math.round((organic.counts.purchases   / totalPurchases)   * 100) : 0;
  const organicGains = organicPurchasePct - organicImpressionPct;

  const soWhat = organicGains > 5
    ? `Organic grows from ${organicImpressionPct}% of impressions to ${organicPurchasePct}% of purchases (+${organicGains}pp down-funnel), while paid loses share. Paid traffic is contributing volume but converting worse — re-examine targeting and creative.`
    : organicGains < -5
      ? `Organic falls from ${organicImpressionPct}% of impressions to ${organicPurchasePct}% of purchases (${organicGains}pp down-funnel). Paid is doing the heavy lifting at conversion — unusual; verify attribution and check if organic listings are losing the Buy Box.`
      : `Source mix stays roughly stable from impressions to purchases — no single channel is materially better or worse at converting.`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Funnel contribution by source</h3>
        <p className="text-[12px] text-gray-700 leading-relaxed mt-1 max-w-3xl">
          <span className="font-semibold">So what:</span>{' '}
          <span className="text-gray-600">{soWhat}</span>
        </p>
      </div>

      <div className="px-5 py-4 space-y-3">
        {STAGE_LABELS.map(({ key, label }) => {
          const total = funnels.reduce((s, f) => s + f.counts[key], 0);
          return (
            <div key={key} className="flex items-center gap-4">
              <div className="w-[110px] flex-shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
                <div className="text-[11px] tabular-nums text-gray-400 mt-0.5">{total.toLocaleString()} total</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex w-full h-7 rounded-md overflow-hidden bg-gray-50 border border-gray-100">
                  {funnels.map((f) => {
                    const pct = (f.counts[key] / total) * 100;
                    if (pct < 0.5) return null;
                    return (
                      <div
                        key={f.source}
                        className="relative flex items-center justify-center text-white text-[10px] font-bold transition-opacity hover:opacity-90"
                        style={{ width: `${pct}%`, backgroundColor: SOURCE_COLOR[f.source] }}
                        title={`${f.source}: ${pct.toFixed(1)}% (${f.counts[key].toLocaleString()})`}
                      >
                        {pct >= 8 && <span className="tabular-nums drop-shadow-sm">{pct.toFixed(0)}%</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend + revenue per source */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {funnels.map((f) => {
            const totalPurchases = funnels.reduce((s, x) => s + x.counts.purchases, 0);
            const purchaseShare = (f.counts.purchases / totalPurchases) * 100;
            const revenueShare = (f.revenue / totalRevenue) * 100;
            return (
              <div key={f.source} className="flex items-start gap-2">
                <span className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: SOURCE_COLOR[f.source] }} />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-gray-800 leading-tight">{f.source}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {purchaseShare.toFixed(0)}% of purchases · {revenueShare.toFixed(0)}% of sales
                  </div>
                  <div className="text-[10px] font-bold text-gray-900 tabular-nums">€{f.revenue.toLocaleString()}/wk</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Recommended actions cards ────────────────────────────────────────────

export function RecommendedActionsCards({ actions }: { actions: RecommendedAction[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Recommended actions</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Ranked by estimated weekly sales impact. Click any card to drill into the affected SKUs / campaigns.
        </p>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {actions.map((a, i) => (
          <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/40 hover:border-cx-300 hover:bg-cx-50/40 transition-colors cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">#{i + 1}</span>
              <span className="text-[11px] font-bold text-emerald-700 tabular-nums">+€{a.impactEur.toLocaleString()}/wk</span>
            </div>
            <div className="text-[12px] font-semibold text-gray-900 leading-snug">{a.title}</div>
            <p className="text-[10px] text-gray-500 leading-snug">{a.detail}</p>
            <div className="mt-auto pt-1 border-t border-gray-100">
              <div className="text-[9px] text-gray-400 truncate">{a.affected}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-semibold text-cx-600">{a.drillTo}</span>
                <ArrowRight className="w-3 h-3 text-cx-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
