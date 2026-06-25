// ─── Prime Day Recap data ─────────────────────────────────────────────────────
// Year-over-year comparison of this year's Prime Day vs last year's, plus the
// movers (countries / categories / products) and event-specific extras a brand
// manager needs to assess the event. Demo data; shapes mirror what the real
// engine would assemble from Sales + Advertising + Inventory marts.

export const primeDayMeta = {
  thisYearLabel: 'Prime Day 2026',
  lastYearLabel: 'Prime Day 2025',
  thisYearDates: '8–9 July 2026',
  lastYearDates: '16–17 July 2025',
  // Ads are credited back to the event over a settling window — surfaced as a caveat.
  attributionNote:
    'Ad attribution is still settling (D+14 window). Ad Sales, ROAS and ACOS will keep moving as conversions are credited back to the event — treat advertising figures as provisional.',
};

export type MetricUnit = 'currency' | 'pct' | 'number' | 'x';
export type Polarity = 'higher' | 'lower' | 'neutral';
export type MetricGroup = 'headline' | 'demand' | 'advertising' | 'customer' | 'profit';

export interface YoYMetric {
  key: string;
  label: string;
  unit: MetricUnit;
  thisYear: number;
  lastYear: number;
  polarity: Polarity;
  group: MetricGroup;
  /** Show in the advertising panel under the "still settling" caveat. */
  provisional?: boolean;
}

// Headline figure used for the big hero comparison.
export const primeDayRevenue = { thisYear: 486_200, lastYear: 392_800 };

export const primeDayMetrics: YoYMetric[] = [
  // Demand / volume
  { key: 'revenue', label: 'Revenue',        unit: 'currency', thisYear: 486_200, lastYear: 392_800, polarity: 'higher', group: 'headline' },
  { key: 'units',   label: 'Units sold',     unit: 'number',   thisYear: 13_420,  lastYear: 11_180,  polarity: 'higher', group: 'demand' },
  { key: 'orders',  label: 'Orders',         unit: 'number',   thisYear: 9_860,   lastYear: 8_540,   polarity: 'higher', group: 'demand' },
  { key: 'aov',     label: 'AOV',            unit: 'currency', thisYear: 49.3,    lastYear: 46.0,    polarity: 'higher', group: 'demand' },
  { key: 'glance',  label: 'Glance views',   unit: 'number',   thisYear: 1_820_000, lastYear: 1_540_000, polarity: 'higher', group: 'demand' },
  { key: 'cvr',     label: 'Conversion rate',unit: 'pct',      thisYear: 14.8,    lastYear: 13.1,    polarity: 'higher', group: 'demand' },
  // Advertising (provisional — attribution settling)
  { key: 'adSpend', label: 'Ad spend',       unit: 'currency', thisYear: 68_400,  lastYear: 54_200,  polarity: 'neutral', group: 'advertising', provisional: true },
  { key: 'adSales', label: 'Ad sales',       unit: 'currency', thisYear: 214_500, lastYear: 172_300, polarity: 'higher',  group: 'advertising', provisional: true },
  { key: 'acos',    label: 'ACOS',           unit: 'pct',      thisYear: 31.9,    lastYear: 31.5,    polarity: 'lower',   group: 'advertising', provisional: true },
  { key: 'roas',    label: 'ROAS',           unit: 'x',        thisYear: 3.14,    lastYear: 3.18,    polarity: 'higher',  group: 'advertising', provisional: true },
  { key: 'tacos',   label: 'TACOS',          unit: 'pct',      thisYear: 14.1,    lastYear: 13.8,    polarity: 'lower',   group: 'advertising', provisional: true },
  // Customer & profit
  { key: 'ntb',     label: 'New-to-brand %', unit: 'pct',      thisYear: 52.0,    lastYear: 47.0,    polarity: 'higher', group: 'customer' },
  { key: 'discount',label: 'Avg discount depth', unit: 'pct',  thisYear: 22.0,    lastYear: 19.0,    polarity: 'neutral', group: 'profit' },
  { key: 'margin',  label: 'Event gross margin', unit: 'pct',  thisYear: 28.4,    lastYear: 30.1,    polarity: 'higher', group: 'profit' },
];

// ── Top movers — each row carries this-year revenue, last-year revenue, and the
// growth last year's event posted (PD25 vs PD24) so we can rank "who led this
// year" against "who led last year" and surface leadership shifts. ──

export interface MoverRow {
  name: string;
  sublabel?: string;
  thisYearRev: number;
  lastYearRev: number;
  /** Growth the prior event posted (PD2025 vs PD2024), %. Ranks last year's movers. */
  growthLastYear: number;
}

export interface MoverDimension {
  key: 'country' | 'category' | 'product';
  label: string;
  rows: MoverRow[];
}

