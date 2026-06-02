// ─── Sales Deepdive — Entity Detail Drawer ────────────────────────────────
// Side panel with structured diagnosis:
//   1. Header — severity + issue + confidence + impact split
//   2. Short diagnosis sentence
//   3. Metric bridge organized by lever (Traffic / Conversion / Pricing /
//      Advertising / Margin) — top movers per lever
//   4. Supporting metrics block — full read of the relevant KPIs
//   5. Recommended checks — issue-specific checklist
//   6. Specific CTA at the bottom

import { useEffect } from 'react';
import { X, ArrowDown, ArrowRight, ArrowUp, Lightbulb } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import {
  ISSUE_META, ISSUE_STYLE, SEVERITY_STYLE, CONFIDENCE_STYLE,
  ENTITY_KIND_LABEL,
  type Diagnostic, type IssueType,
} from '../../data/deepdiveDiagnostics';
import type { MetricFields } from '../../data/deepdiveData';

// ── Diagnosis sentence ───────────────────────────────────────────────────

function diagnosisSentence(d: Diagnostic): string {
  const subject = `${d.name}${d.kind === 'asin' && d.subLabel ? ` (${d.subLabel})` : ''}`;
  const conf = d.confidence === 'High'
    ? ' Confidence is high — multiple signals align.'
    : d.confidence === 'Medium'
      ? ' Confidence is medium — the lead signal is clear but secondary reads are mixed.'
      : ' Confidence is low — signals conflict, treat the diagnosis as a hypothesis.';
  const prim = d.primary?.label ?? '';
  const sec  = d.secondary?.label ?? '';
  switch (d.issue) {
    case 'Profit dilution':
      return `${subject} sales grew but channel margin slipped (${prim.toLowerCase()}${sec ? `, ${sec.toLowerCase()}` : ''}). The new revenue is bringing less profit per €.${conf}`;
    case 'Margin risk':
      return `${subject} margin lines are degrading (${prim.toLowerCase()}${sec ? `, ${sec.toLowerCase()}` : ''}). Sales held, but every € sold is now worth less.${conf}`;
    case 'Ad efficiency issue':
      return `${subject} advertising efficiency is breaking down — ${prim.toLowerCase()}${sec ? `, ${sec.toLowerCase()}` : ''}. Spend is generating less return.${conf}`;
    case 'Ad-led growth risk':
      return `${subject} sales are growing but ad cost is climbing faster (${prim.toLowerCase()}). The growth is being bought, not earned — re-check profitability.${conf}`;
    case 'Discount-led growth risk':
      return `${subject} sales are up but discounts are surging (${prim.toLowerCase()}${sec ? `, ${sec.toLowerCase()}` : ''}). Volume is being subsidised — check margin contribution.${conf}`;
    case 'Traffic-led sales drop':
      return `${subject} sales declined mainly because ${prim.toLowerCase()} while CVR held. The issue is traffic, not conversion — review organic visibility, advertising delivery and recent campaign changes.${conf}`;
    case 'Conversion-led sales drop':
      return `${subject} sales declined while traffic held — the leak is downstream. ${prim} is the strongest signal${sec ? `, with ${sec.toLowerCase()}` : ''}. Check PDP, price, Buy Box, reviews and delivery promises.${conf}`;
    case 'Availability-led sales drop':
      return `${subject} sales declined alongside Buy Box loss (${prim.toLowerCase()}${sec ? `, ${sec.toLowerCase()}` : ''}). Restore Buy Box and check stockouts before anything else.${conf}`;
    case 'Price/mix issue':
      return `${subject} sales declined and pricing / discount levers moved (${prim.toLowerCase()}${sec ? `, ${sec.toLowerCase()}` : ''}). Audit the discount calendar and SKU mix.${conf}`;
    case 'Acquisition weakness':
      return `${subject} new-to-brand orders dropped (${prim.toLowerCase()}). Review prospecting campaigns and top-of-funnel ad placements.${conf}`;
    case 'Retention weakness':
      return `${subject} Subscribe & Save volume dropped (${prim.toLowerCase()}). Review repeat-purchase signals and S&S enrolment.${conf}`;
    case 'Protect winner':
      return `${subject} is a strong contributor with healthy margin and growing or stable sales. Defend share and keep margin pressure on the watchlist.`;
    case 'Healthy':
      return `${subject} is within healthy thresholds across sales, traffic, conversion and ad efficiency.`;
    default:
      return `${subject} requires attention. ${prim ? `${prim} is the strongest signal.` : ''}${conf}`;
  }
}

