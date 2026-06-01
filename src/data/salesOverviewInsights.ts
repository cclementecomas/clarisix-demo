// ─── Sales Overview Insights ──────────────────────────────────────────────
// Centralized computation layer that turns raw sales numbers into the
// pace status, headline narrative, growth drivers, organic-vs-ad insight,
// and Needs Attention alerts the Sales Overview page needs.
//
// Rules implemented (see knowledge_base.md):
//   Rule 1 — Main pace status
//   Rule 2 — Executive headline template
//   Rule 3 — Growth drivers / watchouts
//   Rule 4 — Bottom cards ranked by growth contribution (default)
//   Rule 5 — Organic vs ad interpretation
//   Rule 6 — Needs Attention panel (max 3 alerts, priority-ordered)
//   Rule 7 — Next-action CTA routing

import { salesByMarketplace, salesByCategory, salesByASIN, type ASINDataItem } from './dashboardData';

// ── Constants for the demo period (May 2026) ───────────────────────────────
// Anchor to the same numbers BudgetTracker shows so the page stays
// internally consistent: same projected EOM, same MTD, same daily avg.
export const TARGET_SALES        = 150_000;
export const LAST_MONTH_TOTAL    = 126_240;
export const LAST_YEAR_SAME_PERIOD = 120_000;
export const MTD_ACTUAL          = 96_120;
export const PROJECTED_EOM       = 141_887;
export const AVG_DAILY_SALES     = 4_577;
export const DAYS_REMAINING      = 10;
export const DAYS_IN_MONTH       = 31;

// Organic vs ad split (current period MTD vs prior period). Hardcoded for
// the demo — real implementation would derive from the sales granularity feed.
export const ORGANIC_SALES_CURRENT  = 51_120;
export const AD_SALES_CURRENT       = 45_000;
export const ORGANIC_SALES_PREVIOUS = 50_000;
export const AD_SALES_PREVIOUS      = 38_000;

// Period labels — derived from system date so they stay coherent if the
// demo "today" shifts. Locale-stable English.
const _now = new Date();
const _lastMonth = new Date(_now.getFullYear(), _now.getMonth() - 1, 1);
const _monthFmt = (d: Date) => d.toLocaleString('en-US', { month: 'long' });
export const CURRENT_PERIOD_LABEL = _monthFmt(_now);
export const LAST_PERIOD_LABEL    = _monthFmt(_lastMonth);

// ── Pace status (Rule 1) ─────────────────────────────────────────────────
export type PaceTone = 'good' | 'neutral' | 'bad';
export type PaceStatus = { label: string; tone: PaceTone };

function computePaceStatus(projected: number, target: number | null, prevPeriod: number): PaceStatus {
  if (target !== null && target > 0) {
    return projected >= target
      ? { label: 'On track',     tone: 'good' }
      : { label: 'Behind target', tone: 'bad'  };
  }
  return projected >= prevPeriod
    ? { label: 'Ahead of last period', tone: 'good' }
    : { label: 'Behind last period',   tone: 'bad'  };
}

export const paceStatus: PaceStatus = computePaceStatus(PROJECTED_EOM, TARGET_SALES, LAST_MONTH_TOTAL);

// ── Derived numbers used everywhere ──────────────────────────────────────
export const gapToTarget = PROJECTED_EOM - TARGET_SALES;                            // negative if behind
export const requiredDailyToTarget = Math.max(0, Math.ceil((TARGET_SALES - MTD_ACTUAL) / DAYS_REMAINING));
export const popChangePct = +(((PROJECTED_EOM - LAST_MONTH_TOTAL) / LAST_MONTH_TOTAL) * 100).toFixed(1);
export const yoyChangePct = +(((PROJECTED_EOM - LAST_YEAR_SAME_PERIOD) / LAST_YEAR_SAME_PERIOD) * 100).toFixed(1);

// ── Growth drivers + watchouts (Rule 3) ──────────────────────────────────
export interface DriverRow {
  name: string;
  productName?: string;   // ASIN rows only
  current: number;
  previous: number;
  change: number;         // signed €
  changePct: number;      // signed %
  contributionPct: number; // share of total positive change (>=0)
}

export type DriverKind = 'marketplace' | 'category' | 'asin';

function enrichDrivers<T extends { name: string; value: number; previous: number; productName?: string }>(rows: T[]): DriverRow[] {
  const totalPositiveChange = rows.reduce((s, r) => s + Math.max(0, r.value - r.previous), 0) || 1;
  return rows.map((r) => {
    const change = r.value - r.previous;
    const changePct = r.previous > 0 ? (change / r.previous) * 100 : 0;
    // Contribution = this row's positive change as % of all positive change.
    // Negative rows score 0 — they're watchouts, not contributors.
    const contributionPct = change > 0 ? (change / totalPositiveChange) * 100 : 0;
    return {
      name: r.name,
      productName: r.productName,
      current: r.value,
      previous: r.previous,
      change: +change.toFixed(0),
      changePct: +changePct.toFixed(1),
      contributionPct: +contributionPct.toFixed(1),
    };
  });
}

