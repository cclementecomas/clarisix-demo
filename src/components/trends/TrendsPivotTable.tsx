import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { LineChart as LineChartIcon, TrendingUp, TrendingDown, Minus, X, Download, Image as ImageIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import type { TrendRow, TrendMetricOption } from '../../data/trendsData';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import SelectionStats from '../deepdive/SelectionStats';
import LastRefreshed from '../LastRefreshed';

interface TrendsPivotTableProps {
  title: string;
  periods: string[];
  rows: TrendRow[];
  metricInfo: TrendMetricOption;
}

interface CellPos {
  row: number;
  col: number;
}

interface SelectedCell {
  rowIndex: number;
  colIndex: number;
  value: number;
}

function formatCellValue(
  value: number,
  metricInfo: TrendMetricOption,
  currency: Parameters<typeof fc>[1],
  isTotal?: boolean,
): string {
  if (metricInfo.isCurrency) {
    if (isTotal && Math.abs(value) >= 1000) {
      return fc(value, currency, { compact: true });
    }
    return fc(value, currency, { compact: false, decimals: 0 });
  }
  if (metricInfo.isPercent) {
    return `${value.toFixed(1)}%`;
  }
  if (metricInfo.suffix) {
    return `${value.toFixed(2)}${metricInfo.suffix}`;
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function getCellHeatColor(value: number, min: number, max: number): string {
  if (max === min) return 'rgba(14, 90, 138, 0.08)';
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const alpha = 0.06 + ratio * 0.30;
  return `rgba(14, 90, 138, ${alpha.toFixed(2)})`;
}

function getRectCells(
  start: CellPos,
  end: CellPos,
  rows: TrendRow[],
  periods: string[],
): SelectedCell[] {
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const cells: SelectedCell[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const period = periods[c];
      const val = rows[r]?.values[period];
      if (val != null && !isNaN(val)) {
        cells.push({ rowIndex: r, colIndex: c, value: val });
      }
    }
  }
  return cells;
}

function linearRegression(values: number[]) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, predict: (x: number) => values[0] ?? 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, predict: (_x: number) => sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: (x: number) => intercept + slope * x };
}

interface TrendInfo {
  slope: number;
  normalizedSlope: number;
  color: string;
  icon: typeof TrendingUp;
  label: string;
  predict: (x: number) => number;
}

