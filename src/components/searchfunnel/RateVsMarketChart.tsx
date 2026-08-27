import { useState } from 'react';
import type { TransitionKey } from '../../lib/sqp/types';
import { TRANSITION_NAME } from '../sqpui/tokens';
import { pct, int } from './format';

/** Emphasis form (one hue + de-emphasis gray): your rate is the subject, the market
 *  rate is context. Single categorical hue = the brand blue; the market column is the
 *  de-emphasis gray, so nobody mistakes the benchmark for a second brand series. */
const YOU = '#0E5A8A';
const MARKET = '#94A3B8';
const GOOD = '#047857';
const BAD = '#B91C1C';

export interface RateStep {
  key: TransitionKey;
  yourRate: number | null;
  marketRate: number | null;
  /** Upstream volume per week (impressions / clicks / basket adds) — drives the units delta. */
  fromYouWk: number;
}

const UNIT_NOUN: Record<TransitionKey, string> = { imp_click: 'clicks', click_basket: 'basket adds', basket_purch: 'purchases' };
const RATE_NAME: Record<TransitionKey, string> = { imp_click: 'Click rate', click_basket: 'Basket-add rate', basket_purch: 'Purchase rate' };

export default function RateVsMarketChart({ steps, biggestLeakKey, onFocusStage }: {
  steps: RateStep[];
  biggestLeakKey?: TransitionKey | null;
  onFocusStage?: (s: TransitionKey) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 760, H = 200, padL = 16, padT = 40, padB = 32, padR = 16;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const groupW = plotW / steps.length;
  const barW = Math.min(24, groupW * 0.2);
  // Intra-pair spacing is set by the LABELS, not the bars: at 24px thick the two cap
  // values ("21.4%" / "16.0%") are wider than the columns, so 40px between centres is
  // what keeps them from colliding when both caps land at a similar height.
  const GAP = 16;

  const maxRate = Math.max(0.05, ...steps.flatMap((s) => [s.yourRate ?? 0, s.marketRate ?? 0]));
  const hi = maxRate * 1.18;                       // headroom for the cap labels
  const base = padT + plotH;
  const y = (v: number) => base - (v / hi) * plotH;
  const gx = (i: number) => padL + groupW * (i + 0.5);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full">
        <line x1={padL} y1={base} x2={W - padR} y2={base} stroke="#E5E7EB" strokeWidth={1} />

        {steps.map((s, i) => {
          const mine = s.yourRate ?? 0, mkt = s.marketRate ?? 0;
          const gapPp = (mine - mkt) * 100;
          const ahead = gapPp > 0.05, behind = gapPp < -0.05;
          const col = ahead ? GOOD : behind ? BAD : '#475569';
          const xYou = gx(i) - barW - GAP / 2, xMkt = gx(i) + GAP / 2;
          const topY = Math.min(y(mine), y(mkt));
          const isLeak = biggestLeakKey === s.key;
          const active = hover === i;

          return (
            <g key={s.key} className={onFocusStage ? 'cursor-pointer' : undefined}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => onFocusStage?.(s.key)}>
              {/* hit area — bigger than the marks */}
              <rect x={gx(i) - groupW / 2} y={padT - 24} width={groupW} height={base - padT + 24 + padB} fill="transparent" />

              {/* gap vs market — glyph + value, so polarity is never colour-alone */}
              <text x={gx(i)} y={topY - 22} textAnchor="middle" fontSize="11.5" fontWeight="800" fill={col}>
                {ahead ? '▲' : behind ? '▼' : '='} {gapPp > 0 ? '+' : ''}{gapPp.toFixed(1)}pp
              </text>

              <rect x={xYou} y={y(mine)} width={barW} height={base - y(mine)} rx={4} fill={YOU} fillOpacity={active ? 1 : 0.92} />
              <rect x={xMkt} y={y(mkt)} width={barW} height={base - y(mkt)} rx={4} fill={MARKET} fillOpacity={active ? 1 : 0.85} />
              {/* square the data-ends at the baseline (rx would round both corners) */}
              <rect x={xYou} y={base - 4} width={barW} height={4} fill={YOU} fillOpacity={active ? 1 : 0.92} />
              <rect x={xMkt} y={base - 4} width={barW} height={4} fill={MARKET} fillOpacity={active ? 1 : 0.85} />

              <text x={xYou + barW / 2} y={y(mine) - 6} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#1F2937">{pct(mine)}</text>
              <text x={xMkt + barW / 2} y={y(mkt) - 6} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#64748B">{pct(mkt)}</text>

              <text x={gx(i)} y={base + 15} textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">{RATE_NAME[s.key]}</text>
              <text x={gx(i)} y={base + 26} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{TRANSITION_NAME[s.key]}</text>
              {isLeak && (
                <>
                  <rect x={gx(i) - 33} y={topY - 46} width={66} height={13} rx={6} fill={BAD} />
                  <text x={gx(i)} y={topY - 36.5} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="white">BIGGEST DROP</text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {hover != null && (() => {
        const s = steps[hover];
        const mine = s.yourRate ?? 0, mkt = s.marketRate ?? 0;
        const ratio = mkt > 0 ? mine / mkt : null;
        const diffUnits = Math.round(s.fromYouWk * (mine - mkt));
        const ahead = mine >= mkt;
        const topY = Math.min(y(mine), y(mkt));
        return (
          <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-10"
            style={{ left: `${(gx(hover) / W) * 100}%`, top: `${((topY - 34) / H) * 100}%` }}>
            <div className="mb-2 bg-gray-900 text-white rounded-md px-2.5 py-1.5 shadow-lg w-max max-w-[250px]">
              <div className="text-[11px] font-bold">{RATE_NAME[s.key]} · {TRANSITION_NAME[s.key]}</div>
              <div className="text-[10px] text-gray-300">you {pct(mine)} vs market {pct(mkt)}{ratio != null && <> · {ratio.toFixed(2)}× the market</>}</div>
              <div className={`text-[10px] font-semibold mt-0.5 ${ahead ? 'text-emerald-300' : 'text-rose-300'}`}>
                ≈ {int(Math.abs(diffUnits))} {ahead ? 'more' : 'fewer'} {UNIT_NOUN[s.key]}/wk than matching the market
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/** Legend — always present (two marks), so identity never rests on colour alone. */
export function RateVsMarketLegend() {
  return (
    <div className="flex items-center gap-3 text-[10px] text-gray-500">
      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: YOU }} />Your rate</span>
      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: MARKET }} />Market rate</span>
    </div>
  );
}