export const marketplaceDrivers = enrichDrivers(salesByMarketplace);
export const categoryDrivers    = enrichDrivers(salesByCategory);
export const asinDrivers        = enrichDrivers(salesByASIN.map((a: ASINDataItem) => ({
  name: a.name, value: a.value, previous: a.previous, productName: a.productName,
})));

function topPositive(rows: DriverRow[]): DriverRow | null {
  const positives = rows.filter((r) => r.change > 0).sort((a, b) => b.change - a.change);
  return positives[0] ?? null;
}

function topNegative(rows: DriverRow[]): DriverRow | null {
  // Watchout threshold: change < -€1,000 OR pct < -10% (Rule 3).
  const material = rows.filter((r) => r.change < -1000 || r.changePct < -10);
  return material.sort((a, b) => a.change - b.change)[0] ?? null;
}

export interface Driver { kind: DriverKind; row: DriverRow; }
function bestPositive(): Driver | null {
  const candidates: Driver[] = [
    topPositive(marketplaceDrivers) && { kind: 'marketplace' as const, row: topPositive(marketplaceDrivers)! },
    topPositive(categoryDrivers)    && { kind: 'category'    as const, row: topPositive(categoryDrivers)!    },
    topPositive(asinDrivers)        && { kind: 'asin'        as const, row: topPositive(asinDrivers)!        },
  ].filter(Boolean) as Driver[];
  return candidates.sort((a, b) => b.row.change - a.row.change)[0] ?? null;
}
function worstNegative(): Driver | null {
  const candidates: Driver[] = [
    topNegative(marketplaceDrivers) && { kind: 'marketplace' as const, row: topNegative(marketplaceDrivers)! },
    topNegative(categoryDrivers)    && { kind: 'category'    as const, row: topNegative(categoryDrivers)!    },
    topNegative(asinDrivers)        && { kind: 'asin'        as const, row: topNegative(asinDrivers)!        },
  ].filter(Boolean) as Driver[];
  return candidates.sort((a, b) => a.row.change - b.row.change)[0] ?? null;
}

export const mainDriver: Driver | null = bestPositive();
export const mainWatchout: Driver | null = worstNegative();

// ── Executive headline (Rule 2) ──────────────────────────────────────────
export const executiveHeadline: string = (() => {
  const projFmt = `€${Math.round(PROJECTED_EOM / 100) / 10}k`;
  if (TARGET_SALES !== null && TARGET_SALES > 0) {
    const gapSign = gapToTarget >= 0 ? '+' : '−';
    const gapAbs = `€${Math.round(Math.abs(gapToTarget) / 100) / 10}k`;
    const targetFmt = `€${Math.round(TARGET_SALES / 1000)}k`;
    const dir = gapToTarget >= 0 ? 'above' : 'below';
    return `${CURRENT_PERIOD_LABEL} is pacing ${paceStatus.label.toLowerCase()}. Projected sales are ${projFmt}, ${gapSign}${gapAbs} ${dir} the ${targetFmt} target.`;
  }
  const sign = popChangePct >= 0 ? '+' : '';
  return `${CURRENT_PERIOD_LABEL} is pacing ${paceStatus.label.toLowerCase()}. Projected sales are ${projFmt}, ${sign}${popChangePct}% vs ${LAST_PERIOD_LABEL}.`;
})();

// ── Organic vs ad interpretation (Rule 5) ────────────────────────────────
const _organicGrowthPct = ((ORGANIC_SALES_CURRENT - ORGANIC_SALES_PREVIOUS) / ORGANIC_SALES_PREVIOUS) * 100;
const _adGrowthPct      = ((AD_SALES_CURRENT      - AD_SALES_PREVIOUS)      / AD_SALES_PREVIOUS)      * 100;
const _adDependencyPct  = (AD_SALES_CURRENT / (ORGANIC_SALES_CURRENT + AD_SALES_CURRENT)) * 100;

export const organicGrowthPct = +_organicGrowthPct.toFixed(1);
export const adGrowthPct      = +_adGrowthPct.toFixed(1);
export const adDependencyPct  = +_adDependencyPct.toFixed(1);

export const organicAdInsight: string = (() => {
  const diff = adGrowthPct - organicGrowthPct;
  if (diff > 10)  return 'Growth is increasingly ad-driven. Check profitability / TACOS.';
  if (diff < -10) return 'Growth is supported by stronger organic sales.';
  if (adDependencyPct > 50) return 'High ad dependency. Check margin quality.';
  return 'Organic and paid are growing in step — no immediate quality concern.';
})();

