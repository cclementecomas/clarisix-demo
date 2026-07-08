// ─── SQP Portfolio Map ───────────────────────────────────────────────────
// BCG-style scatter: one dot per keyword.
//   X = market search volume (log scale)
//   Y = your click share (or purchase share — togglable)
//   Dot size = your purchases at that keyword
//   Dot color = 4-week trend (green up / gray flat / red down)
//   Four quadrant overlays: Defend / Niche wins / Invest / Tail
// Hover surfaces a mini funnel + headline numbers.
//
// Scaling strategy:
//   The map receives the full keyword catalog. It ranks by `rankBy`
//   (Opportunity or Purchases) and shows only the top N. Everything else
//   stays visible in the table below.

import { useMemo, useState } from 'react';
import type { KeywordRow } from '../../data/sqpData';

type ShareAxis = 'click' | 'purchase';
type RankBy = 'opportunity' | 'purchases';

const TOP_N_CHOICES: { value: number; label: string }[] = [
  { value: 25,        label: 'Top 25' },
  { value: 50,        label: 'Top 50' },
  { value: 100,       label: 'Top 100' },
  { value: 250,       label: 'Top 250' },
  { value: Infinity,  label: 'All' },
];

const RANK_BY_CHOICES: { value: RankBy; label: string; hint: string }[] = [
  { value: 'opportunity', label: 'Opportunity', hint: 'Volume × share gap vs your average' },
  { value: 'purchases',   label: 'Purchases',   hint: 'Weekly purchases captured' },
];

interface Dot {
  k: KeywordRow;
  cx: number;
  cy: number;
  r: number;
}

const QUADRANTS = [
  { id: 'defend',  label: 'Defend',  sub: 'Protect share, hold rank',     bg: 'rgba(16, 185, 129, 0.07)' }, // top-right
  { id: 'harvest', label: 'Harvest', sub: 'Maintain, optimize ACOS',      bg: 'rgba(99, 102, 241, 0.06)' }, // top-left
  { id: 'invest',  label: 'Invest',  sub: 'Increase bid / content / rank', bg: 'rgba(245, 158, 11, 0.08)' }, // bottom-right
  { id: 'tail',    label: 'Tail',    sub: 'Ignore or test cheaply',       bg: 'rgba(148, 163, 184, 0.07)' }, // bottom-left
];

