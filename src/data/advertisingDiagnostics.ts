// ─── Advertising Diagnostics ──────────────────────────────────────────────
// Deterministic classifier for every Advertising entity (Campaign /
// Ad group / Placement / Campaign type / Product / Search term / Keyword).
// Each diagnostic carries:
//   decision     — Scale / Fix / Pause / Waste / Monitor / Protect
//   issueType    — High ACOS, CPC inflation, Spend without sales, …
//   confidence   — High / Medium / Low (signal count)
//   severity     — sort key, blends spend-at-risk × confidence
//   sevLevel     — Critical / High / Medium / Watch
//   revenueImpact — € of waste / lost sales, depending on decision
//   primary / secondary drivers
//   nextStep + ctaLabel + ctaRoute
//
// Targets (configurable per account when wired). The wireframe uses a
// single brand-wide default so the demo is internally consistent.

import { campaignData, placementRows, searchTermData, audienceRows, adTypeRows } from './advertisingDeepdiveData';
import type { CampaignRow, PlacementRow, SearchTermRow, AudienceRow, AdTypeRow } from './advertisingDeepdiveData';
import { adByASIN, adByMarketplace, adByBrand } from './advertisingData';
import type { AdPerfRow } from './advertisingData';

// ── Targets / thresholds ─────────────────────────────────────────────────

export const TARGETS = {
  acos:           30,    // %  — ACOS target
  breakEvenAcos:  45,    // %  — past this, spend is unprofitable
  tacos:          15,    // %  — TACOS target
  significantPpDelta: 5, // %  — "significant" PoP change for CPC / CVR / CTR
  highSpend:      5_000, // €  — material spend on a single entity
  noSalesSpend:   1_000, // €  — spend > this with 0 orders → waste
  highShare:      8,     // %  — entity is meaningful to total business
};

// ── Decision + issue taxonomy ────────────────────────────────────────────

export type Decision = 'Scale' | 'Fix' | 'Pause' | 'Waste' | 'Monitor' | 'Protect';

export type IssueType =
  | 'High ACOS'
  | 'High TACOS'
  | 'CPC inflation'
  | 'CTR decline'
  | 'CVR decline'
  | 'Spend without sales'
  | 'Budget limited'
  | 'Low impressions'
  | 'Low conversion'
  | 'Product readiness issue'
  | 'Placement inefficiency'
  | 'Search term waste'
  | 'Profitable scaling opportunity'
  | 'High ad dependency'
  | 'Healthy';

export type EntityKind =
  | 'campaign'
  | 'placement'
  | 'campaignType'
  | 'product'
  | 'searchTerm'
  | 'keyword'
  | 'adGroup';

export type Confidence = 'High' | 'Medium' | 'Low';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Watch' | 'None';

export interface DecisionMeta {
  tone: 'critical' | 'warning' | 'good' | 'neutral' | 'info';
  description: string;
}

export const DECISION_META: Record<Decision, DecisionMeta> = {
  Scale:   { tone: 'good',     description: 'ACOS healthy, conversion stable or improving — push budget / bids.' },
  Fix:     { tone: 'warning',  description: 'High spend with ACOS above target — bid / targeting work needed.' },
  Pause:   { tone: 'critical', description: 'Material spend, zero orders — pause or add negatives.' },
  Waste:   { tone: 'critical', description: 'Spend well past break-even ACOS — every € lost.' },
  Monitor: { tone: 'info',     description: 'Low data volume or mixed signals — keep watching.' },
  Protect: { tone: 'good',     description: 'High contribution + healthy efficiency — defend, don\'t starve.' },
};

