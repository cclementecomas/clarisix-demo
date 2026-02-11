import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import ColumnToggle from './ColumnToggle';
import SelectionStats from './SelectionStats';
import InfoTooltip from '../InfoTooltip';
import { fc } from '../../utils/currency';
import { useCurrency } from '../../contexts/CurrencyContext';
import type { Currency } from '../../contexts/CurrencyContext';

export interface ColumnDef {
  field: string;
  headerName: string;
  pinned?: 'left';
  width?: number;
  cellStyle?: Record<string, string> | ((params: { value: unknown; row: any }) => Record<string, string>);
  valueFormatter?: (params: { value: unknown; row: any }) => string | React.ReactNode;
  hide?: boolean;
  subFields?: { field: string; label?: string; formatter?: (params: { value: unknown; row: any }) => string | React.ReactNode; cellStyle?: (params: { value: unknown; row: any }) => Record<string, string> }[];
}

interface SelectedCell {
  rowIndex: number;
  colIndex: number;
  value: number;
}

interface CellPos {
  row: number;
  col: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DeepDiveTableProps {
  title: string;
  rowData: any[];
  columnDefs: ColumnDef[];
  pinnedBottomRowData?: any[];
  childRowsMap?: Record<string, any[]>;
  rowKeyField?: string;
  childLabelField?: string;
}

const percentCellStyle = (params: { value: unknown; row?: any }): Record<string, string> => {
  const v = params.value as number | null | undefined;
  if (v != null && v > 0) return { color: '#166534' };
  if (v != null && v < 0) return { color: '#991B1B' };
  return {};
};

const percentFormatter = (params: { value: unknown; row?: any }) => {
  const v = params.value as number | null | undefined;
  if (v == null) return '';
  const prefix = v > 0 ? '+' : '';
  return `${prefix}${v.toFixed(2)}%`;
};

const ppFormatter = (params: { value: unknown; row?: any }) => {
  const v = params.value as number | null | undefined;
  if (v == null) return '';
  const prefix = v > 0 ? '+' : '';
  return `${prefix}${v.toFixed(2)}pp`;
};

const currencyFormatter = (currency: Currency) => (params: { value: unknown; row?: any }) => {
  const v = params.value as number | null | undefined;
  if (v == null) return '';
  return fc(v, currency, { compact: false });
};

const numberFormatter = (params: { value: unknown; row?: any }) => {
  const v = params.value as number | null | undefined;
  if (v == null) return '';
  return (v as number).toLocaleString('en-US');
};

const pctShareFormatter = (params: { value: unknown; row?: any }) => {
  const v = params.value as number | null | undefined;
  if (v == null) return '';
  return `${(v as number).toFixed(2)}%`;
};

export { percentCellStyle, percentFormatter, ppFormatter, currencyFormatter, numberFormatter, pctShareFormatter };
export type { Currency };

type SortDir = 'asc' | 'desc' | null;

function formatCell(col: ColumnDef, value: unknown, row: any): string | React.ReactNode {
  if (col.valueFormatter) return col.valueFormatter({ value, row });
  if (value == null) return '';
  return String(value);
}

function getCellStyle(col: ColumnDef, value: unknown, row: any): Record<string, string> {
  if (!col.cellStyle) return {};
  if (typeof col.cellStyle === 'function') return col.cellStyle({ value, row });
  return col.cellStyle;
}

function getRectCells(
  start: CellPos,
  end: CellPos,
  sortedData: any[],
  visibleCols: ColumnDef[]
): SelectedCell[] {
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const cells: SelectedCell[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const val = parseFloat(String(sortedData[r]?.[visibleCols[c]?.field]));
      if (!isNaN(val)) {
        cells.push({ rowIndex: r, colIndex: c, value: val });
      }
    }
  }
  return cells;
}

