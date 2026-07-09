// ─── sqp_weekly fixture (§1.3) — fully synthetic ─────────────────────────────
// Deterministic generator: 8 ASINs × 8 weeks over a SHARED query pool, so the
// market columns (*_total, sq_volume, prices, shipping) are identical across
// ASINs for the same (query, week) — the property brand aggregation relies on.
//
// Domain, shape and format mirror a real DE / EUR interdental-care export (GUM /
// Sunstar): German dental queries, imp_total ≈ 25 × sq_volume, a near-constant
// per-ASIN list price sitting ABOVE varied market medians, small shares (0–9%
// with a few outliers), sparse purchases with null prices, top-100 cap, WoW
// drift. NO real export values are used — everything here is generated.

import type { SqpRow } from './types';
import { isBranded, IMPRESSIONS_PER_SEARCH } from './constants';

const MARKETPLACE = 'DE';
const CURRENCY = 'EUR';

// 8 weeks ending Saturday, through 2026-06-27.
export const SQP_WEEKS = [
  '2026-05-09', '2026-05-16', '2026-05-23', '2026-05-30',
  '2026-06-06', '2026-06-13', '2026-06-20', '2026-06-27',
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h | 0) || 1;
}
function rng(seed: number): () => number {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── Query pool (German interdental-care) — pattern seeds a §2.7 flag family ─
type Pattern = 'normal' | 'organic_heavy' | 'under_invested' | 'price_high' | 'price_low' | 'fast_ship' | 'new';
interface Q { text: string; baseVolume: number; pattern: Pattern; }

const QUERIES: Q[] = [
  // high-volume generic (non-branded) — visibility opportunities
  { text: 'interdentalbürsten', baseVolume: 6400, pattern: 'under_invested' },
  { text: 'zahnzwischenraumbürsten', baseVolume: 3900, pattern: 'under_invested' },
  { text: 'zahnseide stick', baseVolume: 4200, pattern: 'under_invested' },
  { text: 'zahnstocher', baseVolume: 3350, pattern: 'price_high' },
  { text: 'zahnsticks', baseVolume: 2500, pattern: 'normal' },
  { text: 'dentalbürsten', baseVolume: 2300, pattern: 'price_high' },
  { text: 'interdentalbürste', baseVolume: 1500, pattern: 'normal' },
  { text: 'zahnstocher kunststoff', baseVolume: 1250, pattern: 'normal' },
  { text: 'dental sticks', baseVolume: 1100, pattern: 'organic_heavy' },
  { text: 'zwischenzahnbürsten', baseVolume: 980, pattern: 'normal' },
  { text: 'interdental sticks', baseVolume: 860, pattern: 'organic_heavy' },
  { text: 'dental picks', baseVolume: 720, pattern: 'organic_heavy' },
  { text: 'zahnreinigung', baseVolume: 1770, pattern: 'fast_ship' },
  { text: 'interdentalbürsten silikon', baseVolume: 560, pattern: 'price_low' },
  { text: 'zahnzwischenraumbürsten dünn', baseVolume: 640, pattern: 'price_low' },
  { text: 'zahnreiniger zwischenräume', baseVolume: 430, pattern: 'normal' },
  { text: 'interdentalbürsten weich', baseVolume: 520, pattern: 'new' },
  // competitor (non-branded)
  { text: 'tepe interdentalbürsten', baseVolume: 3600, pattern: 'normal' },
  { text: 'tepe', baseVolume: 1150, pattern: 'normal' },
  { text: 'oral b interdentalbürsten', baseVolume: 900, pattern: 'fast_ship' },
  { text: 'interprox', baseVolume: 640, pattern: 'normal' },
  { text: 'tepe angle', baseVolume: 420, pattern: 'normal' },
  // branded (GUM / Sunstar) — organic-heavy tendency
  { text: 'gum soft picks', baseVolume: 690, pattern: 'organic_heavy' },
  { text: 'gum zahnsticks', baseVolume: 240, pattern: 'organic_heavy' },
  { text: 'gum soft picks pro', baseVolume: 170, pattern: 'organic_heavy' },
  { text: 'gum interdentalbürsten', baseVolume: 200, pattern: 'normal' },
  { text: 'gum', baseVolume: 1540, pattern: 'normal' },
  { text: 'gum zahnzwischenraumbürsten', baseVolume: 100, pattern: 'normal' },
  { text: 'gum sticks', baseVolume: 73, pattern: 'normal' },
  { text: 'gum soft picks small', baseVolume: 52, pattern: 'normal' },
  { text: 'sunstar gum soft picks pro', baseVolume: 37, pattern: 'normal' },
  { text: 'gum ortho', baseVolume: 86, pattern: 'price_high' },
  { text: 'gum care', baseVolume: 24, pattern: 'normal' },
  { text: 'g.u.m interdental', baseVolume: 21, pattern: 'normal' },
];

// ─── ASIN profiles (synthetic GUM catalogue) ─────────────────────────────────
type LeakStage = 'ctr' | 'atc' | 'close' | 'none';
interface AsinProfile {
  asin: string; title: string; strength: number; leak: LeakStage; deteriorate: boolean;
  listPrice: number;   // near-constant own price (mirrors the real export)
}
export const SQP_ASINS: AsinProfile[] = [
  { asin: 'B0DCBQC3JX', title: 'GUM Soft-Picks Pro Interdental Cleaners', strength: 0.78, leak: 'atc', deteriorate: true, listPrice: 27.42 },
  { asin: 'B0DEMOG201', title: 'GUM Soft-Picks Advanced (Size S)', strength: 0.52, leak: 'ctr', deteriorate: false, listPrice: 27.42 },
  { asin: 'B0DEMOG202', title: 'GUM Interdental Brushes 0.6mm', strength: 0.60, leak: 'close', deteriorate: true, listPrice: 24.91 },
  { asin: 'B0DEMOG203', title: 'GUM Trav-Ler Interdental Brushes', strength: 0.46, leak: 'atc', deteriorate: false, listPrice: 27.65 },
  { asin: 'B0DEMOG204', title: 'GUM Ortho Interdental Brushes', strength: 0.38, leak: 'ctr', deteriorate: false, listPrice: 27.42 },
  { asin: 'B0DEMOG205', title: 'GUM Soft-Picks Value 90-Pack', strength: 0.64, leak: 'none', deteriorate: false, listPrice: 8.99 }, // low-price → price_below cases
  { asin: 'B0DEMOG206', title: 'GUM Dental Floss Picks', strength: 0.34, leak: 'close', deteriorate: false, listPrice: 22.95 },
  { asin: 'B0DEMOG207', title: 'GUM Rubber Interdental Stimulators', strength: 0.42, leak: 'atc', deteriorate: true, listPrice: 27.42 },
  { asin: 'B0DEMOG208', title: 'GUM Micro-Tip Interdental Brushes', strength: 0.06, leak: 'none', deteriorate: false, listPrice: 27.42 }, // low-data ASIN (§8): below noise floors
];

function designatedAsin(q: string): string {
  return SQP_ASINS[hash(q) % SQP_ASINS.length].asin;
}
function covers(asin: string, q: Q): boolean {
  if (asin === 'B0DEMOG208') return !isBranded(q.text) && q.baseVolume < 700; // low-data ASIN → sub-floor
  if (q.pattern === 'under_invested') return asin === designatedAsin(q.text);
  const r = rng(hash(asin + '::' + q.text));
  return r() < 0.62;
}

// ─── Market generation (once per query×week; identical across ASINs) ─────────
interface Market {
  sq_volume: number; imp_total: number; clicks_total: number; baskets_total: number; purch_total: number;
  ctr_m: number; atc_m: number; close_m: number;
  price_click: number; price_basket: number; price_purch: number;
  ship_same: number; ship_1d: number; ship_2d: number;
}
const marketCache = new Map<string, Market>();
function marketFor(q: Q, week: string, weekIdx: number): Market {
  const key = q.text + '|' + week;
  const cached = marketCache.get(key);
  if (cached) return cached;
  const r = rng(hash(key));
  const drift = 1 + (weekIdx - 3.5) * 0.015 + (r() - 0.5) * 0.12;
  const sq_volume = Math.max(20, Math.round(q.baseVolume * drift));
  const imp_total = Math.round(sq_volume * IMPRESSIONS_PER_SEARCH * (0.85 + r() * 0.3));
  const ctr_m = 0.013 + r() * 0.010;                    // per-impression CTR ~1.3–2.3% (≈33–58%/search)
  const clicks_total = Math.max(1, Math.round(imp_total * ctr_m));
  const atc_m = 0.10 + r() * 0.15;                      // 10–25%
  const baskets_total = Math.max(0, Math.round(clicks_total * atc_m));
  const close_m = 0.30 + r() * 0.18;                    // 30–48%
  const purch_total = Math.max(0, Math.round(baskets_total * close_m));
  // market medians vary and sit BELOW the GUM list price (drives PRICE_ABOVE)
  const price_click = +(5 + r() * 22).toFixed(2);
  const fast = q.pattern === 'fast_ship' ? 0.62 + r() * 0.18 : 0.2 + r() * 0.3;
  const m: Market = {
    sq_volume, imp_total, clicks_total, baskets_total, purch_total, ctr_m, atc_m, close_m,
    price_click,
    price_basket: +(price_click * (0.98 + r() * 0.04)).toFixed(2),
    price_purch: +(price_click * (0.97 + r() * 0.04)).toFixed(2),
    ship_same: fast * 0.4, ship_1d: fast * 0.6, ship_2d: 1 - fast,
  };
  marketCache.set(key, m);
  return m;
}

function buildRows(): SqpRow[] {
  const rows: SqpRow[] = [];
  const p75Volume = [...QUERIES].map((q) => q.baseVolume).sort((a, b) => a - b)[Math.floor(QUERIES.length * 0.75)];

  for (const a of SQP_ASINS) {
    const covered = QUERIES.filter((q) => covers(a.asin, q));
    const ranked = [...covered].sort((x, y) => hash(a.asin + x.text) - hash(a.asin + y.text));

    SQP_WEEKS.forEach((week, wi) => {
      // Demonstrates the "latest week not yet available" state (§6.5): this ASIN
      // has not reported the newest week yet.
      if (a.asin === 'B0DEMOG207' && wi === SQP_WEEKS.length - 1) return;

      ranked.forEach((q, qi) => {
        if (qi >= 100) return;                                           // top-100 cap
        if (q.pattern === 'new' && wi < SQP_WEEKS.length - 2) return;     // absent until last 2 wks

        const m = marketFor(q, week, wi);
        const r = rng(hash(a.asin + q.text + week));

        let impShare = (0.004 + r() * 0.045) * (0.5 + a.strength);
        if (r() < 0.08) impShare = 0.08 + r() * 0.12;
        if (q.pattern === 'under_invested' && q.baseVolume >= p75Volume) impShare = 0.005 + r() * 0.012;
        if (a.asin === 'B0DEMOG208') impShare = 0.0006 + r() * 0.0012;   // stays under the impression floor
        impShare = clamp(impShare, 0.0004, 0.22);

        const det = a.deteriorate ? 1 - (wi / (SQP_WEEKS.length - 1)) * 0.35 : 1;
        let rCtr = (0.85 + a.strength * 0.5) * (0.9 + r() * 0.3);
        let rAtc = (0.85 + a.strength * 0.5) * (0.9 + r() * 0.3);
        let rClose = (0.85 + a.strength * 0.5) * (0.9 + r() * 0.3);
        if (a.leak === 'ctr') rCtr *= 0.55 * det;
        if (a.leak === 'atc') rAtc *= 0.55 * det;
        if (a.leak === 'close') rClose *= 0.6 * det;
        if (q.pattern === 'organic_heavy') rCtr = Math.max(rCtr, 2.2 + r() * 0.8);
        if (a.deteriorate) rCtr *= det;

        // Branded scope is the healthy state (§8): on your own brand terms you beat
        // the market at every step and shares are STABLE across weeks (week-independent
        // seed) — no addressable gaps and no decline.
        if (isBranded(q.text)) {
          const rs = rng(hash(a.asin + q.text));
          impShare = clamp((0.012 + rs() * 0.05) * (0.5 + a.strength), 0.003, 0.2);
          rCtr = 1.12 + rs() * 0.3; rAtc = 1.06 + rs() * 0.25; rClose = 1.06 + rs() * 0.25;
        }

        const clickShare = clamp(impShare * rCtr, 0.0005, 0.30);
        const basketShare = clamp(clickShare * rAtc, 0.0005, 0.30);
        const purchShare = clamp(basketShare * rClose, 0, 0.30);

        const imp_asin = Math.round(m.imp_total * impShare);
        const clicks_asin = Math.round(m.clicks_total * clickShare);
        const baskets_asin = Math.round(m.baskets_total * basketShare);
        const purch_asin = Math.round(m.purch_total * purchShare);

        // Own price: near-constant list price, unless the query plants a price test.
        const ownPrice = (stage: 'click' | 'basket' | 'purch'): number => {
          const mkt = stage === 'click' ? m.price_click : stage === 'basket' ? m.price_basket : m.price_purch;
          if (q.pattern === 'price_low') return +(mkt * (0.78 + r() * 0.08)).toFixed(2);
          if (q.pattern === 'price_high') return +Math.max(a.listPrice, mkt * (1.15 + r() * 0.1)).toFixed(2);
          return a.listPrice;
        };

        const shipDenom = m.purch_total || 1;
        rows.push({
          asin: a.asin, week_ending: week, query: q.text,
          query_score: qi + 1, sq_volume: m.sq_volume, marketplace: MARKETPLACE, currency: CURRENCY,
          branded: isBranded(q.text),
          imp_total: m.imp_total, imp_asin, imp_share: m.imp_total ? imp_asin / m.imp_total : 0,
          clicks_total: m.clicks_total, clicks_asin, clicks_share: m.clicks_total ? clicks_asin / m.clicks_total : 0,
          mkt_click_rate_per_search: m.clicks_total / m.sq_volume,
          price_click_mkt: m.price_click, price_click_asin: clicks_asin > 0 ? ownPrice('click') : null,
          ship_same_click: Math.round(m.clicks_total * m.ship_same), ship_1d_click: Math.round(m.clicks_total * m.ship_1d), ship_2d_click: Math.round(m.clicks_total * m.ship_2d),
          baskets_total: m.baskets_total, baskets_asin, baskets_share: m.baskets_total ? baskets_asin / m.baskets_total : 0,
          mkt_basket_rate_per_search: m.baskets_total / m.sq_volume,
          price_basket_mkt: m.baskets_total > 0 ? m.price_basket : null, price_basket_asin: baskets_asin > 0 ? ownPrice('basket') : null,
          ship_same_basket: Math.round(m.baskets_total * m.ship_same), ship_1d_basket: Math.round(m.baskets_total * m.ship_1d), ship_2d_basket: Math.round(m.baskets_total * m.ship_2d),
          purch_total: m.purch_total, purch_asin, purch_share: m.purch_total ? purch_asin / m.purch_total : 0,
          mkt_purchase_rate_per_search: m.purch_total / m.sq_volume,
          price_purch_mkt: m.purch_total > 0 ? m.price_purch : null, price_purch_asin: purch_asin > 0 ? ownPrice('purch') : null,
          ship_same_purch: Math.round(shipDenom * m.ship_same), ship_1d_purch: Math.round(shipDenom * m.ship_1d), ship_2d_purch: Math.round(shipDenom * m.ship_2d),
        });
      });
    });
  }
  return rows;
}

export const sqpWeekly: SqpRow[] = buildRows();
