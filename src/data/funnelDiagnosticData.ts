// ─── Funnel Diagnostic Data ─────────────────────────────────────────────────
// Powers the Traffic page redesign and the per-keyword diagnostic embedded
// in the SQP detail panel.
//
// Data shape mirrors Brand Analytics SQP at the brand level:
//   Impressions → Clicks → Cart Adds → Purchases
// For each stage we track market totals + your brand totals → share %.
// Plus 12-week trends per stage so we can render line-mini charts.

export type FunnelStageKey = 'impressions' | 'clicks' | 'cartAdds' | 'purchases';

export interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  /** Total searches / market volume for the stage */
  marketCount: number;
  /** Your brand's count at the stage */
  brandCount: number;
  /** brand/market × 100 */
  share: number;
  /** Market share % across same period last week (for WoW arrows on micro KPIs) */
  shareWow: number;
}

export interface ConversionRate {
  /** Stage you're converting FROM */
  fromKey: FunnelStageKey;
  /** Stage you're converting TO */
  toKey: FunnelStageKey;
  /** Your conversion (e.g., CTR = clicks/impressions × 100) */
  yourRate: number;
  /** Market conversion */
  marketRate: number;
  /** yourRate − marketRate (pp) */
  delta: number;
  /** "CTR" / "Click → Cart Add" / "Cart Add → Purchase" */
  shortLabel: string;
}

export interface StageTrendPoint {
  week: string;
  yourShare: number;
  marketShare: number;
}

export interface TrafficSourceFunnel {
  source: 'Organic' | 'Sponsored Products' | 'Sponsored Brands' | 'Sponsored Display';
  /**
   * Absolute counts per stage for this source.
   * Used to render "Funnel contribution by source": each stage's stacked bar
   * shows what % of your total at that stage came from each source.
   *
   * Why counts (not shares): per-source MARKET share isn't published by
   * Amazon. Showing "your contribution to your own total" is the question
   * we can honestly answer.
   */
  counts: {
    impressions: number;
    clicks: number;
    cartAdds: number;
    purchases: number;
  };
  /** Estimated weekly revenue contribution */
  revenue: number;
}

export interface RecommendedAction {
  title: string;
  detail: string;
  /** Estimated weekly € impact if executed */
  impactEur: number;
  /** SKUs / keywords most affected */
  affected: string;
  /** Where to drill (deep-link target, just descriptive for the wireframe) */
  drillTo: string;
}

export interface FunnelDiagnostic {
  /** Identifier — page-level for Traffic, or a keyword string for SQP */
  scope: string;
  stages: FunnelStage[];
  conversions: ConversionRate[];
  /** Reference market share % per stage, used for the StageCard comparison */
  marketShares: Record<FunnelStageKey, number>;
  /** Index in stages[] where the largest negative delta sits */
  biggestOpportunityIdx: number;
  /** Per-stage 12-week trends */
  stageTrends: Record<FunnelStageKey, StageTrendPoint[]>;
  /** Insight narrative for the headline strip */
  insight: string;
  /** Estimated weekly € recovered if half the gap at the worst stage closes */
  insightImpactEur: number;
  /** Brand-level decomposition by traffic source (Traffic page only) */
  sourceFunnels?: TrafficSourceFunnel[];
  /** Ranked actions (Traffic page only) */
  actions?: RecommendedAction[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function rng(seed: number): () => number {
  let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h | 0) || 1;
}

function buildStageTrends(seed: number, currentShare: number, marketShare: number): StageTrendPoint[] {
  const r = rng(seed);
  const points: StageTrendPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const wkDate = new Date('2026-05-25'); wkDate.setDate(wkDate.getDate() - i * 7);
    const label = `W${Math.ceil(((wkDate.getTime() - new Date(wkDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}`;
    // Slight drift back-in-time so latest point = currentShare-ish
    const driftFromNow = (1 - i / 11) * 0.5;
    const noise = (r() - 0.5) * 2.5;
    points.push({
      week: label,
      yourShare: +Math.max(0, (currentShare - 1.5) + driftFromNow * 1.2 + noise).toFixed(1),
      marketShare: +Math.max(0, marketShare + (r() - 0.5) * 0.6).toFixed(1),
    });
  }
  return points;
}

function buildConversions(stages: FunnelStage[]): ConversionRate[] {
  const labels: Record<string, string> = {
    'impressions-clicks': 'CTR',
    'clicks-cartAdds': 'Click → Cart Add',
    'cartAdds-purchases': 'Cart Add → Purchase',
  };
  const out: ConversionRate[] = [];
  for (let i = 0; i < stages.length - 1; i++) {
    const a = stages[i], b = stages[i + 1];
    const yourRate   = a.brandCount  > 0 ? (b.brandCount  / a.brandCount)  * 100 : 0;
    const marketRate = a.marketCount > 0 ? (b.marketCount / a.marketCount) * 100 : 0;
    out.push({
      fromKey: a.key,
      toKey: b.key,
      yourRate: +yourRate.toFixed(1),
      marketRate: +marketRate.toFixed(1),
      delta: +(yourRate - marketRate).toFixed(1),
      shortLabel: labels[`${a.key}-${b.key}`] ?? 'Rate',
    });
  }
  return out;
}

