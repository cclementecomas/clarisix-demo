// ─── "What's new" changelog ──────────────────────────────────────────────────
// User-facing release notes. Newest release first. Written in plain product
// language (no dev jargon) — this is what the customer reads to learn what
// changed since they last logged in. Developers append a new Release object on
// each shipped version and bump CURRENT_VERSION.

export type ChangeType = 'new' | 'improved' | 'fixed';

export interface ChangeItem {
  type: ChangeType;
  title: string;
  description: string;
  /** Optional deep-link so "Take me there" can jump to the feature. */
  route?: { section: string; sub: string };
}

export interface Release {
  version: string;
  date: string;        // ISO yyyy-mm-dd
  headline: string;    // one-line summary of the release
  changes: ChangeItem[];
}

export const CHANGE_META: Record<ChangeType, { label: string; cls: string; dot: string }> = {
  new:      { label: 'New',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  improved: { label: 'Improved', cls: 'bg-sky-50 text-sky-700 ring-sky-200',             dot: 'bg-sky-500' },
  fixed:    { label: 'Fixed',    cls: 'bg-amber-50 text-amber-700 ring-amber-200',        dot: 'bg-amber-500' },
};

export const CHANGELOG: Release[] = [
  {
    version: '2.6.0',
    date: '2026-07-14',
    headline: 'See every SKU at a glance, and a home for your overheads',
    changes: [
      {
        type: 'new',
        title: 'Drill any ASIN table straight to SKU level',
        description: 'The metric tables now have a “Grouped / All SKUs” switch. Flip to All SKUs to rank, scan and export every SKU in one flat list — no more expanding products one by one.',
        route: { section: 'Sales', sub: 'Diagnostics' },
      },
      {
        type: 'new',
        title: 'Overheads',
        description: 'A new Data → Overheads page to record your running costs — payroll, software, rent, agency fees, prep — as recurring or variable expenses. These feed the P&L’s Allocated Overheads line and each SKU’s true net profit.',
        route: { section: 'Data', sub: 'Overheads' },
      },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-07-09',
    headline: 'Search funnel & Search share, rebuilt on real search data',
    changes: [
      {
        type: 'improved',
        title: 'Search funnel tells you where you’re losing the market',
        description: 'The Search funnel page now reads straight from Amazon Search Query Performance. One clear verdict — a share decline or a conversion leak — with the euros you’d win back and which ASINs to fix first.',
        route: { section: 'Sales', sub: 'Search funnel' },
      },
      {
        type: 'new',
        title: '“Where your market share is won & lost”',
        description: 'A step-by-step view of your slice of every purchase, showing exactly which funnel step grows or shrinks it versus the market — in plain slices and sales, not jargon.',
        route: { section: 'Sales', sub: 'Search funnel' },
      },
      {
        type: 'new',
        title: 'Jump from an ASIN straight to the keyword',
        description: 'In the Search funnel, open any product’s top query and land directly on that keyword on Search share — no re-searching.',
        route: { section: 'Sales', sub: 'Search share' },
      },
      {
        type: 'improved',
        title: 'Search share shows which ASINs win each keyword',
        description: 'Every keyword now lists your ASINs competing on it, with their funnel share and where each one leaks vs the market.',
        route: { section: 'Sales', sub: 'Search share' },
      },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-06-01',
    headline: 'Deeper Sales diagnostics and clearer trends',
    changes: [
      {
        type: 'improved',
        title: 'Full metric parity across Sales',
        description: 'Sales Deepdive, Trends and the metric-over-time matrix now share the same 28-metric vocabulary and the same left-to-right story: what I sold → who bought → how they got there → what I paid → what’s left.',
        route: { section: 'Sales', sub: 'Diagnostics' },
      },
      {
        type: 'fixed',
        title: 'Colours now always mean the same thing',
        description: 'Green is better, red is worse — everywhere, including inverse metrics like ACOS and TACOS where a rise is bad.',
      },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-05-12',
    headline: 'Prime Day Recap',
    changes: [
      {
        type: 'new',
        title: 'Prime Day Recap',
        description: 'A scenic year-in-review of your event performance with honest year-over-year comparisons.',
        route: { section: 'Prime Day Recap', sub: '' },
      },
      {
        type: 'improved',
        title: 'Consistent wording across the app',
        description: '“Sales” (not Revenue) outside the P&L, and “Page views” (not Glance views), so numbers read the same wherever you are.',
      },
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;

/** Compare dotted semver strings (e.g. "2.6.0" > "2.5.0"). */
export function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/** How many releases the user hasn't seen yet (seen = last version they opened). */
export function unseenCount(lastSeen: string | null): number {
  if (!lastSeen) return CHANGELOG.length;
  return CHANGELOG.filter((r) => isNewer(r.version, lastSeen)).length;
}
