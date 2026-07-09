// ─── Canonical SQP metrics (§2) — single source of truth for both pages ──────
// Every displayed number on Traffic/SQP is computed here from sqp_weekly rows.

import type {
  SqpRow, Scope, StageAgg, StageMetrics, Transition, LeakResult, Quadrant, Flag,
} from './types';
import {
  settings, isBranded,
  MIN_IMP_FOR_CTR_GAP, MIN_CLICKS_FOR_ATC, MIN_BASKETS_FOR_CLOSE,
  DOWNSTREAM_EFF_CLAMP, TRANSITION_LABEL, FLAG_LABEL,
  ORGANIC_HEAVY_MIN_IMP_SHARE, ORGANIC_HEAVY_CLICK_TO_IMP, UNDER_INVESTED_IMP_SHARE_MAX,
  PRICE_ABOVE_MKT, PRICE_BELOW_MKT, TREND_REL_PCT, TREND_ABS_PP, TREND_WINDOW_WEEKS,
  FAST_SHIP_MKT_MIN, NEW_QUERY_WEEKS, VOLUME_SPLIT_PCTL,
} from './constants';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const safe = (num: number, den: number): number | null => (den > 0 ? num / den : null);

// ─── Weeks (§3.1) ─────────────────────────────────────────────────────────────
export function listWeeks(rows: SqpRow[]): string[] {
  return [...new Set(rows.map((r) => r.week_ending))].sort();
}
export function maxWeek(rows: SqpRow[]): string {
  const w = listWeeks(rows);
  return w.length ? w[w.length - 1] : '';
}
/** Is the latest week fully reported across all ASINs? (§3.1 / §6.5) */
export function latestWeekStatus(rows: SqpRow[]): { throughWeek: string; expected: number; reported: number; complete: boolean; lastCompleteWeek: string } {
  const weeks = listWeeks(rows);
  const throughWeek = weeks.length ? weeks[weeks.length - 1] : '';
  const expected = new Set(rows.map((r) => r.asin)).size;
  const reported = new Set(rows.filter((r) => r.week_ending === throughWeek).map((r) => r.asin)).size;
  let lastCompleteWeek = throughWeek;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (new Set(rows.filter((r) => r.week_ending === weeks[i]).map((r) => r.asin)).size >= expected) { lastCompleteWeek = weeks[i]; break; }
  }
  return { throughWeek, expected, reported, complete: reported >= expected, lastCompleteWeek };
}

/** Resolve a range ending at `endWeek` spanning `n` weeks, + the prior n weeks. */
export function resolveRange(rows: SqpRow[], endWeek: string, n: number): { weeks: string[]; priorWeeks: string[] } {
  const all = listWeeks(rows);
  const end = all.indexOf(endWeek);
  const e = end < 0 ? all.length - 1 : end;
  const weeks = all.slice(Math.max(0, e - n + 1), e + 1);
  const priorWeeks = all.slice(Math.max(0, e - 2 * n + 1), e - n + 1);
  return { weeks, priorWeeks };
}

// ─── Scope filter (§2.1) ──────────────────────────────────────────────────────
export function filterScope(rows: SqpRow[], scope: Scope = {}): SqpRow[] {
  const { asins, queries, weeks, branded = 'all' } = scope;
  return rows.filter((r) =>
    (!asins || asins.includes(r.asin)) &&
    (!queries || queries.includes(r.query)) &&
    (!weeks || weeks.includes(r.week_ending)) &&
    (branded === 'all' || (branded === 'branded' ? r.branded : !r.branded)),
  );
}

// ─── Aggregation (§2.1) — market deduped by (query, week); asin summed ───────
export function aggregate(rows: SqpRow[]): StageAgg {
  const seen = new Set<string>();
  const asin = { I: 0, C: 0, B: 0, P: 0 };
  const market = { Im: 0, Cm: 0, Bm: 0, Pm: 0, vol: 0 };
  for (const r of rows) {
    asin.I += r.imp_asin; asin.C += r.clicks_asin; asin.B += r.baskets_asin; asin.P += r.purch_asin;
    const key = r.query + '|' + r.week_ending;
    if (!seen.has(key)) {                       // market counted ONCE per (query, week)
      seen.add(key);
      market.Im += r.imp_total; market.Cm += r.clicks_total; market.Bm += r.baskets_total;
      market.Pm += r.purch_total; market.vol += r.sq_volume;
    }
  }
  return { nWeeks: new Set(rows.map((r) => r.week_ending)).size || 1, asin, market };
}

