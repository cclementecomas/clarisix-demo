// ─── Traffic Data (Amazon Business Reports — Detail Page Sales & Traffic) ────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rMain = seededRandom(77);
const r = () => rMain();

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrafficStatus = 'critical' | 'warning' | 'healthy';
export type TrendGranularity = 'day' | 'week' | 'month' | 'quarter';

export interface ProductTrafficRow {
  asin: string;
  product: string;
  category: string;
  // Sessions
  sessions: number;
  sessionsPoP: number;      // % change vs prior period (replaces WoW)
  sessionsLY: number;       // % change vs last year
  // Page Views
  pageViews: number;
  pageViewsPoP: number;
  pvPerSession: number;
  // CVR
  cvr: number;
  cvrPoP: number;
  cvrLY: number;
  // Orders
  orders: number;
  // Buy Box
  buyBoxPct: number;
  buyBoxPctPoP: number;
  // Ad metrics
  adImpressions: number;
  adImpressionsPoP: number;
  adClicks: number;
  ctr: number;
  ctrPoP: number;
  // Organic
  organicSessions: number;
  paidSessions: number;
  organicPct: number;
  organicPctPoP: number;
  // ATC
  addToCartRate: number;
}

export interface TrafficTrendPoint {
  label: string;
  organicSessions: number;
  paidSessions: number;
  cvr: number;
}

export interface TrafficSourcePoint {
  label: string;
  organic: number;
  sponsoredProducts: number;
  sponsoredBrands: number;
  sponsoredDisplay: number;
  dsp: number;
}

export interface TrafficFunnelStage {
  label: string;
  value: number;
  popChange: number;     // % change vs prior period
  convRate: number;      // conversion rate from previous stage (%)
  convRateLabel: string; // e.g. "CTR", "ATC Rate", "CVR"
}

export interface TrafficAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  asin?: string;
}

// ─── Status computation (dynamic, threshold-driven) ───────────────────────────

export function computeTrafficStatus(
  cvr: number,
  sessionsPoP: number,
  cvrWarningThreshold = 10,
): TrafficStatus {
  const cvrCritical = cvrWarningThreshold / 2;
  if (cvr < cvrCritical || sessionsPoP < -20) return 'critical';
  if (cvr < cvrWarningThreshold || sessionsPoP < -5) return 'warning';
  return 'healthy';
}

// ─── Dynamic alerts ───────────────────────────────────────────────────────────

export function computeTrafficAlerts(
  data: ProductTrafficRow[],
  cvrWarningThreshold = 10,
): TrafficAlert[] {
  const cvrCritical = cvrWarningThreshold / 2;
  const criticals = data.filter((p) => p.cvr < cvrCritical || p.sessionsPoP < -20);

  const sortedAsc = (field: keyof ProductTrafficRow) =>
    [...data].sort((a, b) => (a[field] as number) - (b[field] as number));
  const sortedDesc = (field: keyof ProductTrafficRow) =>
    [...data].sort((a, b) => (b[field] as number) - (a[field] as number));

  const lowCtr      = sortedAsc('ctr')[0];
  const losingBB    = sortedAsc('buyBoxPct')[0];
  const sessionDrop = sortedAsc('sessionsPoP')[0];
  const risingOrg   = sortedDesc('sessionsPoP')[0];

  const alerts: TrafficAlert[] = [];

  if (criticals.length > 0) {
    alerts.push({
      id: 'critical_cvr',
      type: 'critical',
      title: `${criticals.length} ASINs with critical traffic health`,
      message: `CVR below ${cvrCritical.toFixed(0)}% or sessions dropped >20% — immediate attention needed.`,
    });
  }
  if (sessionDrop && sessionDrop.sessionsPoP < -10) {
    alerts.push({
      id: 'session_drop',
      type: 'warning',
      title: `Sessions down ${Math.abs(sessionDrop.sessionsPoP).toFixed(1)}% PoP`,
      message: `${sessionDrop.product} lost significant traffic. Check ranking or budget.`,
      asin: sessionDrop.asin,
    });
  }
  if (lowCtr && lowCtr.ctr < 0.3) {
    alerts.push({
      id: 'low_ctr',
      type: 'warning',
      title: `CTR below 0.3% on ${lowCtr.asin}`,
      message: `${lowCtr.product} has a ${lowCtr.ctr.toFixed(2)}% CTR — consider refreshing ad creative or main image.`,
      asin: lowCtr.asin,
    });
  }
  if (losingBB && losingBB.buyBoxPct < 70) {
    alerts.push({
      id: 'buybox_loss',
      type: 'warning',
      title: `Buy Box at ${losingBB.buyBoxPct.toFixed(0)}% — ${losingBB.asin}`,
      message: `${losingBB.product} is losing the Buy Box. Check pricing and inventory levels.`,
      asin: losingBB.asin,
    });
  }
  if (risingOrg && risingOrg.sessionsPoP > 15) {
    alerts.push({
      id: 'organic_rising',
      type: 'info',
      title: `Organic sessions up ${risingOrg.sessionsPoP.toFixed(1)}% PoP`,
      message: `${risingOrg.product} is gaining organic rank. Consider increasing ad spend to capture momentum.`,
      asin: risingOrg.asin,
    });
  }

  return alerts;
}

