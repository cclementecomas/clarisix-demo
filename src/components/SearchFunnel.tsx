import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { sqpWeekly } from '../lib/sqp/fixture';
import { maxWeek, listWeeks, resolveRange, filterScope, latestWeekStatus } from '../lib/sqp/metrics';
import { computeVerdict } from '../lib/sqp/verdict';
import type { TransitionKey } from '../lib/sqp/types';
import { brandView } from './searchfunnel/selectors';
import MainLeakBanner from './searchfunnel/MainLeakBanner';
import FunnelRates from './searchfunnel/FunnelRates';
import AsinLeakTable from './searchfunnel/AsinLeakTable';
import AsinDrawer from './searchfunnel/AsinDrawer';
import SqpDeepDive from './sqptables/SqpDeepDive';
import TrustBar from './sqpui/TrustBar';
import LatestWeekBanner from './sqpui/LatestWeekBanner';
import WeekRangePicker from './sqpui/WeekRangePicker';
import BrandedToggle, { type Brand } from './sqpui/BrandedToggle';
import KeywordScopeBar from './sqpui/KeywordScopeBar';
import ViewModeToggle, { type ViewMode } from './ViewModeToggle';
import { makeKeywordMatcher } from './keywords/selectors';

/** Sales → "Search funnel" (§4). Level B only: how well you convert at each funnel step
 *  versus the market. Market-share levels are the Search share page. */
export default function SearchFunnel({ onOpenKeyword, onOpenShare }: {
  onOpenKeyword?: (query: string, branded: boolean) => void;
  onOpenShare?: () => void;
}) {
  const allWeeks = listWeeks(sqpWeekly);
  const [endWeek, setEndWeek] = useState(maxWeek(sqpWeekly));
  const [nWeeks, setNWeeks] = useState(4);
  const [brand, setBrand] = useState<Brand>('all');
  const [selectedAsin, setSelectedAsin] = useState<string | null>(null);
  const [stage, setStage] = useState<TransitionKey | 'all'>('all');
  const [pageView, setPageView] = useState<ViewMode>('decision');
  const [kwFilter, setKwFilter] = useState('');

  const latest = latestWeekStatus(sqpWeekly);
  const nAsins = latest.expected;

  const { view, verdict, currRows, weeks } = useMemo(() => {
    const { weeks, priorWeeks } = resolveRange(sqpWeekly, endWeek, nWeeks);
    const currRows = filterScope(sqpWeekly, { weeks, branded: brand });
    const priorRows = filterScope(sqpWeekly, { weeks: priorWeeks, branded: brand });
    return { view: brandView(currRows, priorRows), verdict: computeVerdict(currRows, priorRows), currRows, weeks };
  }, [endWeek, nWeeks, brand]);

  // Analyst view only: narrow the pivot to a keyword segment without touching the decision view.
  const analystRows = useMemo(() => {
    const matcher = makeKeywordMatcher(kwFilter);
    return currRows.filter((r) => matcher(r.query));
  }, [currRows, kwFilter]);
  const kwCounts = useMemo(() => ({
    matched: new Set(analystRows.map((r) => r.query)).size,
    total: new Set(currRows.map((r) => r.query)).size,
  }), [analystRows, currRows]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const focusStageAndScroll = (s: TransitionKey | null) => { setStage(s ?? 'all'); scrollTo('asin-leak-table'); };

  return (
    <div className="space-y-4 min-w-0">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cx-500" />
              <h1 className="text-lg font-bold text-gray-900">Search funnel</h1>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {pageView === 'decision'
                ? 'How well you convert at each step of search versus the market, what each gap costs, and which ASINs to fix first. Amazon search (SQP), weekly.'
                : 'Every conversion rate against the market at any grain — keyword, ASIN or week — for analysis and export.'}
            </p>
          </div>
          <ViewModeToggle mode={pageView} onChange={setPageView} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <WeekRangePicker weeks={allWeeks} endWeek={endWeek} nWeeks={nWeeks} onChange={(e, n) => { setEndWeek(e); setNWeeks(n); }} />
          {/* Analyst view carries the branded scope inside its keyword filter bar instead. */}
          {pageView === 'decision' && <BrandedToggle value={brand} onChange={setBrand} />}
        </div>
        <TrustBar throughWeek={endWeek} nAsins={nAsins} />
        <LatestWeekBanner status={latest} />
      </div>

      {pageView === 'decision' ? (
        <>
          <MainLeakBanner verdict={verdict} nWeeks={weeks.length} onFocusStage={focusStageAndScroll} onFocusTrend={() => focusStageAndScroll(null)} />
          <FunnelRates rows={currRows} onOpenShare={onOpenShare} onFocusStage={(s) => focusStageAndScroll(s)} />
          <AsinLeakTable rows={view.asins} stage={stage} onStageChange={setStage} onSelect={setSelectedAsin} />

          <AsinDrawer asin={selectedAsin} rows={currRows} onClose={() => setSelectedAsin(null)} onOpenKeyword={onOpenKeyword} />
        </>
      ) : (
        <>
          <KeywordScopeBar
            filter={kwFilter}
            onFilterChange={setKwFilter}
            brand={brand}
            onBrandChange={setBrand}
            matched={kwCounts.matched}
            total={kwCounts.total}
          />
          <SqpDeepDive rows={analystRows} variant="rates" />
        </>
      )}
    </div>
  );
}
