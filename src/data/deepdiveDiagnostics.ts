// ─── Sales Deepdive Diagnostics ───────────────────────────────────────────
// Profit-led, confidence-scored issue diagnosis for every entity row
// (Marketplace / Category / ASIN). Each diagnostic carries:
//
//   issueType        — what's wrong (or "Protect winner" / "Healthy")
//   revenueImpact    — € lost (or at risk) vs prior period
//   profitImpact     — € of margin lost (the decision-making lens)
//   confidence       — High / Medium / Low (signal-count based)
//   severityLevel    — Critical / High / Medium / Watch
//   severity         — sort key = |profitImpact| × confidenceMultiplier
//   primary/secondary drivers — top movers behind the diagnosis
//   nextStep + ctaLabel + ctaRoute — issue-specific routing
//   decisionMode     — profit-risk / growth-risk / winner / healthy

import {
  marketplaceData,
  categoryData,
  asinData,
  type MarketplaceRow,
  type CategoryRow,
  type AsinRow,
  type MetricFields,
} from './deepdiveData';

// ── Issue taxonomy ───────────────────────────────────────────────────────

export type IssueType =
  // Profit risks
  | 'Profit dilution'
  | 'Margin risk'
  | 'Ad efficiency issue'
  | 'Ad-led growth risk'
  | 'Discount-led growth risk'
  // Growth risks
  | 'Traffic-led sales drop'
  | 'Conversion-led sales drop'
  | 'Availability-led sales drop'
  | 'Price/mix issue'
  | 'Acquisition weakness'
  | 'Retention weakness'
  // Defaults
  | 'Protect winner'
  | 'Healthy';

export type DecisionMode = 'profit-risk' | 'growth-risk' | 'winner' | 'healthy';

export type Confidence = 'High' | 'Medium' | 'Low';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Watch' | 'None';

export interface IssueMeta {
  mode: DecisionMode;
  nextStep: string;
  ctaLabel: string;
  ctaRoute: string;
  tone: 'critical' | 'warning' | 'info' | 'neutral';
}

export const ISSUE_META: Record<IssueType, IssueMeta> = {
  // Profit risks (mode = profit-risk)
  'Profit dilution':           { mode: 'profit-risk',  nextStep: 'Review margin bridge',                             ctaLabel: 'Review margin bridge',         ctaRoute: 'Profitability/Overview',     tone: 'critical' },
  'Margin risk':               { mode: 'profit-risk',  nextStep: 'Open profitability view',                          ctaLabel: 'Open profitability view',      ctaRoute: 'Profitability/Overview',     tone: 'critical' },
  'Ad efficiency issue':       { mode: 'profit-risk',  nextStep: 'Check campaign efficiency',                        ctaLabel: 'Check campaign efficiency',    ctaRoute: 'Advertising/Deepdive',       tone: 'warning' },
  'Ad-led growth risk':        { mode: 'profit-risk',  nextStep: 'Check ad dependency and profitability',            ctaLabel: 'Check ad dependency',          ctaRoute: 'Profitability/Overview',     tone: 'warning' },
  'Discount-led growth risk':  { mode: 'profit-risk',  nextStep: 'Review pricing and discount strategy',             ctaLabel: 'Review discount strategy',     ctaRoute: 'Profitability/Overview',     tone: 'warning' },
  // Growth risks (mode = growth-risk)
  'Traffic-led sales drop':    { mode: 'growth-risk',  nextStep: 'Review traffic sources / ads / organic visibility', ctaLabel: 'Review traffic sources',       ctaRoute: 'Sales/Traffic',              tone: 'critical' },
  'Conversion-led sales drop': { mode: 'growth-risk',  nextStep: 'Review PDP, price, Buy Box, reviews',              ctaLabel: 'Open conversion diagnostic',   ctaRoute: 'Sales/Traffic',              tone: 'critical' },
  'Availability-led sales drop': { mode: 'growth-risk', nextStep: 'Restore Buy Box / fix stockouts',                 ctaLabel: 'Open inventory diagnostic',    ctaRoute: 'Inventory/Planner',          tone: 'critical' },
  'Price/mix issue':           { mode: 'growth-risk',  nextStep: 'Review pricing, discounts and product mix',         ctaLabel: 'Review pricing and discounts', ctaRoute: 'Profitability/Overview',     tone: 'warning' },
  'Acquisition weakness':      { mode: 'growth-risk',  nextStep: 'Review prospecting campaigns',                     ctaLabel: 'Review NTB performance',       ctaRoute: 'Advertising/Deepdive',       tone: 'warning' },
  'Retention weakness':        { mode: 'growth-risk',  nextStep: 'Review Subscribe & Save / repeat purchase',         ctaLabel: 'Review Subscribe & Save',      ctaRoute: 'Customer Experience/Subscriptions', tone: 'warning' },
  // Other
  'Protect winner':            { mode: 'winner',       nextStep: 'Defend share and monitor margin',                  ctaLabel: 'Monitor and defend share',     ctaRoute: 'Sales/Deepdive',             tone: 'info' },
  'Healthy':                   { mode: 'healthy',      nextStep: '',                                                  ctaLabel: '',                             ctaRoute: '',                           tone: 'neutral' },
};

