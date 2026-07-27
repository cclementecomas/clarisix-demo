// ─── Verdict engine, addressable €, parity bridge, evidence playbook (v2) ────
// Synthesises a single primary diagnosis from a cross-sectional conversion leak
// AND the temporal share trajectory, so the banner never contradicts the trend.

import type { SqpRow, TransitionKey, Flag } from './types';
import { aggregate, stageMetrics, computeLeak, computeAsp, isCallableLeak } from './metrics';

export const TRANSITIONS: TransitionKey[] = ['imp_click', 'click_basket', 'basket_purch'];
export const TRANSITION_TO_STAGE: Record<TransitionKey, 'clicks' | 'baskets' | 'purchases'> = {
  imp_click: 'clicks', click_basket: 'baskets', basket_purch: 'purchases',
};

const hasFlag = (flags: Flag[], k: string) => flags.some((f) => f.key === k);

// ─── Addressable € — per-ASIN sum, over-performers do NOT net off (§1/§2) ────
export function addressableByStage(rows: SqpRow[]): Record<TransitionKey, number> {
  const out: Record<TransitionKey, number> = { imp_click: 0, click_basket: 0, basket_purch: 0 };
  for (const asin of new Set(rows.map((r) => r.asin))) {
    const leak = computeLeak(rows.filter((r) => r.asin === asin));
    for (const t of leak.transitions) if (isCallableLeak(t)) out[t.key] += t.impactEurWk;
  }
  return out;
}

// ─── Share trajectory (temporal) ─────────────────────────────────────────────
export type Pattern = 'parallel_decline' | 'divergent_decline' | 'improving' | 'stable';
export interface ShareTrajectory {
  deltas: { impressions: number; clicks: number; baskets: number; purchases: number }; // pp as fractions
  purchDeltaPp: number;
  firstFallingStage: 'impressions' | 'clicks' | 'baskets' | 'purchases' | null;
  firstShare: number; lastShare: number;      // purchase share, first vs last week
  shareLossEurWk: number;
  pattern: Pattern;
}

export function shareTrajectory(window: SqpRow[], prior: SqpRow[]): ShareTrajectory {
  const w = stageMetrics(aggregate(window));
  const p = stageMetrics(aggregate(prior));
  const deltas = {
    impressions: w.impShare - p.impShare, clicks: w.clickShare - p.clickShare,
    baskets: w.basketShare - p.basketShare, purchases: w.purchShare - p.purchShare,
  };
  const agg = aggregate(window);
  const asp = computeAsp(window).value;
  const mktPurchWk = agg.market.Pm / agg.nWeeks;
  const shareLossEurWk = Math.max(0, -deltas.purchases) * mktPurchWk * asp;

  const arr = [deltas.impressions, deltas.clicks, deltas.baskets, deltas.purchases];
  const allDown = arr.every((d) => d <= -0.003);
  const spread = Math.max(...arr) - Math.min(...arr);
  let pattern: Pattern;
  if (allDown && spread <= 0.02) pattern = 'parallel_decline';          // all fell together → visibility problem
  else if (deltas.purchases >= 0.003) pattern = 'improving';
  else if (deltas.purchases <= -0.003) pattern = 'divergent_decline';   // a real decline, concentrated down-funnel
  else pattern = 'stable';

  const order: (keyof typeof deltas)[] = ['impressions', 'clicks', 'baskets', 'purchases'];
  const firstFalling = order.find((k) => deltas[k] <= -0.003) ?? null;

  // purchase share first vs last week of the window
  const byWeek = [...new Set(window.map((r) => r.week_ending))].sort();
  const shareAt = (wk: string) => stageMetrics(aggregate(window.filter((r) => r.week_ending === wk))).purchShare;
  return {
    deltas, purchDeltaPp: deltas.purchases, firstFallingStage: firstFalling,
    firstShare: byWeek.length ? shareAt(byWeek[0]) : w.purchShare,
    lastShare: byWeek.length ? shareAt(byWeek[byWeek.length - 1]) : w.purchShare,
    shareLossEurWk, pattern,
  };
}

