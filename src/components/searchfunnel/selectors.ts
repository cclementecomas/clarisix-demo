// ─── Search Funnel (Traffic) selectors — ASIN pivot ─────────────────────────
// Thin adapters over lib/sqp/metrics so the components hold no formulas.

import type { SqpRow, LeakResult, TransitionKey, Flag } from '../../lib/sqp/types';
import { aggregate, stageMetrics, computeLeak, computeAsp, queryStats } from '../../lib/sqp/metrics';
import { playbookActions, type PlaybookAction, type SeverityLevel } from '../../lib/sqp/verdict';
import { MIN_IMP_FOR_CTR_GAP, MIN_CLICKS_FOR_ATC, MIN_BASKETS_FOR_CLOSE } from '../../lib/sqp/constants';
import { SQP_ASINS } from '../../lib/sqp/fixture';

export const ASIN_TITLE: Record<string, string> = Object.fromEntries(SQP_ASINS.map((a) => [a.asin, a.title]));
export function productImageUrl(asin: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(asin)}/80/80`;
}

const deltaPp = (you: number | null, mkt: number | null): number | null =>
  you != null && mkt != null ? +((you - mkt) * 100).toFixed(2) : null;

export interface StageShareWeek { week: string; impShare: number; clickShare: number; basketShare: number; purchShare: number; }
export function weeklyStageShares(rows: SqpRow[]): StageShareWeek[] {
  const byWeek = new Map<string, SqpRow[]>();
  for (const r of rows) (byWeek.get(r.week_ending) ?? byWeek.set(r.week_ending, []).get(r.week_ending)!).push(r);
  return [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([week, wr]) => {
    const m = stageMetrics(aggregate(wr));
    return { week, impShare: m.impShare, clickShare: m.clickShare, basketShare: m.basketShare, purchShare: m.purchShare };
  });
}

/** Main-leak gap now vs the prior period (for the banner trend chip). */
export function gapTrend(curr: SqpRow[], prior: SqpRow[]): { transition: TransitionKey | null; curGapPp: number | null; priorGapPp: number | null; widenedPp: number | null } {
  const leak = computeLeak(curr).mainLeak;
  if (!leak || leak.gapPp == null) return { transition: null, curGapPp: null, priorGapPp: null, widenedPp: null };
  const priorT = computeLeak(prior).transitions.find((t) => t.key === leak.key);
  const priorGap = priorT?.gapPp ?? null;
  const widened = priorGap == null ? null : +(Math.abs(leak.gapPp) - Math.abs(priorGap)).toFixed(2);
  return { transition: leak.key, curGapPp: leak.gapPp, priorGapPp: priorGap, widenedPp: widened };
}

export interface AsinLeakRow {
  asin: string; title: string;
  impressionsWk: number; impShare: number; purchasesWk: number;
  ctrDeltaPp: number | null; atcDeltaPp: number | null; closeDeltaPp: number | null;
  ctrFloorOk: boolean; atcFloorOk: boolean; closeFloorOk: boolean;
  leakKey: TransitionKey | null; leakLabel: string | null;
  missedEurWk: number; byStage: Record<TransitionKey, number>;
  clickSpark: number[]; topQuery: string;
}

export function asinLeakRows(rows: SqpRow[]): { rows: AsinLeakRow[]; brandMissedTotal: number } {
  const asins = [...new Set(rows.map((r) => r.asin))];
  const built = asins.map((asin) => {
    const ar = rows.filter((r) => r.asin === asin);
    const agg = aggregate(ar); const nW = agg.nWeeks; const m = stageMetrics(agg);
    const leakRes = computeLeak(ar);
    const leak = leakRes.mainLeak;
    const byStage: Record<TransitionKey, number> = { imp_click: 0, click_basket: 0, basket_purch: 0 };
    for (const t of leakRes.transitions) if (!t.belowFloor && t.impactEurWk > 0) byStage[t.key] = t.impactEurWk;
    const byQ = new Map<string, number>();
    for (const r of ar) byQ.set(r.query, (byQ.get(r.query) ?? 0) + r.clicks_asin);
    const topQuery = [...byQ.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return {
      asin, title: ASIN_TITLE[asin] ?? asin,
      impressionsWk: agg.asin.I / nW, impShare: m.impShare, purchasesWk: agg.asin.P / nW,
      ctrDeltaPp: deltaPp(m.ctr, m.ctrM), atcDeltaPp: deltaPp(m.atc, m.atcM), closeDeltaPp: deltaPp(m.close, m.closeM),
      ctrFloorOk: agg.asin.I / nW >= MIN_IMP_FOR_CTR_GAP,
      atcFloorOk: agg.asin.C / nW >= MIN_CLICKS_FOR_ATC,
      closeFloorOk: agg.asin.B / nW >= MIN_BASKETS_FOR_CLOSE,
      leakKey: leak?.key ?? null, leakLabel: leak?.label ?? null,
      missedEurWk: leak?.impactEurWk ?? 0, byStage,
      clickSpark: weeklyStageShares(ar).map((w) => w.clickShare), topQuery,
    } as AsinLeakRow;
  });
  const brandMissedTotal = built.reduce((s, r) => s + r.missedEurWk, 0);
  built.sort((a, b) => b.missedEurWk - a.missedEurWk);
  return { rows: built, brandMissedTotal };
}

export interface BrandView {
  leak: LeakResult;
  metrics: ReturnType<typeof stageMetrics>;
  agg: ReturnType<typeof aggregate>;
  asp: ReturnType<typeof computeAsp>;
  weekly: StageShareWeek[];
  priorWeekly: StageShareWeek[];
  trend: ReturnType<typeof gapTrend>;
  asins: AsinLeakRow[];
  brandMissedTotal: number;
}

// ─── ASIN drawer detail (§4.5) ───────────────────────────────────────────────
export interface AsinQueryRow {
  query: string; branded: boolean; volumeWk: number;
  impShare: number; clickShare: number; basketShare: number; purchShare: number;
  worstKey: TransitionKey | null; worstGapPp: number | null; impactEurWk: number; flags: Flag[];
}
export interface AsinTransition { key: TransitionKey; label: string; your: number | null; mkt: number | null; deltaPp: number | null; impactEurWk: number; belowFloor: boolean; spark: number[]; }
export interface AsinDetail {
  asin: string; title: string; asp: ReturnType<typeof computeAsp>;
  leakKey: TransitionKey | null; leakLabel: string | null;
  missedEurWk: number; severity: SeverityLevel;
  transitions: AsinTransition[];
  price: { your: number | null; mkt: number | null };
  fastShipPct: number;
  queries: AsinQueryRow[];
  actions: PlaybookAction[];
}

function weightedClickPrice(rows: SqpRow[]): { your: number | null; mkt: number | null } {
  let wY = 0, sY = 0, wM = 0, sM = 0;
  for (const r of rows) {
    if (r.clicks_asin > 0 && r.price_click_asin != null) { wY += r.clicks_asin; sY += r.clicks_asin * r.price_click_asin; }
    if (r.clicks_total > 0 && r.price_click_mkt != null) { wM += r.clicks_total; sM += r.clicks_total * r.price_click_mkt; }
  }
  return { your: wY > 0 ? +(sY / wY).toFixed(2) : null, mkt: wM > 0 ? +(sM / wM).toFixed(2) : null };
}

const TR_LABEL: Record<TransitionKey, string> = { imp_click: 'CTR', click_basket: 'Basket-add rate', basket_purch: 'Purchase rate' };
const TR_SHARE: Record<TransitionKey, keyof StageShareWeek> = { imp_click: 'clickShare', click_basket: 'basketShare', basket_purch: 'purchShare' };

export function asinDetail(rows: SqpRow[], asin: string): AsinDetail {
  const ar = rows.filter((r) => r.asin === asin);
  const agg = aggregate(ar); const nW = agg.nWeeks;
  const leakRes = computeLeak(ar);
  const leak = leakRes.mainLeak;
  const asp = computeAsp(ar);
  const weekly = weeklyStageShares(ar);
  const price = weightedClickPrice(ar);
  const purchTot = ar.reduce((s, r) => s + r.purch_total, 0);
  const fastShipPct = purchTot > 0 ? (ar.reduce((s, r) => s + r.ship_same_purch + r.ship_1d_purch, 0) / purchTot) * 100 : 0;

  const transitions: AsinTransition[] = (['imp_click', 'click_basket', 'basket_purch'] as TransitionKey[]).map((k) => {
    const t = leakRes.transitions.find((x) => x.key === k)!;
    return { key: k, label: TR_LABEL[k], your: t.yourRate, mkt: t.marketRate, deltaPp: t.yourRate != null && t.marketRate != null ? +((t.yourRate - t.marketRate) * 100).toFixed(2) : null, impactEurWk: !t.belowFloor && t.impactEurWk > 0 ? t.impactEurWk : 0, belowFloor: t.belowFloor, spark: weekly.map((w) => w[TR_SHARE[k]]) };
  });

  const flags: Flag[] = [];
  if (price.your != null && price.mkt != null && price.mkt > 0 && price.your / price.mkt > 1.10) flags.push({ key: 'PRICE_ABOVE_MKT', label: 'Price above market' });
  if (fastShipPct >= 60) flags.push({ key: 'FAST_SHIP_MKT', label: 'Market buys fast delivery' });

  const { stats } = queryStats(ar);
  const queries: AsinQueryRow[] = stats.map((s) => {
    const ql = computeLeak(ar.filter((r) => r.query === s.query)).mainLeak;
    return { query: s.query, branded: s.branded, volumeWk: s.volumeWk, impShare: s.metrics.impShare, clickShare: s.metrics.clickShare, basketShare: s.metrics.basketShare, purchShare: s.metrics.purchShare, worstKey: ql?.key ?? null, worstGapPp: ql?.gapPp ?? null, impactEurWk: ql?.impactEurWk ?? 0, flags: s.flags };
  }).sort((a, b) => b.impactEurWk - a.impactEurWk).slice(0, 6);

  const missedEurWk = leak && !leak.belowFloor && leak.impactEurWk > 0 ? leak.impactEurWk : 0;
  const weeklyRev = (agg.asin.P / nW) * asp.value;
  const ratio = weeklyRev > 0 ? missedEurWk / weeklyRev : 0;
  const severity: SeverityLevel = missedEurWk === 0 ? 'none' : ratio >= 0.10 ? 'critical' : ratio >= 0.03 ? 'warning' : 'watch';

  return {
    asin, title: ASIN_TITLE[asin] ?? asin, asp,
    leakKey: leak?.key ?? null, leakLabel: leak?.label ?? null, missedEurWk, severity,
    transitions, price, fastShipPct, queries,
    actions: playbookActions({ leakStage: leak?.key ?? null, flags, yourRate: leak?.yourRate ?? null, marketRate: leak?.marketRate ?? null, priceYour: price.your, priceMkt: price.mkt, fastShipPct }),
  };
}

export function brandView(curr: SqpRow[], prior: SqpRow[]): BrandView {
  const agg = aggregate(curr);
  const { rows: asins, brandMissedTotal } = asinLeakRows(curr);
  return {
    leak: computeLeak(curr), metrics: stageMetrics(agg), agg, asp: computeAsp(curr),
    weekly: weeklyStageShares(curr), priorWeekly: weeklyStageShares(prior),
    trend: gapTrend(curr, prior), asins, brandMissedTotal,
  };
}
