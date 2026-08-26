// ─── Customer Experience — synthetic demonstration data ──────────────────────
// DEMONSTRATION DATA ONLY. All values are generated, not real, and carry no
// competitor identifiers. Structured so it can later be swapped for a Clarisix API.
//
// ─── HOW EVERY METRIC IS COMPUTED FROM AMAZON DATA (no AMC) ───────────────────
// The full recipe lives in knowledge/knowledge_base.md ("Customer Experience —
// data sources & metric methodology"). Two SP-API reports are the backbone:
//   1. All Orders Report (GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL):
//      order id, sku/asin, quantity, item-price, promotion/discount, and the
//      Subscribe & Save flag — the ledger of *what* sold.
//   2. Amazon Fulfilled Shipments (GET_AMAZON_FULFILLED_SHIPMENTS_DATA_GENERAL):
//      carries the anonymised buyer-id / recipient fields → the CUSTOMER STITCH
//      KEY that lets us tie repeat orders to the same person. This is how we
//      reconstruct order-history WITHOUT AMC.
//   + Ads API (PPC spend/sales → ACoS, CAC), Product-fees + Settlement reports
//     (referral/FBA fees, refunds → contribution), user-supplied COGS.
//
// Alignment with the proven methodology (validated against the competitor glossary):
//  • NTB = a customer's FIRST-EVER order in full order history (no 12-month
//    look-back) — stricter and more accurate than Amazon Ads' NTB.
//  • Subscription quality = REAL vs FAKE Subscribe & Save. Real = subscriber with
//    ≥2 separate S&S orders (validated recurring). Fake = a single S&S order that
//    never renewed (one-off coupon users) + promotional first-order-only subs.
//  • Acquisition ceiling (safe/BE ACoS at horizon H) = (contribution per unit ×
//    LTV in UNITS at H) ÷ ASP. LTV is expressed in units, then × ASP for revenue.
//  • LTV:CAC = customer LTV ÷ CAC (≥3:1 healthy, <1:1 unprofitable).
//  • The most recent 2–4 weeks / immature cohorts are held back (blank, never
//    interpolated) because their repeat & S&S-renewal signal isn't observable yet.
//  • Missing current-ACoS/CAC is represented as null and NEVER coerced to 0.
//  • All thresholds live in CX_CONFIG and are meant to be configurable server-side.

export type Marketplace = 'amazon.com' | 'amazon.de' | 'amazon.co.uk';
export type ProductStatus =
  | 'strength' | 'watch' | 'acquisition_risk' | 'loyalty_risk' | 'subscription_quality_risk' | 'incomplete_data';

export const STATUS_META: Record<ProductStatus, { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }> = {
  strength: { label: 'Strength', tone: 'good' },
  watch: { label: 'Watch', tone: 'warn' },
  acquisition_risk: { label: 'Acquisition risk', tone: 'bad' },
  loyalty_risk: { label: 'Loyalty risk', tone: 'bad' },
  subscription_quality_risk: { label: 'Subscription-quality risk', tone: 'warn' },
  incomplete_data: { label: 'Incomplete data', tone: 'neutral' },
};

// Configurable thresholds (would be server-driven).
export const CX_CONFIG = {
  ntbDeclinePct: -10,          // NTB sales change at/under this → acquisition-risk signal
  repeatSharePpGain: 2,        // repeat share gain (pp) → loyalty-strengthening signal
  subSharePpGain: 2,           // subscription share gain (pp) → signal
  lowQualitySubSharePct: 25,   // low-quality subscription share above this → quality-risk signal
  concentrationPct: 40,        // one product explaining ≥ this % of a portfolio decline → concentration signal
  matureCohortMonths: 6,       // a cohort is "sufficiently mature" from this maturity month
};

