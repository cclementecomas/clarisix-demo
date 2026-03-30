import { useState, useMemo, useEffect, useRef } from 'react';
import { Pencil, AlertTriangle } from 'lucide-react';
import { useCurrency, CURRENCY_SYMBOLS } from '../contexts/CurrencyContext';
import { convert } from '../utils/currency';
import LastRefreshed from './LastRefreshed';
import {
  type MonthKey, type RowValues,
  MONTHS, QUARTERS,
  CURRENT_MONTH_INDEX, LAST_COMPLETE_MONTH_INDEX,
  defaultPpcBudget, defaultDspBudget, defaultSalesTarget, defaultTargetTacos,
  ppcSpendActuals, dspSpendActuals, totalSalesActuals, paidSalesActuals,
  sumMonths, ytdSum,
  defaultAuditTrail, type CellAudit,
} from '../data/budgetData';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BudgetRow {
  id: string;
  label: string;
  group: 'budget_plan' | 'actual_spend' | 'sales' | 'efficiency';
  type: 'currency' | 'percent' | 'ratio';
  editable?: boolean;
  isFirstInGroup?: boolean;
  styleType: 'editable' | 'subtotal' | 'variance' | 'default';
  values: RowValues;
  /** For variance rows: positive-bad (spend) or negative-bad (sales) */
  varianceMode?: 'spend' | 'sales' | 'tacos';
}

// Column types for the header
interface ColDef {
  key: string;
  label: string;
  kind: 'month' | 'quarter' | 'total';
  monthIndex?: number; // 0-11 for months
  monthKeys?: MonthKey[]; // for quarters
}

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(): ColDef[] {
  const cols: ColDef[] = [];
  for (let qi = 0; qi < 4; qi++) {
    const q = QUARTERS[qi];
    for (const mk of q.months) {
      const mi = MONTHS.findIndex(m => m.key === mk);
      cols.push({ key: mk, label: MONTHS[mi].label, kind: 'month', monthIndex: mi });
    }
    cols.push({ key: q.key, label: q.label, kind: 'quarter', monthKeys: q.months });
  }
  cols.push({ key: 'total', label: 'TOTAL', kind: 'total', monthKeys: MONTHS.map(m => m.key) });
  return cols;
}

const COLUMNS = buildColumns();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addRows(a: RowValues, b: RowValues): RowValues {
  const r: any = {};
  for (const m of MONTHS) {
    const va = a[m.key], vb = b[m.key];
    r[m.key] = va != null && vb != null ? va + vb : va ?? vb ?? null;
  }
  return r;
}

function subRows(a: RowValues, b: RowValues): RowValues {
  const r: any = {};
  for (const m of MONTHS) {
    const va = a[m.key], vb = b[m.key];
    r[m.key] = va != null && vb != null ? va - vb : null;
  }
  return r;
}

function divRows(a: RowValues, b: RowValues, scale = 100): RowValues {
  const r: any = {};
  for (const m of MONTHS) {
    const va = a[m.key], vb = b[m.key];
    r[m.key] = va != null && vb != null && vb !== 0 ? (va / vb) * scale : null;
  }
  return r;
}

function pctOfRows(part: RowValues, whole: RowValues): RowValues {
  return divRows(part, whole, 100);
}

// ─── Main Component ──────────────────────────────────────────────────────────

const MARKETPLACES = ['DE', 'FR', 'IT', 'ES', 'NL'] as const;

