// ─── Overheads (Data → Overheads) ────────────────────────────────────────────
// Source of truth for the P&L "(-) Allocated Overheads" line. Every entry is a
// recurring OR variable business cost that isn't an Amazon fee, ad spend or COGS
// — payroll, software, rent, agency fees, prep, etc. The P&L overheads line = the
// sum of these, normalised to a monthly run-rate and allocated to SKUs by the
// chosen basis. Amounts are stored in EUR (base); display converts per currency.

import { filterOptions } from './dashboardData';

export type OverheadKind = 'fixed' | 'variable';
export type FixedFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one_time';
export type VariableBasis = 'pct_sales' | 'per_order' | 'per_unit';
export type AllocationBasis = 'revenue' | 'units' | 'equal' | 'none';

// ─── Scope — which slice of the account a cost applies to (marketplace / brand / …) ──
export type ScopeLevel = 'all' | 'marketplace' | 'brand' | 'category' | 'subcategory';
export interface OverheadScope { level: ScopeLevel; value: string } // value '' when level === 'all'
export const DEFAULT_SCOPE: OverheadScope = { level: 'all', value: '' };

export const SCOPE_LEVELS: { id: ScopeLevel; label: string }[] = [
  { id: 'all', label: 'Entire account' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'brand', label: 'Brand' },
  { id: 'category', label: 'Category' },
  { id: 'subcategory', label: 'Subcategory' },
];
const SCOPE_LEVEL_LABEL: Record<ScopeLevel, string> = { all: 'Account-wide', marketplace: 'Marketplace', brand: 'Brand', category: 'Category', subcategory: 'Subcategory' };
export const scopeLevelLabel = (l: ScopeLevel) => SCOPE_LEVEL_LABEL[l];

/** Value options for a level, from the app's shared filters (drops the leading "All …"). */
export const scopeValues = (level: ScopeLevel): string[] => {
  switch (level) {
    case 'marketplace': return filterOptions.marketplace.slice(1);
    case 'brand': return filterOptions.brand.slice(1);
    case 'category': return filterOptions.category.slice(1);
    case 'subcategory': return filterOptions.subcategory.slice(1);
    default: return [];
  }
};
export const scopeOf = (e: { scope?: OverheadScope }): OverheadScope => e.scope ?? DEFAULT_SCOPE;
export const scopeLabel = (s: OverheadScope): string => (s.level === 'all' ? 'Account-wide' : s.value);

/** Chart of accounts — anchored on the codes already documented in the P&L tooltip. */
export interface OverheadCategory { id: string; code: string; label: string; color: string; }
export const OVERHEAD_CATEGORIES: OverheadCategory[] = [
  { id: 'payroll',    code: '8010', label: 'Staff & Payroll',       color: '#6366F1' },
  { id: 'software',   code: '8020', label: 'Software & Tools',      color: '#0EA5E9' },
  { id: 'other',      code: '8030', label: 'Other Overheads',       color: '#94A3B8' },
  { id: 'facilities', code: '8040', label: 'Rent & Facilities',     color: '#F59E0B' },
  { id: 'services',   code: '8050', label: 'Professional Services', color: '#10B981' },
  { id: 'agency',     code: '8060', label: 'Agency & Marketing',    color: '#EC4899' },
];
export const catOf = (id: string) => OVERHEAD_CATEGORIES.find((c) => c.id === id) ?? OVERHEAD_CATEGORIES[2];

export interface OverheadEntry {
  id: string;
  name: string;
  kind: OverheadKind;
  categoryId: string;
  // fixed
  amount?: number;            // EUR, per the frequency
  frequency?: FixedFrequency;
  // variable
  basis?: VariableBasis;      // pct_sales | per_order | per_unit
  rate?: number;              // pct_sales → percent (2 = 2%); per_order/per_unit → EUR
  // effective dating
  startDate: string;          // ISO yyyy-mm-dd
  endDate: string | null;     // null = forever
  allocation: AllocationBasis;
  scope?: OverheadScope;      // which slice it applies to (default: account-wide)
  note?: string;
  paused?: boolean;
}

/** Current business run-rate — the denominator variable overheads are costed against.
 *  In production this comes from the last full month of P&L; fixed here for the wireframe. */
export const BUSINESS_BASIS = {
  netRevenueMonthly: 385_000,
  ordersMonthly: 9_500,
  unitsMonthly: 14_200,
};

export const TODAY = '2026-07-13';

export const FREQ_LABEL: Record<FixedFrequency, string> = {
  monthly: 'per month', quarterly: 'per quarter', yearly: 'per year', one_time: 'one-off',
};
export const BASIS_LABEL: Record<VariableBasis, string> = {
  pct_sales: '% of sales', per_order: 'per order', per_unit: 'per unit sold',
};
export const ALLOCATION_LABEL: Record<AllocationBasis, string> = {
  revenue: 'By revenue share', units: 'By units sold', equal: 'Split equally', none: 'Company-level',
};
export const ALLOCATION_HINT: Record<AllocationBasis, string> = {
  revenue: 'Spread across SKUs in proportion to their net revenue — best for costs that scale with sales (agency fees, payment fees).',
  units: 'Spread across SKUs in proportion to units sold — best for physical handling (prep, storage, freight).',
  equal: 'Split evenly across active SKUs — best for costs that don\'t track sales (a fixed software seat, a trademark).',
  none: 'Kept at company level and shown only on the total P&L — not pushed down to per-SKU profit.',
};