// ─── Brand-level funnel (Traffic page) ─────────────────────────────────────

const brandImpressions = { market: 854_200, brand: 95_300 };  // 11.16% impression share
const brandClicks      = { market: 38_440,  brand: 4_580 };   // 11.91% click share
const brandCartAdds    = { market: 12_180,  brand: 1_068 };   // 8.77% — the LEAK
const brandPurchases   = { market: 6_540,   brand: 612 };     // 9.36% purchase share

const trafficFunnel: FunnelDiagnostic = (() => {
  const stages: FunnelStage[] = [
    { key: 'impressions', label: 'Impressions', marketCount: brandImpressions.market, brandCount: brandImpressions.brand, share: +((brandImpressions.brand / brandImpressions.market) * 100).toFixed(2), shareWow: -0.3 },
    { key: 'clicks',      label: 'Clicks',      marketCount: brandClicks.market,      brandCount: brandClicks.brand,      share: +((brandClicks.brand      / brandClicks.market)      * 100).toFixed(2), shareWow: +0.4 },
    { key: 'cartAdds',    label: 'Cart Adds',   marketCount: brandCartAdds.market,    brandCount: brandCartAdds.brand,    share: +((brandCartAdds.brand    / brandCartAdds.market)    * 100).toFixed(2), shareWow: -2.1 },
    { key: 'purchases',   label: 'Purchases',   marketCount: brandPurchases.market,   brandCount: brandPurchases.brand,   share: +((brandPurchases.brand   / brandPurchases.market)   * 100).toFixed(2), shareWow: +0.2 },
  ];
  const conversions = buildConversions(stages);

  // Biggest opportunity = stage where (yourShare − marketShare) of THE STAGE is most negative.
  // Compute pseudo-market share by anchoring on the largest funnel — for the wireframe we
  // simulate that the seller leaks the most at cart-adds (idx 2).
  // We'll explicitly mark cartAdds as the biggest opportunity stage.
  const biggestOpportunityIdx = 2;

  const stageTrends: Record<FunnelStageKey, StageTrendPoint[]> = {
    impressions: buildStageTrends(hash('imp'), stages[0].share, 11.0),
    clicks:      buildStageTrends(hash('clk'), stages[1].share, 11.5),
    cartAdds:    buildStageTrends(hash('cart'), stages[2].share, 13.8), // market 13.8% → seller trails meaningfully
    purchases:   buildStageTrends(hash('buy'), stages[3].share, 9.0),
  };

  // Insight: leak at click-to-cart stage (≈ 6.5pp behind market).
  // ½ closing × ~240 units/week × ~€35 ASP ≈ €8,400/wk.
  const leakConv = conversions[1]; // click → cart
  const gapPp = Math.abs(leakConv.delta);
  const halfGap = gapPp / 2;
  const yourClicks = brandClicks.brand;
  const recoverableUnits = Math.round(yourClicks * (halfGap / 100));
  const insightImpactEur = Math.round(recoverableUnits * 35);
  const insight = `Your funnel leaks ${gapPp.toFixed(1)}pp at the click-to-cart stage. Closing half this gap captures an estimated ${recoverableUnits.toLocaleString()} units per week worth €${insightImpactEur.toLocaleString()} in revenue at current ASPs.`;

  // Absolute counts per source per stage. Sums per stage match brand totals.
  // Pattern: paid sources lose share down the funnel (worse conversion);
  // organic gains share down the funnel.
  //
  // Brand totals (for reference, must sum):
  //   impressions: 95_300 · clicks: 4_580 · cartAdds: 1_068 · purchases: 612
  const sourceFunnels: TrafficSourceFunnel[] = [
    { source: 'Organic',             counts: { impressions: 53_000, clicks: 2_780, cartAdds:   730, purchases: 442 }, revenue: 62_400 },
    { source: 'Sponsored Products',  counts: { impressions: 25_400, clicks: 1_050, cartAdds:   178, purchases: 100 }, revenue: 38_200 },
    { source: 'Sponsored Brands',    counts: { impressions: 11_700, clicks:   520, cartAdds:   115, purchases:  52 }, revenue: 14_800 },
    { source: 'Sponsored Display',   counts: { impressions:  5_200, clicks:   230, cartAdds:    45, purchases:  18 }, revenue:  6_300 },
  ];

  const actions: RecommendedAction[] = [
    { title: 'Refresh product images on 8 top-volume ASINs',     detail: 'Cart-add rate trails market by 6.5pp. Image refresh historically recovers 2–4pp.', impactEur: 12_400, affected: 'B0DEMO001X, B0DEMO003X +6', drillTo: 'Content > Tracker' },
    { title: 'A/B test bullet copy on 4 invest-bucket keywords', detail: 'Click → cart conversion is the weakest stage on these specifically.',                impactEur:  8_200, affected: '4 listings',             drillTo: 'Content > Tracker' },
    { title: 'Lower SP bids on 6 high-ACoS keywords',            detail: 'Paid ATC rate is half of organic — ad clicks aren\'t converting.',                    impactEur:  6_800, affected: 'PPC > 6 campaigns',     drillTo: 'Advertising > Deepdive' },
    { title: 'Add S&S to 12 replenishable SKUs',                  detail: 'NTB share is 48% but S&S share only 18% — repeat-purchase lever is under-pulled.',  impactEur:  5_400, affected: '12 SKUs',               drillTo: 'Inventory > Planner' },
    { title: 'Pause SD campaigns on 3 competitor terms',          detail: 'Cart-add share 3.1% vs 13.8% market — display traffic is not converting here.',    impactEur:  3_600, affected: '3 campaigns',           drillTo: 'Advertising > Deepdive' },
  ];

  return {
    scope: 'brand',
    stages,
    conversions,
    marketShares: { impressions: 11.0, clicks: 11.5, cartAdds: 13.8, purchases: 9.0 },
    biggestOpportunityIdx,
    stageTrends,
    insight,
    insightImpactEur,
    sourceFunnels,
    actions,
  };
})();

