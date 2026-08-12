// ─── SQP metrics tests (§6) — run: npm run test:sqp ─────────────────────────
import type { SqpRow } from './types';
import { sqpRich as sqpWeekly } from './fixture'; // tests validate the methodology against the rich fixture; the app ships the clean demo data
import { aggregate, stageMetrics, computeLeak, isCallableLeak, queryStats, filterScope, computeAsp, maxWeek, resolveRange, latestWeekStatus } from './metrics';

let pass = 0, fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name} ${extra}`); }
}
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

// helper: minimal row
function row(over: Partial<SqpRow>): SqpRow {
  return {
    asin: 'A', week_ending: '2026-06-27', query: 'q', query_score: 1, sq_volume: 1000,
    marketplace: 'DE', currency: 'EUR', branded: false,
    imp_total: 0, imp_asin: 0, imp_share: 0, clicks_total: 0, clicks_asin: 0, clicks_share: 0,
    mkt_click_rate_per_search: 0, price_click_mkt: null, price_click_asin: null,
    ship_same_click: 0, ship_1d_click: 0, ship_2d_click: 0,
    baskets_total: 0, baskets_asin: 0, baskets_share: 0, mkt_basket_rate_per_search: 0,
    price_basket_mkt: null, price_basket_asin: null, ship_same_basket: 0, ship_1d_basket: 0, ship_2d_basket: 0,
    purch_total: 0, purch_asin: 0, purch_share: 0, mkt_purchase_rate_per_search: 0,
    price_purch_mkt: null, price_purch_asin: null, ship_same_purch: 0, ship_1d_purch: 0, ship_2d_purch: 0,
    ...over,
  };
}

console.log('§6.3 — brand aggregation dedupes market columns by (query, week)');
{
  const rows = [
    row({ asin: 'A', imp_total: 1000, imp_asin: 30, clicks_total: 40, clicks_asin: 6 }),
    row({ asin: 'B', imp_total: 1000, imp_asin: 20, clicks_total: 40, clicks_asin: 4 }),
  ];
  const a = aggregate(rows);
  ok('market imp_total counted ONCE (1000, not 2000)', a.market.Im === 1000, `got ${a.market.Im}`);
  ok('asin impressions summed (50)', a.asin.I === 50, `got ${a.asin.I}`);
  ok('market clicks counted once (40)', a.market.Cm === 40, `got ${a.market.Cm}`);
  ok('brand click share = 10/40 = 0.25', near(stageMetrics(a).clickShare, 0.25), `got ${stageMetrics(a).clickShare}`);
}

console.log('§6.4 — share-waterfall identity: click_share/imp_share === ctr/ctr_m (each transition)');
{
  const a = aggregate(sqpWeekly);
  const m = stageMetrics(a);
  ok('click/imp share == ctr/ctrM', near(m.clickShare / m.impShare, (m.ctr ?? 0) / (m.ctrM ?? 1)), `${m.clickShare / m.impShare} vs ${(m.ctr ?? 0) / (m.ctrM ?? 1)}`);
  ok('basket/click share == atc/atcM', near(m.basketShare / m.clickShare, (m.atc ?? 0) / (m.atcM ?? 1)));
  ok('purch/basket share == close/closeM', near(m.purchShare / m.basketShare, (m.close ?? 0) / (m.closeM ?? 1)));
}

console.log('§2.6 — noise floors: sub-floor transition is flagged and never wins main-leak');
{
  const rows = [row({ imp_total: 100000, imp_asin: 100, clicks_total: 4000, clicks_asin: 5, baskets_total: 1200, baskets_asin: 1, purch_total: 500, purch_asin: 0 })];
  const leak = computeLeak(rows, { value: 20, source: 'default' });
  const clickBasket = leak.transitions.find((t) => t.key === 'click_basket')!;
  ok('click→basket below floor (5 clicks < 20)', clickBasket.belowFloor);
  ok('main leak is not the sub-floor transition', leak.mainLeak?.key !== 'click_basket' || leak.mainLeak == null);
}

console.log('§2.6b — CI gate: a gap on thin data (n=22, like DE b.box) is shown but not called a leak');
{
  const rows = [row({ imp_total: 49941, imp_asin: 284, clicks_total: 1000, clicks_asin: 22, baskets_total: 122, baskets_asin: 2, purch_total: 40, purch_asin: 0 })];
  const leak = computeLeak(rows, { value: 24, source: 'default' });
  const cb = leak.transitions.find((t) => t.key === 'click_basket')!;
  ok('click→basket is above the low-data floor (22 ≥ 20)', !cb.belowFloor);
  ok('but the market rate is inside your Wilson CI → not significant', !cb.significant);
  ok('so it is NOT a callable leak', !isCallableLeak(cb));
  ok('no callable leak on this thin-data ASIN', leak.mainLeak === null);
}

console.log('§2.2 — null purchase price renders as null (never 0)');
{
  const nulls = sqpWeekly.filter((r) => r.purch_asin === 0);
  ok('rows with 0 purchases exist', nulls.length > 0, `got ${nulls.length}`);
  ok('their price_purch_asin is null (not 0)', nulls.every((r) => r.price_purch_asin === null));
}

console.log('§2.7 — every core flag renders somewhere in the fixture');
{
  const { stats } = queryStats(filterScope(sqpWeekly, { branded: 'nonbranded' }));
  const seen = new Set(stats.flatMap((s) => s.flags.map((f) => f.key)));
  for (const k of ['ORGANIC_HEAVY', 'UNDER_INVESTED', 'PRICE_ABOVE_MKT', 'PRICE_BELOW_MKT', 'TREND_DOWN', 'FAST_SHIP_MKT'] as const)
    ok(`flag ${k} present`, seen.has(k), `flags seen: ${[...seen].join(', ')}`);
}

console.log('§3.2 — branded toggle changes the row set');
{
  const all = filterScope(sqpWeekly, { branded: 'all' }).length;
  const nb = filterScope(sqpWeekly, { branded: 'nonbranded' }).length;
  const br = filterScope(sqpWeekly, { branded: 'branded' }).length;
  ok('branded + non-branded == all', nb + br === all, `${nb}+${br} vs ${all}`);
  ok('branded rows exist', br > 0, `got ${br}`);
}

console.log('§3.1 / §6.5 — week snapping, prior period, partial latest week');
{
  const mw = maxWeek(sqpWeekly);
  const { weeks, priorWeeks } = resolveRange(sqpWeekly, mw, 4);
  ok('range resolves to 4 weeks', weeks.length === 4, `got ${weeks.length}`);
  ok('comparison = prior 4 weeks', priorWeeks.length === 4, `got ${priorWeeks.length}`);
  ok('prior is disjoint and earlier', priorWeeks.every((w) => !weeks.includes(w)) && priorWeeks[priorWeeks.length - 1] < weeks[0]);
  const st = latestWeekStatus(sqpWeekly);
  ok('latest week detected partial (1 ASIN not reported)', !st.complete && st.reported === st.expected - 1, `reported ${st.reported}/${st.expected}`);
  ok('last complete week is before the through week', st.lastCompleteWeek < st.throughWeek);
}

console.log('sanity — fixture shape');
{
  const asins = new Set(sqpWeekly.map((r) => r.asin)).size;
  const weeks = new Set(sqpWeekly.map((r) => r.week_ending)).size;
  ok('9 ASINs (8 + 1 low-data)', asins === 9, `got ${asins}`);
  ok('8 weeks', weeks === 8, `got ${weeks}`);
  ok('imp_total ≈ 25 × sq_volume', (() => {
    const s = sqpWeekly.slice(0, 500);
    const ratio = s.reduce((acc, r) => acc + r.imp_total / r.sq_volume, 0) / s.length;
    return ratio > 20 && ratio < 30;
  })());
  ok('anchor ASIN B0DCBQC3JX present', sqpWeekly.some((r) => r.asin === 'B0DCBQC3JX'));
  ok('ASP computes from fixture', computeAsp(sqpWeekly).value > 0);
}

import { computeVerdict, parityBridge, addressableByStage, playbookActions, TRANSITIONS } from './verdict';

console.log('§1 / §9.1 — verdict flips to SHARE-DECLINE on the declining brand; healthy on branded');
{
  const mw = maxWeek(sqpWeekly);
  const { weeks, priorWeeks } = resolveRange(sqpWeekly, mw, 4);
  const win = filterScope(sqpWeekly, { weeks, branded: 'nonbranded' });
  const pri = filterScope(sqpWeekly, { weeks: priorWeeks, branded: 'nonbranded' });
  const v = computeVerdict(win, pri);
  ok('primary is share-decline', v.primary === 'share', `got ${v.primary}`);
  ok('headline € equals share-loss €/wk', Math.abs(v.headlineEurWk - v.share.shareLossEurWk) < 1e-6);
  ok('conversion leak is the secondary (addressable > netted)', v.conv.addressableTotal > v.conv.netEurWk);
  const bv = computeVerdict(filterScope(sqpWeekly, { weeks, branded: 'branded' }), filterScope(sqpWeekly, { weeks: priorWeeks, branded: 'branded' }));
  ok('branded scope renders the healthy verdict', bv.primary === 'healthy', `got ${bv.primary} (addr €${Math.round(bv.conv.addressableTotal)}, purchΔ ${(bv.share.purchDeltaPp * 100).toFixed(1)}pp)`);
}

console.log('§2 — addressable per-ASIN sum ≥ brand-netted; totals reconcile');
{
  const mw = maxWeek(sqpWeekly);
  const { weeks } = resolveRange(sqpWeekly, mw, 4);
  const win = filterScope(sqpWeekly, { weeks, branded: 'nonbranded' });
  const byStage = addressableByStage(win);
  const brand = computeLeak(win);
  for (const t of TRANSITIONS) {
    const netted = brand.transitions.find((x) => x.key === t)!;
    const net = !netted.belowFloor && netted.impactEurWk > 0 ? netted.impactEurWk : 0;
    ok(`addressable(${t}) ≥ netted(${t})`, byStage[t] >= net - 1e-6, `${byStage[t]} < ${net}`);
  }
}

console.log('§3 — parity bridge steps sum EXACTLY to purch share − impr share');
{
  const mw = maxWeek(sqpWeekly);
  const { weeks } = resolveRange(sqpWeekly, mw, 4);
  const b = parityBridge(filterScope(sqpWeekly, { weeks, branded: 'nonbranded' }));
  const sum = b.steps.reduce((s, st) => s + st.deltaShare, 0);
  ok('Σ steps === purchShare − impShare', Math.abs(sum - (b.purchShare - b.impShare)) < 1e-9, `${sum} vs ${b.purchShare - b.impShare}`);
}

console.log('§4 / §9.4 — playbook keys on leak stage; no visibility actions under basket→purchase');
{
  const acts = playbookActions({ leakStage: 'basket_purch', flags: [{ key: 'UNDER_INVESTED', label: 'Under-indexed' }, { key: 'PRICE_ABOVE_MKT', label: 'Price' }, { key: 'FAST_SHIP_MKT', label: 'fast' }], yourRate: 0.164, marketRate: 0.39, priceYour: 24.42, priceMkt: 16.46, fastShipPct: 62 });
  const text = acts.map((a) => a.text.toLowerCase()).join(' | ');
  ok('no visibility/keyword actions', !/relevancy|top-of-search|keyword|exact-match/.test(text), text);
  ok('price test is first with both prices', acts[0].text.includes('Price') && acts[0].evidence.includes('24.42') && acts[0].evidence.includes('16.46'));
  ok('max 3 actions, each has evidence', acts.length <= 3 && acts.every((a) => a.evidence.length > 0));
}

console.log('§8 — low-data ASIN falls below the noise floor');
{
  const mw = maxWeek(sqpWeekly);
  const { weeks } = resolveRange(sqpWeekly, mw, 4);
  const low = computeLeak(filterScope(sqpWeekly, { weeks, asins: ['B0DEMOG208'] }));
  ok('B0DEMOG208 has all transitions below floor', low.transitions.every((t) => t.belowFloor), low.transitions.map((t) => t.belowFloor).join(','));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
