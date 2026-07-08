// ─── SQP Keyword Portfolio Table ────────────────────────────────────────
// Prioritized columns for decision-making. Row click opens the keyword
// detail drawer (overlay panel). Clicking a funnel-share VALUE instead pops
// up a 12-week trendline for just that metric (without opening the drawer).
//
// Columns:
//   Keyword · Portfolio · Market Vol · Impr Share · Click Share · ATC Share ·
//   Purch Share · Diagnosis · Opportunity · ACOS / PPC
// The four funnel shares are Brand ÷ Total at each stage (Amazon SQP).

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { KeywordRow, KeywordIntent, KeywordTrendPoint } from '../../data/sqpData';
import {
  QUADRANT_LABEL, QUADRANT_STYLE, DIAGNOSIS_STYLE,
  keywordQuadrant, keywordDiagnosis,
  sqpSummary,
} from '../../data/sqpData';
import InfoTooltip from '../InfoTooltip';

const INTENT_LABEL: Record<KeywordIntent, string> = {
  branded: 'Branded',
  generic: 'Generic',
  competitor: 'Competitor',
  longTail: 'Long-tail',
  category: 'Category',
};

type ShareMetric = 'impressions' | 'clicks' | 'cartAdds' | 'purchases';

const SHARE_META: Record<ShareMetric, { label: string; field: keyof KeywordTrendPoint; color: string; of: string }> = {
  impressions: { label: 'Impression share', field: 'yourImpressionShare', color: '#0E5A8A', of: 'impressions' },
  clicks:      { label: 'Click share',      field: 'yourClickShare',      color: '#0EA5E9', of: 'clicks' },
  cartAdds:    { label: 'Cart-add share',   field: 'yourCartAddShare',    color: '#F59E0B', of: 'cart adds' },
  purchases:   { label: 'Purchase share',   field: 'yourPurchaseShare',   color: '#10B981', of: 'purchases' },
};

interface PopState { query: string; row: KeywordRow; metric: ShareMetric; rect: DOMRect; }

