import { Clock } from 'lucide-react';
import { weekLabel } from '../searchfunnel/format';

export default function LatestWeekBanner({ status }: { status: { throughWeek: string; expected: number; reported: number; complete: boolean; lastCompleteWeek: string } }) {
  if (status.complete) return null;
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-800">
      <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>
        Latest week ending <span className="font-semibold">{weekLabel(status.throughWeek)}</span> is still landing — {status.reported} of {status.expected} ASINs have reported (SQP lags a few days).
        Numbers for that week are partial; the last fully-reported week is <span className="font-semibold">{weekLabel(status.lastCompleteWeek)}</span>.
      </span>
    </div>
  );
}
