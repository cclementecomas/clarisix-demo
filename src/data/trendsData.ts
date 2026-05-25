export type TrendMetric =
  // Volume & revenue
  | 'sales'
  | 'netSales'
  | 'organicSales'
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
  // Margin cascade
  | 'productMargin'
  | 'channelMargin'
  | 'growthMargin'
  | 'netProfitPerUnit';

export type TrendDimension =
  | 'marketplace'
  | 'brand'
  | 'category'
  | 'subcategory';

export type TrendGranularity = 'day' | 'week' | 'month' | 'quarter';

export interface TrendMetricOption {
  value: TrendMetric;
  label: string;
  isCurrency: boolean;
  isPercent: boolean;
  suffix?: string;
  /** Bucket label used to render section dividers inside the dropdown. */
  group?: string;
}

export interface TrendDimensionOption {
  value: TrendDimension;
  label: string;
}

// Ordered by the 5-band Sales Deepdive narrative:
//   what I sold → who bought it → how they got there → what I paid → what's left
export const metricOptions: TrendMetricOption[] = [
  // Volume & revenue
  { value: 'sales',           label: 'Sales',             isCurrency: true,  isPercent: false, group: 'Volume & revenue' },
  { value: 'netSales',        label: 'Net Sales',         isCurrency: true,  isPercent: false, group: 'Volume & revenue' },
  { value: 'organicSales',    label: 'Organic Sales',     isCurrency: true,  isPercent: false, group: 'Volume & revenue' },
  { value: 'units',           label: 'Units',             isCurrency: false, isPercent: false, group: 'Volume & revenue' },
  { value: 'orders',          label: 'Orders',            isCurrency: false, isPercent: false, group: 'Volume & revenue' },
  { value: 'avgPrice',        label: 'Avg Price',         isCurrency: true,  isPercent: false, group: 'Volume & revenue' },

  // Customer mix
  { value: 'ntbOrders',       label: 'NTB Orders',        isCurrency: false, isPercent: false, group: 'Customer mix' },
  { value: 'ntbPct',          label: 'NTB %',             isCurrency: false, isPercent: true,  group: 'Customer mix' },
  { value: 'ssOrders',        label: 'S&S Orders',        isCurrency: false, isPercent: false, group: 'Customer mix' },
  { value: 'ssPct',           label: 'S&S %',             isCurrency: false, isPercent: true,  group: 'Customer mix' },

  // Demand funnel
  { value: 'pageViews',       label: 'Page Views',        isCurrency: false, isPercent: false, group: 'Demand funnel' },
  { value: 'sessions',        label: 'Sessions',          isCurrency: false, isPercent: false, group: 'Demand funnel' },
  { value: 'cvr',             label: 'Conversion Rate',   isCurrency: false, isPercent: true,  group: 'Demand funnel' },
  { value: 'organicPct',      label: 'Organic %',         isCurrency: false, isPercent: true,  group: 'Demand funnel' },

  // Marketing & promo
  { value: 'discounts',       label: 'Discounts',         isCurrency: true,  isPercent: false, group: 'Marketing & promo' },
  { value: 'adSpend',         label: 'Ad Spend',          isCurrency: true,  isPercent: false, group: 'Marketing & promo' },
  { value: 'adSales',         label: 'Ad Sales',          isCurrency: true,  isPercent: false, group: 'Marketing & promo' },
  { value: 'adCpc',           label: 'Ad CPC',            isCurrency: true,  isPercent: false, group: 'Marketing & promo' },
  { value: 'ctr',             label: 'CTR',               isCurrency: false, isPercent: true,  group: 'Marketing & promo' },
  { value: 'adCvr',           label: 'Ad CVR',            isCurrency: false, isPercent: true,  group: 'Marketing & promo' },
  { value: 'roas',            label: 'ROAS',              isCurrency: false, isPercent: false, suffix: 'x', group: 'Marketing & promo' },
  { value: 'acos',            label: 'ACOS',              isCurrency: false, isPercent: true,  group: 'Marketing & promo' },
  { value: 'tacos',           label: 'TACOS',             isCurrency: false, isPercent: true,  group: 'Marketing & promo' },
  { value: 'totalCpa',        label: 'Total CPA',         isCurrency: true,  isPercent: false, group: 'Marketing & promo' },

  // Margin cascade
  { value: 'productMargin',   label: 'Product Margin',    isCurrency: false, isPercent: true,  group: 'Margin cascade' },
  { value: 'channelMargin',   label: 'Channel Margin',    isCurrency: false, isPercent: true,  group: 'Margin cascade' },
  { value: 'growthMargin',    label: 'Growth Margin',     isCurrency: false, isPercent: true,  group: 'Margin cascade' },
  { value: 'netProfitPerUnit',label: 'Net Profit / Unit', isCurrency: true,  isPercent: false, group: 'Margin cascade' },
];

export const dimensionOptions: TrendDimensionOption[] = [
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'brand', label: 'Brand' },
  { value: 'category', label: 'Category' },
  { value: 'subcategory', label: 'Sub-category' },
];

