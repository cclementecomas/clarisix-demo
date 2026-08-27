// ─── Search share (SQP) selectors — query pivot, share level ────────────────
import type { SqpRow, TransitionKey, Quadrant, Flag } from '../../lib/sqp/types';
import { queryStats, computeLeak, playbook, aggregate, stageMetrics } from '../../lib/sqp/metrics';
import { ASIN_TITLE } from '../searchfunnel/selectors';

function weightedClickPrice(rows: SqpRow[]): { your: number | null; mkt: number | null } {
  let wY = 0, sY = 0, wM = 0, sM = 0;
  for (const r of rows) {
    if (r.clicks_asin > 0 && r.price_click_asin != null) { wY += r.clicks_asin; sY += r.clicks_asin * r.price_click_asin; }
    if (r.clicks_total > 0 && r.price_click_mkt != null) { wM += r.clicks_total; sM += r.clicks_total * r.price_click_mkt; }
  }
  return { your: wY > 0 ? +(sY / wY).toFixed(2) : null, mkt: wM > 0 ? +(sM / wM).toFixed(2) : null };
}
function trendOf(flags: Flag[]): 'up' | 'down' | 'flat' {
  if (flags.some((f) => f.key === 'TREND_UP')) return 'up';
  if (flags.some((f) => f.key === 'TREND_DOWN')) return 'down';
  return 'flat';
}

/** MRP-style keyword segment filter: contains (AND by default), OR for either, ! / - to exclude.
 *  e.g. "vitamin d3" → both · "vitamin OR d3" → either · "vitamin !gummy" → contains vitamin, not gummy. */
export function makeKeywordMatcher(filter: string): (query: string) => boolean {
  const f = filter.trim().toLowerCase();
  if (!f) return () => true;
  const tokens = f.split(/\s+/);
  const isOr = tokens.some((t) => t === 'or' || t === '|');
  const includes: string[] = [];
  const excludes: string[] = [];
  for (const t of tokens) {
    if (t === 'and' || t === '&' || t === 'or' || t === '|') continue;
    if ((t.startsWith('!') || t.startsWith('-')) && t.length > 1) excludes.push(t.slice(1));
    else includes.push(t);
  }
  return (query: string) => {
    const q = query.toLowerCase();
    if (excludes.some((e) => q.includes(e))) return false;
    if (includes.length === 0) return true;
    return isOr ? includes.some((t) => q.includes(t)) : includes.every((t) => q.includes(t));
  };
}

export interface QueryRow {
  query: string; branded: boolean; quadrant: Quadrant; volumeWk: number; purchases: number;
  impShare: number; clickShare: number; basketShare: number; purchShare: number;
  worstKey: TransitionKey | null; worstGapPp: number | null;
  oppConv: number; oppVis: number; oppTotal: number;
  priceYour: number | null; priceMkt: number | null; priceDeltaPct: number | null;
  topAsin: { asin: string; clicks: number } | null;
  spark: number[]; flags: Flag[]; trend: 'up' | 'down' | 'flat';
  actionLabel: string; actionRationale: string;
}

export interface PortfolioBanner {
  opportunityWkFull: number; concentration: number; underIndexed: number;
  dominant: Quadrant; dominantPct: number; oppByQuadrant: Record<Quadrant, number>;
}
export interface PortfolioView {
  rows: QueryRow[]; thresholds: { volSplit: number; shareSplit: number };
  oppTotal: number; banner: PortfolioBanner; nTracked: number;
}

/** `oppKey` picks which € the page ranks by. Search share works the VISIBILITY gap
 *  (too small a slice); the conversion gap is the Search funnel page's subject. */
export function portfolioView(rows: SqpRow[], oppKey: 'oppVis' | 'oppConv' | 'oppTotal' = 'oppVis'): PortfolioView {
  const { stats, thresholds } = queryStats(rows);
  const out: QueryRow[] = stats.map((s) => {
    const qr = rows.filter((r) => r.query === s.query);
    const leak = computeLeak(qr).mainLeak;
    const price = weightedClickPrice(qr);
    const play = playbook(leak?.key ?? null, s.flags, s.metrics.impShare);
    return {
      query: s.query, branded: s.branded, quadrant: s.quadrant, volumeWk: s.volumeWk, purchases: s.agg.asin.P,
      impShare: s.metrics.impShare, clickShare: s.metrics.clickShare, basketShare: s.metrics.basketShare, purchShare: s.metrics.purchShare,
      worstKey: leak?.key ?? null, worstGapPp: leak?.gapPp ?? null,
      oppConv: s.opportunity.conv, oppVis: s.opportunity.vis, oppTotal: s.opportunity.total,
      priceYour: price.your, priceMkt: price.mkt,
      priceDeltaPct: price.your != null && price.mkt ? +((price.your / price.mkt - 1) * 100).toFixed(0) : null,
      topAsin: s.topAsin, spark: s.weeklyClickShare.map((w) => w.value), flags: s.flags, trend: trendOf(s.flags),
      actionLabel: play.actions[0], actionRationale: play.rationale,
    };
  }).sort((a, b) => b[oppKey] - a[oppKey]);

  const oppTotal = out.reduce((s, r) => s + r[oppKey], 0);
  const totalPurch = out.reduce((s, r) => s + r.purchases, 0);
  const top5Purch = [...out].sort((a, b) => b.purchases - a.purchases).slice(0, 5).reduce((s, r) => s + r.purchases, 0);
  const oppByQuadrant: Record<Quadrant, number> = { invest: 0, defend: 0, harvest: 0, tail: 0 };
  for (const r of out) oppByQuadrant[r.quadrant] += r[oppKey];
  const dominant = (Object.entries(oppByQuadrant).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'invest') as Quadrant;

  return {
    rows: out, thresholds, oppTotal, nTracked: out.length,
    banner: {
      opportunityWkFull: oppTotal,
      concentration: totalPurch > 0 ? (top5Purch / totalPurch) * 100 : 0,
      underIndexed: out.filter((r) => r.flags.some((f) => f.key === 'UNDER_INVESTED')).length,
      dominant, dominantPct: oppTotal > 0 ? (oppByQuadrant[dominant] / oppTotal) * 100 : 0, oppByQuadrant,
    },
  };
}

