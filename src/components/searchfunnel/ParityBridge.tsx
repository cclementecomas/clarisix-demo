import { useState } from 'react';
import InfoTooltip from '../InfoTooltip';
import type { SqpRow, TransitionKey } from '../../lib/sqp/types';
import { parityBridge } from '../../lib/sqp/verdict';
import { STAGE_COLOR, TRANSITION_NAME } from '../sqpui/tokens';
import { pct, abbrev } from './format';

const IDENTITY_NOTE =
  'This is exact, not an estimate: purchase share = impression share × (your CTR ÷ market CTR) × (your basket-add ÷ market) × (your close ÷ market). Each step is how much share that transition adds or loses versus the market — the red steps are where you fall behind.';

const STEP_FROM: Record<TransitionKey, number> = { imp_click: 0, click_basket: 1, basket_purch: 2 };
const RATE_LABEL: Record<TransitionKey, string> = { imp_click: 'click rate', click_basket: 'basket-add rate', basket_purch: 'purchase rate' };

export default function ParityBridge({ rows, onFocusStage }: {
  rows: SqpRow[]; onFocusStage: (s: TransitionKey) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const b = parityBridge(rows); // badge follows the biggest share DROP — self-consistent with the "so what"

  // 4 share LEVELS — impression → click → basket → purchase share. The 3 transitions sit on the gaps between them.
  const c0 = b.impShare;
  const shares = [c0, c0 + b.steps[0].deltaShare, c0 + b.steps[0].deltaShare + b.steps[1].deltaShare, b.purchShare];
  const hiShare = Math.max(0.01, Math.max(...shares) * 1.32); // 0-based funnel, headroom for labels

  const W = 760, H = 240, padL = 20, padT = 48, padB = 50, padR = 20;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const cols = 4, colW = plotW / cols, barW = colW * 0.44;
  const cx = (i: number) => padL + colW * (i + 0.5);
  const y = (v: number) => padT + (1 - v / hiShare) * plotH; // baseline at 0
  const base = y(0);

  const STAGE_META = [
    { stage: 'impressions' as const, label: 'Impression share' },
    { stage: 'clicks' as const, label: 'Click share' },
    { stage: 'baskets' as const, label: 'Basket share' },
    { stage: 'purchases' as const, label: 'Purchase share' },
  ];

  const worstStep = b.steps.reduce((a, s) => (s.deltaShare < a.deltaShare ? s : a));
  const anyLoss = worstStep.deltaShare < -0.0005;
  const soWhat = anyLoss
    ? `If you matched the market at every step you'd hold ${pct(b.impShare)} of purchases; you actually hold ${pct(b.purchShare)} — ${worstStep.label.replace(' effect', '')} costs the most (${(worstStep.deltaShare * 100).toFixed(1)}pp).`
    : `You hold ${pct(b.impShare)} of impressions but ${pct(b.purchShare)} of purchases — you're at or above the market at every step, so your slice only grows down the funnel.`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">Where your market share is won &amp; lost<InfoTooltip content={IDENTITY_NOTE} wide /></h3>
        <p className="text-[11px] text-gray-500 mt-0.5">The bars are your <span className="font-semibold text-gray-600">share of the market</span> ({pct(b.impShare)} of impressions → {pct(b.purchShare)} of purchases). Each step multiplies that share by your <span className="font-semibold text-gray-600">conversion rate ÷ the market's</span> — the <span className="font-semibold text-gray-600">×market</span> between the bars. Over 1× your slice grows; under 1× it shrinks.</p>
        <p className="text-[12px] text-gray-700 leading-relaxed mt-1 max-w-4xl"><span className="font-semibold">So what:</span> <span className="text-gray-600">{soWhat}</span></p>
      </div>
      <div className="px-4 py-3">
        <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full">
          {/* baseline */}
          <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="#E5E7EB" strokeWidth={1} />

          {/* transitions — connector + ×market on the GAP between adjacent bars */}
          {b.steps.map((s, j) => {
            const yFrom = y(shares[j]), yTo = y(shares[j + 1]);
            const xFrom = cx(j) + barW / 2, xTo = cx(j + 1) - barW / 2;
            const midX = (cx(j) + cx(j + 1)) / 2;
            const ratio = s.marketRate ? (s.yourRate ?? 0) / s.marketRate : null;
            const up = s.deltaShare > 0.0005, down = s.deltaShare < -0.0005;
            const col = up ? '#059669' : down ? '#DC2626' : '#64748B';
            const isLeak = b.biggestLeakKey === s.key;
            const chipY = Math.min(yFrom, yTo) - 13;
            return (
              <g key={s.key} className="cursor-pointer" onMouseEnter={() => setHover(j)} onMouseLeave={() => setHover(null)} onClick={() => onFocusStage(s.key)}>
                {/* hit area across the gap */}
                <rect x={xFrom} y={padT} width={Math.max(1, xTo - xFrom)} height={base - padT} fill="transparent" />
                {/* slope connector between the two bar tops */}
                <line x1={xFrom} y1={yFrom} x2={xTo} y2={yTo} stroke={col} strokeWidth={hover === j ? 2.5 : 1.5} strokeDasharray="3 2" />
                {isLeak && <rect x={midX - 30} y={chipY - 24} width={60} height={13} rx={6} fill="#DC2626" />}
                {isLeak && <text x={midX} y={chipY - 14.5} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="white">BIGGEST DROP</text>}
                <text x={midX} y={chipY} textAnchor="middle" fontSize="12" fontWeight="800" fill={col}>{ratio != null ? `${ratio.toFixed(2)}×` : '—'}</text>
                <text x={midX} y={chipY + 10} textAnchor="middle" fontSize="8.5" fontWeight="600" fill={col}>{up ? '+' : ''}{(s.deltaShare * 100).toFixed(1)}pp</text>
              </g>
            );
          })}

          {/* the 4 share bars */}
          {STAGE_META.map((meta, i) => {
            const yTop = y(shares[i]);
            const first = i === 0, last = i === STAGE_META.length - 1;
            return (
              <g key={meta.stage}>
                <rect x={cx(i) - barW / 2} y={yTop} width={barW} height={base - yTop} rx={3} fill={STAGE_COLOR[meta.stage]} fillOpacity={first ? 0.34 : last ? 1 : 0.85} />
                <text x={cx(i)} y={yTop - 8} textAnchor="middle" fontSize={last ? 15 : 13} fontWeight={last ? 800 : 700} fill="#1F2937">{pct(shares[i])}</text>
                <text x={cx(i)} y={base + 17} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#475569">{meta.label}</text>
              </g>
            );
          })}
        </svg>
        {hover != null && (() => {
          const s = b.steps[hover];
          const from = shares[STEP_FROM[s.key]], to = shares[STEP_FROM[s.key] + 1];
          const ratio = s.marketRate ? (s.yourRate ?? 0) / s.marketRate : null;
          const fromYouWk = b.counts[STEP_FROM[s.key]].you;               // your upstream volume /wk
          const diffUnits = Math.round(fromYouWk * ((s.yourRate ?? 0) - (s.marketRate ?? 0)));
          const noun = s.key === 'imp_click' ? 'clicks' : s.key === 'click_basket' ? 'basket adds' : 'purchases';
          const up = s.deltaShare >= 0;
          const midX = (cx(hover) + cx(hover + 1)) / 2;
          const topY = Math.min(y(from), y(to));
          return (
            <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-10"
              style={{ left: `${(midX / W) * 100}%`, top: `${(topY / H) * 100}%` }}>
              <div className="mb-2 bg-gray-900 text-white rounded-md px-2.5 py-1.5 shadow-lg w-max max-w-[240px]">
                <div className="text-[11px] font-bold">{TRANSITION_NAME[s.key]}</div>
                <div className="text-[10px] text-gray-300">your {RATE_LABEL[s.key]} {pct(s.yourRate ?? 0)} vs market {pct(s.marketRate ?? 0)}{ratio != null && <> · <span className={up ? 'text-emerald-300' : 'text-rose-300'}>{ratio.toFixed(2)}× the market</span></>}</div>
                <div className="text-[10px] text-white mt-0.5">≈ <span className="font-semibold">{Math.abs(diffUnits)} {up ? 'more' : 'fewer'} {noun}/wk</span> than keeping pace with the market</div>
                <div className={`text-[10px] font-semibold mt-0.5 ${up ? 'text-emerald-300' : 'text-rose-300'}`}>→ your slice {pct(from)} → {pct(to)} ({up ? '+' : ''}{(s.deltaShare * 100).toFixed(1)}pp)</div>
              </div>
            </div>
          );
        })()}
        </div>

        {/* Rates driving each step — labelled columns so "your rate" is never mistaken for share */}
        <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5">
          <div className="text-[11px] font-semibold text-gray-600 mb-1.5">How each step moves your slice — your conversion rate vs the market</div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="py-1 pr-3 text-left">Step</th>
                <th className="py-1 px-2 text-right">Your rate</th>
                <th className="py-1 px-2 text-right">Market rate</th>
                <th className="py-1 pl-2 text-right">× market</th>
                <th className="py-1 pl-2 text-right">Your slice</th>
              </tr>
            </thead>
            <tbody>
              {b.steps.map((s) => {
                const up = s.deltaShare >= 0;
                const ratio = s.marketRate ? (s.yourRate ?? 0) / s.marketRate : null;
                const isDrop = b.biggestLeakKey === s.key;
                const col = up ? 'text-emerald-700' : 'text-rose-700';
                const from = shares[STEP_FROM[s.key]], to = shares[STEP_FROM[s.key] + 1];
                return (
                  <tr key={s.key} className="border-t border-gray-100">
                    <td className="py-1.5 pr-3 font-semibold text-gray-700 whitespace-nowrap">{TRANSITION_NAME[s.key]}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums"><span className={`font-bold ${col}`}>{pct(s.yourRate ?? 0)}</span></td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-gray-500">{pct(s.marketRate ?? 0)}</td>
                    <td className={`py-1.5 pl-2 text-right tabular-nums font-semibold ${col}`}>{ratio != null ? `${ratio.toFixed(2)}×` : '—'}</td>
                    <td className="py-1.5 pl-2 text-right whitespace-nowrap tabular-nums">
                      <span className={`font-semibold ${col}`}>{pct(from)} → {pct(to)}</span>
                      {isDrop && <span className="ml-2 text-[9px] font-bold text-rose-700 bg-rose-50 ring-1 ring-inset ring-rose-200 rounded px-1 py-0.5">BIGGEST DROP</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-2 leading-snug">
            <span className="font-semibold text-gray-500">“Your rate”</span> is your conversion at that step (e.g. click rate = clicks ÷ impressions) — a <span className="italic">different</span> number from your market share. It's the <span className="font-semibold text-gray-500">×market</span> that grows or shrinks your slice, shown on the bars above.
          </p>
        </div>

        <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-100 pt-2 flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="font-semibold text-gray-600">You /wk:</span>
          {b.counts.map((c) => <span key={c.stage}>{abbrev(c.you)} {c.stage === 'impressions' ? 'impr' : c.stage === 'baskets' ? 'basket adds' : c.stage}</span>)}
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-600">Market /wk:</span>
          {b.counts.map((c) => <span key={c.stage}>{abbrev(c.market)}</span>)}
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">Bars are your brand-average share vs market. The biggest recoverable € can sit at a different step — an average can hide ASIN-level damage — so the banner and table lead with the per-ASIN recoverable total. Click a step to see which ASINs.</p>
      </div>
    </div>
  );
}
