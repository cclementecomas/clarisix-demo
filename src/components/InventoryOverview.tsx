import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  Search, ChevronDown, ChevronRight, AlertTriangle, Package, ArrowUpDown,
  Settings, Plus, X, Calendar,
} from 'lucide-react';
import {
  inventoryData,
  controlTowerKPIs,
  actionQueueItems,
} from '../data/inventoryData';
import type { InventorySKU, ControlTowerKPI, FulfillmentType } from '../data/inventoryData';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import LastRefreshed from './LastRefreshed';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PromotionalEvent {
  id: string;
  name: string;
  date: string;
  multiplier: number;
}

interface ComputedMetrics {
  medianPerWeek: number;
  availableUnits: number;
  weeksOnHand: number;
  riskLevel: 'critical' | 'warning' | 'healthy';
  adjustedWeeklySales: number;
  idealInventory: number;
  reorderQty: number;
  forecastWeeks: ForecastWeek[];
}

interface ForecastWeek {
  label: string;
  units: number;
  isPromo: boolean;
  promoName?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  'In Stock': 'bg-green-100 text-green-700',
  'Low Stock': 'bg-yellow-100 text-yellow-700',
  'Critical': 'bg-orange-100 text-orange-700',
  'Out of Stock': 'bg-red-100 text-red-700',
  'Overstock': 'bg-blue-100 text-blue-700',
};