// ── Detection thresholds (material change required to trigger) ───────────

const T = {
  salesPoPDown: -3,           // % — material sales drop
  salesPoPUp:    3,
  sessionsPoPDown: -5,
  cvrPoPDown: -3,
  cvrPoPUp:    3,
  pageViewsPoPUp:   5,
  pageViewsPoPDown: -5,
  avgPricePoPDown: -3,
  adSpendPoPUp:     5,
  roasPoPDown:     -5,
  tacosPoPUp:       8,        // For Ad-led growth risk
  discountsPoPUp:  15,        // For Discount-led growth risk
  channelMarginPoPDown: -2,
  productMarginPoPDown: -2,
  bboxWinRatePoPDown: -3,
  ntbOrdersPoPDown: -10,
  ssOrdersPoPDown: -10,
  // Protect winner thresholds
  protectMinSalesShare:   8,    // %
  protectMinChannelMargin: 25,  // % — a meaningful profit contributor
};

// ── Driver picker ────────────────────────────────────────────────────────

export interface Driver {
  label: string;
  field: keyof MetricFields;
  value: number;
}

type DriverDef = { field: keyof MetricFields; label: string };

function fmtDriver(def: DriverDef, value: number): string {
  // All *PoP fields are stored as % change in the demo data.
  const sign = value > 0 ? '+' : '';
  return `${def.label} ${sign}${value.toFixed(1)}%`;
}

function pickDrivers(row: MetricFields, candidates: DriverDef[]): Driver[] {
  const enriched = candidates
    .map((d) => ({ def: d, value: row[d.field] as number }))
    .filter((x) => typeof x.value === 'number' && Number.isFinite(x.value))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return enriched.slice(0, 2).map(({ def, value }) => ({
    field: def.field,
    label: fmtDriver(def, value),
    value,
  }));
}

