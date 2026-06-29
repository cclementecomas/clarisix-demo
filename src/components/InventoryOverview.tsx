import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  Search, ChevronDown, ChevronRight, AlertTriangle, Package, ArrowUpDown,
  Settings, Plus, X, Calendar, Download, ListChecks, Table2,
} from 'lucide-react';
import {
  inventoryData,
  controlTowerKPIs,
  ipiData,
} from '../data/inventoryData';
import type { InventorySKU, ControlTowerKPI, FulfillmentType } from '../data/inventoryData';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import InfoTooltip from './InfoTooltip';
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
  // Lead-time-aware fields
  safetyStock: number;
  reorderPoint: number;
  demandDuringLeadTime: number;
  daysUntilStockout: number;
  daysUntilReorder: number;
  leadTimeDays: number;
  needsReorderNow: boolean;
  // Demand variability (migrated from Replenishment page)
  demandStdDevDaily: number;
  demandCV: number;
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

type SortKey = 'sku' | 'title' | 'status' | 'availableUnits' | 'medianPerWeek' | 'demandCV' | 'weeksOnHand' | 'idealInventory' | 'reorderQty' | 'revenueAtRisk' | 'safetyStock' | 'daysUntilReorder';

type ServiceLevel = '90' | '95' | '97.5' | '99';

