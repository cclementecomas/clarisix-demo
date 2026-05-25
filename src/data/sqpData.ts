// ─── Search Query Performance (SQP) Portfolio Data ─────────────────────────
// Powers the SQP page — keywords as portfolio assets.
//
// Field shapes mirror Brand Analytics SQP (Search Query Performance Brand
// View): per-keyword market-wide totals + your brand's share at each funnel
// stage (Impressions → Clicks → Cart Adds → Purchases). Plus derived signals
// (Opportunity Score, status label, 4-week trend).

export type KeywordStatus = 'defend' | 'invest' | 'optimize' | 'harvest' | 'drop';

export type KeywordIntent = 'branded' | 'generic' | 'competitor' | 'longTail' | 'category';

export interface KeywordTrendPoint {
  week: string;
  marketVolume: number;
  yourClickShare: number;
  yourPurchaseShare: number;
}

export interface FunnelStageShare {
  /** Market-wide count for this keyword + stage */
  marketCount: number;
  /** Your brand's count at this stage */
  brandCount: number;
  /** brandCount / marketCount × 100 */
  share: number;
}

export interface KeywordRow {
  query: string;
  intent: KeywordIntent;
  status: KeywordStatus;
  /** Search Query Score (Amazon-provided 1–10) */
  qss: number;
  /** Search Query Volume — total market weekly searches */
  marketVolume: number;
  impressions: FunnelStageShare;
  clicks: FunnelStageShare;
  cartAdds: FunnelStageShare;
  purchases: FunnelStageShare;
  /** 4-week absolute change in your purchase share (pp). Drives dot color. */
  trend4w: number;
  trendValues: KeywordTrendPoint[];      // 12 weeks of trend
  /** Opportunity score = market volume × max(0, portfolioAvgShare − clickShare) */
  opportunityScore: number;
  /** Estimated weekly € impact if click-share gap is closed half-way */
  opportunityEur: number;
  /** ASIN currently winning this query (highest brand purchase share). */
  topAsin: { asin: string; title: string; brandShare: number };
  /** PPC summary */
  ppc: { spend: number; acos: number };
  /** Recommended action chip */
  action: string;
}

