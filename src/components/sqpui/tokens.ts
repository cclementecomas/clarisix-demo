// Shared stage color tokens (§4/§7) — one palette across bridge, trend, chips, drawer.
import type { TransitionKey } from '../../lib/sqp/types';

export type Stage = 'impressions' | 'clicks' | 'baskets' | 'purchases';

export const STAGE_COLOR: Record<Stage, string> = {
  impressions: '#0E5A8A',
  clicks: '#0EA5E9',
  baskets: '#F59E0B',
  purchases: '#10B981',
};

/** A transition is coloured by the stage it lands on. */
export const TRANSITION_STAGE: Record<TransitionKey, Stage> = {
  imp_click: 'clicks',
  click_basket: 'baskets',
  basket_purch: 'purchases',
};
export const transitionColor = (t: TransitionKey) => STAGE_COLOR[TRANSITION_STAGE[t]];

export const STAGE_LABEL: Record<Stage, string> = {
  impressions: 'Impressions', clicks: 'Clicks', baskets: 'Basket adds', purchases: 'Purchases',
};

/** One canonical funnel-transition label — noun form matching the share labels (Impression share … Purchase share). Shared by the bridge, the ASIN stage pills and the banner so they never drift. */
export const TRANSITION_NAME: Record<TransitionKey, string> = {
  imp_click: 'Impression → Click',
  click_basket: 'Click → Basket',
  basket_purch: 'Basket → Purchase',
};
