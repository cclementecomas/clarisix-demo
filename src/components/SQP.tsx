import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { sqpKeywords, sqpSummary } from '../data/sqpData';
import type { KeywordRow } from '../data/sqpData';

type BrandFilter = 'all' | 'nonBranded' | 'branded';

const BRAND_FILTERS: { value: BrandFilter; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'nonBranded', label: 'Non-branded' },
  { value: 'branded',    label: 'Branded' },
];
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
  const [brandFilter, setBrandFilter] = useState<BrandFilter>('all');

  const rows = useMemo(() => {
    if (brandFilter === 'branded') return sqpKeywords.filter((k) => k.branded);
    if (brandFilter === 'nonBranded') return sqpKeywords.filter((k) => !k.branded);
    return sqpKeywords;
  }, [brandFilter]);

  const handleSelect = (k: KeywordRow | null) => setSelected(k);

  const handleHeroNext = () => {
    // Open the top opportunity directly in the drawer — fastest path to action.
    const topOpp = [...rows].sort((a, b) => b.opportunityEur - a.opportunityEur)[0];
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
          <div className="flex items-center bg-gray-100 rounded-md p-0.5" title="Analyze non-branded to judge true listing & PPC performance — branded terms inflate CTR/CVR (SOP).">
            {BRAND_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setBrandFilter(f.value)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${
                  brandFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <WeeklyDataBadge />
          <LastRefreshed offsetMinutes={11} />
        </div>
      </div>

      {/* 1 — Hero insight */}
      <SQPHeroCard onNextStep={handleHeroNext} />

      {/* 2 — Portfolio map */}
      <PortfolioMap keywords={rows} onSelect={handleSelect} />

      {/* 3 — Prioritized keyword table */}
      <KeywordTable
        rows={rows}
        selectedKeyword={selected?.query ?? null}
        onSelect={handleSelect}
        portfolioAvgClickShare={sqpSummary.avgClickShare}
      />

      {/* 4 — Keyword detail drawer */}
      <KeywordDetailDrawer keyword={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