// ─── Stage metrics + identity (§2.2) ─────────────────────────────────────────
export function stageMetrics(a: StageAgg): StageMetrics {
  const { I, C, B, P } = a.asin;
  const { Im, Cm, Bm, Pm } = a.market;
  return {
    impShare: safe(I, Im) ?? 0, clickShare: safe(C, Cm) ?? 0,
    basketShare: safe(B, Bm) ?? 0, purchShare: safe(P, Pm) ?? 0,
    ctr: safe(C, I), atc: safe(B, C), close: safe(P, B), cvr: safe(P, C),
    ctrM: safe(Cm, Im), atcM: safe(Bm, Cm), closeM: safe(Pm, Bm), cvrM: safe(Pm, Cm),
  };
}

// ─── ASP (§2.2) ───────────────────────────────────────────────────────────────
export function computeAsp(rows: SqpRow[]): { value: number; source: 'purchases' | 'clicks' | 'default' } {
  let wP = 0, sP = 0, wC = 0, sC = 0;
  for (const r of rows) {
    if (r.purch_asin > 0 && r.price_purch_asin != null) { wP += r.purch_asin; sP += r.purch_asin * r.price_purch_asin; }
    if (r.clicks_asin > 0 && r.price_click_asin != null) { wC += r.clicks_asin; sC += r.clicks_asin * r.price_click_asin; }
  }
  if (wP > 0) return { value: +(sP / wP).toFixed(2), source: 'purchases' };
  if (wC > 0) return { value: +(sC / wC).toFixed(2), source: 'clicks' };
  return { value: settings.default_asp, source: 'default' };
}

// ─── Leak model (§2.3) ────────────────────────────────────────────────────────
export function computeLeak(rows: SqpRow[], aspOverride?: { value: number; source: 'purchases' | 'clicks' | 'default' }): LeakResult {
  const a = aggregate(rows);
  const nW = a.nWeeks;
  const m = stageMetrics(a);
  const asp = aspOverride ?? computeAsp(rows);
  const { I, C, B } = a.asin;

  const defs = [
    { key: 'imp_click' as const, up: I, your: m.ctr, mkt: m.ctrM, downstream: (m.atcM ?? 0) * (m.closeM ?? 0), floorOk: I / nW >= MIN_IMP_FOR_CTR_GAP },
    { key: 'click_basket' as const, up: C, your: m.atc, mkt: m.atcM, downstream: m.closeM ?? 0, floorOk: C / nW >= MIN_CLICKS_FOR_ATC },
    { key: 'basket_purch' as const, up: B, your: m.close, mkt: m.closeM, downstream: 1, floorOk: B / nW >= MIN_BASKETS_FOR_CLOSE },
  ];

  const transitions: Transition[] = defs.map((d) => {
    const your = d.your ?? 0, mkt = d.mkt ?? 0;
    const missedNext = d.up * Math.max(0, mkt - your);
    const missedPurchases = missedNext * d.downstream;
    return {
      key: d.key, label: TRANSITION_LABEL[d.key],
      yourRate: d.your, marketRate: d.mkt,
      gapPp: d.your == null || d.mkt == null ? null : +((your - mkt) * 100).toFixed(2),
      missedPurchases, impactEurWk: (missedPurchases * asp.value) / nW,
      belowFloor: !d.floorOk,
    };
  });

  const eligible = transitions.filter((t) => !t.belowFloor && t.impactEurWk > 0);
  const mainLeak = eligible.length ? eligible.reduce((x, y) => (y.impactEurWk > x.impactEurWk ? y : x)) : null;
  return { transitions, mainLeak, asp };
}

export function recoveredEur(t: Transition, closure = settings.closure): number {
  return t.impactEurWk * closure;
}

// ─── Per-query rollup (SQP page) ─────────────────────────────────────────────
export interface QueryStat {
  query: string; branded: boolean;
  volumeWk: number;               // avg sq_volume / wk
  agg: StageAgg; metrics: StageMetrics;
  asp: number;
  opportunity: { conv: number; vis: number; total: number };
  flags: Flag[];
  quadrant: Quadrant;
  topAsin: { asin: string; clicks: number } | null;
  weeklyClickShare: { week: string; value: number }[];
}

/** Full per-query table for a scope (already filtered). Two-pass: thresholds
 *  from the visible set, then per-query opportunity/quadrant/flags. */
