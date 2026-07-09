import type { TransitionKey } from '../../lib/sqp/types';

// Leak-stage chips share the stage color tokens (§9.7): a transition is coloured
// by the stage it lands on — clicks=sky, baskets=amber, purchases=emerald.
export const LEAK_CHIP: Record<TransitionKey, { short: string; cls: string }> = {
  imp_click: { short: 'CTR', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  click_basket: { short: 'Basket add', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  basket_purch: { short: 'Purchase', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};
