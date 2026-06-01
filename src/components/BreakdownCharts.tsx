// ─── Sales Overview Breakdown Charts ─────────────────────────────────────
// Marketplace · Category · ASIN bullet bars with two ranking modes:
//   - Growth contribution (default — what's driving change)
//   - Sales (the absolute-volume view)
//
// Each row shows: current sales, change vs previous period, contribution %.

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { salesByMarketplace, salesByCategory, salesByASIN, type ASINDataItem } from '../data/dashboardData';
import InfoTooltip from './InfoTooltip';
import { fc } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';

type RankMode = 'growth' | 'sales';

interface DataItem {
  name: string;
  value: number;
  previous: number;
}

interface EnrichedItem extends DataItem {
  change: number;          // signed €
  changePct: number;       // signed %
  contributionPct: number; // share of total positive change (>=0)
}

function enrich<T extends DataItem>(rows: T[]): (T & EnrichedItem)[] {
  const totalPositive = rows.reduce((s, r) => s + Math.max(0, r.value - r.previous), 0) || 1;
  return rows.map((r) => {
    const change = r.value - r.previous;
    const changePct = r.previous > 0 ? (change / r.previous) * 100 : 0;
    const contributionPct = change > 0 ? (change / totalPositive) * 100 : 0;
    return { ...r, change, changePct, contributionPct };
  });
}

function sortBy<T extends EnrichedItem>(rows: T[], mode: RankMode): T[] {
  if (mode === 'growth') {
    // Largest growth contributors first; negatives at the bottom (most negative last).
    return [...rows].sort((a, b) => b.change - a.change);
  }
  return [...rows].sort((a, b) => b.value - a.value);
}