export default function PortfolioMap({ keywords, onSelect }: {
  keywords: KeywordRow[];
  onSelect?: (k: KeywordRow) => void;
}) {
  const [axis, setAxis] = useState<ShareAxis>('click');
  const [rankBy, setRankBy] = useState<RankBy>('opportunity');
  const [topN, setTopN] = useState<number>(50);
  const [hovered, setHovered] = useState<KeywordRow | null>(null);

  const W = 980, H = 420, padL = 60, padR = 24, padT = 24, padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Rank + slice the full catalog into what the map should plot.
  const plotted = useMemo(() => {
    const ranked = [...keywords].sort((a, b) => {
      if (rankBy === 'opportunity') return b.opportunityScore - a.opportunityScore;
      return b.purchases.brandCount - a.purchases.brandCount;
    });
    return ranked.slice(0, topN);
  }, [keywords, rankBy, topN]);

  if (plotted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Portfolio map</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">No keywords to display.</p>
        </div>
      </div>
    );
  }

  const allVols = plotted.map((k) => k.marketVolume);
  const minVol = Math.min(...allVols);
  const maxVol = Math.max(...allVols);
  const logMin = Math.log10(Math.max(1, minVol));
  const logMax = Math.log10(Math.max(1, maxVol));

  const yMax = Math.max(...plotted.map((k) => axis === 'click' ? k.clicks.share : k.purchases.share)) * 1.05;

  const maxPurchases = Math.max(...plotted.map((k) => k.purchases.brandCount), 1);

  const dots: Dot[] = useMemo(() => plotted.map((k) => {
    const xv = Math.log10(Math.max(1, k.marketVolume));
    const xn = (xv - logMin) / (logMax - logMin || 1);
    const yv = axis === 'click' ? k.clicks.share : k.purchases.share;
    const yn = yv / yMax;
    const r = 4 + Math.sqrt(k.purchases.brandCount / maxPurchases) * 12;
    return {
      k,
      cx: padL + xn * plotW,
      cy: padT + (1 - yn) * plotH,
      r,
    };
  }), [plotted, axis, logMin, logMax, yMax, maxPurchases, padL, plotW, padT, plotH]);

  // Quadrant divider lines = volume median / share median (of plotted set)
  const volMedian = [...allVols].sort((a, b) => a - b)[Math.floor(allVols.length / 2)];
  const shareMedian = [...plotted].map((k) => axis === 'click' ? k.clicks.share : k.purchases.share).sort((a, b) => a - b)[Math.floor(plotted.length / 2)];
  const xDiv = padL + ((Math.log10(Math.max(1, volMedian)) - logMin) / (logMax - logMin || 1)) * plotW;
  const yDiv = padT + (1 - shareMedian / yMax) * plotH;

  const trendColor = (trend: number) => {
    if (trend > 2) return '#10B981';
    if (trend < -2) return '#EF4444';
    return '#94A3B8';
  };

  const xTicks = [1000, 5000, 10000, 25000];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Portfolio map</h3>
            <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {plotted.length} of {keywords.length}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Each dot is a keyword. Position = market volume × your share. Size = your purchases. Color = 4-week trend.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] flex-wrap">
          <label className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Rank by</span>
            <select
              value={rankBy}
              onChange={(e) => setRankBy(e.target.value as RankBy)}
              title={RANK_BY_CHOICES.find((c) => c.value === rankBy)?.hint}
              className="text-[11px] font-semibold text-gray-800 bg-white border border-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none cursor-pointer"
            >
              {RANK_BY_CHOICES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Show</span>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="text-[11px] font-semibold text-gray-800 bg-white border border-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none cursor-pointer"
            >
              {TOP_N_CHOICES.map((c) => (
                <option key={c.label} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <span className="text-gray-200">·</span>
          <label className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Y-axis</span>
            <div className="flex items-center bg-gray-100 rounded-md p-0.5">
              <button
                onClick={() => setAxis('click')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${
                  axis === 'click' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Click share
              </button>
              <button
                onClick={() => setAxis('purchase')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${
                  axis === 'purchase' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Purchase share
              </button>
            </div>
          </label>
        </div>
      </div>

      <div className="relative px-5 py-4">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block">
          {/* Quadrant backgrounds */}
          <rect x={xDiv} y={padT} width={padL + plotW - xDiv} height={yDiv - padT} fill={QUADRANTS[0].bg} />
          <rect x={padL}  y={padT} width={xDiv - padL}              height={yDiv - padT} fill={QUADRANTS[1].bg} />
          <rect x={xDiv}  y={yDiv} width={padL + plotW - xDiv}     height={padT + plotH - yDiv} fill={QUADRANTS[2].bg} />
          <rect x={padL}  y={yDiv} width={xDiv - padL}              height={padT + plotH - yDiv} fill={QUADRANTS[3].bg} />

          {/* Quadrant labels — name + action subtitle */}
          <text x={padL + plotW - 8}        y={padT + 18}                textAnchor="end"   fontSize="11" fontWeight="700" fill="#10B981" fontFamily="system-ui">DEFEND</text>
          <text x={padL + plotW - 8}        y={padT + 32}                textAnchor="end"   fontSize="9"  fill="#6B7280" fontFamily="system-ui">Protect share, hold rank</text>
          <text x={padL + 8}                y={padT + 18}                textAnchor="start" fontSize="11" fontWeight="700" fill="#6366F1" fontFamily="system-ui">HARVEST</text>
          <text x={padL + 8}                y={padT + 32}                textAnchor="start" fontSize="9"  fill="#6B7280" fontFamily="system-ui">Maintain, optimize ACOS</text>
          <text x={padL + plotW - 8}        y={padT + plotH - 24}        textAnchor="end"   fontSize="11" fontWeight="700" fill="#F59E0B" fontFamily="system-ui">INVEST</text>
          <text x={padL + plotW - 8}        y={padT + plotH - 10}        textAnchor="end"   fontSize="9"  fill="#6B7280" fontFamily="system-ui">Increase bid / content / rank</text>
          <text x={padL + 8}                y={padT + plotH - 24}        textAnchor="start" fontSize="11" fontWeight="700" fill="#94A3B8" fontFamily="system-ui">TAIL</text>
          <text x={padL + 8}                y={padT + plotH - 10}        textAnchor="start" fontSize="9"  fill="#6B7280" fontFamily="system-ui">Ignore or test cheaply</text>

          {/* Quadrant dividers */}
          <line x1={xDiv} y1={padT}        x2={xDiv} y2={padT + plotH} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4 3" />
          <line x1={padL} y1={yDiv}        x2={padL + plotW} y2={yDiv} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4 3" />

          {/* Axes */}
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#E5E7EB" strokeWidth={1} />
          <line x1={padL} y1={padT}         x2={padL}          y2={padT + plotH} stroke="#E5E7EB" strokeWidth={1} />

          {/* X ticks */}
          {xTicks.filter((v) => v >= minVol && v <= maxVol).map((v) => {
            const x = padL + ((Math.log10(v) - logMin) / (logMax - logMin || 1)) * plotW;
            return (
              <g key={v}>
                <line x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + 4} stroke="#9CA3AF" strokeWidth={1} />
                <text x={x} y={padT + plotH + 18} textAnchor="middle" fontSize="10" fill="#6B7280" fontFamily="system-ui">{v >= 1000 ? `${v / 1000}k` : v}</text>
              </g>
            );
          })}
          <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="#4B5563" fontFamily="system-ui">Market search volume (log)</text>

          {/* Y ticks */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const v = (yMax * pct) / 100;
            const y = padT + (1 - pct / 100) * plotH;
            return (
              <g key={pct}>
                <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#9CA3AF" strokeWidth={1} />
                <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#6B7280" fontFamily="system-ui">{v.toFixed(0)}%</text>
              </g>
            );
          })}
          <text
            x={16} y={padT + plotH / 2}
            textAnchor="middle" fontSize="10" fontWeight="600" fill="#4B5563" fontFamily="system-ui"
            transform={`rotate(-90, 16, ${padT + plotH / 2})`}
          >
            Your {axis === 'click' ? 'click' : 'purchase'} share
          </text>

          {/* Dots */}
          {dots.map((d) => (
            <circle
              key={d.k.query}
              cx={d.cx} cy={d.cy} r={d.r}
              fill={trendColor(d.k.trend4w)}
              fillOpacity={0.78}
              stroke={hovered === d.k ? '#0F172A' : 'white'}
              strokeWidth={hovered === d.k ? 2 : 1}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHovered(d.k)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(d.k)}
            />
          ))}
        </svg>

        {/* Hover panel */}
        {hovered && (
          <div className="absolute bottom-3 left-5 right-5 bg-gray-900 text-white rounded-lg shadow-2xl px-4 py-3 max-w-2xl pointer-events-none">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-white">{hovered.query}</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                hovered.status === 'defend' ? 'bg-emerald-500/20 text-emerald-300'
                : hovered.status === 'invest' ? 'bg-amber-500/20 text-amber-300'
                : hovered.status === 'harvest' ? 'bg-indigo-500/20 text-indigo-300'
                : 'bg-gray-500/20 text-gray-400'
              }`}>{hovered.status}</span>
              <span className="text-[10px] text-gray-400 ml-auto">{hovered.intent}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-[10px]">
              <div><div className="text-gray-400">Market vol</div><div className="font-bold tabular-nums">{hovered.marketVolume.toLocaleString()}/wk</div></div>
              <div><div className="text-gray-400">Impr share</div><div className="font-bold tabular-nums">{hovered.impressions.share.toFixed(1)}%</div></div>
              <div><div className="text-gray-400">Click share</div><div className="font-bold tabular-nums">{hovered.clicks.share.toFixed(1)}%</div></div>
              <div><div className="text-gray-400">ATC share</div><div className="font-bold tabular-nums">{hovered.cartAdds.share.toFixed(1)}%</div></div>
              <div><div className="text-gray-400">Purch share</div><div className="font-bold tabular-nums">{hovered.purchases.share.toFixed(1)}%</div></div>
            </div>
            <div className="text-[10px] text-gray-300 mt-1.5">{hovered.action} · Opportunity €{hovered.opportunityEur.toLocaleString()}/wk</div>
          </div>
        )}
      </div>

      <div className="px-5 py-2 border-t border-gray-100 flex items-center gap-5 text-[10px] text-gray-500 flex-wrap">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} /><span>Trending up (4w)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#94A3B8' }} /><span>Flat</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EF4444' }} /><span>Trending down</span></div>
        <div className="ml-auto text-gray-400">Dot size = weekly purchases</div>
      </div>
    </div>
  );
}