// ── Needs Attention alerts (Rule 6) ──────────────────────────────────────
export type AttentionCta =
  | { label: string; route: 'breakdown-marketplace' }
  | { label: string; route: 'breakdown-category' }
  | { label: string; route: 'breakdown-asin' }
  | { label: string; route: 'profitability' }
  | { label: string; route: 'run-rate' }
  | { label: string; route: 'sales-trend' };

export interface AttentionAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  cta: AttentionCta;
}

function buildAlerts(): AttentionAlert[] {
  const out: AttentionAlert[] = [];

  // Priority 1: Target gap
  if (TARGET_SALES !== null && PROJECTED_EOM < TARGET_SALES) {
    out.push({
      id: 'target-gap',
      severity: 'critical',
      title: `Projected sales are €${Math.abs(Math.round(gapToTarget / 100) / 10)}k below target.`,
      detail: `Current pace lands ${CURRENT_PERIOD_LABEL} at €${Math.round(PROJECTED_EOM / 100) / 10}k vs the €${Math.round(TARGET_SALES / 1000)}k target.`,
      cta: { label: 'View growth drivers', route: 'breakdown-marketplace' },
    });
  }

  // Priority 2: Required daily pace gap
  if (requiredDailyToTarget > AVG_DAILY_SALES) {
    out.push({
      id: 'pace-gap',
      severity: 'warning',
      title: `Required daily sales are €${(requiredDailyToTarget / 1000).toFixed(1)}k/day vs current €${(AVG_DAILY_SALES / 1000).toFixed(1)}k/day.`,
      detail: `Closing the gap needs the average daily to rise by ${Math.round(((requiredDailyToTarget - AVG_DAILY_SALES) / AVG_DAILY_SALES) * 100)}% across the remaining ${DAYS_REMAINING} days.`,
      cta: { label: 'Open run rate', route: 'run-rate' },
    });
  }

  // Priority 3: Largest marketplace/category/ASIN decline
  if (mainWatchout) {
    const route: AttentionCta['route'] =
      mainWatchout.kind === 'marketplace' ? 'breakdown-marketplace' :
      mainWatchout.kind === 'category'    ? 'breakdown-category'    :
                                            'breakdown-asin';
    const ctaLabel =
      mainWatchout.kind === 'marketplace' ? 'Open marketplace breakdown' :
      mainWatchout.kind === 'category'    ? 'Open category breakdown'    :
                                            'Open ASIN diagnostic';
    out.push({
      id: 'top-decline',
      severity: 'warning',
      title: `${mainWatchout.row.name} is the largest ${mainWatchout.kind} drag: €${(mainWatchout.row.change / 1000).toFixed(1)}k.`,
      detail: `${mainWatchout.row.changePct.toFixed(1)}% vs the prior period.`,
      cta: { label: ctaLabel, route },
    });
  }

  // Priority 4: Ad dependency risk
  if (adGrowthPct - organicGrowthPct > 10) {
    out.push({
      id: 'ad-dependent',
      severity: 'warning',
      title: 'Growth is increasingly ad-driven. Check profitability.',
      detail: `Ad sales +${adGrowthPct}% vs organic +${organicGrowthPct}% (gap ${(adGrowthPct - organicGrowthPct).toFixed(1)}pp). Ad dependency now ${adDependencyPct.toFixed(0)}%.`,
      cta: { label: 'Check profitability', route: 'profitability' },
    });
  } else if (adDependencyPct > 50) {
    out.push({
      id: 'ad-share-high',
      severity: 'info',
      title: 'High ad dependency. Check margin quality.',
      detail: `Ads contribute ${adDependencyPct.toFixed(0)}% of total sales this period.`,
      cta: { label: 'Check profitability', route: 'profitability' },
    });
  }

  return out.slice(0, 3); // Rule 6: max 3 alerts
}

export const attentionAlerts: AttentionAlert[] = buildAlerts();

// ── Headline CTA routing (Rule 7) ────────────────────────────────────────
export function headlineCta(): { label: string; route: AttentionCta['route'] } {
  if (TARGET_SALES !== null && PROJECTED_EOM < TARGET_SALES) {
    return { label: 'View growth drivers', route: 'breakdown-marketplace' };
  }
  if (mainWatchout?.kind === 'asin') {
    return { label: 'Review declining ASINs', route: 'breakdown-asin' };
  }
  if (mainWatchout?.kind === 'marketplace') {
    return { label: 'Open marketplace breakdown', route: 'breakdown-marketplace' };
  }
  if (mainWatchout?.kind === 'category') {
    return { label: 'Open category breakdown', route: 'breakdown-category' };
  }
  if (adGrowthPct - organicGrowthPct > 10) {
    return { label: 'Check profitability', route: 'profitability' };
  }
  return { label: 'Open sales trend', route: 'sales-trend' };
}

// ── Helper used by component formatting ──────────────────────────────────
export function compactEur(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${n.toFixed(0)}`;
}

export function signedCompactEur(n: number): string {
  const sign = n >= 0 ? '+' : '−';
  return `${sign}${compactEur(Math.abs(n))}`;
}
