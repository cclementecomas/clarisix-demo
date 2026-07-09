import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { sqpWeekly } from '../lib/sqp/fixture';
import { maxWeek, listWeeks, resolveRange, filterScope, latestWeekStatus } from '../lib/sqp/metrics';
import { computeVerdict } from '../lib/sqp/verdict';
import type { TransitionKey } from '../lib/sqp/types';
import { brandView } from './searchfunnel/selectors';
import MainLeakBanner from './searchfunnel/MainLeakBanner';
import ParityBridge from './searchfunnel/ParityBridge';
import AsinLeakTable from './searchfunnel/AsinLeakTable';
import AsinDrawer from './searchfunnel/AsinDrawer';
import TrustBar from './sqpui/TrustBar';
import LatestWeekBanner from './sqpui/LatestWeekBanner';
import WeekRangePicker from './sqpui/WeekRangePicker';
import BrandedToggle, { type Brand } from './sqpui/BrandedToggle';

/** Sales → Traffic → "Search Funnel" (§4). ASIN pivot on Amazon SQP. */
export default function Traffic({ onOpenKeyword }: { onOpenKeyword?: (query: string, branded: boolean) => void }) {
  const allWeeks = listWeeks(sqpWeekly);
  const [endWeek, setEndWeek] = useState(maxWeek(sqpWeekly));
  const [nWeeks, setNWeeks] = useState(4);
  const [brand, setBrand] = useState<Brand>('all');
  const [selectedAsin, setSelectedAsin] = useState<string | null>(null);
  const [stage, setStage] = useState<TransitionKey | 'all'>('all');

  const latest = latestWeekStatus(sqpWeekly);
  const nAsins = latest.expected;

  const { view, verdict, currRows, weeks } = useMemo(() => {
    const { weeks, priorWeeks } = resolveRange(sqpWeekly, endWeek, nWeeks);
    const currRows = filterScope(sqpWeekly, { weeks, branded: brand });
    const priorRows = filterScope(sqpWeekly, { weeks: priorWeeks, branded: brand });
    return { view: brandView(currRows, priorRows), verdict: computeVerdict(currRows, priorRows), currRows, weeks };
  }, [endWeek, nWeeks, brand]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const focusStageAndScroll = (s: TransitionKey | null) => { setStage(s ?? 'all'); scrollTo('asin-leak-table'); };

  return (
    <div className="space-y-4 min-w-0">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cx-500" />
              <h1 className="text-lg font-bold text-gray-900">Traffic funnel</h1>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Where your search funnel leaks vs the market, what it costs, and which ASINs to fix first. Amazon search traffic (SQP), weekly.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <WeekRangePicker weeks={allWeeks} endWeek={endWeek} nWeeks={nWeeks} onChange={(e, n) => { setEndWeek(e); setNWeeks(n); }} />
            <BrandedToggle value={brand} onChange={setBrand} />
          </div>
        </div>
        <TrustBar throughWeek={endWeek} nAsins={nAsins} />
        <LatestWeekBanner status={latest} />
      </div>

      <MainLeakBanner verdict={verdict} nWeeks={weeks.length} onFocusStage={focusStageAndScroll} onFocusTrend={() => focusStageAndScroll(null)} />
      <ParityBridge rows={currRows} onFocusStage={(s) => focusStageAndScroll(s)} />
      <AsinLeakTable rows={view.asins} stage={stage} onStageChange={setStage} onSelect={setSelectedAsin} />

      <AsinDrawer asin={selectedAsin} rows={currRows} onClose={() => setSelectedAsin(null)} onOpenKeyword={onOpenKeyword} />
    </div>
  );
}