const DRIVERS_BY_ISSUE: Record<IssueType, DriverDef[]> = {
  'Profit dilution':           [{ field: 'channelMarginPoP', label: 'Channel margin' }, { field: 'tacosPoP', label: 'TACOS' }, { field: 'discountsPoP', label: 'Discounts' }],
  'Margin risk':               [{ field: 'channelMarginPoP', label: 'Channel margin' }, { field: 'productMarginPoP', label: 'Product margin' }, { field: 'growthMarginPoP', label: 'Growth margin' }],
  'Ad efficiency issue':       [{ field: 'roasPoP', label: 'ROAS' },                    { field: 'acosPoP', label: 'ACOS' },                     { field: 'adSpendPoP', label: 'Ad Spend' }],
  'Ad-led growth risk':        [{ field: 'tacosPoP', label: 'TACOS' },                  { field: 'adSpendPoP', label: 'Ad Spend' },              { field: 'salesPoP', label: 'Sales' }],
  'Discount-led growth risk':  [{ field: 'discountsPoP', label: 'Discounts' },          { field: 'avgPricePoP', label: 'Avg price' },            { field: 'unitsPoP', label: 'Units' }],
  'Traffic-led sales drop':    [{ field: 'sessionsPoP', label: 'Sessions' },            { field: 'ordersPoP', label: 'Orders' },                 { field: 'pageViewsPoP', label: 'Page views' }],
  'Conversion-led sales drop': [{ field: 'cvrPoP', label: 'CVR' },                      { field: 'bboxWinRatePoP', label: 'Buy Box' },           { field: 'ordersPoP', label: 'Orders' }],
  'Availability-led sales drop': [{ field: 'bboxWinRatePoP', label: 'Buy Box' },        { field: 'ordersPoP', label: 'Orders' },                 { field: 'unitsPoP', label: 'Units' }],
  'Price/mix issue':           [{ field: 'discountsPoP', label: 'Discounts' },          { field: 'avgPricePoP', label: 'Avg price' },            { field: 'unitsPoP', label: 'Units' }],
  'Acquisition weakness':      [{ field: 'ntbOrdersPoP', label: 'NTB Orders' },         { field: 'ntbPctPoP', label: 'NTB %' }],
  'Retention weakness':        [{ field: 'ssOrdersPoP', label: 'S&S Orders' },          { field: 'ssPctPoP', label: 'S&S %' }],
  'Protect winner':            [{ field: 'salesPoP', label: 'Sales' },                  { field: 'channelMarginPoP', label: 'Channel margin' }],
  'Healthy': [],
};

// ── Classification ───────────────────────────────────────────────────────

interface RowSignals {
  salesDown: boolean;
  salesUp: boolean;
  salesFlat: boolean;
  sessionsDown: boolean;
  sessionsUp: boolean;
  cvrDown: boolean;
  cvrUp: boolean;
  pageViewsUp: boolean;
  pageViewsDown: boolean;
  avgPriceDown: boolean;
  adSpendUp: boolean;
  roasDown: boolean;
  tacosUp: boolean;
  discountsUp: boolean;
  channelMarginDown: boolean;
  productMarginDown: boolean;
  bboxDown: boolean;
  ntbDown: boolean;
  ssDown: boolean;
}

function deriveSignals(row: MetricFields): RowSignals {
  return {
    salesDown:          row.salesPoP <= T.salesPoPDown,
    salesUp:            row.salesPoP >= T.salesPoPUp,
    salesFlat:          row.salesPoP > T.salesPoPDown && row.salesPoP < T.salesPoPUp,
    sessionsDown:       row.sessionsPoP <= T.sessionsPoPDown,
    sessionsUp:         row.sessionsPoP > 0,
    cvrDown:            row.cvrPoP <= T.cvrPoPDown,
    cvrUp:              row.cvrPoP >= T.cvrPoPUp,
    pageViewsUp:        row.pageViewsPoP >= T.pageViewsPoPUp,
    pageViewsDown:      row.pageViewsPoP <= T.pageViewsPoPDown,
    avgPriceDown:       row.avgPricePoP <= T.avgPricePoPDown,
    adSpendUp:          row.adSpendPoP >= T.adSpendPoPUp,
    roasDown:           row.roasPoP <= T.roasPoPDown,
    tacosUp:            row.tacosPoP >= T.tacosPoPUp,
    discountsUp:        row.discountsPoP >= T.discountsPoPUp,
    channelMarginDown:  row.channelMarginPoP <= T.channelMarginPoPDown,
    productMarginDown:  row.productMarginPoP <= T.productMarginPoPDown,
    bboxDown:           row.bboxWinRatePoP <= T.bboxWinRatePoPDown,
    ntbDown:            row.ntbOrdersPoP <= T.ntbOrdersPoPDown,
    ssDown:             row.ssOrdersPoP <= T.ssOrdersPoPDown,
  };
}

