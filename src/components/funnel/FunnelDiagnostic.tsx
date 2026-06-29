// ─── Funnel Diagnostic Components ───────────────────────────────────────────
// Shared components used by:
//   - Traffic page (brand-level funnel)
//   - SQP keyword detail panel (per-keyword scoped funnel)
//
// Designed for the "Reads left-to-right as a story in 5 seconds" treatment
// described in the May 25 spec.

import { useState, useRef } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, ChevronRight, Target, ArrowRight } from 'lucide-react';
import type { FunnelDiagnostic, FunnelStage, ConversionRate, StageTrendPoint, RecommendedAction, TrafficSourceFunnel } from '../../data/funnelDiagnosticData';

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
  const marketStageShares = diagnostic.stages.map((s) => diagnostic.marketShares[s.key]);
  const leakIdx = diagnostic.biggestOpportunityIdx;
  const leakConv  = diagnostic.conversions[leakIdx - 1];
  const soWhat = leakConv
    ? `Your ${leakConv.shortLabel.toLowerCase()} conversion is ${leakConv.yourRate.toFixed(1)}% vs market ${leakConv.marketRate.toFixed(1)}% — a ${Math.abs(leakConv.delta).toFixed(1)}pp gap. Earlier stages are healthy, so the loss is concentrated here.`
    : '';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Funnel diagnostic</h3>
        {soWhat && (
          <p className="text-[12px] text-gray-700 leading-relaxed mt-1 max-w-3xl">
            <span className="font-semibold">So what:</span>{' '}
            <span className="text-gray-600">{soWhat}</span>
          </p>
        )}
      </div>
      <div className="px-5 py-5">
        <div className="flex items-stretch gap-2 flex-wrap">
          {diagnostic.stages.map((s, i) => {
            const marketShare = marketStageShares[i];
            const delta = +(s.share - marketShare).toFixed(2);
            const isBiggest = i === diagnostic.biggestOpportunityIdx;
            const beats = delta >= 0;
            return (
              <div key={s.key} className="flex items-stretch gap-2 min-w-0">
                <StageCard stage={s} marketShare={marketShare} delta={delta} beats={beats} isBiggest={isBiggest} />
                {i < diagnostic.stages.length - 1 && (
                  <ConversionChip conv={diagnostic.conversions[i]} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StageCard({ stage, marketShare, delta, beats, isBiggest }: {
  stage: FunnelStage;
  marketShare: number;
  delta: number;
  beats: boolean;
  isBiggest: boolean;
}) {
  const bg = isBiggest ? 'bg-amber-50/60' : beats ? 'bg-emerald-50/60' : 'bg-rose-50/60';
  const border = isBiggest ? 'border-amber-400 ring-1 ring-amber-300' : 'border-gray-200';

  return (
    <div className={`relative flex-1 min-w-[180px] rounded-lg border ${border} ${bg} p-3.5 flex flex-col gap-1.5`}>
      {isBiggest && (
        <span className="absolute -top-2 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider">
          <Target className="w-2.5 h-2.5" />
          Biggest opportunity
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{stage.label}</span>
        <span className="text-[10px] text-gray-400 tabular-nums">{stage.brandCount.toLocaleString()}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{stage.share.toFixed(1)}%</span>
        <span className={`text-[11px] font-semibold tabular-nums inline-flex items-center gap-0.5 ${beats ? 'text-emerald-700' : 'text-rose-700'}`}>
          {beats ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}pp
        </span>
      </div>
      <div className="text-[10px] text-gray-500">
        Market {marketShare.toFixed(1)}%
      </div>
    </div>
  );
}

function ConversionChip({ conv }: { conv: ConversionRate }) {
  const beats = conv.delta >= 0;
  return (
    <div className="flex items-center self-center px-1 flex-shrink-0">
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
      <div className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-[10px] flex flex-col items-start min-w-[120px] -ml-1">
        <span className="font-semibold text-gray-700">{conv.shortLabel}</span>
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
  // Diagnose: is the leak persistent (≥6 weeks below market) or recent?
  const leakKey = diagnostic.stages[diagnostic.biggestOpportunityIdx].key;
  const leakSeries = diagnostic.stageTrends[leakKey];
  const weeksBelow = leakSeries.filter((p) => p.yourShare < p.marketShare).length;
  const leakStageLabel = diagnostic.stages[diagnostic.biggestOpportunityIdx].label;
  const persistent = weeksBelow >= 6;
  const soWhat = persistent
    ? `${leakStageLabel} has trailed market ${weeksBelow} of the last ${leakSeries.length} weeks — this is a persistent gap, not a one-off dip. Treat it as a structural problem (content, price, traffic mix), not a weekly anomaly.`
    : `${leakStageLabel} only trailed market in ${weeksBelow} of the last ${leakSeries.length} weeks — the leak is recent. Check for changes in traffic mix, ad spend or content shipped in the last fortnight.`;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Stage trends</h3>
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
  const allVals = data.flatMap((d) => [d.yourShare, d.marketShare]);
  const min = Math.min(...allVals) * 0.85;
  const max = Math.max(...allVals) * 1.15;
  const range = max - min || 1;
  const xStep = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;

  const yPos = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);
  const xPos = (i: number) => pad + i * xStep;

  const yourPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(d.yourShare).toFixed(1)}`).join(' ');
  const marketPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(d.marketShare).toFixed(1)}`).join(' ');

  // Color reflects share vs market at the LATEST point, not trend direction.
  // Funnel-stage share is always "higher = better" — no per-stage polarity needed.
  const last = data[data.length - 1];
  const beatsMarket = last.yourShare >= last.marketShare;
  const yourColor = beatsMarket ? '#10B981' : '#EF4444';
  const marketColor = '#94A3B8';

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
  const hoveredBeats = hovered ? hovered.yourShare >= hovered.marketShare : false;
  const hoveredDelta = hovered ? hovered.yourShare - hovered.marketShare : 0;

  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-amber-50/60 border-2 border-amber-300 ring-1 ring-amber-200' : 'bg-gray-50/40 border border-gray-100'}`}>
      {/* Header — flips to hover read-out when a point is selected */}
      <div className="flex items-center justify-between mb-1 min-h-[14px]">
        {hovered ? (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {label} · <span className="text-gray-700">{hovered.week}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-[10px] tabular-nums">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: yourColor }} />
                <span className="font-bold text-gray-900">{hovered.yourShare.toFixed(1)}%</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white border border-gray-400" />
                <span className="font-medium text-gray-500">{hovered.marketShare.toFixed(1)}%</span>
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
            <span className={`text-[11px] font-bold tabular-nums ${beatsMarket ? 'text-emerald-700' : 'text-rose-700'}`}>{currentShare.toFixed(1)}%</span>
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
        {/* Market line (dashed gray) */}
        <path d={marketPath} fill="none" stroke={marketColor} strokeWidth={1.5} strokeDasharray="4 3" />
        {/* Your line — color reflects above/below market */}
        <path d={yourPath} fill="none" stroke={yourColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* Endpoints */}
        <circle cx={xPos(data.length - 1)} cy={yPos(last.yourShare)} r={3} fill={yourColor} />
        <circle cx={xPos(data.length - 1)} cy={yPos(last.marketShare)} r={2.5} fill="white" stroke={marketColor} strokeWidth={1.5} />
        {/* Hover indicator: vertical line + two dots */}
        {hovered && hoverIdx != null && (
          <g pointerEvents="none">
            <line
              x1={xPos(hoverIdx)} y1={pad}
              x2={xPos(hoverIdx)} y2={h - pad}
              stroke="#0F172A" strokeWidth={1} strokeDasharray="2 2" opacity={0.4}
            />
            <circle cx={xPos(hoverIdx)} cy={yPos(hovered.yourShare)}   r={3.5} fill={yourColor}   stroke="white" strokeWidth={1.5} />
            <circle cx={xPos(hoverIdx)} cy={yPos(hovered.marketShare)} r={3.5} fill="white" stroke={marketColor} strokeWidth={2} />
          </g>
        )}
      </svg>
      {/* Footer — flips to pp delta on hover */}
      <div className="flex items-center justify-between mt-1 min-h-[12px]">
        {hovered ? (
          <span className={`text-[10px] font-semibold tabular-nums ${hoveredBeats ? 'text-emerald-700' : 'text-rose-700'}`}>
            {hoveredBeats ? '+' : ''}{hoveredDelta.toFixed(1)}pp vs market
          </span>
        ) : (
          <div className="flex items-center gap-3 text-[9px] text-gray-400">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5" style={{ backgroundColor: yourColor }} />Your share</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-gray-400" />Market</span>
          </div>
        )}
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
  { key: 'cartAdds',    label: 'Cart Adds' },
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