function getTrendInfo(values: number[]): TrendInfo {
  const reg = linearRegression(values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const normalized = avg !== 0 ? (reg.slope / avg) * 100 : 0;

  if (normalized > 2) return { slope: reg.slope, normalizedSlope: normalized, color: 'text-emerald-600', icon: TrendingUp, label: 'Strong up', predict: reg.predict };
  if (normalized > 0.5) return { slope: reg.slope, normalizedSlope: normalized, color: 'text-emerald-500', icon: TrendingUp, label: 'Up', predict: reg.predict };
  if (normalized > -0.5) return { slope: reg.slope, normalizedSlope: normalized, color: 'text-amber-500', icon: Minus, label: 'Flat', predict: reg.predict };
  if (normalized > -2) return { slope: reg.slope, normalizedSlope: normalized, color: 'text-orange-500', icon: TrendingDown, label: 'Down', predict: reg.predict };
  return { slope: reg.slope, normalizedSlope: normalized, color: 'text-red-500', icon: TrendingDown, label: 'Strong down', predict: reg.predict };
}

export default function TrendsPivotTable({ title, periods, rows, metricInfo }: TrendsPivotTableProps) {
  const { currency } = useCurrency();
  const [chartRow, setChartRow] = useState<TrendRow | null>(null);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [showHint, setShowHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const chartExportRef = useRef<HTMLDivElement>(null);

  const dragStart = useRef<CellPos | null>(null);
  const isDragging = useRef(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const periodsRef = useRef(periods);
  periodsRef.current = periods;

  useEffect(() => {
    setSelectedCells([]);
    setChartRow(null);
  }, [metricInfo, rows, periods]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, rowIdx: number, colIdx: number) => {
      if (e.button !== 0) return;
      e.preventDefault();

      if (!hasInteracted) {
        setHasInteracted(true);
        setShowHint(false);
      }

      dragStart.current = { row: rowIdx, col: colIdx };
      isDragging.current = true;

      const period = periodsRef.current[colIdx];
      const val = rowsRef.current[rowIdx]?.values[period];
      if (val == null || isNaN(val)) return;

      if (e.ctrlKey || e.metaKey) {
        setSelectedCells(prev => {
          const exists = prev.find(c => c.rowIndex === rowIdx && c.colIndex === colIdx);
          if (exists) return prev.filter(c => !(c.rowIndex === rowIdx && c.colIndex === colIdx));
          return [...prev, { rowIndex: rowIdx, colIndex: colIdx, value: val }];
        });
      } else {
        setSelectedCells(prev => {
          const exists = prev.length === 1 && prev[0].rowIndex === rowIdx && prev[0].colIndex === colIdx;
          if (exists) return [];
          return [{ rowIndex: rowIdx, colIndex: colIdx, value: val }];
        });
      }
    },
    [hasInteracted],
  );

  const handleMouseEnter = useCallback((rowIdx: number, colIdx: number) => {
    if (!isDragging.current || !dragStart.current) return;
    const cells = getRectCells(
      dragStart.current,
      { row: rowIdx, col: colIdx },
      rowsRef.current,
      periodsRef.current,
    );
    setSelectedCells(cells);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
      dragStart.current = null;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  const selectedValues = useMemo(() => selectedCells.map(c => c.value), [selectedCells]);
  const selectedCellKeys = useMemo(
    () => new Set(selectedCells.map(c => `${c.rowIndex}-${c.colIndex}`)),
    [selectedCells],
  );

  const { allValues, periodTotals, grandTotal } = useMemo(() => {
    const vals: number[] = [];
    const pTotals: Record<string, number> = {};
    let gTotal = 0;

    for (const period of periods) {
      pTotals[period] = 0;
    }

    for (const row of rows) {
      for (const period of periods) {
        const v = row.values[period] ?? 0;
        vals.push(v);
        pTotals[period] += v;
      }
      gTotal += row.total;
    }

    if (metricInfo.isPercent || metricInfo.suffix) {
      for (const period of periods) {
        pTotals[period] = pTotals[period] / rows.length;
      }
      gTotal = gTotal / rows.length;
    }

    return { allValues: vals, periodTotals: pTotals, grandTotal: gTotal };
  }, [rows, periods, metricInfo]);

  const rowTrends = useMemo(
    () => rows.map(row => getTrendInfo(periods.map(p => row.values[p] ?? 0))),
    [rows, periods],
  );

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  const chartData = useMemo(() => {
    if (!chartRow) return [];
    const values = periods.map(p => chartRow.values[p] ?? 0);
    const trend = getTrendInfo(values);
    return periods.map((p, i) => ({
      period: p,
      value: chartRow.values[p] ?? 0,
      trend: Math.round(trend.predict(i) * 100) / 100,
    }));
  }, [chartRow, periods]);

  const chartStats = useMemo(() => {
    if (!chartRow) return null;
    const values = periods.map(p => chartRow.values[p] ?? 0);
    const trend = getTrendInfo(values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      avg,
      min: Math.min(...values),
      max: Math.max(...values),
      trend,
    };
  }, [chartRow, periods]);

  const captureChart = useCallback(async () => {
    if (!chartExportRef.current) return null;
    return toPng(chartExportRef.current, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
  }, []);

  const handleChartDownload = useCallback(async () => {
    setExporting(true);
    try {
      const dataUrl = await captureChart();
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = `clarisix-trend-${chartRow?.dimension ?? 'chart'}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportSuccess('download');
    } catch (e) {
      console.error('Chart download failed:', e);
    } finally {
      setExporting(false);
      setTimeout(() => setExportSuccess(null), 3000);
    }
  }, [captureChart, chartRow]);

  const handleChartCopy = useCallback(async () => {
    setExporting(true);
    try {
      const dataUrl = await captureChart();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setExportSuccess('clipboard');
    } catch (e) {
      console.error('Clipboard copy failed, falling back to download:', e);
      await handleChartDownload();
    } finally {
      setExporting(false);
      setTimeout(() => setExportSuccess(null), 3000);
    }
  }, [captureChart, handleChartDownload]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative min-w-0">
      {showHint && (
        <div className="absolute top-14 right-5 z-50 animate-fade-slide-in">
          <div className="bg-cx-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-gentle-pulse">
            <span className="font-medium">Click and drag cells to see statistics</span>
            <button
              onClick={() => setShowHint(false)}
              className="text-white/80 hover:text-white transition-colors ml-1"
            >
              ✕
            </button>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-cx-500" />
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        <SelectionStats values={selectedValues} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="sticky left-0 z-10 bg-gray-50 text-left px-3 py-2.5 text-xs font-semibold text-cx-600 uppercase tracking-wider min-w-[130px]">
                {title.replace('by ', '')}
              </th>
              <th className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 min-w-[70px] bg-gray-50">
                Trend
              </th>
              {periods.map(p => (
                <th key={p} className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 min-w-[70px] bg-gray-50">
                  {p}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-800 min-w-[80px] bg-gray-50">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const trend = rowTrends[rowIdx];
              const TrendIcon = trend.icon;
              return (
                <tr
                  key={row.dimension}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/80 transition-colors px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setChartRow(chartRow?.dimension === row.dimension ? null : row)}
                        className="p-0.5 rounded hover:bg-cx-50 text-gray-400 hover:text-cx-600 transition-colors flex-shrink-0"
                        title="View trend chart"
                      >
                        <LineChartIcon className="w-3.5 h-3.5" />
                      </button>
                      <span>{row.dimension}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1" title={`${trend.normalizedSlope > 0 ? '+' : ''}${trend.normalizedSlope.toFixed(1)}% per period`}>
                      <TrendIcon className={`w-3.5 h-3.5 ${trend.color}`} />
                      <span className={`text-xs font-semibold tabular-nums ${trend.color}`}>
                        {trend.normalizedSlope > 0 ? '+' : ''}{trend.normalizedSlope.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  {periods.map((p, colIdx) => {
                    const val = row.values[p] ?? 0;
                    const cellKey = `${rowIdx}-${colIdx}`;
                    const isSelected = selectedCellKeys.has(cellKey);
                    return (
                      <td
                        key={p}
                        onMouseDown={e => handleMouseDown(e, rowIdx, colIdx)}
                        onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                        className={`px-2 py-2 text-center tabular-nums text-gray-700 font-medium cursor-cell select-none transition-all ${
                          isSelected ? 'ring-[1.5px] ring-inset ring-cx-500' : ''
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(14, 90, 138, 0.18)'
                            : getCellHeatColor(val, minVal, maxVal),
                        }}
                      >
                        {val === 0 ? '' : formatCellValue(val, metricInfo, currency)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">
                    {formatCellValue(row.total, metricInfo, currency, true)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 font-bold text-gray-900">
                Total
              </td>
              <td className="px-2 py-2.5" />
              {periods.map(p => (
                <td
                  key={p}
                  className="px-2 py-2.5 text-center font-bold text-gray-900 tabular-nums"
                >
                  {formatCellValue(periodTotals[p], metricInfo, currency)}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right font-extrabold text-gray-900 tabular-nums whitespace-nowrap">
                {formatCellValue(grandTotal, metricInfo, currency, true)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-end">
        <LastRefreshed offsetMinutes={14} />
      </div>

      {chartRow && chartStats && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setChartRow(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col animate-fade-slide-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with export buttons — matches Period Snapshot style */}
            <div className="flex items-center justify-end px-5 py-2 border-b border-gray-100">
              <div className="flex items-center gap-1">
                {exportSuccess && (
                  <span className="text-[11px] text-green-600 font-medium mr-1 animate-fade-slide-in">
                    {exportSuccess === 'clipboard' ? 'Copied to clipboard!' : 'Image saved!'}
                  </span>
                )}
                <button
                  onClick={handleChartCopy}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-cx-600 hover:bg-cx-50 rounded-md transition-all disabled:opacity-50"
                  title="Copy as image"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  {exporting ? 'Generating...' : 'Copy image'}
                </button>
                <button
                  onClick={handleChartDownload}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-cx-600 hover:bg-cx-50 rounded-md transition-all disabled:opacity-50"
                  title="Download PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save PNG
                </button>
                <button
                  onClick={() => setChartRow(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Exportable content area */}
            <div ref={chartExportRef}>
              <div className="px-5 pt-4 pb-2">
                <h4 className="text-sm font-semibold text-gray-900">{chartRow.dimension} — {metricInfo.label}</h4>
              </div>
              <div className="px-5 pb-1">
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        interval={periods.length > 15 ? Math.floor(periods.length / 10) : 0}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tickFormatter={(v: number) => formatCellValue(v, metricInfo, currency)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          fontSize: 12,
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                        formatter={(v: number, name: string) => [
                          formatCellValue(v, metricInfo, currency),
                          name === 'value' ? metricInfo.label : 'Trend',
                        ]}
                        labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0E5A8A"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#0E5A8A', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#0E5A8A', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line
                        type="linear"
                        dataKey="trend"
                        stroke="#E84818"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        activeDot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-[2px] bg-[#0E5A8A] rounded-full" />
                  <span className="text-xs text-gray-500">Actual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-[2px] bg-[#E84818] rounded-full" style={{ borderTop: '2px dashed #E84818', height: 0 }} />
                  <span className="text-xs text-gray-500">Trend</span>
                </div>
                <div className="ml-auto flex items-center gap-4 text-xs">
                  <span className="text-gray-400">Avg <span className="font-semibold text-gray-700">{formatCellValue(chartStats.avg, metricInfo, currency)}</span></span>
                  <span className="text-gray-400">Min <span className="font-semibold text-gray-700">{formatCellValue(chartStats.min, metricInfo, currency)}</span></span>
                  <span className="text-gray-400">Max <span className="font-semibold text-gray-700">{formatCellValue(chartStats.max, metricInfo, currency)}</span></span>
                  <span className="text-gray-400">Slope <span className={`font-semibold ${chartStats.trend.color}`}>{chartStats.trend.normalizedSlope > 0 ? '+' : ''}{chartStats.trend.normalizedSlope.toFixed(1)}%</span></span>
                </div>
              </div>

              {/* Branded footer — matches Period Snapshot export */}
              <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[9px] text-gray-400">
                  Source: clarisix.com&nbsp;&nbsp;|&nbsp;&nbsp;Data generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <img src="/clarisix_logo_orange.png" alt="Clarisix" className="h-4" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
