// ─── Period × Metric Matrix Data ───────────────────────────────────────────
// Powers the "Metrics over time" section on the Trends page — a matrix view
// where rows are time periods and columns are all metrics shown in Sales
// Deepdive, ordered in the same 5-band narrative:
//   what I sold → who bought it → how they got there → what I paid → what's left

export type MatrixMetricKey =
  // Volume & revenue
  | 'sales'
  | 'units'
  | 'orders'
  | 'avgPrice'
  // Customer mix
  | 'ntbOrders'
  | 'ntbPct'
  | 'ssOrders'
  | 'ssPct'
  // Demand funnel
  | 'pageViews'
  | 'sessions'
  | 'cvr'
  | 'bboxWinRate'
  | 'organicPct'
  // Marketing & promo
  | 'discounts'
  | 'adSpend'
  | 'adSales'
  | 'adCpc'
  | 'ctr'
  | 'adCvr'
  | 'roas'
  | 'acos'
  | 'tacos'
  | 'totalCpa'
  | 'adReliance'
  // Margin cascade
  | 'productMargin'
  | 'channelMargin'
  | 'growthMargin'
  | 'netProfitPerUnit';

export type MatrixFormat = 'currency' | 'number' | 'percent' | 'multiplier';

export interface MatrixMetric {
  key: MatrixMetricKey;
  label: string;
  format: MatrixFormat;
  higherIsBetter: boolean;
  /** Bucket label used to render the band-header row above the columns. */
  group: string;
  tooltip?: string;
}

const VOL = 'Volume & revenue';
const MIX = 'Customer mix';
const FUNNEL = 'Demand funnel';
const ADS = 'Marketing & promo';
const MARGIN = 'Margin cascade';

export const matrixMetrics: MatrixMetric[] = [
  // ─── Volume & revenue ───────────────────────────────────────────────
  { key: 'sales',            label: 'Sales',             format: 'currency',   higherIsBetter: true,  group: VOL, tooltip: 'Gross sales for the period.' },
  { key: 'units',            label: 'Units',             format: 'number',     higherIsBetter: true,  group: VOL, tooltip: 'Units ordered.' },
  { key: 'orders',           label: 'Orders',            format: 'number',     higherIsBetter: true,  group: VOL, tooltip: 'Number of distinct orders.' },
  { key: 'avgPrice',         label: 'Avg Price',         format: 'currency',   higherIsBetter: true,  group: VOL, tooltip: 'Average unit selling price = Sales ÷ Units.' },

  // ─── Customer mix ──────────────────────────────────────────────────
  { key: 'ntbOrders',        label: 'NTB Orders',        format: 'number',     higherIsBetter: true,  group: MIX, tooltip: 'New-to-Brand orders.' },
  { key: 'ntbPct',           label: 'NTB %',             format: 'percent',    higherIsBetter: true,  group: MIX, tooltip: 'Share of orders from New-to-Brand customers.' },
  { key: 'ssOrders',         label: 'S&S Orders',        format: 'number',     higherIsBetter: true,  group: MIX, tooltip: 'Subscribe & Save orders.' },
  { key: 'ssPct',            label: 'S&S %',             format: 'percent',    higherIsBetter: true,  group: MIX, tooltip: 'Share of orders via Subscribe & Save.' },

  // ─── Demand funnel ─────────────────────────────────────────────────
  { key: 'pageViews',        label: 'Page Views',        format: 'number',     higherIsBetter: true,  group: FUNNEL, tooltip: 'Detail page views.' },
  { key: 'sessions',         label: 'Sessions',          format: 'number',     higherIsBetter: true,  group: FUNNEL, tooltip: 'Unique sessions.' },
  { key: 'cvr',              label: 'CVR',               format: 'percent',    higherIsBetter: true,  group: FUNNEL, tooltip: 'Conversion rate.' },
  { key: 'bboxWinRate',      label: 'BBox Win',          format: 'percent',    higherIsBetter: true,  group: FUNNEL, tooltip: 'Buy-Box win rate.' },
  { key: 'organicPct',       label: 'Organic %',         format: 'percent',    higherIsBetter: true,  group: FUNNEL, tooltip: 'Share of sales coming from organic (inverse of Ad Reliance).' },

  // ─── Marketing & promo ─────────────────────────────────────────────
  { key: 'discounts',        label: 'Discounts',         format: 'currency',   higherIsBetter: false, group: ADS, tooltip: 'Promotional / coupon discounts taken on sales (lower is generally better for margin).' },
  { key: 'adSpend',          label: 'Ad Spend',          format: 'currency',   higherIsBetter: false, group: ADS, tooltip: 'Total advertising spend (lower is better when sales hold steady).' },
  { key: 'adSales',          label: 'Ad Sales',          format: 'currency',   higherIsBetter: true,  group: ADS, tooltip: 'Sales attributed to advertising.' },
  { key: 'adCpc',            label: 'Ad CPC',            format: 'currency',   higherIsBetter: false, group: ADS, tooltip: 'Average cost per ad click.' },
  { key: 'ctr',              label: 'CTR',               format: 'percent',    higherIsBetter: true,  group: ADS, tooltip: 'Ad click-through rate.' },
  { key: 'adCvr',            label: 'Ad CVR',            format: 'percent',    higherIsBetter: true,  group: ADS, tooltip: 'Ad-traffic conversion rate.' },
  { key: 'roas',             label: 'ROAS',              format: 'multiplier', higherIsBetter: true,  group: ADS, tooltip: 'Return on ad spend = Ad Sales ÷ Ad Spend.' },
  { key: 'acos',             label: 'ACOS',              format: 'percent',    higherIsBetter: false, group: ADS, tooltip: 'Ad cost of sales = Ad Spend ÷ Ad Sales (lower is better).' },
  { key: 'tacos',            label: 'TACOS',             format: 'percent',    higherIsBetter: false, group: ADS, tooltip: 'Total ACOS = Ad Spend ÷ Total Sales (lower is better).' },
  { key: 'totalCpa',         label: 'Total CPA',         format: 'currency',   higherIsBetter: false, group: ADS, tooltip: 'Total cost per acquisition = Ad Spend ÷ Orders.' },
  { key: 'adReliance',       label: 'Ad Reliance',       format: 'percent',    higherIsBetter: false, group: ADS, tooltip: 'Share of sales coming from ads (lower means more organic).' },

  // ─── Margin cascade ────────────────────────────────────────────────
  { key: 'productMargin',    label: 'Product Margin',    format: 'percent',    higherIsBetter: true,  group: MARGIN, tooltip: 'Gross product margin after COGS.' },
  { key: 'channelMargin',    label: 'Channel Margin',    format: 'percent',    higherIsBetter: true,  group: MARGIN, tooltip: 'Margin after Amazon fees.' },
  { key: 'growthMargin',     label: 'Growth Margin',     format: 'percent',    higherIsBetter: true,  group: MARGIN, tooltip: 'Margin after advertising spend.' },
  { key: 'netProfitPerUnit', label: 'Net Profit / Unit', format: 'currency',   higherIsBetter: true,  group: MARGIN, tooltip: 'Net profit dollars per unit sold.' },
];