// ─── KPI Summary ─────────────────────────────────────────────────────────────

export const trafficKPIs = [
  {
    id: 'sessions', label: 'Total Sessions', value: '48,312', raw: 48312,
    popChange: +8.4, lyChange: +18.2, positive: true, sub: 'vs prior period',
    sparkline: [38100, 39400, 40200, 41600, 42300, 43500, 44400, 45200, 46100, 46800, 47400, 48312],
  },
  {
    id: 'pageViews', label: 'Page Views', value: '71,940', raw: 71940,
    popChange: +6.1, lyChange: +14.9, positive: true, sub: 'vs prior period',
    sparkline: [59200, 60800, 61500, 63100, 64200, 65400, 66800, 67900, 68800, 69600, 70700, 71940],
  },
  {
    id: 'cvr', label: 'Conv. Rate', value: '14.2%', raw: 14.2,
    popChange: -1.8, lyChange: +0.6, positive: false, sub: 'unit session %',
    sparkline: [16.1, 15.8, 15.9, 15.6, 15.4, 15.1, 14.9, 14.8, 14.7, 14.6, 14.4, 14.2],
  },
  {
    id: 'organicShare', label: 'Organic Share', value: '61%', raw: 61,
    popChange: +2.3, lyChange: +5.1, positive: true, sub: 'of total sessions',
    sparkline: [55, 55, 56, 56, 57, 58, 58, 59, 59, 60, 60, 61],
  },
  {
    id: 'impressions', label: 'Ad Impressions', value: '1.24M', raw: 1240000,
    popChange: +14.7, lyChange: +28.4, positive: true, sub: 'all ad types',
    sparkline: [940000, 970000, 1000000, 1040000, 1070000, 1090000, 1110000, 1140000, 1160000, 1190000, 1210000, 1240000],
  },
  {
    id: 'ctr', label: 'Avg CTR', value: '0.41%', raw: 0.41,
    popChange: -0.08, lyChange: -0.03, positive: false, sub: 'clicks ÷ impressions',
    sparkline: [0.47, 0.46, 0.46, 0.45, 0.45, 0.44, 0.44, 0.43, 0.43, 0.42, 0.42, 0.41],
  },
];

// ─── Traffic Funnel (5 stages, monotonically decreasing) ─────────────────────
// Impressions → Glance Views (Detail PV from all sources) → Sessions → ATC → Orders
// Funnel: Impressions → Clicks (6% CTR) → Add to Cart (20%) → Purchases (46% of ATC)
export const trafficFunnel: TrafficFunnelStage[] = [
  { label: 'Impressions',  value: 1240000, popChange: +14.7, convRate:   0,    convRateLabel: ''         },
  { label: 'Clicks',       value: 74400,   popChange:  +9.2, convRate:   6.0,  convRateLabel: 'CTR'      },
  { label: 'Add to Cart',  value: 14880,   popChange:  +4.2, convRate:  20.0,  convRateLabel: 'ATC Rate' },
  { label: 'Purchases',    value: 6860,    popChange:  +3.1, convRate:  46.1,  convRateLabel: 'CVR'      },
];

// ─── Granularity-based trend data ─────────────────────────────────────────────

