import { useMemo, useState } from 'react';
import type { QueryRow } from './selectors';
import { QUADRANT_META } from './quadrant';
import { eur, pct, int } from '../searchfunnel/format';

type Axis = 'clickShare' | 'impShare' | 'purchShare';
const AXES: { key: Axis; label: string }[] = [
  { key: 'clickShare', label: 'Click share' }, { key: 'impShare', label: 'Impression share' }, { key: 'purchShare', label: 'Purchase share' },
];

/** Rank (percentile) position of a value in [0,1] — midrank for ties. Spreads a skewed
 *  set (long-tail volume, zero-inflated share) uniformly instead of piling it in a corner. */
function ranker(values: number[]): (v: number) => number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n <= 1) return () => 0.5;
  return (v: number) => {
    let lo = 0; while (lo < n && sorted[lo] < v) lo++;
    let hi = lo; while (hi < n && sorted[hi] === v) hi++;
    return ((lo + hi - 1) / 2) / (n - 1);
  };
}
/** Value at percentile p of an already-sorted array (linear interpolation). */
function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}
const fmtVol = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v)));

export default function PortfolioMap({ rows, onSelect }: {
  rows: QueryRow[]; thresholds: { volSplit: number; shareSplit: number }; onSelect: (r: QueryRow) => void;
}) {
  const [axis, setAxis] = useState<Axis>('clickShare');
  const [hover, setHover] = useState<QueryRow | null>(null);
  const W = 960, H = 420, padL = 54, padR = 20, padT = 20, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const plotted = rows.filter((r) => r.volumeWk > 0);
  const geom = useMemo(() => {
    if (!plotted.length) return null;
    const vols = plotted.map((r) => r.volumeWk);
    const ys = plotted.map((r) => r[axis]);
    const maxPurch = Math.max(1, ...plotted.map((r) => r.purchases));
    const vSorted = [...vols].sort((a, b) => a - b);
    const ySorted = [...ys].sort((a, b) => a - b);
    return {
      xRank: ranker(vols), yRank: ranker(ys), maxPurch,
      volAt: (p: number) => quantile(vSorted, p), shareAt: (p: number) => quantile(ySorted, p),
    };
  }, [plotted, axis]);
  if (!geom) return null;

  // Rank axes → uniform spread; median split (dead centre) → four balanced cells.
  const x = (v: number) => padL + geom.xRank(v) * plotW;
  const y = (v: number) => padT + (1 - geom.yRank(v)) * plotH;
  const xDiv = padL + plotW / 2;
  const yDiv = padT + plotH / 2;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Portfolio map</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Volume × your share, <span className="font-medium text-gray-600">ranked</span> so every keyword is visible and split at the <span className="font-medium text-gray-600">median</span> into four even cells. Dot size = your purchases, colour = 4-week trend.</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
          {AXES.map((a) => (
            <button key={a.key} onClick={() => setAxis(a.key)} className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${axis === a.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{a.label}</button>
          ))}
        </div>
      </div>
      <div className="relative px-5 py-4">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block">
          <rect x={xDiv} y={padT} width={padL + plotW - xDiv} height={yDiv - padT} fill={QUADRANT_META.defend.fill} />
          <rect x={padL} y={padT} width={xDiv - padL} height={yDiv - padT} fill={QUADRANT_META.harvest.fill} />
          <rect x={xDiv} y={yDiv} width={padL + plotW - xDiv} height={padT + plotH - yDiv} fill={QUADRANT_META.invest.fill} />
          <rect x={padL} y={yDiv} width={xDiv - padL} height={padT + plotH - yDiv} fill={QUADRANT_META.tail.fill} />

          <text x={padL + plotW - 8} y={padT + 16} textAnchor="end" fontSize="11" fontWeight="700" fill={QUADRANT_META.defend.dot}>DEFEND</text>
          <text x={padL + 8} y={padT + 16} textAnchor="start" fontSize="11" fontWeight="700" fill={QUADRANT_META.harvest.dot}>HARVEST</text>
          <text x={padL + plotW - 8} y={padT + plotH - 8} textAnchor="end" fontSize="11" fontWeight="700" fill={QUADRANT_META.invest.dot}>INVEST</text>
          <text x={padL + 8} y={padT + plotH - 8} textAnchor="start" fontSize="11" fontWeight="700" fill={QUADRANT_META.tail.dot}>TAIL</text>

          <line x1={xDiv} y1={padT} x2={xDiv} y2={padT + plotH} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4 3" />
          <line x1={padL} y1={yDiv} x2={padL + plotW} y2={yDiv} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4 3" />
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#E5E7EB" strokeWidth={1} />
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#E5E7EB" strokeWidth={1} />

          {[0.25, 0.5, 0.75].map((p) => (
            <text key={p} x={padL - 6} y={padT + (1 - p) * plotH + 3} textAnchor="end" fontSize="9" fontWeight={p === 0.5 ? 700 : 400} fill={p === 0.5 ? '#64748B' : '#94A3B8'}>{pct(geom.shareAt(p), 0)}</text>
          ))}
          {[0.25, 0.5, 0.75].map((p) => (
            <text key={p} x={padL + p * plotW} y={padT + plotH + 16} textAnchor="middle" fontSize="9" fontWeight={p === 0.5 ? 700 : 400} fill={p === 0.5 ? '#475569' : '#6B7280'}>{fmtVol(geom.volAt(p))}</text>
          ))}
          <text x={xDiv} y={padT + 30} textAnchor="middle" fontSize="8" fontWeight="600" fill="#94A3B8">median</text>
          <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#4B5563">Search volume / wk — ranked, ticks at 25 / 50 / 75th pct</text>

          {plotted.map((r) => {
            const rad = 4 + Math.sqrt(r.purchases / geom.maxPurch) * 12;
            const color = r.trend === 'up' ? '#10B981' : r.trend === 'down' ? '#EF4444' : '#94A3B8';
            return (
              <circle key={r.query} cx={x(r.volumeWk)} cy={y(r[axis])} r={rad} fill={color} fillOpacity={0.78}
                stroke={hover === r ? '#0F172A' : 'white'} strokeWidth={hover === r ? 2 : 1}
                className="cursor-pointer transition-all" onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(r)} />
            );
          })}
        </svg>

        {hover && (
          <div className="absolute bottom-3 left-5 right-5 bg-gray-900 text-white rounded-lg shadow-2xl px-4 py-3 max-w-2xl pointer-events-none">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold">{hover.query}</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-gray-300">{hover.quadrant}</span>
              <span className="text-[10px] text-gray-400 ml-auto">{int(hover.volumeWk)}/wk</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              {([['Impr', hover.impShare], ['Click', hover.clickShare], ['Basket', hover.basketShare], ['Purch', hover.purchShare]] as const).map(([l, v]) => (
                <div key={l}><div className="text-gray-400">{l} share</div><div className="font-bold tabular-nums">{pct(v)}</div></div>
              ))}
            </div>
            <div className="text-[10px] text-gray-300 mt-1.5">Opportunity {eur(hover.oppTotal)}/wk{hover.flags.length ? ` · ${hover.flags.filter((f) => f.key !== 'LOW_DATA').map((f) => f.label).slice(0, 2).join(' · ')}` : ''}</div>
          </div>
        )}
      </div>
      <div className="px-5 py-2 border-t border-gray-100 flex items-center gap-5 text-[10px] text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Trending up</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" />Flat</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Trending down</span>
        <span className="ml-auto text-gray-400">Dot size = weekly purchases · axes ranked · quadrants split at the median</span>
      </div>
    </div>
  );
}
