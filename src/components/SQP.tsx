import { useState } from 'react';
import { Search } from 'lucide-react';
import { sqpKeywords, sqpSummary } from '../data/sqpData';
import type { KeywordRow } from '../data/sqpData';
import PortfolioMap from './sqp/PortfolioMap';
import KeywordTable from './sqp/KeywordTable';
import KeywordDetailDrawer from './sqp/KeywordDetailDrawer';
import SQPHeroCard from './sqp/SQPHeroCard';
import LastRefreshed from './LastRefreshed';
import WeeklyDataBadge from './WeeklyDataBadge';

/**
 * Sales → SQP — keyword portfolio decision tool.
 *
 * Layout:
 *   1. Header + weekly-data badge
 *   2. Hero insight — main issue, opportunity, concentration, next step
 *   3. Portfolio map — BCG-style scatter with actionable quadrants
 *   4. Prioritized keyword table — columns optimized for decision-making
 *   5. Keyword detail drawer — slide-in side panel from row/map click
 */
export default function SQP() {
  const [selected, setSelected] = useState<KeywordRow | null>(null);

  const handleSelect = (k: KeywordRow | null) => setSelected(k);

  const handleHeroNext = () => {
    // Open the top opportunity directly in the drawer — fastest path to action.
    const topOpp = [...sqpKeywords].sort((a, b) => b.opportunityEur - a.opportunityEur)[0];
    if (topOpp) setSelected(topOpp);
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cx-500" />
            <h1 className="text-lg font-bold text-gray-900">Search Query Performance</h1>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Treat each keyword as an asset. Defend / Invest / Harvest / Tail.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WeeklyDataBadge />
          <LastRefreshed offsetMinutes={11} />
        </div>
      </div>

      {/* 1 — Hero insight */}
      <SQPHeroCard onNextStep={handleHeroNext} />

      {/* 2 — Portfolio map */}
      <PortfolioMap keywords={sqpKeywords} onSelect={handleSelect} />

      {/* 3 — Prioritized keyword table */}
      <KeywordTable
        rows={sqpKeywords}
        selectedKeyword={selected?.query ?? null}
        onSelect={handleSelect}
        portfolioAvgClickShare={sqpSummary.avgClickShare}
        portfolioAvgPurchaseShare={sqpSummary.avgPurchaseShare}
      />

      {/* 4 — Keyword detail drawer */}
      <KeywordDetailDrawer keyword={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
