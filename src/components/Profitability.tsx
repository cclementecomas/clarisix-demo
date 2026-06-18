import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, TrendingUp, Download, Sheet, Calendar, X, AlertTriangle, ChevronDown, ArrowRight } from 'lucide-react';
import {
  profitabilityData, ProfitabilityMetric, PL_TOOLTIPS,
  grossOrderedRevenue as gorPV, netRevenue as nrPV, netCogs as cogsPV,
  totalAmazonFees as feesPV, totalAdvertising as adsPV,
  allocatedOverheads as ohPV, netOperatingProfit as nopPV,
  grossMarginPct as gmPctPV, channelMarginPct as cmPctPV,
  growthMarginPct as grPctPV, netOperatingMarginPct as noPctPV,
  vatMemoData, VAT_RATE_PCT,
} from '../data/profitabilityData';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';
import SettlementPostingBridge from './SettlementPostingBridge';
import { useCurrency, CURRENCY_SYMBOLS } from '../contexts/CurrencyContext';
import { convert } from '../utils/currency';
import * as XLSX from 'xlsx';
import { exportToGoogleSheets } from '../utils/exportSheets';
import { buildSkuCostProfiles, computeCoverage, demoCostRecords, demoInboundEvents } from '../data/cogsData';
import type { CostMarketplace } from '../data/cogsData';
import { inventoryData } from '../data/inventoryData';

// Internal keys kept stable; user-facing labels are date-of-event names.
//   'accrual'    → "Order date"     (NON-GAAP — sales/booking view)
//   'management' → "Shipment date"  (GAAP — true accrual basis under ASC 606)
//   'cash'       → "Payout date"    (NON-GAAP — cash basis, settlement-anchored)
type AccountingPolicy = 'accrual' | 'management' | 'cash';
type Granularity = 'monthly' | 'quarterly' | 'yearly' | 'settlement';
type SelectedYear = 2024 | 2025 | 2026;

const POLICY_LABELS: Record<AccountingPolicy, string> = {
  accrual: 'Order',
  management: 'Shipment',
  cash: 'Payout',
};

const POLICY_SUBTITLES: Record<AccountingPolicy, string> = {
  accrual: 'When the order was placed',
  management: 'When the order was shipped',
  cash: 'When Amazon paid you',
};

const POLICY_GAAP: Record<AccountingPolicy, { label: string; isGaap: boolean }> = {
  accrual:    { label: 'Non-GAAP · Sales view', isGaap: false },
  management: { label: 'GAAP · Accrual', isGaap: true },
  cash:       { label: 'Non-GAAP · Cash basis', isGaap: false },
};

// Mock settlement periods for Cash basis view
const SETTLEMENT_PERIODS = [
  { key: 'stl_2026_01a', label: 'Jan 1–14', closeDate: '2026-01-14' },
  { key: 'stl_2026_01b', label: 'Jan 15–28', closeDate: '2026-01-28' },
  { key: 'stl_2026_02a', label: 'Feb 1–14', closeDate: '2026-02-14' },
  { key: 'stl_2026_02b', label: 'Feb 15–28', closeDate: '2026-02-28' },
  { key: 'stl_2026_03a', label: 'Mar 1–14', closeDate: '2026-03-14' },
  { key: 'stl_2026_03b', label: 'Mar 15–31', closeDate: '2026-03-31' },
];

