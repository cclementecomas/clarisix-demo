import { useMemo, useState } from 'react';
import { Search, AlertOctagon, TrendingUp, Package, Coins, Warehouse } from 'lucide-react';
import { inventoryData, ipiData, type InventorySKU } from '../data/inventoryData';
import DeepDiveTable, {
  type ColumnDef,
  currencyFormatter,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';
import InventoryHistoryTable from './inventory/InventoryHistoryTable';

type Row = Record<string, unknown>;

const DEAD_STOCK_THRESHOLD_DAYS = 180;

// ─── Inline sparkline ───────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return <span className="text-gray-300 text-[10px]">—</span>;
  const w = 70;
  const h = 22;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / Math.max(1, data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${h - ((v - min) / range) * h}`).join(' ');
  const last = data[data.length - 1];
  const first = data[0];
  const trendUp = last >= first;
  const strokeColor = trendUp ? '#16A34A' : '#DC2626';
  return (
    <svg width={w} height={h} className="inline-block align-middle overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={(data.length - 1) * stepX}
        cy={h - ((last - min) / range) * h}
        r="1.75"
        fill={strokeColor}
      />
    </svg>
  );
}

export default function InventoryPerformance() {
  const { currency } = useCurrency();
  const fmtCurrency = useMemo(() => currencyFormatter(currency), [currency]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [deadStockOnly, setDeadStockOnly] = useState(false);

  // ─── Dead-stock summary ───────────────────────────────────────────────────
  const deadStockItems = useMemo(
    () => inventoryData.filter((d) => d.daysOnHand > DEAD_STOCK_THRESHOLD_DAYS),
    []
  );
  const capitalParked = useMemo(
    () => deadStockItems.reduce((s, d) => s + d.inventoryValue, 0),
    [deadStockItems]
  );
  const monthlyStorageDrag = useMemo(
    () => deadStockItems.reduce((s, d) => s + d.storageCostMonthly, 0),
    [deadStockItems]
  );
  const avgTurnover = useMemo(() => {
    const n = inventoryData.length;
    return n > 0 ? inventoryData.reduce((s, d) => s + d.inventoryTurnover, 0) / n : 0;
  }, []);
  const avgGrossMargin = useMemo(() => {
    const n = inventoryData.length;
    if (n === 0) return 0;
    const sum = inventoryData.reduce((acc, d) => {
      const gp = (d.roi / 100) * d.inventoryValue;
      const rev = d.cogs + gp;
      return acc + (rev > 0 ? (gp / rev) * 100 : 0);
    }, 0);
    return sum / n;
  }, []);
  const avgGmroi = useMemo(() => {
    const n = inventoryData.length;
    return n > 0 ? (inventoryData.reduce((s, d) => s + d.roi, 0) / n) * 12 : 0;
  }, []);

  // ─── Filtered rows ─────────────────────────────────────────────────────────
  const filteredInventory = useMemo(() => {
    let data = inventoryData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (d) =>
          d.sku.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    if (deadStockOnly) {
      data = data.filter((d) => d.daysOnHand > DEAD_STOCK_THRESHOLD_DAYS);
    }
    return [...data].sort((a, b) => b.unitsSold - a.unitsSold);
  }, [searchQuery, deadStockOnly]);

  const rows = useMemo<Row[]>(
    () =>
      filteredInventory.map((d) => {
        const grossProfit = (d.roi / 100) * d.inventoryValue;
        const revenue = d.cogs + grossProfit;
        const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0;
        const gmroi = Math.round(d.roi * 12 * 100) / 100;
        return {
          sku: d.sku,
          title: d.title,
          category: d.category,
          trend: d.weeklyVelocity,
          unitsSold: d.unitsSold,
          unitsSoldPoP: d.unitsSoldPoP,
          unitsSoldDiffLY: d.unitsSoldDiffLY,
          unitsReceived: d.unitsReceived,
          sellThroughRate: d.sellThroughRate,
          sellThroughRatePoP: d.sellThroughRatePoP,
          sellThroughRateDiffLY: d.sellThroughRateDiffLY,
          inventoryTurnover: d.inventoryTurnover,
          inventoryTurnoverPoP: d.inventoryTurnoverPoP,
          inventoryTurnoverDiffLY: d.inventoryTurnoverDiffLY,
          daysOnHand: d.daysOnHand,
          cogs: d.cogs,
          inventoryValue: d.inventoryValue,
          storageCostMonthly: d.storageCostMonthly,
          storageCostMonthlyPoP: d.storageCostMonthlyPoP,
          storageCostMonthlyDiffLY: d.storageCostMonthlyDiffLY,
          grossMargin,
          gmroi,
          gmroiPoP: d.roiPoP,
          gmroiDiffLY: d.roiDiffLY,
          ageBucket: d.ageBucket,
        };
      }),
    [filteredInventory]
  );

  // ─── Totals row ────────────────────────────────────────────────────────────
  const totals = useMemo<Row[]>(() => {
    const data = filteredInventory;
    const n = data.length || 1;
    const sum = (key: keyof InventorySKU) => data.reduce((s, d) => s + (d[key] as number), 0);
    const avg = (key: keyof InventorySKU) => Math.round((sum(key) / n) * 100) / 100;

    const avgGm = data.length > 0
      ? data.reduce((acc, d) => {
          const gp = (d.roi / 100) * d.inventoryValue;
          const rev = d.cogs + gp;
          return acc + (rev > 0 ? (gp / rev) * 100 : 0);
        }, 0) / data.length
      : 0;

    return [
      {
        sku: 'Total',
        title: '',
        category: '',
        trend: [],
        unitsSold: sum('unitsSold'),
        unitsSoldPoP: avg('unitsSoldPoP'),
        unitsSoldDiffLY: avg('unitsSoldDiffLY'),
        unitsReceived: sum('unitsReceived'),
        sellThroughRate: avg('sellThroughRate'),
        sellThroughRatePoP: avg('sellThroughRatePoP'),
        sellThroughRateDiffLY: avg('sellThroughRateDiffLY'),
        inventoryTurnover: avg('inventoryTurnover'),
        inventoryTurnoverPoP: avg('inventoryTurnoverPoP'),
        inventoryTurnoverDiffLY: avg('inventoryTurnoverDiffLY'),
        daysOnHand: Math.round(avg('daysOnHand')),
        cogs: Math.round(sum('cogs') * 100) / 100,
        inventoryValue: Math.round(sum('inventoryValue') * 100) / 100,
        storageCostMonthly: Math.round(sum('storageCostMonthly') * 100) / 100,
        storageCostMonthlyPoP: avg('storageCostMonthlyPoP'),
        storageCostMonthlyDiffLY: avg('storageCostMonthlyDiffLY'),
        grossMargin: Math.round(avgGm * 100) / 100,
        gmroi: Math.round(avg('roi') * 12 * 100) / 100,
        gmroiPoP: avg('roiPoP'),
        gmroiDiffLY: avg('roiDiffLY'),
        ageBucket: '',
      },
    ];
  }, [filteredInventory]);

  const turnoverFormatter = (params: { value: unknown }) => {
    const v = params.value as number;
    return v > 0 ? `${v.toFixed(2)}x` : '—';
  };

  const daysFormatter = (params: { value: unknown }) => {
    const v = params.value as number;
    if (v >= 900) return '∞';
    return `${v}d`;
  };

  const columns = useMemo<ColumnDef[]>(
    () => [
      { field: 'sku', headerName: 'SKU', pinned: 'left', width: 100 },
      { field: 'title', headerName: 'Product', width: 220 },
      { field: 'category', headerName: 'Category', width: 130 },
      {
        field: 'trend',
        headerName: 'Trend (12w)',
        width: 110,
        tooltip: 'Weekly sales velocity over the last 12 weeks. Green = trending up, red = trending down.',
        valueFormatter: (p) => {
          const v = p.value as number[] | undefined;
          if (!v || v.length === 0) return '';
          return <Sparkline data={v} />;
        },
      },
      { field: 'unitsSold', headerName: 'Units Sold', valueFormatter: numberFormatter, width: 110 },
      { field: 'unitsReceived', headerName: 'Units Received', valueFormatter: numberFormatter, width: 130 },
      { field: 'sellThroughRate', headerName: 'Sell-Through %', valueFormatter: pctShareFormatter, width: 130 },
      {
        field: 'inventoryTurnover', headerName: 'Turnover', valueFormatter: turnoverFormatter, width: 110,
        tooltip: 'How many times inventory cycles per year. Green ≥ 8x (lean), yellow 4-8x, red < 4x (slow).',
        cellStyle: (p): Record<string, string> => {
          const v = p.value as number;
          if (v >= 8) return { color: '#16A34A', fontWeight: '600' };
          if (v >= 4) return { color: '#CA8A04', fontWeight: '400' };
          if (v > 0) return { color: '#DC2626', fontWeight: '400' };
          return { color: '', fontWeight: '400' };
        },
      },
      {
        field: 'daysOnHand', headerName: 'Days on Hand', valueFormatter: daysFormatter, width: 120,
        tooltip: 'Days of inventory at current pace. > 180 days flags as dead stock.',
        cellStyle: (p): Record<string, string> => {
          const v = p.value as number;
          if (v > 180) return { color: '#DC2626', fontWeight: '600' };
          if (v > 90) return { color: '#CA8A04', fontWeight: '400' };
          return { color: '', fontWeight: '400' };
        },
      },
      { field: 'cogs', headerName: 'COGS', valueFormatter: fmtCurrency, width: 110 },
      { field: 'inventoryValue', headerName: 'Inv. Value', valueFormatter: fmtCurrency, width: 120 },
      { field: 'storageCostMonthly', headerName: 'Storage Cost/mo', valueFormatter: fmtCurrency, width: 140 },
      {
        field: 'grossMargin', headerName: 'Gross Margin', valueFormatter: pctShareFormatter, width: 120,
        tooltip: 'Gross profit ÷ revenue — how profitable each dollar of sales is, before subtracting ads, FBA fees, or storage. Pairs with Turnover to form GMROI. ≥ 50% healthy, 30–50% watch, < 30% thin.',
        cellStyle: (p): Record<string, string> => {
          const v = p.value as number;
          if (v >= 50) return { color: '#16A34A', fontWeight: '600' };
          if (v >= 30) return { color: '#CA8A04', fontWeight: '400' };
          if (v > 0) return { color: '#DC2626', fontWeight: '400' };
          return { color: '', fontWeight: '400' };
        },
      },
      {
        field: 'gmroi', headerName: 'GMROI', valueFormatter: pctShareFormatter, width: 110,
        tooltip: 'GMROI — Gross Margin Return on Investment, annualized. For every $1 of capital parked in this SKU\'s stock, how much gross profit comes back over a year. 100% means inventory paid back its cost once; 300% means three times. Identity: GMROI = Gross Margin % × Inventory Turns — so you raise it by selling at higher margin, selling faster, or both. ≥ 300% healthy, 150–300% watch, < 150% problem (industry benchmark). Gross only — does not subtract ads, FBA fees, or storage.',
        cellStyle: (p): Record<string, string> => {
          const v = p.value as number;
          if (v >= 300) return { color: '#16A34A', fontWeight: '600' };
          if (v >= 150) return { color: '#CA8A04', fontWeight: '400' };
          if (v > 0) return { color: '#EA580C', fontWeight: '400' };
          return { color: '#DC2626', fontWeight: '400' };
        },
      },
    ],
    [fmtCurrency]
  );

  return (
    <div className="space-y-5">
      {/* ─── Sticky Controls Bar ─── */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur -mx-6 px-6 py-3 border-b border-gray-200/60">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU, product, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-cx-500/20 focus:border-cx-400"
            />
          </div>

          <button
            onClick={() => setDeadStockOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
              deadStockOnly
                ? 'bg-red-500 text-white border-red-500'
                : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Dead Stock Only ({deadStockItems.length})
          </button>

          <div className="ml-auto">
            <LastRefreshed offsetMinutes={6} />
          </div>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        <SummaryCard
          icon={<Coins className="w-4 h-4 text-red-500" />}
          label="Capital Parked"
          value={fc(capitalParked, currency)}
          subtitle={`${deadStockItems.length} SKUs · > ${DEAD_STOCK_THRESHOLD_DAYS}d on hand`}
          tone="red"
          tip="Inventory value tied up in dead stock (days on hand > 180). Capital that could otherwise fund faster-moving SKUs."
          onClick={() => setDeadStockOnly(true)}
        />
        <SummaryCard
          icon={<Warehouse className="w-4 h-4 text-orange-500" />}
          label="Space Utilization"
          value={`${ipiData.totalUtilization}%`}
          subtitle={`IPI ${ipiData.ipiScore} · ${ipiData.totalUsedCuFt.toLocaleString()} / ${ipiData.totalLimitCuFt.toLocaleString()} cu ft`}
          tone={ipiData.totalUtilization > 85 ? 'orange' : 'neutral'}
          tip="FBA storage utilization — current cubic feet used vs. your storage limit. IPI (Inventory Performance Index) below 400 triggers Amazon storage restrictions. Improve by clearing aged, stranded, and overstock inventory."
        />
        <SummaryCard
          icon={<Package className="w-4 h-4 text-orange-500" />}
          label="Monthly Storage Drag"
          value={fc(monthlyStorageDrag, currency)}
          subtitle="Dead stock storage cost/mo"
          tone="orange"
          tip="Monthly storage cost attributable to dead-stock SKUs. This cost compounds until the stock is sold, liquidated, or removed."
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          label="Avg Turnover"
          value={`${avgTurnover.toFixed(2)}x`}
          subtitle="Cycles per year"
          tone="neutral"
          tip="Portfolio-average inventory turnover — how many times the average SKU's stock cycles per year. Healthy Amazon sellers typically target 6–10x. One of the two ingredients of GMROI (the other is Gross Margin)."
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
          label="Avg Gross Margin"
          value={`${avgGrossMargin.toFixed(1)}%`}
          subtitle="Gross profit ÷ revenue"
          tone="neutral"
          tip="Portfolio-average gross margin — the profit left on each dollar of sales after COGS, before ads, FBA fees, or storage. The other ingredient of GMROI. GMROI = Gross Margin × Turnover, so raising either raises GMROI."
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4 text-cx-500" />}
          label="Avg GMROI"
          value={`${avgGmroi.toFixed(0)}%`}
          subtitle="Margin × Turnover (annualized)"
          tone="neutral"
          tip="GMROI — Gross Margin Return on Investment, annualized. For every $1 parked in inventory, how much gross profit comes back per year. 100% = paid back once; 300% = three times (industry-healthy). Decomposes as Gross Margin % × Inventory Turns — both shown in the cards to the left. Gross only: excludes ads, FBA fees, storage. Use to rank SKUs by capital efficiency when deciding where to deploy the next PO."
        />
      </div>

      {/* ─── Dead Stock Action Strip (when filter active) ─── */}
      {deadStockOnly && deadStockItems.length > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-500" />
            <span className="text-[11px] font-semibold text-red-800">
              {deadStockItems.length} dead-stock SKUs · {fc(capitalParked, currency)} parked · {fc(monthlyStorageDrag, currency)}/mo storage
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-100 transition-colors">
              Liquidate
            </button>
            <button className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors">
              Discount Campaign
            </button>
            <button className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors">
              Create Removal Order
            </button>
          </div>
        </div>
      )}

      <DeepDiveTable
        title="Inventory Performance"
        rowData={rows}
        columnDefs={columns}
        pinnedBottomRowData={totals}
      />

      <InventoryHistoryTable />
      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={6} />
      </div>
    </div>
  );
}

// ─── Summary Card ────────────────────────────────────────────────────────────
function SummaryCard({
  icon, label, value, subtitle, tone, tip, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  tone: 'red' | 'orange' | 'green' | 'neutral';
  tip?: string;
  onClick?: () => void;
}) {
  const toneBorder =
    tone === 'red' ? 'border-red-200 bg-red-50/50'
    : tone === 'orange' ? 'border-orange-200 bg-orange-50/50'
    : tone === 'green' ? 'border-green-200 bg-green-50/50'
    : 'border-gray-200 bg-white';
  const Wrap = onClick ? 'button' : 'div';
  return (
    <Wrap
      onClick={onClick}
      className={`text-left rounded-xl border shadow-sm p-4 ${toneBorder} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
        {tip && <InfoTooltip content={tip} />}
      </div>
      <p className="text-lg font-extrabold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>
    </Wrap>
  );
}
