// ─── Hero Insight Card (Traffic page) ────────────────────────────────────
// Replaces the old 6-KPI row at the top of the Traffic page. The job of this
// card is to answer "What is the main bottleneck, how much is it worth, and
// what should I do next?" in under five seconds.

import { AlertTriangle, ArrowDown, ArrowRight, Coins, Package } from 'lucide-react';
import type { FunnelDiagnostic } from '../../data/funnelDiagnosticData';

const AVG_SELLING_PRICE = 35;

export default function HeroInsightCard({
  diagnostic,
  onNextStep,
}: {
  diagnostic: FunnelDiagnostic;
  /** Click handler for the "Next step" CTA — usually scrolls to the product table. */
  onNextStep?: () => void;
}) {
  const leakIdx = diagnostic.biggestOpportunityIdx;
  const toStage   = diagnostic.stages[leakIdx];
  const leakConv  = diagnostic.conversions[leakIdx - 1];

  // Use the conversion's shortLabel so transition naming stays consistent
  // across the page (e.g. "Click → Cart Add").
  const transitionLabel = leakConv.shortLabel;
  const conversionGapPp = leakConv.delta; // negative if you're below market
  const shareGapPp = +(toStage.share - diagnostic.marketShares[toStage.key]).toFixed(1);
  const impactEur = diagnostic.insightImpactEur;
  const recoverableUnits = Math.max(1, Math.round(impactEur / AVG_SELLING_PRICE));

  return (
    <div className="relative bg-gradient-to-br from-rose-50 via-white to-amber-50/40 rounded-xl border-2 border-rose-200 shadow-sm overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

      <div className="px-6 py-5 flex items-start gap-6 flex-wrap lg:flex-nowrap">
        {/* Headline column */}
        <div className="flex items-start gap-3 min-w-[260px] flex-1">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Main leak</div>
            <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">
              {transitionLabel}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 max-w-[280px]">
              Your conversion at this stage trails the market. The downstream impact compounds across every product.
            </div>
          </div>
        </div>

        {/* Metric row */}
        <div className="grid grid-cols-3 gap-3 flex-shrink-0">
          <MetricTile
            label="Gap vs market"
            value={`${conversionGapPp > 0 ? '+' : ''}${conversionGapPp.toFixed(1)}pp`}
            sub={`Share gap ${shareGapPp > 0 ? '+' : ''}${shareGapPp.toFixed(1)}pp`}
            icon={<ArrowDown className="w-3.5 h-3.5 text-rose-600" />}
            tone="rose"
          />
          <MetricTile
            label="Impact / wk"
            value={`€${impactEur.toLocaleString()}`}
            sub="If half the gap closes"
            icon={<Coins className="w-3.5 h-3.5 text-amber-600" />}
            tone="amber"
          />
          <MetricTile
            label="Units / wk"
            value={recoverableUnits.toLocaleString()}
            sub={`@ €${AVG_SELLING_PRICE} ASP`}
            icon={<Package className="w-3.5 h-3.5 text-emerald-600" />}
            tone="emerald"
          />
        </div>

        {/* Next step CTA */}
        <button
          onClick={onNextStep}
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold shadow-sm transition-colors group"
        >
          <div className="text-left">
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Next step</div>
            <div className="leading-tight">Review top leaking ASINs</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function MetricTile({
  label, value, sub, icon, tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: 'rose' | 'amber' | 'emerald';
}) {
  const toneCls = {
    rose:    'border-rose-200 bg-white/80',
    amber:   'border-amber-200 bg-white/80',
    emerald: 'border-emerald-200 bg-white/80',
  }[tone];
  return (
    <div className={`rounded-lg border ${toneCls} px-3 py-2 min-w-[120px]`}>
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight mt-1">{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}