export default function KeywordTable({
  rows, selectedKeyword, onSelect, portfolioAvgClickShare,
}: {
  rows: KeywordRow[];
  selectedKeyword: string | null;
  onSelect: (k: KeywordRow | null) => void;
  portfolioAvgClickShare: number;
}) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.opportunityEur - a.opportunityEur),
    [rows]
  );

  const [pop, setPop] = useState<PopState | null>(null);

  const openTrend = (row: KeywordRow, metric: ShareMetric, rect: DOMRect) => {
    setPop((cur) => (cur && cur.query === row.query && cur.metric === metric ? null : { query: row.query, row, metric, rect }));
  };

  // Close the trend popover on outside click, Escape, or scroll.
  useEffect(() => {
    if (!pop) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-trend-popover]')) setPop(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPop(null); };
    const onScroll = () => setPop(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [pop]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Prioritized keywords</h3>
        <span className="text-[10px] text-gray-400">
          {sorted.length} keywords · sorted by opportunity · click a row for detail, or a share for its 12-week trend
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 min-w-[240px]">Keyword</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <span className="inline-flex items-center gap-1">Portfolio<InfoTooltip content="Where this keyword sits on the Portfolio map: search volume × your click share. Defend = big & you're winning it (protect). Invest = big & under-won (your biggest growth). Harvest = small & winning (milk it, don't overspend). Tail = small & under-won (ignore or test cheaply)." /></span>
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Market Vol</th>
              <ShareTh label="Impr Share" tip="Impression share = your brand's impressions ÷ TOTAL impressions for this query. Of all the times any product showed for this search, this % were yours. Rule of thumb (not a hard limit): rarely above ~7% per child ASIN, so ~4%+ is often already strong; a low single-digit share on a big keyword usually means shoppers can barely find you (see Diagnosis)." />
              <ShareTh label="Click Share" tip="Click share = your brand's clicks ÷ TOTAL clicks for this query. Of all clicks from this search, this % went to your products." />
              <ShareTh label="ATC Share" tip="Cart-add share = your brand's cart-adds ÷ TOTAL cart-adds for this query. Of all add-to-carts from this search, this % were your products." />
              <ShareTh label="Purch Share" tip="Purchase share = your brand's purchases ÷ TOTAL purchases for this query. Of all purchases attributed to this search, this % were your products." />
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <span className="inline-flex items-center gap-1">Diagnosis<InfoTooltip content="The funnel stage that's leaking, from your own shares (no guesswork): CTR problem = seen but not clicked (impression share > click share). CVR problem = clicked but not bought (click share > purchase share). Cannibalization = PPC buying clicks organic already wins (click share ≥ 2× impression share). Visibility gap = barely shown on a big keyword (impression share < 2%). Consistent = shares in line, no single leak." /></span>
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Opportunity</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">ACOS / PPC</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const quadrant = keywordQuadrant(r, sqpSummary.volumeMedian, portfolioAvgClickShare);
              const quadStyle = QUADRANT_STYLE[quadrant];
              const dx = keywordDiagnosis(r);
              const dxStyle = DIAGNOSIS_STYLE[dx.key];
              const isSelected = selectedKeyword === r.query;
              const isActive = (m: ShareMetric) => pop?.query === r.query && pop?.metric === m;
              return (
                <tr
                  key={r.query}
                  onClick={() => onSelect(isSelected ? null : r)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-cx-50/40' : 'hover:bg-gray-50/40'}`}
                >
                  <td className="px-3 py-2 align-top">
                    <div className="text-[12px] font-semibold text-gray-900">{r.query}</div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">
                      {INTENT_LABEL[r.intent]}{r.branded ? ' · branded' : ''}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ring-1 ring-inset ${quadStyle.bg} ${quadStyle.text} ${quadStyle.ring}`}>
                      {QUADRANT_LABEL[quadrant]}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="text-[12px] font-semibold text-gray-900 tabular-nums">{r.marketVolume.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-400">/wk</div>
                  </td>
                  <ShareTd row={r} metric="impressions" share={r.impressions.share} active={isActive('impressions')} onOpen={openTrend} />
                  <ShareTd row={r} metric="clicks"      share={r.clicks.share}      active={isActive('clicks')}      onOpen={openTrend} />
                  <ShareTd row={r} metric="cartAdds"    share={r.cartAdds.share}    active={isActive('cartAdds')}    onOpen={openTrend} />
                  <ShareTd row={r} metric="purchases"   share={r.purchases.share}   active={isActive('purchases')}   onOpen={openTrend} />
                  <td className="px-3 py-2 align-top">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${dxStyle.bg} ${dxStyle.text} ${dxStyle.ring}`}>
                      {dx.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="text-[12px] font-bold text-emerald-700 tabular-nums">€{r.opportunityEur.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-400">/wk if closed half</div>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className={`text-[12px] font-semibold tabular-nums ${r.ppc.acos > 35 ? 'text-rose-700' : r.ppc.acos > 25 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {r.ppc.acos.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-gray-500 tabular-nums">€{r.ppc.spend}/wk</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pop && <TrendPopover row={pop.row} metric={pop.metric} rect={pop.rect} onClose={() => setPop(null)} />}
    </div>
  );
}

/** Right-aligned funnel-share header with a formula explainer. */
function ShareTh({ label, tip }: { label: string; tip: string }) {
  return (
    <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
      <span className="inline-flex items-center gap-1 flex-row-reverse">{label}<InfoTooltip content={tip} /></span>
    </th>
  );
}

/** Funnel-share cell — click the value to open its 12-week trendline. */
function ShareTd({ row, metric, share, active, onOpen }: {
  row: KeywordRow;
  metric: ShareMetric;
  share: number;
  active: boolean;
  onOpen: (row: KeywordRow, metric: ShareMetric, rect: DOMRect) => void;
}) {
  return (
    <td className="px-3 py-2 align-top text-right">
      <button
        onClick={(e) => { e.stopPropagation(); onOpen(row, metric, (e.currentTarget as HTMLElement).getBoundingClientRect()); }}
        title="Show 12-week trend"
        className={`inline-flex flex-col items-end rounded px-1 -mx-1 transition-colors hover:bg-cx-50 ${active ? 'bg-cx-50 ring-1 ring-cx-200' : ''}`}
      >
        <span className="text-[12px] font-semibold text-gray-900 tabular-nums border-b border-dotted border-gray-300 leading-tight">{share.toFixed(1)}%</span>
        <span className="text-[9px] text-gray-400">of {SHARE_META[metric].of}</span>
      </button>
    </td>
  );
}

/** Floating 12-week trendline for one share metric of one keyword. */
function TrendPopover({ row, metric, rect, onClose }: {
  row: KeywordRow;
  metric: ShareMetric;
  rect: DOMRect;
  onClose: () => void;
}) {
  const meta = SHARE_META[metric];
  const pts = row.trendValues.map((p) => Number(p[meta.field]));
  const weeks = row.trendValues.map((p) => p.week);
  if (pts.length === 0) return null;

  const W = 248, H = 88, pad = 10;
  const min = Math.min(...pts), max = Math.max(...pts);
  const spread = max - min;
  const lo = Math.max(0, min - spread * 0.25 - 0.2);
  const hi = max + spread * 0.25 + 0.2;
  const range = hi - lo || 1;
  const xStep = pts.length > 1 ? (W - pad * 2) / (pts.length - 1) : 0;
  const x = (i: number) => pad + i * xStep;
  const y = (v: number) => pad + (1 - (v - lo) / range) * (H - pad * 2);
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(pts.length - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;

  const cur = pts[pts.length - 1];
  const first = pts[0];
  const delta = +(cur - first).toFixed(1);
  const up = delta >= 0;

  const width = 264;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  const openBelow = rect.bottom + 176 < window.innerHeight;
  const top = openBelow ? rect.bottom + 6 : Math.max(8, rect.top - 178);

  return createPortal(
    <div
      data-trend-popover
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-[60] bg-white rounded-lg border border-gray-200 shadow-2xl p-3"
      style={{ left, top, width }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-gray-900 truncate" title={row.query}>{row.query}</div>
          <div className="text-[10px] text-gray-500">{meta.label} · 12 weeks</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-[11px] leading-none px-1" aria-label="Close">✕</button>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-lg font-bold tabular-nums" style={{ color: meta.color }}>{cur.toFixed(1)}%</span>
        <span className={`text-[10px] font-semibold tabular-nums ${up ? 'text-emerald-700' : 'text-rose-700'}`}>
          {up ? '▲' : '▼'} {up ? '+' : ''}{delta.toFixed(1)}pp vs 12w ago
        </span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block">
        <path d={area} fill={meta.color} fillOpacity={0.08} />
        <path d={line} fill="none" stroke={meta.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(pts.length - 1)} cy={y(cur)} r={3} fill={meta.color} />
      </svg>
      <div className="flex items-center justify-between text-[9px] text-gray-400 mt-1">
        <span>{weeks[0]}</span>
        <span>range {min.toFixed(1)}–{max.toFixed(1)}%</span>
        <span>{weeks[weeks.length - 1]}</span>
      </div>
    </div>,
    document.body
  );
}