function RankToggle({ mode, onChange }: { mode: RankMode; onChange: (m: RankMode) => void }) {
  return (
    <div className="flex items-center bg-gray-100 rounded-md p-0.5">
      <button
        onClick={() => onChange('growth')}
        className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all ${
          mode === 'growth' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Growth
      </button>
      <button
        onClick={() => onChange('sales')}
        className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all ${
          mode === 'sales' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Sales
      </button>
    </div>
  );
}

function BulletBar({
  item, maxValue, colorOpacity, label, indent,
}: {
  item: EnrichedItem;
  maxValue: number;
  colorOpacity: number;
  label?: string;
  indent?: boolean;
}) {
  const { currency } = useCurrency();
  const [hovered, setHovered] = useState(false);
  const currentPct = (item.value / maxValue) * 100;
  const previousPct = (item.previous / maxValue) * 100;
  const isUp = item.change >= 0;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex items-center gap-2 ${indent ? 'pl-3' : ''}`}>
        <span className={`text-[11px] text-gray-600 ${indent ? 'w-[100px]' : 'w-[88px]'} text-right truncate shrink-0 font-medium leading-tight`}>
          {label ?? item.name}
        </span>
        <div className="relative flex-1 h-[18px] bg-gray-50 rounded-sm overflow-visible min-w-0">
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
        <span className={`text-[10px] font-semibold w-14 text-right shrink-0 tabular-nums ${isUp ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isUp ? '+' : '−'}{fc(Math.abs(item.change), currency)}
        </span>
        <span className="text-[10px] font-medium text-gray-500 w-12 text-right shrink-0 tabular-nums">
          {item.contributionPct > 0 ? `${item.contributionPct.toFixed(0)}%` : '—'}
        </span>
      </div>

      {hovered && (
        <div className="absolute z-20 left-[100px] -top-[64px] bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl pointer-events-none whitespace-nowrap">
          <p className="font-medium mb-1">{label ?? item.name}</p>
          <div className="flex items-center gap-3">
            <span className="text-cx-300 font-semibold">
              {fc(item.value, currency, { compact: false })}
            </span>
            <span className="text-gray-400">
              prev {fc(item.previous, currency, { compact: false })}
            </span>
            <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {isUp ? '+' : ''}{item.changePct.toFixed(1)}%
            </span>
          </div>
          {item.contributionPct > 0 && (
            <p className="text-[10px] text-gray-400 mt-1">{item.contributionPct.toFixed(1)}% of total growth</p>
          )}
        </div>
      )}
    </div>
  );
}

function HeaderLabels({ mode }: { mode: RankMode }) {
  return (
    <div className="flex items-center gap-2 mb-2 pl-1">
      <span className="w-[88px]" />
      <span className="flex-1" />
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 w-12 text-right shrink-0">Sales</span>
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 w-14 text-right shrink-0">Δ €</span>
      <span className={`text-[9px] font-bold uppercase tracking-wider w-12 text-right shrink-0 ${mode === 'growth' ? 'text-cx-600' : 'text-gray-400'}`}>
        % Growth
      </span>
    </div>
  );
}

function BulletChart({
  title, data, tooltip, mode, onModeChange,
}: {
  title: string;
  data: DataItem[];
  tooltip?: string;
  mode: RankMode;
  onModeChange: (m: RankMode) => void;
}) {
  const enriched = useMemo(() => sortBy(enrich(data), mode), [data, mode]);
  const maxValue = Math.max(...enriched.map((d) => Math.max(d.value, d.previous))) * 1.08;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</h2>
          <InfoTooltip content={tooltip} />
        </div>
        <RankToggle mode={mode} onChange={onModeChange} />
      </div>
      <HeaderLabels mode={mode} />
      <div className="space-y-[10px]">
        {enriched.map((item, index) => (
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

function ASINBulletChart({
  title, data, tooltip, mode, onModeChange,
}: {
  title: string;
  data: ASINDataItem[];
  tooltip?: string;
  mode: RankMode;
  onModeChange: (m: RankMode) => void;
}) {
  const enriched = useMemo(() => sortBy(enrich(data), mode), [data, mode]);
  const maxValue = Math.max(...enriched.map((d) => Math.max(d.value, d.previous))) * 1.08;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</h2>
          <InfoTooltip content={tooltip} />
        </div>
        <RankToggle mode={mode} onChange={onModeChange} />
      </div>
      <HeaderLabels mode={mode} />
      <div className="space-y-[6px]">
        {enriched.map((item, index) => {
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
                  {item.skus.map((sku) => {
                    const enrichedSku = enrich([sku])[0];
                    return (
                      <BulletBar
                        key={sku.name}
                        item={enrichedSku}
                        maxValue={maxValue}
                        colorOpacity={(1 - index * 0.05) * 0.7}
                        indent
                      />
                    );
                  })}
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
  item, maxValue, colorOpacity,
}: {
  item: ASINDataItem & EnrichedItem;
  maxValue: number;
  colorOpacity: number;
}) {
  const { currency } = useCurrency();
  const [hovered, setHovered] = useState(false);
  const currentPct = (item.value / maxValue) * 100;
  const previousPct = (item.previous / maxValue) * 100;
  const isUp = item.change >= 0;

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
        <div className="relative flex-1 h-[18px] bg-gray-50 rounded-sm overflow-visible min-w-0">
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
        <span className={`text-[10px] font-semibold w-14 text-right shrink-0 tabular-nums ${isUp ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isUp ? '+' : '−'}{fc(Math.abs(item.change), currency)}
        </span>
        <span className="text-[10px] font-medium text-gray-500 w-12 text-right shrink-0 tabular-nums">
          {item.contributionPct > 0 ? `${item.contributionPct.toFixed(0)}%` : '—'}
        </span>
      </div>

      {hovered && (
        <div className="absolute z-20 left-[100px] -top-[64px] bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl pointer-events-none whitespace-nowrap">
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
              {isUp ? '+' : ''}{item.changePct.toFixed(1)}%
            </span>
          </div>
          {item.contributionPct > 0 && (
            <p className="text-[10px] text-gray-400 mt-1">{item.contributionPct.toFixed(1)}% of total growth</p>
          )}
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
  // Rank mode applies to all three cards in sync — same question, three lenses.
  // Default is 'growth' so the eye lands on what's driving change, not what's biggest.
  const [mode, setMode] = useState<RankMode>('growth');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <BulletChart
        title="Sales by Marketplace"
        data={salesByMarketplace}
        tooltip="Revenue split by Amazon marketplace. Rank toggle: Growth shows top contributors to change; Sales shows largest absolute volume."
        mode={mode}
        onModeChange={setMode}
      />
      <BulletChart
        title="Sales by Category"
        data={salesByCategory}
        tooltip="Revenue split by product category. Rank toggle: Growth shows top contributors to change; Sales shows largest absolute volume."
        mode={mode}
        onModeChange={setMode}
      />
      <ASINBulletChart
        title="Sales by ASIN"
        data={salesByASIN}
        tooltip="Revenue per ASIN, expandable to show individual SKUs. Rank toggle: Growth shows top contributors to change; Sales shows largest absolute volume."
        mode={mode}
        onModeChange={setMode}
      />
    </div>
  );
}