export interface MatrixRow {
  period: string;
  values: Record<MatrixMetricKey, number>;
}

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Hash a period label into a stable seed so the same period reproduces the
// same numbers across renders.
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0) || 1;
}

/** Generate the matrix rows for an array of period labels. */
export function generateMatrixData(periods: string[]): MatrixRow[] {
  return periods.map((period, idx) => {
    const rand = seededRng(hashSeed(period) ^ (idx + 1));
    const noise = () => 0.85 + rand() * 0.3;             // ±15%
    const trend = 1 + idx * 0.004;                       // gentle upward drift

    // ─── Anchors that drive the rest ─────────────────────────────────
    const sales    = Math.round(8500 * trend * noise());
    const adSpend  = Math.round(sales * (0.06 + rand() * 0.07));
    const adSales  = Math.round(adSpend * (3.4 + rand() * 1.6));
    const acos     = Math.round((adSpend / Math.max(adSales, 1)) * 1000) / 10;
    const tacos    = Math.round((adSpend / sales) * 1000) / 10;
    const roas     = Math.round((adSales / Math.max(adSpend, 1)) * 100) / 100;
    const units    = Math.round(sales / (32 + rand() * 8));

    // ─── Volume & revenue (derived) ──────────────────────────────────
    const unitsPerOrder = 1.1 + rand() * 0.25;           // 1.10–1.35
    const orders   = Math.max(1, Math.round(units / unitsPerOrder));
    const avgPrice = units > 0 ? +(sales / units).toFixed(2) : 0;

    // ─── Customer mix ────────────────────────────────────────────────
    const ntbRatio = 0.35 + rand() * 0.20;               // 35–55%
    const ssRatio  = 0.10 + rand() * 0.18;               // 10–28%
    const ntbOrders = Math.max(0, Math.round(orders * ntbRatio));
    const ntbPct    = +(ntbRatio * 100).toFixed(1);
    const ssOrders  = Math.max(0, Math.round(orders * ssRatio));
    const ssPct     = +(ssRatio * 100).toFixed(1);

    // ─── Demand funnel ───────────────────────────────────────────────
    const pageViews   = Math.round(2100 * trend * noise());
    const sessions    = Math.round(1750 * trend * noise());
    const cvr         = +(6.5 + rand() * 4).toFixed(1);
    const bboxWinRate = +((72 + rand() * 16)).toFixed(1);
    const adReliance  = +((25 + rand() * 14)).toFixed(1);
    const organicPct  = +(100 - adReliance).toFixed(1);

    // ─── Marketing & promo (derived) ─────────────────────────────────
    const discounts  = Math.round(sales * (0.03 + rand() * 0.09));
    const adCpc      = +(0.45 + rand() * 1.8).toFixed(2);
    const ctr        = +(0.3 + rand() * 1.1).toFixed(2);
    const adCvr      = +(5 + rand() * 10).toFixed(1);
    const totalCpa   = orders > 0 ? +(adSpend / orders).toFixed(2) : 0;

    // ─── Margin cascade ──────────────────────────────────────────────
    const productMargin = +((52 + rand() * 14)).toFixed(1);            // 52–66%
    const channelDelta  = 12 + rand() * 4;                              // Amazon fees ~12–16pp
    const channelMargin = +(productMargin - channelDelta).toFixed(1);
    const growthMargin  = +(channelMargin - tacos).toFixed(1);
    const netProfitPerUnit = +(avgPrice * (growthMargin / 100)).toFixed(2);

    return {
      period,
      values: {
        sales, units, orders, avgPrice,
        ntbOrders, ntbPct, ssOrders, ssPct,
        pageViews, sessions, cvr, bboxWinRate, organicPct,
        discounts, adSpend, adSales, adCpc, ctr, adCvr, roas, acos, tacos, totalCpa, adReliance,
        productMargin, channelMargin, growthMargin, netProfitPerUnit,
      },
    };
  });
}