export const primeDayMovers: MoverDimension[] = [
  {
    key: 'country', label: 'Countries',
    rows: [
      { name: 'Germany',     thisYearRev: 168_400, lastYearRev: 132_100, growthLastYear: 12.0 },
      { name: 'France',      thisYearRev: 112_300, lastYearRev: 88_900,  growthLastYear: 9.0 },
      { name: 'United Kingdom', thisYearRev: 96_800, lastYearRev: 84_200, growthLastYear: 18.0 },
      { name: 'Italy',       thisYearRev: 58_200,  lastYearRev: 44_600,  growthLastYear: 6.0 },
      { name: 'Spain',       thisYearRev: 34_100,  lastYearRev: 28_400,  growthLastYear: 21.0 },
      { name: 'Netherlands', thisYearRev: 16_400,  lastYearRev: 14_600,  growthLastYear: 4.0 },
    ],
  },
  {
    key: 'category', label: 'Categories',
    rows: [
      { name: 'Personal Care',      thisYearRev: 156_000, lastYearRev: 118_000, growthLastYear: 10.0 },
      { name: 'Home & Kitchen',     thisYearRev: 132_400, lastYearRev: 109_800, growthLastYear: 15.0 },
      { name: 'Baby & Toddler',     thisYearRev: 98_600,  lastYearRev: 86_400,  growthLastYear: 22.0 },
      { name: 'Wellness & Supplements', thisYearRev: 64_200, lastYearRev: 47_300, growthLastYear: 8.0 },
      { name: 'Drinkware & Bottles',thisYearRev: 34_800,  lastYearRev: 31_300,  growthLastYear: 19.0 },
    ],
  },
  {
    key: 'product', label: 'Products',
    rows: [
      { name: 'Everyday Essentials Pack 120ct', sublabel: 'B0DEMO001X', thisYearRev: 42_300, lastYearRev: 28_900, growthLastYear: 12.0 },
      { name: 'Daily Wellness Capsules',        sublabel: 'B0DEMO006X', thisYearRev: 24_900, lastYearRev: 15_800, growthLastYear: 5.0 },
      { name: 'Smart Device Lite',              sublabel: 'B0DEMO005X', thisYearRev: 31_800, lastYearRev: 26_400, growthLastYear: 30.0 },
      { name: 'Premium Container Set',          sublabel: 'B0DEMO003X', thisYearRev: 28_600, lastYearRev: 24_100, growthLastYear: 9.0 },
      { name: 'Stainless Water Bottle',         sublabel: 'B0DEMO009X', thisYearRev: 19_400, lastYearRev: 17_900, growthLastYear: 25.0 },
    ],
  },
];

// ── Event extras a brand manager needs ──

export const primeDayDays = [
  { label: 'Day 1 · 8 Jul', thisYear: 268_400, lastYear: 214_600 },
  { label: 'Day 2 · 9 Jul', thisYear: 217_800, lastYear: 178_200 },
];

export const primeDayPeak = { window: '20:00–21:00 CET, Day 1', revenue: 38_200 };

export interface DealRow {
  type: string;
  units: number;
  revenue: number;
  avgDiscountPct: number;
  sellThroughPct: number;
}

export const primeDayDeals: DealRow[] = [
  { type: 'Lightning Deals',          units: 4_820, revenue: 168_400, avgDiscountPct: 28, sellThroughPct: 92 },
  { type: 'Prime Exclusive Discount', units: 3_640, revenue: 142_800, avgDiscountPct: 20, sellThroughPct: 81 },
  { type: 'Best Deals',               units: 2_180, revenue: 96_400,  avgDiscountPct: 18, sellThroughPct: 74 },
  { type: 'Coupons',                  units: 1_940, revenue: 64_200,  avgDiscountPct: 12, sellThroughPct: 68 },
];

export const primeDayInventory = {
  stockoutAsins: 3,
  missedRevenue: 18_600,
  sellThroughPct: 87,
  note: '3 hero ASINs sold out before the event closed — an estimated €18.6k of demand went uncaptured.',
};

// ── Shared compute/format helpers (used by the page and the share canvases) ──

import { fc } from '../utils/currency';

export function pctDelta(thisYear: number, lastYear: number): number {
  return lastYear === 0 ? 0 : ((thisYear - lastYear) / Math.abs(lastYear)) * 100;
}

export interface MetricChange { raw: number; positive: boolean | null; deltaText: string }

export function metricChange(m: YoYMetric): MetricChange {
  const raw = m.thisYear - m.lastYear;
  const positive = m.polarity === 'neutral' ? null : m.polarity === 'higher' ? raw > 0 : raw < 0;
  let deltaText: string;
  if (m.unit === 'pct') deltaText = `${raw > 0 ? '+' : ''}${raw.toFixed(1)}pp`;
  else if (m.unit === 'x') deltaText = `${raw > 0 ? '+' : ''}${raw.toFixed(2)}×`;
  else deltaText = `${pctDelta(m.thisYear, m.lastYear) > 0 ? '+' : ''}${pctDelta(m.thisYear, m.lastYear).toFixed(1)}%`;
  return { raw, positive, deltaText };
}

export function fmtMetricValue(unit: MetricUnit, value: number, currency: string): string {
  switch (unit) {
    case 'currency': return fc(value, currency, { compact: true });
    case 'pct': return `${value.toFixed(1)}%`;
    case 'x': return `${value.toFixed(2)}×`;
    case 'number': return value.toLocaleString('en-US');
  }
}

export const primeDayTakeaways: string[] = [
  'Revenue grew +23.8% YoY on +20% units — demand scaled faster than discounting, and new-to-brand share rose to 52%.',
  'Margin compressed −1.7pp as average discount depth deepened to 22%. Review deal eligibility on low-margin SKUs before the next event.',
  'Italy (+30.5%) and Wellness (+35.7%) overtook last year\'s leaders (Spain, Baby & Toddler) — rebalance inventory and ad budget toward the new momentum.',
  '3 hero ASINs stocked out (~€18.6k missed). Lift Prime Day cover targets on B0DEMO001X / B0DEMO006X for next year.',
];