export const METRIC_DEFS: Record<string, string> = {
  repeatSales: 'Sales from customers who had purchased from the brand before the selected period.',
  ntbSales: 'New-to-brand sales — first-ever purchases from the brand in the selected period.',
  subSales: 'Subscribe & Save sales — recurring subscription orders.',
  repeatShare: 'Repeat sales ÷ total sales.',
  ntbShare: 'New-to-brand sales ÷ total sales.',
  subShare: 'Subscribe & Save sales ÷ total sales.',
  recurringShare: 'Real Subscribe & Save — subscribers with ≥2 separate S&S orders (validated recurring revenue). Share of all subscription sales.',
  lowQualityShare: 'Fake Subscribe & Save — a single S&S order that never renewed (one-off coupon users) plus promotional subs. Share of all subscription sales.',
  acquisitionCeiling: 'The highest ACoS you can pay and still break even, given a customer’s value over the horizon. Safe ACoS(H) = (contribution per unit × LTV in units at H) ÷ average selling price.',
  paybackPeriod: 'Months until cumulative per-customer contribution recovers the acquisition cost (CAC).',
  ltv: 'Customer value accumulation — cumulative contribution per customer at a given month of maturity.',
  retentionRate: 'Share of a cohort’s customers still purchasing at a given month of maturity.',
  ltvCac: 'Lifetime value ÷ customer acquisition cost. ≥3:1 is healthy; <1:1 means you spend more to acquire a customer than they return.',
  timeToSecond: 'Average number of days between a customer’s first and second order — sets retargeting and Subscribe & Save timing windows.',
  repeatWindows: 'How repeat orders are distributed by time since the first order — where the reorder demand actually lands.',
};

const fmtMoney = (v: number) => v;

// ─── Products (synthetic Clarisix demo catalogue) ────────────────────────────
export interface CxProduct {
  asin: string;
  parentAsin: string;
  childAsin: string;
  title: string;
  marketplace: Marketplace;
  hue: number; // for the placeholder thumbnail swatch
  // portfolio
  salesCur: number; salesPrev: number;
  // repeat
  repeatCur: number; repeatPrev: number;
  // new-to-brand
  ntbCur: number; ntbPrev: number;
  // subscriptions
  subCur: number; subPrev: number;
  // subscription quality (null = not supplied)
  subFullPrice: number | null; subPromo: number | null; subFirstOrderOnly: number | null;
  // economics — asp from All Orders; contribution from fees (Product-fees/Settlement) + user COGS
  asp: number; contributionPerUnit: number;
  currentAcos: number | null; spend: number | null;  // Ads API; null when Ads not connected
  cac: number | null;                                  // Ads spend ÷ NTB customers; null when Ads not connected
  // LTV in UNITS at 1/3/6/12 months of maturity (avg units a customer buys, cohort-measured)
  ltvU1: number; ltvU3: number; ltvU6: number; ltvU12: number;
}

