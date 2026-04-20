import { useMemo, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';
import { inventoryHistory } from '../../data/inventoryData';
import type { DailySnapshot } from '../../data/inventoryData';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import InfoTooltip from '../InfoTooltip';

type Metric = 'unitsOnHand' | 'inventoryValue' | 'daysOfSupply' | 'sellThroughRate';
type Granularity = 'day' | 'week' | 'month';

const METRICS: { key: Metric; label: string; tip: string }[] = [
  { key: 'unitsOnHand', label: 'Units on Hand', tip: 'Total units in FBA stock at end of period.' },
  { key: 'inventoryValue', label: 'Inventory Value', tip: 'Units on hand × unit cost. Total capital tied up in this SKU.' },
  { key: 'daysOfSupply', label: 'Days of Supply', tip: 'How many days current stock will last at the current sell-through rate.' },
  { key: 'sellThroughRate', label: 'Sell-Through Rate', tip: 'Units sold ÷ (units sold + ending inventory) for the period. Higher = faster-moving stock.' },
];

const GRANULARITIES: { key: Granularity; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

interface BucketedSnapshot {
  label: string;
  value: number;
}

function bucketSnapshots(
  snapshots: DailySnapshot[],
  metric: Metric,
  granularity: Granularity
): BucketedSnapshot[] {
  if (granularity === 'day') {
    return snapshots.map((s) => ({
      label: s.date.slice(5), // MM-DD
      value: s[metric],
    }));
  }

  const groups = new Map<string, DailySnapshot[]>();

  for (const s of snapshots) {
    let key: string;
    if (granularity === 'month') {
      key = s.date.slice(0, 7); // YYYY-MM
    } else {
      // ISO week: use Monday of the week
      const d = new Date(s.date);
      const day = d.getDay();
      const monday = new Date(d.getTime() - ((day === 0 ? 6 : day - 1)) * 86400000);
      key = monday.toISOString().slice(0, 10);
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return Array.from(groups.entries()).map(([key, snaps]) => {
    let value: number;
    if (metric === 'sellThroughRate') {
      value = Math.round(snaps.reduce((s, d) => s + d[metric], 0) / snaps.length * 10) / 10;
    } else if (metric === 'daysOfSupply') {
      // Use last snapshot in period
      value = snaps[snaps.length - 1][metric];
    } else {
      // Units on hand / inventory value: use last snapshot (end of period)
      value = snaps[snaps.length - 1][metric];
    }

    const label = granularity === 'month'
      ? new Date(key + '-01').toLocaleDateString('en-US', { month: 'short' })
      : key.slice(5); // MM-DD for week start

    return { label, value };
  });
}

function heatColor(value: number, min: number, max: number): string {
  if (max === min) return 'bg-blue-50/50 text-blue-900';
  const ratio = (value - min) / (max - min);
  if (ratio < 0.2) return 'bg-blue-50/30 text-blue-800';
  if (ratio < 0.4) return 'bg-blue-50 text-blue-800';
  if (ratio < 0.6) return 'bg-blue-100 text-blue-900';
  if (ratio < 0.8) return 'bg-blue-200 text-blue-900';
  return 'bg-blue-300 text-blue-950';
}

function formatCellValue(value: number, metric: Metric, currencyCode: string): string {
  if (metric === 'inventoryValue') return fc(value, currencyCode as 'EUR' | 'USD' | 'GBP', { compact: true });
  if (metric === 'sellThroughRate') return `${value.toFixed(1)}%`;
  if (metric === 'daysOfSupply') return `${value}d`;
  return value.toLocaleString();
}

export default function InventoryHistoryTable() {
  const { currency } = useCurrency();
  const [metric, setMetric] = useState<Metric>('unitsOnHand');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredHistory = useMemo(() => {
    if (!search.trim()) return inventoryHistory;
    const q = search.toLowerCase();
    return inventoryHistory.filter(
      (h) => h.sku.toLowerCase().includes(q) || h.title.toLowerCase().includes(q)
    );
  }, [search]);

  // Bucket all SKU data
  const bucketed = useMemo(() =>
    filteredHistory.map((h) => ({
      sku: h.sku,
      title: h.title,
      data: bucketSnapshots(h.snapshots, metric, granularity),
    })),
    [filteredHistory, metric, granularity]
  );

  // Column headers from first SKU (all share same dates)
  const columns = bucketed.length > 0 ? bucketed[0].data.map((d) => d.label) : [];

  // Min/max for heatmap across all visible values
  const allValues = bucketed.flatMap((b) => b.data.map((d) => d.value));
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const activeMetricMeta = METRICS.find((m) => m.key === metric)!;

  const exportCsv = useCallback(() => {
    const header = ['SKU', 'Product Title', ...columns].map((h) => `"${h}"`).join(',');
    const rows = bucketed.map((row) => {
      return [
        row.sku,
        `"${row.title.replace(/"/g, '""')}"`,
        ...row.data.map((cell) => cell.value),
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `clarisix-historical-inventory-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bucketed, columns]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Historical Inventory</h3>
          <InfoTooltip content={`${activeMetricMeta.label} per SKU over the last 90 days. ${activeMetricMeta.tip}`} />
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter SKUs..."
              className="pl-6 pr-2 py-1 text-[11px] w-32 border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
            />
          </div>

          {/* Metric switcher */}
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                  metric === m.key
                    ? 'bg-cx-500 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Granularity toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
            {GRANULARITIES.map((g) => (
              <button
                key={g.key}
                onClick={() => setGranularity(g.key)}
                className={`px-2 py-1 text-[10px] font-semibold transition-colors ${
                  granularity === g.key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md transition-colors"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>

          {/* Scroll controls */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => scroll('left')} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => scroll('right')} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex">
        {/* Frozen SKU column */}
        <div className="flex-shrink-0 border-r border-gray-200 z-10 bg-white">
          <table className="text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 w-[180px]">SKU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bucketed.map((row) => (
                <tr key={row.sku} className="hover:bg-gray-50/50">
                  <td className="px-3 py-1.5 w-[180px]">
                    <span className="text-[10px] font-mono font-semibold text-gray-700 block">{row.sku}</span>
                    <span className="text-[9px] text-gray-400 block truncate max-w-[160px]">{row.title}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scrollable data columns */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto">
          <table className="text-right w-max">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((col) => (
                  <th key={col} className="px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 min-w-[56px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bucketed.map((row) => (
                <tr key={row.sku} className="hover:bg-gray-50/50">
                  {row.data.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-2 py-1.5 text-[10px] font-medium min-w-[56px] ${heatColor(cell.value, minVal, maxVal)}`}
                    >
                      {formatCellValue(cell.value, metric, currency)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100">
        <span className="text-[10px] text-gray-400">
          {filteredHistory.length} SKUs · {columns.length} {granularity === 'day' ? 'days' : granularity === 'week' ? 'weeks' : 'months'}
        </span>
        <span className="text-[10px] text-gray-400">
          Scroll or use arrows to navigate dates →
        </span>
      </div>
    </div>
  );
}