function makeTrend(
  labels: string[],
  baseStart: number,
  baseStep: number,
  seed: number,
): TrafficTrendPoint[] {
  const rr = seededRandom(seed);
  return labels.map((label, i) => {
    const base = baseStart + i * baseStep;
    const organic = Math.round(base * (0.56 + rr() * 0.10));
    const paid    = Math.round(base * (0.32 + rr() * 0.08));
    const cvr     = Math.round((11 + rr() * 6) * 10) / 10;
    return { label, organicSessions: organic, paidSessions: paid, cvr };
  });
}

function makeSources(
  labels: string[],
  baseStart: number,
  baseStep: number,
  seed: number,
): TrafficSourcePoint[] {
  const rr = seededRandom(seed);
  return labels.map((label, i) => {
    const total = baseStart + i * baseStep;
    const sp    = Math.round(total * (0.22 + rr() * 0.06));
    const sb    = Math.round(total * (0.06 + rr() * 0.03));
    const sd    = Math.round(total * (0.03 + rr() * 0.02));
    const dsp   = Math.round(total * (0.04 + rr() * 0.03));
    const org   = total - sp - sb - sd - dsp;
    return { label, organic: org, sponsoredProducts: sp, sponsoredBrands: sb, sponsoredDisplay: sd, dsp };
  });
}

const dayLabels = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 1, i + 1); // Feb 2026
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});
const weekLabels    = ['W08','W09','W10','W11','W12','W13','W14','W15','W16','W17','W18','W19'];
const monthLabels   = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
const quarterLabels = ["Q1 '24","Q2 '24","Q3 '24","Q4 '24","Q1 '25","Q2 '25","Q3 '25","Q4 '25"];

export const trafficTrendByGranularity: Record<TrendGranularity, TrafficTrendPoint[]> = {
  day:     makeTrend(dayLabels,     400,  15,  201),
  week:    makeTrend(weekLabels,    2800, 120, 77),
  month:   makeTrend(monthLabels,   9800, 600, 301),
  quarter: makeTrend(quarterLabels, 29000, 4000, 401),
};

export const trafficSourcesByGranularity: Record<TrendGranularity, TrafficSourcePoint[]> = {
  day:     makeSources(dayLabels,     420,  16,  211),
  week:    makeSources(weekLabels,    3200, 100, 311),
  month:   makeSources(monthLabels,   10200, 700, 411),
  quarter: makeSources(quarterLabels, 31000, 5000, 511),
};

// Legacy exports (week-level, for backward compat)
export const trafficTrend   = trafficTrendByGranularity.week;
export const trafficSources = trafficSourcesByGranularity.week;

// ─── Product Traffic Table ────────────────────────────────────────────────────

const PRODUCTS: { asin: string; product: string; category: string }[] = [
  { asin: 'B0DEMO001X', product: 'Everyday Essentials Pack M/L',   category: 'Wellness' },
  { asin: 'B0DEMO002X', product: 'Premium Container Set Blue',      category: 'Home & Kitchen' },
  { asin: 'B0DEMO003X', product: 'Smart Device Pro 740 Black',      category: 'Electronics' },
  { asin: 'B0DEMO004X', product: 'Smart Device Lite X3',            category: 'Electronics' },
  { asin: 'B0DEMO005X', product: 'Classic Carry Bag Small',         category: 'Fashion' },
  { asin: 'B0DEMO006X', product: 'Daily Wellness Drops 50ml',       category: 'Wellness' },
  { asin: 'B0DEMO007X', product: 'Protective Cover Ultra',          category: 'Accessories' },
  { asin: 'B0DEMO008X', product: 'Fast Charger 30W Compact',        category: 'Electronics' },
  { asin: 'B0DEMO009X', product: 'Clear Shield 2-Pack',             category: 'Accessories' },
  { asin: 'B0DEMO010X', product: 'Compact Travel Pouch',            category: 'Fashion' },
  { asin: 'B0DEMO011X', product: 'Organic Green Tea 100g',          category: 'Grocery' },
  { asin: 'B0DEMO012X', product: 'Bamboo Cutting Board Set',        category: 'Home & Kitchen' },
  { asin: 'B0DEMO013X', product: 'LED Desk Lamp USB',               category: 'Electronics' },
  { asin: 'B0DEMO014X', product: 'Memory Foam Travel Pillow',       category: 'Fashion' },
  { asin: 'B0DEMO015X', product: 'Silicone Utensil Set 12pc',       category: 'Home & Kitchen' },
  { asin: 'B0DEMO016X', product: 'Bluetooth Speaker Waterproof',    category: 'Electronics' },
  { asin: 'B0DEMO017X', product: 'Vitamin D3 5000 IU 360ct',        category: 'Wellness' },
  { asin: 'B0DEMO018X', product: 'Resistance Bands Set',            category: 'Fitness' },
  { asin: 'B0DEMO019X', product: 'Ceramic Mug with Lid 400ml',      category: 'Home & Kitchen' },
  { asin: 'B0DEMO020X', product: 'USB-C Cable 2m 3-Pack',           category: 'Electronics' },
];