export function classify(row: MetricFields): IssueType {
  const s = deriveSignals(row);

  // Sales-up paths first — profit-led prioritization
  if (s.salesUp) {
    if (s.channelMarginDown) return 'Profit dilution';
    if (s.tacosUp)            return 'Ad-led growth risk';
    if (s.discountsUp)        return 'Discount-led growth risk';
  }

  // Sales-down paths — pinpoint the driver
  if (s.salesDown) {
    if (s.bboxDown)                              return 'Availability-led sales drop';
    if (s.sessionsDown && !s.cvrDown)            return 'Traffic-led sales drop';
    if (!s.sessionsDown && s.cvrDown)            return 'Conversion-led sales drop';
    if (s.avgPriceDown || s.discountsUp)         return 'Price/mix issue';
    if (s.adSpendUp && s.roasDown)               return 'Ad efficiency issue';
    // Both sessions and CVR dropped — composite trouble; flag traffic
    // since it's the upstream lever.
    if (s.sessionsDown && s.cvrDown)             return 'Traffic-led sales drop';
    if (s.ntbDown)                               return 'Acquisition weakness';
    if (s.ssDown)                                return 'Retention weakness';
    return 'Conversion-led sales drop';
  }

  // Flat sales — surface efficiency and mix issues
  if (s.adSpendUp && s.tacosUp)        return 'Ad efficiency issue';
  if (s.channelMarginDown || s.productMarginDown) return 'Margin risk';
  if (s.ntbDown)                       return 'Acquisition weakness';
  if (s.ssDown)                        return 'Retention weakness';

  // Protect winner gate — needs share + margin AND not in decline
  if (
    row.salesShare >= T.protectMinSalesShare &&
    row.channelMargin >= T.protectMinChannelMargin &&
    row.channelMarginPoP >= 0 &&
    !s.salesDown
  ) {
    return 'Protect winner';
  }

  return 'Healthy';
}

// ── Impact (revenue + profit) ────────────────────────────────────────────
//
// revenueImpact = |prev_sales − current_sales| (gap-to-last-period).
// profitImpact  = direct margin € lost, calibrated to issue type.

function gapToPrev(current: number, popPct: number): number {
  if (!Number.isFinite(popPct) || popPct === 0) return 0;
  const denom = 1 + popPct / 100;
  if (Math.abs(denom) < 0.01) return Math.abs(current);
  const prev = current / denom;
  return Math.abs(prev - current);
}

export function computeRevenueImpact(row: MetricFields, issue: IssueType): number {
  switch (issue) {
    case 'Ad efficiency issue': {
      // Wasted spend equivalent in revenue terms
      return Math.round(gapToPrev(row.adSpend, row.adSpendPoP));
    }
    case 'Acquisition weakness': {
      const orderGap = gapToPrev(row.ntbOrders, row.ntbOrdersPoP);
      return Math.round(orderGap * row.avgPrice);
    }
    case 'Retention weakness': {
      const orderGap = gapToPrev(row.ssOrders, row.ssOrdersPoP);
      return Math.round(orderGap * row.avgPrice);
    }
    case 'Healthy':
    case 'Protect winner':
      return Math.round(gapToPrev(row.sales, row.salesPoP)); // informational only
    default:
      return Math.round(gapToPrev(row.sales, row.salesPoP));
  }
}