export function queryStats(rows: SqpRow[]): { stats: QueryStat[]; thresholds: { volSplit: number; shareSplit: number } } {
  const byQuery = new Map<string, SqpRow[]>();
  for (const r of rows) (byQuery.get(r.query) ?? byQuery.set(r.query, []).get(r.query)!).push(r);

  // thresholds over the visible set (§2.5)
  const volsWk: number[] = [];
  let sumC = 0, sumCm = 0;
  for (const [, qr] of byQuery) {
    const a = aggregate(qr);
    volsWk.push(a.market.vol / a.nWeeks);
    sumC += a.asin.C; sumCm += a.market.Cm;
  }
  const volSplit = percentile(volsWk, VOLUME_SPLIT_PCTL);
  const shareSplit = sumCm > 0 ? sumC / sumCm : 0;
  const maxWk = maxWeek(rows);

  const stats: QueryStat[] = [];
  for (const [query, qr] of byQuery) {
    const a = aggregate(qr);
    const m = stageMetrics(a);
    const aspV = computeAsp(qr).value;
    const opp = queryOpportunity(qr, shareSplit, aspV);
    const volumeWk = a.market.vol / a.nWeeks;
    stats.push({
      query, branded: isBranded(query),
      volumeWk, agg: a, metrics: m, asp: aspV,
      opportunity: opp,
      flags: computeFlags(qr, { volSplit, maxWeek: maxWk }),
      quadrant: quadrantOf(volumeWk, m.clickShare, { volSplit, shareSplit }),
      topAsin: topAsinByClicks(qr),
      weeklyClickShare: weeklySeries(qr, 'click'),
    });
  }
  stats.sort((x, y) => y.opportunity.total - x.opportunity.total);
  return { stats, thresholds: { volSplit, shareSplit } };
}

// ─── Opportunity (§2.4) ───────────────────────────────────────────────────────
export function queryOpportunity(queryRows: SqpRow[], targetClickShare: number, aspV: number): { conv: number; vis: number; total: number } {
  const a = aggregate(queryRows);
  const nW = a.nWeeks;
  const m = stageMetrics(a);
  const leak = computeLeak(queryRows, { value: aspV, source: 'default' });
  const conv = leak.mainLeak ? leak.mainLeak.impactEurWk : 0;
  const eff = m.cvr != null && m.cvrM != null && m.cvrM > 0 ? clamp(m.cvr / m.cvrM, DOWNSTREAM_EFF_CLAMP.min, DOWNSTREAM_EFF_CLAMP.max) : 1.0;
  const vis = (Math.max(0, targetClickShare - m.clickShare) * a.market.Pm * eff * aspV) / nW;
  return { conv, vis, total: conv + vis };
}

// ─── Quadrants (§2.5) ─────────────────────────────────────────────────────────
export function quadrantOf(volume: number, clickShare: number, t: { volSplit: number; shareSplit: number }): Quadrant {
  const hiVol = volume >= t.volSplit;
  const hiShare = clickShare >= t.shareSplit;
  if (hiVol && hiShare) return 'defend';
  if (hiVol && !hiShare) return 'invest';
  if (!hiVol && hiShare) return 'harvest';
  return 'tail';
}

// ─── Flags (§2.7) ─────────────────────────────────────────────────────────────
export function computeFlags(queryRows: SqpRow[], ctx: { volSplit: number; maxWeek: string }): Flag[] {
  const a = aggregate(queryRows);
  const m = stageMetrics(a);
  const out: Flag[] = [];
  const nW = a.nWeeks;
  const volWk = a.market.vol / nW;

  const lowData = a.asin.I / nW < MIN_IMP_FOR_CTR_GAP && a.asin.C / nW < MIN_CLICKS_FOR_ATC;
  if (lowData) out.push({ key: 'LOW_DATA', label: FLAG_LABEL.LOW_DATA });

  if (m.impShare >= ORGANIC_HEAVY_MIN_IMP_SHARE && m.clickShare >= ORGANIC_HEAVY_CLICK_TO_IMP * m.impShare)
    out.push({ key: 'ORGANIC_HEAVY', label: FLAG_LABEL.ORGANIC_HEAVY });
  if (volWk >= ctx.volSplit && m.impShare < UNDER_INVESTED_IMP_SHARE_MAX)
    out.push({ key: 'UNDER_INVESTED', label: FLAG_LABEL.UNDER_INVESTED });

  const price = weightedPrice(queryRows);
  if (price.your != null && price.mkt != null && price.mkt > 0) {
    const ratio = price.your / price.mkt;
    if (ratio > PRICE_ABOVE_MKT) out.push({ key: 'PRICE_ABOVE_MKT', label: `Price +${Math.round((ratio - 1) * 100)}% vs market` });
    else if (ratio < PRICE_BELOW_MKT) out.push({ key: 'PRICE_BELOW_MKT', label: `Price −${Math.round((1 - ratio) * 100)}% vs market` });
  }

  const series = weeklySeries(queryRows, 'click');
  const tr = trendFlag(series.map((s) => s.value));
  if (tr === 'up') out.push({ key: 'TREND_UP', label: FLAG_LABEL.TREND_UP });
  if (tr === 'down') out.push({ key: 'TREND_DOWN', label: FLAG_LABEL.TREND_DOWN });

  const firstWeek = series[0]?.week;
  if (firstWeek && weeksBetween(firstWeek, ctx.maxWeek) < NEW_QUERY_WEEKS) out.push({ key: 'NEW_QUERY', label: FLAG_LABEL.NEW_QUERY });

  const purchTot = queryRows.reduce((s, r) => s + r.purch_total, 0);
  const fast = queryRows.reduce((s, r) => s + r.ship_same_purch + r.ship_1d_purch, 0);
  if (purchTot > 0 && fast / purchTot >= FAST_SHIP_MKT_MIN) out.push({ key: 'FAST_SHIP_MKT', label: FLAG_LABEL.FAST_SHIP_MKT });

  return out;
}

