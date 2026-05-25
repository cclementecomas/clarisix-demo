export type TrendMetric =
  | 'sales'
  | 'netSales'
  | 'adSpend'
  | 'adSales'
  | 'organicSales'
  | 'units'
  | 'roas'
  | 'acos'
  | 'tacos'
  | 'pageViews'
  | 'sessions'
  | 'cvr';

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
}

export interface TrendDimensionOption {
  value: TrendDimension;
  label: string;
}

export const metricOptions: TrendMetricOption[] = [
  { value: 'sales', label: 'Sales', isCurrency: true, isPercent: false },
  { value: 'netSales', label: 'Net Sales', isCurrency: true, isPercent: false },
  { value: 'adSpend', label: 'Ad Spend', isCurrency: true, isPercent: false },
  { value: 'adSales', label: 'Ad Sales', isCurrency: true, isPercent: false },
  { value: 'organicSales', label: 'Organic Sales', isCurrency: true, isPercent: false },
  { value: 'units', label: 'Units', isCurrency: false, isPercent: false },
  { value: 'roas', label: 'ROAS', isCurrency: false, isPercent: false, suffix: 'x' },
  { value: 'acos', label: 'ACOS', isCurrency: false, isPercent: true },
  { value: 'tacos', label: 'TACOS', isCurrency: false, isPercent: true },
  { value: 'pageViews', label: 'Page Views', isCurrency: false, isPercent: false },
  { value: 'sessions', label: 'Sessions', isCurrency: false, isPercent: false },
  { value: 'cvr', label: 'Conversion Rate', isCurrency: false, isPercent: true },
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
    sales: [800, 18000],
    netSales: [600, 14000],
    adSpend: [100, 9000],
    adSales: [400, 14000],
    organicSales: [300, 12000],
    units: [50, 2000],
    roas: [1.5, 5.0],
    acos: [8, 35],
    tacos: [5, 25],
    pageViews: [2000, 60000],
    sessions: [1500, 45000],
    cvr: [4, 14],
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
