import { useState } from 'react';
import { salesByMarketplace, salesByCategory, salesByASIN } from '../data/dashboardData';
import InfoTooltip from './InfoTooltip';
import { fc } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';

interface DataItem {
  name: string;
  value: number;
  previous: number;
}

function BulletBar({
  item,
  maxValue,
  colorOpacity,
}: {
  item: DataItem;
  maxValue: number;
  colorOpacity: number;
}) {
  const { currency } = useCurrency();
  const [hovered, setHovered] = useState(false);
  const currentPct = (item.value / maxValue) * 100;
  const previousPct = (item.previous / maxValue) * 100;
  const change = ((item.value - item.previous) / item.previous) * 100;
  const isUp = change >= 0;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-gray-600 w-[88px] text-right truncate shrink-0 font-medium leading-tight">
          {item.name}
        </span>
        <div className="relative flex-1 h-[18px] bg-gray-50 rounded-sm overflow-visible">
          <div
            className="absolute inset-y-0 left-0 rounded-sm transition-all duration-300"
            style={{
              width: `${currentPct}%`,
              backgroundColor: `rgba(14, 90, 138, ${colorOpacity})`,
            }}
          />
          <div
            className="absolute top-[2px] bottom-[2px] w-[3px] rounded-full bg-gray-800/50 transition-all duration-200"
            style={{ left: `calc(${previousPct}% - 1.5px)` }}
          />
        </div>
        <span className="text-[11px] text-gray-500 w-12 text-right shrink-0 tabular-nums font-medium">
          {fc(item.value, currency)}
        </span>
      </div>

      {hovered && (
        <div className="absolute z-20 left-[100px] -top-[52px] bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl pointer-events-none whitespace-nowrap">
          <p className="font-medium mb-1">{item.name}</p>
          <div className="flex items-center gap-3">
            <span className="text-cx-300 font-semibold">
              {fc(item.value, currency, { compact: false })}
            </span>
            <span className="text-gray-400">
              prev {fc(item.previous, currency, { compact: false })}
            </span>
            <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {isUp ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function BulletChart({ title, data }: { title: string; data: DataItem[] }) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.previous))) * 1.08;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-1.5 mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
        <InfoTooltip />
      </div>
      <div className="space-y-[10px]">
        {data.map((item, index) => (
          <BulletBar
            key={item.name}
            item={item}
            maxValue={maxValue}
            colorOpacity={1 - index * 0.05}
          />
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm bg-cx-500 inline-block" />
          <span className="text-[10px] text-gray-400 font-medium">Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-[3px] h-3 rounded-full bg-gray-800/50 inline-block" />
          <span className="text-[10px] text-gray-400 font-medium">Previous</span>
        </div>
      </div>
    </div>
  );
}

export default function BreakdownCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <BulletChart title="Sales by Marketplace" data={salesByMarketplace} />
      <BulletChart title="Sales by Category" data={salesByCategory} />
      <BulletChart title="Sales by ASIN" data={salesByASIN} />
    </div>
  );
}