// ─── Keyword drawer detail (§5.4) ─────────────────────────────────────────────
/** One of your ASINs on this query — funnel shares vs the market at this keyword level. */
export interface AsinSplit {
  asin: string; title: string;
  clicksPct: number; purchPct: number;          // share of YOUR clicks/purchases on this query
  purchWk: number;                              // purchases/wk on this query
  impShare: number; clickShare: number; basketShare: number; purchShare: number;
  worstKey: TransitionKey | null; worstGapPp: number | null; impactEurWk: number;
}
export interface KeywordDetail {
  asinSplit: AsinSplit[];
  priceByStage: { stage: string; your: number | null; mkt: number | null }[];
  fastShipPct: number;
  play: { actions: string[]; rationale: string };
  underInvested: boolean;
}

export function keywordDetail(rows: SqpRow[], row: QueryRow): KeywordDetail {
  const qr = rows.filter((r) => r.query === row.query);
  const totClicks = qr.reduce((s, r) => s + r.clicks_asin, 0) || 1;
  const totPurchYours = qr.reduce((s, r) => s + r.purch_asin, 0) || 1;
  const asinSplit: AsinSplit[] = [...new Set(qr.map((r) => r.asin))]
    .map((asin) => {
      const ar = qr.filter((r) => r.asin === asin);
      const agg = aggregate(ar);
      const m = stageMetrics(agg);
      const leak = computeLeak(ar).mainLeak;
      return {
        asin, title: ASIN_TITLE[asin] ?? asin,
        clicksPct: (agg.asin.C / totClicks) * 100, purchPct: (agg.asin.P / totPurchYours) * 100,
        purchWk: agg.asin.P / agg.nWeeks,
        impShare: m.impShare, clickShare: m.clickShare, basketShare: m.basketShare, purchShare: m.purchShare,
        worstKey: leak?.key ?? null, worstGapPp: leak?.gapPp ?? null, impactEurWk: leak?.impactEurWk ?? 0,
      };
    })
    .sort((a, b) => b.purchWk - a.purchWk || b.clicksPct - a.clicksPct);

  const wp = (yourF: (r: SqpRow) => number, yourP: (r: SqpRow) => number | null, mktF: (r: SqpRow) => number, mktP: (r: SqpRow) => number | null) => {
    let wY = 0, sY = 0, wM = 0, sM = 0;
    for (const r of qr) { const yp = yourP(r); if (yourF(r) > 0 && yp != null) { wY += yourF(r); sY += yourF(r) * yp; } const mp = mktP(r); if (mktF(r) > 0 && mp != null) { wM += mktF(r); sM += mktF(r) * mp; } }
    return { your: wY > 0 ? +(sY / wY).toFixed(2) : null, mkt: wM > 0 ? +(sM / wM).toFixed(2) : null };
  };

  const purchTot = qr.reduce((s, r) => s + r.purch_total, 0);
  const fast = qr.reduce((s, r) => s + r.ship_same_purch + r.ship_1d_purch, 0);

  return {
    asinSplit,
    priceByStage: [
      { stage: 'Click', ...wp((r) => r.clicks_asin, (r) => r.price_click_asin, (r) => r.clicks_total, (r) => r.price_click_mkt) },
      { stage: 'Basket', ...wp((r) => r.baskets_asin, (r) => r.price_basket_asin, (r) => r.baskets_total, (r) => r.price_basket_mkt) },
      { stage: 'Purchase', ...wp((r) => r.purch_asin, (r) => r.price_purch_asin, (r) => r.purch_total, (r) => r.price_purch_mkt) },
    ],
    fastShipPct: purchTot > 0 ? (fast / purchTot) * 100 : 0,
    play: playbook(row.worstKey, row.flags, row.impShare),
    underInvested: row.flags.some((f) => f.key === 'UNDER_INVESTED'),
  };
}
