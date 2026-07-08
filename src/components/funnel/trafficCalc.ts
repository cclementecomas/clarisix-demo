// ─── Shared Traffic calculations (non-component helpers) ───────────────────
// Kept out of the component files so React Fast Refresh stays happy.

import type { FunnelDiagnostic } from '../../data/funnelDiagnosticData';
import type { ProductTrafficRow } from '../../data/trafficData';
import { productTrafficData } from '../../data/trafficData';
import { ACCOUNT_ASP } from '../../data/accountMetrics';

/** Stable thumbnail per ASIN (Picsum seed) — replace with the Amazon CDN URL
 *  once product metadata is wired. */
export function productImageUrl(asin: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(asin)}/80/80`;
}

/** Estimate weekly € this ASIN is leaking at the brand-level leak stage.
 *  Brand leak is Click → Basket Add, so we compare the ASIN's basket-add rate
 *  to the brand funnel's market click→basket-add rate. Half-recovery of the
 *  gap, then ~50% basket→purchase downstream, valued at the account ASP. */
export function estimateLostRevenue(row: ProductTrafficRow, d: FunnelDiagnostic): number {
  const leakConv = d.conversions[d.biggestOpportunityIdx - 1];
  const marketRate = leakConv.marketRate;
  const gapPp = Math.max(0, marketRate - row.addToCartRate);
  const potentialExtraATCs = row.sessions * (gapPp / 100) * 0.5;
  const potentialExtraOrders = potentialExtraATCs * 0.5;
  return Math.round(potentialExtraOrders * ACCOUNT_ASP);
}

export interface LeakOpportunity {
  leakIdx: number;
  /** Conversion transition that leaks (e.g. Click → Basket Add). */
  leakConv: FunnelDiagnostic['conversions'][number];
  /** Stage you convert FROM at the leak (e.g. Clicks). */
  fromStage: FunnelDiagnostic['stages'][number];
  /** Stage you convert TO at the leak (e.g. Basket Adds). */
  toStage: FunnelDiagnostic['stages'][number];
  gapPp: number;
  /** Extra units at the leak's TO stage if you fully matched the market rate. */
  recoveredAtLeak: number;
  /** Those flowed down to purchases at your own downstream rates. */
  purchases: number;
  revenue: number;
}

/** THE single brand-leak opportunity, full-market match ("if this leak matched
 *  the market"). Every €/unit figure on the Traffic page derives from this so
 *  the hero, the opportunity widget, the driver cards and the table all agree. */
export function leakOpportunity(d: FunnelDiagnostic): LeakOpportunity {
  const leakIdx = d.biggestOpportunityIdx;
  const leakConv = d.conversions[leakIdx - 1];
  const fromStage = d.stages[leakIdx - 1];
  const toStage = d.stages[leakIdx];
  const gapPp = Math.max(0, -leakConv.delta);
  const recoveredAtLeak = Math.round(fromStage.brandCount * (gapPp / 100));
  let purchases = recoveredAtLeak;
  for (let i = leakIdx; i < d.conversions.length; i++) purchases *= d.conversions[i].yourRate / 100;
  purchases = Math.round(purchases);
  return { leakIdx, leakConv, fromStage, toStage, gapPp, recoveredAtLeak, purchases, revenue: Math.round(purchases * ACCOUNT_ASP) };
}

export interface LeakDriverRow extends ProductTrafficRow {
  /** This ASIN's share of the brand leak (its recovered purchases / €). */
  lostPurchases: number;
  lostRevenue: number;
  sharePct: number;
}

/** Decompose the brand leak opportunity across ASINs, weighted by each ASIN's
 *  own basket-add gap vs market. The rows SUM BACK to leakOpportunity (so the
 *  table total and the driver cards reconcile with the hero/widget). */
export function leakAllocation(d: FunnelDiagnostic): { opp: LeakOpportunity; rows: LeakDriverRow[] } {
  const opp = leakOpportunity(d);
  const weights = productTrafficData.map((r) => ({ r, w: estimateLostRevenue(r, d) }));
  const totalW = weights.reduce((s, x) => s + x.w, 0) || 1;
  const rows: LeakDriverRow[] = weights.map(({ r, w }) => ({
    ...r,
    lostPurchases: w > 0 ? Math.round(opp.purchases * (w / totalW)) : 0,
    lostRevenue: w > 0 ? Math.round(opp.revenue * (w / totalW)) : 0,
    sharePct: (w / totalW) * 100,
  }));
  return { opp, rows };
}
