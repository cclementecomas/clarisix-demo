// ─── Budget Data ─────────────────────────────────────────────────────────────
// Realistic EUR budget/actuals for wireframe. Jan–Mar have full actuals,
// Apr is partial (current month), May–Dec are future (no actuals).

export type MonthKey = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';

export const MONTHS: { key: MonthKey; label: string }[] = [
  { key: 'jan', label: 'Jan' }, { key: 'feb', label: 'Feb' }, { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Apr' }, { key: 'may', label: 'May' }, { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' }, { key: 'aug', label: 'Aug' }, { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Oct' }, { key: 'nov', label: 'Nov' }, { key: 'dec', label: 'Dec' },
];

export type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4';

export const QUARTERS: { key: QuarterKey; label: string; months: MonthKey[] }[] = [
  { key: 'q1', label: 'Q1', months: ['jan', 'feb', 'mar'] },
  { key: 'q2', label: 'Q2', months: ['apr', 'may', 'jun'] },
  { key: 'q3', label: 'Q3', months: ['jul', 'aug', 'sep'] },
  { key: 'q4', label: 'Q4', months: ['oct', 'nov', 'dec'] },
];

// Current month index (0-based). For wireframe: March (2) = last complete, April (3) = current/partial.
export const CURRENT_MONTH_INDEX = 3; // April
export const LAST_COMPLETE_MONTH_INDEX = 2; // March

export type RowValues = Record<MonthKey, number | null>;

// ─── Default editable budget/target values (EUR) ─────────────────────────────

export const defaultPpcBudget: RowValues = {
  jan: 32000, feb: 35000, mar: 38000, apr: 36000, may: 40000, jun: 42000,
  jul: 38000, aug: 45000, sep: 43000, oct: 48000, nov: 52000, dec: 55000,
};

export const defaultDspBudget: RowValues = {
  jan: 9500, feb: 10000, mar: 11000, apr: 10500, may: 12000, jun: 13000,
  jul: 11500, aug: 14000, sep: 13500, oct: 15000, nov: 16000, dec: 17000,
};

export const defaultSalesTarget: RowValues = {
  jan: 380000, feb: 400000, mar: 420000, apr: 410000, may: 440000, jun: 460000,
  jul: 430000, aug: 470000, sep: 455000, oct: 490000, nov: 520000, dec: 550000,
};

export const defaultTargetTacos: RowValues = {
  jan: 12.0, feb: 12.0, mar: 12.5, apr: 12.0, may: 12.5, jun: 12.5,
  jul: 12.0, aug: 13.0, sep: 13.0, oct: 13.0, nov: 13.5, dec: 13.5,
};

// ─── Actual spend/sales data (EUR, only Jan–Mar full, Apr partial) ───────────

export const ppcSpendActuals: RowValues = {
  jan: 29800,  // under budget (green)
  feb: 37200,  // over budget (red)
  mar: 36500,  // under budget (green)
  apr: 18200,  // partial month
  may: null, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null,
};

export const dspSpendActuals: RowValues = {
  jan: 9200,
  feb: 10800,  // over budget (red)
  mar: 10200,
  apr: 5100,   // partial month
  may: null, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null,
};

export const totalSalesActuals: RowValues = {
  jan: 365000,  // below target (red)
  feb: 418000,  // above target (green)
  mar: 432000,  // above target (green)
  apr: 215000,  // partial month
  may: null, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null,
};

// Paid sales is a fraction of total sales
export const paidSalesActuals: RowValues = {
  jan: 142000,
  feb: 171000,
  mar: 168000,
  apr: 89000,
  may: null, jun: null, jul: null, aug: null, sep: null, oct: null, nov: null, dec: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function sumMonths(values: RowValues, monthKeys: MonthKey[]): number | null {
  let sum = 0;
  let hasAny = false;
  for (const k of monthKeys) {
    if (values[k] != null) { sum += values[k]!; hasAny = true; }
  }
  return hasAny ? sum : null;
}

export function sumAll(values: RowValues): number | null {
  return sumMonths(values, MONTHS.map(m => m.key));
}

/** YTD sum through last complete month */
export function ytdSum(values: RowValues): number | null {
  const ytdMonths = MONTHS.slice(0, LAST_COMPLETE_MONTH_INDEX + 1).map(m => m.key);
  return sumMonths(values, ytdMonths);
}

// ─── Audit trail (simulated) ────────────────────────────────────────────────

export interface CellAudit {
  date: string;   // e.g. "Mar 12, 2026"
  user: string;   // e.g. "Maria S."
}

/** key = "rowId-month", e.g. "ppc_budget-jan" */
export const defaultAuditTrail: Record<string, CellAudit> = {
  // PPC Budget — set in bulk in early Jan, Feb revised mid-month
  'ppc_budget-jan': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'ppc_budget-feb': { date: 'Feb 14, 2026', user: 'Maria S.' },
  'ppc_budget-mar': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'ppc_budget-apr': { date: 'Mar 28, 2026', user: 'Carlos E.' },
  'ppc_budget-may': { date: 'Mar 28, 2026', user: 'Carlos E.' },
  'ppc_budget-jun': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'ppc_budget-jul': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'ppc_budget-aug': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'ppc_budget-sep': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'ppc_budget-oct': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'ppc_budget-nov': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'ppc_budget-dec': { date: 'Jan 3, 2026', user: 'Maria S.' },
  // DSP Budget
  'dsp_budget-jan': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-feb': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-mar': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-apr': { date: 'Mar 28, 2026', user: 'Carlos E.' },
  'dsp_budget-may': { date: 'Mar 28, 2026', user: 'Carlos E.' },
  'dsp_budget-jun': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-jul': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-aug': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-sep': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-oct': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-nov': { date: 'Jan 3, 2026', user: 'Maria S.' },
  'dsp_budget-dec': { date: 'Jan 3, 2026', user: 'Maria S.' },
  // Sales Target
  'sales_target-jan': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-feb': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-mar': { date: 'Feb 20, 2026', user: 'Carlos E.' },
  'sales_target-apr': { date: 'Mar 15, 2026', user: 'Maria S.' },
  'sales_target-may': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-jun': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-jul': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-aug': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-sep': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-oct': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-nov': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'sales_target-dec': { date: 'Dec 18, 2025', user: 'Maria S.' },
  // Target TACOS
  'target_tacos-jan': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-feb': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-mar': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-apr': { date: 'Mar 15, 2026', user: 'Carlos E.' },
  'target_tacos-may': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-jun': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-jul': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-aug': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-sep': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-oct': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-nov': { date: 'Dec 18, 2025', user: 'Maria S.' },
  'target_tacos-dec': { date: 'Dec 18, 2025', user: 'Maria S.' },
};
