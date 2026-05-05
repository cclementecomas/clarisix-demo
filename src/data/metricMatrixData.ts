// ─── Period × Metric Matrix Data ───────────────────────────────────────────
// Powers the "Metrics over time" section on the Trends page — a matrix view
// where rows are time periods and columns are all metrics from Sales Deepdive.

export type MatrixMetricKey =
  | 'sales'
  | 'units'
  | 'adSpend'
  | 'adSales'
  | 'roas'
  | 'acos'
  | 'tacos'
  | 'bboxWinRate'
  | 'adReliance'
  | 'cvr'
  | 'pageViews'
  | 'sessions';

export type MatrixFormat = 'currency' | 'number' | 'percent' | 'multiplier';

export interface MatrixMetric {
  key: MatrixMetricKey;
  label: string;
  format: MatrixFormat;
  higherIsBetter: boolean;
  tooltip?: string;
}

export const matrixMetrics: MatrixMetric[] = [
  { key: 'sales',       label: 'Sales',       format: 'currency',   higherIsBetter: true,  tooltip: 'Gross sales for the period.' },
  { key: 'units',       label: 'Units',       format: 'number',     higherIsBetter: true,  tooltip: 'Units ordered.' },
  { key: 'adSpend',     label: 'Ad Spend',    format: 'currency',   higherIsBetter: false, tooltip: 'Total advertising spend (lower is better when sales hold steady).' },
  { key: 'adSales',     label: 'Ad Sales',    format: 'currency',   higherIsBetter: true,  tooltip: 'Sales attributed to advertising.' },
  { key: 'roas',        label: 'ROAS',        format: 'multiplier', higherIsBetter: true,  tooltip: 'Return on ad spend = Ad Sales ÷ Ad Spend.' },
  { key: 'acos',        label: 'ACOS',        format: 'percent',    higherIsBetter: false, tooltip: 'Ad cost of sales = Ad Spend ÷ Ad Sales (lower is better).' },
  { key: 'tacos',       label: 'TACOS',       format: 'percent',    higherIsBetter: false, tooltip: 'Total ACOS = Ad Spend ÷ Total Sales (lower is better).' },
  { key: 'bboxWinRate', label: 'BBox Win',    format: 'percent',    higherIsBetter: true,  tooltip: 'Buy-Box win rate.' },
  { key: 'adReliance',  label: 'Ad Reliance', format: 'percent',    higherIsBetter: false, tooltip: 'Share of sales coming from ads (lower means more organic).' },
  { key: 'cvr',         label: 'CVR',         format: 'percent',    higherIsBetter: true,  tooltip: 'Conversion rate.' },
  { key: 'pageViews',   label: 'Page Views',  format: 'number',     higherIsBetter: true,  tooltip: 'Detail page views.' },
  { key: 'sessions',    label: 'Sessions',    format: 'number',     higherIsBetter: true,  tooltip: 'Unique sessions.' },
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

    // Anchors that drive the rest
    const sales    = Math.round(8500 * trend * noise());
    const adSpend  = Math.round(sales * (0.06 + rand() * 0.07));
    const adSales  = Math.round(adSpend * (3.4 + rand() * 1.6));
    const acos     = Math.round((adSpend / Math.max(adSales, 1)) * 1000) / 10;
    const tacos    = Math.round((adSpend / sales) * 1000) / 10;
    const roas     = Math.round((adSales / Math.max(adSpend, 1)) * 100) / 100;
    const units    = Math.round(sales / (32 + rand() * 8));

    return {
      period,
      values: {
        sales,
        units,
        adSpend,
        adSales,
        roas,
        acos,
        tacos,
        bboxWinRate: Math.round((72 + rand() * 16) * 10) / 10,
        adReliance: Math.round((25 + rand() * 14) * 10) / 10,
        cvr: Math.round((6.5 + rand() * 4) * 10) / 10,
        pageViews: Math.round(2100 * trend * noise()),
        sessions: Math.round(1750 * trend * noise()),
      },
    };
  });
}
