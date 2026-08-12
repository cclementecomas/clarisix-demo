// ─── Cross-metric root cause (Home → Period Snapshot) ────────────────────────
// A KPI never moves on its own. A stockout drags Sales down, spikes Out-of-Stock,
// and (because ad spend keeps running on falling sales) pushes TACOS up — one root
// cause showing up in three cells. The snapshot shows those as isolated red/green
// squares, so the user has to correlate six numbers in their head to answer "why".
//
// This model does the correlation for them. For a focused metric × period it sorts
// the OTHER five pillars into three roles:
//   • cause       — moved the metric (hurt or helped), ranked by contribution
//   • consequence — moved *because* the metric did (downstream, not a new problem)
//   • ruledOut    — healthy; explicitly NOT the cause (so the user stops looking)
// …plus a one-line plain-English verdict, a "nature" tag, and the next action.
//
// The shape is metric-agnostic: extend to TACOS / Profitability / etc. by adding
// entries under ROOT_CAUSES[metric][periodLabel]. Sales is implemented first.

export type NatureKey = 'supply' | 'demand' | 'efficiency' | 'healthy' | 'mix';

export const NATURE_META: Record<NatureKey, { label: string; cls: string }> = {
  supply:     { label: 'Supply problem',     cls: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' },
  demand:     { label: 'Demand problem',     cls: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200' },
  efficiency: { label: 'Efficiency shift',   cls: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200' },
  healthy:    { label: 'Healthy',            cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' },
  mix:        { label: 'Mix / timing',       cls: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200' },
};

export interface CausePillar {
  pillar: string;        // a Period-Snapshot pillar name — this is what makes it cross-metric
  delta: string;         // its own movement, pre-formatted (e.g. "+1.3pp", "−1.7pp")
  effect: 'hurt' | 'helped';
  weightPct: number;     // share of the focused move it explains (hurt drivers); 0 = pure offset
  note: string;          // plain-English mechanism
}
export interface RolePillar {
  pillar: string;
  delta: string;
  note: string;
}
export interface RootCause {
  nature: NatureKey;
  verdict: string;                 // the answer — one sentence, read this and stop
  causes: CausePillar[];           // ranked; what moved the metric
  consequences: RolePillar[];      // moved because the metric moved (not a new problem)
  ruledOut: RolePillar[];          // healthy — explicitly not the cause
  action?: { text: string; section: string; sub: string };
}

// Keyed by metric → period label (must match periodSnapshots[].label) → RootCause.
export const ROOT_CAUSES: Record<string, Record<string, RootCause>> = {
  Sales: {
    'Month to date': {
      nature: 'supply',
      verdict: 'Sales are down 7.2% this month because 3 hero SKUs went out of stock mid-month — demand is healthy, supply isn\'t.',
      causes: [
        { pillar: 'Out of Stock', delta: '+1.3pp', effect: 'hurt', weightPct: 78,
          note: '3 hero SKUs stocked out 12–20 Jul — units you simply couldn\'t sell. This is the bulk of the drop.' },
        { pillar: 'TACOS', delta: '−1.7pp', effect: 'helped', weightPct: 0,
          note: 'Ads got cheaper, not more expensive — this softened the drop, it didn\'t cause it. So this is not an advertising problem.' },
      ],
      consequences: [
        { pillar: 'Profitability', delta: '−25.6%', note: 'A result of the lost sales — fixed costs spread over less revenue. Fix the stockout and this recovers on its own.' },
      ],
      ruledOut: [
        { pillar: 'Content Score', delta: '+2.8', note: 'Listings improved — conversion isn\'t the issue.' },
        { pillar: 'Customer Experience', delta: '+0.4', note: 'Reviews and ratings are stable.' },
      ],
      action: { text: 'Restock the 3 SKUs to recover ~€2.1k/week', section: 'Inventory', sub: 'Planner' },
    },
    'This month (forecast)': {
      nature: 'mix',
      verdict: 'The month is forecast to land roughly flat: the mid-month stockout that dragged Month-to-date is easing as stock returns, so the full month recovers to about last month\'s level.',
      causes: [
        { pillar: 'Out of Stock', delta: '+1.3pp', effect: 'hurt', weightPct: 60,
          note: 'Still elevated from the mid-month stockout, but the affected SKUs are being replenished — the drag fades over the back half of the month.' },
      ],
      consequences: [
        { pillar: 'Profitability', delta: '+4.6%', note: 'Recovers as sales normalise and ads stay efficient.' },
      ],
      ruledOut: [
        { pillar: 'Content Score', delta: '+2.8', note: 'Healthy.' },
        { pillar: 'Customer Experience', delta: '+0.4', note: 'Stable.' },
      ],
      action: { text: 'Confirm restock ETAs so the forecast holds', section: 'Inventory', sub: 'Planner' },
    },
    'Last month': {
      nature: 'healthy',
      verdict: 'A strong month, +15.1% — driven by improved listings and steady demand. The only watch-item was ad efficiency ticking the wrong way (TACOS +0.6pp).',
      causes: [
        { pillar: 'Content Score', delta: '+1.2', effect: 'helped', weightPct: 55, note: 'Better listings lifted conversion across the catalogue.' },
        { pillar: 'TACOS', delta: '+0.6pp', effect: 'hurt', weightPct: 20, note: 'Ads got slightly more expensive — a minor drag, worth watching if it continues.' },
      ],
      consequences: [
        { pillar: 'Profitability', delta: '−6.4%', note: 'Softer than sales because TACOS rose and a one-off content cost landed — not a demand issue.' },
      ],
      ruledOut: [
        { pillar: 'Out of Stock', delta: '−0.3pp', note: 'Availability improved.' },
        { pillar: 'Customer Experience', delta: '+0.2', note: 'Stable.' },
      ],
    },
    'Year to date': {
      nature: 'healthy',
      verdict: 'Up 14.6% year-to-date — broad, healthy growth: better listings, cheaper ads and stronger reviews are all compounding. Nothing to fix.',
      causes: [
        { pillar: 'Content Score', delta: '+5.4', effect: 'helped', weightPct: 45, note: 'Listing quality up materially over the year — the single biggest tailwind.' },
        { pillar: 'TACOS', delta: '−2.1pp', effect: 'helped', weightPct: 35, note: 'Ads got more efficient, so growth came without over-spending.' },
        { pillar: 'Customer Experience', delta: '+2.3', effect: 'helped', weightPct: 20, note: 'Stronger reviews lifted conversion on non-branded traffic.' },
      ],
      consequences: [
        { pillar: 'Profitability', delta: '+22.4%', note: 'Growing faster than sales — the efficiency gains are dropping to the bottom line.' },
      ],
      ruledOut: [
        { pillar: 'Out of Stock', delta: '−0.8pp', note: 'Availability improved over the year.' },
      ],
      action: { text: 'Keep defending — protect the SKUs driving the growth', section: 'Sales', sub: 'Overview' },
    },
    'Yesterday': {
      nature: 'healthy',
      verdict: 'Up 5.2% versus the prior day — normal day-to-day variation, nothing structural. Every other pillar was flat.',
      causes: [],
      consequences: [],
      ruledOut: [
        { pillar: 'Out of Stock', delta: '0.0pp', note: 'Unchanged.' },
        { pillar: 'TACOS', delta: '−0.4pp', note: 'Steady.' },
        { pillar: 'Content Score', delta: '0.0', note: 'Unchanged.' },
        { pillar: 'Customer Experience', delta: '0.0', note: 'Unchanged.' },
      ],
    },
  },
};

export const rootCauseFor = (metric: string, periodLabel: string): RootCause | null =>
  ROOT_CAUSES[metric]?.[periodLabel] ?? null;

/** Does this metric have any diagnosis wired up yet? (drives the "Why?" affordance) */
export const hasRootCause = (metric: string): boolean => metric in ROOT_CAUSES;
