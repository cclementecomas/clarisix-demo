import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  matrixMetrics, generateMatrixData,
} from '../../data/metricMatrixData';
import type { MatrixMetric, MatrixMetricKey } from '../../data/metricMatrixData';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import InfoTooltip from '../InfoTooltip';
import SelectionStats from '../deepdive/SelectionStats';
import LastRefreshed from '../LastRefreshed';

function formatValue(val: number, metric: MatrixMetric, currency: 'EUR' | 'USD' | 'GBP'): string {
  switch (metric.format) {
    case 'currency':   return fc(val, currency);
    case 'percent':    return `${val.toFixed(1)}%`;
    case 'multiplier': return `${val.toFixed(2)}x`;
    case 'number':     return val.toLocaleString();
  }
}

function heatmapStyle(
  val: number,
  min: number,
  max: number,
  higherIsBetter: boolean,
): React.CSSProperties {
  if (max === min) return {};
  const norm = (val - min) / (max - min);
  const score = higherIsBetter ? norm : 1 - norm;
  const distance = Math.abs(score - 0.5) * 2;
  const opacity = Math.min(0.32, distance * 0.32);
  if (score >= 0.5) {
    return { backgroundColor: `rgba(34, 197, 94, ${opacity})` };
  }
  return { backgroundColor: `rgba(239, 68, 68, ${opacity})` };
}

interface CellPos { row: number; col: number; }
interface SelectedCell {
  row: number;
  col: number;
  metricKey: MatrixMetricKey;
  value: number;
}

function getRectCells(
  start: CellPos,
  end: CellPos,
  rows: ReturnType<typeof generateMatrixData>,
): SelectedCell[] {
  const minR = Math.min(start.row, end.row);
  const maxR = Math.max(start.row, end.row);
  const minC = Math.min(start.col, end.col);
  const maxC = Math.max(start.col, end.col);
  const cells: SelectedCell[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const m = matrixMetrics[c];
      const val = rows[r]?.values[m.key];
      if (val != null && !isNaN(val)) {
        cells.push({ row: r, col: c, metricKey: m.key, value: val });
      }
    }
  }
  return cells;
}