// hand-tuned so the portfolio tells a story: loyalty up, NTB down, one concentrated loser,
// a couple of subscription-quality problems, and some missing current-ACoS.
export const cxProducts: CxProduct[] = [
  { asin: 'B0DEMO201', parentAsin: 'P-WELL-01', childAsin: 'B0DEMO201', title: 'Daily Multivitamin — 120ct', marketplace: 'amazon.com', hue: 262,
    salesCur: 486000, salesPrev: 452000, repeatCur: 351000, repeatPrev: 305000, ntbCur: 71000, ntbPrev: 84000, subCur: 214000, subPrev: 176000,
    subFullPrice: 172000, subPromo: 30000, subFirstOrderOnly: 12000, asp: 28.9, contributionPerUnit: 11.4, currentAcos: 0.19, spend: 41000, cac: 6.8,
    ltvU1: 1.1, ltvU3: 1.8, ltvU6: 2.4, ltvU12: 3.0 },
  { asin: 'B0DEMO202', parentAsin: 'P-WELL-01', childAsin: 'B0DEMO202', title: 'Daily Multivitamin — 60ct', marketplace: 'amazon.com', hue: 254,
    salesCur: 168000, salesPrev: 191000, repeatCur: 96000, repeatPrev: 101000, ntbCur: 33000, ntbPrev: 52000, subCur: 61000, subPrev: 66000,
    subFullPrice: 41000, subPromo: 14000, subFirstOrderOnly: 6000, asp: 20.5, contributionPerUnit: 7.9, currentAcos: 0.27, spend: 22000, cac: 6.5,
    ltvU1: 1.1, ltvU3: 1.6, ltvU6: 2.1, ltvU12: 2.6 },
  { asin: 'B0DEMO203', parentAsin: 'P-IRON-01', childAsin: 'B0DEMO203', title: 'Gentle Iron Complex', marketplace: 'amazon.com', hue: 12,
    salesCur: 262000, salesPrev: 214000, repeatCur: 158000, repeatPrev: 118000, ntbCur: 54000, ntbPrev: 51000, subCur: 74000, subPrev: 55000,
    subFullPrice: 66000, subPromo: 6000, subFirstOrderOnly: 2000, asp: 23.5, contributionPerUnit: 9.2, currentAcos: 0.22, spend: 28000, cac: 6.4,
    ltvU1: 1.1, ltvU3: 1.9, ltvU6: 2.6, ltvU12: 3.4 },
  { asin: 'B0DEMO204', parentAsin: 'P-PROB-01', childAsin: 'B0DEMO204', title: 'Raw Probiotics 100B CFU', marketplace: 'amazon.com', hue: 150,
    salesCur: 121000, salesPrev: 118000, repeatCur: 72000, repeatPrev: 63000, ntbCur: 21000, ntbPrev: 28000, subCur: 44000, subPrev: 31000,
    subFullPrice: 25000, subPromo: 13000, subFirstOrderOnly: 6000, asp: 31.3, contributionPerUnit: 12.9, currentAcos: null, spend: null, cac: null,
    ltvU1: 1.2, ltvU3: 2.0, ltvU6: 2.9, ltvU12: 3.8 },
  { asin: 'B0DEMO205', parentAsin: 'P-ELEC-01', childAsin: 'B0DEMO205', title: 'Electrolyte Powder — Hydration', marketplace: 'amazon.com', hue: 200,
    salesCur: 208000, salesPrev: 251000, repeatCur: 121000, repeatPrev: 128000, ntbCur: 34000, ntbPrev: 63000, subCur: 66000, subPrev: 70000,
    subFullPrice: 39000, subPromo: 18000, subFirstOrderOnly: 9000, asp: 24.9, contributionPerUnit: 8.6, currentAcos: 0.34, spend: 39000, cac: 8.2,
    ltvU1: 1.0, ltvU3: 1.4, ltvU6: 1.9, ltvU12: 2.3 },
  { asin: 'B0DEMO206', parentAsin: 'P-OMEGA-01', childAsin: 'B0DEMO206', title: 'Omega-3 Fish Oil Softgels', marketplace: 'amazon.co.uk', hue: 30,
    salesCur: 96000, salesPrev: 88000, repeatCur: 58000, repeatPrev: 47000, ntbCur: 18000, ntbPrev: 19000, subCur: 33000, subPrev: 24000,
    subFullPrice: 29000, subPromo: 3000, subFirstOrderOnly: 1000, asp: 20.1, contributionPerUnit: 7.3, currentAcos: 0.24, spend: 12000, cac: 6.3,
    ltvU1: 1.1, ltvU3: 1.8, ltvU6: 2.5, ltvU12: 3.3 },
  { asin: 'B0DEMO207', parentAsin: 'P-COLL-01', childAsin: 'B0DEMO207', title: 'Collagen Peptides — Unflavoured', marketplace: 'amazon.com', hue: 330,
    salesCur: 174000, salesPrev: 168000, repeatCur: 104000, repeatPrev: 92000, ntbCur: 29000, ntbPrev: 31000, subCur: 52000, subPrev: 41000,
    subFullPrice: 47000, subPromo: 4000, subFirstOrderOnly: 1000, asp: 29.6, contributionPerUnit: 11.9, currentAcos: null, spend: null, cac: null,
    ltvU1: 1.2, ltvU3: 2.1, ltvU6: 3.0, ltvU12: 4.0 },
  { asin: 'B0DEMO208', parentAsin: 'P-MAG-01', childAsin: 'B0DEMO208', title: 'Magnesium Glycinate Capsules', marketplace: 'amazon.de', hue: 280,
    salesCur: 83000, salesPrev: 79000, repeatCur: 44000, repeatPrev: 38000, ntbCur: 16000, ntbPrev: 21000, subCur: 27000, subPrev: 19000,
    subFullPrice: 15000, subPromo: 8000, subFirstOrderOnly: 4000, asp: 21.6, contributionPerUnit: 8.1, currentAcos: 0.29, spend: 9000, cac: 6.6,
    ltvU1: 1.0, ltvU3: 1.5, ltvU6: 2.1, ltvU12: 2.7 },
];

