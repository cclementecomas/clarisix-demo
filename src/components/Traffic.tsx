import { brandFunnelDiagnostic } from '../data/funnelDiagnosticData';
import {
  FunnelStageCards, StageTrendCharts,
  TrafficSourceDecomposition,
} from './funnel/FunnelDiagnostic';
import HeroInsightCard from './funnel/HeroInsightCard';
import ProductTrafficTable from './funnel/ProductTrafficTable';
import LastRefreshed from './LastRefreshed';
import WeeklyDataBadge from './WeeklyDataBadge';
import { TrendingUp } from 'lucide-react';

/**
 * Sales → Traffic — insight-first funnel diagnostic.
 *
 * Shortest path to insight: in under 10 seconds the user should know
 *   1. What is the main bottleneck
 *   2. How much is it worth
 *   3. Which ASINs cause it
 *   4. What to do next
 *
 * Layout (top → bottom):
 *   1. Hero insight — main leak, gap, impact, units, next step
 *   2. Funnel diagnostic — where the leak happens (cards vs market)
 *   3. Top ASINs causing the leak — ranked by lost revenue, with MECE
 *      Funnel issue × Likely cause columns
 *   4. Supporting trend — is the issue persistent or recent?
 *   5. Source contribution — does organic or paid explain the leak?
 */
export default function Traffic() {
  const d = brandFunnelDiagnostic;

  const handleScrollToLeakingAsins = () => {
    const el = document.getElementById('leaking-asins-table');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            Where conversion leaks, how much it costs, and which products to fix first.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WeeklyDataBadge />
          <LastRefreshed offsetMinutes={9} />
        </div>
      </div>

      {/* 1 — Hero insight: main leak, impact, next step */}
      <HeroInsightCard diagnostic={d} onNextStep={handleScrollToLeakingAsins} />

      {/* 2 — Funnel diagnostic: where the leak happens */}
      <FunnelStageCards diagnostic={d} />

      {/* 3 — Top ASINs causing the leak, ranked by lost revenue */}
      <ProductTrafficTable />

      {/* 4 — Supporting trend: persistent or recent? */}
      <StageTrendCharts diagnostic={d} />

      {/* 5 — Source contribution: does organic or paid explain it? */}
      {d.sourceFunnels && <TrafficSourceDecomposition funnels={d.sourceFunnels} />}
    </div>
  );
}