export default function MetricMatrix({ periods }: { periods: string[] }) {
  const { currency } = useCurrency();
  const cur = currency as 'EUR' | 'USD' | 'GBP';

  const rows = useMemo(() => generateMatrixData(periods), [periods]);

  // Per-column min/max for heatmap normalization
  const colStats = useMemo(() => {
    const stats: Record<MatrixMetricKey, { min: number; max: number }> =
      {} as Record<MatrixMetricKey, { min: number; max: number }>;
    for (const m of matrixMetrics) {
      const vals = rows.map((r) => r.values[m.key]);
      stats[m.key] = {
        min: vals.length ? Math.min(...vals) : 0,
        max: vals.length ? Math.max(...vals) : 0,
      };
    }
    return stats;
  }, [rows]);

  // ─── Cell selection (drag/click/ctrl-click) ────────────────────────────

  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [showHint, setShowHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const dragStart = useRef<CellPos | null>(null);
  const isDragging = useRef(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  // Reset selection when periods change
  useEffect(() => {
    setSelectedCells([]);
  }, [periods]);

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

      const m = matrixMetrics[colIdx];
      const val = rowsRef.current[rowIdx]?.values[m.key];
      if (val == null || isNaN(val)) return;

      const cell: SelectedCell = { row: rowIdx, col: colIdx, metricKey: m.key, value: val };

      if (e.ctrlKey || e.metaKey) {
        setSelectedCells((prev) => {
          const idx = prev.findIndex((c) => c.row === rowIdx && c.col === colIdx);
          if (idx >= 0) return prev.filter((_, i) => i !== idx);
          return [...prev, cell];
        });
      } else {
        setSelectedCells((prev) => {
          const same = prev.length === 1 && prev[0].row === rowIdx && prev[0].col === colIdx;
          return same ? [] : [cell];
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
      const t = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showHint]);

  const selectedKeys = useMemo(
    () => new Set(selectedCells.map((c) => `${c.row}-${c.col}`)),
    [selectedCells],
  );

  const selectedValues = useMemo(() => selectedCells.map((c) => c.value), [selectedCells]);

  if (periods.length === 0) {
    return null;
  }

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
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Metrics over time</h3>
          <InfoTooltip content="All Sales Deepdive metrics shown for each period. Each column is independently heatmap-shaded — green = above the period average, red = below. Polarity is reversed for cost metrics (Ad Spend, ACOS, TACOS, Ad Reliance) where lower is better. Click and drag cells to see stats; Ctrl/Cmd-click to add cells to the selection." />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* Group band header — contiguous-run colSpans per band */}
            {(() => {
              const runs: { group: string; span: number; firstColIdx: number }[] = [];
              let cur: { group: string; span: number; firstColIdx: number } | null = null;
              matrixMetrics.forEach((m, i) => {
                if (cur && m.group === cur.group) {
                  cur.span += 1;
                } else {
                  cur = { group: m.group, span: 1, firstColIdx: i };
                  runs.push(cur);
                }
              });
              return (
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th
                    aria-hidden
                    className="sticky left-0 z-10 bg-gray-50 px-3 py-1"
                  />
                  {runs.map((run, i) => (
                    <th
                      key={`group-${i}`}
                      colSpan={run.span}
                      className={`px-3 py-1 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 whitespace-nowrap ${
                        i > 0 ? 'border-l border-gray-200' : ''
                      }`}
                    >
                      {run.group}
                    </th>
                  ))}
                </tr>
              );
            })()}
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 min-w-[100px]">
                Period
              </th>
              {(() => {
                // Mark first column of each new group for the 1px left divider
                const firstOfGroup = new Set<number>();
                let lastGroup: string | undefined;
                matrixMetrics.forEach((m, i) => {
                  if (i > 0 && m.group !== lastGroup) firstOfGroup.add(i);
                  lastGroup = m.group;
                });
                return matrixMetrics.map((m, i) => (
                  <th
                    key={m.key}
                    className={`px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${
                      firstOfGroup.has(i) ? 'border-l border-gray-200' : ''
                    }`}
                    title={m.tooltip}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{m.label}</span>
                      <span
                        className="text-[8px] font-bold"
                        style={{ color: m.higherIsBetter ? '#16A34A' : '#DC2626' }}
                      >
                        {m.higherIsBetter ? '↑' : '↓'}
                      </span>
                    </div>
                  </th>
                ));
              })()}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={row.period} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors group">
                <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 transition-colors px-3 py-1.5 text-[12px] font-mono font-semibold text-gray-700 border-r border-gray-100">
                  {row.period}
                </td>
                {matrixMetrics.map((m, colIdx) => {
                  const val = row.values[m.key];
                  const { min, max } = colStats[m.key];
                  const isSelected = selectedKeys.has(`${rowIdx}-${colIdx}`);
                  const heat = heatmapStyle(val, min, max, m.higherIsBetter);
                  return (
                    <td
                      key={m.key}
                      onMouseDown={(e) => handleMouseDown(e, rowIdx, colIdx)}
                      onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                      className={`px-3 py-1.5 text-right text-[12px] tabular-nums whitespace-nowrap cursor-cell select-none transition-all ${
                        isSelected ? 'ring-[1.5px] ring-inset ring-cx-500' : ''
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'rgba(14, 90, 138, 0.18)' : (heat.backgroundColor as string | undefined),
                      }}
                    >
                      {formatValue(val, m, cur)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-1.5 border-t border-gray-100 flex items-center justify-end gap-4 bg-white/90">
        {selectedValues.length > 0 && <SelectionStats values={selectedValues} />}
        <LastRefreshed offsetMinutes={11} />
      </div>
    </div>
  );
}
