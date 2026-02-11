import { useState, useEffect, useRef } from 'react';
import Calendar from './Calendar';
import QuickFilters from './QuickFilters';
import RelativeFilters from './RelativeFilters';
import CompareSelector from './CompareSelector';
import {
  resolveQuickPreset,
  resolveRelativeFilter,
  resolveCustomRange,
  resolveCompare,
  formatDateShort,
  type DateFilterResult,
  type CompareMode,
} from '../../utils/dateRanges';

type Tab = 'quick' | 'relative' | 'range';

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'range', label: 'Date range' },
  { key: 'quick', label: 'Quick filters' },
  { key: 'relative', label: 'Relative filters' },
];

interface DateFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (result: DateFilterResult) => void;
}

export default function DateFilterModal({ open, onClose, onApply }: DateFilterModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('range');
  const [quickPreset, setQuickPreset] = useState('Last month');

  const [relativeValue, setRelativeValue] = useState(30);
  const [relativeUnit, setRelativeUnit] = useState('days');

  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

  const [compareMode, setCompareMode] = useState<CompareMode>('pop');
  const [customCompareStart, setCustomCompareStart] = useState<Date | null>(null);
  const [customCompareEnd, setCustomCompareEnd] = useState<Date | null>(null);
  const [selectingCompare, setSelectingCompare] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'quick' && quickPreset) {
      const result = resolveQuickPreset(quickPreset, compareMode);
      setRangeStart(result.primary.start);
      setRangeEnd(result.primary.end);
      setCalMonth(result.primary.start.getMonth());
      setCalYear(result.primary.start.getFullYear());
    }
  }, [quickPreset, activeTab, compareMode]);

  useEffect(() => {
    if (activeTab === 'relative') {
      const result = resolveRelativeFilter(relativeValue, relativeUnit, compareMode);
      setRangeStart(result.primary.start);
      setRangeEnd(result.primary.end);
      setCalMonth(result.primary.start.getMonth());
      setCalYear(result.primary.start.getFullYear());
    }
  }, [relativeValue, relativeUnit, activeTab, compareMode]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose]);

  function handleDateSelect(date: Date) {
    if (selectingCompare) {
      if (!customCompareStart || (customCompareStart && customCompareEnd)) {
        setCustomCompareStart(date);
        setCustomCompareEnd(null);
      } else {
        if (date.getTime() < customCompareStart.getTime()) {
          setCustomCompareEnd(customCompareStart);
          setCustomCompareStart(date);
        } else {
          setCustomCompareEnd(date);
        }
        setSelectingCompare(false);
      }
    } else if (activeTab === 'range') {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(date);
        setRangeEnd(null);
      } else {
        if (date.getTime() < rangeStart.getTime()) {
          setRangeEnd(rangeStart);
          setRangeStart(date);
        } else {
          setRangeEnd(date);
        }
      }
    }
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  }

  function getCompareRange() {
    if (!rangeStart || !rangeEnd) return null;
    const primary = { start: rangeStart, end: rangeEnd };
    if (compareMode === 'custom' && customCompareStart && customCompareEnd) {
      return { start: customCompareStart, end: customCompareEnd };
    }
    return resolveCompare(primary, compareMode);
  }

  function handleApply() {
    let result: DateFilterResult;
    const customCompare = customCompareStart && customCompareEnd
      ? { start: customCompareStart, end: customCompareEnd }
      : undefined;

    if (activeTab === 'quick') {
      result = resolveQuickPreset(quickPreset, compareMode, customCompare);
    } else if (activeTab === 'relative') {
      result = resolveRelativeFilter(relativeValue, relativeUnit, compareMode, customCompare);
    } else {
      if (!rangeStart || !rangeEnd) return;
      result = resolveCustomRange(rangeStart, rangeEnd, compareMode, customCompare);
    }
    onApply(result);
    onClose();
  }

  if (!open) return null;

  const canApply = activeTab === 'quick'
    ? !!quickPreset
    : activeTab === 'relative'
      ? relativeValue > 0
      : !!(rangeStart && rangeEnd);

  const computedCompareRange = getCompareRange();

  const calendarRangeStart = selectingCompare ? customCompareStart : rangeStart;
  const calendarRangeEnd = selectingCompare ? customCompareEnd : rangeEnd;

  return (
    <div className="absolute top-full right-0 mt-2 z-50" ref={modalRef}>
      <div className="w-[420px] max-h-[calc(100vh-100px)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 animate-fade-slide-in">
        <div className="flex border-b border-gray-100">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSelectingCompare(false); }}
              className={`
                flex-1 py-3 text-sm font-medium transition-all relative
                ${activeTab === key
                  ? 'text-cx-500 bg-cx-50/50'
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              {label}
              {activeTab === key && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-cx-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'quick' && (
            <div className="mb-5">
              <QuickFilters selected={quickPreset} onSelect={(p) => { setQuickPreset(p); setSelectingCompare(false); }} />
            </div>
          )}

          {activeTab === 'relative' && (
            <div className="mb-5">
              <RelativeFilters
                value={relativeValue}
                unit={relativeUnit}
                onChangeValue={setRelativeValue}
                onChangeUnit={setRelativeUnit}
              />
            </div>
          )}

          {selectingCompare && (
            <div className="mb-3 px-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-cx-600 bg-cx-50 rounded-lg px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-cx-500 animate-pulse" />
                Select comparison date range on the calendar
              </div>
            </div>
          )}

          {rangeStart && rangeEnd && !selectingCompare && (
            <div className="mb-3 px-1">
              <div className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">Period:</span> {formatDateShort(rangeStart)} - {formatDateShort(rangeEnd)}
              </div>
            </div>
          )}

          <div className={activeTab !== 'range' ? 'border-t border-gray-100 pt-4' : ''}>
            <Calendar
              month={calMonth}
              year={calYear}
              selectedDate={selectingCompare ? customCompareStart : rangeStart}
              rangeStart={calendarRangeStart}
              rangeEnd={calendarRangeEnd}
              onSelectDate={handleDateSelect}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <CompareSelector
              mode={compareMode}
              onChangeMode={(m) => {
                setCompareMode(m);
                if (m !== 'custom') {
                  setSelectingCompare(false);
                  setCustomCompareStart(null);
                  setCustomCompareEnd(null);
                }
              }}
              primaryRange={rangeStart && rangeEnd ? { start: rangeStart, end: rangeEnd } : null}
              compareRange={computedCompareRange}
              customCompareStart={customCompareStart}
              customCompareEnd={customCompareEnd}
              onCustomCompareClick={() => setSelectingCompare(true)}
            />
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleApply}
            disabled={!canApply}
            className={`
              w-full py-3 rounded-xl text-sm font-semibold transition-all
              ${canApply
                ? 'bg-cx-500 text-white hover:bg-cx-600 shadow-sm'
                : 'border-2 border-dashed border-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