interface PeriodColumn {
  key: string;
  label: string;
  sublabel?: string;
  priorKey?: string;
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getPeriodColumns(granularity: Granularity, year: SelectedYear): PeriodColumn[] {
  if (granularity === 'settlement') {
    return SETTLEMENT_PERIODS.map((s) => ({
      key: s.key,
      label: s.label,
      sublabel: s.closeDate.slice(0, 4),
    }));
  }
  if (granularity === 'monthly') {
    return MONTH_KEYS.map((m, i) => ({
      key: `${m}${year}`,
      label: MONTH_LABELS[i],
      sublabel: String(year),
      priorKey: year >= 2025 ? `${m}${year - 1}` : undefined,
    }));
  }
  if (granularity === 'quarterly') {
    return [1, 2, 3, 4].map((q) => ({
      key: `q${q}${year}`,
      label: `Q${q}`,
      sublabel: String(year),
      priorKey: year >= 2025 ? `q${q}${year - 1}` : undefined,
    }));
  }
  return [
    { key: 'fy2023', label: 'FY2023' },
    { key: 'fy2024', label: 'FY2024' },
    { key: 'fy2025', label: 'FY2025' },
    { key: 'fy2026', label: 'FY2026' },
  ];
}

export default function Profitability({ onNavigate }: { onNavigate?: (section: string, sub: string) => void } = {}) {
  const { currency } = useCurrency();
  const [policy, setPolicy] = useState<AccountingPolicy>('accrual');
  const [granularity, setGranularity] = useState<Granularity>('quarterly');
  const [selectedYear, setSelectedYear] = useState<SelectedYear>(2026);
  const [showYoY, setShowYoY] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);
  const [highlightedColumns, setHighlightedColumns] = useState<Set<string>>(new Set());
  const hasHighlights = highlightedColumns.size > 0;
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPolicy, setComparisonPolicy] = useState<AccountingPolicy>('cash');
  const [showBreakdownBar, setShowBreakdownBar] = useState(false);
  const [showVat, setShowVat] = useState(false);

  // When switching policy, reset settlement granularity if leaving cash
  const handlePolicyChange = (p: AccountingPolicy) => {
    if (p !== 'cash' && granularity === 'settlement') {
      setGranularity('quarterly');
    }
    // If entering comparison mode and picking the same policy, switch comparison target
    if (showComparison && p === comparisonPolicy) {
      setComparisonPolicy(p === 'cash' ? 'accrual' : 'cash');
    }
    setPolicy(p);
  };

  const columns = useMemo(() => {
    // Clear highlights when view changes
    setHighlightedColumns(new Set());
    return getPeriodColumns(granularity, selectedYear);
  }, [granularity, selectedYear]);

  // Compute COGS coverage for the partial-profit banner
  const cogsCoverage = useMemo(() => {
    const inventoryShape = inventoryData.map((item) => ({
      sku: item.sku,
      asin: item.asin,
      title: item.title,
      marketplace: item.marketplace as CostMarketplace,
      avgDailySales: item.avgDailySales,
      unitsSold: item.unitsSold,
      currentStock: item.currentStock,
      inbound: item.inbound,
    }));
    const profiles = buildSkuCostProfiles(inventoryShape, demoCostRecords, demoInboundEvents);
    return computeCoverage(profiles);
  }, []);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  // Available granularities depend on policy
  const availableGranularities = useMemo((): Granularity[] => {
    const base: Granularity[] = ['monthly', 'quarterly', 'yearly'];
    if (policy === 'cash') return ['settlement', ...base];
    return base;
  }, [policy]);

  // Cost breakdown bar data — always uses full-year aggregate
  const summaryKey = granularity === 'yearly' ? 'fy2025' : `fy${selectedYear}`;
  const breakdownSegments = useMemo(() => {
    const gross = gorPV[summaryKey] ?? 0;
    if (gross === 0) return [];
    const revAdj = gross - (nrPV[summaryKey] ?? 0);
    const cogs = cogsPV[summaryKey] ?? 0;
    const fees = feesPV[summaryKey] ?? 0;
    const ads = adsPV[summaryKey] ?? 0;
    const oh = ohPV[summaryKey] ?? 0;
    const nop = nopPV[summaryKey] ?? 0;
    return [
      { label: 'Returns & Adj.', value: revAdj, pct: (revAdj / gross) * 100, color: '#F4A261' },
      { label: 'COGS', value: cogs, pct: (cogs / gross) * 100, color: '#E07A5F' },
      { label: 'Amazon Fees', value: fees, pct: (fees / gross) * 100, color: '#BC4749' },
      { label: 'Advertising', value: ads, pct: (ads / gross) * 100, color: '#D4726A' },
      { label: 'Overheads', value: oh, pct: (oh / gross) * 100, color: '#9B5DE5' },
      { label: 'Net Profit', value: nop, pct: (nop / gross) * 100, color: nop >= 0 ? '#16A34A' : '#DC2626' },
    ];
  }, [summaryKey]);

  const cascadeChips = useMemo(() => {
    const pk = summaryKey;
    return [
      { label: 'Product Margin', value: gmPctPV[pk] ?? 0 },
      { label: 'Channel Margin', value: cmPctPV[pk] ?? 0 },
      { label: 'Growth Margin', value: grPctPV[pk] ?? 0 },
      { label: 'Net Margin', value: noPctPV[pk] ?? 0 },
    ];
  }, [summaryKey]);

  const buildExportRows = useCallback((): (string | number)[][] => {
    const headers = ['Line Item', ...columns.map((c) => c.label)];
    const rows: (string | number)[][] = [headers];
    for (const metric of profitabilityData) {
      const indent = metric.indent || 0;
      const label = indent > 0 ? '  '.repeat(indent) + metric.label : metric.label;
      const cells: (string | number)[] = [label];
      for (const col of columns) {
        const val = metric[col.key];
        if (typeof val === 'number') cells.push(val);
        else if (typeof val === 'string') cells.push(val);
        else cells.push('');
      }
      rows.push(cells);
    }
    rows.push([]);
    rows.push(['Generated with clarisix.com — Profitability Statement']);
    return rows;
  }, [columns]);

  const exportToExcel = useCallback(() => {
    const rows = buildExportRows();
    const headers = rows[0] as string[];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = headers.map((h, i) => {
      let maxLen = h.length;
      for (const row of rows) {
        const cellLen = String(row[i] ?? '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      }
      return { wch: Math.min(maxLen + 2, 30) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profitability');
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `clarisix_profitability_${date}.xlsx`);
  }, [buildExportRows]);

  const handleExportSheets = useCallback(async () => {
    const rows = buildExportRows();
    const url = await exportToGoogleSheets(rows, 'Profitability Statement');
    if (url) setSheetsUrl(url);
  }, [buildExportRows]);

  const toggleRow = (label: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedRows(newExpanded);
  };

  const formatValue = (value: number | string, type: ProfitabilityMetric['type']) => {
    if (typeof value === 'string') return value;

    switch (type) {
      case 'currency':
        const converted = convert(value, currency);
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(Math.abs(converted));
        return converted < 0 ? `(${formatted})` : formatted;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'growth':
        return value;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value;
    }
  };

  const getRowStyles = (metric: ProfitabilityMetric) => {
    const { styleType = 'default' } = metric;

    let rowClasses = '';
    let labelClasses = '';
    let cellClasses = 'px-3 py-0.5 text-xs tabular-nums text-right whitespace-nowrap';

    switch (styleType) {
      case 'header':
        rowClasses = 'bg-gray-100 border-t-2 border-gray-300';
        labelClasses = 'font-bold text-gray-900 text-[15px]';
        cellClasses += ' font-semibold text-gray-900';
        break;
      case 'total':
        rowClasses = 'bg-cx-50 border-t-2 border-b-2 border-cx-300';
        labelClasses = 'font-bold text-gray-900 text-[15px]';
        cellClasses += ' font-bold text-gray-900';
        break;
      case 'subtotal':
        rowClasses = 'bg-gray-50 border-t border-gray-300';
        labelClasses = 'font-semibold text-gray-900';
        cellClasses += ' font-semibold text-gray-900';
        break;
      case 'ratio':
        rowClasses = 'bg-white';
        labelClasses = 'font-normal text-gray-600 text-[13px] italic';
        cellClasses += ' font-normal text-gray-600';
        break;
      case 'sub-item':
        rowClasses = 'bg-white';
        labelClasses = 'font-normal text-gray-700';
        cellClasses += ' font-normal text-gray-700';
        break;
      default:
        rowClasses = 'bg-white hover:bg-gray-50';
        labelClasses = 'font-normal text-gray-900';
        cellClasses += ' font-normal text-gray-800';
    }

    return { rowClasses, labelClasses, cellClasses };
  };

  const renderCell = (metric: ProfitabilityMetric, key: keyof ProfitabilityMetric, cellClasses: string) => {
    const value = metric[key];
    if (typeof value !== 'number' && typeof value !== 'string') return null;

    const isNegative = typeof value === 'number' && value < 0;
    const finalClasses = `${cellClasses} ${isNegative && metric.type === 'currency' ? 'text-red-700' : ''}`;

    return (
      <td className={finalClasses}>
        {formatValue(value, metric.type)}
      </td>
    );
  };

  const renderYoYDelta = (metric: ProfitabilityMetric, col: PeriodColumn) => {
    if (!showYoY || !col.priorKey || metric.type === 'percentage' || metric.type === 'growth') return null;
    const current = metric[col.key];
    const prior = metric[col.priorKey];
    if (typeof current !== 'number' || typeof prior !== 'number' || prior === 0) return null;
    const delta = ((current - prior) / Math.abs(prior)) * 100;
    // For cost lines (negative = good), flip the color logic
    const isCostLine = metric.type === 'currency' && (current < 0 || prior < 0);
    const isGood = isCostLine ? delta <= 0 : delta >= 0;
    return (
      <span className={`ml-1 text-[9px] font-medium ${isGood ? 'text-green-700' : 'text-red-600'}`}>
        {delta > 0 ? '▲' : '▼'}{Math.abs(delta).toFixed(0)}%
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {cogsCoverage.revenueCoverage < 100 && (
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-[11px] text-amber-900">
              <span className="font-semibold">{100 - cogsCoverage.revenueCoverage}% of revenue has unknown COGS.</span>
              {' '}Profit and margin shown below are partial — {cogsCoverage.needsCostCount} active SKU{cogsCoverage.needsCostCount !== 1 ? 's' : ''} need a cost.
            </span>
          </div>
          <button
            onClick={() => onNavigate?.('Settings', 'costs')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md transition-colors flex-shrink-0"
          >
            Open COGS Coverage
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">Profitability Statement</h2>
              <InfoTooltip />
              {/* Active policy badge — date-of-event + GAAP marker */}
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-900 text-white">
                {POLICY_LABELS[policy]} date
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                  POLICY_GAAP[policy].isGaap
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
                title={POLICY_GAAP[policy].isGaap
                  ? 'GAAP-aligned. Revenue recognized when control transfers to the customer (shipment) per ASC 606.'
                  : policy === 'accrual'
                    ? 'Non-GAAP. Sales view — revenue recognized when the order was placed. Useful for marketers and operators; not GAAP-compliant.'
                    : 'Non-GAAP. Cash basis — revenue recognized when Amazon settles your payout. Useful for cash-flow reconciliation.'}
              >
                {POLICY_GAAP[policy].label}
              </span>
              <span className="text-[11px] text-gray-500">
                · {POLICY_SUBTITLES[policy]}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              All revenue figures exclude VAT — buyer VAT is collected and remitted by Amazon, not income. See the VAT / Tax Memo below.
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportSheets}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Sheet className="w-3 h-3" />
              <span>Sheets</span>
            </button>
            {sheetsUrl && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onClick={() => setSheetsUrl(null)}>
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Sheet className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Data copied to clipboard</h4>
                  <p className="text-xs text-gray-500 mb-3">Click below to open a new Google Sheet, then paste with <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono font-semibold">⌘V</kbd></p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setSheetsUrl(null)} className="text-xs font-semibold text-gray-400 hover:text-gray-600">Cancel</button>
                    <button
                      onClick={() => { window.open(sheetsUrl, '_blank'); setSheetsUrl(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-cx-500 text-white text-xs font-semibold rounded-lg hover:bg-cx-600 transition-colors"
                    >
                      <Sheet className="w-3.5 h-3.5" />
                      Open Google Sheets
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Policy switcher — most prominent control */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 gap-0.5">
            {(['accrual', 'management', 'cash'] as AccountingPolicy[]).map((p) => {
              const isActive = policy === p;
              const isGaap = POLICY_GAAP[p].isGaap;
              return (
                <button
                  key={p}
                  onClick={() => handlePolicyChange(p)}
                  title={POLICY_GAAP[p].label + ' — ' + POLICY_SUBTITLES[p]}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{POLICY_LABELS[p]}</span>
                  <span
                    className={`text-[8px] font-bold tracking-wider px-1 py-0.5 rounded ${
                      isActive
                        ? isGaap
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                        : isGaap
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isGaap ? 'GAAP' : 'NON-GAAP'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* P&L view controls — hidden in the Payout view, which is a settlement reconciliation, not a time-series P&L */}
          {policy !== 'cash' && <>
          <div className="w-px h-5 bg-gray-300" />

          {/* Granularity segmented control */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {availableGranularities.map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                  granularity === g
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Year picker — only for monthly/quarterly (not settlement or yearly) */}
          {granularity !== 'yearly' && granularity !== 'settlement' && (
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {([2024, 2025, 2026] as SelectedYear[]).map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    selectedYear === y
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* YoY toggle — only when comparison is possible */}
          {(granularity !== 'yearly' && granularity !== 'settlement' && selectedYear >= 2025) && (
            <button
              onClick={() => setShowYoY(!showYoY)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                showYoY
                  ? 'bg-cx-50 border-cx-300 text-cx-700'
                  : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              YoY
            </button>
          )}

          {/* Policy comparison toggle */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              showComparison
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
            }`}
          >
            Compare
          </button>

          {/* Comparison policy picker */}
          {showComparison && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-gray-400 font-medium">vs</span>
              <select
                value={comparisonPolicy}
                onChange={(e) => setComparisonPolicy(e.target.value as AccountingPolicy)}
                className="text-[11px] font-semibold border border-purple-300 rounded-md px-1.5 py-1 bg-purple-50 text-purple-700 cursor-pointer"
              >
                {(['accrual', 'management', 'cash'] as AccountingPolicy[])
                  .filter((p) => p !== policy)
                  .map((p) => (
                    <option key={p} value={p}>{POLICY_LABELS[p]}</option>
                  ))}
              </select>
            </div>
          )}

          {hasHighlights && (
            <button
              onClick={() => setHighlightedColumns(new Set())}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-cx-300 bg-cx-50 text-cx-700 hover:bg-cx-100 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear ({highlightedColumns.size})
            </button>
          )}
          </>}

          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {policy === 'cash' ? 'Settlement reconciliation · 2026'
                : granularity === 'monthly' ? `Monthly · ${selectedYear}`
                : granularity === 'quarterly' ? `Quarterly · ${selectedYear}`
                : 'Yearly · FY2023–FY2026'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Cost Breakdown Strip (cascade chips always visible, breakdown bar collapsible) ── */}
      {policy !== 'cash' && breakdownSegments.length > 0 && (
        <div className="px-5 py-1.5 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-3">
            {/* Cascade margin chips — always visible */}
            <div className="flex items-center flex-wrap">
              {cascadeChips.map((chip, i) => (
                <div key={i} className="flex items-center">
                  {i > 0 && <span className="mx-1.5 text-gray-300 text-[10px]">→</span>}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{chip.label}</span>
                    <span className={`text-[11px] font-extrabold ${
                      chip.value >= 20 ? 'text-green-700' : chip.value >= 10 ? 'text-yellow-700' : chip.value >= 0 ? 'text-orange-700' : 'text-red-700'
                    }`}>
                      {chip.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Toggle */}
            <button
              onClick={() => setShowBreakdownBar(!showBreakdownBar)}
              className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showBreakdownBar ? 'rotate-180' : ''}`} />
              Where each {CURRENCY_SYMBOLS[currency]}1 goes
            </button>
          </div>

          {/* Collapsible breakdown bar */}
          {showBreakdownBar && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-[9px] text-gray-400 mb-1">FY{granularity === 'yearly' ? '2025' : selectedYear}</div>

              {/* Stacked bar */}
              <div className="relative">
                <div className="flex h-5 rounded-md overflow-hidden shadow-inner">
                  {breakdownSegments.map((seg, i) => (
                    <div
                      key={i}
                      className="relative flex items-center justify-center transition-opacity duration-150"
                      style={{
                        width: `${Math.abs(seg.pct)}%`,
                        backgroundColor: seg.color,
                        opacity: hoveredSegment !== null && hoveredSegment !== i ? 0.5 : 1,
                      }}
                      onMouseEnter={() => setHoveredSegment(i)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {Math.abs(seg.pct) >= 6 && (
                        <span className="text-[10px] font-bold text-white drop-shadow-sm truncate px-1">
                          {CURRENCY_SYMBOLS[currency]}{(Math.abs(seg.pct) / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Hover tooltip */}
                {hoveredSegment !== null && breakdownSegments[hoveredSegment] && (
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-[52px] z-30 pointer-events-none">
                    <div className="bg-gray-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: breakdownSegments[hoveredSegment].color }} />
                      <span className="font-semibold">{breakdownSegments[hoveredSegment].label}</span>
                      <span className="text-white font-bold">
                        {CURRENCY_SYMBOLS[currency]}{(Math.abs(breakdownSegments[hoveredSegment].pct) / 100).toFixed(2)}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-300">
                        {Math.abs(breakdownSegments[hoveredSegment].pct).toFixed(1)}%
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-400">
                        {(() => {
                          const v = convert(breakdownSegments[hoveredSegment].value, currency);
                          return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(v));
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Segment legend (below bar) */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                {breakdownSegments.map((seg, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 cursor-default"
                    onMouseEnter={() => setHoveredSegment(i)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className={`text-[10px] ${hoveredSegment === i ? 'text-gray-900 font-semibold' : 'text-gray-500'} transition-colors`}>
                      {seg.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {policy === 'cash' ? (
        <SettlementPostingBridge />
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-700 text-white border-b-2 border-slate-800">
            {/* Comparison mode: policy label row */}
            {showComparison && (
              <tr className="bg-slate-800">
                <th className="sticky left-0 z-10 bg-slate-800 px-3 py-1 text-left" />
                {columns.map((col) => (
                  <th key={`${col.key}_pri`} colSpan={1} className="px-3 py-1 text-right text-[10px] font-bold uppercase tracking-wider text-slate-300 border-r border-slate-600">
                    {POLICY_LABELS[policy]}
                  </th>
                ))}
                {columns.map((col) => (
                  <th key={`${col.key}_cmp`} colSpan={1} className="px-3 py-1 text-right text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    {POLICY_LABELS[comparisonPolicy]}
                  </th>
                ))}
              </tr>
            )}
            <tr>
              <th className="sticky left-0 z-10 bg-slate-700 px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider min-w-[260px]">
                Line Item
              </th>
              {columns.map((col) => {
                const isHL = highlightedColumns.has(col.key);
                const isDimmed = hasHighlights && !isHL;
                return (
                  <th
                    key={col.key}
                    onClick={() => setHighlightedColumns((prev) => {
                      const next = new Set(prev);
                      if (next.has(col.key)) next.delete(col.key);
                      else next.add(col.key);
                      return next;
                    })}
                    className={`px-3 py-1.5 text-right text-[11px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none transition-colors duration-200 ${
                      isHL
                        ? 'bg-cx-500 text-white'
                        : isDimmed
                          ? 'bg-slate-700 opacity-40'
                          : 'bg-slate-700 hover:bg-slate-600'
                    } ${showComparison ? 'border-r border-slate-600' : ''}`}
                  >
                    <div>{col.label}</div>
                    {col.sublabel && <div className={`text-[10px] font-normal mt-0.5 ${isHL ? 'text-cx-100' : 'text-slate-400'}`}>{col.sublabel}</div>}
                  </th>
                );
              })}
              {/* Comparison columns */}
              {showComparison && columns.map((col) => (
                <th
                  key={`${col.key}_cmp`}
                  className="px-3 py-1.5 text-right text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-slate-600 text-purple-200"
                >
                  <div>{col.label}</div>
                  {col.sublabel && <div className="text-[10px] font-normal mt-0.5 text-slate-400">{col.sublabel}</div>}
                </th>
              ))}
              {/* Delta column header */}
              {showComparison && (
                <th className="px-3 py-1.5 text-right text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-purple-900 text-purple-200">
                  <div>Timing</div>
                  <div className="text-[10px] font-normal mt-0.5 text-purple-400">Difference</div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {profitabilityData.filter((metric) =>
              !metric.parentGroup || expandedRows.has(metric.parentGroup)
            ).map((metric) => {
              const { rowClasses, labelClasses, cellClasses } = getRowStyles(metric);
              const indent = metric.indent || 0;

              return (
                <tr key={metric.label} className={rowClasses}>
                  <td className={`sticky left-0 z-10 px-3 py-0.5 text-xs ${labelClasses} ${rowClasses}`}>
                    <div className="flex items-center gap-1" style={{ paddingLeft: `${indent * 14}px` }}>
                      {metric.isExpandable && (
                        <button
                          onClick={() => toggleRow(metric.label)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <ChevronRight className={`w-3 h-3 transition-transform ${expandedRows.has(metric.label) ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                      {!metric.isExpandable && metric.indent === 0 && <span className="w-3"></span>}
                      <span>{metric.label}</span>
                      {PL_TOOLTIPS[metric.label] && (
                        <InfoTooltip content={PL_TOOLTIPS[metric.label]} wide />
                      )}
                    </div>
                  </td>

                  {columns.map((col) => {
                    const value = metric[col.key];
                    const isHL = highlightedColumns.has(col.key);
                    const isDimmed = hasHighlights && !isHL;
                    if (typeof value !== 'number' && typeof value !== 'string') {
                      return <td key={col.key} className={`${cellClasses} ${isHL ? 'bg-cx-50/80' : ''} ${isDimmed ? 'opacity-40' : ''} ${showComparison ? 'border-r border-gray-200' : ''}`} />;
                    }
                    const isNegative = typeof value === 'number' && value < 0;
                    const tdClasses = `${cellClasses} ${isNegative && metric.type === 'currency' ? 'text-red-700' : ''} ${isHL ? 'bg-cx-50/80' : ''} ${isDimmed ? 'opacity-40' : ''} ${showComparison ? 'border-r border-gray-200' : ''}`;
                    return (
                      <td key={col.key} className={tdClasses}>
                        {formatValue(value, metric.type)}
                        {renderYoYDelta(metric, col)}
                      </td>
                    );
                  })}

                  {/* Comparison policy cells — simulated with slight offset */}
                  {showComparison && columns.map((col) => {
                    const baseValue = metric[col.key];
                    if (typeof baseValue !== 'number') {
                      return <td key={`${col.key}_cmp`} className={`${cellClasses} bg-purple-50/30`} />;
                    }
                    // Simulate timing difference: cash lags accrual by ~2-5%
                    const offset = policy === 'accrual' && comparisonPolicy === 'cash'
                      ? 0.97 : policy === 'management' ? 1.01 : 0.99;
                    const cmpValue = metric.type === 'percentage' || metric.type === 'growth'
                      ? baseValue + (Math.random() * 2 - 1) * 0.3
                      : Math.round(baseValue * offset * 10) / 10;
                    const isNegative = cmpValue < 0;
                    return (
                      <td key={`${col.key}_cmp`} className={`${cellClasses} bg-purple-50/30 ${isNegative && metric.type === 'currency' ? 'text-red-700' : ''}`}>
                        {formatValue(cmpValue, metric.type)}
                      </td>
                    );
                  })}

                  {/* Delta column */}
                  {showComparison && (() => {
                    // Use the first column with data for the summary delta
                    const firstCol = columns.find((c) => typeof metric[c.key] === 'number');
                    if (!firstCol || typeof metric[firstCol.key] !== 'number') {
                      return <td className={`${cellClasses} bg-purple-50/20`} />;
                    }
                    const base = metric[firstCol.key] as number;
                    const offset = policy === 'accrual' && comparisonPolicy === 'cash' ? 0.97 : 1.03;
                    const cmp = metric.type === 'percentage' || metric.type === 'growth'
                      ? base : Math.round(base * offset * 10) / 10;
                    const diff = base - cmp;
                    if (metric.type === 'percentage' || metric.type === 'growth') {
                      return <td className={`${cellClasses} bg-purple-50/20 text-purple-700 font-medium`}>—</td>;
                    }
                    return (
                      <td className={`${cellClasses} bg-purple-50/20 ${Math.abs(diff) < 1 ? 'text-gray-400' : 'text-purple-700'} font-medium`}>
                        {diff > 0 ? '+' : ''}{formatValue(diff, metric.type)}
                      </td>
                    );
                  })()}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* ── VAT / Tax Memo (pass-through — excluded from Net Operating Profit) — accrual P&L only; the Payout view posts VAT in its journal instead ── */}
      {policy !== 'cash' && (
      <div className="px-5 py-2.5 border-t border-gray-200 bg-gradient-to-r from-violet-50/40 to-white">
        <button
          onClick={() => setShowVat(!showVat)}
          className="flex items-center gap-2 w-full text-left"
        >
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${showVat ? 'rotate-180' : ''}`} />
          <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">VAT / Tax Memo</h3>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-violet-100 text-violet-700 border border-violet-200">
            Doesn’t affect your profit
          </span>
          <span className="text-[10px] text-gray-400 font-normal normal-case">Estimated at {VAT_RATE_PCT}%</span>
        </button>

        {showVat && (
          <div className="mt-2">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 z-10 bg-white px-3 py-1 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 min-w-[260px]">
                      VAT Line
                    </th>
                    {columns.map((col) => (
                      <th key={col.key} className="px-3 py-1 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                        <div>{col.label}</div>
                        {col.sublabel && <div className="text-[9px] font-normal text-gray-400">{col.sublabel}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vatMemoData.map((row) => {
                    const rowClass = row.style === 'total'
                      ? 'bg-violet-50 border-t-2 border-violet-200'
                      : row.style === 'subtotal'
                        ? 'bg-gray-50 border-t border-gray-200'
                        : 'bg-white';
                    const labelClass = row.style ? 'font-semibold text-gray-900' : 'font-normal text-gray-700';
                    return (
                      <tr key={row.label} className={rowClass}>
                        <td className={`sticky left-0 z-10 px-3 py-0.5 text-xs ${labelClass} ${rowClass}`}>
                          <div className="flex items-center gap-1" style={{ paddingLeft: `${(row.indent || 0) * 14}px` }}>
                            <span>{row.label}</span>
                            {row.tooltip && <InfoTooltip content={row.tooltip} wide />}
                          </div>
                        </td>
                        {columns.map((col) => {
                          const v = row.pv[col.key];
                          if (typeof v !== 'number') return <td key={col.key} className="px-3 py-0.5" />;
                          // In a VAT memo a negative is favourable (remittance clearing / reclaim), so colour it green not red.
                          const isReclaim = convert(v, currency) < 0;
                          return (
                            <td
                              key={col.key}
                              className={`px-3 py-0.5 text-xs tabular-nums text-right whitespace-nowrap ${row.style ? 'font-semibold' : 'font-normal'} ${isReclaim ? 'text-emerald-700' : 'text-gray-800'}`}
                            >
                              {formatValue(v, 'currency')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500 leading-relaxed max-w-4xl">
              The VAT your buyers pay is collected and sent to the tax authority by Amazon (EU &amp; UK) — it’s not your money, so it never counts as sales or profit.
              The VAT Amazon charges on its fees and ads is usually something you can claim back if you’re VAT-registered, which normally leaves the tax authority owing{' '}
              <span className="font-semibold text-emerald-700">you a refund</span> (shown in green). <span className="font-medium text-gray-600">Your profit above doesn’t change.</span>{' '}
              These are estimates at the {VAT_RATE_PCT}% standard rate — your real figures depend on whether you’re VAT-registered and where you sell.
            </p>
          </div>
        )}
      </div>
      )}

      <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-[11px] text-gray-600">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-cx-300"></div>
              <span>Key metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-700 font-medium">({CURRENCY_SYMBOLS[currency]}X,XXX.X)</span>
              <span>Negative values</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="italic">Italics</span>
              <span>Ratios & percentages</span>
            </div>
            {showYoY && granularity !== 'yearly' && granularity !== 'settlement' && selectedYear >= 2025 && (
              <div className="flex items-center gap-2">
                <span className="text-green-700 font-medium">▲ / <span className="text-red-600">▼</span></span>
                <span>YoY vs {selectedYear - 1}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <span>{POLICY_LABELS[policy]} date · {POLICY_GAAP[policy].isGaap ? 'GAAP' : 'Non-GAAP'} · {currency}</span>
            <LastRefreshed offsetMinutes={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
