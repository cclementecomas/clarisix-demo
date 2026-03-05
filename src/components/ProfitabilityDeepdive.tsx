import { useState, useMemo } from 'react';
import DeepDiveTable, {
  type ColumnDef,
  percentCellStyle,
  percentFormatter,
  ppFormatter,
  currencyFormatter,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import { useCurrency, type Currency } from '../contexts/CurrencyContext';
import { productProfitData, skuProfitMap } from '../data/profitabilityDeepdiveData';
import type { ProductProfitRow } from '../data/profitabilityDeepdiveData';
import { BarChart2, X } from 'lucide-react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { fc } from '../utils/currency';

const pctSub = (field: string) => [
  { field: `${field}PoP`, label: 'PoP', formatter: percentFormatter, cellStyle: percentCellStyle },
  { field: `${field}DiffLY`, label: 'LY', formatter: percentFormatter, cellStyle: percentCellStyle },
];
const ppSub = (field: string) => [
  { field: `${field}PoP`, label: 'PoP', formatter: ppFormatter, cellStyle: percentCellStyle },
  { field: `${field}DiffLY`, label: 'LY', formatter: ppFormatter, cellStyle: percentCellStyle },
];

// Color styles
const marginCellStyle = (params: { value: unknown }): Record<string, string> => {
  const v = params.value as number;
  if (v >= 20) return { color: '#166534', fontWeight: '600' };
  if (v >= 10) return { color: '#854D0E', fontWeight: '600' };
  if (v >= 0) return { color: '#9A3412', fontWeight: '600' };
  return { color: '#991B1B', fontWeight: '700', backgroundColor: 'rgba(220,38,38,0.06)' };
};

const profitCellStyle = (_currency: string) => (params: { value: unknown }): Record<string, string> => {
  const v = params.value as number;
  if (v < 0) return { color: '#991B1B', fontWeight: '600' };
  if (v > 0) return { color: '#166534' };
  return {};
};

const reimbursementCellStyle = (params: { value: unknown }): Record<string, string> => {
  const v = params.value as number;
  if (v > 0) return { color: '#0F766E', fontWeight: '500' };
  return {};
};

const acosCellStyle = (params: { value: unknown }): Record<string, string> => {
  const v = params.value as number;
  if (v <= 15) return { color: '#166534' };
  if (v <= 25) return { color: '#854D0E' };
  return { color: '#991B1B' };
};

const returnCellStyle = (params: { value: unknown }): Record<string, string> => {
  const v = params.value as number;
  if (v <= 5) return { color: '#166534' };
  if (v <= 10) return { color: '#854D0E' };
  return { color: '#991B1B' };
};

// ─── P&L Waterfall (aligned with spec cascade) ──────────────────────────────

interface WaterfallStep {
  name: string;
  base: number;
  value: number;
  runningTotal: number;
  type: 'revenue' | 'cost' | 'subtotal' | 'addition' | 'profit';
}

const WATERFALL_COLORS: Record<string, string> = {
  revenue: '#0E5A8A',
  cost: '#E07A5F',
  subtotal: '#3889B8',
  addition: '#0F766E',
};

function WaterfallPanel({ product, currency, onClose }: {
  product: ProductProfitRow;
  currency: Currency;
  onClose: () => void;
}) {
  const steps: WaterfallStep[] = useMemo(() => {
    const {
      grossRevenue, refundsAndReturns, netRevenue, netCogs, grossProfit,
      totalAmazonFees, totalAdvertising, totalReimbursements,
      contributionProfit, allocatedOverheads, netOperatingProfit,
    } = product;

    const items: WaterfallStep[] = [];
    let running = grossRevenue;

    // Gross Revenue
    items.push({ name: 'Gross Revenue', base: 0, value: grossRevenue, runningTotal: running, type: 'revenue' });

    // - Refunds & Returns
    running -= refundsAndReturns;
    items.push({ name: 'Refunds & Returns', base: running, value: refundsAndReturns, runningTotal: running, type: 'cost' });

    // = Net Revenue
    items.push({ name: 'Net Revenue', base: 0, value: netRevenue, runningTotal: netRevenue, type: 'subtotal' });
    running = netRevenue;

    // - COGS
    running -= netCogs;
    items.push({ name: 'COGS', base: running, value: netCogs, runningTotal: running, type: 'cost' });

    // = Gross Profit
    items.push({ name: 'Gross Profit', base: 0, value: grossProfit, runningTotal: grossProfit, type: 'subtotal' });
    running = grossProfit;

    // - Amazon Fees
    running -= totalAmazonFees;
    items.push({ name: 'Amazon Fees', base: running, value: totalAmazonFees, runningTotal: running, type: 'cost' });

    // - Advertising
    running -= totalAdvertising;
    items.push({ name: 'Advertising', base: running, value: totalAdvertising, runningTotal: running, type: 'cost' });

    // + Reimbursements
    running += totalReimbursements;
    items.push({ name: 'Reimbursements', base: running - totalReimbursements, value: totalReimbursements, runningTotal: running, type: 'addition' });

    // = Contribution Profit
    items.push({ name: 'Contribution Profit', base: 0, value: Math.abs(contributionProfit), runningTotal: contributionProfit, type: 'subtotal' });
    running = contributionProfit;

    // - Overheads
    running -= allocatedOverheads;
    items.push({ name: 'Overheads', base: Math.min(running, contributionProfit), value: allocatedOverheads, runningTotal: running, type: 'cost' });

    // = Net Operating Profit
    items.push({
      name: 'Net Op. Profit',
      base: netOperatingProfit < 0 ? netOperatingProfit : 0,
      value: Math.abs(netOperatingProfit),
      runningTotal: netOperatingProfit,
      type: 'profit',
    });

    return items;
  }, [product]);

  const getBarColor = (step: WaterfallStep) => {
    if (step.type === 'profit') return product.netOperatingProfit >= 0 ? '#16A34A' : '#DC2626';
    if (step.type === 'subtotal' && step.runningTotal < 0) return '#DC2626';
    return WATERFALL_COLORS[step.type];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">P&L Waterfall</h3>
            <span className="text-[10px] px-1.5 py-0.5 bg-cx-50 text-cx-700 rounded font-medium">{product.asin}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{product.product}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-[10px]">
            <div>
              <span className="text-gray-400 uppercase font-bold">Gross Margin</span>
              <span className={`ml-1.5 font-extrabold ${product.grossMargin >= 20 ? 'text-green-700' : product.grossMargin >= 10 ? 'text-yellow-700' : 'text-red-700'}`}>
                {product.grossMargin.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-bold">Contribution</span>
              <span className={`ml-1.5 font-extrabold ${product.contributionMargin >= 10 ? 'text-green-700' : product.contributionMargin >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                {product.contributionMargin.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-bold">Net Margin</span>
              <span className={`ml-1.5 font-extrabold ${product.netMargin >= 10 ? 'text-green-700' : product.netMargin >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                {product.netMargin.toFixed(1)}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={steps} margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tickFormatter={(v) => fc(v, currency)}
              tick={{ fontSize: 10, fill: '#93A4B8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as WaterfallStep;
                if (!d) return null;
                return (
                  <div className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl">
                    <p className="font-semibold mb-1">{d.name}</p>
                    <p>
                      {d.type === 'cost' ? '−' : d.type === 'addition' ? '+' : ''}
                      {fc(d.value, currency, { compact: false })}
                    </p>
                    {(d.type === 'cost' || d.type === 'addition') && (
                      <p className="text-gray-400 mt-0.5">Running: {fc(d.runningTotal, currency, { compact: false })}</p>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="value" stackId="waterfall" radius={[3, 3, 0, 0]} animationDuration={600}>
              {steps.map((entry, idx) => (
                <Cell key={idx} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-5 mt-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#0E5A8A' }} />
            <span className="text-gray-500">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#E07A5F' }} />
            <span className="text-gray-500">Costs / Deductions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#0F766E' }} />
            <span className="text-gray-500">Reimbursements</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3889B8' }} />
            <span className="text-gray-500">Subtotals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: product.netOperatingProfit >= 0 ? '#16A34A' : '#DC2626' }} />
            <span className="text-gray-500">Net Operating Profit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfitabilityDeepdive() {
  const { currency } = useCurrency();
  const cf = currencyFormatter(currency);
  const [waterfallProduct, setWaterfallProduct] = useState<ProductProfitRow | null>(null);

  const columns: ColumnDef[] = useMemo(() => [
    { field: 'asin', headerName: 'ASIN', pinned: 'left', width: 130 },
    // P&L waterfall action — prominent, right after ASIN
    { field: '_waterfall', headerName: 'P&L', width: 52, valueFormatter: ({ row }: { value: unknown; row: any }) => {
      if (row.asin === 'TOTAL' || row.sku) return '';
      const isActive = waterfallProduct?.asin === row.asin;
      return (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setWaterfallProduct((prev) => prev?.asin === row.asin ? null : row); }}
          className={`flex items-center justify-center gap-1 w-full px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            isActive
              ? 'bg-cx-500 text-white'
              : 'bg-cx-50 text-cx-600 hover:bg-cx-100'
          }`}
          title="View P&L Waterfall"
        >
          <BarChart2 className="w-3 h-3" />
          P&L
        </button>
      );
    }},
    { field: 'product', headerName: 'Product', width: 220 },
    // ── Revenue ──────────────────────────────────────────────────────────
    { field: 'unitsSold', headerName: 'Units Sold', width: 110, valueFormatter: numberFormatter, subFields: pctSub('unitsSold') },
    { field: 'avgPrice', headerName: 'Avg Price', width: 105, valueFormatter: cf, subFields: pctSub('avgPrice'), hide: true },
    { field: 'grossRevenue', headerName: 'Gross Revenue', width: 130, valueFormatter: cf, subFields: pctSub('grossRevenue') },
    { field: 'refundsAndReturns', headerName: 'Refunds & Returns', width: 145, valueFormatter: cf, cellStyle: (): Record<string, string> => ({ color: '#991B1B' }), subFields: pctSub('refundsAndReturns'), hide: true },
    { field: 'netRevenue', headerName: 'Net Revenue', width: 125, valueFormatter: cf, subFields: pctSub('netRevenue'), hide: true },
    // ── COGS ─────────────────────────────────────────────────────────────
    { field: 'netCogs', headerName: 'COGS', width: 110, valueFormatter: cf, subFields: pctSub('netCogs'), hide: true },
    // ── Gross Profit ─────────────────────────────────────────────────────
    { field: 'grossProfit', headerName: 'Gross Profit', width: 125, valueFormatter: cf, cellStyle: profitCellStyle(currency), subFields: pctSub('grossProfit'), hide: true },
    { field: 'grossMargin', headerName: 'Gross Margin %', width: 130, valueFormatter: pctShareFormatter, cellStyle: marginCellStyle, subFields: ppSub('grossMargin') },
    // ── Amazon Fees & Advertising ────────────────────────────────────────
    { field: 'totalAmazonFees', headerName: 'Amazon Fees', width: 125, valueFormatter: cf, subFields: pctSub('totalAmazonFees'), hide: true },
    { field: 'totalAdvertising', headerName: 'Advertising', width: 120, valueFormatter: cf, subFields: pctSub('totalAdvertising'), hide: true },
    { field: 'totalReimbursements', headerName: 'Reimbursements', width: 135, valueFormatter: cf, cellStyle: reimbursementCellStyle, subFields: pctSub('totalReimbursements'), hide: true },
    // ── Contribution Profit ──────────────────────────────────────────────
    { field: 'contributionProfit', headerName: 'Contribution Profit', width: 155, valueFormatter: cf, cellStyle: profitCellStyle(currency), subFields: pctSub('contributionProfit') },
    { field: 'contributionMargin', headerName: 'Contrib. Margin %', width: 145, valueFormatter: pctShareFormatter, cellStyle: marginCellStyle, subFields: ppSub('contributionMargin') },
    // ── Overheads & Net Operating Profit ─────────────────────────────────
    { field: 'allocatedOverheads', headerName: 'Overheads', width: 115, valueFormatter: cf, subFields: pctSub('allocatedOverheads'), hide: true },
    { field: 'netOperatingProfit', headerName: 'Net Op. Profit', width: 135, valueFormatter: cf, cellStyle: profitCellStyle(currency), subFields: pctSub('netOperatingProfit'), hide: true },
    { field: 'netMargin', headerName: 'Net Margin %', width: 120, valueFormatter: pctShareFormatter, cellStyle: marginCellStyle, subFields: ppSub('netMargin') },
    // ── Unit Economics ───────────────────────────────────────────────────
    { field: 'profitPerUnit', headerName: 'Profit/Unit', width: 110, valueFormatter: cf, cellStyle: profitCellStyle(currency), subFields: pctSub('profitPerUnit'), hide: true },
    // ── Efficiency ───────────────────────────────────────────────────────
    { field: 'category', headerName: 'Category', width: 120, hide: true },
    { field: 'acos', headerName: 'ACOS %', width: 100, valueFormatter: pctShareFormatter, cellStyle: acosCellStyle, subFields: ppSub('acos'), hide: true },
    { field: 'tacos', headerName: 'TACOS %', width: 100, valueFormatter: pctShareFormatter, cellStyle: acosCellStyle, subFields: ppSub('tacos'), hide: true },
    { field: 'roas', headerName: 'ROAS', width: 90, valueFormatter: (p: { value: unknown }) => { const v = p.value as number; return v != null ? `${v.toFixed(2)}x` : ''; }, subFields: pctSub('roas'), hide: true },
    // ── Returns ──────────────────────────────────────────────────────────
    { field: 'returnRate', headerName: 'Return Rate %', width: 125, valueFormatter: pctShareFormatter, cellStyle: returnCellStyle, subFields: ppSub('returnRate'), hide: true },
    { field: 'refundRate', headerName: 'Refund Rate %', width: 125, valueFormatter: pctShareFormatter, cellStyle: returnCellStyle, subFields: ppSub('refundRate'), hide: true },
  ], [currency, cf, waterfallProduct]);

  // Flatten data for table
  const rows = useMemo(() =>
    productProfitData.map((r) => ({ ...r })),
    []
  );

  // Child rows (SKU breakdown)
  const childRowsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    productProfitData.forEach((r) => {
      const skus = skuProfitMap[r.asin];
      if (skus && skus.length > 0) {
        map[r.asin] = skus.map((s) => ({ ...s, asin: s.sku }));
      }
    });
    return map;
  }, []);

  // Totals row
  const totals = useMemo(() => {
    const sum = (field: keyof typeof rows[0]) =>
      rows.reduce((s, r) => s + (typeof r[field] === 'number' ? (r[field] as number) : 0), 0);
    const avg = (field: keyof typeof rows[0]) =>
      rows.length > 0 ? sum(field) / rows.length : 0;

    const totalGrossRevenue = sum('grossRevenue');
    const totalNetRevenue = sum('netRevenue');
    const totalNetCogs = sum('netCogs');
    const totalGrossProfit = sum('grossProfit');
    const totalAmazonFees = sum('totalAmazonFees');
    const totalAdvertising = sum('totalAdvertising');
    const totalReimbursements = sum('totalReimbursements');
    const totalContributionProfit = sum('contributionProfit');
    const totalOverheads = sum('allocatedOverheads');
    const totalNetOperatingProfit = sum('netOperatingProfit');
    const totalAdSpend = sum('totalAdvertising');
    const totalUnits = sum('unitsSold');

    return {
      asin: 'TOTAL',
      product: `${rows.length} Products`,
      category: '',
      unitsSold: totalUnits,
      unitsSoldPoP: avg('unitsSoldPoP'), unitsSoldDiffLY: avg('unitsSoldDiffLY'),
      avgPrice: totalUnits > 0 ? Math.round(totalGrossRevenue / totalUnits * 100) / 100 : 0,
      avgPricePoP: avg('avgPricePoP'), avgPriceDiffLY: avg('avgPriceDiffLY'),
      grossRevenue: totalGrossRevenue,
      grossRevenuePoP: avg('grossRevenuePoP'), grossRevenueDiffLY: avg('grossRevenueDiffLY'),
      refundsAndReturns: sum('refundsAndReturns'),
      refundsAndReturnsPoP: avg('refundsAndReturnsPoP'), refundsAndReturnsDiffLY: avg('refundsAndReturnsDiffLY'),
      netRevenue: totalNetRevenue,
      netRevenuePoP: avg('netRevenuePoP'), netRevenueDiffLY: avg('netRevenueDiffLY'),
      netCogs: totalNetCogs,
      netCogsPoP: avg('netCogsPoP'), netCogsDiffLY: avg('netCogsDiffLY'),
      grossProfit: totalGrossProfit,
      grossProfitPoP: avg('grossProfitPoP'), grossProfitDiffLY: avg('grossProfitDiffLY'),
      grossMargin: totalNetRevenue > 0 ? Math.round(totalGrossProfit / totalNetRevenue * 10000) / 100 : 0,
      grossMarginPoP: avg('grossMarginPoP'), grossMarginDiffLY: avg('grossMarginDiffLY'),
      totalAmazonFees,
      totalAmazonFeesPoP: avg('totalAmazonFeesPoP'), totalAmazonFeesDiffLY: avg('totalAmazonFeesDiffLY'),
      totalAdvertising,
      totalAdvertisingPoP: avg('totalAdvertisingPoP'), totalAdvertisingDiffLY: avg('totalAdvertisingDiffLY'),
      totalReimbursements,
      totalReimbursementsPoP: avg('totalReimbursementsPoP'), totalReimbursementsDiffLY: avg('totalReimbursementsDiffLY'),
      contributionProfit: totalContributionProfit,
      contributionProfitPoP: avg('contributionProfitPoP'), contributionProfitDiffLY: avg('contributionProfitDiffLY'),
      contributionMargin: totalNetRevenue > 0 ? Math.round(totalContributionProfit / totalNetRevenue * 10000) / 100 : 0,
      contributionMarginPoP: avg('contributionMarginPoP'), contributionMarginDiffLY: avg('contributionMarginDiffLY'),
      allocatedOverheads: totalOverheads,
      allocatedOverheadsPoP: avg('allocatedOverheadsPoP'), allocatedOverheadsDiffLY: avg('allocatedOverheadsDiffLY'),
      netOperatingProfit: totalNetOperatingProfit,
      netOperatingProfitPoP: avg('netOperatingProfitPoP'), netOperatingProfitDiffLY: avg('netOperatingProfitDiffLY'),
      netMargin: totalNetRevenue > 0 ? Math.round(totalNetOperatingProfit / totalNetRevenue * 10000) / 100 : 0,
      netMarginPoP: avg('netMarginPoP'), netMarginDiffLY: avg('netMarginDiffLY'),
      profitPerUnit: totalUnits > 0 ? Math.round(totalNetOperatingProfit / totalUnits * 100) / 100 : 0,
      profitPerUnitPoP: avg('profitPerUnitPoP'), profitPerUnitDiffLY: avg('profitPerUnitDiffLY'),
      acos: avg('acos'),
      acosPoP: avg('acosPoP'), acosDiffLY: avg('acosDiffLY'),
      tacos: totalGrossRevenue > 0 ? Math.round(totalAdSpend / totalGrossRevenue * 10000) / 100 : 0,
      tacosPoP: avg('tacosPoP'), tacosDiffLY: avg('tacosDiffLY'),
      roas: avg('roas'),
      roasPoP: avg('roasPoP'), roasDiffLY: avg('roasDiffLY'),
      returnRate: avg('returnRate'),
      returnRatePoP: avg('returnRatePoP'), returnRateDiffLY: avg('returnRateDiffLY'),
      refundRate: avg('refundRate'),
      refundRatePoP: avg('refundRatePoP'), refundRateDiffLY: avg('refundRateDiffLY'),
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <DeepDiveTable
        title="Profitability by Product"
        rowData={rows}
        columnDefs={columns}
        pinnedBottomRowData={[totals]}
        childRowsMap={childRowsMap}
        rowKeyField="asin"
        childLabelField="asin"
      />
      {waterfallProduct && (
        <WaterfallPanel
          product={waterfallProduct}
          currency={currency}
          onClose={() => setWaterfallProduct(null)}
        />
      )}
    </div>
  );
}