const dimensionValues: Record<TrendDimension, string[]> = {
  marketplace: ['Belgium', 'France', 'Germany', 'Ireland', 'Italy', 'Netherlands', 'Spain', 'UK', 'United States'],
  brand: ['AquaPure', 'FreshTech', 'NovaBright', 'EcoBlend', 'ZenCore'],
  category: ['Personal Care', 'Home & Kitchen', 'Electronics Pro', 'Electronics Lite', 'Fashion Bags', 'Wellness'],
  subcategory: ['Premium', 'Standard', 'Economy', 'Deluxe', 'Mini', 'Pro'],
};

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Compute time period labels dynamically from a date range + granularity */
function computePeriods(start: Date, end: Date, granularity: TrendGranularity): string[] {
  const periods: string[] = [];
  const cur = new Date(start);

  switch (granularity) {
    case 'day': {
      while (cur <= end) {
        periods.push(`${SHORT_MONTHS[cur.getMonth()]} ${cur.getDate()}`);
        cur.setDate(cur.getDate() + 1);
      }
      break;
    }
    case 'week': {
      // ISO week number helper
      const isoWeek = (d: Date) => {
        const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
        const jan4 = new Date(tmp.getFullYear(), 0, 4);
        return 1 + Math.round(((tmp.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
      };
      const seen = new Set<string>();
      while (cur <= end) {
        const label = `W${isoWeek(cur)}`;
        if (!seen.has(label)) {
          seen.add(label);
          periods.push(label);
        }
        cur.setDate(cur.getDate() + 1);
      }
      break;
    }
    case 'month': {
      while (cur <= end) {
        const label = `${SHORT_MONTHS[cur.getMonth()]} ${cur.getFullYear().toString().slice(2)}`;
        if (!periods.includes(label)) {
          periods.push(label);
        }
        cur.setMonth(cur.getMonth() + 1);
      }
      break;
    }
    case 'quarter': {
      while (cur <= end) {
        const q = Math.floor(cur.getMonth() / 3) + 1;
        const label = `Q${q} ${cur.getFullYear().toString().slice(2)}`;
        if (!periods.includes(label)) {
          periods.push(label);
        }
        cur.setMonth(cur.getMonth() + 3);
      }
      break;
    }
  }

  return periods;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getBaseScale(metric: TrendMetric, dimension: string): number {
  const dimHash = dimension.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const scales: Record<TrendMetric, [number, number]> = {
    // Volume & revenue
    sales: [800, 18000],
    netSales: [600, 14000],
    organicSales: [300, 12000],
    units: [50, 2000],
    orders: [40, 1500],
    avgPrice: [12, 80],

    // Customer mix
    ntbOrders: [15, 800],
    ntbPct: [35, 55],
    ssOrders: [5, 300],
    ssPct: [10, 28],

    // Demand funnel
    pageViews: [2000, 60000],
    sessions: [1500, 45000],
    cvr: [4, 14],
    organicPct: [30, 75],

    // Marketing & promo
    discounts: [30, 2000],
    adSpend: [100, 9000],
    adSales: [400, 14000],
    adCpc: [0.45, 2.25],
    ctr: [0.3, 1.5],
    adCvr: [5, 15],
    roas: [1.5, 5.0],
    acos: [8, 35],
    tacos: [5, 25],
    totalCpa: [2, 15],

    // Margin cascade
    productMargin: [45, 68],
    channelMargin: [30, 55],
    growthMargin: [10, 40],
    netProfitPerUnit: [3, 25],
  };

  const [min, max] = scales[metric];
  const ratio = (dimHash % 100) / 100;
  return min + ratio * (max - min);
}

export interface TrendRow {
  dimension: string;
  values: Record<string, number>;
  total: number;
}

export function generateTrendData(
  metric: TrendMetric,
  dimension: TrendDimension,
  granularity: TrendGranularity,
  dateRange?: { start: Date; end: Date },
): { periods: string[]; rows: TrendRow[] } {
  const periods = dateRange
    ? computePeriods(dateRange.start, dateRange.end, granularity)
    : computePeriods(
        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        new Date(new Date().getFullYear(), new Date().getMonth(), 0),
        granularity,
      );

  const dims = dimensionValues[dimension];

  const rows: TrendRow[] = dims.map((dim) => {
    const base = getBaseScale(metric, dim);
    const seed = dim.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 +
      metric.length * 17 + granularity.length * 7;
    const rand = seededRandom(seed);

    const values: Record<string, number> = {};
    let total = 0;

    for (const period of periods) {
      const variance = 0.3 + rand() * 1.4;
      let val: number;

      const metricInfo = metricOptions.find(m => m.value === metric)!;
      if (metricInfo.isPercent) {
        val = Math.round(base * variance * 10) / 10;
        val = Math.max(1, Math.min(val, 80));
      } else if (metric === 'roas') {
        val = Math.round(base * variance * 100) / 100;
        val = Math.max(0.5, Math.min(val, 8));
      } else {
        val = Math.round(base * variance);
        val = Math.max(1, val);
      }

      values[period] = val;
      total += val;
    }

    if (metricOptions.find(m => m.value === metric)?.isPercent || metric === 'roas') {
      total = Math.round((total / periods.length) * 100) / 100;
    } else {
      total = Math.round(total);
    }

    return { dimension: dim, values, total };
  });

  rows.sort((a, b) => b.total - a.total);

  return { periods, rows };
}