// ── Metric bridge organized by lever ─────────────────────────────────────

type Polarity = 'higher' | 'lower';
type BridgeField = { field: keyof MetricFields; label: string; polarity: Polarity };

const LEVER_BRIDGE: { lever: string; fields: BridgeField[] }[] = [
  {
    lever: 'Traffic',
    fields: [
      { field: 'sessionsPoP',  label: 'Sessions',    polarity: 'higher' },
      { field: 'pageViewsPoP', label: 'Page views',  polarity: 'higher' },
    ],
  },
  {
    lever: 'Conversion',
    fields: [
      { field: 'cvrPoP',          label: 'CVR',      polarity: 'higher' },
      { field: 'bboxWinRatePoP',  label: 'Buy Box',  polarity: 'higher' },
    ],
  },
  {
    lever: 'Price / mix',
    fields: [
      { field: 'avgPricePoP',  label: 'Avg price',  polarity: 'higher' },
      { field: 'discountsPoP', label: 'Discounts',  polarity: 'lower' },
      { field: 'unitsPoP',     label: 'Units',      polarity: 'higher' },
    ],
  },
  {
    lever: 'Advertising',
    fields: [
      { field: 'adSpendPoP', label: 'Ad spend', polarity: 'lower' },
      { field: 'roasPoP',    label: 'ROAS',     polarity: 'higher' },
      { field: 'acosPoP',    label: 'ACOS',     polarity: 'lower' },
      { field: 'tacosPoP',   label: 'TACOS',    polarity: 'lower' },
    ],
  },
  {
    lever: 'Margin',
    fields: [
      { field: 'productMarginPoP', label: 'Product margin', polarity: 'higher' },
      { field: 'channelMarginPoP', label: 'Channel margin', polarity: 'higher' },
      { field: 'growthMarginPoP',  label: 'Growth margin',  polarity: 'higher' },
    ],
  },
];

// ── Issue-specific checklists ────────────────────────────────────────────

const CHECKLIST: Record<IssueType, string[]> = {
  'Profit dilution': [
    'Open Profitability → Overview and look at the channel-margin bridge.',
    'Check whether new sales came with elevated TACOS or discounts.',
    'Identify the SKUs driving the margin slide; compare COGS to prior period.',
  ],
  'Margin risk': [
    'Open Profitability → Overview, scope to this entity.',
    'Verify COGS hasn\'t shifted on the top SKUs.',
    'Inspect TACOS and discount line movements.',
  ],
  'Ad efficiency issue': [
    'Open Advertising → Deepdive and rank campaigns by spend.',
    'Pause / lower bids on ACOS outliers.',
    'Verify creative refresh cadence on hero campaigns.',
  ],
  'Ad-led growth risk': [
    'Open Profitability → Overview and check ad dependency ratio.',
    'Compare ad sales vs organic sales growth in Sales → Trends.',
    'Identify which campaigns are driving the TACOS lift.',
  ],
  'Discount-led growth risk': [
    'Audit the discount / coupon calendar within the period.',
    'Compare avg price and units to identify the subsidised SKUs.',
    'Run a margin check on the discounted SKUs.',
  ],
  'Traffic-led sales drop': [
    'Open Sales → Traffic and compare organic vs paid sessions.',
    'Check Sponsored Products / Brands impression drops.',
    'Verify organic rank on hero search terms in SQP.',
  ],
  'Conversion-led sales drop': [
    'Check Buy Box win rate on top sessions ASINs.',
    'Audit Content Score and recent PDP changes.',
    'Look for review-rating regressions or 1-star spikes.',
  ],
  'Availability-led sales drop': [
    'Open Inventory → Planner and look for recent stockouts.',
    'Check Buy Box loss reasons — competitor pricing vs availability.',
    'Verify FBA inbound shipments aren\'t delayed.',
  ],
  'Price/mix issue': [
    'Check ASIN-level avg price changes within the period.',
    'Inspect Discounts and Coupon line movements.',
    'Look at SKU-mix shifts across higher vs lower-ASP items.',
  ],
  'Acquisition weakness': [
    'Open Advertising → Deepdive and filter to prospecting / DSP campaigns.',
    'Compare NTB share against last quarter.',
  ],
  'Retention weakness': [
    'Open Customer Experience → Subscriptions, inspect cancel rate.',
    'Verify Subscribe & Save discount terms haven\'t shifted.',
  ],
  'Protect winner': [
    'Monitor margin trend weekly.',
    'Defend share on hero search terms in SQP.',
    'Maintain Buy Box and stock cover.',
  ],
  'Healthy': [
    'No action needed — keep monitoring.',
  ],
};