export const round = (v: number) => Math.round(v);
export const pctChange = (cur: number, prev: number) => (prev === 0 ? 0 : ((cur - prev) / prev) * 100);
export const share = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100);

// ─── Portfolio roll-ups ──────────────────────────────────────────────────────
export interface PortfolioTotals {
  salesCur: number; salesPrev: number;
  repeatCur: number; repeatPrev: number;
  ntbCur: number; ntbPrev: number;
  subCur: number; subPrev: number;
  ordersCur: number; ordersPrev: number;
}
export function portfolioTotals(products = cxProducts): PortfolioTotals {
  const s = (k: keyof CxProduct) => products.reduce((a, p) => a + (p[k] as number), 0);
  return {
    salesCur: s('salesCur'), salesPrev: s('salesPrev'),
    repeatCur: s('repeatCur'), repeatPrev: s('repeatPrev'),
    ntbCur: s('ntbCur'), ntbPrev: s('ntbPrev'),
    subCur: s('subCur'), subPrev: s('subPrev'),
    ordersCur: round(s('salesCur') / 26), ordersPrev: round(s('salesPrev') / 25.4),
  };
}

// Product-level subscription quality shares (null when any component is not supplied).
// recurringShare = REAL S&S (subscriber with ≥2 separate S&S orders — subFullPrice proxy).
// lowQualityShare = FAKE S&S (single S&S order never renewed = subFirstOrderOnly, + promo).
export function subQuality(p: CxProduct): { recurringShare: number | null; lowQualityShare: number | null; total: number | null } {
  if (p.subFullPrice == null || p.subPromo == null || p.subFirstOrderOnly == null) return { recurringShare: null, lowQualityShare: null, total: null };
  const total = p.subFullPrice + p.subPromo + p.subFirstOrderOnly;
  return { recurringShare: share(p.subFullPrice, total), lowQualityShare: share(p.subPromo + p.subFirstOrderOnly, total), total };
}

export function productStatus(p: CxProduct): ProductStatus {
  const ntbCh = pctChange(p.ntbCur, p.ntbPrev);
  const repeatCh = pctChange(p.repeatCur, p.repeatPrev);
  const salesCh = pctChange(p.salesCur, p.salesPrev);
  const q = subQuality(p);
  if (p.currentAcos == null && p.subFullPrice == null) return 'incomplete_data';
  if (q.lowQualityShare != null && q.lowQualityShare > CX_CONFIG.lowQualitySubSharePct && salesCh < 0) return 'subscription_quality_risk';
  if (ntbCh <= CX_CONFIG.ntbDeclinePct) return 'acquisition_risk';
  if (repeatCh < 0 && salesCh < 0) return 'loyalty_risk';
  if (salesCh > 3 && repeatCh > 0) return 'strength';
  return 'watch';
}

// ─── Weekly time series (customer mix + subscriptions) ───────────────────────
export interface WeekPoint {
  week: string; label: string;
  repeat: number; ntb: number; total: number;
  sub: number; regular: number; subShare: number;
  subNewOrders: number; subPromoOrders: number;
  subRecurring: number; subLowQuality: number;
}
// 16 weeks; a comparison "previous" block is the first 8, "current" the last 8.
const WEEK_LABELS = ['05 Jan','12 Jan','19 Jan','26 Jan','02 Feb','09 Feb','16 Feb','23 Feb','02 Mar','09 Mar','16 Mar','23 Mar','30 Mar','06 Apr','13 Apr','20 Apr'];
export const weeklySeries: WeekPoint[] = WEEK_LABELS.map((label, i) => {
  const t = i / (WEEK_LABELS.length - 1);
  const total = 300000 + 90000 * Math.sin(t * Math.PI * 1.3) + 40000 * t;
  const repeatShareT = 0.66 + 0.09 * t;                 // repeat share trends UP
  const repeat = total * repeatShareT;
  const ntb = total * (0.30 - 0.10 * t);                // NTB share trends DOWN
  const subShareT = 0.32 + 0.05 * t;
  const sub = total * subShareT;
  const lowQ = 0.20 + 0.08 * Math.max(0, Math.sin(t * Math.PI * 2));
  return {
    week: `2026-${label}`, label,
    repeat: round(repeat), ntb: round(ntb), total: round(total),
    sub: round(sub), regular: round(total - sub), subShare: +(subShareT * 100).toFixed(1),
    subNewOrders: round(sub / 26 * 0.7), subPromoOrders: round(sub / 26 * 0.3 * (1 + t)),
    subRecurring: round(sub * (1 - lowQ)), subLowQuality: round(sub * lowQ),
  };
});
fmtMoney(0);