// ─── Verdict ──────────────────────────────────────────────────────────────────
export type SeverityLevel = 'critical' | 'warning' | 'watch' | 'none';
export interface Verdict {
  primary: 'conversion' | 'share' | 'healthy';
  headlineEurWk: number;
  severity: { ratio: number; level: SeverityLevel };
  weeklySqpRevenue: number;
  asp: number;
  rates: { ctr: number | null; ctrM: number | null; atc: number | null; atcM: number | null; close: number | null; closeM: number | null };
  conv: { stage: TransitionKey | null; eurWk: number; addressableTotal: number; byStage: Record<TransitionKey, number>; nAsins: number; yourRate: number | null; marketRate: number | null; gapPp: number | null; netEurWk: number };
  share: ShareTrajectory;
}

export function computeVerdict(window: SqpRow[], prior: SqpRow[]): Verdict {
  const byStage = addressableByStage(window);
  const stage = (TRANSITIONS.reduce((a, b) => (byStage[b] > byStage[a] ? b : a))) as TransitionKey;
  const convEur = byStage[stage];
  const addressableTotal = TRANSITIONS.reduce((s, t) => s + byStage[t], 0);

  const brand = computeLeak(window);
  const brandT = brand.transitions.find((t) => t.key === stage);
  const netEurWk = brandT && isCallableLeak(brandT) ? brandT.impactEurWk : 0;
  let convAsins = 0;
  for (const asin of new Set(window.map((r) => r.asin))) {
    const lk = computeLeak(window.filter((r) => r.asin === asin)).transitions.find((t) => t.key === stage);
    if (lk && isCallableLeak(lk)) convAsins++;
  }

  const share = shareTrajectory(window, prior);

  const agg = aggregate(window);
  const m = stageMetrics(agg);
  const asp = computeAsp(window).value;
  const weeklySqpRevenue = (agg.asin.P / agg.nWeeks) * asp;

  const healthy = addressableTotal === 0 && share.purchDeltaPp >= -0.003;
  const primary: Verdict['primary'] = healthy ? 'healthy' : share.shareLossEurWk > convEur ? 'share' : 'conversion';
  const headlineEurWk = primary === 'share' ? share.shareLossEurWk : primary === 'conversion' ? convEur : 0;
  const ratio = weeklySqpRevenue > 0 ? headlineEurWk / weeklySqpRevenue : 0;
  const level: SeverityLevel = healthy ? 'none' : ratio >= 0.10 ? 'critical' : ratio >= 0.03 ? 'warning' : 'watch';

  return {
    primary, headlineEurWk, severity: { ratio, level }, weeklySqpRevenue, asp,
    rates: { ctr: m.ctr, ctrM: m.ctrM, atc: m.atc, atcM: m.atcM, close: m.close, closeM: m.closeM },
    conv: {
      stage: convEur > 0 ? stage : null, eurWk: convEur, addressableTotal, byStage, nAsins: convAsins,
      yourRate: brandT?.yourRate ?? null, marketRate: brandT?.marketRate ?? null, gapPp: brandT?.gapPp ?? null, netEurWk,
    },
    share,
  };
}

// ─── Parity bridge — exact step waterfall (§3) ───────────────────────────────
export interface BridgeStep {
  key: TransitionKey; label: string; deltaShare: number;   // fraction; Σ = purchShare − impShare exactly
  yourRate: number | null; marketRate: number | null; addressableEurWk: number;
  fromCount: number; toCount: number; marketFrom: number; marketTo: number;
}
export interface ParityBridge {
  impShare: number; purchShare: number; steps: BridgeStep[]; biggestLeakKey: TransitionKey | null;
  counts: { stage: 'impressions' | 'clicks' | 'baskets' | 'purchases'; you: number; market: number }[]; // per wk
}