export function computeProfitImpact(row: MetricFields, issue: IssueType): number {
  const currentMarginPct = Math.max(0, row.channelMargin);   // % of sales
  const marginMultiplier = currentMarginPct / 100;

  switch (issue) {
    case 'Profit dilution':
    case 'Margin risk': {
      // Margin pp gap × current sales = € of margin lost
      const ppGap = Math.abs(row.channelMarginPoP);
      return Math.round((row.sales * ppGap) / 100);
    }
    case 'Ad efficiency issue': {
      // Extra ad spend = direct profit hit (€ wasted)
      return Math.round(gapToPrev(row.adSpend, row.adSpendPoP));
    }
    case 'Ad-led growth risk':
    case 'Discount-led growth risk': {
      // Sales grew but margin slipped — profit at risk is sales gained × margin shift
      const gainedSales = gapToPrev(row.sales, row.salesPoP);
      const marginShift = Math.max(0, Math.abs(row.channelMarginPoP)) / 100;
      // At least the margin slip on the new sales; if no margin drop, use TACOS-up as proxy
      const proxyHit = (row.sales * Math.abs(row.tacosPoP)) / 100 / 2;
      return Math.round(Math.max(gainedSales * marginShift, proxyHit));
    }
    case 'Acquisition weakness':
    case 'Retention weakness': {
      const revenue = computeRevenueImpact(row, issue);
      return Math.round(revenue * marginMultiplier);
    }
    case 'Traffic-led sales drop':
    case 'Conversion-led sales drop':
    case 'Availability-led sales drop':
    case 'Price/mix issue': {
      // Revenue lost × current channel margin = profit lost
      const revenue = gapToPrev(row.sales, row.salesPoP);
      return Math.round(revenue * marginMultiplier);
    }
    case 'Protect winner':
      // Profit at stake (positive contribution at risk if anything breaks)
      return Math.round((row.sales * marginMultiplier));
    case 'Healthy':
    default:
      return 0;
  }
}

// ── Confidence ───────────────────────────────────────────────────────────
//
// Count of supporting signals beyond the trigger:
//   2+ supporting → High
//   1 supporting  → Medium
//   0 supporting  → Low

function countSupporting(row: MetricFields, issue: IssueType): number {
  const s = deriveSignals(row);
  switch (issue) {
    case 'Traffic-led sales drop':
      return [s.salesDown, s.sessionsDown, !s.cvrDown, s.pageViewsDown, row.ordersPoP < -3].filter(Boolean).length;
    case 'Conversion-led sales drop':
      return [s.salesDown, s.cvrDown, !s.sessionsDown, s.bboxDown, row.ordersPoP < -3].filter(Boolean).length;
    case 'Availability-led sales drop':
      return [s.salesDown, s.bboxDown, row.ordersPoP < -3, s.sessionsDown].filter(Boolean).length;
    case 'Profit dilution':
      return [s.salesUp, s.channelMarginDown, s.productMarginDown, row.growthMarginPoP < -2].filter(Boolean).length;
    case 'Margin risk':
      return [s.channelMarginDown, s.productMarginDown, row.growthMarginPoP < -2, row.netProfitPerUnitPoP < -3].filter(Boolean).length;
    case 'Ad-led growth risk':
      return [s.salesUp, s.tacosUp, s.adSpendUp, s.roasDown].filter(Boolean).length;
    case 'Discount-led growth risk':
      return [s.salesUp, s.discountsUp, s.avgPriceDown, row.unitsPoP > 0].filter(Boolean).length;
    case 'Ad efficiency issue':
      return [s.adSpendUp, s.roasDown, s.tacosUp, row.acosPoP > 5].filter(Boolean).length;
    case 'Price/mix issue':
      return [s.avgPriceDown, s.discountsUp, s.salesDown, row.unitsPoP > 0].filter(Boolean).length;
    case 'Acquisition weakness':
      return [s.ntbDown, row.ntbPctPoP < -2, s.salesDown].filter(Boolean).length;
    case 'Retention weakness':
      return [s.ssDown, row.ssPctPoP < -2, s.salesDown].filter(Boolean).length;
    case 'Protect winner':
      return [row.salesShare >= T.protectMinSalesShare, row.channelMargin >= T.protectMinChannelMargin, row.channelMarginPoP >= 0, !s.salesDown].filter(Boolean).length;
    default:
      return 0;
  }
}

