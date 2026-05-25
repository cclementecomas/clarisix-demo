// ─── SQP Hero Insight Card ───────────────────────────────────────────────
// Top-of-page summary that answers "what is the main issue, how big is it,
// where is it concentrated, what should I do next" in under five seconds.
//
// Numbers are derived from `sqpSummary` — see sqpData.ts for the math.

import { AlertTriangle, ArrowRight, Coins, Target, Layers } from 'lucide-react';
import { sqpSummary, QUADRANT_LABEL, QUADRANT_ACTION } from '../../data/sqpData';

const ISSUE_BY_QUADRANT: Record<string, { headline: string; nextAction: string }> = {
  defend:  { headline: 'Share erosion on hero keywords',           nextAction: 'Defend top campaigns and content' },
  invest:  { headline: 'Under-indexed on high-volume search terms', nextAction: 'Increase investment on top campaigns' },
  harvest: { headline: 'Concentrated wins on low-volume terms',     nextAction: 'Maintain, optimize ACOS' },
  tail:    { headline: 'Opportunity scattered across the long tail', nextAction: 'Bundle by theme, test cheaply' },
};

export default function SQPHeroCard({ onNextStep }: { onNextStep?: () => void }) {
  const issue = ISSUE_BY_QUADRANT[sqpSummary.dominantOppQuadrant] ?? ISSUE_BY_QUADRANT.invest;
  const dominantLabel = QUADRANT_LABEL[sqpSummary.dominantOppQuadrant];
  const dominantShare = sqpSummary.totalOpportunityEur > 0
    ? Math.round((sqpSummary.oppByQuadrant[sqpSummary.dominantOppQuadrant] / sqpSummary.totalOpportunityEur) * 100)
    : 0;

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-white to-rose-50/40 rounded-xl border-2 border-amber-200 shadow-sm overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-400 to-amber-500" />

      <div className="px-6 py-5 flex items-start gap-6 flex-wrap lg:flex-nowrap">
        {/* Headline column */}
        <div className="flex items-start gap-3 min-w-[260px] flex-1">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Main issue</div>
            <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">
              {issue.headline}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 max-w-[320px]">
              {dominantShare}% of recoverable € sits in the <span className="font-semibold text-gray-700">{dominantLabel}</span> quadrant ({QUADRANT_ACTION[sqpSummary.dominantOppQuadrant].toLowerCase()}).
            </div>
          </div>
        </div>

        {/* Metric row */}
        <div className="grid grid-cols-3 gap-3 flex-shrink-0">
          <MetricTile
            label="Opportunity / wk"
            value={`€${sqpSummary.totalOpportunityEur.toLocaleString()}`}
            sub="If gaps close half-way"
            icon={<Coins className="w-3.5 h-3.5 text-amber-600" />}
          />
          <MetricTile
            label="Concentration"
            value={`${sqpSummary.top5ConcentrationPct}%`}
            sub="In top 5 keywords"
            icon={<Target className="w-3.5 h-3.5 text-rose-600" />}
          />
          <MetricTile
            label="Under-indexed"
            value={`${sqpSummary.underIndexedCount}`}
            sub={`of ${sqpSummary.tracked} tracked`}
            icon={<Layers className="w-3.5 h-3.5 text-indigo-600" />}
          />
        </div>

        {/* Next step CTA */}
        <button
          onClick={onNextStep}
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold shadow-sm transition-colors group"
        >
          <div className="text-left">
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Next step</div>
            <div className="leading-tight">{issue.nextAction}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function MetricTile({ label, value, sub, icon }: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 min-w-[120px]">
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight mt-1">{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}