export function parityBridge(rows: SqpRow[], leakStageOverride?: TransitionKey | null): ParityBridge {
  const agg = aggregate(rows); const nW = agg.nWeeks;
  const m = stageMetrics(agg);
  const addr = addressableByStage(rows);
  const shares = { imp: m.impShare, clk: m.clickShare, bsk: m.basketShare, pur: m.purchShare };
  const steps: BridgeStep[] = [
    { key: 'imp_click', label: 'CTR effect', deltaShare: shares.clk - shares.imp, yourRate: m.ctr, marketRate: m.ctrM, addressableEurWk: addr.imp_click, fromCount: agg.asin.I, toCount: agg.asin.C, marketFrom: agg.market.Im, marketTo: agg.market.Cm },
    { key: 'click_basket', label: 'Basket-add effect', deltaShare: shares.bsk - shares.clk, yourRate: m.atc, marketRate: m.atcM, addressableEurWk: addr.click_basket, fromCount: agg.asin.C, toCount: agg.asin.B, marketFrom: agg.market.Cm, marketTo: agg.market.Bm },
    { key: 'basket_purch', label: 'Purchase effect', deltaShare: shares.pur - shares.bsk, yourRate: m.close, marketRate: m.closeM, addressableEurWk: addr.basket_purch, fromCount: agg.asin.B, toCount: agg.asin.P, marketFrom: agg.market.Bm, marketTo: agg.market.Pm },
  ];
  const worst = steps.reduce((a, b) => (b.deltaShare < a.deltaShare ? b : a));
  const biggestLeakKey = leakStageOverride !== undefined ? leakStageOverride : worst.deltaShare < 0 ? worst.key : null;
  return {
    impShare: shares.imp, purchShare: shares.pur, steps, biggestLeakKey,
    counts: [
      { stage: 'impressions', you: agg.asin.I / nW, market: agg.market.Im / nW },
      { stage: 'clicks', you: agg.asin.C / nW, market: agg.market.Cm / nW },
      { stage: 'baskets', you: agg.asin.B / nW, market: agg.market.Bm / nW },
      { stage: 'purchases', you: agg.asin.P / nW, market: agg.market.Pm / nW },
    ],
  };
}

// ─── Evidence-linked playbook (§5.2) — leak-stage-first, every action has a datum ─
export interface PlaybookAction { text: string; evidence: string; }
export interface PlaybookInput {
  leakStage: TransitionKey | null; flags: Flag[];
  yourRate: number | null; marketRate: number | null;
  priceYour: number | null; priceMkt: number | null; fastShipPct: number;
}

export function playbookActions(input: PlaybookInput): PlaybookAction[] {
  const { leakStage, flags, yourRate, marketRate, priceYour, priceMkt, fastShipPct } = input;
  const rate = (x: number | null) => (x == null ? '—' : `${(x * 100).toFixed(1)}%`);
  const acts: PlaybookAction[] = [];

  if (hasFlag(flags, 'PRICE_ABOVE_MKT') && priceYour != null && priceMkt != null && priceMkt > 0)
    acts.push({ text: 'Price / coupon test', evidence: `median click price €${priceYour.toFixed(2)} vs market €${priceMkt.toFixed(2)} (+${Math.round((priceYour / priceMkt - 1) * 100)}%)` });
  if (leakStage === 'basket_purch' && hasFlag(flags, 'FAST_SHIP_MKT'))
    acts.push({ text: 'Improve delivery speed', evidence: `${Math.round(fastShipPct)}% of market purchases ship in ≤1 day` });

  const base: Record<TransitionKey, PlaybookAction> = {
    imp_click: { text: 'Strengthen main image & title relevance', evidence: `CTR ${rate(yourRate)} vs market ${rate(marketRate)}` },
    click_basket: { text: 'Fix the product page — price display, images, bullet promises', evidence: `basket-add rate ${rate(yourRate)} vs market ${rate(marketRate)}` },
    basket_purch: { text: 'Reduce checkout friction — stock, delivery, price/coupon', evidence: `purchase rate ${rate(yourRate)} vs market ${rate(marketRate)}` },
  };
  if (leakStage) acts.push(base[leakStage]);
  else acts.push({ text: 'Hold — funnel at or above market', evidence: 'no stage below market above the noise floor' });

  return acts.slice(0, 3);
}