// Helpers for plausible deltas.
//   ppDelta: percentage-point change (for rate metrics like CVR, BBox, CTR).
//   Bounded so the implied previous value stays inside [floor, ceiling].
function ppDelta(current: number, typicalSpread: number, floor = 0.1, ceiling = 100): number {
  // Random delta in roughly N(0, typicalSpread/2). Clamp so prev stays valid.
  const raw = (r() - 0.5) * 2 * typicalSpread;
  const maxNeg = current - floor;          // delta ≥ -maxNeg → prev ≥ floor
  const maxPos = ceiling - current;        // delta ≤ +maxPos → prev ≤ ceiling
  const bounded = Math.max(-maxNeg, Math.min(maxPos, raw));
  return Math.round(bounded * 10) / 10;
}

// pctDelta: percent change (for volume metrics like sessions, page views).
function pctDelta(typicalSpread: number): number {
  const raw = (r() - 0.5) * 2 * typicalSpread;
  return Math.round(raw * 10) / 10;
}

export const productTrafficData: ProductTrafficRow[] = PRODUCTS.map((p) => {
  const sessions        = Math.round(800 + r() * 4200);
  const pvPerSession    = Math.round((1.2 + r() * 0.8) * 100) / 100;
  const pageViews       = Math.round(sessions * pvPerSession);
  const cvr             = Math.round((4 + r() * 18) * 10) / 10;   // 4–22%
  const orders          = Math.round(sessions * (cvr / 100));
  const buyBoxPct       = Math.round((60 + r() * 40) * 10) / 10;
  const organicPct      = Math.round((40 + r() * 40) * 10) / 10;
  const organicSessions = Math.round(sessions * (organicPct / 100));
  const paidSessions    = sessions - organicSessions;
  const adImpressions   = Math.round(paidSessions * (8 + r() * 20));
  const adClicks        = Math.round(adImpressions * (0.002 + r() * 0.008));
  const ctr             = adImpressions > 0 ? Math.round((adClicks / adImpressions) * 10000) / 100 : 0;
  const addToCartRate   = Math.round((cvr * (1.3 + r() * 0.6)) * 10) / 10;

  // ─── Plausible PoP / LY deltas ───────────────────────────────────────
  // Volume metrics: percent-change, typical PoP spread ±15-25%.
  const sessionsPoP      = pctDelta(20);
  const sessionsLY       = pctDelta(28);
  const pageViewsPoP     = pctDelta(18);
  const adImpressionsPoP = pctDelta(25);

  // Rate metrics: percentage-point change, bounded by current value so the
  // implied previous value stays in a realistic range.
  const cvrPoP           = ppDelta(cvr,        1.5, 1, 35);     // CVR moves ±0.5-1.5pp typically
  const cvrLY            = ppDelta(cvr,        3.0, 1, 35);
  const buyBoxPctPoP     = ppDelta(buyBoxPct,  2.5, 30, 100);   // BBox moves ±1-2.5pp
  const ctrPoP           = ppDelta(ctr,        0.15, 0.05, 5);  // CTR small absolute, small delta
  const organicPctPoP    = ppDelta(organicPct, 3.5, 5, 95);     // Organic share moves a few pp

  return {
    ...p,
    sessions, sessionsPoP, sessionsLY,
    pageViews, pageViewsPoP,
    pvPerSession,
    cvr, cvrPoP, cvrLY,
    orders,
    buyBoxPct, buyBoxPctPoP,
    adImpressions, adImpressionsPoP,
    adClicks,
    ctr, ctrPoP,
    organicSessions, paidSessions,
    organicPct, organicPctPoP,
    addToCartRate,
  };
});
