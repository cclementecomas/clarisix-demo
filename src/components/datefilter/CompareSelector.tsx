import { useState } from 'react';
import { ArrowLeftRight, CalendarClock, ChevronDown } from 'lucide-react';
import type { CompareMode, DateRange } from '../../utils/dateRanges';
import { formatDateShort } from '../../utils/dateRanges';

interface CompareSelectorProps {
  mode: CompareMode;
  onChangeMode: (mode: CompareMode) => void;
  primaryRange: DateRange | null;
  compareRange: DateRange | null;
  customCompareStart: Date | null;
  customCompareEnd: Date | null;
  onCustomCompareClick: () => void;
}

const OPTIONS: { key: CompareMode; label: string; description: string; icon: typeof ArrowLeftRight }[] = [
  { key: 'pop', label: 'Previous period', description: 'Compare to the preceding period of equal length', icon: ArrowLeftRight },
  { key: 'ly', label: 'Last year', description: 'Compare to the same dates one year ago', icon: CalendarClock },
  { key: 'custom', label: 'Custom period', description: 'Choose specific comparison dates', icon: CalendarClock },
];

export default function CompareSelector({
  mode,
  onChangeMode,
  compareRange,
  customCompareStart,
  customCompareEnd,
  onCustomCompareClick,
}: CompareSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const activeOption = OPTIONS.find(o => o.key === mode)!;

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compare to</div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border-2 border-dashed border-gray-200 hover:border-cx-300 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <activeOption.icon className="w-4 h-4 text-cx-500" />
          <span className="text-sm font-medium text-gray-700">{activeOption.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {OPTIONS.map((opt) => {
            const isActive = mode === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  onChangeMode(opt.key);
                  if (opt.key !== 'custom') setExpanded(false);
                }}
                className={`
                  w-full flex items-start gap-3 px-3.5 py-3 text-left transition-colors
                  ${isActive ? 'bg-cx-50' : 'hover:bg-gray-50'}
                `}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isActive ? 'border-cx-500' : 'border-gray-300'}`}>
                  {isActive && <div className="w-2 h-2 rounded-full bg-cx-500" />}
                </div>
                <div>
                  <div className={`text-sm font-medium ${isActive ? 'text-cx-700' : 'text-gray-700'}`}>{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {mode === 'custom' && (
        <button
          onClick={onCustomCompareClick}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border-2 border-dashed border-cx-200 text-cx-600 hover:border-cx-400 hover:bg-cx-50/50 transition-colors text-sm font-medium"
        >
          <CalendarClock className="w-4 h-4" />
          {customCompareStart && customCompareEnd
            ? `${formatDateShort(customCompareStart)} - ${formatDateShort(customCompareEnd)}`
            : 'Select comparison dates'
          }
        </button>
      )}

      {compareRange && mode !== 'custom' && (
        <div className="text-xs text-gray-400 px-1">
          vs {formatDateShort(compareRange.start)} - {formatDateShort(compareRange.end)}
        </div>
      )}
    </div>
  );
}