export default function Budgets() {
  const { currency } = useCurrency();
  const sym = CURRENCY_SYMBOLS[currency];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Marketplace selection (wireframe simulation)
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(['DE']);
  const isMultiMarketplace = selectedMarketplaces.length > 1;
  const missingBudgetMarketplaces = isMultiMarketplace
    ? selectedMarketplaces.filter(m => !['DE', 'ES'].includes(m))
    : [];

  // Editable state
  const [ppcBudget, setPpcBudget] = useState<RowValues>({ ...defaultPpcBudget });
  const [dspBudget, setDspBudget] = useState<RowValues>({ ...defaultDspBudget });
  const [salesTarget, setSalesTarget] = useState<RowValues>({ ...defaultSalesTarget });
  const [targetTacos, setTargetTacos] = useState<RowValues>({ ...defaultTargetTacos });

  // Editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; month: MonthKey } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [justSaved, setJustSaved] = useState<string | null>(null);

  // Audit trail
  const [auditTrail, setAuditTrail] = useState<Record<string, CellAudit>>({ ...defaultAuditTrail });

  // Computed rows
  const rows = useMemo<BudgetRow[]>(() => {
    const totalBudget = addRows(ppcBudget, dspBudget);
    const totalSpend = addRows(ppcSpendActuals, dspSpendActuals);
    const ppcVariance = subRows(ppcSpendActuals, ppcBudget);
    const dspVariance = subRows(dspSpendActuals, dspBudget);
    const totalVariance = subRows(totalSpend, totalBudget);
    const salesAchievement = divRows(totalSalesActuals, salesTarget, 100);
    const paidPct = pctOfRows(paidSalesActuals, totalSalesActuals);
    const organicPct: RowValues = {} as any;
    for (const m of MONTHS) {
      const p = paidPct[m.key];
      organicPct[m.key] = p != null ? 100 - p : null;
    }
    const actualTacos = divRows(totalSpend, totalSalesActuals, 100);

    return [
      // Group 1: Budget Plan
      { id: 'ppc_budget', label: 'PPC Budget', group: 'budget_plan', type: 'currency', editable: true, isFirstInGroup: true, styleType: 'editable', values: ppcBudget },
      { id: 'dsp_budget', label: 'DSP Budget', group: 'budget_plan', type: 'currency', editable: true, styleType: 'editable', values: dspBudget },
      { id: 'total_budget', label: 'Total Ad Budget', group: 'budget_plan', type: 'currency', styleType: 'subtotal', values: totalBudget },

      // Group 2: Actual Spend vs Plan
      { id: 'ppc_spend', label: 'PPC Spend', group: 'actual_spend', type: 'currency', isFirstInGroup: true, styleType: 'default', values: ppcSpendActuals },
      { id: 'ppc_vs_budget', label: 'vs Budget', group: 'actual_spend', type: 'currency', styleType: 'variance', values: ppcVariance, varianceMode: 'spend' },
      { id: 'dsp_spend', label: 'DSP Spend', group: 'actual_spend', type: 'currency', styleType: 'default', values: dspSpendActuals },
      { id: 'dsp_vs_budget', label: 'vs Budget', group: 'actual_spend', type: 'currency', styleType: 'variance', values: dspVariance, varianceMode: 'spend' },
      { id: 'total_spend', label: 'Total Ad Spend', group: 'actual_spend', type: 'currency', styleType: 'subtotal', values: totalSpend },
      { id: 'total_vs_budget', label: 'vs Budget', group: 'actual_spend', type: 'currency', styleType: 'variance', values: totalVariance, varianceMode: 'spend' },

      // Group 3: Sales Performance
      { id: 'sales_target', label: 'Total Sales Target', group: 'sales', type: 'currency', editable: true, isFirstInGroup: true, styleType: 'editable', values: salesTarget },
      { id: 'total_sales', label: 'Total Sales', group: 'sales', type: 'currency', styleType: 'default', values: totalSalesActuals },
      { id: 'target_achievement', label: 'Target Achievement', group: 'sales', type: 'percent', styleType: 'variance', values: salesAchievement, varianceMode: 'sales' },

      // Group 4: Efficiency
      { id: 'pct_paid', label: '% Paid Sales', group: 'efficiency', type: 'percent', isFirstInGroup: true, styleType: 'default', values: paidPct },
      { id: 'pct_organic', label: '% Organic Sales', group: 'efficiency', type: 'percent', styleType: 'default', values: organicPct },
      { id: 'target_tacos', label: 'Target TACOS', group: 'efficiency', type: 'percent', editable: true, styleType: 'editable', values: targetTacos },
      { id: 'actual_tacos', label: 'TACOS', group: 'efficiency', type: 'percent', styleType: 'variance', values: actualTacos, varianceMode: 'tacos' },
    ];
  }, [ppcBudget, dspBudget, salesTarget, targetTacos]);

  // Auto-scroll to current month on mount
  useEffect(() => {
    if (scrollRef.current) {
      const labelW = 200;
      const colW = 90;
      // Account for quarterly columns before the current month
      const quartersBeforeCurrent = Math.floor(CURRENT_MONTH_INDEX / 3);
      const scrollTo = labelW + (CURRENT_MONTH_INDEX + quartersBeforeCurrent) * colW - scrollRef.current.clientWidth / 2 + colW / 2;
      scrollRef.current.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
    }
  }, []);

  // ─── KPI Summary ──────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const ytdBudget = ytdSum(addRows(ppcBudget, dspBudget));
    const ytdSpend = ytdSum(addRows(ppcSpendActuals, dspSpendActuals));
    const ytdTarget = ytdSum(salesTarget);
    const ytdSales = ytdSum(totalSalesActuals);
    const ytdTargetTacos = ytdSum(targetTacos);
    const ytdMonthCount = LAST_COMPLETE_MONTH_INDEX + 1;

    if (ytdSpend == null || ytdBudget == null) return null;

    const utilization = ytdBudget > 0 ? (ytdSpend / ytdBudget) * 100 : 0;
    const variance = ytdSpend - ytdBudget;
    const salesPct = ytdTarget && ytdSales ? (ytdSales / ytdTarget) * 100 : 0;
    const tacos = ytdSales && ytdSpend ? (ytdSpend / ytdSales) * 100 : 0;
    const avgTargetTacos = ytdTargetTacos != null ? ytdTargetTacos / ytdMonthCount : 12;

    return { utilization, variance, ytdBudget, ytdSpend, salesPct, ytdSales, ytdTarget, tacos, avgTargetTacos };
  }, [ppcBudget, dspBudget, salesTarget, targetTacos]);

  // ─── Formatting ───────────────────────────────────────────────────────────

  const fmtCurrency = (v: number | null): string => {
    if (v == null) return '';
    const c = convert(v, currency);
    const neg = c < 0;
    const abs = Math.abs(c);
    const formatted = abs >= 1000
      ? `${sym}${Math.round(abs).toLocaleString('en-US')}`
      : `${sym}${Math.round(abs)}`;
    return neg ? `-${formatted}` : formatted;
  };

  const fmtCurrencyCompact = (v: number | null): string => {
    if (v == null) return '';
    const c = convert(v, currency);
    const neg = c < 0;
    const abs = Math.abs(c);
    let formatted: string;
    if (abs >= 1000000) formatted = `${sym}${(abs / 1000000).toFixed(1)}M`;
    else if (abs >= 1000) formatted = `${sym}${(abs / 1000).toFixed(0)}K`;
    else formatted = `${sym}${Math.round(abs)}`;
    return neg ? `-${formatted}` : formatted;
  };

  const fmtPct = (v: number | null): string => {
    if (v == null) return '';
    return `${v.toFixed(1)}%`;
  };

  const fmtValue = (row: BudgetRow, v: number | null): string => {
    if (v == null) return '';
    if (row.type === 'currency') return fmtCurrency(v);
    if (row.type === 'percent') return fmtPct(v);
    return `${v.toFixed(2)}x`;
  };

  // ─── Editing ──────────────────────────────────────────────────────────────

  const editableMap: Record<string, { get: RowValues; set: (v: RowValues) => void }> = {
    ppc_budget: { get: ppcBudget, set: setPpcBudget },
    dsp_budget: { get: dspBudget, set: setDspBudget },
    sales_target: { get: salesTarget, set: setSalesTarget },
    target_tacos: { get: targetTacos, set: setTargetTacos },
  };

  function startEdit(rowId: string, month: MonthKey, value: number | null) {
    setEditingCell({ rowId, month });
    setEditValue(value != null ? String(value) : '');
  }

  function saveEdit() {
    if (!editingCell) return;
    const entry = editableMap[editingCell.rowId];
    if (!entry) return;
    const num = parseFloat(editValue);
    if (!isNaN(num)) {
      entry.set({ ...entry.get, [editingCell.month]: num });
      const cellKey = `${editingCell.rowId}-${editingCell.month}`;
      setJustSaved(cellKey);
      setTimeout(() => setJustSaved(null), 1000);
      // Update audit trail
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setAuditTrail(prev => ({ ...prev, [cellKey]: { date: dateStr, user: 'You' } }));
    }
    setEditingCell(null);
  }

  function cancelEdit() {
    setEditingCell(null);
  }

  // ─── Variance cell color ──────────────────────────────────────────────────

  function getVarianceBg(row: BudgetRow, v: number | null): string {
    if (v == null) return '';
    if (row.varianceMode === 'spend') {
      // Over budget = bad (red), under/on budget = good (green)
      return v > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800';
    }
    if (row.varianceMode === 'sales') {
      // >= 100% = good, < 100% = bad
      return v >= 100 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800';
    }
    if (row.varianceMode === 'tacos') {
      // Find target TACOS for comparison — lower actual = good
      // We compare row-by-row in the cell renderer instead
      return '';
    }
    return '';
  }

  function getTacosBg(month: MonthKey): string {
    const actual = rows.find(r => r.id === 'actual_tacos')?.values[month];
    const target = targetTacos[month];
    if (actual == null || target == null) return '';
    return actual <= target ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800';
  }

  // ─── Aggregate value for quarter/total columns ────────────────────────────

  function getAggValue(row: BudgetRow, monthKeys: MonthKey[]): number | null {
    if (row.type === 'percent') {
      // For percentages, need to recalculate from underlying data
      if (row.id === 'target_achievement') {
        const s = sumMonths(totalSalesActuals, monthKeys);
        const t = sumMonths(salesTarget, monthKeys);
        return s != null && t != null && t > 0 ? (s / t) * 100 : null;
      }
      if (row.id === 'pct_paid') {
        const p = sumMonths(paidSalesActuals, monthKeys);
        const t = sumMonths(totalSalesActuals, monthKeys);
        return p != null && t != null && t > 0 ? (p / t) * 100 : null;
      }
      if (row.id === 'pct_organic') {
        const p = sumMonths(paidSalesActuals, monthKeys);
        const t = sumMonths(totalSalesActuals, monthKeys);
        return p != null && t != null && t > 0 ? 100 - (p / t) * 100 : null;
      }
      if (row.id === 'target_tacos') {
        // Average of monthly targets
        const vals = monthKeys.map(k => targetTacos[k]).filter((v): v is number => v != null);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      }
      if (row.id === 'actual_tacos') {
        const spend = sumMonths(addRows(ppcSpendActuals, dspSpendActuals), monthKeys);
        const sales = sumMonths(totalSalesActuals, monthKeys);
        return spend != null && sales != null && sales > 0 ? (spend / sales) * 100 : null;
      }
      return null;
    }
    return sumMonths(row.values, monthKeys);
  }

  // Variance color for aggregate columns
  function getAggVarianceBg(row: BudgetRow, monthKeys: MonthKey[]): string {
    const v = getAggValue(row, monthKeys);
    if (v == null) return '';
    if (row.varianceMode === 'tacos') {
      const target = getAggValue(rows.find(r => r.id === 'target_tacos')!, monthKeys);
      if (target == null) return '';
      return v <= target ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800';
    }
    return getVarianceBg(row, v);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const GROUP_LABELS: Record<string, string> = {
    budget_plan: 'Budget Plan',
    actual_spend: 'Actual Spend vs Plan',
    sales: 'Sales Performance',
    efficiency: 'Efficiency',
  };

  return (
    <div className="space-y-4">
      {/* Zone 1: KPI Summary Cards */}
      {kpis && (
        <div className="grid grid-cols-4 gap-3">
          {/* Budget Utilization */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-3 px-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Budget Utilization</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">{kpis.utilization.toFixed(0)}%</div>
            <div className="text-xs text-gray-500">{fmtCurrencyCompact(kpis.ytdSpend)} of {fmtCurrencyCompact(kpis.ytdBudget)} spent</div>
          </div>
          {/* Budget Variance */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-3 px-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Budget Variance</div>
            <div className={`text-xl font-bold mt-0.5 ${kpis.variance <= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {fmtCurrencyCompact(kpis.variance)}
            </div>
            <div className="text-xs text-gray-500">{kpis.variance <= 0 ? 'Under budget' : 'Over budget'}</div>
          </div>
          {/* Sales vs Target */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-3 px-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sales vs Target</div>
            <div className={`text-xl font-bold mt-0.5 ${kpis.salesPct >= 100 ? 'text-green-700' : 'text-red-700'}`}>
              {kpis.salesPct.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">{fmtCurrencyCompact(kpis.ytdSales)} of {fmtCurrencyCompact(kpis.ytdTarget)} target</div>
          </div>
          {/* TACOS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-3 px-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">TACOS</div>
            <div className={`text-xl font-bold mt-0.5 ${kpis.tacos <= kpis.avgTargetTacos ? 'text-green-700' : 'text-red-700'}`}>
              {kpis.tacos.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Target: {kpis.avgTargetTacos.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Zone 2: Budget Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Budget Planner</h3>
          <div className="flex items-center gap-3">
            {/* Marketplace selector (wireframe) */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              {MARKETPLACES.map(m => {
                const active = selectedMarketplaces.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => {
                      if (active && selectedMarketplaces.length === 1) return; // can't deselect all
                      setSelectedMarketplaces(prev =>
                        active ? prev.filter(x => x !== m) : [...prev, m]
                      );
                    }}
                    className={`px-2 py-1 text-[11px] font-semibold transition-colors ${
                      active ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <LastRefreshed offsetMinutes={14} />
          </div>
        </div>

        {/* Coverage warning banner */}
        {isMultiMarketplace && missingBudgetMarketplaces.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Budget data missing for: <strong>{missingBudgetMarketplaces.join(', ')}</strong>. Totals reflect {selectedMarketplaces.filter(m => ['DE', 'ES'].includes(m)).join(' and ')} only.</span>
          </div>
        )}

        <div className="overflow-x-auto" ref={scrollRef}>
          <table className="w-full border-collapse" style={{ minWidth: '1800px' }}>
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="sticky left-0 z-20 bg-slate-700 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider min-w-[200px] border-r border-slate-600">
                  <span className="text-slate-300">{selectedMarketplaces.length === MARKETPLACES.length ? 'EU 5' : selectedMarketplaces.join(', ')}</span>
                </th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={`px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                      col.kind === 'quarter' ? 'border-l border-slate-500 bg-slate-600' :
                      col.kind === 'total' ? 'border-l-2 border-slate-400 bg-slate-600' : ''
                    }`}
                    style={{ minWidth: col.kind === 'month' ? '90px' : '95px' }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((row) => {
                const isEditable = !!row.editable;
                const isSubtotal = row.styleType === 'subtotal';
                const isVariance = row.styleType === 'variance';

                // Row base classes
                let rowCls = 'border-b border-gray-100';
                if (row.isFirstInGroup) rowCls += ' border-t-2 border-t-gray-200';
                if (isEditable) rowCls += ' bg-blue-50/20 hover:bg-blue-50/40';
                else if (isSubtotal) rowCls += ' bg-gray-50';
                else rowCls += ' bg-white';

                return (
                  <tr key={row.id} className={rowCls}>
                    {/* Label cell */}
                    <td className={`sticky left-0 z-10 px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-100 ${
                      isEditable ? 'bg-blue-50/20' : isSubtotal ? 'bg-gray-50' : 'bg-white'
                    } ${isSubtotal ? 'font-semibold text-gray-900' : isVariance ? 'text-gray-500 italic text-xs pl-8' : 'text-gray-800'}`}>
                      {row.isFirstInGroup && (
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                          {GROUP_LABELS[row.group]}
                        </div>
                      )}
                      {row.label}
                    </td>

                    {/* Data cells */}
                    {COLUMNS.map(col => {
                      const isQ = col.kind === 'quarter';
                      const isTotal = col.kind === 'total';
                      const isAgg = isQ || isTotal;

                      // Get value
                      let value: number | null;
                      if (isAgg) {
                        value = getAggValue(row, col.monthKeys!);
                      } else {
                        value = row.values[col.key as MonthKey];
                      }

                      // Column tint classes
                      let colCls = 'px-3 py-1.5 text-right tabular-nums whitespace-nowrap';
                      if (isQ) colCls += ' border-l border-gray-200 bg-slate-50/50';
                      if (isTotal) colCls += ' border-l-2 border-gray-300 bg-amber-50/30 font-semibold';
                      if (isSubtotal && !isTotal) colCls += ' font-semibold';

                      // Current month italic
                      const monthIdx = col.monthIndex;
                      const isCurrent = monthIdx === CURRENT_MONTH_INDEX;
                      const isFuture = monthIdx != null && monthIdx > CURRENT_MONTH_INDEX;

                      // For actuals rows, future months are empty
                      const isActualsRow = !isEditable && !isSubtotal && !isVariance && row.id !== 'target_tacos';
                      if (!isAgg && isFuture && isActualsRow) {
                        return <td key={col.key} className={colCls} />;
                      }
                      // Variance rows: empty for future months
                      if (!isAgg && isFuture && isVariance) {
                        return <td key={col.key} className={colCls} />;
                      }
                      // Percentage calculated rows: empty for future months
                      if (!isAgg && isFuture && row.type === 'percent' && !isEditable) {
                        return <td key={col.key} className={colCls} />;
                      }

                      // Variance background
                      let varBg = '';
                      if (isVariance && value != null) {
                        if (isAgg) {
                          varBg = getAggVarianceBg(row, col.monthKeys!);
                        } else if (row.varianceMode === 'tacos') {
                          varBg = getTacosBg(col.key as MonthKey);
                        } else {
                          varBg = getVarianceBg(row, value);
                        }
                      }

                      // Just-saved animation
                      const cellKey = `${row.id}-${col.key}`;
                      const isSaved = justSaved === cellKey;

                      // Editing state
                      const isEditing = editingCell?.rowId === row.id && editingCell?.month === col.key;

                      if (isEditing) {
                        return (
                          <td key={col.key} className={`${colCls} p-0`}>
                            <input
                              type="number"
                              autoFocus
                              className="w-full h-full px-2 py-1 text-sm text-right border-2 border-cx-500 rounded outline-none bg-white tabular-nums"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                          </td>
                        );
                      }

                      // Clickable editable cell (monthly only, not Q/Total, single marketplace only)
                      const canEdit = isEditable && !isAgg && !isMultiMarketplace;
                      const audit = isEditable && !isAgg ? auditTrail[cellKey] : null;

                      return (
                        <td
                          key={col.key}
                          className={`${colCls} ${varBg} ${isCurrent && !isEditable ? 'italic' : ''} ${
                            isSaved ? 'animate-pulse bg-blue-100' : ''
                          } ${isEditable && !isAgg ? 'group/cell relative' : ''} ${canEdit ? 'cursor-pointer' : ''}`}
                          onClick={canEdit ? () => startEdit(row.id, col.key as MonthKey, value) : undefined}
                          title={isEditable && !isAgg && isMultiMarketplace ? 'Select a single marketplace to edit budgets' : undefined}
                        >
                          {value != null ? fmtValue(row, value) : (row.type === 'percent' && !isEditable ? 'N/A' : '')}
                          {canEdit && (
                            <Pencil className="w-3 h-3 text-gray-300 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                          )}
                          {audit && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/cell:opacity-100 transition-opacity z-30 whitespace-nowrap">
                              <div className="bg-gray-900 text-white text-[10px] leading-tight rounded-md px-2.5 py-1.5 shadow-lg">
                                <div className="font-medium">{audit.user}</div>
                                <div className="text-gray-400">{audit.date}</div>
                              </div>
                              <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 py-2 border-t border-gray-100 flex items-center gap-6 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
            <span>On/Under target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
            <span>Over target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-50/40 border border-blue-200" />
            <span>Editable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="italic">Italic</span>
            <span>= Current month (partial data)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
