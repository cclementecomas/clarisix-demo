import { useMemo } from 'react';
import { Calendar, Info } from 'lucide-react';
import { useDateFilter } from '../contexts/DateFilterContext';
import { snapToWeeks } from '../utils/dateRanges';

/**
 * Badge shown at the top of pages whose underlying data only comes in weekly
 * buckets (Brand Analytics: SQP, Search Catalog Performance, Top Search Terms).
 *
 * Behavior:
 *  - Reads the global date filter
 *  - Snaps it to the enclosing Sunday → Saturday weeks
 *  - Renders a small chip showing the snapped range + week count
 *  - If the snap changed anything, hovering reveals the "why" tooltip
 *
 * Pages that use this shouldn't read the global date filter directly —
 * they should call `useWeeklySnappedRange()` to get the snapped values.
 */
export function useWeeklySnappedRange() {
  const { dateResult } = useDateFilter();
  return useMemo(() => snapToWeeks(dateResult.primary), [dateResult.primary]);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function WeeklyDataBadge() {
  const { snapped, wasSnapped, weekCount } = useWeeklySnappedRange();

  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800"
      title={
        wasSnapped
          ? `Brand Analytics data is published in weekly buckets (Sunday → Saturday). Your date selection was snapped outward to the enclosing weeks so no partial week is missed.`
          : `Brand Analytics data is published in weekly buckets (Sunday → Saturday). Your date selection aligns cleanly with whole weeks.`
      }
    >
      <Calendar className="w-3 h-3" />
      <span className="text-[10px] font-bold uppercase tracking-wider">Weekly buckets</span>
      <span className="text-gray-300">·</span>
      <span className="text-[10px] tabular-nums">
        {formatDate(snapped.start)} → {formatDate(snapped.end)}
      </span>
      <span className="text-[10px] font-semibold text-sky-700">({weekCount} {weekCount === 1 ? 'week' : 'weeks'})</span>
      {wasSnapped && <Info className="w-3 h-3 text-sky-500" />}
    </div>
  );
}
