import { X } from 'lucide-react';
import {
  MIN_IMP_FOR_CTR_GAP, MIN_CLICKS_FOR_ATC, MIN_BASKETS_FOR_CLOSE,
  DEFAULT_ASP, IMP_SHARE_CEILING, IMPRESSIONS_PER_SEARCH, TOP_QUERIES_CAP, VOLUME_SPLIT_PCTL,
} from '../../lib/sqp/constants';

export default function HowCalculatedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">How this is calculated</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4 text-[12px] text-gray-700 leading-relaxed">
          <Block title="Source & scope">
            Amazon Search Query Performance (SQP), one report per ASIN × week × top {TOP_QUERIES_CAP} queries. Amazon <b>search</b> traffic only (organic + sponsored on the results page) — not sessions, browse or external. A single search shows ~{IMPRESSIONS_PER_SEARCH} products, so per-ASIN impression share tops out around <b>~{Math.round(IMP_SHARE_CEILING * 100)}%</b> (≈2 placements of 25) — {Math.round(IMP_SHARE_CEILING * 100 * 0.57)}%+ is already strong.
          </Block>
          <Block title="Aggregation (getting shares right)">
            Market columns (Total counts, volume, prices) are market-wide per (query, week) and identical across your ASINs — <b>counted once</b>, never summed across ASINs. Your columns are summed. So:
            <Code>brand share[stage] = Σ ASIN counts ÷ deduped market total    (never an average of ASIN shares)</Code>
            Over a range: sum counts across weeks, then recompute rates/shares from the totals (never average weekly %).
          </Block>
          <Block title="Stage metrics & the identity">
            <Code>{`imp/click/basket/purch share = your count ÷ market count
CTR = clicks÷impr · ATC = baskets÷clicks · close = purch÷baskets  (yours AND market)
identity: share(next) ÷ share(prev) = your_rate ÷ market_rate`}</Code>
            A drop in share between two stages <b>is</b> underperforming the market at that transition — that's why the waterfall detects leaks.
          </Block>
          <Block title="Leak & € impact (per transition)">
            <Code>{`gap(pp)          = your_rate − market_rate
missed next      = your upstream count × max(0, market_rate − your_rate)
missed purchases = missed next × Π(downstream market rates)
impact €/wk      = missed purchases × ASP ÷ weeks`}</Code>
            Main leak = the transition with the largest €/wk, among those above the noise floor.
          </Block>
          <Block title="Recoverable € (per ASIN, not netted)">
            <b>Recoverable</b> = what you'd win back by matching the market: the sum of each ASIN's missed purchases at a stage, counting only ASINs that trail the market there. A brand average lets strong ASINs hide weak ones and understates the gap — so the banner, the bridge and the ASIN table all use the per-ASIN recoverable sum, and they reconcile to the euro.
          </Block>
          <Block title="The verdict (level + trend)">
            The banner shows whichever is larger — the recoverable conversion leak, or the share loss:
            <Code>{`share loss €/wk = max(0, −Δ purchase share) × market purchases/wk × ASP
severity        = headline € ÷ your weekly SQP purchase revenue
                  (≥10% critical · 3–10% warning · <3% watch)`}</Code>
            So a small conversion gap never outshouts a large share decline, and vice-versa.
          </Block>
          <Block title="Keyword opportunity (SQP page)">
            <Code>{`conversion opp = impact €/wk of the query's worst transition
visibility opp = max(0, target click share − click share) × market purchases
                 × clamp(cvr÷market cvr, 0.5, 1.2) × ASP ÷ weeks
opportunity/wk = conversion opp + visibility opp   (× closure factor in the banner)`}</Code>
          </Block>
          <Block title="Noise floors (per week)">
            Below these, a transition shows “insufficient data”, is excluded from leak selection and banner totals:
            <Code>{`CTR gap   : ≥ ${MIN_IMP_FOR_CTR_GAP} impressions/wk
basket-add: ≥ ${MIN_CLICKS_FOR_ATC} clicks/wk
close     : ≥ ${MIN_BASKETS_FOR_CLOSE} basket adds/wk`}</Code>
          </Block>
          <Block title="Quadrants & ASP">
            Volume split = P{Math.round(VOLUME_SPLIT_PCTL * 100)} of your visible queries; share split = weighted-average click share of that set. ASP = purchases-weighted median price (falls back to clicks-weighted, then €{DEFAULT_ASP}); the source is shown wherever ASP is used.
          </Block>
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{title}</div><div>{children}</div></div>;
}
function Code({ children }: { children: React.ReactNode }) {
  return <pre className="mt-1.5 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[11px] text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">{children}</pre>;
}
