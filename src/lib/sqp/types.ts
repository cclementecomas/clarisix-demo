// ─── SQP data contract (§1.1) ───────────────────────────────────────────────
// One row = one ASIN × one week × one search query. Market columns (*_total,
// sq_volume, market prices/shipping) are market-wide per (query, week) and are
// therefore IDENTICAL across every ASIN row for the same (query, week).

export interface SqpRow {
  asin: string;
  week_ending: string;      // ISO date, Saturday
  query: string;
  query_score: number;      // Amazon query rank for this ASIN; lower = more associated
  sq_volume: number;        // market-wide searches
  marketplace: string;
  currency: string;
  branded: boolean;         // precomputed alias match (recomputable from settings)

  // Impressions
  imp_total: number; imp_asin: number; imp_share: number;
  // Clicks
  clicks_total: number; clicks_asin: number; clicks_share: number;
  mkt_click_rate_per_search: number;            // clicks_total / sq_volume
  price_click_mkt: number | null; price_click_asin: number | null;
  ship_same_click: number; ship_1d_click: number; ship_2d_click: number;
  // Basket adds
  baskets_total: number; baskets_asin: number; baskets_share: number;
  mkt_basket_rate_per_search: number;
  price_basket_mkt: number | null; price_basket_asin: number | null;
  ship_same_basket: number; ship_1d_basket: number; ship_2d_basket: number;
  // Purchases
  purch_total: number; purch_asin: number; purch_share: number;
  mkt_purchase_rate_per_search: number;
  price_purch_mkt: number | null; price_purch_asin: number | null;
  ship_same_purch: number; ship_1d_purch: number; ship_2d_purch: number;
}

export type TransitionKey = 'imp_click' | 'click_basket' | 'basket_purch';

export interface Scope {
  asins?: string[];      // undefined = all ASINs
  queries?: string[];    // undefined = all queries
  weeks?: string[];      // undefined = all weeks in fixture
  branded?: 'all' | 'branded' | 'nonbranded';
}

/** Summed counts for a scope: market deduped by (query, week), asin summed. */
export interface StageAgg {
  nWeeks: number;
  asin: { I: number; C: number; B: number; P: number };
  market: { Im: number; Cm: number; Bm: number; Pm: number; vol: number };
}

/** Derived stage metrics (§2.2). Rates are null when the denominator is 0. */
export interface StageMetrics {
  impShare: number; clickShare: number; basketShare: number; purchShare: number;
  ctr: number | null; atc: number | null; close: number | null; cvr: number | null;
  ctrM: number | null; atcM: number | null; closeM: number | null; cvrM: number | null;
}

export interface Transition {
  key: TransitionKey;
  label: string;
  yourRate: number | null;
  marketRate: number | null;
  gapPp: number | null;         // (yourRate − marketRate) × 100
  missedPurchases: number;      // per range
  impactEurWk: number;          // per week
  belowFloor: boolean;
}

export interface LeakResult {
  transitions: Transition[];
  mainLeak: Transition | null;  // argmax impact among above-floor transitions
  asp: { value: number; source: 'purchases' | 'clicks' | 'default' };
}

export type Quadrant = 'invest' | 'defend' | 'harvest' | 'tail';

export type FlagKey =
  | 'ORGANIC_HEAVY' | 'UNDER_INVESTED' | 'PRICE_ABOVE_MKT' | 'PRICE_BELOW_MKT'
  | 'TREND_UP' | 'TREND_DOWN' | 'NEW_QUERY' | 'FAST_SHIP_MKT' | 'LOW_DATA';

export interface Flag { key: FlagKey; label: string; }

export interface SqpSettings {
  brand_aliases: string[];
  default_asp: number;
  marketplace: string;
  currency: string;
  volume_split_pctl: number;
  closure: number;
}