// ─── Seeded RNG so demo numbers are stable ─────────────────────────────────

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h | 0) || 1;
}
function rng(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ─── Keyword catalog ────────────────────────────────────────────────────────

interface RawKeyword {
  query: string;
  intent: KeywordIntent;
  marketVol: number;             // total weekly market searches
  myClickShare: number;          // % of clicks captured
  myPurchaseShare: number;       // % of purchases captured
  marketCtr: number;             // market click-through-rate
  marketAtcRate: number;         // market clicks → cart adds rate
  marketBuyRate: number;         // market cart adds → purchases rate
  topAsin: string;
  topTitle: string;
  topShare: number;              // top ASIN's brand-share at purchase
  ppcSpend: number;
  ppcAcos: number;
}

const RAW: RawKeyword[] = [
  // Defend quadrant (high volume + high share)
  { query: 'b box flex straw',                           intent: 'branded',   marketVol: 24800, myClickShare: 31.4, myPurchaseShare: 34.2, marketCtr: 4.2, marketAtcRate: 30, marketBuyRate: 54, topAsin: 'B0DEMO001X', topTitle: 'Everyday Essentials Pack 120ct', topShare: 26.5, ppcSpend: 410, ppcAcos: 11.4 },
  { query: 'weighted sippy cup for toddlers 1-3',        intent: 'generic',   marketVol: 18200, myClickShare: 22.1, myPurchaseShare: 23.8, marketCtr: 4.6, marketAtcRate: 28, marketBuyRate: 56, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 18.2, ppcSpend: 580, ppcAcos: 18.7 },
  { query: 'silicone straw replacement',                 intent: 'category',  marketVol: 12400, myClickShare: 18.6, myPurchaseShare: 20.4, marketCtr: 5.1, marketAtcRate: 32, marketBuyRate: 52, topAsin: 'B0DEMO001X', topTitle: 'Everyday Essentials Pack 120ct', topShare: 16.0, ppcSpend: 220, ppcAcos: 14.0 },
  { query: 'spill proof bottle kids',                    intent: 'generic',   marketVol: 9800,  myClickShare: 19.2, myPurchaseShare: 21.1, marketCtr: 4.4, marketAtcRate: 26, marketBuyRate: 58, topAsin: 'B0DEMO004X', topTitle: 'Classic Carry Bag', topShare: 17.6, ppcSpend: 305, ppcAcos: 15.8 },

  // Invest quadrant (high volume + LOW share — biggest opportunities)
  { query: 'collagen peptide powder for skin and joints',intent: 'generic',   marketVol: 39200, myClickShare: 4.8,  myPurchaseShare: 5.1,  marketCtr: 3.8, marketAtcRate: 22, marketBuyRate: 48, topAsin: 'B0DEMO005X', topTitle: 'Smart Device Lite', topShare: 3.2,  ppcSpend: 820, ppcAcos: 38.4 },
  { query: 'toddler training cups',                      intent: 'generic',   marketVol: 28500, myClickShare: 6.2,  myPurchaseShare: 7.0,  marketCtr: 4.1, marketAtcRate: 25, marketBuyRate: 52, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 4.8,  ppcSpend: 640, ppcAcos: 32.1 },
  { query: 'reusable water bottle stainless steel',      intent: 'category',  marketVol: 26100, myClickShare: 3.9,  myPurchaseShare: 4.2,  marketCtr: 4.4, marketAtcRate: 27, marketBuyRate: 50, topAsin: 'B0DEMO009X', topTitle: 'Stainless Water Bottle', topShare: 2.9,  ppcSpend: 540, ppcAcos: 36.0 },
  { query: 'sippy cup with straw 12 months',             intent: 'longTail',  marketVol: 14600, myClickShare: 8.1,  myPurchaseShare: 9.4,  marketCtr: 4.5, marketAtcRate: 30, marketBuyRate: 55, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 7.0,  ppcSpend: 290, ppcAcos: 24.2 },
  { query: 'hydroflask kids',                            intent: 'competitor',marketVol: 19400, myClickShare: 2.4,  myPurchaseShare: 2.8,  marketCtr: 5.2, marketAtcRate: 33, marketBuyRate: 60, topAsin: 'B0DEMO009X', topTitle: 'Stainless Water Bottle', topShare: 1.9,  ppcSpend: 460, ppcAcos: 42.0 },
  { query: 'organic baby food pouches stage 2',          intent: 'longTail',  marketVol: 11800, myClickShare: 5.5,  myPurchaseShare: 6.2,  marketCtr: 4.0, marketAtcRate: 28, marketBuyRate: 53, topAsin: 'B0DEMO006X', topTitle: 'Daily Wellness Capsules', topShare: 4.4,  ppcSpend: 380, ppcAcos: 29.6 },

  // Niche wins (low volume + high share)
  { query: 'b box gen 4 lid replacement',                intent: 'branded',   marketVol: 3200,  myClickShare: 42.8, myPurchaseShare: 48.1, marketCtr: 6.0, marketAtcRate: 35, marketBuyRate: 62, topAsin: 'B0DEMO001X', topTitle: 'Everyday Essentials Pack 120ct', topShare: 38.4, ppcSpend: 95,  ppcAcos: 8.2  },
  { query: 'b.box dishwasher safe',                      intent: 'branded',   marketVol: 1800,  myClickShare: 36.4, myPurchaseShare: 39.8, marketCtr: 5.8, marketAtcRate: 33, marketBuyRate: 60, topAsin: 'B0DEMO001X', topTitle: 'Everyday Essentials Pack 120ct', topShare: 32.1, ppcSpend: 64,  ppcAcos: 9.5  },
  { query: 'spill proof toddler cup pink',               intent: 'longTail',  marketVol: 2400,  myClickShare: 28.6, myPurchaseShare: 32.1, marketCtr: 5.0, marketAtcRate: 30, marketBuyRate: 58, topAsin: 'B0DEMO004X', topTitle: 'Classic Carry Bag', topShare: 25.4, ppcSpend: 110, ppcAcos: 13.8 },
  { query: 'silicone weighted straw 12 oz',              intent: 'longTail',  marketVol: 2100,  myClickShare: 31.2, myPurchaseShare: 35.4, marketCtr: 5.4, marketAtcRate: 32, marketBuyRate: 56, topAsin: 'B0DEMO001X', topTitle: 'Everyday Essentials Pack 120ct', topShare: 29.0, ppcSpend: 78,  ppcAcos: 11.0 },

  // Tail (low volume + low share)
  { query: 'kid bottle 24oz',                            intent: 'longTail',  marketVol: 1600,  myClickShare: 3.2,  myPurchaseShare: 3.5,  marketCtr: 3.6, marketAtcRate: 22, marketBuyRate: 48, topAsin: 'B0DEMO009X', topTitle: 'Stainless Water Bottle', topShare: 2.4, ppcSpend: 38, ppcAcos: 44.2 },
  { query: 'leak proof preschool cup',                   intent: 'longTail',  marketVol: 1200,  myClickShare: 4.5,  myPurchaseShare: 4.9,  marketCtr: 3.8, marketAtcRate: 24, marketBuyRate: 50, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 3.8, ppcSpend: 28, ppcAcos: 38.0 },
  { query: 'hydration sleeve insulated',                 intent: 'category',  marketVol: 980,   myClickShare: 6.1,  myPurchaseShare: 6.7,  marketCtr: 4.2, marketAtcRate: 25, marketBuyRate: 52, topAsin: 'B0DEMO009X', topTitle: 'Stainless Water Bottle', topShare: 5.2, ppcSpend: 22, ppcAcos: 33.4 },
  { query: 'on the go snack cup',                        intent: 'generic',   marketVol: 760,   myClickShare: 8.4,  myPurchaseShare: 9.2,  marketCtr: 4.0, marketAtcRate: 23, marketBuyRate: 49, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 7.0, ppcSpend: 18, ppcAcos: 28.0 },
  { query: 'munchkin straw cup',                         intent: 'competitor',marketVol: 6800,  myClickShare: 1.8,  myPurchaseShare: 2.0,  marketCtr: 4.4, marketAtcRate: 28, marketBuyRate: 54, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 1.4, ppcSpend: 140, ppcAcos: 48.6 },
  { query: 'nuk training cup',                           intent: 'competitor',marketVol: 5200,  myClickShare: 1.5,  myPurchaseShare: 1.7,  marketCtr: 4.0, marketAtcRate: 26, marketBuyRate: 52, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 1.2, ppcSpend: 110, ppcAcos: 52.0 },

  // More volume keywords scattered
  { query: 'kids tumbler with straw',                    intent: 'generic',   marketVol: 22800, myClickShare: 11.4, myPurchaseShare: 12.8, marketCtr: 4.6, marketAtcRate: 28, marketBuyRate: 54, topAsin: 'B0DEMO009X', topTitle: 'Stainless Water Bottle', topShare: 9.6, ppcSpend: 720, ppcAcos: 22.4 },
  { query: 'toddler bento box',                          intent: 'generic',   marketVol: 16400, myClickShare: 9.8,  myPurchaseShare: 11.0, marketCtr: 4.2, marketAtcRate: 26, marketBuyRate: 52, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 8.4, ppcSpend: 480, ppcAcos: 21.0 },
  { query: 'silicone bib roll up',                       intent: 'generic',   marketVol: 8900,  myClickShare: 13.2, myPurchaseShare: 14.6, marketCtr: 4.8, marketAtcRate: 30, marketBuyRate: 56, topAsin: 'B0DEMO011X', topTitle: 'Clear Shield 2-Pack', topShare: 11.8, ppcSpend: 260, ppcAcos: 17.4 },
  { query: 'baby bottle warmer travel',                  intent: 'category',  marketVol: 7200,  myClickShare: 5.6,  myPurchaseShare: 6.2,  marketCtr: 4.0, marketAtcRate: 24, marketBuyRate: 50, topAsin: 'B0DEMO002X', topTitle: 'Premium Container Set', topShare: 4.8, ppcSpend: 195, ppcAcos: 31.2 },
  { query: 'snack catcher with handles',                 intent: 'longTail',  marketVol: 4100,  myClickShare: 16.4, myPurchaseShare: 18.0, marketCtr: 4.4, marketAtcRate: 28, marketBuyRate: 56, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 14.6, ppcSpend: 150, ppcAcos: 19.0 },
  { query: 'open cup for toddler',                       intent: 'generic',   marketVol: 5400,  myClickShare: 4.2,  myPurchaseShare: 4.8,  marketCtr: 3.8, marketAtcRate: 22, marketBuyRate: 50, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 3.6, ppcSpend: 122, ppcAcos: 34.0 },
  { query: 'thermos water bottle 16oz',                  intent: 'competitor',marketVol: 9300,  myClickShare: 2.2,  myPurchaseShare: 2.4,  marketCtr: 4.6, marketAtcRate: 30, marketBuyRate: 58, topAsin: 'B0DEMO009X', topTitle: 'Stainless Water Bottle', topShare: 1.8, ppcSpend: 280, ppcAcos: 46.0 },
  { query: 'kid lunchbox bento',                         intent: 'generic',   marketVol: 13800, myClickShare: 7.6,  myPurchaseShare: 8.4,  marketCtr: 4.2, marketAtcRate: 26, marketBuyRate: 53, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 6.4, ppcSpend: 380, ppcAcos: 26.4 },
  { query: 'sippy cup spout replacement',                intent: 'longTail',  marketVol: 1900,  myClickShare: 22.8, myPurchaseShare: 25.4, marketCtr: 5.2, marketAtcRate: 32, marketBuyRate: 60, topAsin: 'B0DEMO001X', topTitle: 'Everyday Essentials Pack 120ct', topShare: 20.4, ppcSpend: 64, ppcAcos: 12.0 },
  { query: 'no spill 360 cup',                           intent: 'generic',   marketVol: 12200, myClickShare: 6.8,  myPurchaseShare: 7.5,  marketCtr: 4.4, marketAtcRate: 27, marketBuyRate: 53, topAsin: 'B0DEMO003X', topTitle: 'Premium Container Set', topShare: 5.8, ppcSpend: 290, ppcAcos: 28.8 },
];

// ─── Derive each row's full record ─────────────────────────────────────────

function classify(marketVol: number, clickShare: number, trend: number): KeywordStatus {
  const volHi = marketVol >= 8000;
  const shareHi = clickShare >= 15;
  if (volHi && shareHi) return trend < -3 ? 'optimize' : 'defend';
  if (volHi && !shareHi) return 'invest';
  if (!volHi && shareHi) return 'harvest';
  return 'drop';
}

function gen12wTrend(volBase: number, clickShareBase: number, purchaseShareBase: number, seed: number): KeywordTrendPoint[] {
  const r = rng(seed);
  const out: KeywordTrendPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const wkDate = new Date('2026-05-25'); wkDate.setDate(wkDate.getDate() - i * 7);
    const label = `W${Math.ceil(((wkDate.getTime() - new Date(wkDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}`;
    const drift = 1 + (Math.random() < 0.5 ? -1 : 1) * 0;
    void drift;
    const noise = 0.85 + r() * 0.3;
    out.push({
      week: label,
      marketVolume: Math.round(volBase * noise),
      yourClickShare: Math.max(0, +(clickShareBase + (r() - 0.5) * 2).toFixed(1)),
      yourPurchaseShare: Math.max(0, +(purchaseShareBase + (r() - 0.5) * 2).toFixed(1)),
    });
  }
  return out;
}