// ─── Cohort analytics ────────────────────────────────────────────────────────
export type CohortMetricKey =
  | 'unitsPerCustomer' | 'revenuePerCustomer' | 'profitPerCustomer' | 'profitMargin'
  | 'retainedCustomers' | 'retentionRate' | 'totalRevenue' | 'cumulativeRevenue';

export const COHORT_METRICS: { key: CohortMetricKey; label: string; format: 'money' | 'num' | 'pct' | 'int'; calc?: boolean }[] = [
  { key: 'revenuePerCustomer', label: 'Revenue per customer', format: 'money' },
  { key: 'profitPerCustomer', label: 'Profit per customer', format: 'money', calc: true },
  { key: 'profitMargin', label: 'Profit margin', format: 'pct', calc: true },
  { key: 'unitsPerCustomer', label: 'Units per customer', format: 'num' },
  { key: 'retainedCustomers', label: 'Retained customers', format: 'int' },
  { key: 'retentionRate', label: 'Retention rate', format: 'pct' },
  { key: 'totalRevenue', label: 'Total cohort revenue', format: 'money' },
  { key: 'cumulativeRevenue', label: 'Customer value accumulation', format: 'money', calc: true },
];

export interface CohortRow {
  cohort: string;      // 'Mar 2024'
  ageMonths: number;   // how many maturity months are available (0-indexed → age+1 columns)
  newCustomers: number;
  ppcSpend: number;
  cac: number;
  firstPurchase: number;
  quality: number;     // hidden strength factor driving the story
}

// Single "as-of" anchor computed at page load, so the whole CX calendar stays
// coherent with the real current date instead of drifting against hardcoded months.
export const AS_OF = new Date();
const monthLabel = (d: Date) => d.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // 'Nov 2025'
// "Data through <today>" for the Freshness badge, derived from the same anchor.
export const DATA_THROUGH_LABEL = `Data through ${AS_OF.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · updated 2h ago`;

// 16 monthly cohorts ending at the CURRENT month (newest last, age 0), generated at
// runtime from AS_OF — the newest cohort is always "this month", so the chart's
// "newest mature cohort" is honest whenever the demo is viewed.
const COHORT_SPAN = 16;
const COHORT_MONTHS = Array.from({ length: COHORT_SPAN }, (_, i) =>
  monthLabel(new Date(AS_OF.getFullYear(), AS_OF.getMonth() - (COHORT_SPAN - 1 - i), 1)));
export const MAX_MATURITY = 12;
export const cohortRows: CohortRow[] = COHORT_MONTHS.map((cohort, i) => {
  const ageMonths = Math.min(MAX_MATURITY, COHORT_MONTHS.length - 1 - i); // newest → 0 mature months
  const quality = 0.9 + 0.35 * Math.sin(i * 0.7) + (i >= 12 ? -0.12 : 0);  // recent cohorts a touch weaker
  const newCustomers = round(6800 + 2600 * Math.sin(i * 0.9) + 1200 * Math.cos(i * 0.4));
  const cac = +(6.4 + 3.2 * Math.abs(Math.sin(i * 0.5))).toFixed(2);
  return { cohort, ageMonths, newCustomers, ppcSpend: round(newCustomers * cac), cac, firstPurchase: +(1.1 + 0.06 * Math.sin(i)).toFixed(2), quality: +quality.toFixed(3) };
});

