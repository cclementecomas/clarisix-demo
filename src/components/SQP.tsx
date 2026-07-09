import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { sqpWeekly } from '../lib/sqp/fixture';
import { maxWeek, listWeeks, resolveRange, filterScope, latestWeekStatus } from '../lib/sqp/metrics';
import { portfolioView } from './keywords/selectors';
import type { QueryRow } from './keywords/selectors';
import MainIssueBanner from './keywords/MainIssueBanner';
import PortfolioMap from './keywords/PortfolioMap';
import KeywordTable from './keywords/KeywordTable';
import KeywordDrawer from './keywords/KeywordDrawer';
import TrustBar from './sqpui/TrustBar';
import LatestWeekBanner from './sqpui/LatestWeekBanner';
import WeekRangePicker from './sqpui/WeekRangePicker';
import BrandedToggle, { type Brand } from './sqpui/BrandedToggle';

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
  const [noteDismissed, setNoteDismissed] = useState(false);

  const latest = latestWeekStatus(sqpWeekly);

  const { view, currRows } = useMemo(() => {
    const { weeks } = resolveRange(sqpWeekly, endWeek, nWeeks);
    const currRows = filterScope(sqpWeekly, { weeks, branded: brand });
    return { view: portfolioView(currRows), currRows };
  }, [endWeek, nWeeks, brand]);

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
            <p className="text-[11px] text-gray-500 mt-0.5">Treat each keyword as an asset. Defend / Invest / Harvest / Tail. Amazon search (SQP), weekly.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <WeekRangePicker weeks={allWeeks} endWeek={endWeek} nWeeks={nWeeks} onChange={(e, n) => { setEndWeek(e); setNWeeks(n); }} />
            <BrandedToggle value={brand} onChange={setBrand} />
          </div>
        </div>
        <TrustBar throughWeek={endWeek} nAsins={latest.expected} nQueries={view.nTracked} />
        <LatestWeekBanner status={latest} />
      </div>

      {brand === 'nonbranded' && !noteDismissed && (
        <div className="flex items-start justify-between gap-3 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-[11px] text-sky-800">
          <span>Showing <span className="font-semibold">non-branded</span> queries — branded terms have inflated CTR/CVR (the shopper already wanted you) and mask true listing &amp; PPC performance.</span>
          <button onClick={() => setNoteDismissed(true)} className="flex-shrink-0 text-sky-500 hover:text-sky-700"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <MainIssueBanner banner={view.banner} nTracked={view.nTracked} closure={closure} setClosure={setClosure} onNextStep={scrollToTable} />
      <PortfolioMap rows={view.rows} thresholds={view.thresholds} onSelect={setSelected} />
      <KeywordTable rows={view.rows} selected={selected?.query ?? null} onSelect={setSelected} />

      <KeywordDrawer row={selected} rows={currRows} onClose={() => setSelected(null)} />
    </div>
  );
}