function actionFor(status: KeywordStatus, gap: number): string {
  switch (status) {
    case 'defend':   return 'Hold rank; protect bids';
    case 'invest':   return gap > 15 ? 'Aggressive bid + creative refresh' : 'Increase bid 20% on top campaigns';
    case 'optimize': return 'Audit listing & creative for funnel leak';
    case 'harvest':  return 'Lower bid; preserve margin';
    case 'drop':     return 'Pause bids; deprioritize';
  }
}

export const sqpKeywords: KeywordRow[] = (() => {
  const rows: KeywordRow[] = [];
  // Portfolio avg click share (used in Opportunity Score formula)
  const portfolioAvgClick = RAW.reduce((s, r) => s + r.myClickShare, 0) / RAW.length;

  for (const raw of RAW) {
    const seed = hash(raw.query);
    const r = rng(seed);

    const impMarket  = Math.round(raw.marketVol * (0.92 + r() * 0.16));
    const clickMarket = Math.round(impMarket * (raw.marketCtr / 100));
    const cartMarket  = Math.round(clickMarket * (raw.marketAtcRate / 100));
    const buyMarket   = Math.round(cartMarket * (raw.marketBuyRate / 100));

    // Your brand counts derived from share at each stage. Each share drifts a
    // bit so funnel leaks show up.
    const impShare   = +(raw.myClickShare * (0.85 + r() * 0.3)).toFixed(1);   // typically a bit below click share
    const clickShare = raw.myClickShare;
    const cartShare  = +Math.max(0.1, clickShare - (3 + r() * 5)).toFixed(1); // ATC leaks 3–8pp vs clicks
    const purShare   = raw.myPurchaseShare;

    const trend4w = +((r() - 0.45) * 8).toFixed(1);          // -3.6 to +4.4 pp

    const opportunity = Math.max(0, portfolioAvgClick - clickShare);
    const opportunityScore = Math.round(raw.marketVol * opportunity);
    // €/week impact ≈ half the gap × market volume × Amazon avg cart-to-buy × ~€18 ASP
    const opportunityEur = Math.round(raw.marketVol * (opportunity / 200) * 0.5 * 18);

    const status = classify(raw.marketVol, clickShare, trend4w);
    const gap = portfolioAvgClick - clickShare;
    const trend = gen12wTrend(raw.marketVol, clickShare, purShare, seed);

    rows.push({
      query: raw.query,
      intent: raw.intent,
      status,
      qss: +(2 + r() * 7.5).toFixed(1),
      marketVolume: raw.marketVol,
      impressions: { marketCount: impMarket,   brandCount: Math.round(impMarket * impShare / 100),   share: impShare },
      clicks:      { marketCount: clickMarket, brandCount: Math.round(clickMarket * clickShare / 100), share: clickShare },
      cartAdds:    { marketCount: cartMarket,  brandCount: Math.round(cartMarket * cartShare / 100),  share: cartShare },
      purchases:   { marketCount: buyMarket,   brandCount: Math.round(buyMarket * purShare / 100),    share: purShare },
      trend4w,
      trendValues: trend,
      opportunityScore,
      opportunityEur,
      topAsin: { asin: raw.topAsin, title: raw.topTitle, brandShare: raw.topShare },
      ppc: { spend: raw.ppcSpend, acos: raw.ppcAcos },
      action: actionFor(status, gap),
    });
  }
  return rows.sort((a, b) => b.opportunityScore - a.opportunityScore);
})();

