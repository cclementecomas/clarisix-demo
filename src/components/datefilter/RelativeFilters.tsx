import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface RelativeFiltersProps {
  value: number;
  unit: string;
  onChangeValue: (v: number) => void;
  onChangeUnit: (u: string) => void;
}

const UNITS = ['days', 'weeks', 'months', 'years'];

export default function RelativeFilters({ value, unit, onChangeValue, onChangeUnit }: RelativeFiltersProps) {
  const [unitOpen, setUnitOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-gray-700">Last</span>
      <div className="relative">
        <input
          type="number"
          min={1}
          max={365}
          value={value}
          onChange={e => onChangeValue(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-28 px-3 py-2 text-sm font-medium text-gray-700 border-2 border-dashed border-gray-200 rounded-lg focus:border-cx-300 focus:outline-none transition-colors"
        />
      </div>
      <div className="relative">
        <button
          onClick={() => setUnitOpen(!unitOpen)}
          className="flex items-center gap-6 px-3 py-2 text-sm font-medium text-gray-400 border-2 border-dashed border-gray-200 rounded-lg hover:border-cx-300 transition-colors min-w-[120px]"
        >
          <span>{unit}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        {unitOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUnitOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
              {UNITS.map(u => (
                <button
                  key={u}
                  onClick={() => { onChangeUnit(u); setUnitOpen(false); }}
                  className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-cx-50 transition-colors ${
                    unit === u ? 'text-cx-700 bg-cx-50 font-medium' : 'text-gray-600'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
