import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
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

export default function TrendsPivotTable({ title, periods, rows, metricInfo }: TrendsPivotTableProps) {
  const { currency } = useCurrency();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [showHint, setShowHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const dragStart = useRef<CellPos | null>(null);
  const isDragging = useRef(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const periodsRef = useRef(periods);
  periodsRef.current = periods;

  useEffect(() => {
    setSelectedCells([]);
  }, [metricInfo, rows, periods]);

  const toggleRow = (dim: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim);
      else next.add(dim);
      return next;
    });
  };

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

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative">
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
            {rows.map((row, rowIdx) => (
              <tr
                key={row.dimension}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
              >
                <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/80 transition-colors px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                  <button
                    onClick={() => toggleRow(row.dimension)}
                    className="flex items-center gap-1.5 w-full text-left"
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        expandedRows.has(row.dimension) ? 'rotate-90' : ''
                      }`}
                    />
                    <span>{row.dimension}</span>
                  </button>
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
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 font-bold text-gray-900">
                Total
              </td>
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
    </div>
  );
}
