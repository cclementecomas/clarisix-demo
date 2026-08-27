import { Search, X } from 'lucide-react';
import InfoTooltip from '../InfoTooltip';
import type { Brand } from './BrandedToggle';

const OPTS: { v: Brand; label: string }[] = [
  { v: 'all', label: 'All' },
  { v: 'nonbranded', label: 'Non-branded' },
  { v: 'branded', label: 'Branded' },
];

/** Keyword filter and the branded scope fused into one control — they answer the same
 *  question ("which keywords am I looking at?"), so they share a single bordered group. */
export default function KeywordScopeBar({ filter, onFilterChange, brand, onBrandChange, matched, total }: {
  filter: string;
  onFilterChange: (v: string) => void;
  brand: Brand;
  onBrandChange: (b: Brand) => void;
  matched?: number;
  total?: number;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="inline-flex items-center border border-gray-200 rounded-lg bg-white focus-within:border-cx-400 focus-within:ring-1 focus-within:ring-cx-500/30 transition-colors">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter keywords… e.g. vitamin AND d3, !gummy"
            className="pl-8 pr-7 py-1.5 text-xs w-72 bg-transparent outline-none rounded-l-lg"
          />
          {filter && (
            <button onClick={() => onFilterChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="w-px self-stretch bg-gray-200" />
        <div className="flex items-center gap-0.5 p-0.5">
          {OPTS.map((o) => (
            <button
              key={o.v}
              onClick={() => onBrandChange(o.v)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${brand === o.v ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <InfoTooltip
        content="Words are AND by default — “vitamin d3” needs both. Use OR for either, and ! or - to exclude (“vitamin !gummy”). Branded terms have inflated CTR & CVR (the shopper already wanted you), so analyse non-branded to judge new-audience performance."
        wide
      />
      {filter.trim() && matched != null && total != null && (
        <span className="text-[11px] text-gray-500">
          <span className="font-semibold text-gray-700">{matched}</span> of {total} keywords match
        </span>
      )}
    </div>
  );
}
