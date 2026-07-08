import { useState } from 'react';
import { brandFunnelDiagnostic } from '../data/funnelDiagnosticData';
import {
  FunnelStageCards, StageTrendCharts,
  TrafficSourceDecomposition,
} from './funnel/FunnelDiagnostic';
import { LeakOpportunityAndActions, TopDriverCards } from './funnel/TrafficInsights';
import HeroInsightCard from './funnel/HeroInsightCard';
import ProductTrafficTable from './funnel/ProductTrafficTable';
import LastRefreshed from './LastRefreshed';
import WeeklyDataBadge from './WeeklyDataBadge';
import { TrendingUp, ChevronDown } from 'lucide-react';

/**
 * Sales → Traffic — insight-first funnel diagnostic.
 *
 * Cards-first, not a table. In under 10 seconds the user should know:
 *   1. Where the funnel leaks (hero + funnel diagnostic)
 *   2. How big the upside is (opportunity estimate)
 *   3. What to do about it (leak-triggered action cards)
 *   4. Which ASINs to fix first (top driver cards)
 * The full per-ASIN table + trends + source mix live behind "View details".
 */
export default function Traffic() {
  const d = brandFunnelDiagnostic;
  const [showDetails, setShowDetails] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openDetails = () => {
    setShowDetails(true);
    // wait for the section to mount before scrolling
    setTimeout(() => scrollTo('traffic-details'), 60);
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cx-500" />
            <h1 className="text-lg font-bold text-gray-900">Traffic — funnel & conversion diagnostic</h1>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Where the funnel leaks, how big the upside is, and which products to fix first.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WeeklyDataBadge />
          <LastRefreshed offsetMinutes={9} />
        </div>
      </div>

      {/* 1 — Hero insight: main leak, impact, next step */}
      <HeroInsightCard diagnostic={d} onNextStep={() => scrollTo('top-drivers')} />

      {/* 2 — Funnel diagnostic: where the leak happens */}
      <FunnelStageCards diagnostic={d} />

      {/* 3 — Opportunity + recommended actions (one widget) */}
      <LeakOpportunityAndActions diagnostic={d} />

      {/* 4 — Top drivers: which ASINs to fix first */}
      <TopDriverCards diagnostic={d} onViewDetails={openDetails} />

      {/* 6 — Full detail (table + trends + source), collapsed by default */}
      <div id="traffic-details">
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span>Detailed data — per-ASIN table, stage trends & traffic source</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        {showDetails && (
          <div className="space-y-4 mt-4">
            <ProductTrafficTable />
            <StageTrendCharts diagnostic={d} />
            {d.sourceFunnels && <TrafficSourceDecomposition funnels={d.sourceFunnels} />}
          </div>
        )}
      </div>
    </div>
  );
}