export function computeConfidence(row: MetricFields, issue: IssueType): Confidence {
  if (issue === 'Healthy') return 'High';
  const n = countSupporting(row, issue);
  if (n >= 3) return 'High';
  if (n === 2) return 'Medium';
  return 'Low';
}

const CONFIDENCE_MULTIPLIER: Record<Confidence, number> = {
  High:   1.0,
  Medium: 0.7,
  Low:    0.4,
};

// ── Severity (sortable key) + severity level (bucket) ────────────────────

export function computeSeverity(profitImpact: number, revenueImpact: number, conf: Confidence): number {
  const base = Math.abs(profitImpact) > 0 ? Math.abs(profitImpact) : Math.abs(revenueImpact) * 0.2;
  return Math.round(base * CONFIDENCE_MULTIPLIER[conf]);
}

export function severityLevelFromProfit(profitImpact: number, issue: IssueType): SeverityLevel {
  if (issue === 'Healthy') return 'None';
  if (issue === 'Protect winner') return 'Watch';
  const abs = Math.abs(profitImpact);
  if (abs >= 20_000) return 'Critical';
  if (abs >= 5_000)  return 'High';
  if (abs >= 1_000)  return 'Medium';
  if (abs > 0)        return 'Watch';
  return 'None';
}

// ── Entity diagnostic builder ────────────────────────────────────────────

export type EntityKind = 'marketplace' | 'category' | 'asin';

export interface Diagnostic {
  kind: EntityKind;
  name: string;
  subLabel?: string;
  key: string;
  issue: IssueType;
  mode: DecisionMode;
  confidence: Confidence;
  severity: number;
  severityLevel: SeverityLevel;
  revenueImpact: number;
  profitImpact: number;
  primary: Driver | null;
  secondary: Driver | null;
  row: MetricFields & Record<string, unknown>;
}

function buildDiagnostic(
  kind: EntityKind,
  name: string,
  key: string,
  row: MetricFields & Record<string, unknown>,
  subLabel?: string,
): Diagnostic {
  const issue = classify(row);
  const meta = ISSUE_META[issue];
  const drivers = pickDrivers(row, DRIVERS_BY_ISSUE[issue]);
  const revenueImpact = computeRevenueImpact(row, issue);
  const profitImpact  = computeProfitImpact(row, issue);
  const confidence    = computeConfidence(row, issue);
  const severity      = computeSeverity(profitImpact, revenueImpact, confidence);
  const severityLevel = severityLevelFromProfit(profitImpact, issue);
  return {
    kind, name, subLabel, key,
    issue,
    mode: meta.mode,
    confidence,
    severity,
    severityLevel,
    revenueImpact,
    profitImpact,
    primary:   drivers[0] ?? null,
    secondary: drivers[1] ?? null,
    row,
  };
}

export const marketplaceDiagnostics: Diagnostic[] = (marketplaceData as MarketplaceRow[]).map((r) =>
  buildDiagnostic('marketplace', r.marketplace, `mp:${r.marketplace}`, r),
);
export const categoryDiagnostics: Diagnostic[] = (categoryData as CategoryRow[]).map((r) =>
  buildDiagnostic('category', r.category, `cat:${r.category}`, r),
);
export const asinDiagnostics: Diagnostic[] = (asinData as AsinRow[]).map((r) =>
  buildDiagnostic('asin', r.asin, `asin:${r.asin}`, r, r.title),
);

/** All diagnostics across every entity kind. */
export const allDiagnostics: Diagnostic[] = [
  ...marketplaceDiagnostics,
  ...categoryDiagnostics,
  ...asinDiagnostics,
];

// ── Top-issues feed (drives the IssuesPanel) ─────────────────────────────

export const topIssues: Diagnostic[] = (() => {
  return allDiagnostics
    .filter((d) => d.issue !== 'Healthy' && d.issue !== 'Protect winner')
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 5);
})();

// ── Decision-mode tabs + ranking helpers ─────────────────────────────────

export type RankKey = 'profit' | 'revenue' | 'severity' | 'sales';