/** Value of a cohort metric at maturity month m, or null when not yet matured. */
export function cohortValue(row: CohortRow, metric: CohortMetricKey, m: number): number | null {
  if (m > row.ageMonths) return null; // immature / not yet available
  const q = row.quality;
  const retention = Math.max(0.06, Math.exp(-m / (5.2 * q)) * (m === 0 ? 1 : 0.62 * q + 0.2)); // 100% at m0, decays
  const rpc = (24 * q) * (1 - Math.exp(-(m + 0.6) / (3.4))) + 3.2 * m * 0.32 * q;               // cumulative revenue/customer
  const upc = 1.0 + 0.42 * m * q * 0.5;
  const marginPct = Math.min(46, 8 + 3.1 * m * q);
  const profitPer = rpc * (marginPct / 100) - row.cac;
  switch (metric) {
    case 'retentionRate': return +(retention * 100).toFixed(1);
    case 'retainedCustomers': return round(row.newCustomers * retention);
    case 'revenuePerCustomer': return +rpc.toFixed(2);
    case 'unitsPerCustomer': return +upc.toFixed(2);
    case 'profitMargin': return +marginPct.toFixed(1);
    case 'profitPerCustomer': return +profitPer.toFixed(2);
    case 'cumulativeRevenue': return round(rpc * row.newCustomers);
    case 'totalRevenue': return round(rpc * row.newCustomers * (m === 0 ? 1 : retention * 1.6));
  }
}

// A mature reference cohort, a strong historical one, and a portfolio benchmark curve.
export function retentionCurves(metric: CohortMetricKey) {
  const recent = cohortRows.find((r) => r.ageMonths >= CX_CONFIG.matureCohortMonths && r.ageMonths <= CX_CONFIG.matureCohortMonths + 1) ?? cohortRows[9];
  const strong = [...cohortRows].filter((r) => r.ageMonths >= MAX_MATURITY).sort((a, b) => b.quality - a.quality)[0] ?? cohortRows[0];
  const months = Array.from({ length: MAX_MATURITY + 1 }, (_, m) => m);
  const benchmark = months.map((m) => {
    const vals = cohortRows.filter((r) => r.ageMonths >= m).map((r) => cohortValue(r, metric, m)!).filter((v) => v != null);
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
  });
  return {
    months,
    recent: { label: recent.cohort, values: months.map((m) => cohortValue(recent, metric, m)) },
    strong: { label: strong.cohort, values: months.map((m) => cohortValue(strong, metric, m)) },
    benchmark: { label: 'Portfolio benchmark', values: benchmark },
  };
}

// ─── Subscription economics (acquisition ceiling) ────────────────────────────
export interface SubEconRow {
  asin: string; parentAsin: string; childAsin: string; title: string; marketplace: Marketplace; hue: number;
  asp: number; contributionPerUnit: number;
  safe1: number; safe3: number; safe6: number; safe12: number;
  currentAcos: number | null; spend: number | null; payback: number | null;
  cac: number | null; ltvCac: number | null;
  ltv1: number; ltv3: number; ltv6: number; ltv12: number;   // revenue LTV = units × ASP
  status: 'headroom' | 'near_limit' | 'over_limit' | 'insufficient_data';
}
export function subEconomics(): SubEconRow[] {
  return cxProducts.map((p) => {
    const ppu = p.contributionPerUnit;
    // Safe ACoS(H) = (contribution per unit × LTV in units at H) ÷ ASP  (MRP BE-ACoS formula).
    const safe = (u: number) => +((ppu * u) / p.asp * 100).toFixed(1);
    const rev = (u: number) => +(u * p.asp).toFixed(1);                 // revenue LTV per customer
    const safe1 = safe(p.ltvU1), safe3 = safe(p.ltvU3), safe6 = safe(p.ltvU6), safe12 = safe(p.ltvU12);
    const profitLtv12 = ppu * p.ltvU12;                                 // gross-profit LTV over 12 months
    const ltvCac = p.cac == null ? null : +(profitLtv12 / p.cac).toFixed(1);
    const payback = p.cac == null ? null : +(p.cac / (profitLtv12 / 12)).toFixed(1);  // months to recover CAC
    let status: SubEconRow['status'];
    if (p.currentAcos == null) status = 'insufficient_data';
    else {
      const cur = p.currentAcos * 100;
      status = cur > safe6 ? 'over_limit' : cur > safe6 * 0.85 ? 'near_limit' : 'headroom';
    }
    return { asin: p.asin, parentAsin: p.parentAsin, childAsin: p.childAsin, title: p.title, marketplace: p.marketplace, hue: p.hue,
      asp: p.asp, contributionPerUnit: ppu, safe1, safe3, safe6, safe12,
      currentAcos: p.currentAcos == null ? null : +(p.currentAcos * 100).toFixed(1), spend: p.spend, payback,
      cac: p.cac, ltvCac,
      ltv1: rev(p.ltvU1), ltv3: rev(p.ltvU3), ltv6: rev(p.ltvU6), ltv12: rev(p.ltvU12), status };
  });
}