const SERVICE_LEVEL_Z: Record<ServiceLevel, number> = {
  '90': 1.282,
  '95': 1.645,
  '97.5': 1.96,
  '99': 2.326,
};

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
  serviceLevel: ServiceLevel,
  promotionalEvents: PromotionalEvent[],
  leadTimeDays: number,
  leadTimeVarianceDays: number,
): ComputedMetrics {
  const medianPerWeek = sku.weeklyVelocity.length > 0
    ? computeMedian(sku.weeklyVelocity)
    : Math.round(sku.avgDailySales * 7);

  const avgDailyFromMedian = medianPerWeek / 7;

  // Available = available + inbound (exclude reserved)
  const availableUnits = sku.available + sku.inbound;

  // Weeks on hand
  const weeksOnHand = medianPerWeek > 0
    ? Math.round((availableUnits / medianPerWeek) * 10) / 10
    : availableUnits > 0 ? 999 : 0;

  const riskLevel: ComputedMetrics['riskLevel'] =
    weeksOnHand < 2 ? 'critical' : weeksOnHand < 4 ? 'warning' : 'healthy';

  // ── Safety stock from variability (King formula) ──
  // SS = Z × √(LT × σ²_demand_daily + avgDemand² × σ²_LT)
  const Z = SERVICE_LEVEL_Z[serviceLevel];
  const demandStdDev = sku.demandStdDevDaily || (avgDailyFromMedian * 0.3);
  const safetyStock = Math.round(
    Z * Math.sqrt(
      leadTimeDays * (demandStdDev ** 2) +
      (avgDailyFromMedian ** 2) * (leadTimeVarianceDays ** 2)
    )
  );

  // ── Reorder point = demand during lead time + safety stock ──
  const demandDuringLeadTime = Math.round(avgDailyFromMedian * leadTimeDays);
  const reorderPoint = demandDuringLeadTime + safetyStock;

  // ── Days until stockout and reorder trigger ──
  const daysUntilStockout = avgDailyFromMedian > 0
    ? Math.round(availableUnits / avgDailyFromMedian)
    : availableUnits > 0 ? 999 : 0;

  // Must reorder when available stock will hit reorder point
  // i.e., when days of supply left = lead time + safety stock days
  const daysOfSafetyStock = avgDailyFromMedian > 0 ? safetyStock / avgDailyFromMedian : 0;
  const daysUntilReorder = Math.max(
    0,
    Math.round(daysUntilStockout - leadTimeDays - daysOfSafetyStock)
  );
  const needsReorderNow = availableUnits <= reorderPoint;

  // ── Promotional impact: compute week-by-week forecast ──
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
    const adjusted = medianPerWeek * multiplier;
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

  // ── Ideal inventory & reorder qty ──
  // Ideal = coverage demand + safety stock (how much you WANT on hand)
  // ROP (reorder point) tells you WHEN to order — that's where DDLT lives
  const coverageDemand = Math.round(adjustedWeeklySales * idealWeeksCoverage);
  const idealInventory = coverageDemand + safetyStock;
  const reorderQty = Math.max(0, idealInventory - availableUnits);

  const demandCV = avgDailyFromMedian > 0 ? demandStdDev / avgDailyFromMedian : 0;

  return {
    medianPerWeek: Math.round(medianPerWeek),
    availableUnits,
    weeksOnHand,
    riskLevel,
    adjustedWeeklySales: Math.round(adjustedWeeklySales),
    idealInventory,
    reorderQty,
    forecastWeeks,
    safetyStock,
    reorderPoint,
    demandDuringLeadTime,
    daysUntilStockout,
    daysUntilReorder,
    leadTimeDays,
    needsReorderNow,
    demandStdDevDaily: Math.round(demandStdDev * 100) / 100,
    demandCV: Math.round(demandCV * 100) / 100,
  };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function InventoryOverview() {
  const { currency } = useCurrency();

  // Settings
  const [idealWeeksCoverage, setIdealWeeksCoverage] = useState(10);
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>('97.5');
  const [leadTimeDays, setLeadTimeDays] = useState(30);
  const [leadTimeVarianceDays, setLeadTimeVarianceDays] = useState(7);
  const [promotionalEvents, setPromotionalEvents] = useState<PromotionalEvent[]>(DEFAULT_EVENTS);
  const [showSettings, setShowSettings] = useState(false);

  // Table state
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'All' | FulfillmentType>('All');
  const [sortKey, setSortKey] = useState<SortKey>('reorderQty');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedSkus, setExpandedSkus] = useState<Set<string>>(new Set());
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'actions' | 'skus'>('actions');

  const handleKpiFilter = useCallback((key: string | null) => {
    setActiveKpiFilter(key);
    if (key) setActiveView('skus');
  }, []);

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
      map.set(sku.sku, computeSkuMetrics(sku, idealWeeksCoverage, serviceLevel, promotionalEvents, leadTimeDays, leadTimeVarianceDays));
    }
    return map;
  }, [idealWeeksCoverage, serviceLevel, promotionalEvents, leadTimeDays, leadTimeVarianceDays]);

  const filteredData = useMemo(() => {
    let data = inventoryData;

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
        case 'demandCV': av = ma.demandCV; bv = mb.demandCV; break;
        case 'weeksOnHand': av = ma.weeksOnHand; bv = mb.weeksOnHand; break;
        case 'idealInventory': av = ma.idealInventory; bv = mb.idealInventory; break;
        case 'reorderQty': av = ma.reorderQty; bv = mb.reorderQty; break;
        case 'safetyStock': av = ma.safetyStock; bv = mb.safetyStock; break;
        case 'daysUntilReorder': av = ma.daysUntilReorder; bv = mb.daysUntilReorder; break;
        case 'revenueAtRisk': av = a.revenueAtRisk; bv = b.revenueAtRisk; break;
      }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return data;
  }, [fulfillmentFilter, activeKpiFilter, sortKey, sortDir, metricsMap]);

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
            <div className="flex items-start gap-6 flex-wrap">
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
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                  className="w-20 px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cx-500/20 focus:border-cx-400 text-center"
                />
                <p className="text-[10px] text-gray-400 mt-1">Supplier delivery time</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Lead Time Variance (±days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={leadTimeVarianceDays}
                  onChange={(e) => setLeadTimeVarianceDays(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
                  className="w-20 px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cx-500/20 focus:border-cx-400 text-center"
                />
                <p className="text-[10px] text-gray-400 mt-1">Delivery variability</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Service Level
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
                  {(['90', '95', '97.5', '99'] as ServiceLevel[]).map((sl) => (
                    <button
                      key={sl}
                      onClick={() => setServiceLevel(sl)}
                      className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        serviceLevel === sl
                          ? 'bg-cx-500 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {sl}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Z={SERVICE_LEVEL_Z[serviceLevel].toFixed(2)} — higher = more safety stock
                </p>
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
                Multiplier boosts median weekly sales during event week (e.g. ×2.5 = 150% increase). Safety stock is computed from demand & lead time variability at the selected service level.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── IPI / Storage Banner ─── */}
      {(ipiData.ipiScore < 400 || ipiData.totalUtilization > 85) && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="text-sm font-semibold text-amber-900">FBA Storage Alert</h4>
              <div className="flex items-center gap-2">
                {ipiData.ipiScore < 400 && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md ${
                    ipiData.ipiScore < 350 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    IPI {ipiData.ipiScore}
                  </span>
                )}
                {ipiData.totalUtilization > 85 && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md ${
                    ipiData.totalUtilization > 95 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ipiData.totalUtilization}% utilized
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              {ipiData.ipiScore < 400 && `Your IPI score (${ipiData.ipiScore}) is below Amazon's 400 threshold — storage limits may be restricted next quarter. `}
              {ipiData.totalUtilization > 85 && `Storage utilization is at ${ipiData.totalUtilization}% (${ipiData.totalUsedCuFt.toLocaleString()} / ${ipiData.totalLimitCuFt.toLocaleString()} cu ft). `}
              Improve by clearing aged inventory, creating removal orders for stranded/unfulfillable stock, and accelerating sell-through on overstock SKUs.
            </p>
            <div className="flex items-center gap-4 mt-2">
              {ipiData.storageTypes.filter((s) => s.utilization > 75).map((s) => (
                <div key={s.type} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-amber-700">{s.type}</span>
                  <div className="w-16 h-1.5 rounded-full bg-amber-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.utilization > 90 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(s.utilization, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-amber-800">{s.utilization}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI Row ─── */}
      <KPIRow kpis={controlTowerKPIs} currency={currency} activeFilter={activeKpiFilter} onFilter={handleKpiFilter} />

      {/* ─── View Switcher ─── */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => { setActiveView('actions'); setActiveKpiFilter(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
              activeView === 'actions'
                ? 'bg-cx-500 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            Action Queue
          </button>
          <button
            onClick={() => setActiveView('skus')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
              activeView === 'skus'
                ? 'bg-cx-500 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            SKU Inventory
          </button>
        </div>
        <span className="text-[10px] text-gray-400">
          {activeView === 'actions'
            ? 'Decisions to make this week — only SKUs that need replenishing'
            : 'Full SKU state — filter via the KPI cards above'}
        </span>
      </div>

      {/* ─── Replenishment Action Panel ─── */}
      {activeView === 'actions' && (
        <ReplenishmentActionPanel metricsMap={metricsMap} currency={currency} />
      )}

      {/* ─── Risk Table ─── */}
      {activeView === 'skus' && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h3 className="text-sm font-semibold text-gray-900">Inventory Risk Table</h3>
          <span className="text-[11px] text-gray-400 font-medium">
            {filteredData.length} of {inventoryData.length} SKUs
          </span>
        </div>

        <div>
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="border-y border-gray-100">
                <th className="w-6 px-1" />
                <SortableHeader label="SKU" sortKey="sku" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Product" sortKey="title" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Avail" sortKey="availableUnits" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Available + Inbound units. Available = on-hand minus reserved. Inbound = confirmed shipments in transit." />
                <SortableHeader label="Med/wk" sortKey="medianPerWeek" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Median weekly unit sales over the last 12 weeks. Uses median (not mean) to reduce the impact of promo spikes or stockout weeks." />
                <SortableHeader label="σ / CV" sortKey="demandCV" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Daily demand standard deviation (σ) and Coefficient of Variation (CV = σ ÷ avg). Red if CV > 0.5 (highly erratic), yellow if CV > 0.3. Erratic demand inflates required safety stock." />
                <SortableHeader label="WoH" sortKey="weeksOnHand" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Weeks on Hand = Available ÷ Adjusted Weekly Sales. Adjusted sales factor in upcoming promotional events." />
                <SortableHeader label="Safety" sortKey="safetyStock" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Buffer units above expected demand to absorb sales spikes and supplier delays — sized for your chosen service level (e.g. 95%). Grows when demand or lead time gets more erratic. ROP (Reorder Point) shown below." />
                <SortableHeader label="Ideal" sortKey="idealInventory" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Target on-hand inventory = (Adjusted Weekly Sales × Coverage Weeks) + Safety Stock. DDLT shown below drives WHEN to order (ROP), not how much to stock." />
                <SortableHeader label="Reorder" sortKey="reorderQty" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Suggested reorder quantity = Ideal Inventory − Available Units. Shows 'OK' when current stock exceeds the ideal level." />
                <SortableHeader label="In" sortKey="daysUntilReorder" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Days until stock hits the reorder point (ROP). 'NOW' = already below ROP. 'TODAY' = hits ROP today. Factors in lead time so you order before stockout." />
                <SortableHeader label="Sales @ Risk" sortKey="revenueAtRisk" currentKey={sortKey} dir={sortDir} onSort={handleSort} tooltip="Estimated sales that could be lost if stock runs out before replenishment arrives, based on current sell-through rate and days of projected stockout." />
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
                  serviceLevel={serviceLevel}
                  leadTimeVarianceDays={leadTimeVarianceDays}
                />
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-5 py-12 text-center text-sm text-gray-400">
                    No SKUs match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

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

// ─── Replenishment Action Panel ──────────────────────────────────────────────

type StorageCapLevel = 'none' | 'soft' | 'hard';

interface ActionSku {
  sku: InventorySKU;
  metrics: ComputedMetrics;
  orderByDate: Date;
  stockoutDate: Date;
  arrivalDate: Date;
  cappedQty: number;
  capLevel: StorageCapLevel;
}

const EST_CUFT_PER_UNIT = 0.5;

function ReplenishmentActionPanel({
  metricsMap,
  currency,
}: {
  metricsMap: Map<string, ComputedMetrics>;
  currency: string;
}) {
  const [showMonitor, setShowMonitor] = useState(false);
  const [titleSearch, setTitleSearch] = useState('');
  const today = useMemo(() => new Date(), []);
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const addDays = (base: Date, n: number) => new Date(base.getTime() + n * 86400000);

  // Build enriched list sorted by urgency, then apply storage cap
  const allItems = useMemo(() => {
    const items: ActionSku[] = [];

    for (const sku of inventoryData) {
      const m = metricsMap.get(sku.sku);
      if (!m) continue;
      if (m.reorderQty <= 0) continue;

      items.push({
        sku,
        metrics: m,
        orderByDate: addDays(today, Math.max(0, m.daysUntilReorder)),
        stockoutDate: addDays(today, m.daysUntilStockout),
        arrivalDate: addDays(today, Math.max(0, m.daysUntilReorder) + m.leadTimeDays),
        cappedQty: m.reorderQty,
        capLevel: 'none',
      });
    }

    // Sort: most urgent first (OOS → fewest days until stockout → fewest days until reorder)
    items.sort((a, b) => a.metrics.daysUntilStockout - b.metrics.daysUntilStockout);

    // ── Storage-aware cap pass ──
    const util = ipiData.totalUtilization;
    const ipi = ipiData.ipiScore;
    const isHard = util > 90 || ipi < 350;
    const isSoft = !isHard && (util > 75 || ipi < 400);

    if (isHard) {
      let remainingCuFt = Math.max(0, ipiData.totalLimitCuFt - ipiData.totalUsedCuFt);
      for (const item of items) {
        const neededCuFt = item.metrics.reorderQty * EST_CUFT_PER_UNIT;
        if (remainingCuFt <= 0) {
          item.cappedQty = 0;
          item.capLevel = 'hard';
        } else if (neededCuFt > remainingCuFt) {
          item.cappedQty = Math.floor(remainingCuFt / EST_CUFT_PER_UNIT);
          item.capLevel = 'hard';
          remainingCuFt = 0;
        } else {
          item.cappedQty = item.metrics.reorderQty;
          item.capLevel = 'hard';
          remainingCuFt -= neededCuFt;
        }
      }
    } else if (isSoft) {
      for (const item of items) {
        item.capLevel = 'soft';
      }
    }

    return items;
  }, [metricsMap, today]);

  const matchesTitle = (i: ActionSku) =>
    !titleSearch.trim() || i.sku.title.toLowerCase().includes(titleSearch.trim().toLowerCase());
  const urgent = allItems.filter((i) => (i.metrics.needsReorderNow || i.metrics.daysUntilStockout === 0) && matchesTitle(i));
  const soon = allItems.filter((i) => !i.metrics.needsReorderNow && i.metrics.daysUntilStockout > 0 && i.metrics.daysUntilReorder <= 14 && matchesTitle(i));
  const later = allItems.filter((i) => !i.metrics.needsReorderNow && i.metrics.daysUntilStockout > 0 && i.metrics.daysUntilReorder > 14 && matchesTitle(i));

  const totalUnits = allItems.reduce((s, i) => s + i.cappedQty, 0);
  const totalCost = allItems.reduce((s, i) => s + i.cappedQty * i.sku.unitCost, 0);
  const totalOriginalUnits = allItems.reduce((s, i) => s + i.metrics.reorderQty, 0);
  const hasCaps = allItems.some((i) => i.capLevel !== 'none');
  const hasHardCaps = allItems.some((i) => i.capLevel === 'hard' && i.cappedQty < i.metrics.reorderQty);
  const remainingCapacityCuFt = Math.max(0, ipiData.totalLimitCuFt - ipiData.totalUsedCuFt);
  const remainingCapacityUnits = Math.floor(remainingCapacityCuFt / EST_CUFT_PER_UNIT);

  // CSV export
  const exportCsv = useCallback(() => {
    const header = 'SKU,ASIN,Title,Supplier,Status,Current Stock,Reorder Quantity,Adjusted Quantity,Storage Note,Order By Date,Stockout Date,Arrival Date,Unit Cost,Line Total';
    const rows = allItems.map((item) => {
      const m = item.metrics;
      const s = item.sku;
      const isOOS = m.daysUntilStockout === 0;
      const status = isOOS ? 'Out of Stock' : m.needsReorderNow ? 'Order Now' : m.daysUntilReorder <= 14 ? 'Order Soon' : 'Monitor';
      const storageNote =
        item.capLevel === 'hard' && item.cappedQty < m.reorderQty
          ? item.cappedQty === 0 ? 'No remaining capacity' : `Reduced — storage at ${ipiData.totalUtilization}%`
          : item.capLevel === 'soft' ? `Confirm capacity — storage at ${ipiData.totalUtilization}%` : '';
      return [
        s.sku,
        s.asin,
        `"${s.title.replace(/"/g, '""')}"`,
        `"${s.supplier}"`,
        status,
        m.availableUnits,
        m.reorderQty,
        item.cappedQty,
        `"${storageNote}"`,
        fmtDate(item.orderByDate),
        fmtDate(item.stockoutDate),
        fmtDate(item.arrivalDate),
        s.unitCost.toFixed(2),
        (item.cappedQty * s.unitCost).toFixed(2),
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarisix-replenishment-plan-${today.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allItems, today]);

  const urgencyBadge = (item: ActionSku) => {
    const m = item.metrics;
    if (m.daysUntilStockout === 0) return { label: 'OOS', cls: 'bg-red-600 text-white' };
    if (m.needsReorderNow) return { label: 'NOW', cls: 'bg-red-100 text-red-700' };
    if (m.daysUntilReorder <= 14) return { label: 'SOON', cls: 'bg-orange-100 text-orange-700' };
    return { label: 'PLAN', cls: 'bg-yellow-100 text-yellow-700' };
  };

  if (allItems.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold text-gray-900">Replenishment Plan</h3>
        </div>
        <p className="text-[11px] text-gray-500">All SKUs are sufficiently stocked. No replenishment needed.</p>
      </div>
    );
  }

  const renderRows = (items: ActionSku[]) =>
    items.map((item) => {
      const m = item.metrics;
      const badge = urgencyBadge(item);
      const isOOS = m.daysUntilStockout === 0;
      return (
        <tr key={item.sku.sku} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
          <td className="px-3 py-2">
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${badge.cls}`}>
              {badge.label}
            </span>
          </td>
          <td className="px-3 py-2">
            <span className="text-[11px] font-mono font-semibold text-gray-700">{item.sku.sku}</span>
          </td>
          <td className="px-3 py-2 max-w-[200px]">
            <span className="text-[10px] text-gray-600 truncate block">{item.sku.title}</span>
          </td>
          <td className="px-3 py-2 text-right">
            <span className="text-[11px] text-gray-700">{m.availableUnits.toLocaleString()}</span>
          </td>
          <td className="px-3 py-2 text-right">
            <span className={`text-[11px] font-semibold ${isOOS ? 'text-red-600' : m.needsReorderNow ? 'text-red-600' : 'text-gray-800'}`}>
              {isOOS ? '0d' : `${m.daysUntilStockout}d`}
            </span>
          </td>
          <td className="px-3 py-2 text-right">
            <span className="text-[10px] text-gray-600">{fmtDate(item.orderByDate)}</span>
          </td>
          <td className="px-3 py-2 text-right">
            <span className={`text-[10px] font-semibold ${isOOS || m.needsReorderNow ? 'text-red-600' : 'text-gray-600'}`}>
              {fmtDate(item.stockoutDate)}
            </span>
          </td>
          <td className="px-3 py-2 text-right">
            <div className="flex items-center justify-end gap-1.5">
              {item.capLevel === 'hard' && item.cappedQty < m.reorderQty ? (
                <>
                  <span className="text-[10px] text-gray-400 line-through">{m.reorderQty.toLocaleString()}</span>
                  {item.cappedQty > 0 ? (
                    <span className="text-[11px] font-semibold text-red-700">{item.cappedQty.toLocaleString()}</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-red-500">—</span>
                  )}
                  <div className="group relative">
                    <Package className="w-3 h-3 text-red-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-1.5 w-52 px-2.5 py-1.5 text-[10px] text-red-800 bg-red-50 border border-red-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      {item.cappedQty === 0
                        ? 'No remaining FBA capacity — clear aged or overstock inventory first.'
                        : `Reduced from ${m.reorderQty.toLocaleString()} to ${item.cappedQty.toLocaleString()} — storage at ${ipiData.totalUtilization}%. Prioritized by stockout urgency.`}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-semibold text-gray-800">{m.reorderQty.toLocaleString()}</span>
                  {item.capLevel === 'soft' && (
                    <div className="group relative">
                      <Package className="w-3 h-3 text-amber-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-1.5 w-48 px-2.5 py-1.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                        Storage at {ipiData.totalUtilization}% — confirm FBA capacity before shipping.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </td>
          <td className="px-3 py-2 text-right">
            <span className="text-[10px] text-gray-500">{fc(item.cappedQty * item.sku.unitCost, currency)}</span>
          </td>
        </tr>
      );
    });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Replenishment Plan</h3>
          <InfoTooltip content="SKUs that need reordering, sorted by urgency. Quantities are computed from your coverage, lead time, and service level settings. OOS = out of stock, NOW = past reorder point, SOON = reorder within 14 days, PLAN = reorder within 30 days." />
          <div className="flex items-center gap-2 ml-2">
            {urgent.length > 0 && (
              <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {urgent.length} urgent
              </span>
            )}
            <span className="text-[10px] text-gray-400">
              {allItems.length} SKUs · {totalUnits.toLocaleString()} units · {fc(totalCost, currency)}
            </span>
            {hasCaps && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                hasHardCaps ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50'
              }`}>
                <Package className="w-2.5 h-2.5 inline -mt-px mr-0.5" />
                Storage {ipiData.totalUtilization}% · ~{remainingCapacityUnits.toLocaleString()} units left
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
              placeholder="Search product…"
              className="pl-7 pr-7 py-1.5 text-[11px] w-56 rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-cx-500/20 focus:border-cx-400"
            />
            {titleSearch && (
              <button
                onClick={() => setTitleSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-t border-gray-100">
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 w-14">Status</th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">SKU</th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Product</th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">On Hand</th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">
                <span className="inline-flex items-center gap-0.5">Supply Left <InfoTooltip content="Days of inventory remaining at current sell-through rate before stockout." /></span>
              </th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">
                <span className="inline-flex items-center gap-0.5">Order By <InfoTooltip content="Latest date to place order so restock arrives before stockout, accounting for lead time." /></span>
              </th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">
                <span className="inline-flex items-center gap-0.5">Stockout <InfoTooltip content="Projected date when available inventory hits zero at current velocity." /></span>
              </th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">
                <span className="inline-flex items-center gap-0.5">Order Qty <InfoTooltip content="Suggested reorder quantity: Ideal Inventory (coverage demand + safety stock) minus current available." /></span>
              </th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            {urgent.length === 0 && soon.length === 0 && later.length === 0 && titleSearch.trim() && (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-[11px] text-gray-400">
                  No products match "{titleSearch}".
                </td>
              </tr>
            )}

            {/* Urgent section */}
            {urgent.length > 0 && (
              <>
                <tr>
                  <td colSpan={9} className="px-3 pt-2 pb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-red-600">Order Immediately</span>
                      <div className="flex-1 h-px bg-red-100" />
                    </div>
                  </td>
                </tr>
                {renderRows(urgent)}
              </>
            )}

            {/* Soon section */}
            {soon.length > 0 && (
              <>
                <tr>
                  <td colSpan={9} className="px-3 pt-3 pb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-orange-600">Order Soon</span>
                      <div className="flex-1 h-px bg-orange-100" />
                    </div>
                  </td>
                </tr>
                {renderRows(soon)}
              </>
            )}

            {/* Monitor section */}
            {later.length > 0 && (
              <>
                <tr
                  className="cursor-pointer"
                  onClick={() => setShowMonitor(!showMonitor)}
                >
                  <td colSpan={9} className="px-3 pt-3 pb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-600">Plan Ahead</span>
                      <span className="text-[9px] text-gray-400">{later.length} SKUs</span>
                      <div className="flex-1 h-px bg-yellow-100" />
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showMonitor ? 'rotate-180' : ''}`} />
                    </div>
                  </td>
                </tr>
                {showMonitor && renderRows(later)}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer totals */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span className="text-[10px] text-gray-400">
          {allItems.length} SKUs need replenishment
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-500">
            Total units: {hasHardCaps && (
              <span className="text-gray-400 line-through mr-1">{totalOriginalUnits.toLocaleString()}</span>
            )}
            <span className="font-semibold text-gray-700">{totalUnits.toLocaleString()}</span>
          </span>
          <span className="text-[10px] text-gray-500">
            Est. cost: <span className="font-semibold text-gray-700">{fc(totalCost, currency)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Header ────────────────────────────────────────────────────────

function SortableHeader({
  label, sortKey: key, currentKey, dir, onSort, className = '', tooltip,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  className?: string;
  tooltip?: string;
}) {
  const isActive = key === currentKey;
  return (
    <th
      className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition-colors ${className}`}
      onClick={() => onSort(key)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
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
  sku, metrics, currency, expanded, onToggle, serviceLevel, leadTimeVarianceDays,
}: {
  sku: InventorySKU;
  metrics: ComputedMetrics;
  currency: import('../contexts/CurrencyContext').Currency;
  expanded: boolean;
  onToggle: () => void;
  serviceLevel: ServiceLevel;
  leadTimeVarianceDays: number;
}) {
  const tint = ROW_TINT[sku.status] || '';

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

        {/* Demand σ + CV */}
        <td className="px-3 py-2.5 text-xs">
          {metrics.demandStdDevDaily > 0 ? (
            <>
              <span className={`font-semibold ${
                metrics.demandCV > 0.5 ? 'text-red-600'
                  : metrics.demandCV > 0.3 ? 'text-yellow-600'
                  : 'text-gray-700'
              }`}>
                ±{metrics.demandStdDevDaily.toFixed(1)}
              </span>
              <span className="block text-[10px] text-gray-400">CV {metrics.demandCV.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-gray-300">—</span>
          )}
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

        {/* Safety Stock */}
        <td className="px-3 py-2.5 text-xs text-gray-700">
          <span className="font-semibold">{metrics.safetyStock.toLocaleString()}</span>
          <span className="block text-[10px] text-gray-400">ROP: {metrics.reorderPoint.toLocaleString()}</span>
        </td>

        {/* Ideal Inventory */}
        <td className="px-3 py-2.5 text-xs text-gray-700">
          <span className="font-semibold">{metrics.idealInventory.toLocaleString()}</span>
          <span className="block text-[10px] text-gray-400">DDLT: {metrics.demandDuringLeadTime.toLocaleString()}</span>
        </td>

        {/* Reorder Qty */}
        <td className="px-3 py-2.5 text-xs">
          {metrics.reorderQty > 0 ? (
            <span className="font-bold text-cx-500">{metrics.reorderQty.toLocaleString()}</span>
          ) : (
            <span className="text-green-500 font-semibold">OK</span>
          )}
        </td>

        {/* Days Until Reorder */}
        <td className="px-3 py-2.5 text-xs">
          {metrics.needsReorderNow ? (
            <span className="font-bold text-red-600">NOW</span>
          ) : metrics.daysUntilReorder === 0 ? (
            <span className="font-bold text-orange-500">TODAY</span>
          ) : (
            <span className={`font-semibold ${metrics.daysUntilReorder < 7 ? 'text-orange-500' : metrics.daysUntilReorder < 14 ? 'text-yellow-600' : 'text-gray-700'}`}>
              {metrics.daysUntilReorder}d
            </span>
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

      </tr>

      {/* ─── Expanded Detail ─── */}
      {expanded && (
        <tr className="bg-gray-50/50">
          <td colSpan={13} className="px-6 py-4">
            {/* Timeline Chart */}
            <TimelineChart
              weeklyVelocity={sku.weeklyVelocity}
              forecastWeeks={metrics.forecastWeeks}
              medianPerWeek={metrics.medianPerWeek}
            />

            {/* Runway Timeline */}
            <RunwayTimeline metrics={metrics} sku={sku} leadTimeVariance={leadTimeVarianceDays} />

            {/* Metrics summary */}
            <div className="grid grid-cols-4 xl:grid-cols-8 gap-3 mt-4 mb-4">
              {[
                {
                  label: 'Median/wk',
                  value: metrics.medianPerWeek.toLocaleString(),
                  sub: 'units',
                  tip: 'Median weekly unit sales over last 12 weeks',
                },
                { label: 'Available', value: metrics.availableUnits.toLocaleString(), sub: `A:${sku.available.toLocaleString()} + I:${sku.inbound.toLocaleString()}`, tip: 'Available (on-hand − reserved) + Inbound units in transit' },
                {
                  label: 'Weeks on Hand',
                  value: wohDisplay,
                  sub: metrics.riskLevel,
                  tip: 'Available ÷ Adjusted Weekly Sales — how long current stock lasts',
                },
                {
                  label: 'Demand σ / CV',
                  value: metrics.demandStdDevDaily > 0 ? `±${metrics.demandStdDevDaily.toFixed(1)}` : '—',
                  sub: `CV ${metrics.demandCV.toFixed(2)}`,
                  tip: 'Daily demand standard deviation and Coefficient of Variation (σ ÷ avg). Higher volatility drives larger safety stock. CV > 0.5 = highly erratic.',
                },
                { label: 'Safety Stock', value: metrics.safetyStock.toLocaleString(), sub: `Z=${SERVICE_LEVEL_Z[serviceLevel].toFixed(2)}`, tip: 'Buffer units held on top of expected demand to absorb sales spikes and supplier delays. Sized so you have a 95% chance (at Z=1.96) of not stocking out before your next delivery. Grows when demand or lead time gets more erratic.' },
                { label: 'Reorder Point', value: metrics.reorderPoint.toLocaleString(), sub: `DDLT: ${metrics.demandDuringLeadTime.toLocaleString()}`, tip: 'ROP = Demand During Lead Time + Safety Stock. When stock hits this level, place a new order.' },
                { label: 'Ideal Inventory', value: metrics.idealInventory.toLocaleString(), sub: `Adj. ${metrics.adjustedWeeklySales.toLocaleString()}/wk`, tip: '(Adjusted Weekly Sales × Coverage Weeks) + Safety Stock. DDLT drives when to order (ROP), not how much to stock.' },
                { label: 'Reorder Qty', value: metrics.reorderQty.toLocaleString(), sub: metrics.reorderQty > 0 ? 'units to order' : 'well stocked', tip: 'Ideal Inventory − Available. How many units to order to reach ideal stock.' },
                { label: 'Lead Time', value: `${metrics.leadTimeDays}d`, sub: `±${leadTimeVarianceDays}d variance`, tip: 'Supplier lead time in days. Set globally in Forecast Settings. Variance (±) reflects delivery variability — higher variance increases safety stock.' },
              ].map((m) => (
                <div key={m.label} className="px-3 py-2 rounded-lg border border-gray-100 bg-white text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                    {m.label}
                    {m.tip && <span className="ml-1 inline-block align-middle"><InfoTooltip content={m.tip} /></span>}
                  </p>
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

// ─── Runway Timeline ─────────────────────────────────────────────────────────
// Horizontal bar showing stock runway vs. lead time window vs. stockout gap

function RunwayTimeline({
  metrics, sku, leadTimeVariance,
}: {
  metrics: ComputedMetrics;
  sku: InventorySKU;
  leadTimeVariance: number;
}) {
  const { daysUntilStockout, leadTimeDays, daysUntilReorder, needsReorderNow, safetyStock, reorderPoint } = metrics;
  const avgDaily = metrics.medianPerWeek / 7;
  const isOOS = daysUntilStockout === 0;

  // Total timeline scale
  const totalDays = Math.max(leadTimeDays * 2, 90, Math.min(daysUntilStockout + leadTimeDays + 30, 365));

  const coveredDays = Math.min(daysUntilStockout, totalDays);
  const safetyDays = avgDaily > 0 ? Math.round(safetyStock / avgDaily) : 0;

  // Order trigger day & arrival
  const orderByDay = Math.max(0, daysUntilReorder);
  const arrivalDay = Math.min(orderByDay + leadTimeDays, totalDays);
  // Gap = days between stockout and when new stock could arrive (if ordered now/on time)
  const gapDays = isOOS ? leadTimeDays : Math.max(0, arrivalDay - coveredDays);

  const toPct = (d: number) => Math.min(100, Math.max(0, (d / totalDays) * 100));

  // Segment percentages
  const healthyDays = Math.max(0, coveredDays - safetyDays);
  const healthyPct = toPct(healthyDays);
  const safetyPct = toPct(Math.min(safetyDays, coveredDays));
  const gapStart = toPct(coveredDays);
  const gapPct = toPct(gapDays);

  // Lead time bracket position
  const ltLeft = toPct(orderByDay);
  const ltWidth = toPct(leadTimeDays);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <h4 className="text-[11px] font-semibold text-gray-700">Stock Runway Timeline</h4>
          <InfoTooltip content="Visual projection of current stock runway. Green = healthy supply, yellow = safety stock buffer being consumed, red = projected stockout gap, blue bracket = supplier lead time window." />
        </div>
        <div className="flex items-center gap-4">
          {[
            { color: 'bg-green-500', label: 'Covered' },
            { color: 'bg-yellow-400', label: 'Safety Buffer' },
            { color: 'bg-red-400', label: 'Stockout Gap' },
            { color: 'bg-blue-400', label: 'Lead Time' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-4">
        {/* OOS banner */}
        {isOOS && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-red-700">
              Out of Stock — even if ordered today, restock arrives in ~{leadTimeDays} days
            </span>
          </div>
        )}

        {/* Main bar */}
        <div className="relative h-8 bg-gray-100 rounded-md">
          {/* Healthy coverage (green) */}
          {healthyPct > 0 && (
            <div
              className="absolute top-0 h-full bg-green-400/80 rounded-l-md"
              style={{ left: 0, width: `${healthyPct}%` }}
            />
          )}
          {/* Safety stock zone (yellow) */}
          {safetyPct > 0 && (
            <div
              className="absolute top-0 h-full bg-yellow-300/70"
              style={{ left: `${healthyPct}%`, width: `${safetyPct}%` }}
            />
          )}
          {/* Stockout gap (red) */}
          {gapPct > 0 && (
            <div
              className="absolute top-0 h-full bg-red-300/60"
              style={{ left: `${gapStart}%`, width: `${gapPct}%` }}
            />
          )}

          {/* Lead time bracket (rendered on top, no overflow clip) */}
          {ltWidth > 0 && (
            <div
              className="absolute top-0 h-full bg-blue-400/10 border-l-2 border-r-2 border-blue-500/60"
              style={{ left: `${ltLeft}%`, width: `${ltWidth}%` }}
            />
          )}

          {/* Reorder trigger marker */}
          {!isOOS && orderByDay > 0 && orderByDay < totalDays && (
            <div
              className="absolute top-0 h-full w-0.5 bg-orange-500 z-10"
              style={{ left: `${toPct(orderByDay)}%` }}
            />
          )}

          {/* Stockout marker */}
          {coveredDays > 0 && coveredDays < totalDays && (
            <div
              className="absolute top-0 h-full w-0.5 bg-red-600 z-10"
              style={{ left: `${gapStart}%` }}
            />
          )}

          {/* Inbound arrival marker */}
          {sku.inboundETA && sku.inbound > 0 && (
            <div
              className="absolute top-0 h-full z-10 flex flex-col items-center"
              style={{ left: `${toPct(Math.max(5, coveredDays * 0.4))}%` }}
            >
              <div className="w-0.5 h-full bg-emerald-600" />
            </div>
          )}
        </div>

        {/* Date-stamped timeline labels */}
        {(() => {
          const today = new Date();
          const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

          const todayStr = fmtDate(today);
          const orderByDate = addDays(today, orderByDay);
          const stockoutDate = addDays(today, coveredDays);
          const arrivalDate = addDays(today, arrivalDay);
          const endDate = addDays(today, totalDays);

          return (
            <>
              {/* Marker labels positioned on the bar */}
              <div className="relative mt-1 h-5">
                {/* Today marker */}
                <span className="absolute text-[9px] font-bold text-gray-600" style={{ left: 0 }}>
                  {todayStr}
                </span>

                {/* Order-by marker */}
                {!isOOS && orderByDay > 0 && orderByDay < totalDays && (
                  <span
                    className="absolute text-[9px] font-semibold text-orange-600 -translate-x-1/2 whitespace-nowrap"
                    style={{ left: `${toPct(orderByDay)}%` }}
                  >
                    {fmtDate(orderByDate)}
                  </span>
                )}

                {/* Stockout marker */}
                {coveredDays > 0 && coveredDays < totalDays && (
                  <span
                    className="absolute text-[9px] font-semibold text-red-600 -translate-x-1/2 whitespace-nowrap"
                    style={{ left: `${toPct(coveredDays)}%` }}
                  >
                    {fmtDate(stockoutDate)}
                  </span>
                )}

                {/* End date */}
                <span className="absolute right-0 text-[9px] text-gray-400">
                  {fmtDate(endDate)}
                </span>
              </div>

              {/* Explicit action summary */}
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                {/* Current stock status */}
                {isOOS ? (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-bold text-red-600">⬤</span>
                    <span className="text-[10px] text-red-700 font-semibold">
                      Out of stock now. If you place an order today, restock arrives ~{fmtDate(addDays(today, leadTimeDays))} ({leadTimeDays} days).
                    </span>
                  </div>
                ) : needsReorderNow ? (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-bold text-red-600">⬤</span>
                    <span className="text-[10px] text-red-700 font-semibold">
                      Stock runs out {fmtDate(stockoutDate)} ({coveredDays}d). Place order immediately — restock arrives ~{fmtDate(arrivalDate)}.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] font-bold text-green-600">⬤</span>
                      <span className="text-[10px] text-gray-700">
                        <span className="font-semibold">{coveredDays} days of stock</span> remaining (until {fmtDate(stockoutDate)}).
                      </span>
                    </div>
                    {orderByDay > 0 && orderByDay < totalDays && (
                      <div className="flex items-start gap-1.5">
                        <span className="text-[10px] font-bold text-orange-500">⬤</span>
                        <span className="text-[10px] text-gray-700">
                          <span className="font-semibold text-orange-700">Place order by {fmtDate(orderByDate)}</span> ({orderByDay}d from now) to receive restock before stockout.
                          Delivery expected ~{fmtDate(arrivalDate)}.
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Safety buffer info */}
                {safetyDays > 0 && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-bold text-yellow-500">⬤</span>
                    <span className="text-[10px] text-gray-600">
                      {safetyDays}-day safety buffer included. Lead time: {leadTimeDays}d (±{leadTimeVariance}d variance). ROP: {reorderPoint.toLocaleString()} units.
                    </span>
                  </div>
                )}

                {/* Stockout gap warning */}
                {gapDays > 0 && !isOOS && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-bold text-red-500">⬤</span>
                    <span className="text-[10px] text-red-600 font-semibold">
                      {gapDays}-day stockout gap projected. Even if ordered today, stock arrives {gapDays}d after running out.
                    </span>
                  </div>
                )}

                {/* Inbound shipment */}
                {sku.inboundETA && sku.inbound > 0 && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-500">⬤</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      +{sku.inbound.toLocaleString()} units inbound, arriving {sku.inboundETA}.
                    </span>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
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
