import { ArrowUpRight } from 'lucide-react';
import InfoTooltip from '../InfoTooltip';
import type { SqpRow, TransitionKey } from '../../lib/sqp/types';
import { parityBridge } from '../../lib/sqp/verdict';
import { TRANSITION_NAME } from '../sqpui/tokens';
import { abbrev, pp } from './format';
import RateVsMarketChart, { RateVsMarketLegend, type RateStep } from './RateVsMarketChart';

/** Search funnel, level B: how well you convert at each step versus the market. Says
 *  nothing about how big your slice is — that's the Search share page. */
const RATE_NOTE =
  'Each rate is your own funnel: click rate = your clicks ÷ your impressions, basket-add rate = basket adds ÷ clicks, purchase rate = purchases ÷ basket adds. The market rate is the same maths on the whole market for the same keywords. These are NOT market shares — a small brand can beat the market on every rate.';

const STEP_FROM: Record<TransitionKey, number> = { imp_click: 0, click_basket: 1, basket_purch: 2 };

export default function FunnelRates({ rows, onOpenShare, onFocusStage }: {
  rows: SqpRow[];
  onOpenShare?: () => void;
  onFocusStage?: (s: TransitionKey) => void;
}) {
  const b = parityBridge(rows);

  const steps: RateStep[] = b.steps.map((s) => ({
    key: s.key, yourRate: s.yourRate, marketRate: s.marketRate,
    fromYouWk: b.counts[STEP_FROM[s.key]].you,
  }));

  const worst = b.steps.reduce((a, s) => {
    const gap = (s.yourRate ?? 0) - (s.marketRate ?? 0);
    const aGap = (a.yourRate ?? 0) - (a.marketRate ?? 0);
    return gap < aGap ? s : a;
  });
  const worstGapPp = ((worst.yourRate ?? 0) - (worst.marketRate ?? 0)) * 100;
  const soWhat = worstGapPp < -0.05
    ? `${TRANSITION_NAME[worst.key]} is your weakest step — ${pp(worstGapPp)} against the market.`
    : `You convert at or above the market at every step; the weakest margin is ${TRANSITION_NAME[worst.key]} at ${pp(worstGapPp)}.`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">Your conversion rate vs the market, step by step<InfoTooltip content={RATE_NOTE} wide /></h3>
          <RateVsMarketLegend />
        </div>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mt-1">
          <p className="text-[12px] text-gray-700 leading-relaxed max-w-3xl"><span className="font-semibold">So what:</span> <span className="text-gray-600">{soWhat}</span></p>
          {onOpenShare && (
            <button onClick={onOpenShare} className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-cx-600 hover:text-cx-700">
              What it costs in share — Search share <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        <RateVsMarketChart steps={steps} biggestLeakKey={b.biggestLeakKey} onFocusStage={onFocusStage} />
        <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-100 pt-2 flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="font-semibold text-gray-600">You /wk:</span>
          {b.counts.map((c) => <span key={c.stage}>{abbrev(c.you)} {c.stage === 'impressions' ? 'impr' : c.stage === 'baskets' ? 'basket adds' : c.stage}</span>)}
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-600">Market /wk:</span>
          {b.counts.map((c) => <span key={c.stage}>{abbrev(c.market)}</span>)}
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">Brand-average rates across the keywords in scope — an average can hide ASIN-level damage, so the table below leads with the per-ASIN recoverable total. Click a step to see which ASINs.</p>
      </div>
    </div>
  );
}