// ─── Portfolio second-purchase behaviour (repeat timing & LTV:CAC) ────────────
// Time-to-second-purchase: mean days between 1st and 2nd order for customers with ≥2 orders.
export const TIME_TO_SECOND_PURCHASE_DAYS = 34;
// Distribution of repeat orders by time since a customer's first order (sums to 100%).
export const REPEAT_WINDOWS: { label: string; pct: number }[] = [
  { label: '0–7d', pct: 6 }, { label: '8–15d', pct: 9 }, { label: '16–30d', pct: 18 },
  { label: '31–60d', pct: 24 }, { label: '61–90d', pct: 17 }, { label: '91–120d', pct: 11 },
  { label: '120–150d', pct: 7 }, { label: '150–180d', pct: 5 }, { label: '180d+', pct: 3 },
];
// Portfolio LTV:CAC = mean of per-product 12-month gross-profit LTV ÷ CAC (Ads-connected products only).
export function portfolioLtvCac(): number {
  const rs = subEconomics().map((r) => r.ltvCac).filter((v): v is number => v != null);
  return rs.length ? +(rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(1) : 0;
}

// ─── Deterministic insight engine ────────────────────────────────────────────
export type Priority = 'high' | 'medium' | 'monitor';
export interface Insight {
  id: string;
  priority: Priority;
  headline: string;
  detail: string;
  trigger: string;            // the visible rule
  affectedAsins: string[];    // for the watchlist / evidence
  evidence: { page: 'overview' | 'retention'; tab: string; rule: string; filterLabel: string };
}

export function overviewInsights(): Insight[] {
  const t = portfolioTotals();
  const ntbCh = pctChange(t.ntbCur, t.ntbPrev);
  const repeatShareCh = share(t.repeatCur, t.salesCur) - share(t.repeatPrev, t.salesPrev);
  const subShareCh = share(t.subCur, t.salesCur) - share(t.subPrev, t.salesPrev);
  const out: Insight[] = [];

  if (ntbCh <= CX_CONFIG.ntbDeclinePct) {
    const affected = cxProducts.filter((p) => pctChange(p.ntbCur, p.ntbPrev) <= CX_CONFIG.ntbDeclinePct);
    out.push({
      id: 'ntb-decline', priority: 'high',
      headline: 'New-customer acquisition is the only portfolio-level decline',
      detail: `New-to-brand sales fell ${ntbCh.toFixed(1)}% while repeat sales rose ${pctChange(t.repeatCur, t.repeatPrev).toFixed(1)}%. The weakness is concentrated in ${affected.length} products.`,
      trigger: `Triggered because NTB sales change ≤ ${CX_CONFIG.ntbDeclinePct}%`,
      affectedAsins: affected.map((p) => p.asin),
      evidence: { page: 'overview', tab: 'product', rule: 'ntb_decline', filterLabel: `New-to-brand sales declined by at least ${Math.abs(CX_CONFIG.ntbDeclinePct)}%` },
    });
  }
  if (repeatShareCh >= CX_CONFIG.repeatSharePpGain) {
    out.push({
      id: 'repeat-share', priority: 'monitor',
      headline: 'Repeat customers are carrying a larger share of revenue',
      detail: `Repeat share rose ${repeatShareCh.toFixed(1)}pp to ${share(t.repeatCur, t.salesCur).toFixed(1)}% — loyalty is strengthening across the portfolio.`,
      trigger: `Triggered because repeat share increased ≥ ${CX_CONFIG.repeatSharePpGain}pp`,
      affectedAsins: [...cxProducts].sort((a, b) => pctChange(b.repeatCur, b.repeatPrev) - pctChange(a.repeatCur, a.repeatPrev)).slice(0, 4).map((p) => p.asin),
      evidence: { page: 'overview', tab: 'product', rule: 'repeat_gain', filterLabel: 'Products with growing repeat sales' },
    });
  }
  // subscription quality risk
  const lowQ = cxProducts.filter((p) => { const q = subQuality(p); return q.lowQualityShare != null && q.lowQualityShare > CX_CONFIG.lowQualitySubSharePct; });
  if (lowQ.length) {
    out.push({
      id: 'sub-quality', priority: 'medium',
      headline: 'Some subscription growth is promotional, not recurring',
      detail: `${lowQ.length} products have low-quality subscription share above ${CX_CONFIG.lowQualitySubSharePct}% — promotional and first-order-only orders that rarely renew.`,
      trigger: `Triggered because low-quality subscription share > ${CX_CONFIG.lowQualitySubSharePct}%`,
      affectedAsins: lowQ.map((p) => p.asin),
      evidence: { page: 'overview', tab: 'product', rule: 'sub_quality', filterLabel: `Low-quality subscription share above ${CX_CONFIG.lowQualitySubSharePct}%` },
    });
  }
  void subShareCh;
  return out.slice(0, 3);
}

export function retentionInsights(): Insight[] {
  const out: Insight[] = [];
  // month-0 profit below zero (acquisition costs exceed first-order profit) — portfolio-wide by construction
  const negM0 = cohortRows.filter((r) => (cohortValue(r, 'profitPerCustomer', 0) ?? 0) < 0);
  if (negM0.length) {
    out.push({
      id: 'm0-negative', priority: 'medium',
      headline: 'First orders are acquired at a loss — value builds from month one',
      detail: `Every cohort starts with negative month-0 profit per customer, then turns positive as repeat and subscription revenue compounds. Payback typically lands by month 2–3.`,
      trigger: 'Triggered because month-0 profit per customer < 0',
      affectedAsins: [],
      evidence: { page: 'retention', tab: 'cohort', rule: 'm0_negative', filterLabel: 'Cohorts with negative month-0 profit per customer' },
    });
  }
  // a recent mature cohort below benchmark on month-3 retention
  const recent = cohortRows.filter((r) => r.ageMonths >= CX_CONFIG.matureCohortMonths);
  const m3bench = retentionCurves('retentionRate').benchmark.values[3] ?? 0;
  const weak = recent.filter((r) => (cohortValue(r, 'retentionRate', 3) ?? 100) < m3bench - 4);
  if (weak.length) {
    out.push({
      id: 'm3-below', priority: 'high',
      headline: 'Recent cohorts are retaining below the portfolio benchmark at month three',
      detail: `${weak.length} recent cohorts sit more than 4pp under the ${m3bench.toFixed(0)}% month-3 benchmark — early value accumulation is slowing.`,
      trigger: 'Triggered because month-3 retention < portfolio benchmark − 4pp',
      affectedAsins: [],
      evidence: { page: 'retention', tab: 'cohort', rule: 'm3_below', filterLabel: 'Cohorts below the month-3 retention benchmark' },
    });
  }
  // acquisition-spend data missing
  const missing = cxProducts.filter((p) => p.currentAcos == null);
  if (missing.length) {
    out.push({
      id: 'acos-missing', priority: 'monitor',
      headline: 'Current ad-spend is missing for some products',
      detail: `${missing.length} products have no current ACoS, so their acquisition-ceiling status can’t be judged. The safe ceiling is still shown; the current-vs-safe comparison is withheld.`,
      trigger: 'Triggered because current ACoS data is not supplied',
      affectedAsins: missing.map((p) => p.asin),
      evidence: { page: 'retention', tab: 'subeconomics', rule: 'acos_missing', filterLabel: 'Products with no current ACoS supplied' },
    });
  }
  return out.slice(0, 3);
}

export const IS_DEMO_DATA = true; // marker: everything in this file is synthetic
