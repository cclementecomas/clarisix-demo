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

  const c0 = b.impShare;
  const cum = [c0, c0 + b.steps[0].deltaShare, c0 + b.steps[0].deltaShare + b.steps[1].deltaShare, b.purchShare];
  const vals = [...cum];
  const min = Math.min(...vals), max = Math.max(...vals); const range = Math.max(0.002, max - min);
  const lo = Math.max(0, min - range * 0.5), hi = max + range * 0.35;

  const W = 760, H = 250, padL = 38, padT = 30, padB = 56, padR = 14;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const cols = 5, colW = plotW / cols, barW = colW * 0.46;
  const cx = (i: number) => padL + colW * (i + 0.5);
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * plotH;
  const base = y(lo);

  const worstStep = b.steps.reduce((a, s) => (s.deltaShare < a.deltaShare ? s : a));
  const soWhat = `If you matched the market at every step you'd hold ${pct(b.impShare)} of purchases; you actually hold ${pct(b.purchShare)} — ${worstStep.label.replace(' effect', '')} costs the most (${(worstStep.deltaShare * 100).toFixed(1)}pp).`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">Where your market share is won &amp; lost<InfoTooltip content={IDENTITY_NOTE} wide /></h3>
        <p className="text-[11px] text-gray-500 mt-0.5">The bars are your <span className="font-semibold text-gray-600">share of the market</span> ({pct(b.impShare)} of impressions → {pct(b.purchShare)} of purchases). Each step multiplies that share by your <span className="font-semibold text-gray-600">conversion rate ÷ the market's</span> — the <span className="font-semibold text-gray-600">×market</span> under each bar. Over 1× your slice grows; under 1× it shrinks.</p>
        <p className="text-[12px] text-gray-700 leading-relaxed mt-1 max-w-4xl"><span className="font-semibold">So what:</span> <span className="text-gray-600">{soWhat}</span></p>
      </div>
      <div className="px-4 py-3">
        <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full">
          {/* anchors */}
          <Anchor cx={cx(0)} barW={barW} yTop={y(c0)} base={base} label="Impression share" value={b.impShare} muted />
          <Anchor cx={cx(4)} barW={barW} yTop={y(b.purchShare)} base={base} label="Purchase share" value={b.purchShare} highlight />

          {/* steps */}
          {b.steps.map((s, j) => {
            const from = cum[STEP_FROM[s.key]], to = cum[STEP_FROM[s.key] + 1];
            const up = s.deltaShare >= 0;
            const ratio = s.marketRate ? (s.yourRate ?? 0) / s.marketRate : null;
            const yTop = Math.min(y(from), y(to)), h = Math.max(1.5, Math.abs(y(from) - y(to)));
            const col = up ? '#10B981' : '#EF4444';
            const isLeak = b.biggestLeakKey === s.key;
            return (
              <g key={s.key} className="cursor-pointer" onMouseEnter={() => setHover(j)} onMouseLeave={() => setHover(null)} onClick={() => onFocusStage(s.key)}>
                {/* connector from previous cum level */}
                <line x1={cx(j) + barW / 2} y1={y(from)} x2={cx(j + 1) - barW / 2} y2={y(from)} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3 2" />
                <rect x={cx(j + 1) - barW / 2} y={yTop} width={barW} height={h} rx={2} fill={col} fillOpacity={hover === j ? 1 : 0.85} stroke={isLeak ? '#B45309' : 'none'} strokeWidth={isLeak ? 1.5 : 0} />
                <text x={cx(j + 1)} y={yTop - 7} textAnchor="middle" fontSize="11" fontWeight="700" fill={up ? '#059669' : '#DC2626'}>{pct(from)} → {pct(to)}</text>
                <text x={cx(j + 1)} y={base + 16} textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">{TRANSITION_NAME[s.key]}</text>
                {ratio != null && <text x={cx(j + 1)} y={base + 29} textAnchor="middle" fontSize="9" fontWeight="700" fill={up ? '#059669' : '#DC2626'}>{ratio.toFixed(2)}× market</text>}
                {isLeak && (
                  <g>
                    <rect x={cx(j + 1) - 42} y={yTop - 34} width={84} height={15} rx={7} fill="#DC2626" />
                    <text x={cx(j + 1)} y={yTop - 23} textAnchor="middle" fontSize="8" fontWeight="700" fill="white">BIGGEST DROP</text>
                  </g>
                )}
              </g>
            );
          })}
          {/* connector into right anchor */}
          <line x1={cx(3) + barW / 2} y1={y(cum[3])} x2={cx(4) - barW / 2} y2={y(cum[3])} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3 2" />
        </svg>
        {hover != null && (() => {
          const s = b.steps[hover];
          const from = cum[STEP_FROM[s.key]], to = cum[STEP_FROM[s.key] + 1];
          const ratio = s.marketRate ? (s.yourRate ?? 0) / s.marketRate : null;
          const fromYouWk = b.counts[STEP_FROM[s.key]].you;               // your upstream volume /wk
          const diffUnits = Math.round(fromYouWk * ((s.yourRate ?? 0) - (s.marketRate ?? 0)));
          const noun = s.key === 'imp_click' ? 'clicks' : s.key === 'click_basket' ? 'basket adds' : 'purchases';
          const up = s.deltaShare >= 0;
          return (
            <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-10"
              style={{ left: `${(cx(hover + 1) / W) * 100}%`, top: `${(y(Math.min(from, to)) / H) * 100}%` }}>
              <div className="mb-1 bg-gray-900 text-white rounded-md px-2.5 py-1.5 shadow-lg w-max max-w-[240px]">
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
                const from = cum[STEP_FROM[s.key]], to = cum[STEP_FROM[s.key] + 1];
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

function Anchor({ cx, barW, yTop, base, label, value, muted, highlight }: { cx: number; barW: number; yTop: number; base: number; label: string; value: number; muted?: boolean; highlight?: boolean }) {
  return (
    <g>
      <rect x={cx - barW / 2} y={yTop} width={barW} height={base - yTop} rx={2} fill={highlight ? STAGE_COLOR.purchases : '#94A3B8'} fillOpacity={muted ? 0.35 : highlight ? 0.9 : 0.5} />
      <text x={cx} y={yTop - 6} textAnchor="middle" fontSize="13" fontWeight="800" fill="#1F2937">{pct(value)}</text>
      <text x={cx} y={base + 16} textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">{label}</text>
    </g>
  );
}
