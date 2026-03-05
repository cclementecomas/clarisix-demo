import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Info, Table2, TrendingUp, Download, Sheet } from 'lucide-react';
import { profitabilityData, ProfitabilityMetric } from '../data/profitabilityData';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';
import { useCurrency, CURRENCY_SYMBOLS, CONVERSION_RATES } from '../contexts/CurrencyContext';
import { convert } from '../utils/currency';
import * as XLSX from 'xlsx';
import { exportToGoogleSheets } from '../utils/exportSheets';

type ColumnView = 'summary' | 'all';
type ComparisonView = 'yoy' | 'none';

export default function Profitability() {
  const { currency } = useCurrency();
  const [columnView, setColumnView] = useState<ColumnView>('summary');
  const [comparisonView, setComparisonView] = useState<ComparisonView>('yoy');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);

  const buildExportRows = useCallback((): (string | number)[][] => {
    const headers = ['Line Item', "YTD '25", "YTD '24", "LTM '25", "PTM '24", "L3M '25", "P3M '24", 'Total', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025'];
    const keys: (keyof ProfitabilityMetric)[] = ['ytd25', 'ytd24', 'ltm25', 'ptm24', 'l3m25', 'p3m24', 'total', 'nov2024', 'dec2024', 'jan2025', 'feb2025'];
    const rows: (string | number)[][] = [headers];

    for (const metric of profitabilityData) {
      const indent = metric.indent || 0;
      const label = indent > 0 ? '  '.repeat(indent) + metric.label : metric.label;
      const cells: (string | number)[] = [label];
      for (const key of keys) {
        const val = metric[key];
        if (typeof val === 'number') cells.push(val);
        else if (typeof val === 'string') cells.push(val);
        else cells.push('');
      }
      rows.push(cells);
    }

    rows.push([]);
    rows.push(['Generated with clarisix.com — Profitability Statement']);
    return rows;
  }, []);

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

  const renderGrowthIndicator = (value: number | string) => {
    if (typeof value === 'string' || value === 0) return null;

    const isPositive = value > 0;
    return (
      <span className={`ml-2 text-xs font-medium ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
        {isPositive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
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
            <p className="text-sm text-gray-600 mt-1">CFO-level 43-line P&L waterfall from Gross Revenue to Net Operating Profit</p>
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

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setColumnView(columnView === 'summary' ? 'all' : 'summary')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <Table2 className="w-4 h-4" />
              <span>{columnView === 'summary' ? 'Summary columns' : 'All columns'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setComparisonView(comparisonView === 'yoy' ? 'none' : 'yoy')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{comparisonView === 'yoy' ? 'Year over year growth' : 'No comparison'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-700 text-white border-b-2 border-slate-800">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-700 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider min-w-[280px]">
                Line Item
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                YTD '25
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                YTD '24
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                LTM '25
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                PTM '24
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                L3M '25
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                P3M '24
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-slate-800">
                Total
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                Nov 2024
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                Dec 2024
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                Jan 2025
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                Feb 2025
              </th>
            </tr>
          </thead>
          <tbody>
            {profitabilityData.filter((metric) =>
              !metric.parentGroup || expandedRows.has(metric.parentGroup)
            ).map((metric, index) => {
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
                          {expandedRows.has(metric.label) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {!metric.isExpandable && metric.indent === 0 && <span className="w-4"></span>}
                      <span>{metric.label}</span>
                      {metric.hasInfo && (
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      {metric.type === 'growth' && comparisonView === 'yoy' &&
                        renderGrowthIndicator(metric.ytd25)}
                    </div>
                  </td>

                  {renderCell(metric, 'ytd25', cellClasses)}
                  {renderCell(metric, 'ytd24', cellClasses)}
                  {renderCell(metric, 'ltm25', cellClasses)}
                  {renderCell(metric, 'ptm24', cellClasses)}
                  {renderCell(metric, 'l3m25', cellClasses)}
                  {renderCell(metric, 'p3m24', cellClasses)}
                  {renderCell(metric, 'total', `${cellClasses} ${metric.styleType === 'total' ? 'bg-slate-100 font-bold' : metric.styleType === 'header' ? 'bg-gray-200' : ''}`)}
                  {renderCell(metric, 'nov2024', cellClasses)}
                  {renderCell(metric, 'dec2024', cellClasses)}
                  {renderCell(metric, 'jan2025', cellClasses)}
                  {renderCell(metric, 'feb2025', cellClasses)}
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
