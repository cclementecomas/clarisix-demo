import { useState, useCallback } from 'react';
import { ChevronDown, Calendar, Menu, Check, X } from 'lucide-react';
import { filterOptions } from '../data/dashboardData';
import DateFilterModal from './datefilter/DateFilterModal';
import UserDropdown from './UserDropdown';
import {
  resolveQuickPreset,
  formatDateShort,
  type DateFilterResult,
} from '../utils/dateRanges';
import { useCurrency, type Currency, CURRENCY_SYMBOLS } from '../contexts/CurrencyContext';

function MultiSelectFilter({ label, options }: { label: string; options: string[] }) {
  const allOption = options[0];
  const selectableOptions = options.slice(1);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isAll = selected.size === 0;

  const toggleOption = (opt: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) {
        next.delete(opt);
      } else {
        next.add(opt);
      }
      return next;
    });
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const displayLabel = isAll
    ? 'All'
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} selected`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white border rounded-lg hover:border-cx-300 hover:text-cx-700 transition-all duration-200 ${
          !isAll ? 'border-cx-300 text-cx-700' : 'border-gray-200 text-gray-600'
        }`}
      >
        <span className="text-gray-400 text-xs uppercase tracking-wide">{label}</span>
        <span className="text-gray-800 ml-1">{displayLabel}</span>
        {!isAll && (
          <button
            onClick={(e) => { e.stopPropagation(); clearAll(); }}
            className="ml-0.5 p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] max-h-[280px] overflow-y-auto">
            <button
              onClick={clearAll}
              className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm hover:bg-cx-50 transition-colors ${
                isAll ? 'text-cx-700 bg-cx-50 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="w-4 h-4 flex items-center justify-center">
                {isAll && <Check className="w-3.5 h-3.5 text-cx-500" />}
              </span>
              {allOption}
            </button>
            <div className="border-t border-gray-100 my-1" />
            {selectableOptions.map((opt) => {
              const isChecked = selected.has(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm hover:bg-cx-50 transition-colors ${
                    isChecked ? 'text-cx-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                    isChecked ? 'bg-cx-500 border-cx-500' : 'border-gray-300'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 text-white" />}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const currencies: Currency[] = ['EUR', 'USD', 'GBP'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-cx-300 hover:text-cx-700 transition-all duration-200"
      >
        <span className="text-base">{CURRENCY_SYMBOLS[currency]}</span>
        <span>{currency}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
            {currencies.map((curr) => (
              <button
                key={curr}
                onClick={() => { setCurrency(curr); setOpen(false); }}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-cx-50 transition-colors ${
                  currency === curr ? 'text-cx-700 bg-cx-50 font-semibold' : 'text-gray-700 font-medium'
                }`}
              >
                <span className="text-base">{CURRENCY_SYMBOLS[curr]}</span>
                <span>{curr}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface NavigationProps {
  activeSection: string;
  activeSub: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  currentPage?: string;
  onNavigate: (page: string) => void;
}

const defaultRange = resolveQuickPreset('Last month');

export default function Navigation({ activeSection, activeSub, sidebarCollapsed, onToggleSidebar, currentPage, onNavigate }: NavigationProps) {
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateResult, setDateResult] = useState<DateFilterResult>(defaultRange);
  const closeDateFilter = useCallback(() => setDateFilterOpen(false), []);

  function handleDateApply(result: DateFilterResult) {
    setDateResult(result);
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-50">
        <div className="flex items-center gap-3">
          {sidebarCollapsed && (
            <button
              onClick={onToggleSidebar}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors -ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-sm font-semibold text-gray-900">
            {currentPage === 'home' ? 'Home' : currentPage === 'settings' ? 'Settings' : currentPage === 'connectors' ? 'Connectors' : activeSection}
          </h1>
          {currentPage === 'dashboard' && (
            <>
              <span className="text-gray-300 mx-0.5">/</span>
              <span className="text-sm font-medium text-cx-700">{activeSub}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(currentPage === 'dashboard' || currentPage === 'home') && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 font-medium">From</span>
                <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium text-[13px]">
                  {formatDateShort(dateResult.primary.start)}
                </span>
                <span className="text-gray-400 font-medium">to</span>
                <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium text-[13px]">
                  {formatDateShort(dateResult.primary.end)}
                </span>
                <span className="text-gray-400 font-medium ml-1">vs.</span>
                <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium text-[13px]">
                  {formatDateShort(dateResult.compare.start)}
                </span>
                <span className="text-gray-400 font-medium">to</span>
                <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium text-[13px]">
                  {formatDateShort(dateResult.compare.end)}
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setDateFilterOpen(!dateFilterOpen)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                    dateFilterOpen ? 'border-cx-300 bg-cx-50 text-cx-600' : 'border-gray-200 hover:border-cx-300 text-gray-500'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <DateFilterModal
                  open={dateFilterOpen}
                  onClose={closeDateFilter}
                  onApply={handleDateApply}
                />
              </div>
            </>
          )}
          <CurrencySelector />
          <UserDropdown onNavigate={onNavigate} />
        </div>
      </div>

      {(currentPage === 'dashboard' || currentPage === 'home') && (
        <div className="flex items-center px-6 py-2 bg-gray-50/50 gap-2 flex-wrap">
          <MultiSelectFilter label="Marketplace" options={filterOptions.marketplace} />
          <MultiSelectFilter label="Brand" options={filterOptions.brand} />
          <MultiSelectFilter label="Category" options={filterOptions.category} />
          <MultiSelectFilter label="Subcategory" options={filterOptions.subcategory} />
          <MultiSelectFilter label="Tag" options={filterOptions.tag} />
          <MultiSelectFilter label="ASIN" options={filterOptions.asin} />
          <MultiSelectFilter label="SKU" options={filterOptions.sku} />
        </div>
      )}
    </header>
  );
}