export default function DeepDiveTable({ title, rowData, columnDefs, pinnedBottomRowData, childRowsMap, rowKeyField, childLabelField }: DeepDiveTableProps) {
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const hasChildren = !!childRowsMap && !!rowKeyField;
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    return new Set(columnDefs.filter((c) => !c.hide).map((c) => c.field));
  });
  const [showPoP, setShowPoP] = useState(true);
  const [showLY, setShowLY] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const filterSubFields = useCallback(
    (subFields?: ColumnDef['subFields']) => {
      if (!subFields) return undefined;
      return subFields.filter((sf) => {
        if (sf.label === 'PoP') return showPoP;
        if (sf.label === 'LY') return showLY;
        return true;
      });
    },
    [showPoP, showLY]
  );

  const dragStart = useRef<CellPos | null>(null);
  const isDragging = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleColumnToggle = useCallback((colId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }, []);

  const visibleCols = useMemo(
    () => columnDefs.filter((c) => visibleColumns.has(c.field)),
    [columnDefs, visibleColumns]
  );

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        if (sortDir === 'asc') setSortDir('desc');
        else if (sortDir === 'desc') { setSortField(null); setSortDir(null); }
        else setSortDir('asc');
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField, sortDir]
  );

  const sortedData = useMemo(() => {
    if (!sortField || !sortDir) return rowData;
    return [...rowData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [rowData, sortField, sortDir]);

  const sortedDataRef = useRef(sortedData);
  sortedDataRef.current = sortedData;
  const visibleColsRef = useRef(visibleCols);
  visibleColsRef.current = visibleCols;

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

      const val = parseFloat(String(sortedDataRef.current[rowIdx]?.[visibleColsRef.current[colIdx]?.field]));
      if (isNaN(val)) return;

      if (e.ctrlKey || e.metaKey) {
        setSelectedCells((prev) => {
          const exists = prev.find((c) => c.rowIndex === rowIdx && c.colIndex === colIdx);
          if (exists) return prev.filter((c) => !(c.rowIndex === rowIdx && c.colIndex === colIdx));
          return [...prev, { rowIndex: rowIdx, colIndex: colIdx, value: val }];
        });
      } else {
        setSelectedCells((prev) => {
          const exists = prev.length === 1 && prev[0].rowIndex === rowIdx && prev[0].colIndex === colIdx;
          if (exists) return [];
          return [{ rowIndex: rowIdx, colIndex: colIdx, value: val }];
        });
      }
    },
    [hasInteracted]
  );

  const handleMouseEnter = useCallback(
    (rowIdx: number, colIdx: number) => {
      if (!isDragging.current || !dragStart.current) return;
      const cells = getRectCells(
        dragStart.current,
        { row: rowIdx, col: colIdx },
        sortedDataRef.current,
        visibleColsRef.current
      );
      setSelectedCells(cells);
    },
    []
  );

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
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  const selectedValues = useMemo(() => selectedCells.map((c) => c.value), [selectedCells]);
  const selectedCellKeys = useMemo(
    () => new Set(selectedCells.map((c) => `${c.rowIndex}-${c.colIndex}`)),
    [selectedCells]
  );

  const pinnedCol = visibleCols.find((c) => c.pinned === 'left');

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
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
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <InfoTooltip />
        </div>
        <div className="flex items-center gap-3">
          <SelectionStats values={selectedValues} />
          {hasChildren && (
            <button
              onClick={() => {
                const allKeys = sortedData.map((r) => r[rowKeyField!] as string).filter((k) => childRowsMap![k]);
                const allExpanded = allKeys.every((k) => expandedRows.has(k));
                if (allExpanded) {
                  setExpandedRows(new Set());
                } else {
                  setExpandedRows(new Set(allKeys));
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-cx-500 hover:border-cx-300 transition-colors"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              {sortedData.map((r) => r[rowKeyField!] as string).filter((k) => childRowsMap![k]).every((k) => expandedRows.has(k))
                ? 'Collapse All'
                : 'Expand All'
              }
            </button>
          )}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowPoP((p) => !p)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                showPoP
                  ? 'bg-cx-500 text-white'
                  : 'bg-white text-gray-400 hover:text-gray-600'
              }`}
            >
              PoP
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onClick={() => setShowLY((p) => !p)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                showLY
                  ? 'bg-cx-500 text-white'
                  : 'bg-white text-gray-400 hover:text-gray-600'
              }`}
            >
              LY
            </button>
          </div>
          <ColumnToggle
            columns={columnDefs}
            visibleColumns={visibleColumns}
            onToggle={handleColumnToggle}
          />
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 420 }} ref={tableRef}>
        <table
          className="w-full border-collapse text-[13px]"
          style={{ fontFamily: "'Inter', system-ui, sans-serif", tableLayout: 'fixed' }}
        >
          <colgroup>
            {(() => {
              const nonPinned = visibleCols.filter((c) => c.pinned !== 'left');
              const totalWeight = nonPinned.reduce((sum, c) => sum + (c.width ?? 130), 0);
              return visibleCols.map((col, i) => {
                const isPinned = col.pinned === 'left';
                const w = isPinned ? '14%' : `${((col.width ?? 130) / totalWeight) * 86}%`;
                return <col key={i} style={{ width: w }} />;
              });
            })()}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              {visibleCols.map((col) => {
                const isPinned = col.pinned === 'left';
                return (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none whitespace-nowrap hover:bg-slate-100 transition-colors overflow-hidden text-ellipsis ${
                      isPinned ? 'sticky left-0 z-30 bg-slate-50' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.headerName}
                      {sortField === col.field && sortDir === 'asc' && <ArrowUp className="w-3 h-3 text-cx-500 flex-shrink-0" />}
                      {sortField === col.field && sortDir === 'desc' && <ArrowDown className="w-3 h-3 text-cx-500 flex-shrink-0" />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.flatMap((row, rowIdx) => {
              const rowKey = hasChildren ? (row[rowKeyField!] as string) : '';
              const isExpanded = hasChildren && expandedRows.has(rowKey);
              const children = hasChildren ? childRowsMap![rowKey] : undefined;
              const canExpand = hasChildren && !!children?.length;

              const parentRow = (
                <tr
                  key={rowIdx}
                  className={`border-b border-slate-50 hover:bg-cx-50/50 transition-colors ${
                    rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  {visibleCols.map((col, colIdx) => {
                    const value = row[col.field];
                    const isPinned = col.pinned === 'left';
                    const cellKey = `${rowIdx}-${colIdx}`;
                    const isSelected = selectedCellKeys.has(cellKey);
                    const style = getCellStyle(col, value, row);
                    const isHintCell = showHint && !isPinned && ((rowIdx === 0 && colIdx === 1) || (rowIdx === 1 && colIdx === 2));

                    return (
                      <td
                        key={col.field}
                        onMouseDown={(e) => handleMouseDown(e, rowIdx, colIdx)}
                        onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                        className={`px-2.5 py-1.5 tabular-nums select-none overflow-hidden text-ellipsis transition-all ${
                          isPinned ? `sticky left-0 z-10 font-semibold ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}` : 'cursor-cell'
                        } ${isSelected ? 'bg-cx-100 ring-[1.5px] ring-inset ring-cx-500' : ''} ${
                          col.subFields ? 'whitespace-normal' : 'whitespace-nowrap'
                        } ${isHintCell ? 'animate-cell-glow' : ''}`}
                        style={style}
                      >
                        {isPinned && canExpand ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRows((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(rowKey)) next.delete(rowKey);
                                  else next.add(rowKey);
                                  return next;
                                });
                              }}
                              className="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0"
                            >
                              <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                            <span className="truncate">{formatCell(col, value, row)}</span>
                          </div>
                        ) : (
                          (() => {
                            const filtered = filterSubFields(col.subFields);
                            return filtered && filtered.length > 0 ? (
                              <div className="space-y-px">
                                <div className="font-semibold text-[13px] leading-none">{formatCell(col, value, row)}</div>
                                {filtered.map((subField) => {
                                  const subValue = row[subField.field];
                                  const subStyle = subField.cellStyle ? subField.cellStyle({ value: subValue, row }) : {};
                                  const formattedSub = subField.formatter
                                    ? subField.formatter({ value: subValue, row })
                                    : String(subValue ?? '');
                                  return (
                                    <div key={subField.field} className="flex items-center gap-1 text-[10px] leading-none">
                                      {subField.label && <span className="text-gray-400 font-medium w-5 shrink-0">{subField.label}</span>}
                                      <span className="font-semibold tabular-nums" style={subStyle}>{formattedSub}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              formatCell(col, value, row)
                            );
                          })()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );

              if (!isExpanded || !children) return [parentRow];

              const childRows = children.map((child, ci) => (
                <tr
                  key={`${rowIdx}-child-${ci}`}
                  className="border-b border-slate-50 bg-cx-50/30 hover:bg-cx-50/60 transition-colors"
                >
                  {visibleCols.map((col) => {
                    const isPinned = col.pinned === 'left';
                    const childLabel = childLabelField ? child[childLabelField] : child[col.field];
                    const value = col.field === rowKeyField ? childLabel : col.field === 'title' ? child.title : child[col.field];
                    const style = getCellStyle(col, value, child);

                    return (
                      <td
                        key={col.field}
                        className={`px-2.5 py-1.5 tabular-nums select-none overflow-hidden text-ellipsis text-[12px] ${
                          isPinned ? 'sticky left-0 z-10 bg-cx-50/30' : ''
                        } ${col.subFields ? 'whitespace-normal' : 'whitespace-nowrap'}`}
                        style={style}
                      >
                        {isPinned ? (
                          <div className="flex items-center gap-1 pl-5">
                            <span className="text-gray-400 text-[10px]">└</span>
                            <span className="truncate text-gray-600 font-medium">{String(value ?? '')}</span>
                          </div>
                        ) : (
                          (() => {
                            const filtered = filterSubFields(col.subFields);
                            return filtered && filtered.length > 0 ? (
                              <div className="space-y-px">
                                <div className="font-medium text-[12px] leading-none text-gray-700">{formatCell(col, value, child)}</div>
                                {filtered.map((subField) => {
                                  const subValue = child[subField.field];
                                  const subStyle = subField.cellStyle ? subField.cellStyle({ value: subValue, row: child }) : {};
                                  const formattedSub = subField.formatter
                                    ? subField.formatter({ value: subValue, row: child })
                                    : String(subValue ?? '');
                                  return (
                                    <div key={subField.field} className="flex items-center gap-1 text-[10px] leading-none">
                                      {subField.label && <span className="text-gray-400 font-medium w-5 shrink-0">{subField.label}</span>}
                                      <span className="font-semibold tabular-nums" style={subStyle}>{formattedSub}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-700">{formatCell(col, value, child)}</span>
                            );
                          })()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ));

              return [parentRow, ...childRows];
            })}
          </tbody>
          {pinnedBottomRowData && pinnedBottomRowData.length > 0 && (
            <tfoot className="sticky bottom-0 z-20">
              {pinnedBottomRowData.map((row, rowIdx) => (
                <tr key={rowIdx} className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                  {visibleCols.map((col) => {
                    const value = row[col.field];
                    const isPinned = col.pinned === 'left';
                    const style = getCellStyle(col, value, row);

                    return (
                      <td
                        key={col.field}
                        className={`px-3 py-2 tabular-nums overflow-hidden text-ellipsis ${
                          isPinned ? 'sticky left-0 z-10 bg-slate-100' : ''
                        } ${col.subFields ? 'whitespace-normal' : 'whitespace-nowrap'}`}
                        style={style}
                      >
                        {(() => {
                          const filtered = filterSubFields(col.subFields);
                          return filtered && filtered.length > 0 ? (
                            <div className="space-y-px">
                              <div className="font-bold text-[13px] leading-none">{formatCell(col, value, row)}</div>
                              {filtered.map((subField) => {
                                const subValue = row[subField.field];
                                const subStyle = subField.cellStyle ? subField.cellStyle({ value: subValue, row }) : {};
                                const formattedSub = subField.formatter
                                  ? subField.formatter({ value: subValue, row })
                                  : String(subValue ?? '');
                                return (
                                  <div key={subField.field} className="flex items-center gap-1 text-[10px] leading-none">
                                    {subField.label && <span className="text-gray-400 font-medium w-5 shrink-0">{subField.label}</span>}
                                    <span className="font-semibold tabular-nums" style={subStyle}>{formattedSub}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            formatCell(col, value, row)
                          );
                        })()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
