// ─── Search Query Performance (SQP) Portfolio Data ─────────────────────────
// Powers the SQP page — keywords as portfolio assets.
//
// Field shapes mirror Brand Analytics SQP (Search Query Performance Brand
// View): per-keyword market-wide totals + your brand's share at each funnel
// stage (Impressions → Clicks → Cart Adds → Purchases). Plus derived signals
// (Opportunity Score, status label, 4-week trend).

import { ACCOUNT_ASP } from './accountMetrics';

// Portfolio position === the quadrant (one classifier, no divergence).
export type KeywordStatus = Quadrant;

export type KeywordIntent = 'branded' | 'generic' | 'competitor' | 'longTail' | 'category';

export interface KeywordTrendPoint {
  week: string;
  marketVolume: number;
  yourImpressionShare: number;
  yourClickShare: number;
  yourCartAddShare: number;
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
  /** True for branded queries (SOP: analyze non-branded to judge listing/PPC). */
  branded: boolean;
  status: KeywordStatus;
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

// Which funnel story a demo keyword illustrates. Derived from its economics
// (see deriveProfile) so the page shows a realistic spread across all five
// diagnoses, then used to set impression/purchase share consistently.
type DiagProfile = 'cannibal' | 'visibility' | 'ctr' | 'cvr' | 'healthy';

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

// Funnel-diagnosis thresholds (SOP-sourced). Declared here (before the
// sqpKeywords IIFE, which calls keywordDiagnosis) so they're initialized when
// the derivation runs. Impression-share ceiling ≈ 7% per child ASIN; < 2% on a
// high-volume term = a visibility problem; click share ≥ 2× impression share =
// PPC duplicating organic clicks.
const CANNIBAL_RATIO = 2;
const CANNIBAL_MIN_IS = 3;
const LOW_IS = 2;
const VOL_HI = 8000;
const GAP_MIN = 0.5;

// Pick the funnel story a keyword illustrates from its economics: you own
// branded / cheap-to-win terms organically (PPC cannibalizes); you're barely
// visible on big, expensive competitor terms (visibility gap); the rest split
// across CTR / CVR / consistent. Deterministic so the demo is stable.
function deriveProfile(raw: RawKeyword): DiagProfile {
  if (raw.intent === 'branded' || raw.ppcAcos < 12) return 'cannibal';
  if (raw.marketVol >= VOL_HI && raw.myClickShare < 6 && raw.ppcAcos > 30) return 'visibility';
  const h = hash(raw.query + 'dx') % 3;
  return h === 0 ? 'ctr' : h === 1 ? 'cvr' : 'healthy';
}

// Derive impression & purchase share from click share so (IS, CLK, PS) are
// internally consistent AND realize the intended diagnosis. Cannibalization
// needs click share ≥ 2× impression share; visibility needs impression share
// < 2%; CTR needs impression share above click share; CVR needs purchase share
// below click share.
function sharesForProfile(profile: DiagProfile, clickShare: number): { impShare: number; purShare: number } {
  let impShare: number, purShare: number;
  switch (profile) {
    case 'cannibal':   impShare = clickShare * 0.42; purShare = clickShare * 1.08; break;
    case 'visibility': impShare = Math.min(1.9, Math.max(1.0, clickShare * 0.40)); purShare = clickShare * 1.05; break;
    case 'ctr':        impShare = clickShare * 1.35; purShare = clickShare * 1.06; break;
    case 'cvr':        impShare = clickShare * 1.02; purShare = clickShare * 0.78; break;
    default:           impShare = clickShare * 1.00; purShare = clickShare * 1.08; break;
  }
  return { impShare: +impShare.toFixed(1), purShare: +Math.max(0.1, purShare).toFixed(1) };
}

function gen12wTrend(volBase: number, impShareBase: number, clickShareBase: number, cartShareBase: number, purchaseShareBase: number, seed: number): KeywordTrendPoint[] {
  const r = rng(seed);
  const out: KeywordTrendPoint[] = [];
  // Noise scales with the level so tiny shares (e.g. 1%) don't wobble as much
  // in absolute terms as double-digit ones.
  const wobble = (base: number) => Math.max(0, +(base + (r() - 0.5) * Math.max(0.6, base * 0.18)).toFixed(1));
  for (let i = 11; i >= 0; i--) {
    const wkDate = new Date('2026-05-25'); wkDate.setDate(wkDate.getDate() - i * 7);
    const label = `W${Math.ceil(((wkDate.getTime() - new Date(wkDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}`;
    const noise = 0.85 + r() * 0.3;
    out.push({
      week: label,
      marketVolume: Math.round(volBase * noise),
      yourImpressionShare: wobble(impShareBase),
      yourClickShare: wobble(clickShareBase),
      yourCartAddShare: wobble(cartShareBase),
      yourPurchaseShare: wobble(purchaseShareBase),
    });
  }
  return out;
}

export const sqpKeywords: KeywordRow[] = (() => {
  const rows: KeywordRow[] = [];
  // Portfolio avg click share — the honest, derivable reference for
  // "under-indexing" (Amazon doesn't publish a per-query click-share benchmark).
  const portfolioAvgClick = RAW.reduce((s, r) => s + r.myClickShare, 0) / RAW.length;

  for (const raw of RAW) {
    const seed = hash(raw.query);
    const r = rng(seed);

    const impMarket  = Math.round(raw.marketVol * (0.92 + r() * 0.16));
    const clickMarket = Math.round(impMarket * (raw.marketCtr / 100));
    const cartMarket  = Math.round(clickMarket * (raw.marketAtcRate / 100));
    const buyMarket   = Math.round(cartMarket * (raw.marketBuyRate / 100));

    // Your brand shares at each stage, derived from click share + the keyword's
    // funnel profile so (impression, click, cart, purchase) shares tell a
    // consistent, real story (no synthetic benchmark needed downstream).
    const clickShare = raw.myClickShare;
    const { impShare, purShare } = sharesForProfile(deriveProfile(raw), clickShare);
    const cartShare  = +Math.max(0.1, (clickShare + purShare) / 2).toFixed(1); // sits between click & purchase

    const trend4w = +((r() - 0.45) * 8).toFixed(1);          // -3.6 to +4.4 pp

    const opportunity = Math.max(0, portfolioAvgClick - clickShare);
    const opportunityScore = Math.round(raw.marketVol * opportunity);
    // €/week impact ≈ half the gap × market volume × Amazon avg cart-to-buy × account ASP
    const opportunityEur = Math.round(raw.marketVol * (opportunity / 200) * 0.5 * ACCOUNT_ASP);

    const trend = gen12wTrend(raw.marketVol, impShare, clickShare, cartShare, purShare, seed);

    rows.push({
      query: raw.query,
      intent: raw.intent,
      branded: raw.intent === 'branded',
      status: 'invest', // placeholder — reassigned below from the unified quadrant classifier
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
      action: '', // reassigned below from the funnel diagnosis
    });
  }

  // Second pass: one classifier for position (quadrant) + one for the fix
  // (funnel diagnosis). They answer different questions and can't contradict.
  const avgClick = rows.reduce((s, k) => s + k.clicks.share, 0) / rows.length;
  const vols = rows.map((k) => k.marketVolume).sort((a, b) => a - b);
  const volMedian = vols[Math.floor(vols.length / 2)] ?? 0;
  for (const row of rows) {
    row.status = keywordQuadrant(row, volMedian, +avgClick.toFixed(1));
    row.action = keywordDiagnosis(row).action;
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

// ─── Funnel diagnosis (real SQP data — no synthetic benchmark) ─────────────
// Amazon SQP gives brand counts AND market totals per stage, so your CTR/CVR
// vs the MARKET's CTR/CVR are directly derivable (unlike a "market share"
// benchmark, which doesn't exist). The share-language and rate-language are
// equivalent: impression share > click share ⟺ your CTR < market CTR; click
// share > purchase share ⟺ your CVR < market CVR.

export type DiagnosisKey = 'cannibalization' | 'visibility' | 'ctr' | 'cvr' | 'healthy';

export interface KeywordFunnel {
  yourCtr: number; marketCtr: number; ctrGapPp: number;   // + = you trail market
  yourCvr: number; marketCvr: number; cvrGapPp: number;
  key: DiagnosisKey;
  label: string;
  detail: string;
  action: string;
}

export function keywordDiagnosis(k: KeywordRow): KeywordFunnel {
  const is = k.impressions.share, clk = k.clicks.share, ps = k.purchases.share;

  // Market rates come from the large market counts; your rates are recovered
  // from the shares (yourCtr = marketCtr × clickShare/imprShare) so they're
  // exact and free of small-count rounding noise.
  const marketCtr = k.impressions.marketCount > 0 ? (k.clicks.marketCount / k.impressions.marketCount) * 100 : 0;
  const marketCvr = k.clicks.marketCount > 0 ? (k.purchases.marketCount / k.clicks.marketCount) * 100 : 0;
  const yourCtr = is > 0 ? marketCtr * (clk / is) : 0;
  const yourCvr = clk > 0 ? marketCvr * (ps / clk) : 0;

  // Gaps in share points — exact, and literally the SOP rule (impression share
  // > click share ⟺ CTR below market; click share > purchase share ⟺ CVR below).
  const ctrGapPp = +(is - clk).toFixed(1);   // > 0 → seen but not clicked
  const cvrGapPp = +(clk - ps).toFixed(1);    // > 0 → clicked but not converted

  const base = {
    yourCtr: +yourCtr.toFixed(1), marketCtr: +marketCtr.toFixed(1), ctrGapPp,
    yourCvr: +yourCvr.toFixed(1), marketCvr: +marketCvr.toFixed(1), cvrGapPp,
  };

  let key: DiagnosisKey, label: string, detail: string, action: string;
  if (clk >= CANNIBAL_RATIO * is && is >= CANNIBAL_MIN_IS) {
    key = 'cannibalization'; label = 'Cannibalization';
    detail = `Click share ${clk.toFixed(1)}% is ${(clk / Math.max(is, 0.1)).toFixed(1)}× your impression share ${is.toFixed(1)}% — PPC is buying clicks organic already wins.`;
    action = 'Cut bids ~20%/wk; watch rank';
  } else if (is < LOW_IS && k.marketVolume >= VOL_HI) {
    key = 'visibility'; label = 'Visibility gap';
    detail = `Only ${is.toFixed(1)}% impression share on ${k.marketVolume.toLocaleString()} searches/wk — customers can't find you.`;
    action = 'Invest — exact-match SP, top-of-search';
  } else if (ctrGapPp >= cvrGapPp && ctrGapPp > GAP_MIN) {
    key = 'ctr'; label = 'CTR problem';
    detail = `Impression share ${is.toFixed(1)}% but click share only ${clk.toFixed(1)}% — your CTR ${base.yourCtr}% trails the market's ${base.marketCtr}%. You're seen but not clicked.`;
    action = 'Fix CTR — main image, title, price, reviews';
  } else if (cvrGapPp > GAP_MIN) {
    key = 'cvr'; label = 'CVR problem';
    detail = `Click share ${clk.toFixed(1)}% but purchase share only ${ps.toFixed(1)}% — your CVR ${base.yourCvr}% trails the market's ${base.marketCvr}%. Clicks aren't converting.`;
    action = 'Fix CVR — A+, price, reviews, delivery';
  } else {
    key = 'healthy'; label = 'Consistent';
    detail = `Impression, click and purchase share are in line — no single-stage leak.`;
    action = 'Hold — defend rank and bids';
  }
  return { ...base, key, label, detail, action };
}

export const DIAGNOSIS_STYLE: Record<DiagnosisKey, { text: string; bg: string; ring: string }> = {
  cannibalization: { text: 'text-indigo-700', bg: 'bg-indigo-50',  ring: 'ring-indigo-200' },
  visibility:      { text: 'text-amber-700',  bg: 'bg-amber-50',   ring: 'ring-amber-200' },
  ctr:             { text: 'text-rose-700',   bg: 'bg-rose-50',    ring: 'ring-rose-200' },
  cvr:             { text: 'text-rose-700',   bg: 'bg-rose-50',    ring: 'ring-rose-200' },
  healthy:         { text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
};

// Reference rules-of-thumb for reading impression share (NOT hard limits, and
// NOT used to classify — the visibility diagnosis uses LOW_IS above). Impression
// share per child ASIN rarely climbs above ~7%, and ~4% is often already strong.
// Shown only as guidance next to the number.
export const IMPRESSION_SHARE_CEILING = 7;
export const IMPRESSION_SHARE_STRONG = 4;

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