export { trafficFunnel as brandFunnelDiagnostic };

// ─── Per-keyword funnel diagnostic builder (SQP detail panel) ──────────────

export function buildKeywordFunnel(scope: string, opts: {
  impressions: { marketCount: number; brandCount: number; share: number };
  clicks:      { marketCount: number; brandCount: number; share: number };
  cartAdds:    { marketCount: number; brandCount: number; share: number };
  purchases:   { marketCount: number; brandCount: number; share: number };
  /** Per-stage market share % to compare against (per-keyword market shares
      are computed from same brand/market counts so seller-vs-market is real). */
  marketStageShares: Record<FunnelStageKey, number>;
}): FunnelDiagnostic {
  const stages: FunnelStage[] = [
    { key: 'impressions', label: 'Impressions', marketCount: opts.impressions.marketCount, brandCount: opts.impressions.brandCount, share: opts.impressions.share, shareWow: 0 },
    { key: 'clicks',      label: 'Clicks',      marketCount: opts.clicks.marketCount,      brandCount: opts.clicks.brandCount,      share: opts.clicks.share,      shareWow: 0 },
    { key: 'cartAdds',    label: 'Cart Adds',   marketCount: opts.cartAdds.marketCount,    brandCount: opts.cartAdds.brandCount,    share: opts.cartAdds.share,    shareWow: 0 },
    { key: 'purchases',   label: 'Purchases',   marketCount: opts.purchases.marketCount,   brandCount: opts.purchases.brandCount,   share: opts.purchases.share,   shareWow: 0 },
  ];
  const conversions = buildConversions(stages);

  // Biggest opportunity stage = idx with largest (marketShare − yourShare) gap
  let biggestIdx = 0; let biggestGap = -Infinity;
  stages.forEach((s, i) => {
    const gap = opts.marketStageShares[s.key] - s.share;
    if (gap > biggestGap) { biggestGap = gap; biggestIdx = i; }
  });

  const stageTrends: Record<FunnelStageKey, StageTrendPoint[]> = {
    impressions: buildStageTrends(hash(scope + 'imp'), stages[0].share, opts.marketStageShares.impressions),
    clicks:      buildStageTrends(hash(scope + 'clk'), stages[1].share, opts.marketStageShares.clicks),
    cartAdds:    buildStageTrends(hash(scope + 'cart'), stages[2].share, opts.marketStageShares.cartAdds),
    purchases:   buildStageTrends(hash(scope + 'buy'), stages[3].share, opts.marketStageShares.purchases),
  };

  const worstStage = stages[biggestIdx];
  const gap = opts.marketStageShares[worstStage.key] - worstStage.share;
  const halfRecovered = Math.max(0, gap / 2);
  const recoverableUnits = Math.round(stages[1].brandCount * (halfRecovered / 100));
  const insightImpactEur = Math.round(recoverableUnits * 18);
  const insight = gap > 0
    ? `You under-index at ${worstStage.label.toLowerCase()} by ${gap.toFixed(1)}pp on this query. Closing half the gap is worth ≈ €${insightImpactEur.toLocaleString()}/wk at category ASPs.`
    : `You beat the market at every stage on this query.`;

  return {
    scope,
    stages,
    conversions,
    marketShares: opts.marketStageShares,
    biggestOpportunityIdx: biggestIdx,
    stageTrends,
    insight,
    insightImpactEur,
  };
}