const KPI_COLORS: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  neutral: { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-900', ring: 'ring-gray-300' },
  green: { bg: 'bg-green-50', border: 'border-green-200/60', text: 'text-green-900', ring: 'ring-green-400' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200/60', text: 'text-yellow-900', ring: 'ring-yellow-400' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200/60', text: 'text-orange-900', ring: 'ring-orange-400' },
  red: { bg: 'bg-red-50', border: 'border-red-200/60', text: 'text-red-900', ring: 'ring-red-400' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200/60', text: 'text-blue-900', ring: 'ring-blue-400' },
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
};

const ROW_TINT: Record<string, string> = {
  'Out of Stock': 'bg-red-50/40',
  'Critical': 'bg-red-50/30',
  'Low Stock': 'bg-yellow-50/30',
};

const RISK_BADGE: Record<string, string> = {
  critical: 'text-red-600',
  warning: 'text-yellow-600',
  healthy: 'text-green-600',
};

type SortKey = 'sku' | 'title' | 'status' | 'availableUnits' | 'medianPerWeek' | 'weeksOnHand' | 'idealInventory' | 'reorderQty' | 'revenueAtRisk';

const DEFAULT_EVENTS: PromotionalEvent[] = [
  { id: '1', name: 'Prime Day', date: '2026-03-25', multiplier: 2.5 },
  { id: '2', name: 'Summer Sale', date: '2026-04-22', multiplier: 1.8 },
];

// ─── Calculation helpers ────────────────────────────────────────────────────

function computeMedian(values: number[]): number {
  const sorted = values.filter((v) => v >= 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeSkuMetrics(
  sku: InventorySKU,
  idealWeeksCoverage: number,
  safetyStockBuffer: number,
  promotionalEvents: PromotionalEvent[],
): ComputedMetrics {
  const medianPerWeek = sku.weeklyVelocity.length > 0
    ? computeMedian(sku.weeklyVelocity)
    : Math.round(sku.avgDailySales * 7);

  // Available = available + inbound (exclude reserved)
  const availableUnits = sku.available + sku.inbound;

  // Weeks on hand
  const weeksOnHand = medianPerWeek > 0
    ? Math.round((availableUnits / medianPerWeek) * 10) / 10
    : availableUnits > 0 ? 999 : 0;

  const riskLevel: ComputedMetrics['riskLevel'] =
    weeksOnHand < 2 ? 'critical' : weeksOnHand < 4 ? 'warning' : 'healthy';

  // Promotional impact: compute week-by-week forecast
  const now = new Date();
  const forecastWeeks: ForecastWeek[] = [];
  let totalForecast = 0;

  for (let w = 0; w < idealWeeksCoverage; w++) {
    const weekStart = new Date(now.getTime() + w * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    const promoEvent = promotionalEvents.find((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    const multiplier = promoEvent ? promoEvent.multiplier : 1;
    const adjusted = medianPerWeek * multiplier * (1 + safetyStockBuffer / 100);
    totalForecast += adjusted;

    forecastWeeks.push({
      label: `W${w + 1}`,
      units: Math.round(adjusted),
      isPromo: !!promoEvent,
      promoName: promoEvent?.name,
    });
  }

  const adjustedWeeklySales = idealWeeksCoverage > 0
    ? totalForecast / idealWeeksCoverage
    : medianPerWeek;

  const idealInventory = Math.round(adjustedWeeklySales * idealWeeksCoverage);
  const reorderQty = Math.max(0, idealInventory - availableUnits);

  return {
    medianPerWeek: Math.round(medianPerWeek),
    availableUnits,
    weeksOnHand,
    riskLevel,
    adjustedWeeklySales: Math.round(adjustedWeeklySales),
    idealInventory,
    reorderQty,
    forecastWeeks,
  };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function InventoryOverview() {
  const { currency } = useCurrency();

  // Settings
  const [idealWeeksCoverage, setIdealWeeksCoverage] = useState(10);
  const [safetyStockBuffer, setSafetyStockBuffer] = useState(0);
  const [promotionalEvents, setPromotionalEvents] = useState<PromotionalEvent[]>(DEFAULT_EVENTS);
  const [showSettings, setShowSettings] = useState(false);

  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'All' | FulfillmentType>('All');
  const [sortKey, setSortKey] = useState<SortKey>('reorderQty');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedSkus, setExpandedSkus] = useState<Set<string>>(new Set());
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleExpand = (sku: string) => {
    setExpandedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  // Compute metrics for all SKUs
  const metricsMap = useMemo(() => {
    const map = new Map<string, ComputedMetrics>();
    for (const sku of inventoryData) {
      map.set(sku.sku, computeSkuMetrics(sku, idealWeeksCoverage, safetyStockBuffer, promotionalEvents));
    }
    return map;
  }, [idealWeeksCoverage, safetyStockBuffer, promotionalEvents]);

  const filteredData = useMemo(() => {
    let data = inventoryData;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((d) =>
        d.sku.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.asin.toLowerCase().includes(q)
      );
    }

    if (fulfillmentFilter !== 'All') {
      data = data.filter((d) => d.fulfillmentType === fulfillmentFilter);
    }

    if (activeKpiFilter) {
      switch (activeKpiFilter) {
        case 'revAtRisk': data = data.filter((d) => d.revenueAtRisk > 0); break;
        case 'stranded': data = data.filter((d) => d.isStranded); break;
        case 'unfulfillable': data = data.filter((d) => d.isUnfulfillable); break;
        case 'overstockValue': data = data.filter((d) => d.status === 'Overstock'); break;
        case 'avgDOC': data = data.filter((d) => d.daysOfSupply < 30 && d.daysOfSupply < 900); break;
      }
    }

    data = [...data].sort((a, b) => {
      const ma = metricsMap.get(a.sku)!;
      const mb = metricsMap.get(b.sku)!;
      let av: number | string = 0, bv: number | string = 0;
      switch (sortKey) {
        case 'sku': av = a.sku; bv = b.sku; break;
        case 'title': av = a.title; bv = b.title; break;
        case 'status': {
          const order = { 'Out of Stock': 0, 'Critical': 1, 'Low Stock': 2, 'In Stock': 3, 'Overstock': 4 };
          av = order[a.status]; bv = order[b.status]; break;
        }
        case 'availableUnits': av = ma.availableUnits; bv = mb.availableUnits; break;
        case 'medianPerWeek': av = ma.medianPerWeek; bv = mb.medianPerWeek; break;
        case 'weeksOnHand': av = ma.weeksOnHand; bv = mb.weeksOnHand; break;
        case 'idealInventory': av = ma.idealInventory; bv = mb.idealInventory; break;
        case 'reorderQty': av = ma.reorderQty; bv = mb.reorderQty; break;
        case 'revenueAtRisk': av = a.revenueAtRisk; bv = b.revenueAtRisk; break;
      }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return data;
  }, [searchQuery, fulfillmentFilter, activeKpiFilter, sortKey, sortDir, metricsMap]);

  const addEvent = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    setPromotionalEvents((prev) => [...prev, {
      id: String(Date.now()),
      name: '',
      date: d.toISOString().slice(0, 10),
      multiplier: 2.0,
    }]);
  }, []);

  const removeEvent = useCallback((id: string) => {
    setPromotionalEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateEvent = useCallback((id: string, field: keyof PromotionalEvent, value: string | number) => {
    setPromotionalEvents((prev) => prev.map((e) =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  }, []);

  return (
    <div className="space-y-5">
      {/* ─── Controls Bar ─── */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur -mx-6 px-6 py-3 border-b border-gray-200/60">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU, ASIN, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-cx-500/20 focus:border-cx-400"
            />
          </div>

          <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
            {(['All', 'FBA', 'FBM'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFulfillmentFilter(f)}
                className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  fulfillmentFilter === f
                    ? 'bg-cx-500 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
              showSettings
                ? 'bg-cx-500 text-white border-cx-500'
                : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Forecast Settings
          </button>

          <div className="ml-auto">
            <LastRefreshed offsetMinutes={6} />
          </div>
        </div>
      </div>

      {/* ─── Settings Panel ─── */}
      {showSettings && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Forecast & Reorder Settings</h3>
          <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6">
            {/* Left: numeric inputs */}
            <div className="flex items-start gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Ideal Weeks of Coverage
                </label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={idealWeeksCoverage}
                  onChange={(e) => setIdealWeeksCoverage(Math.max(1, Math.min(52, Number(e.target.value) || 1)))}
                  className="w-20 px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cx-500/20 focus:border-cx-400 text-center"
                />
                <p className="text-[10px] text-gray-400 mt-1">Target stock coverage period</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Safety Stock Buffer
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={safetyStockBuffer}
                    onChange={(e) => setSafetyStockBuffer(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-16 px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cx-500/20 focus:border-cx-400 text-center"
                  />
                  <span className="text-sm font-semibold text-gray-400">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Extra buffer for high-velocity SKUs</p>
              </div>
            </div>

            {/* Right: promotional events */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Promotional Events
                </label>
                <button
                  onClick={addEvent}
                  className="flex items-center gap-1 text-[10px] font-semibold text-cx-500 hover:text-cx-600 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Event
                </button>
              </div>
              {promotionalEvents.length === 0 && (
                <p className="text-[11px] text-gray-400 italic">No promotional events configured</p>
              )}
              <div className="space-y-1.5">
                {promotionalEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-100 bg-gray-50/50">
                    <input
                      type="text"
                      placeholder="Event name"
                      value={event.name}
                      onChange={(e) => updateEvent(event.id, 'name', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-cx-500/20"
                    />
                    <input
                      type="date"
                      value={event.date}
                      onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                      className="px-2 py-1 text-[11px] rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-cx-500/20"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">×</span>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="10"
                        value={event.multiplier}
                        onChange={(e) => updateEvent(event.id, 'multiplier', Math.max(1, Number(e.target.value) || 1))}
                        className="w-14 px-2 py-1 text-[11px] font-semibold rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-cx-500/20 text-center"
                      />
                    </div>
                    <button
                      onClick={() => removeEvent(event.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Multiplier boosts median weekly sales during event week (e.g. ×2.5 = 150% increase)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI Row ─── */}
      <KPIRow kpis={controlTowerKPIs} currency={currency} activeFilter={activeKpiFilter} onFilter={setActiveKpiFilter} />

      {/* ─── Action Queue ─── */}
      <ActionQueue />

      {/* ─── Risk Table ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h3 className="text-sm font-semibold text-gray-900">Inventory Risk Table</h3>
          <span className="text-[11px] text-gray-400 font-medium">
            {filteredData.length} of {inventoryData.length} SKUs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-gray-100">
                <th className="w-8 px-2" />
                <SortableHeader label="SKU" sortKey="sku" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Product" sortKey="title" currentKey={sortKey} dir={sortDir} onSort={handleSort} className="min-w-[160px]" />
                <SortableHeader label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Avail (A+I)" sortKey="availableUnits" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Median/wk" sortKey="medianPerWeek" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Wks on Hand" sortKey="weeksOnHand" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Ideal Inv." sortKey="idealInventory" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Reorder" sortKey="reorderQty" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Rev. at Risk" sortKey="revenueAtRisk" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((sku) => (
                <RiskTableRow
                  key={sku.sku}
                  sku={sku}
                  metrics={metricsMap.get(sku.sku)!}
                  currency={currency}
                  expanded={expandedSkus.has(sku.sku)}
                  onToggle={() => toggleExpand(sku.sku)}
                />
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-sm text-gray-400">
                    No SKUs match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={6} />
      </div>
    </div>
  );
}

// ─── KPI Row ────────────────────────────────────────────────────────────────

function KPIRow({
  kpis, currency, activeFilter, onFilter,
}: {
  kpis: ControlTowerKPI[];
  currency: import('../contexts/CurrencyContext').Currency;
  activeFilter: string | null;
  onFilter: (key: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const colors = KPI_COLORS[kpi.color] || KPI_COLORS.neutral;
        const isActive = activeFilter === kpi.key;
        let display: string;
        if (kpi.format === 'currency') display = fc(kpi.value, currency);
        else if (kpi.format === 'days') display = `${kpi.value}d`;
        else display = kpi.value.toLocaleString();

        return (
          <button
            key={kpi.key}
            onClick={() => onFilter(isActive ? null : kpi.key)}
            className={`rounded-xl border shadow-sm p-4 flex flex-col items-center transition-all cursor-pointer ${colors.bg} ${colors.border} ${
              isActive ? `ring-2 ${colors.ring}` : 'hover:shadow-md'
            }`}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1 text-gray-500">
              {kpi.label}
            </p>
            <span className={`text-lg font-extrabold ${colors.text}`}>{display}</span>
            {kpi.subtitle && (
              <span className="text-[10px] text-gray-400 mt-0.5">{kpi.subtitle}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Action Queue ───────────────────────────────────────────────────────────

function ActionQueue() {
  const topItems = actionQueueItems.slice(0, 8);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900">Today's Action Queue</h3>
          <span className="text-[10px] text-gray-400 font-medium">
            {actionQueueItems.length} items
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        {topItems.map((item, i) => (
          <div
            key={`${item.sku}-${item.type}-${i}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group"
          >
            <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${PRIORITY_BADGE[item.priority]}`}>
              {item.priority}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-semibold text-gray-700">{item.sku}</span>
                <span className="text-[10px] text-gray-400 truncate">{item.title}</span>
              </div>
              <p className="text-[11px] text-gray-600 truncate">{item.message}</p>
            </div>
            {item.deadline && (
              <span className="shrink-0 text-[10px] font-semibold text-red-500">{item.deadline}</span>
            )}
            <button className="shrink-0 opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-cx-500 hover:text-cx-600 transition-all whitespace-nowrap">
              Create PO
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sortable Header ────────────────────────────────────────────────────────

function SortableHeader({
  label, sortKey: key, currentKey, dir, onSort, className = '',
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = key === currentKey;
  return (
    <th
      className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition-colors ${className}`}
      onClick={() => onSort(key)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          <ArrowUpDown className="w-3 h-3 text-cx-500" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-300" />
        )}
        {isActive && (
          <span className="text-[8px] text-cx-500">{dir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );
}

// ─── Risk Table Row ─────────────────────────────────────────────────────────

function RiskTableRow({
  sku, metrics, currency, expanded, onToggle,
}: {
  sku: InventorySKU;
  metrics: ComputedMetrics;
  currency: import('../contexts/CurrencyContext').Currency;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tint = ROW_TINT[sku.status] || '';
  const flags: string[] = [];
  if (sku.isStranded) flags.push('Stranded');
  if (sku.isUnfulfillable) flags.push('Unfulfillable');
  if (sku.ageBucket === '365+') flags.push('Aging 365+');

  const wohDisplay = metrics.weeksOnHand >= 999 ? '∞' : `${metrics.weeksOnHand}`;

  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors ${tint}`}
        onClick={onToggle}
      >
        <td className="px-2 py-2.5 text-gray-400">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </td>

        <td className="px-3 py-2.5">
          <div className="text-xs font-semibold text-gray-800 font-mono">{sku.sku}</div>
          <div className="text-[10px] text-gray-400">{sku.asin}</div>
        </td>

        <td className="px-3 py-2.5 text-xs text-gray-700 max-w-[180px] truncate">
          {sku.title}
          <span className="block text-[10px] text-gray-400">{sku.fulfillmentType} · {sku.marketplace}</span>
        </td>

        <td className="px-3 py-2.5">
          <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[sku.status]}`}>
            {sku.status}
          </span>
        </td>

        {/* Available Units = A + I */}
        <td className="px-3 py-2.5 text-xs text-gray-700">
          <span className="font-semibold">{metrics.availableUnits.toLocaleString()}</span>
          <span className="block text-[10px] text-gray-400">
            A:{sku.available.toLocaleString()} + I:{sku.inbound.toLocaleString()}
          </span>
        </td>

        {/* Median/wk */}
        <td className="px-3 py-2.5 text-xs text-gray-700">
          <span className="font-semibold">{metrics.medianPerWeek.toLocaleString()}</span>
        </td>

        {/* Weeks on Hand */}
        <td className="px-3 py-2.5 text-xs">
          <span className={`font-bold ${RISK_BADGE[metrics.riskLevel]}`}>
            {wohDisplay}
          </span>
          {metrics.riskLevel !== 'healthy' && (
            <span className={`block text-[9px] font-semibold ${metrics.riskLevel === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}>
              {metrics.riskLevel === 'critical' ? 'CRITICAL' : 'WARNING'}
            </span>
          )}
        </td>

        {/* Ideal Inventory */}
        <td className="px-3 py-2.5 text-xs text-gray-700">
          <span className="font-semibold">{metrics.idealInventory.toLocaleString()}</span>
        </td>

        {/* Reorder Qty */}
        <td className="px-3 py-2.5 text-xs">
          {metrics.reorderQty > 0 ? (
            <span className="font-bold text-cx-500">{metrics.reorderQty.toLocaleString()}</span>
          ) : (
            <span className="text-green-500 font-semibold">OK</span>
          )}
        </td>

        {/* Revenue at Risk */}
        <td className="px-3 py-2.5 text-xs">
          {sku.revenueAtRisk > 0 ? (
            <span className="font-semibold text-red-600">{fc(sku.revenueAtRisk, currency)}</span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </td>

        {/* Flags */}
        <td className="px-3 py-2.5">
          {flags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {flags.map((f) => (
                <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                  {f}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>
      </tr>

      {/* ─── Expanded Detail ─── */}
      {expanded && (
        <tr className="bg-gray-50/50">
          <td colSpan={11} className="px-6 py-4">
            {/* Timeline Chart */}
            <TimelineChart
              weeklyVelocity={sku.weeklyVelocity}
              forecastWeeks={metrics.forecastWeeks}
              medianPerWeek={metrics.medianPerWeek}
            />

            {/* Metrics summary */}
            <div className="grid grid-cols-5 gap-3 mt-4 mb-4">
              {[
                { label: 'Median/wk', value: metrics.medianPerWeek.toLocaleString(), sub: 'units' },
                { label: 'Available Units', value: metrics.availableUnits.toLocaleString(), sub: `A:${sku.available.toLocaleString()} + I:${sku.inbound.toLocaleString()}` },
                { label: 'Weeks on Hand', value: wohDisplay, sub: metrics.riskLevel },
                { label: 'Ideal Inventory', value: metrics.idealInventory.toLocaleString(), sub: `Adj. ${metrics.adjustedWeeklySales.toLocaleString()}/wk` },
                { label: 'Reorder Qty', value: metrics.reorderQty.toLocaleString(), sub: metrics.reorderQty > 0 ? 'units to order' : 'well stocked' },
              ].map((m) => (
                <div key={m.label} className="px-3 py-2 rounded-lg border border-gray-100 bg-white text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{m.label}</p>
                  <p className="text-sm font-bold text-gray-800">{m.value}</p>
                  <p className="text-[10px] text-gray-400">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Warehouse Breakdown */}
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-600">Warehouse Breakdown</span>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {sku.warehouses.map((wh) => (
                <div key={wh.warehouse} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-white">
                  <span className="text-[11px] font-semibold text-gray-700">{wh.warehouse}</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-gray-500">Stock <span className="font-semibold text-gray-700">{wh.currentStock.toLocaleString()}</span></span>
                    <span className="text-gray-500">Avail <span className="font-semibold text-gray-700">{wh.available.toLocaleString()}</span></span>
                    <span className="text-gray-500">Resv <span className="font-semibold text-gray-700">{wh.reserved.toLocaleString()}</span></span>
                    {wh.inbound > 0 && (
                      <span className="text-green-600 font-semibold">+{wh.inbound.toLocaleString()} inbound</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Timeline Chart ─────────────────────────────────────────────────────────

function TimelineChart({
  weeklyVelocity, forecastWeeks, medianPerWeek,
}: {
  weeklyVelocity: number[];
  forecastWeeks: ForecastWeek[];
  medianPerWeek: number;
}) {
  const chartData = [
    ...weeklyVelocity.map((v, i) => ({
      label: `W-${12 - i}`,
      units: v,
      type: 'actual' as const,
    })),
    ...forecastWeeks.map((fw) => ({
      label: fw.label,
      units: fw.units,
      type: fw.isPromo ? 'promo' as const : 'forecast' as const,
      promoName: fw.promoName,
    })),
  ];

  const barColors = { actual: '#0E5A8A', forecast: '#93C5FD', promo: '#E84818' };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[11px] font-semibold text-gray-700">
          Sales Timeline — Last 12 Weeks + {forecastWeeks.length}-Week Forecast
        </h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: barColors.actual }} />
            <span className="text-[10px] text-gray-500">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: barColors.forecast }} />
            <span className="text-[10px] text-gray-500">Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: barColors.promo }} />
            <span className="text-[10px] text-gray-500">Promo Week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-px border-t-2 border-dashed border-gray-400" />
            <span className="text-[10px] text-gray-500">Median</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-3">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} width={40} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-lg">
                    <p className="font-semibold">{label}</p>
                    <p>{Number(payload[0].value).toLocaleString()} units</p>
                    {d.type === 'promo' && <p className="text-orange-300">{d.promoName}</p>}
                    {d.type !== 'actual' && <p className="text-blue-300">Forecast</p>}
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={medianPerWeek}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Bar dataKey="units" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={barColors[entry.type]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
