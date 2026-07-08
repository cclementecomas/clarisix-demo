// ─── Account-wide metrics (single source of truth) ─────────────────────────
// Small shared constants derived from the account P&L, so the Traffic and SQP
// pages estimate € impact off ONE real average selling price instead of a flat
// per-page guess.

// Account-wide Average Selling Price = account net sales ÷ units sold.
// Demo inputs are the YTD account totals already used elsewhere in the app
// (dashboardData periodSnapshots "Year to date" sales; units from the P&L, see
// profitabilityData grossASP ≈ €37–38). In production, recompute this for the
// selected scope/period as (net product revenue ÷ units sold) and pass it in.
const ACCOUNT_NET_SALES_YTD = 298_412.60; // € — dashboardData.ts periodSnapshots (YTD)
const ACCOUNT_UNITS_YTD     = 7_895;      // units — account P&L (YTD)

/** Real account-wide ASP, ≈ €37.80. Used by every €-impact estimate on
 *  Traffic & SQP so the two pages never disagree on price. */
export const ACCOUNT_ASP = Math.round((ACCOUNT_NET_SALES_YTD / ACCOUNT_UNITS_YTD) * 100) / 100;
