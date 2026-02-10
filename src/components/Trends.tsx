import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  metricOptions,
  dimensionOptions,
  generateTrendData,
  type TrendMetric,
  type TrendDimension,
  type TrendGranularity,
} from '../data/trendsData';
import TrendsPivotTable from './trends/TrendsPivotTable';

const granularityOptions: { value: TrendGranularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-500 whitespace-nowrap">{label}</span>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-cx-300 transition-colors text-sm font-semibold text-gray-800 min-w-[140px] justify-between"
        >
          <span>{selected?.label}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[200px]">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    value === opt.value
                      ? 'text-cx-700 bg-cx-50 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Trends() {
  const [metric, setMetric] = useState<TrendMetric>('adSpend');
  const [dimension, setDimension] = useState<TrendDimension>('marketplace');
  const [granularity, setGranularity] = useState<TrendGranularity>('week');

  const metricInfo = metricOptions.find(m => m.value === metric)!;
  const dimensionInfo = dimensionOptions.find(d => d.value === dimension)!;

  const { periods, rows } = useMemo(
    () => generateTrendData(metric, dimension, granularity),
    [metric, dimension, granularity],
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <Dropdown
              label="Metric :"
              value={metric}
              options={metricOptions}
              onChange={setMetric}
            />
            <Dropdown
              label="Dimension :"
              value={dimension}
              options={dimensionOptions}
              onChange={setDimension}
            />
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {granularityOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setGranularity(opt.value)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  granularity === opt.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <TrendsPivotTable
        title={`${metricInfo.label} by ${dimensionInfo.label}`}
        periods={periods}
        rows={rows}
        metricInfo={metricInfo}
      />
    </div>
  );
}
