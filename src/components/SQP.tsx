import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { sqpWeekly } from '../lib/sqp/fixture';
import { maxWeek, listWeeks, resolveRange, filterScope, latestWeekStatus } from '../lib/sqp/metrics';
import { portfolioView, makeKeywordMatcher } from './keywords/selectors';
import type { QueryRow } from './keywords/selectors';
import MainIssueBanner, { type KeywordFilter } from './keywords/MainIssueBanner';
import PortfolioMap from './keywords/PortfolioMap';
import KeywordTable from './keywords/KeywordTable';
import KeywordDrawer from './keywords/KeywordDrawer';
import SqpDeepDive from './sqptables/SqpDeepDive';
import TrustBar from './sqpui/TrustBar';
import LatestWeekBanner from './sqpui/LatestWeekBanner';
import WeekRangePicker from './sqpui/WeekRangePicker';
import BrandedToggle, { type Brand } from './sqpui/BrandedToggle';
import InfoTooltip from './InfoTooltip';
import ViewModeToggle, { type ViewMode } from './ViewModeToggle';

/** Sales → SQP → "Keyword Portfolio" (§5). Query pivot. Non-branded by default (§5.5). */
export default function SQP({ focusQuery, onFocusConsumed }: {
  focusQuery?: { query: string; branded: boolean } | null;
  onFocusConsumed?: () => void;
} = {}) {
  const allWeeks = listWeeks(sqpWeekly);
  const [endWeek, setEndWeek] = useState(maxWeek(sqpWeekly));
  const [nWeeks, setNWeeks] = useState(4);
  const [brand, setBrand] = useState<Brand>('nonbranded');
  const [closure, setClosure] = useState(0.5);
  const [selected, setSelected] = useState<QueryRow | null>(null);
  const [tableFilter, setTableFilter] = useState<KeywordFilter>('all');
  const [kwFilter, setKwFilter] = useState('');
  const [noteDismissed, setNoteDismissed] = useState(false);
  const [mode, setMode] = useState<'insights' | 'tables'>('insights');
  // Platform Decision/Analyst toggle mapped onto this page's insights vs tables views.
  const viewMode: ViewMode = mode === 'insights' ? 'decision' : 'analyst';
  const setViewMode = (m: ViewMode) => setMode(m === 'decision' ? 'insights' : 'tables');

  const latest = latestWeekStatus(sqpWeekly);

  const currRows = useMemo(() => {
    const { weeks } = resolveRange(sqpWeekly, endWeek, nWeeks);
    return filterScope(sqpWeekly, { weeks, branded: brand });
  }, [endWeek, nWeeks, brand]);

  // Keyword segment filter recomputes the WHOLE page (banner, map, table) so share reflects the segment.
  const matcher = useMemo(() => makeKeywordMatcher(kwFilter), [kwFilter]);
  const scopedRows = useMemo(() => currRows.filter((r) => matcher(r.query)), [currRows, matcher]);
  const view = useMemo(() => portfolioView(scopedRows), [scopedRows]);
  const totalQueries = useMemo(() => new Set(currRows.map((r) => r.query)).size, [currRows]);

  const scrollToTable = () => document.getElementById('keyword-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Deep-link from the Traffic ASIN drawer ("Keyword Portfolio ↗"): scope so the query is visible, then open its drawer.
  useEffect(() => {
    if (!focusQuery) return;
    const wantBrand: Brand = focusQuery.branded ? 'branded' : 'nonbranded';
    if (brand !== wantBrand) { setBrand(wantBrand); return; } // let the view recompute under the new scope, then re-run
    const row = view.rows.find((r) => r.query === focusQuery.query);
    if (row) setSelected(row);
    onFocusConsumed?.(); // clear even if not found, so we don't re-trigger on later renders
  }, [focusQuery, brand, view, onFocusConsumed]);

  return (
    <div className="space-y-4 min-w-0">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cx-500" />
              <h1 className="text-lg font-bold text-gray-900">Keyword portfolio</h1>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {viewMode === 'decision'
                ? 'Treat each keyword as an asset. Defend / Invest / Harvest / Tail. Amazon search (SQP), weekly.'
                : 'Every keyword’s full SQP metrics across the segment — for analysis and export.'}
            </p>
          </div>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input type="text" value={kwFilter} onChange={(e) => setKwFilter(e.target.value)} placeholder="Filter keywords… e.g. vitamin AND d3, !gummy"
              className="pl-8 pr-7 py-1.5 text-xs w-72 border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none" />
            {kwFilter && <button onClick={() => setKwFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
          </div>
          <InfoTooltip content="Isolate a segment (a category, ingredient or use case). Words are AND by default — “vitamin d3” needs both. Use OR for either (“vitamin OR d3”), and ! or - to exclude (“vitamin !gummy”). The whole page reflects the segment." wide />
          <WeekRangePicker weeks={allWeeks} endWeek={endWeek} nWeeks={nWeeks} onChange={(e, n) => { setEndWeek(e); setNWeeks(n); }} />
          <BrandedToggle value={brand} onChange={setBrand} />
        </div>
        <TrustBar throughWeek={endWeek} nAsins={latest.expected} nQueries={view.nTracked} />
        <LatestWeekBanner status={latest} />
      </div>

      {kwFilter.trim() && (
        <div className="flex items-start justify-between gap-3 bg-cx-50 border border-cx-200 rounded-lg px-3 py-2 text-[11px] text-cx-800">
          <span>Segment: <span className="font-semibold">{view.nTracked} of {totalQueries}</span> keywords match <span className="font-mono bg-white/70 px-1 rounded">{kwFilter}</span> — banner, quadrant map and table all reflect this segment.</span>
          <button onClick={() => setKwFilter('')} className="flex-shrink-0 font-semibold text-cx-600 hover:text-cx-700 inline-flex items-center gap-1">Clear <X className="w-3 h-3" /></button>
        </div>
      )}

      {brand === 'nonbranded' && !noteDismissed && (
        <div className="flex items-start justify-between gap-3 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-[11px] text-sky-800">
          <span>Showing <span className="font-semibold">non-branded</span> queries — branded terms have inflated CTR/CVR (the shopper already wanted you) and mask true listing &amp; PPC performance.</span>
          <button onClick={() => setNoteDismissed(true)} className="flex-shrink-0 text-sky-500 hover:text-sky-700"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {mode === 'insights' && (
        <>
          <MainIssueBanner banner={view.banner} nTracked={view.nTracked} closure={closure} setClosure={setClosure} onNextStep={scrollToTable}
            activeFilter={tableFilter} onFilter={(f) => { setTableFilter((prev) => (prev === f ? 'all' : f)); scrollToTable(); }} />
          <PortfolioMap rows={view.rows} thresholds={view.thresholds} onSelect={setSelected} />
          <KeywordTable rows={view.rows} selected={selected?.query ?? null} onSelect={setSelected} filter={tableFilter} onClearFilter={() => setTableFilter('all')} />
          <KeywordDrawer row={selected} rows={currRows} onClose={() => setSelected(null)} />
        </>
      )}

      {mode === 'tables' && <SqpDeepDive rows={scopedRows} />}
    </div>
  );
}