// ── Drawer ───────────────────────────────────────────────────────────────

export default function EntityDetailDrawer({
  d, onClose, onCta,
}: {
  d: Diagnostic | null;
  onClose: () => void;
  onCta?: (route: string) => void;
}) {
  useEffect(() => {
    if (!d) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d, onClose]);

  const open = d !== null;
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-screen w-full max-w-[560px] bg-white shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}
      >
        {d && <DrawerContent d={d} onClose={onClose} onCta={onCta} />}
      </aside>
    </>
  );
}

function DrawerContent({ d, onClose, onCta }: { d: Diagnostic; onClose: () => void; onCta?: (route: string) => void }) {
  const { currency } = useCurrency();
  const meta = ISSUE_META[d.issue];
  const issueStyle = ISSUE_STYLE[d.issue];
  const sev = SEVERITY_STYLE[d.severityLevel];
  const checks = CHECKLIST[d.issue];

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3 z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[10px] font-bold border ${sev.chip}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${sev.dot}`} />
              {sev.label}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{ENTITY_KIND_LABEL[d.kind]}</span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-bold border ${issueStyle.chip}`}>{d.issue}</span>
            <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold border ${CONFIDENCE_STYLE[d.confidence]}`}>
              {d.confidence} confidence
            </span>
          </div>
          <h2 className="text-base font-bold text-gray-900 leading-tight">{d.name}</h2>
          {d.subLabel && <div className="text-[11px] text-gray-500 mt-0.5">{d.subLabel}</div>}
          <div className="text-[11px] text-gray-500 mt-1.5">
            Sales {fc(d.row.sales, currency, { compact: true })} · PoP{' '}
            <span className={d.row.salesPoP >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
              {d.row.salesPoP >= 0 ? '+' : ''}{d.row.salesPoP.toFixed(1)}%
            </span>
            {d.profitImpact > 0 && (
              <> · Profit impact <span className="font-bold text-rose-700">−{fc(d.profitImpact, currency, { compact: true })}</span></>
            )}
            {d.revenueImpact > 0 && (
              <> · Revenue impact <span className="font-semibold text-gray-700">−{fc(d.revenueImpact, currency, { compact: true })}</span></>
            )}
          </div>
        </div>
        <button onClick={onClose} className="flex-shrink-0 w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Diagnosis */}
      <div className="px-5 py-3 bg-amber-50/40 border-b border-amber-100">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Diagnosis</div>
            <p className="text-[13px] text-gray-900 leading-relaxed mt-0.5">{diagnosisSentence(d)}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Metric bridge by lever */}
        <Section title="Metric bridge" subtitle="Top movers by lever vs the prior comparable period">
          <div className="space-y-2">
            {LEVER_BRIDGE.map((g) => {
              const rows = g.fields
                .map((f) => ({ ...f, value: d.row[f.field] as number }))
                .filter((x) => Number.isFinite(x.value) && Math.abs(x.value) >= 0.2);
              if (rows.length === 0) return null;
              return (
                <div key={g.lever} className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    {g.lever}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {rows.map((r) => (
                      <div key={r.label} className="px-3 py-2 flex items-center justify-between gap-3">
                        <span className="text-[12px] text-gray-700 font-medium">{r.label}</span>
                        <BridgeBar value={r.value} polarity={r.polarity} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Supporting metrics — quick numeric read */}
        <Section title="Supporting metrics" subtitle="Current period vs prior">
          <div className="grid grid-cols-2 gap-2">
            <SupportTile label="Orders"          value={d.row.orders}     pop={d.row.ordersPoP}     format="number" />
            <SupportTile label="Units"           value={d.row.units}      pop={d.row.unitsPoP}      format="number" />
            <SupportTile label="Avg price"       value={d.row.avgPrice}   pop={d.row.avgPricePoP}   format="currency" currency={currency} />
            <SupportTile label="Sessions"        value={d.row.sessions}   pop={d.row.sessionsPoP}   format="number" />
            <SupportTile label="CVR"             value={d.row.cvr}        pop={d.row.cvrPoP}        format="pct" />
            <SupportTile label="ROAS"            value={d.row.roas}       pop={d.row.roasPoP}       format="roas" />
            <SupportTile label="ACOS"            value={d.row.acos}       pop={d.row.acosPoP}       format="pct" polarity="lower" />
            <SupportTile label="TACOS"           value={d.row.tacos}      pop={d.row.tacosPoP}      format="pct" polarity="lower" />
            <SupportTile label="Product margin"  value={d.row.productMargin} pop={d.row.productMarginPoP} format="pct" />
            <SupportTile label="Channel margin"  value={d.row.channelMargin} pop={d.row.channelMarginPoP} format="pct" />
          </div>
        </Section>

        {/* Recommended checks */}
        <Section title="Recommended checks" subtitle="Issue-specific shortlist">
          <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {checks.map((c, i) => (
              <li key={i} className="px-3 py-2 flex items-start gap-2">
                <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                <span className="text-[12px] text-gray-800 leading-snug">{c}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* CTA */}
        {meta.ctaLabel && (
          <button
            onClick={() => onCta?.(meta.ctaRoute)}
            className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold transition-colors group"
          >
            <div className="text-left">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Next step</div>
              <div>{meta.ctaLabel}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2">
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-700">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function BridgeBar({ value, polarity }: { value: number; polarity: Polarity }) {
  const positive = value >= 0;
  const good = polarity === 'higher' ? value > 0 : value < 0;
  const magnitude = Math.min(100, Math.abs(value) * 2);
  const barColor  = good ? 'bg-emerald-400' : 'bg-rose-400';
  const textColor = good ? 'text-emerald-700' : 'text-rose-700';
  return (
    <div className="flex items-center gap-2 min-w-[200px] justify-end">
      <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${magnitude}%` }} />
      </div>
      <span className={`text-[12px] font-bold tabular-nums inline-flex items-center gap-0.5 w-20 justify-end ${textColor}`}>
        {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {positive ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  );
}

function SupportTile({
  label, value, pop, format, polarity = 'higher', currency,
}: {
  label: string;
  value: number;
  pop: number;
  format: 'number' | 'currency' | 'pct' | 'roas';
  polarity?: Polarity;
  currency?: Parameters<typeof fc>[1];
}) {
  const display =
    format === 'currency' ? fc(value, currency ?? ('EUR' as any), { compact: true })
    : format === 'pct'      ? `${value.toFixed(1)}%`
    : format === 'roas'     ? `${value.toFixed(2)}x`
    :                          value.toLocaleString();
  const good = polarity === 'higher' ? pop > 0 : pop < 0;
  const popColor = pop === 0 ? 'text-gray-400' : good ? 'text-emerald-700' : 'text-rose-700';
  return (
    <div className="rounded-md border border-gray-200 p-2">
      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-[14px] font-bold text-gray-900 tabular-nums mt-0.5">{display}</div>
      <div className={`text-[10px] font-semibold tabular-nums ${popColor}`}>
        {pop > 0 ? '+' : ''}{pop.toFixed(1)}% PoP
      </div>
    </div>
  );
}
