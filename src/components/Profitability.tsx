import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, TrendingUp, Download, Sheet, Calendar, X } from 'lucide-react';
import {
  profitabilityData, ProfitabilityMetric, PL_TOOLTIPS,
  grossOrderedRevenue as gorPV, netRevenue as nrPV, netCogs as cogsPV,
  totalAmazonFees as feesPV, totalAdvertising as adsPV,
  allocatedOverheads as ohPV, netOperatingProfit as nopPV,
  grossMarginPct as gmPctPV, channelMarginPct as cmPctPV,
  growthMarginPct as grPctPV, netOperatingMarginPct as noPctPV,
} from '../data/profitabilityData';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';
import { useCurrency, CURRENCY_SYMBOLS } from '../contexts/CurrencyContext';
import { convert } from '../utils/currency';
import * as XLSX from 'xlsx';
import { exportToGoogleSheets } from '../utils/exportSheets';

type Granularity = 'monthly' | 'quarterly' | 'yearly';
type SelectedYear = 2024 | 2025 | 2026;

interface PeriodColumn {
  key: string;
  label: string;
  sublabel?: string;
  priorKey?: string;
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getPeriodColumns(granularity: Granularity, year: SelectedYear): PeriodColumn[] {
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

export default function Profitability() {
  const { currency } = useCurrency();
  const [granularity, setGranularity] = useState<Granularity>('quarterly');
  const [selectedYear, setSelectedYear] = useState<SelectedYear>(2026);
  const [showYoY, setShowYoY] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);
  const [highlightedColumns, setHighlightedColumns] = useState<Set<string>>(new Set());
  const hasHighlights = highlightedColumns.size > 0;

  const columns = useMemo(() => {
    // Clear highlights when view changes
    setHighlightedColumns(new Set());
    return getPeriodColumns(granularity, selectedYear);
  }, [granularity, selectedYear]);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

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
    let cellClasses = 'px-4 py-2.5 text-sm tabular-nums text-right whitespace-nowrap';

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
      <span className={`block text-[10px] font-medium leading-tight mt-0.5 ${isGood ? 'text-green-700' : 'text-red-600'}`}>
        {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% YoY
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">Profitability Statement</h2>
              <InfoTooltip />
            </div>
            <p className="text-sm text-gray-600 mt-1">CFO-level P&L waterfall from Gross Revenue to Net Operating Profit</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>
            <button
              onClick={handleExportSheets}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Sheet className="w-4 h-4" />
              <span>Google Sheets</span>
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
          {/* Granularity segmented control */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(['monthly', 'quarterly', 'yearly'] as Granularity[]).map((g) => (
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

          {/* Year picker — only for monthly/quarterly */}
          {granularity !== 'yearly' && (
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
          {(granularity !== 'yearly' && selectedYear >= 2025) && (
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

          {hasHighlights && (
            <button
              onClick={() => setHighlightedColumns(new Set())}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-cx-300 bg-cx-50 text-cx-700 hover:bg-cx-100 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear ({highlightedColumns.size})
            </button>
          )}

          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {granularity === 'monthly' ? `Monthly · ${selectedYear}` : granularity === 'quarterly' ? `Quarterly · ${selectedYear}` : 'Yearly · FY2023–FY2026'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Cost Breakdown Bar ──────────────────────────────────────────── */}
      {breakdownSegments.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Where each {CURRENCY_SYMBOLS[currency]}1 goes</span>
            <span className="text-[10px] text-gray-400">({granularity === 'yearly' ? 'FY2025' : `FY${selectedYear}`})</span>
          </div>

          {/* Stacked bar */}
          <div className="relative">
            <div className="flex h-7 rounded-lg overflow-hidden shadow-inner">
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
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

          {/* Cascade margin chips */}
          <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
            {cascadeChips.map((chip, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && <span className="mx-2 text-gray-300 text-xs">→</span>}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{chip.label}</span>
                  <span className={`text-[11px] font-extrabold ${
                    chip.value >= 20 ? 'text-green-700' : chip.value >= 10 ? 'text-yellow-700' : chip.value >= 0 ? 'text-orange-700' : 'text-red-700'
                  }`}>
                    {chip.value.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-700 text-white border-b-2 border-slate-800">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-700 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider min-w-[280px]">
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
                    className={`px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none transition-colors duration-200 ${
                      isHL
                        ? 'bg-cx-500 text-white'
                        : isDimmed
                          ? 'bg-slate-700 opacity-40'
                          : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <div>{col.label}</div>
                    {col.sublabel && <div className={`text-[10px] font-normal mt-0.5 ${isHL ? 'text-cx-100' : 'text-slate-400'}`}>{col.sublabel}</div>}
                  </th>
                );
              })}
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
                  <td className={`sticky left-0 z-10 px-4 py-2.5 text-sm ${labelClasses} ${rowClasses}`}>
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${indent * 24}px` }}>
                      {metric.isExpandable && (
                        <button
                          onClick={() => toggleRow(metric.label)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${expandedRows.has(metric.label) ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                      {!metric.isExpandable && metric.indent === 0 && <span className="w-4"></span>}
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
                      return <td key={col.key} className={`${cellClasses} ${isHL ? 'bg-cx-50/80' : ''} ${isDimmed ? 'opacity-40' : ''}`} />;
                    }
                    const isNegative = typeof value === 'number' && value < 0;
                    const tdClasses = `${cellClasses} ${isNegative && metric.type === 'currency' ? 'text-red-700' : ''} ${isHL ? 'bg-cx-50/80' : ''} ${isDimmed ? 'opacity-40' : ''}`;
                    return (
                      <td key={col.key} className={tdClasses}>
                        {formatValue(value, metric.type)}
                        {renderYoYDelta(metric, col)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
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
            {showYoY && granularity !== 'yearly' && selectedYear >= 2025 && (
              <div className="flex items-center gap-2">
                <span className="text-green-700 font-medium">▲ / <span className="text-red-600">▼</span></span>
                <span>YoY vs {selectedYear - 1}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <span>All amounts in {currency}</span>
            <LastRefreshed offsetMinutes={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