/** Normalise any entry to a monthly EUR run-rate. One-off costs return 0 (they don't recur). */
export function monthlyRunRate(e: OverheadEntry): number {
  if (e.paused) return 0;
  if (e.kind === 'fixed') {
    const a = e.amount ?? 0;
    switch (e.frequency) {
      case 'monthly': return a;
      case 'quarterly': return a / 3;
      case 'yearly': return a / 12;
      case 'one_time': return 0;
      default: return 0;
    }
  }
  const r = e.rate ?? 0;
  switch (e.basis) {
    case 'pct_sales': return (r / 100) * BUSINESS_BASIS.netRevenueMonthly;
    case 'per_order': return r * BUSINESS_BASIS.ordersMonthly;
    case 'per_unit': return r * BUSINESS_BASIS.unitsMonthly;
    default: return 0;
  }
}

export type OverheadStatus = 'active' | 'scheduled' | 'expired' | 'paused';
export function statusOf(e: OverheadEntry, today = TODAY): OverheadStatus {
  if (e.paused) return 'paused';
  if (e.startDate > today) return 'scheduled';
  if (e.endDate && e.endDate < today) return 'expired';
  return 'active';
}
export const isLive = (e: OverheadEntry) => statusOf(e) === 'active';

/** Human-readable rate/amount, e.g. "€14,500 / month" or "2% of sales". */
export function rateLabel(e: OverheadEntry): string {
  if (e.kind === 'fixed') return `${FREQ_LABEL[e.frequency ?? 'monthly']}`;
  return BASIS_LABEL[e.basis ?? 'pct_sales'];
}

let _seq = 100;
export const nextId = () => `oh_${++_seq}`;

export const SEED_OVERHEADS: OverheadEntry[] = [
  { id: 'oh_1', name: 'Amazon team salaries', kind: 'fixed', categoryId: 'payroll', amount: 14_500, frequency: 'monthly', startDate: '2026-01-01', endDate: null, allocation: 'revenue', note: '3 FTE — brand, ads, ops' },
  { id: 'oh_2', name: 'Software stack (Helium 10, Clarisix, Sellerboard)', kind: 'fixed', categoryId: 'software', amount: 1_250, frequency: 'monthly', startDate: '2025-06-01', endDate: null, allocation: 'equal' },
  { id: 'oh_3', name: 'Warehouse & office rent (DE)', kind: 'fixed', categoryId: 'facilities', amount: 2_400, frequency: 'monthly', startDate: '2025-01-01', endDate: null, allocation: 'units', scope: { level: 'marketplace', value: 'Amazon DE' } },
  { id: 'oh_4', name: 'Accounting & EU VAT compliance', kind: 'fixed', categoryId: 'services', amount: 900, frequency: 'monthly', startDate: '2025-03-01', endDate: null, allocation: 'revenue' },
  { id: 'oh_5', name: 'Trademark renewal & product liability insurance', kind: 'fixed', categoryId: 'services', amount: 7_200, frequency: 'yearly', startDate: '2026-01-01', endDate: null, allocation: 'equal', scope: { level: 'brand', value: 'Brand A' } },
  { id: 'oh_6', name: 'A+ photography & content refresh', kind: 'fixed', categoryId: 'agency', amount: 3_500, frequency: 'one_time', startDate: '2026-07-05', endDate: null, allocation: 'equal', note: 'Q3 catalogue refresh', scope: { level: 'category', value: 'Wellness' } },
  { id: 'oh_7', name: 'Agency management fee (Brand A)', kind: 'variable', categoryId: 'agency', basis: 'pct_sales', rate: 2, startDate: '2025-09-01', endDate: null, allocation: 'revenue', scope: { level: 'brand', value: 'Brand A' } },
  { id: 'oh_8', name: 'Prep, labelling & polybagging (DE)', kind: 'variable', categoryId: 'other', basis: 'per_unit', rate: 0.18, startDate: '2025-01-01', endDate: null, allocation: 'units', scope: { level: 'marketplace', value: 'Amazon DE' } },
  { id: 'oh_9', name: 'Payment & FX fees', kind: 'variable', categoryId: 'services', basis: 'pct_sales', rate: 0.6, startDate: '2025-01-01', endDate: null, allocation: 'revenue' },
  { id: 'oh_10', name: 'Q4 seasonal contractor', kind: 'fixed', categoryId: 'payroll', amount: 1_800, frequency: 'monthly', startDate: '2026-09-01', endDate: '2026-12-31', allocation: 'revenue', note: 'Peak-season support' },
  { id: 'oh_11', name: 'Legacy keyword tool', kind: 'fixed', categoryId: 'software', amount: 300, frequency: 'monthly', startDate: '2024-01-01', endDate: '2026-03-31', allocation: 'equal', note: 'Replaced by Clarisix' },
];
