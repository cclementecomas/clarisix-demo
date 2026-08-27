import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import InfoTooltip from '../InfoTooltip';
import type { SqpRow } from '../../lib/sqp/types';
import { parityBridge } from '../../lib/sqp/verdict';
import { STAGE_COLOR, TRANSITION_NAME } from '../sqpui/tokens';
import { pct, abbrev } from '../searchfunnel/format';

/** Search share, level A: how big your slice of the market is at each funnel stage, and
 *  how many pp it gains or loses between stages. Deliberately says nothing about your
 *  conversion RATES — the rates that move these bars are the Search funnel page. */
const IDENTITY_NOTE =
  'Share at each stage = your count ÷ the market count (impressions, clicks, basket adds, purchases). Your slice changes between stages only because your conversion at that step differs from the market\'s — that comparison lives on the Search funnel page.';

const STAGE_META = [
  { stage: 'impressions' as const, label: 'Impression share' },
  { stage: 'clicks' as const, label: 'Click share' },
  { stage: 'baskets' as const, label: 'Basket share' },
  { stage: 'purchases' as const, label: 'Purchase share' },
];

export default function ShareLevels({ rows, onOpenFunnel }: {
  rows: SqpRow[];
  onOpenFunnel?: () => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const b = parityBridge(rows);

  const c0 = b.impShare;
  const shares = [c0, c0 + b.steps[0].deltaShare, c0 + b.steps[0].deltaShare + b.steps[1].deltaShare, b.purchShare];
  const hi = Math.max(0.01, Math.max(...shares) * 1.3);

  const W = 760, H = 232, padL = 20, padT = 44, padB = 46, padR = 20;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const colW = plotW / 4, barW = colW * 0.44;
  const cx = (i: number) => padL + colW * (i + 0.5);
  const y = (v: number) => padT + (1 - v / hi) * plotH;
  const base = y(0);

  const worstStep = b.steps.reduce((a, s) => (s.deltaShare < a.deltaShare ? s : a));
  const anyLoss = worstStep.deltaShare < -0.0005;
  const soWhat = anyLoss
    ? `Your slice shrinks most at ${TRANSITION_NAME[worstStep.key]} (${(worstStep.deltaShare * 100).toFixed(1)}pp).`
    : `Your slice grows at every stage — ${pct(b.impShare)} of impressions becomes ${pct(b.purchShare)} of purchases.`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">Your share of the market at each stage<InfoTooltip content={IDENTITY_NOTE} wide /></h3>
        <p className="text-[11px] text-gray-500 mt-0.5">Each bar is your slice of the whole market at that stage — {pct(b.impShare)} of impressions through to {pct(b.purchShare)} of purchases. The number between two bars is how many percentage points of share that step adds or costs you.</p>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mt-1">
          <p className="text-[12px] text-gray-700 leading-relaxed max-w-3xl"><span className="font-semibold">So what:</span> <span className="text-gray-600">{soWhat}</span></p>
          {onOpenFunnel && (
            <button onClick={onOpenFunnel} className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-cx-600 hover:text-cx-700">
              Why it moves — Search funnel <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full">
            <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="#E5E7EB" strokeWidth={1} />

            {/* step connectors — labelled in pp of SHARE only (no rate ratios: that's level B) */}
            {b.steps.map((s, j) => {
              const yFrom = y(shares[j]), yTo = y(shares[j + 1]);
              const xFrom = cx(j) + barW / 2, xTo = cx(j + 1) - barW / 2;
              const midX = (cx(j) + cx(j + 1)) / 2;
              const up = s.deltaShare > 0.0005, down = s.deltaShare < -0.0005;
              const col = up ? '#047857' : down ? '#B91C1C' : '#64748B';
              const isLeak = b.biggestLeakKey === s.key;
              const chipY = Math.min(yFrom, yTo) - 13;
              return (
                <g key={s.key} className={onOpenFunnel ? 'cursor-pointer' : undefined}
                  onMouseEnter={() => setHover(j)} onMouseLeave={() => setHover(null)} onClick={onOpenFunnel}>
                  <rect x={xFrom} y={padT} width={Math.max(1, xTo - xFrom)} height={base - padT} fill="transparent" />
                  <line x1={xFrom} y1={yFrom} x2={xTo} y2={yTo} stroke={col} strokeWidth={hover === j ? 2.5 : 1.5} strokeDasharray="3 2" />
                  {isLeak && <rect x={midX - 30} y={chipY - 26} width={60} height={13} rx={6} fill="#B91C1C" />}
                  {isLeak && <text x={midX} y={chipY - 16.5} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="white">BIGGEST DROP</text>}
                  <text x={midX} y={chipY} textAnchor="middle" fontSize="12" fontWeight="800" fill={col}>
                    {up ? '▲ +' : down ? '▼ ' : '= '}{(s.deltaShare * 100).toFixed(1)}pp
                  </text>
                  <text x={midX} y={chipY + 10} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#94A3B8">of share</text>
                </g>
              );
            })}

            {STAGE_META.map((meta, i) => {
              const yTop = y(shares[i]);
              const first = i === 0, last = i === STAGE_META.length - 1;
              return (
                <g key={meta.stage}>
                  <rect x={cx(i) - barW / 2} y={yTop} width={barW} height={base - yTop} rx={4} fill={STAGE_COLOR[meta.stage]} fillOpacity={first ? 0.34 : last ? 1 : 0.85} />
                  <rect x={cx(i) - barW / 2} y={base - 4} width={barW} height={4} fill={STAGE_COLOR[meta.stage]} fillOpacity={first ? 0.34 : last ? 1 : 0.85} />
                  <text x={cx(i)} y={yTop - 8} textAnchor="middle" fontSize={last ? 15 : 13} fontWeight={last ? 800 : 700} fill="#1F2937">{pct(shares[i])}</text>
                  <text x={cx(i)} y={base + 17} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#475569">{meta.label}</text>
                  <text x={cx(i)} y={base + 29} textAnchor="middle" fontSize="8.5" fill="#94A3B8">
                    {abbrev(b.counts[i].you)} of {abbrev(b.counts[i].market)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">Brand-average share across the keywords in scope. Per-keyword share sits in the table below; per-ASIN share is in the Analyst view.</p>
      </div>
    </div>
  );
}