// ─── Portfolio-level summary derived from sqpKeywords ─────────────────────

export type Quadrant = 'defend' | 'invest' | 'harvest' | 'tail';

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  defend:  'Defend',
  invest:  'Invest',
  harvest: 'Harvest',
  tail:    'Tail',
};

export const QUADRANT_ACTION: Record<Quadrant, string> = {
  defend:  'Protect share, avoid losing rank',
  invest:  'Increase bid / content / rank',
  harvest: 'Maintain, optimize ACOS',
  tail:    'Ignore or test cheaply',
};

export const QUADRANT_STYLE: Record<Quadrant, { bg: string; text: string; ring: string }> = {
  defend:  { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  invest:  { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200' },
  harvest: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-200' },
  tail:    { bg: 'bg-slate-50',   text: 'text-slate-600',   ring: 'ring-slate-200' },
};

export interface SqpSummary {
  tracked: number;
  totalMarketVolume: number;
  avgClickShare: number;
  avgPurchaseShare: number;
  top14Share: number;          // % of market volume coming from top 14 keywords
  underIndexedCount: number;   // keywords with click share < portfolio avg
  topOpportunity: KeywordRow;
  /** Sum of opportunityEur across all keywords (€/wk recoverable). */
  totalOpportunityEur: number;
  /** % of total opportunity € concentrated in top-5 keywords. */
  top5ConcentrationPct: number;
  /** Portfolio volume median — used to bucket keywords into quadrants. */
  volumeMedian: number;
  /** Dominant quadrant by total opportunity € (drives hero-card narrative). */
  dominantOppQuadrant: Quadrant;
  /** Total opportunity € grouped by quadrant — order matches dominantOppQuadrant lookup. */
  oppByQuadrant: Record<Quadrant, number>;
}

/** Classify a keyword into one of the four portfolio quadrants. Boundaries
 *  are portfolio-stable (volume median + portfolio-avg click share) so the
 *  result doesn't shift when the map filters change. */
export function keywordQuadrant(k: KeywordRow, volumeMedian: number, avgClickShare: number): Quadrant {
  const highVol = k.marketVolume >= volumeMedian;
  const highShare = k.clicks.share >= avgClickShare;
  if (highVol && highShare) return 'defend';
  if (highVol && !highShare) return 'invest';
  if (!highVol && highShare) return 'harvest';
  return 'tail';
}

/** Per-keyword synthetic market stage shares used by the funnel diagnostic.
 *  Mirrors the logic in `KeywordDetail` so the "Main gap" column and the
 *  drawer agree on the same numbers. */
export function keywordMarketStageShares(k: KeywordRow): { impressions: number; clicks: number; cartAdds: number; purchases: number } {
  return {
    impressions: Math.max(15, k.clicks.share + 8),
    clicks:      Math.max(15, k.clicks.share + 8),
    cartAdds:    Math.max(12, k.clicks.share + 5),
    purchases:   Math.max(10, k.purchases.share + 6),
  };
}

/** Identify the funnel stage where this keyword has the largest gap vs the
 *  synthetic market share. Returns the stage label and pp gap. Negative gap
 *  means you beat market at every stage. */
export function keywordMainGap(k: KeywordRow): { stageKey: 'impressions' | 'clicks' | 'cartAdds' | 'purchases'; stageLabel: string; gapPp: number } {
  const m = keywordMarketStageShares(k);
  const stages = [
    { stageKey: 'impressions' as const, stageLabel: 'Impressions', gapPp: +(m.impressions - k.impressions.share).toFixed(1) },
    { stageKey: 'clicks'      as const, stageLabel: 'Clicks',      gapPp: +(m.clicks      - k.clicks.share).toFixed(1) },
    { stageKey: 'cartAdds'    as const, stageLabel: 'Cart Adds',   gapPp: +(m.cartAdds    - k.cartAdds.share).toFixed(1) },
    { stageKey: 'purchases'   as const, stageLabel: 'Purchases',   gapPp: +(m.purchases   - k.purchases.share).toFixed(1) },
  ];
  return stages.reduce((a, b) => (b.gapPp > a.gapPp ? b : a));
}

export const sqpSummary: SqpSummary = (() => {
  const total = sqpKeywords.reduce((s, k) => s + k.marketVolume, 0);
  const avgClick    = sqpKeywords.reduce((s, k) => s + k.clicks.share, 0) / sqpKeywords.length;
  const avgPurchase = sqpKeywords.reduce((s, k) => s + k.purchases.share, 0) / sqpKeywords.length;
  const sortedByVol = [...sqpKeywords].sort((a, b) => b.marketVolume - a.marketVolume);
  const top14Vol = sortedByVol.slice(0, 14).reduce((s, k) => s + k.marketVolume, 0);

  const sortedVols = [...sqpKeywords].map((k) => k.marketVolume).sort((a, b) => a - b);
  const volMedian = sortedVols[Math.floor(sortedVols.length / 2)] ?? 0;

  const totalOpp = sqpKeywords.reduce((s, k) => s + k.opportunityEur, 0);
  const top5Opp = [...sqpKeywords].sort((a, b) => b.opportunityEur - a.opportunityEur)
    .slice(0, 5).reduce((s, k) => s + k.opportunityEur, 0);

  const oppByQuadrant: Record<Quadrant, number> = { defend: 0, invest: 0, harvest: 0, tail: 0 };
  for (const k of sqpKeywords) {
    const q = keywordQuadrant(k, volMedian, +avgClick.toFixed(1));
    oppByQuadrant[q] += k.opportunityEur;
  }
  const dominantOppQuadrant = (Object.entries(oppByQuadrant)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'invest') as Quadrant;

  return {
    tracked: sqpKeywords.length,
    totalMarketVolume: total,
    avgClickShare: +avgClick.toFixed(1),
    avgPurchaseShare: +avgPurchase.toFixed(1),
    top14Share: +((top14Vol / total) * 100).toFixed(0),
    underIndexedCount: sqpKeywords.filter((k) => k.clicks.share < avgClick).length,
    topOpportunity: sqpKeywords[0],
    totalOpportunityEur: Math.round(totalOpp),
    top5ConcentrationPct: totalOpp > 0 ? Math.round((top5Opp / totalOpp) * 100) : 0,
    volumeMedian: volMedian,
    dominantOppQuadrant,
    oppByQuadrant,
  };
})();
