// ─── SQP model constants (§2.5–2.8) — all named, surfaced in "How calculated" ─
import type { SqpSettings, FlagKey, TransitionKey } from './types';

// Quadrants (§2.5)
export const VOLUME_SPLIT_PCTL = 0.75;   // x-axis split = P75 of visible sq_volume

// Noise floors (§2.6) — YOUR per-week counts
export const MIN_IMP_FOR_CTR_GAP = 200;
export const MIN_CLICKS_FOR_ATC = 20;
export const MIN_BASKETS_FOR_CLOSE = 10;

// Opportunity / € modeling (§2.3, §2.4)
export const DEFAULT_ASP = 24;           // fallback ASP (EUR), settings-editable
export const DEFAULT_CLOSURE = 0.5;      // "close half the gap"
export const DOWNSTREAM_EFF_CLAMP = { min: 0.5, max: 1.2 } as const;

// Flag thresholds (§2.7)
export const ORGANIC_HEAVY_MIN_IMP_SHARE = 0.03;
export const ORGANIC_HEAVY_CLICK_TO_IMP = 2;
export const UNDER_INVESTED_IMP_SHARE_MAX = 0.02;
export const PRICE_ABOVE_MKT = 1.10;
export const PRICE_BELOW_MKT = 0.90;
export const TREND_REL_PCT = 0.15;       // ≥15% relative change over trailing 4 wks
export const TREND_ABS_PP = 0.003;       // AND ≥0.3pp absolute
export const TREND_WINDOW_WEEKS = 4;
export const FAST_SHIP_MKT_MIN = 0.6;
export const NEW_QUERY_WEEKS = 2;

// Data-shape facts (§1.2) — for copy / the "How calculated" modal
export const IMPRESSIONS_PER_SEARCH = 25;
export const IMP_SHARE_CEILING = 0.07;   // ~7% per-ASIN practical ceiling
export const TOP_QUERIES_CAP = 100;

export const FLAG_LABEL: Record<FlagKey, string> = {
  ORGANIC_HEAVY: 'Organic-heavy — review PPC',
  UNDER_INVESTED: 'Under-indexed',
  PRICE_ABOVE_MKT: 'Price above market',
  PRICE_BELOW_MKT: 'Price below market',
  TREND_UP: 'Trending up',
  TREND_DOWN: 'Trending down',
  NEW_QUERY: 'New',
  FAST_SHIP_MKT: 'Market buys fast delivery',
  LOW_DATA: 'Low data',
};

export const TRANSITION_LABEL: Record<TransitionKey, string> = {
  imp_click: 'Impr → Click (CTR)',
  click_basket: 'Click → Basket',
  basket_purch: 'Basket → Purchase',
};

// Integration flags (§0.4) — off in the wireframe; gate Ads/Business-Reports UI.
export const flags = { ads: false, business_reports: false };

// Default settings (§3.2 brand aliases seeded for the fixture — GUM/Sunstar).
export const settings: SqpSettings = {
  brand_aliases: ['gum', 'sunstar', 'g.u.m', 'g-u-m', 'g u m'],
  default_asp: DEFAULT_ASP,
  marketplace: 'DE',
  currency: 'EUR',
  volume_split_pctl: VOLUME_SPLIT_PCTL,
  closure: DEFAULT_CLOSURE,
};

export function isBranded(query: string, aliases: string[] = settings.brand_aliases): boolean {
  const q = query.toLowerCase();
  return aliases.some((a) => q.includes(a.toLowerCase()));
}
