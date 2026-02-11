import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { salesByMarketplace, salesByCategory, salesByASIN, type ASINDataItem } from '../data/dashboardData';
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
  label,
  indent,
}: {
  item: DataItem;
  maxValue: number;
  colorOpacity: number;
  label?: string;
  indent?: boolean;
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
      <div className={`flex items-center gap-3 ${indent ? 'pl-3' : ''}`}>
        <span className={`text-[11px] text-gray-600 ${indent ? 'w-[100px]' : 'w-[88px]'} text-right truncate shrink-0 font-medium leading-tight`}>
          {label ?? item.name}
        </span>
        <div className="relative flex-1 h-[18px] bg-gray-50 rounded-sm overflow-visible">
          <div
            className="absolute inset-y-0 left-0 rounded-sm transition-all duration-300"
            style={{
              width: `${currentPct}%`,
              backgroundColor: indent
                ? `rgba(14, 90, 138, ${colorOpacity * 0.5})`
                : `rgba(14, 90, 138, ${colorOpacity})`,
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
          <p className="font-medium mb-1">{label ?? item.name}</p>
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
      <ChartLegend />
    </div>
  );
}

function ASINBulletChart({ title, data }: { title: string; data: ASINDataItem[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.previous))) * 1.08;

  const toggleExpand = (asin: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(asin)) next.delete(asin);
      else next.add(asin);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-1.5 mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
        <InfoTooltip />
      </div>
      <div className="space-y-[6px]">
        {data.map((item, index) => {
          const isExpanded = expanded.has(item.name);
          return (
            <div key={item.name}>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleExpand(item.name)}
                  className="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <ASINBulletBar item={item} maxValue={maxValue} colorOpacity={1 - index * 0.05} />
                </div>
              </div>
              {isExpanded && (
                <div className="ml-5 mt-1 space-y-[6px] pb-1">
                  {item.skus.map((sku, si) => (
                    <BulletBar
                      key={sku.name}
                      item={sku}
                      maxValue={maxValue}
                      colorOpacity={(1 - index * 0.05) * 0.7}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ChartLegend />
    </div>
  );
}

function ASINBulletBar({
  item,
  maxValue,
  colorOpacity,
}: {
  item: ASINDataItem;
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
      <div className="flex items-center gap-2">
        <div className="w-[88px] text-right shrink-0">
          <div className="text-[11px] text-gray-700 font-semibold leading-tight truncate">{item.name}</div>
          <div className="text-[9px] text-gray-400 leading-tight truncate" title={item.productName}>{item.productName}</div>
        </div>
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
          <p className="font-medium mb-0.5">{item.name}</p>
          <p className="text-gray-400 mb-1">{item.productName}</p>
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

function ChartLegend() {
  return (
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
  );
}

export default function BreakdownCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <BulletChart title="Sales by Marketplace" data={salesByMarketplace} />
      <BulletChart title="Sales by Category" data={salesByCategory} />
      <ASINBulletChart title="Sales by ASIN" data={salesByASIN} />
    </div>
  );
}