export const DECISION_STYLE: Record<Decision, { chip: string; dot: string }> = {
  Scale:   { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Fix:     { chip: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  Pause:   { chip: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500'    },
  Waste:   { chip: 'bg-rose-100 text-rose-800 border-rose-300',         dot: 'bg-rose-600'    },
  Monitor: { chip: 'bg-slate-50 text-slate-700 border-slate-200',       dot: 'bg-slate-500'   },
  Protect: { chip: 'bg-cx-50 text-cx-700 border-cx-200',                dot: 'bg-cx-500'      },
};

export const ISSUE_STYLE: Record<IssueType, string> = {
  'High ACOS':                      'bg-rose-50 text-rose-700 border-rose-200',
  'High TACOS':                     'bg-rose-50 text-rose-700 border-rose-200',
  'CPC inflation':                  'bg-amber-50 text-amber-700 border-amber-200',
  'CTR decline':                    'bg-amber-50 text-amber-700 border-amber-200',
  'CVR decline':                    'bg-orange-50 text-orange-700 border-orange-200',
  'Spend without sales':            'bg-rose-100 text-rose-800 border-rose-300',
  'Budget limited':                 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Low impressions':                'bg-slate-50 text-slate-700 border-slate-200',
  'Low conversion':                 'bg-orange-50 text-orange-700 border-orange-200',
  'Product readiness issue':        'bg-pink-50 text-pink-700 border-pink-200',
  'Placement inefficiency':         'bg-amber-50 text-amber-700 border-amber-200',
  'Search term waste':              'bg-rose-50 text-rose-700 border-rose-200',
  'Profitable scaling opportunity': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'High ad dependency':             'bg-violet-50 text-violet-700 border-violet-200',
  'Healthy':                        'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const SEVERITY_STYLE: Record<SeverityLevel, { chip: string; dot: string; label: string }> = {
  Critical: { chip: 'bg-rose-100 text-rose-800 border-rose-300',         dot: 'bg-rose-600',    label: 'Critical' },
  High:     { chip: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500',    label: 'High' },
  Medium:   { chip: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   label: 'Medium' },
  Watch:    { chip: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500',     label: 'Watch' },
  None:     { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Healthy' },
};

export const CONFIDENCE_STYLE: Record<Confidence, string> = {
  High:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low:    'bg-gray-100 text-gray-600 border-gray-200',
};

// ── Issue → next step + CTA mapping (per the spec) ───────────────────────

export const ISSUE_CTA: Record<IssueType, { nextStep: string; ctaLabel: string; ctaRoute: string }> = {
  'High ACOS':                      { nextStep: 'Reduce bids or review targeting',                     ctaLabel: 'Reduce bid',           ctaRoute: 'Advertising/Diagnostics' },
  'High TACOS':                     { nextStep: 'Check ad dependency and profitability',               ctaLabel: 'Check profitability',  ctaRoute: 'Profitability/Overview' },
  'CPC inflation':                  { nextStep: 'Review bids and competition',                         ctaLabel: 'Review bids',          ctaRoute: 'Advertising/Diagnostics' },
  'CTR decline':                    { nextStep: 'Review creative, title, main image, and targeting',   ctaLabel: 'Review creative',      ctaRoute: 'Advertising/Diagnostics' },
  'CVR decline':                    { nextStep: 'Check PDP, price, reviews, Buy Box, and delivery',    ctaLabel: 'Open conversion check', ctaRoute: 'Sales/Traffic' },
  'Spend without sales':            { nextStep: 'Pause or add negative keywords',                       ctaLabel: 'Pause or negate',      ctaRoute: 'Advertising/Diagnostics' },
  'Budget limited':                 { nextStep: 'Increase budget if profitable',                       ctaLabel: 'Increase budget',      ctaRoute: 'Advertising/Budget & Pacing' },
  'Low impressions':                { nextStep: 'Raise bids or expand match types',                    ctaLabel: 'Review reach',         ctaRoute: 'Advertising/Diagnostics' },
  'Low conversion':                 { nextStep: 'Check PDP, price, Buy Box and reviews',               ctaLabel: 'Open conversion check', ctaRoute: 'Sales/Traffic' },
  'Product readiness issue':        { nextStep: 'Fix ASIN before scaling ads',                          ctaLabel: 'Fix PDP first',        ctaRoute: 'Sales/Traffic' },
  'Placement inefficiency':         { nextStep: 'Adjust placement multiplier',                          ctaLabel: 'Adjust multiplier',    ctaRoute: 'Advertising/Diagnostics' },
  'Search term waste':              { nextStep: 'Add negative keyword',                                 ctaLabel: 'Add negative keyword', ctaRoute: 'Advertising/Diagnostics' },
  'Profitable scaling opportunity': { nextStep: 'Increase budget or bids',                              ctaLabel: 'Increase budget',      ctaRoute: 'Advertising/Budget & Pacing' },
  'High ad dependency':             { nextStep: 'Check profitability and organic mix',                   ctaLabel: 'Check profitability',  ctaRoute: 'Profitability/Overview' },
  'Healthy':                        { nextStep: '',                                                     ctaLabel: '',                      ctaRoute: '' },
};

// ── Normalised row shape used by the classifier ──────────────────────────

export interface AdEntityRow {
  kind: EntityKind;
  name: string;
  subLabel?: string;       // Match type for search terms, type for campaigns, etc.
  key: string;
  spend: number;
  spendPoP: number;
  sales: number;
  salesPoP: number;
  orders: number;
  ordersPoP: number;
  acos: number;
  acosPoP: number;
  cvr: number;
  cvrPoP: number;
  ctr: number;
  ctrPoP: number;
  cpc: number;
  cpcPoP: number;
  roas: number;            // derived if not present
  tacos: number;           // 0 if unknown
  status?: 'Enabled' | 'Paused';
  // Product-specific (optional)
  buyBoxPct?: number;
  rating?: number;
  inventoryDays?: number;
  totalSales?: number;
}

// ── Classification ───────────────────────────────────────────────────────

export interface Diagnostic {
  row: AdEntityRow;
  decision: Decision;
  issue: IssueType;
  confidence: Confidence;
  severity: number;
  sevLevel: SeverityLevel;
  /** € of waste (Pause / Waste / Fix) or recoverable revenue (Scale / Protect). */
  revenueImpact: number;
  primary: string | null;
  secondary: string | null;
  /** Profitability flag — true when ACOS exceeds break-even. */
  unprofitable: boolean;
  /** Short "why is this classified this way" phrase shown on decision cards. */
  reason: string;
  /** Natural-language "Because X" sentence used on decision cards. */
  because: string;
  /** Optional counter-signal ("Watch: CVR declined -2%"). null when there's no
   *  conflicting signal worth surfacing. */
  watch: string | null;
  /** 2-3 metric snapshots that justify the diagnosis. */
  evidence: string[];
  /** Display label for severity that adapts to risk vs opportunity decisions. */
  severityLabel: string;
}

interface RowSignals {
  highSpend: boolean;
  noOrders: boolean;
  acosAboveTarget: boolean;
  acosAboveBreakEven: boolean;
  acosUnderTarget: boolean;
  tacosHigh: boolean;
  cpcUp: boolean;
  ctrDown: boolean;
  cvrDown: boolean;
  cvrUp: boolean;
  cvrStable: boolean;
  lowImpr: boolean;
  highShare: boolean;
  productReadiness: boolean;
}

function deriveSignals(r: AdEntityRow): RowSignals {
  const productReadiness =
    (r.buyBoxPct !== undefined && r.buyBoxPct < 85) ||
    (r.rating !== undefined && r.rating < 4.0) ||
    (r.inventoryDays !== undefined && r.inventoryDays < 14);

  return {
    highSpend:           r.spend >= TARGETS.highSpend,
    noOrders:            r.orders === 0,
    acosAboveTarget:     r.acos > TARGETS.acos,
    acosAboveBreakEven:  r.acos > TARGETS.breakEvenAcos,
    acosUnderTarget:     r.acos > 0 && r.acos <= TARGETS.acos,
    tacosHigh:           r.tacos > TARGETS.tacos,
    cpcUp:               r.cpcPoP >= TARGETS.significantPpDelta,
    ctrDown:             r.ctrPoP <= -TARGETS.significantPpDelta,
    cvrDown:             r.cvrPoP <= -TARGETS.significantPpDelta,
    cvrUp:               r.cvrPoP >= TARGETS.significantPpDelta,
    cvrStable:           r.cvrPoP > -TARGETS.significantPpDelta && r.cvrPoP < TARGETS.significantPpDelta,
    lowImpr:             r.spend > 0 && r.spend < TARGETS.highSpend / 10,  // proxy
    highShare:           r.totalSales !== undefined && r.spend > 0 && (r.spend / r.totalSales) * 100 >= TARGETS.highShare,
    productReadiness,
  };
}

export function classify(r: AdEntityRow): { decision: Decision; issue: IssueType } {
  const s = deriveSignals(r);

  // Pause — material spend, zero orders
  if (s.highSpend && s.noOrders) return { decision: 'Pause', issue: 'Spend without sales' };

  // Product readiness blocks scaling even if ACOS is fine
  if (r.kind === 'product' && s.productReadiness) {
    return { decision: 'Fix', issue: 'Product readiness issue' };
  }

  // Waste — spend well past break-even
  if (s.highSpend && s.acosAboveBreakEven) return { decision: 'Waste', issue: 'High ACOS' };

  // Fix — high spend, ACOS over target but still earning some orders
  if (s.highSpend && s.acosAboveTarget && !s.noOrders) {
    if (s.cpcUp)  return { decision: 'Fix', issue: 'CPC inflation' };
    if (s.cvrDown) return { decision: 'Fix', issue: 'CVR decline' };
    if (s.ctrDown) return { decision: 'Fix', issue: 'CTR decline' };
    if (s.tacosHigh) return { decision: 'Fix', issue: 'High TACOS' };
    return { decision: 'Fix', issue: 'High ACOS' };
  }

  // Scale — ACOS healthy, conversion stable or improving
  if (s.acosUnderTarget && (s.cvrStable || s.cvrUp)) {
    if (s.highShare) return { decision: 'Protect', issue: 'Healthy' };
    return { decision: 'Scale', issue: 'Profitable scaling opportunity' };
  }

  // Protect — material share, healthy ACOS, TACOS stable
  if (s.highShare && r.acos > 0 && r.acos <= TARGETS.acos) {
    return { decision: 'Protect', issue: 'Healthy' };
  }

  // Monitor — low spend or signal noise
  if (r.spend < TARGETS.highSpend / 5) return { decision: 'Monitor', issue: 'Low impressions' };
  if (s.cvrDown) return { decision: 'Monitor', issue: 'CVR decline' };
  if (s.ctrDown) return { decision: 'Monitor', issue: 'CTR decline' };

  return { decision: 'Monitor', issue: 'Healthy' };
}

// ── Confidence ───────────────────────────────────────────────────────────

function countSupporting(r: AdEntityRow, decision: Decision, issue: IssueType): number {
  const s = deriveSignals(r);
  let n = 0;

  switch (decision) {
    case 'Scale':
      if (s.acosUnderTarget) n++;
      if (s.cvrStable || s.cvrUp) n++;
      if (r.roas >= 3) n++;
      if (r.salesPoP > 0) n++;
      break;
    case 'Fix':
      if (s.highSpend) n++;
      if (s.acosAboveTarget) n++;
      if (s.cpcUp) n++;
      if (s.cvrDown) n++;
      if (s.ctrDown) n++;
      break;
    case 'Pause':
      if (s.noOrders) n++;
      if (s.highSpend) n++;
      if (r.spendPoP > 0) n++;
      break;
    case 'Waste':
      if (s.acosAboveBreakEven) n++;
      if (s.highSpend) n++;
      if (s.cpcUp) n++;
      if (s.cvrDown) n++;
      break;
    case 'Protect':
      if (s.highShare) n++;
      if (s.acosUnderTarget) n++;
      if (!s.cvrDown) n++;
      if (r.salesPoP > 0) n++;
      break;
    case 'Monitor':
      n = 1;
      break;
  }
  if (issue === 'Healthy') n = 1; // Healthy is a fallback, treat as Medium-baseline

  return n;
}

export function computeConfidence(r: AdEntityRow, decision: Decision, issue: IssueType): Confidence {
  const n = countSupporting(r, decision, issue);
  if (n >= 3) return 'High';
  if (n === 2) return 'Medium';
  return 'Low';
}

// ── Impact + severity ────────────────────────────────────────────────────

/**
 * Revenue impact framing per decision:
 *   - Pause / Waste:  full spend is at risk → impact = spend
 *   - Fix:            wasted spend = portion above target ACOS
 *   - Scale / Protect: recoverable revenue if budget lifted (proxy)
 *   - Monitor:        0
 */
export function computeRevenueImpact(r: AdEntityRow, decision: Decision): number {
  switch (decision) {
    case 'Pause':
    case 'Waste':
      return Math.round(r.spend);
    case 'Fix': {
      // Above-target portion of spend that's currently inefficient.
      if (r.acos <= 0 || r.acos <= TARGETS.acos) return 0;
      const wastedShare = (r.acos - TARGETS.acos) / r.acos;
      return Math.round(r.spend * wastedShare);
    }
    case 'Scale':
    case 'Protect':
      // Conservative proxy: 20% of current sales is the upside if scaled / defended.
      return Math.round(r.sales * 0.2);
    default:
      return 0;
  }
}

const CONFIDENCE_MULTIPLIER: Record<Confidence, number> = { High: 1.0, Medium: 0.7, Low: 0.4 };

export function computeSeverity(impact: number, conf: Confidence): number {
  return Math.round(Math.abs(impact) * CONFIDENCE_MULTIPLIER[conf]);
}

export function severityLevelFromImpact(impact: number, decision: Decision): SeverityLevel {
  if (decision === 'Monitor') return 'Watch';
  if (decision === 'Protect') return 'Watch';
  const abs = Math.abs(impact);
  if (abs >= 20_000) return 'Critical';
  if (abs >= 5_000)  return 'High';
  if (abs >= 1_000)  return 'Medium';
  if (abs > 0)        return 'Watch';
  return 'None';
}

// ── Driver extraction ────────────────────────────────────────────────────

function pickDrivers(r: AdEntityRow, decision: Decision): { primary: string | null; secondary: string | null } {
  const fmt = (label: string, value: number, unit: '%' | 'pp' = '%') => {
    const sign = value > 0 ? '+' : '';
    return `${label} ${sign}${value.toFixed(1)}${unit}`;
  };
  const candidates: { label: string; value: number; rank: number }[] = [];

  // Decision-specific candidate set
  if (decision === 'Pause' || decision === 'Waste') {
    candidates.push({ label: 'Spend', value: r.spendPoP, rank: 1 });
    candidates.push({ label: 'Orders', value: r.ordersPoP, rank: 2 });
  } else if (decision === 'Fix') {
    candidates.push({ label: 'CPC', value: r.cpcPoP, rank: 1 });
    candidates.push({ label: 'CVR', value: r.cvrPoP, rank: 1 });
    candidates.push({ label: 'CTR', value: r.ctrPoP, rank: 2 });
    candidates.push({ label: 'ACOS', value: r.acosPoP, rank: 1 });
  } else if (decision === 'Scale' || decision === 'Protect') {
    candidates.push({ label: 'ACOS', value: r.acosPoP, rank: 1 });
    candidates.push({ label: 'Sales', value: r.salesPoP, rank: 1 });
    candidates.push({ label: 'CVR', value: r.cvrPoP, rank: 2 });
  } else {
    candidates.push({ label: 'Spend', value: r.spendPoP, rank: 1 });
    candidates.push({ label: 'ACOS', value: r.acosPoP, rank: 2 });
  }

  const sorted = candidates
    .filter((c) => Number.isFinite(c.value))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return {
    primary:   sorted[0] ? fmt(sorted[0].label, sorted[0].value) : null,
    secondary: sorted[1] ? fmt(sorted[1].label, sorted[1].value) : null,
  };
}

// ── Reason / evidence / severity label ───────────────────────────────────

const REASON_BY: Record<Decision, (r: AdEntityRow, issue: IssueType) => string> = {
  Scale:   () => 'Profitable, room to scale',
  Fix:     (_, issue) => issue === 'CPC inflation' ? 'CPC up while ACOS over target'
                       : issue === 'CVR decline'    ? 'Conversion declining at high spend'
                       : issue === 'CTR decline'    ? 'CTR collapsed — creative / targeting fatigue'
                       : 'Above-target ACOS at material spend',
  Pause:   () => 'Material spend, zero orders',
  Waste:   () => 'Spend past break-even ACOS',
  Protect: () => 'Top contributor — healthy efficiency',
  Monitor: () => 'Signal mixed or volume too low to act',
};

/** Natural-language "Because X" sentence per decision — used on cards. */
function becauseFor(r: AdEntityRow, decision: Decision): string {
  const acosPart = r.acos > 0 ? `ACOS is ${r.acos.toFixed(1)}%` : 'ACOS data is limited';
  switch (decision) {
    case 'Scale':
      return `Because ${acosPart} (below the ${TARGETS.acos}% target) and conversion has held.`;
    case 'Fix': {
      const movers: string[] = [];
      if (r.cpcPoP >= TARGETS.significantPpDelta) movers.push(`CPC is +${r.cpcPoP.toFixed(1)}% PoP`);
      if (r.cvrPoP <= -TARGETS.significantPpDelta) movers.push(`CVR is ${r.cvrPoP.toFixed(1)}% PoP`);
      if (r.ctrPoP <= -TARGETS.significantPpDelta) movers.push(`CTR is ${r.ctrPoP.toFixed(1)}% PoP`);
      const tail = movers.length > 0 ? ` while ${movers.slice(0, 2).join(' and ')}` : '';
      return `Because ${acosPart} (above the ${TARGETS.acos}% target)${tail}.`;
    }
    case 'Pause':
      return `Because €${Math.round(r.spend).toLocaleString()} of spend produced 0 orders this period.`;
    case 'Waste':
      return `Because ${acosPart} — past the ${TARGETS.breakEvenAcos}% break-even — on €${Math.round(r.spend).toLocaleString()} of spend.`;
    case 'Protect':
      return `Because this entity contributes meaningfully and ${acosPart} (within target).`;
    case 'Monitor':
    default:
      return `Because volume is below the action threshold or signals conflict.`;
  }
}

/** Counter-signal worth flagging on the card. Returns null when there's no
 *  conflict worth showing. */
function watchFor(r: AdEntityRow, decision: Decision): string | null {
  switch (decision) {
    case 'Scale':
    case 'Protect': {
      if (r.cvrPoP <= -2) return `Watch: CVR declined ${r.cvrPoP.toFixed(1)}% PoP.`;
      if (r.ctrPoP <= -2) return `Watch: CTR declined ${r.ctrPoP.toFixed(1)}% PoP.`;
      if (r.acosPoP >= 5) return `Watch: ACOS up +${r.acosPoP.toFixed(1)}% PoP.`;
      return null;
    }
    case 'Fix': {
      if (r.salesPoP >= 5) return `Watch: ad sales still +${r.salesPoP.toFixed(1)}% PoP despite the issue.`;
      return null;
    }
    case 'Waste':
    case 'Pause': {
      if (r.spendPoP < 0) return `Watch: spend already trending down ${r.spendPoP.toFixed(1)}% PoP.`;
      return null;
    }
    case 'Monitor':
    default:
      return null;
  }
}

function evidenceFor(r: AdEntityRow, decision: Decision): string[] {
  const out: string[] = [];
  const acosVs = r.acos === 0 ? '—' : `${r.acos.toFixed(1)}% vs ${TARGETS.acos}% target`;
  const cvrDir = r.cvrPoP === 0 ? 'stable' : r.cvrPoP > 0 ? `up ${r.cvrPoP.toFixed(1)}%` : `down ${Math.abs(r.cvrPoP).toFixed(1)}%`;
  const cpcDir = r.cpcPoP === 0 ? 'stable' : r.cpcPoP > 0 ? `up ${r.cpcPoP.toFixed(1)}%` : `down ${Math.abs(r.cpcPoP).toFixed(1)}%`;

  switch (decision) {
    case 'Scale':
      out.push(`ACOS ${acosVs}`);
      out.push(`CVR ${cvrDir}`);
      out.push(`Spend headroom available`);
      break;
    case 'Fix':
      out.push(`ACOS ${acosVs}`);
      out.push(`CVR ${cvrDir}`);
      out.push(`CPC ${cpcDir}`);
      break;
    case 'Pause':
      out.push(`Spend €${Math.round(r.spend).toLocaleString()} with 0 orders`);
      out.push(`CTR ${r.ctr.toFixed(2)}%, CVR ${r.cvr.toFixed(1)}%`);
      break;
    case 'Waste':
      out.push(`ACOS ${r.acos.toFixed(1)}% > break-even ${TARGETS.breakEvenAcos}%`);
      out.push(`Spend €${Math.round(r.spend).toLocaleString()}`);
      out.push(`CPC ${cpcDir}`);
      break;
    case 'Protect':
      out.push(`ACOS ${acosVs}`);
      out.push(`Material share of total spend`);
      out.push(`CVR ${cvrDir}`);
      break;
    case 'Monitor':
      out.push(`Spend €${Math.round(r.spend).toLocaleString()} below action threshold`);
      break;
  }
  return out;
}

/** Adapts severity-level into "risk" or "opportunity" language so Scale
 *  decisions don't read as "Critical". Spec rule 5. */
export function formatSeverityLabel(decision: Decision, sevLevel: SeverityLevel): string {
  const isOpportunity = decision === 'Scale' || decision === 'Protect';
  const base = SEVERITY_STYLE[sevLevel].label;
  if (sevLevel === 'None' || sevLevel === 'Watch') {
    return isOpportunity ? 'Low opportunity' : `${base}`;
  }
  if (isOpportunity) {
    // Critical doesn't exist for opportunity — clamp to "High"
    const oppLevel = sevLevel === 'Critical' ? 'High' : base;
    return `${oppLevel} opportunity`;
  }
  return `${base} risk`;
}

// ── Main builder ─────────────────────────────────────────────────────────

export function buildDiagnostic(r: AdEntityRow): Diagnostic {
  const { decision, issue } = classify(r);
  const confidence = computeConfidence(r, decision, issue);
  const revenueImpact = computeRevenueImpact(r, decision);
  const severity = computeSeverity(revenueImpact, confidence);
  const sevLevel = severityLevelFromImpact(revenueImpact, decision);
  const drivers = pickDrivers(r, decision);
  const reason = REASON_BY[decision](r, issue);
  const because = becauseFor(r, decision);
  const watch = watchFor(r, decision);
  const evidence = evidenceFor(r, decision);
  const severityLabel = formatSeverityLabel(decision, sevLevel);
  return {
    row: r,
    decision,
    issue,
    confidence,
    severity,
    sevLevel,
    revenueImpact,
    primary: drivers.primary,
    secondary: drivers.secondary,
    unprofitable: r.acos > TARGETS.breakEvenAcos,
    reason,
    because,
    watch,
    evidence,
    severityLabel,
  };
}

// ── Adapters from existing data sources → AdEntityRow ────────────────────

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

export const campaignDiagnostics: Diagnostic[] = campaignData.map((c: CampaignRow, i) => {
  const roas = safeDiv(c.sales, c.spend);
  const cpc  = safeDiv(c.spend, c.clicks);
  const totalSales = campaignData.reduce((s, x) => s + x.sales, 0);
  const row: AdEntityRow = {
    kind: 'campaign',
    name: c.campaign,
    subLabel: c.type,
    key: `camp:${i}`,
    spend: c.spend,
    spendPoP: c.spendPoP,
    sales: c.sales,
    salesPoP: c.salesPoP,
    orders: c.orders,
    ordersPoP: c.ordersPoP,
    acos: c.acos,
    acosPoP: c.acosPoP,
    cvr: c.cvr,
    cvrPoP: c.cvrPoP,
    ctr: c.ctr,
    ctrPoP: c.ctrPoP,
    cpc,
    cpcPoP: c.clicksPoP - c.spendPoP, // proxy
    roas,
    tacos: 0,
    status: c.status,
    totalSales,
  };
  return buildDiagnostic(row);
});

export const placementDiagnostics: Diagnostic[] = placementRows.map((p: PlacementRow, i) => {
  const roas = safeDiv(p.sales, p.spend);
  const totalSales = placementRows.reduce((s, x) => s + x.sales, 0);
  const row: AdEntityRow = {
    kind: 'placement',
    name: p.placement,
    key: `pl:${i}`,
    spend: p.spend,
    spendPoP: p.spendPoP,
    sales: p.sales,
    salesPoP: p.salesPoP,
    orders: Math.round(safeDiv(p.sales, 55)),
    ordersPoP: p.salesPoP,
    acos: p.acos,
    acosPoP: p.acosPoP,
    cvr: p.cvr,
    cvrPoP: p.cvrPoP,
    ctr: p.ctr,
    ctrPoP: p.ctrPoP,
    cpc: p.cpc,
    cpcPoP: p.cpcPoP,
    roas,
    tacos: 0,
    totalSales,
  };
  return buildDiagnostic(row);
});

export const campaignTypeDiagnostics: Diagnostic[] = adTypeRows.map((t: AdTypeRow, i) => {
  const roas = safeDiv(t.sales, t.spend);
  const totalSales = adTypeRows.reduce((s, x) => s + x.sales, 0);
  const row: AdEntityRow = {
    kind: 'campaignType',
    name: t.adType,
    key: `ct:${i}`,
    spend: t.spend,
    spendPoP: t.spendPoP,
    sales: t.sales,
    salesPoP: t.salesPoP,
    orders: Math.round(safeDiv(t.sales, 50)),
    ordersPoP: t.salesPoP,
    acos: t.acos,
    acosPoP: t.acosPoP,
    cvr: t.cvr,
    cvrPoP: t.cvrPoP,
    ctr: t.ctr,
    ctrPoP: t.ctrPoP,
    cpc: t.cpc,
    cpcPoP: t.cpcPoP,
    roas,
    tacos: 0,
    totalSales,
  };
  return buildDiagnostic(row);
});

export const searchTermDiagnostics: Diagnostic[] = searchTermData.map((s: SearchTermRow, i) => {
  const orders = Math.round(safeDiv(s.sales, 50));
  const roas = safeDiv(s.sales, s.spend);
  const totalSales = searchTermData.reduce((sum, x) => sum + x.sales, 0);
  const row: AdEntityRow = {
    kind: 'searchTerm',
    name: s.searchTerm,
    subLabel: s.matchType,
    key: `st:${i}`,
    spend: s.spend,
    spendPoP: s.spendPoP,
    sales: s.sales,
    salesPoP: s.salesPoP,
    orders,
    ordersPoP: s.salesPoP,
    acos: s.acos,
    acosPoP: s.acosPoP,
    cvr: s.cvr,
    cvrPoP: s.cvrPoP,
    ctr: s.ctr,
    ctrPoP: s.ctrPoP,
    cpc: s.cpc,
    cpcPoP: s.cpcPoP,
    roas,
    tacos: 0,
    totalSales,
  };
  const diag = buildDiagnostic(row);
  // Search-term-specific override: high spend + 0 orders should read as
  // Search term waste rather than a generic Pause issue.
  if (diag.decision === 'Pause' && row.spend >= TARGETS.noSalesSpend && orders === 0) {
    diag.issue = 'Search term waste';
  }
  return diag;
});

/** Keywords share the schema of search terms but framed as managed targeting. */
export const keywordDiagnostics: Diagnostic[] = searchTermData.slice(0, 30).map((s: SearchTermRow, i) => {
  const orders = Math.round(safeDiv(s.sales, 50));
  const roas = safeDiv(s.sales, s.spend);
  const totalSales = searchTermData.reduce((sum, x) => sum + x.sales, 0);
  const row: AdEntityRow = {
    kind: 'keyword',
    name: s.searchTerm,
    subLabel: s.matchType,
    key: `kw:${i}`,
    spend: s.spend,
    spendPoP: s.spendPoP,
    sales: s.sales,
    salesPoP: s.salesPoP,
    orders,
    ordersPoP: s.salesPoP,
    acos: s.acos,
    acosPoP: s.acosPoP,
    cvr: s.cvr,
    cvrPoP: s.cvrPoP,
    ctr: s.ctr,
    ctrPoP: s.ctrPoP,
    cpc: s.cpc,
    cpcPoP: s.cpcPoP,
    roas,
    tacos: 0,
    totalSales,
  };
  return buildDiagnostic(row);
});

export const adGroupDiagnostics: Diagnostic[] = audienceRows.map((a: AudienceRow, i) => {
  // Use audience rows as an Ad-group proxy in the demo.
  const roas = safeDiv(a.sales, a.spend);
  const orders = Math.round(safeDiv(a.sales, 60));
  const totalSales = audienceRows.reduce((s, x) => s + x.sales, 0);
  const row: AdEntityRow = {
    kind: 'adGroup',
    name: `${a.segment} ad group`,
    key: `ag:${i}`,
    spend: a.spend,
    spendPoP: a.spendPoP,
    sales: a.sales,
    salesPoP: a.salesPoP,
    orders,
    ordersPoP: a.salesPoP,
    acos: a.acos,
    acosPoP: a.acosPoP,
    cvr: a.cvr,
    cvrPoP: a.cvrPoP,
    ctr: a.ctr,
    ctrPoP: a.ctrPoP,
    cpc: a.cpc,
    cpcPoP: a.cpcPoP,
    roas,
    tacos: 0,
    totalSales,
  };
  return buildDiagnostic(row);
});

/** Product diagnostics include PDP readiness signals so we can flag
 *  "Fix PDP first" decisions. We pull from adByASIN and synthesise the
 *  Buy Box / rating / inventory signals deterministically. */
export const productDiagnostics: Diagnostic[] = adByASIN.map((a: AdPerfRow, i) => {
  const roas = safeDiv(a.sales, a.spend);
  const totalSales = adByASIN.reduce((s, x) => s + x.sales, 0);
  // Deterministic PDP signals: every 5th ASIN flagged for low BBox, every
  // 7th for poor rating, every 9th for low inventory.
  const buyBoxPct      = i % 5 === 0 ? 72 : 96;
  const rating         = i % 7 === 0 ? 3.6 : 4.4;
  const inventoryDays  = i % 9 === 0 ? 9  : 45;
  const adShare = totalSales > 0 ? (a.sales / totalSales) * 100 : 0;
  const row: AdEntityRow = {
    kind: 'product',
    name: a.name,
    subLabel: `Ad share ${adShare.toFixed(1)}%`,
    key: `prod:${i}`,
    spend: a.spend,
    spendPoP: a.spendPoP,
    sales: a.sales,
    salesPoP: a.salesPoP,
    orders: a.orders,
    ordersPoP: a.ordersPoP,
    acos: a.acos,
    acosPoP: a.acosPoP,
    cvr: a.cvr,
    cvrPoP: a.cvrPoP,
    ctr: a.ctr,
    ctrPoP: a.ctrPoP,
    cpc: a.cpc,
    cpcPoP: a.cpcPoP,
    roas,
    tacos: a.tacos,
    buyBoxPct,
    rating,
    inventoryDays,
    totalSales,
  };
  return buildDiagnostic(row);
});

// ── Cross-entity aggregate used by Overview's "Top advertising decisions" ────

export const allDiagnostics: Diagnostic[] = [
  ...campaignDiagnostics,
  ...placementDiagnostics,
  ...campaignTypeDiagnostics,
  ...productDiagnostics,
  ...searchTermDiagnostics,
  ...keywordDiagnostics,
  ...adGroupDiagnostics,
];

/** Top advertising decisions — best 5 actionable items across all entities. */
export const topAdvertisingDecisions: Diagnostic[] = (() => {
  return allDiagnostics
    .filter((d) => d.decision !== 'Monitor' && d.issue !== 'Healthy')
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 5);
})();

/** Top Scale opportunities — Scale/Protect decisions ranked by severity (upside). */
export const topScaleOpportunities: Diagnostic[] = allDiagnostics
  .filter((d) => d.decision === 'Scale' || d.decision === 'Protect')
  .sort((a, b) => b.severity - a.severity)
  .slice(0, 3);

/** Top Fix/Pause/Waste risks — ranked by severity (downside). */
export const topRiskDecisions: Diagnostic[] = allDiagnostics
  .filter((d) => d.decision === 'Fix' || d.decision === 'Pause' || d.decision === 'Waste')
  .sort((a, b) => b.severity - a.severity)
  .slice(0, 3);

/** Count of high-spend inefficient campaigns — used by the executive insight CTA. */
export const inefficientCampaignCount: number = campaignDiagnostics
  .filter((d) => (d.decision === 'Fix' || d.decision === 'Waste') && d.row.spend >= TARGETS.highSpend)
  .length;

/** Top-3 default for the Decisions panel:
 *  1) Best scale opportunity (Scale or Protect, highest severity)
 *  2) Biggest waste / pause (Pause or Waste, highest severity)
 *  3) Biggest diagnostic issue (Fix, highest severity)
 *  Each slot may be null if no qualifying diagnostic exists. */
export const topThreeDecisions: {
  bestScale: Diagnostic | null;
  biggestWaste: Diagnostic | null;
  biggestFix: Diagnostic | null;
} = (() => {
  const bestScale = allDiagnostics
    .filter((d) => d.decision === 'Scale' || d.decision === 'Protect')
    .sort((a, b) => b.severity - a.severity)[0] ?? null;
  const biggestWaste = allDiagnostics
    .filter((d) => d.decision === 'Pause' || d.decision === 'Waste')
    .sort((a, b) => b.severity - a.severity)[0] ?? null;
  const biggestFix = allDiagnostics
    .filter((d) => d.decision === 'Fix')
    .sort((a, b) => b.severity - a.severity)[0] ?? null;
  return { bestScale, biggestWaste, biggestFix };
})();

// ── Entity routing ───────────────────────────────────────────────────────

export const ENTITY_KIND_LABEL: Record<EntityKind, string> = {
  campaign:     'Campaign',
  adGroup:      'Ad group',
  placement:    'Placement',
  campaignType: 'Campaign type',
  product:      'Product',
  searchTerm:   'Search term',
  keyword:      'Keyword',
};

export function diagnosticsForEntity(kind: EntityKind): Diagnostic[] {
  switch (kind) {
    case 'campaign':     return campaignDiagnostics;
    case 'adGroup':      return adGroupDiagnostics;
    case 'placement':    return placementDiagnostics;
    case 'campaignType': return campaignTypeDiagnostics;
    case 'product':      return productDiagnostics;
    case 'searchTerm':   return searchTermDiagnostics;
    case 'keyword':      return keywordDiagnostics;
  }
}

// ── Decision-mode tabs (Diagnostics page) ────────────────────────────────

export type DecisionTab = 'all' | 'scale' | 'fix' | 'pause' | 'monitor' | 'waste' | 'growth';

export const DECISION_TABS: { id: DecisionTab; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'scale',   label: 'Scale' },
  { id: 'fix',     label: 'Fix' },
  { id: 'pause',   label: 'Pause' },
  { id: 'waste',   label: 'Waste' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'growth',  label: 'Growth opportunities' },
];

export function matchesDecisionTab(d: Diagnostic, tab: DecisionTab): boolean {
  if (tab === 'all')    return true;
  if (tab === 'growth') return d.decision === 'Scale' || d.issue === 'Profitable scaling opportunity' || d.issue === 'Budget limited';
  switch (tab) {
    case 'scale':   return d.decision === 'Scale' || d.decision === 'Protect';
    case 'fix':     return d.decision === 'Fix';
    case 'pause':   return d.decision === 'Pause';
    case 'waste':   return d.decision === 'Waste';
    case 'monitor': return d.decision === 'Monitor';
  }
}

// ── Overview-level summary numbers ───────────────────────────────────────

export function summarizeAdvertising() {
  // Pull current totals from the broad ad-perf feed (marketplace + brand).
  const totalSales = adByMarketplace.reduce((s, r) => s + r.sales, 0);
  const totalSpend = adByMarketplace.reduce((s, r) => s + r.spend, 0);
  const totalOrders = adByMarketplace.reduce((s, r) => s + r.orders, 0);
  const acos  = safeDiv(totalSpend, totalSales) * 100;
  const roas  = safeDiv(totalSales, totalSpend);
  const tacos = 11.5; // Synthetic brand-level TACOS for the wireframe.
  const cpc   = adByMarketplace.reduce((s, r) => s + r.cpc, 0) / adByMarketplace.length;
  const cpcPoP = adByMarketplace.reduce((s, r) => s + r.cpcPoP, 0) / adByMarketplace.length;
  const cvr   = adByMarketplace.reduce((s, r) => s + r.cvr, 0) / adByMarketplace.length;
  const cvrPoP = adByMarketplace.reduce((s, r) => s + r.cvrPoP, 0) / adByMarketplace.length;
  const ctr   = adByMarketplace.reduce((s, r) => s + r.ctr, 0) / adByMarketplace.length;
  const ctrPoP = adByMarketplace.reduce((s, r) => s + r.ctrPoP, 0) / adByMarketplace.length;
  const salesPoP = adByMarketplace.reduce((s, r) => s + r.salesPoP, 0) / adByMarketplace.length;
  const spendPoP = adByMarketplace.reduce((s, r) => s + r.spendPoP, 0) / adByMarketplace.length;
  const acosPoP  = adByMarketplace.reduce((s, r) => s + r.acosPoP,  0) / adByMarketplace.length;
  const ntbPct = adByMarketplace.reduce((s, r) => s + r.ntbPct, 0) / adByMarketplace.length;

  return {
    totalSales,
    totalSpend,
    totalOrders,
    acos,
    roas,
    tacos,
    cpc,
    cpcPoP,
    cvr,
    cvrPoP,
    ctr,
    ctrPoP,
    salesPoP,
    spendPoP,
    acosPoP,
    ntbPct,
  };
}

export const advertisingSummary = summarizeAdvertising();

// ── Executive insight headline (deterministic) ───────────────────────────

export interface ExecutiveInsight {
  /** Comparison basis — always "PoP" in the wireframe, exposed so the card
   *  can render it as a prefix and the user knows what the read is against. */
  comparison: 'PoP' | 'YoY';
  headline: string;
  body: string;
  issueLabel: string;
  driver: string;
  confidence: Confidence;
  ctaLabel: string;
  ctaRoute: string;
}

export function buildExecutiveInsight(): ExecutiveInsight {
  const s = advertisingSummary;
  let headline: string;
  if (s.salesPoP > 0 && s.acosPoP > 0) {
    headline = 'Ad sales are growing, but efficiency is weakening.';
  } else if (s.salesPoP > 0 && s.acosPoP <= 0) {
    headline = 'Ad sales are growing efficiently.';
  } else if (s.salesPoP <= 0 && s.spendPoP > 0) {
    headline = 'Spend increased while ad sales declined.';
  } else if (s.salesPoP <= 0 && s.spendPoP <= 0) {
    headline = 'Both spend and ad sales are softening.';
  } else {
    headline = 'Advertising performance is stable.';
  }

  const issuePieces: string[] = [];
  if (s.tacos > TARGETS.tacos) issuePieces.push('TACOS is above target');
  if (s.cpcPoP > 0 && s.cvrPoP < 0) issuePieces.push('CPC increased while ad CVR declined');
  if (s.acos > TARGETS.acos) issuePieces.push('ACOS is above target');

  const issueLabel = issuePieces[0]
    ? issuePieces[0].charAt(0).toUpperCase() + issuePieces[0].slice(1)
    : 'No material issue detected';

  const driver = s.cpcPoP > 0 && s.cvrPoP < 0
    ? `CPC ${s.cpcPoP > 0 ? '+' : ''}${s.cpcPoP.toFixed(1)}% while CVR ${s.cvrPoP > 0 ? '+' : ''}${s.cvrPoP.toFixed(1)}%`
    : `Ad sales ${s.salesPoP > 0 ? '+' : ''}${s.salesPoP.toFixed(1)}% · Spend ${s.spendPoP > 0 ? '+' : ''}${s.spendPoP.toFixed(1)}%`;

  // Confidence: count how many of the diagnostic signals fire
  let n = 0;
  if (s.acos > TARGETS.acos) n++;
  if (s.tacos > TARGETS.tacos) n++;
  if (s.cpcPoP > 0 && s.cvrPoP < 0) n++;
  if (s.salesPoP < 0 && s.spendPoP > 0) n++;
  const confidence: Confidence = n >= 3 ? 'High' : n === 2 ? 'Medium' : 'Low';

  // Next step routes to where the user actually fixes this. Concrete count
  // — spec rule 9 (no generic "Review high-spend inefficient campaigns").
  const ctaLabel = inefficientCampaignCount > 0
    ? `Review ${inefficientCampaignCount} high-spend inefficient campaign${inefficientCampaignCount === 1 ? '' : 's'}`
    : 'Open Diagnostics';
  const ctaRoute = 'Advertising/Diagnostics';

  const body = `Ad sales are ${fmtEur(s.totalSales)}, spend is ${fmtEur(s.totalSpend)}, ACOS is ${s.acos.toFixed(1)}%, and TACOS is ${s.tacos.toFixed(1)}%.`;

  return { comparison: 'PoP', headline, body, issueLabel, driver, confidence, ctaLabel, ctaRoute };
}

function fmtEur(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `€${(n / 1_000).toFixed(1)}k`;
  return `€${n.toFixed(0)}`;
}

// ── Marketplace / Brand decision rollup (Overview summary tables) ────────

export interface MarketplaceBrandDiagnostic {
  name: string;
  spend: number;
  sales: number;
  acos: number;
  acosPoP: number;
  salesPoP: number;
  decision: Decision;
  issue: IssueType;
  nextStep: string;
  severity: number;
  /** 2 short evidence snippets shown in the Where-is-it-happening table. */
  evidence: string[];
}

function rollup(row: AdPerfRow): MarketplaceBrandDiagnostic {
  // Treat each marketplace / brand row as a campaign-grade entity for
  // classification. Spend is the scale signal; ACOS and CVR drive the decision.
  const totalSales = adByMarketplace.reduce((s, r) => s + r.sales, 0); // for share signal
  const synth: AdEntityRow = {
    kind: 'campaign',
    name: row.name,
    key: `roll:${row.name}`,
    spend: row.spend,
    spendPoP: row.spendPoP,
    sales: row.sales,
    salesPoP: row.salesPoP,
    orders: row.orders,
    ordersPoP: row.ordersPoP,
    acos: row.acos,
    acosPoP: row.acosPoP,
    cvr: row.cvr,
    cvrPoP: row.cvrPoP,
    ctr: row.ctr,
    ctrPoP: row.ctrPoP,
    cpc: row.cpc,
    cpcPoP: row.cpcPoP,
    roas: row.roas,
    tacos: row.tacos,
    totalSales,
  };
  const d = buildDiagnostic(synth);
  return {
    name: row.name,
    spend: row.spend,
    sales: row.sales,
    acos: row.acos,
    acosPoP: row.acosPoP,
    salesPoP: row.salesPoP,
    decision: d.decision,
    issue: d.issue,
    nextStep: ISSUE_CTA[d.issue]?.nextStep ?? '',
    severity: d.severity,
    evidence: d.evidence.slice(0, 2),
  };
}

export const marketplaceDecisionRollup: MarketplaceBrandDiagnostic[] = adByMarketplace
  .map(rollup)
  .sort((a, b) => b.severity - a.severity);

export const brandDecisionRollup: MarketplaceBrandDiagnostic[] = adByBrand
  .map(rollup)
  .sort((a, b) => b.severity - a.severity);

/** Campaign-type roll-up — uses the existing campaignTypeDiagnostics and
 *  reshapes them into the same display shape so the Where-is-it-happening
 *  tabs all use one renderer. */
export const campaignTypeDecisionRollup: MarketplaceBrandDiagnostic[] = campaignTypeDiagnostics
  .map((d) => ({
    name: d.row.name,
    spend: d.row.spend,
    sales: d.row.sales,
    acos: d.row.acos,
    acosPoP: d.row.acosPoP,
    salesPoP: d.row.salesPoP,
    decision: d.decision,
    issue: d.issue,
    nextStep: ISSUE_CTA[d.issue]?.nextStep ?? '',
    severity: d.severity,
    evidence: d.evidence.slice(0, 2),
  }))
  .sort((a, b) => b.severity - a.severity);