export const RANK_OPTIONS: { id: RankKey; label: string }[] = [
  { id: 'profit',   label: 'Profit impact' },
  { id: 'revenue',  label: 'Sales impact' },
  { id: 'severity', label: 'Severity' },
  { id: 'sales',    label: 'Sales change' },
];

export function sortByRank(diagnostics: Diagnostic[], rank: RankKey): Diagnostic[] {
  const arr = [...diagnostics];
  arr.sort((a, b) => {
    // Healthy and Protect winner are pushed to bottom by default
    const aBottom = a.issue === 'Healthy';
    const bBottom = b.issue === 'Healthy';
    if (aBottom && !bBottom) return 1;
    if (!aBottom && bBottom) return -1;
    switch (rank) {
      case 'profit':   return Math.abs(b.profitImpact)  - Math.abs(a.profitImpact);
      case 'revenue':  return Math.abs(b.revenueImpact) - Math.abs(a.revenueImpact);
      case 'severity': return b.severity - a.severity;
      case 'sales':    return a.row.salesPoP - b.row.salesPoP; // most negative first
    }
  });
  return arr;
}

export const MODE_TABS: { id: DecisionMode | 'all-issues'; label: string }[] = [
  { id: 'profit-risk', label: 'Profit risks' },
  { id: 'growth-risk', label: 'Growth risks' },
  { id: 'winner',      label: 'Protect winners' },
  { id: 'all-issues',  label: 'All issues' },
];

export function matchesMode(d: Diagnostic, mode: DecisionMode | 'all-issues'): boolean {
  if (mode === 'all-issues') return d.issue !== 'Healthy';
  if (mode === 'winner')     return d.issue === 'Protect winner';
  return d.mode === mode;
}

// ── Style maps ───────────────────────────────────────────────────────────

export const SEVERITY_STYLE: Record<SeverityLevel, { chip: string; dot: string; label: string }> = {
  Critical: { chip: 'bg-rose-100 text-rose-800 border-rose-300',       dot: 'bg-rose-600',     label: 'Critical' },
  High:     { chip: 'bg-rose-50 text-rose-700 border-rose-200',        dot: 'bg-rose-500',     label: 'High' },
  Medium:   { chip: 'bg-amber-50 text-amber-700 border-amber-200',     dot: 'bg-amber-500',    label: 'Medium' },
  Watch:    { chip: 'bg-sky-50 text-sky-700 border-sky-200',           dot: 'bg-sky-500',      label: 'Watch' },
  None:     { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Healthy' },
};

export const CONFIDENCE_STYLE: Record<Confidence, string> = {
  High:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low:    'bg-gray-100 text-gray-600 border-gray-200',
};

export const ISSUE_STYLE: Record<IssueType, { chip: string }> = {
  'Profit dilution':            { chip: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Margin risk':                { chip: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Ad efficiency issue':        { chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Ad-led growth risk':         { chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Discount-led growth risk':   { chip: 'bg-pink-50 text-pink-700 border-pink-200' },
  'Traffic-led sales drop':     { chip: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Conversion-led sales drop':  { chip: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Availability-led sales drop':{ chip: 'bg-red-50 text-red-700 border-red-200' },
  'Price/mix issue':            { chip: 'bg-pink-50 text-pink-700 border-pink-200' },
  'Acquisition weakness':       { chip: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'Retention weakness':         { chip: 'bg-violet-50 text-violet-700 border-violet-200' },
  'Protect winner':             { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Healthy':                    { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const ENTITY_KIND_LABEL: Record<EntityKind, string> = {
  marketplace: 'Marketplace',
  category:    'Category',
  asin:        'ASIN',
};

export function diagnosticsFor(kind: EntityKind | 'all'): Diagnostic[] {
  if (kind === 'all')         return allDiagnostics;
  if (kind === 'marketplace') return marketplaceDiagnostics;
  if (kind === 'category')    return categoryDiagnostics;
  return asinDiagnostics;
}
