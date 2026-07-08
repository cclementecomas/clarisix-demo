// ─── Traffic insight cards (insight-first, cards not tables) ───────────────
// Sits between the funnel diagnostic and the (collapsed) detail table:
//   1. OpportunityEstimateCard — €/units upside if the leak matched market
//   2. RecommendedActionCards  — only the actions relevant to the detected leak
//   3. TopDriverCards          — the 3–5 ASINs causing most of the leak
// All derived from the brand funnel diagnostic + per-ASIN traffic data.

import { ArrowRight, Wrench, MousePointerClick, Eye, CreditCard, ShieldCheck } from 'lucide-react';
import type { FunnelDiagnostic } from '../../data/funnelDiagnosticData';
import { leakOpportunity, leakAllocation, productImageUrl } from './trafficCalc';

// ─── 1. Opportunity + Recommended actions (one widget) ─────────────────────

export function LeakOpportunityAndActions({ diagnostic: d }: { diagnostic: FunnelDiagnostic }) {
  const opp = leakOpportunity(d);
  const showLeakUnits = opp.toStage.key !== 'purchases';

  // Overall Click → Purchase CVR (context).
  const clicks = d.stages[1], buys = d.stages[3];
  const yourCvr = clicks.brandCount > 0 ? (buys.brandCount / clicks.brandCount) * 100 : 0;
  const mktCvr = clicks.marketCount > 0 ? (buys.marketCount / clicks.marketCount) * 100 : 0;

  const keys = firedActions(d);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Upside strip */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Upside if this leak matched the market</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Current {opp.fromStage.label.toLowerCase()} × market {opp.leakConv.shortLabel} rate ({opp.leakConv.marketRate.toFixed(1)}%) · overall Click → Purchase CVR {yourCvr.toFixed(1)}% vs market {mktCvr.toFixed(1)}%.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showLeakUnits && <>
            <UpStat value={`+${opp.recoveredAtLeak.toLocaleString()}`} label={opp.toStage.label.toLowerCase()} />
            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
          </>}
          <UpStat value={`+${opp.purchases.toLocaleString()}`} label="purchases/wk" />
          <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
          <UpStat value={`+€${opp.revenue.toLocaleString()}`} label="revenue/wk" highlight />
        </div>
      </div>

      {/* Recommended actions */}
      <div className="px-5 py-3">
        <div className="flex items-baseline justify-between gap-2 mb-2.5">
          <h3 className="text-[13px] font-semibold text-gray-900">Recommended actions</h3>
          <span className="text-[10px] text-gray-400">Only the plays relevant to the detected leak</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {keys.map((k) => {
            const a = ACTION_DEFS[k];
            return (
              <div key={k} className={`rounded-lg border ${a.ring} bg-white p-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">{a.icon}</span>
                  <span className="text-[12px] font-bold text-gray-900 leading-tight">{a.title}</span>
                  <span className="text-[11px] text-gray-500 leading-tight truncate">— {a.message}</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                  {a.actions.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-[10.5px] text-gray-600 leading-snug">
                      <span className="mt-[6px] w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UpStat({ value, label, highlight = false }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className={`text-right px-2.5 py-1 rounded-md ${highlight ? 'bg-amber-50' : ''}`}>
      <div className={`text-base font-bold tabular-nums leading-tight ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</div>
      <div className="text-[9px] text-gray-500 leading-tight">{label}</div>
    </div>
  );
}

// ─── Recommended-action catalog + triggers ─────────────────────────────────

type ActionKey = 'pdp' | 'clickability' | 'visibility' | 'purchase' | 'defend';

const ACTION_DEFS: Record<ActionKey, {
  title: string; message: string; actions: string[];
  icon: React.ReactNode; ring: string; chip: string;
}> = {
  pdp: {
    title: 'Fix PDP / Offer',
    message: 'Shoppers click, but they hesitate before adding to basket.',
    actions: ['Compare price vs top competitors', 'Check coupon / promo visibility', 'Review main + secondary images', 'Improve A+ content and bullet clarity', 'Check review count and rating gap', 'Check variation selection and pack-size fit', 'Confirm the clicked ASIN matches the query intent'],
    icon: <Wrench className="w-4 h-4 text-rose-600" />, ring: 'border-rose-200', chip: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  clickability: {
    title: 'Improve Clickability',
    message: 'Shoppers see the product but choose competitors.',
    actions: ['Improve main image', 'Improve title clarity', 'Add or improve coupon', 'Check price competitiveness', 'Improve rating / review count', 'Improve delivery promise'],
    icon: <MousePointerClick className="w-4 h-4 text-amber-600" />, ring: 'border-amber-200', chip: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  visibility: {
    title: 'Scale Visibility',
    message: 'The product performs well when seen, but it does not get enough visibility.',
    actions: ['Increase PPC coverage', 'Increase bids on winning queries', 'Improve organic rank', 'Expand keyword coverage', 'Defend high-converting queries'],
    icon: <Eye className="w-4 h-4 text-sky-600" />, ring: 'border-sky-200', chip: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  purchase: {
    title: 'Fix Purchase Conversion',
    message: 'Shoppers add to basket but do not complete purchase.',
    actions: ['Check Buy Box', 'Check inventory', 'Check delivery speed', 'Check coupon reliability', 'Check for price changes', 'Check Subscribe & Save availability'],
    icon: <CreditCard className="w-4 h-4 text-rose-600" />, ring: 'border-rose-200', chip: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  defend: {
    title: 'Defend Winners',
    message: 'This funnel converts visibility into purchases efficiently.',
    actions: ['Defend rank', 'Maintain budget', 'Protect against competitor conquesting', 'Expand similar keywords'],
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, ring: 'border-emerald-200', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
};

function firedActions(d: FunnelDiagnostic): ActionKey[] {
  const [ctr, clickBasket, basketPurchase] = d.conversions;
  const impressionShare = d.stages[0].share, clickShare = d.stages[1].share, purchaseShare = d.stages[3].share;
  const ctrBelow = ctr.delta < 0;
  const basketLeak = clickBasket.delta < 0;
  const purchaseLeak = basketPurchase.delta < 0;
  const allBeat = d.conversions.every((c) => c.delta >= 0);
  const lowVis = impressionShare < 4;

  const set = new Set<ActionKey>();
  if (!ctrBelow && basketLeak) set.add('pdp');
  if (ctrBelow || impressionShare > clickShare) set.add('clickability');
  if (allBeat && lowVis) set.add('visibility');
  if (purchaseLeak) set.add('purchase');
  if (purchaseShare > impressionShare && allBeat) set.add('defend');
  if (set.size === 0) set.add('defend');

  const leakKey = d.stages[d.biggestOpportunityIdx].key;
  const primary: ActionKey | null = leakKey === 'clicks' ? 'clickability' : leakKey === 'cartAdds' ? 'pdp' : leakKey === 'purchases' ? 'purchase' : null;
  const order: ActionKey[] = [];
  if (primary && set.has(primary)) order.push(primary);
  (['pdp', 'clickability', 'visibility', 'purchase', 'defend'] as ActionKey[]).forEach((k) => {
    if (set.has(k) && !order.includes(k)) order.push(k);
  });
  return order.slice(0, 3);
}

// ─── 2. Top driver cards (decomposition of the same brand opportunity) ─────

export function TopDriverCards({ diagnostic: d, onViewDetails }: { diagnostic: FunnelDiagnostic; onViewDetails: () => void }) {
  const { opp, rows } = leakAllocation(d);
  const marketRate = opp.leakConv.marketRate;
  const drivers = rows.filter((x) => x.lostRevenue > 0).sort((a, b) => b.lostRevenue - a.lostRevenue).slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" id="top-drivers">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Top drivers of the leak</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">The {drivers.length} ASINs losing the most at {opp.leakConv.shortLabel} — their share of the +{opp.purchases.toLocaleString()} purchases above. Fix these first.</p>
        </div>
        <button onClick={onViewDetails} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-50">
          View all details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {drivers.map((r) => (
          <div key={r.asin} className="rounded-lg border border-gray-200 bg-gray-50/40 p-3 flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <img src={productImageUrl(r.asin)} alt="" width={36} height={36} loading="lazy" className="w-9 h-9 rounded-md object-cover bg-gray-100 border border-gray-200 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-gray-900 leading-tight truncate" title={r.product}>{r.product}</div>
                <div className="text-[10px] font-mono text-gray-400">{r.asin}</div>
              </div>
            </div>
            <span className="inline-flex self-start items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-200">
              {opp.leakConv.shortLabel} leak
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold text-rose-700 tabular-nums">+{r.lostPurchases}</span>
              <span className="text-[10px] text-gray-500">est. purchases / wk · €{r.lostRevenue.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-gray-500 leading-snug">
              <span className="font-semibold text-gray-700">Why:</span> basket-add rate {r.addToCartRate.toFixed(1)}% vs market {marketRate.toFixed(1)}% — strong clicks, weak basket adds.
            </div>
            <div className="text-[10px] text-gray-500 leading-snug">
              <span className="font-semibold text-gray-700">Do:</span> review price, reviews, coupon, PDP content & landing-ASIN fit.
            </div>
            <button onClick={onViewDetails} className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-cx-600 hover:text-cx-700">
              View details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