// ─── Playbook (§2.8) ──────────────────────────────────────────────────────────
export interface PlaybookItem { actions: string[]; rationale: string; }
export function playbook(leakKey: string | null, flags: Flag[], impShare: number): PlaybookItem {
  const flagKeys = new Set(flags.map((f) => f.key));
  if (flagKeys.has('ORGANIC_HEAVY'))
    return { actions: ['Reduce PPC ~20%/wk', 'Watch click share weekly', 'Stop at your floor'], rationale: 'Organic already wins these clicks — requires Ads to execute; advisory until Ads connects.' };
  if (flagKeys.has('UNDER_INVESTED') || impShare < UNDER_INVESTED_IMP_SHARE_MAX)
    return { actions: ['Verify relevancy on Amazon', 'Add keyword to listing (title, bullets, A+, backend, alt text)', 'Exact-match SP, top-of-search'], rationale: 'Relevant, high-volume, barely visible — capture visibility.' };
  if (leakKey === 'imp_click')
    return { actions: ['Main image test', 'Title relevance for top queries', 'Price vs market', 'Reviews / rating gap'], rationale: 'Seen but not clicked — win the search-results page.' };
  if (leakKey === 'click_basket')
    return { actions: ['Above-the-fold: price, variations, bullet promises', 'Coupon / badge test'], rationale: 'Clicked but not added — the product page loses them.' };
  if (leakKey === 'basket_purch')
    return { actions: ['Delivery speed', 'Stock / buyability', 'Checkout price & shipping cost', 'Coupon'], rationale: 'Added but not bought — checkout friction.' };
  return { actions: ['Hold — defend rank and bids'], rationale: 'No single-stage leak above the noise floor.' };
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
}
function weightedPrice(rows: SqpRow[]): { your: number | null; mkt: number | null } {
  let wY = 0, sY = 0, wM = 0, sM = 0;
  for (const r of rows) {
    if (r.clicks_asin > 0 && r.price_click_asin != null) { wY += r.clicks_asin; sY += r.clicks_asin * r.price_click_asin; }
    if (r.clicks_total > 0 && r.price_click_mkt != null) { wM += r.clicks_total; sM += r.clicks_total * r.price_click_mkt; }
  }
  return { your: wY > 0 ? sY / wY : null, mkt: wM > 0 ? sM / wM : null };
}
function weeklySeries(rows: SqpRow[], stage: 'click'): { week: string; value: number }[] {
  const byWeek = new Map<string, SqpRow[]>();
  for (const r of rows) (byWeek.get(r.week_ending) ?? byWeek.set(r.week_ending, []).get(r.week_ending)!).push(r);
  return [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([week, wr]) => {
    const a = aggregate(wr); const m = stageMetrics(a);
    return { week, value: stage === 'click' ? m.clickShare : m.impShare };
  });
}
function topAsinByClicks(rows: SqpRow[]): { asin: string; clicks: number } | null {
  const byAsin = new Map<string, number>();
  for (const r of rows) byAsin.set(r.asin, (byAsin.get(r.asin) ?? 0) + r.clicks_asin);
  const top = [...byAsin.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? { asin: top[0], clicks: top[1] } : null;
}
export function trendFlag(values: number[]): 'up' | 'down' | null {
  const w = values.slice(-TREND_WINDOW_WEEKS);
  if (w.length < TREND_WINDOW_WEEKS) return null;
  const n = w.length;
  const xMean = (n - 1) / 2;
  const yMean = w.reduce((s, v) => s + v, 0) / n;
  let cov = 0, varx = 0;
  w.forEach((v, i) => { cov += (i - xMean) * (v - yMean); varx += (i - xMean) ** 2; });
  const slope = varx ? cov / varx : 0;
  const change = slope * (n - 1);
  if (yMean <= 0) return null;
  if (Math.abs(change) < TREND_ABS_PP || Math.abs(change) / yMean < TREND_REL_PCT) return null;
  return change > 0 ? 'up' : 'down';
}
function weeksBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (7 * 86400000));
}
