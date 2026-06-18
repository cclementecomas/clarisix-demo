// ─── Advertising Diagnostics — Decision Drawer ───────────────────────────
// Slide-in side panel with the decision diagnosis, supporting metrics,
// recommended checks, and a specific CTA.

import { useEffect } from 'react';
import { ArrowRight, Lightbulb, X } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import {
  DECISION_STYLE, ISSUE_STYLE, SEVERITY_STYLE, CONFIDENCE_STYLE,
  ISSUE_CTA, ENTITY_KIND_LABEL,
  type Diagnostic, type Decision, type IssueType,
} from '../../data/advertisingDiagnostics';

const DIAGNOSIS: Record<Decision, (d: Diagnostic) => string> = {
  Scale:   (d) => `${d.row.name} is classified as Scale because ACOS (${d.row.acos.toFixed(1)}%) is at or below target and conversion has held. Confidence is ${d.confidence.toLowerCase()} — push budget or bids while efficiency holds.`,
  Fix:     (d) => `${d.row.name} is classified as Fix because spend (${fc(d.row.spend, 'EUR' as any, { compact: true })}) is material and ACOS (${d.row.acos.toFixed(1)}%) is above target. ${d.primary ? d.primary + ' is the lead signal.' : ''} Confidence is ${d.confidence.toLowerCase()}.`,
  Pause:   (d) => `${d.row.name} is classified as Pause — material spend (${fc(d.row.spend, 'EUR' as any, { compact: true })}) with zero orders. Pause or add negatives.`,
  Waste:   (d) => `${d.row.name} is classified as Waste — ACOS (${d.row.acos.toFixed(1)}%) is past break-even and spend is meaningful. Every € here is currently unprofitable.`,
  Protect: (d) => `${d.row.name} is classified as Protect — it carries meaningful share and ACOS (${d.row.acos.toFixed(1)}%) is healthy. Defend, don't starve.`,
  Monitor: (d) => `${d.row.name} is classified as Monitor — low spend volume or mixed signals (confidence ${d.confidence.toLowerCase()}). Keep watching but no action needed yet.`,
};

const CHECKLIST: Record<IssueType, string[]> = {
  'High ACOS':                       ['Reduce bids on top-spend keywords / placements', 'Review targeting — broad / loose match?', 'Check Buy Box and PDP readiness'],
  'High TACOS':                      ['Open Profitability → Overview', 'Compare ad sales vs organic sales growth', 'Identify campaigns driving the TACOS lift'],
  'CPC inflation':                   ['Lower bids on the affected keywords', 'Check auction competition for hero terms', 'Pause campaigns where CPC outruns CVR'],
  'CTR decline':                     ['Refresh main image and title', 'Test new creative variants', 'Tighten targeting if reach is too broad'],
  'CVR decline':                     ['Open Sales → Traffic and check CVR per ASIN', 'Verify Buy Box win rate', 'Audit pricing and recent PDP changes'],
  'Spend without sales':             ['Pause campaign or add negative keywords', 'Check for search-term mismatch', 'Verify the targeted ASIN is in stock'],
  'Budget limited':                  ['Lift daily budget cap if profitable', 'Reallocate from over-target campaigns', 'Verify pacing in Budget & Pacing'],
  'Low impressions':                 ['Raise bids on the affected keywords', 'Expand to additional match types', 'Verify bid floor vs auction price'],
  'Low conversion':                  ['Audit PDP — content, price, reviews', 'Check delivery promise', 'Compare ad sessions vs organic CVR'],
  'Product readiness issue':        ['Restore Buy Box', 'Replenish inventory', 'Bring rating above 4.0 before scaling'],
  'Placement inefficiency':          ['Lower the multiplier on the inefficient placement', 'Raise the multiplier on Top-of-Search if it converts', 'Check creative-fit per placement'],
  'Search term waste':               ['Add as negative keyword', 'Move to a tighter match type', 'Check for irrelevant intent'],
  'Profitable scaling opportunity':  ['Increase budget or bids', 'Move into exact-match if currently broad', 'Verify supply / inventory before scaling'],
  'High ad dependency':              ['Check organic visibility on hero terms', 'Compare ad sales share over time', 'Open Profitability to verify margin'],
  'Healthy':                         ['Keep monitoring weekly'],
};

export default function AdvertisingDecisionDrawer({
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
        className={`fixed top-0 right-0 z-50 h-screen w-full max-w-[540px] bg-white shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}
      >
        {d && <DrawerContent d={d} onClose={onClose} onCta={onCta} />}
      </aside>
    </>
  );
}

function DrawerContent({ d, onClose, onCta }: { d: Diagnostic; onClose: () => void; onCta?: (route: string) => void }) {
  const { currency } = useCurrency();
  const dec = DECISION_STYLE[d.decision];
  const sev = SEVERITY_STYLE[d.sevLevel];
  const issueCls = ISSUE_STYLE[d.issue];
  const cta = ISSUE_CTA[d.issue];
  const checks = CHECKLIST[d.issue];

  return (
    <>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3 z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[10px] font-bold border ${dec.chip}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${dec.dot}`} />
              {d.decision}
            </span>
            <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-bold border ${sev.chip}`}>{sev.label}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{ENTITY_KIND_LABEL[d.row.kind]}</span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-bold border ${issueCls}`}>{d.issue}</span>
            <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold border ${CONFIDENCE_STYLE[d.confidence]}`}>{d.confidence}</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 leading-tight" title={d.row.name}>{d.row.name}</h2>
          {d.row.subLabel && <div className="text-[11px] text-gray-500 mt-0.5">{d.row.subLabel}</div>}
          <div className="text-[11px] text-gray-500 mt-1.5">
            Spend {fc(d.row.spend, currency, { compact: true })} · Ad sales {fc(d.row.sales, currency, { compact: true })} · ACOS {d.row.acos.toFixed(1)}%
            {d.revenueImpact > 0 && <> · Impact <span className="font-semibold text-rose-700">−{fc(d.revenueImpact, currency, { compact: true })}</span></>}
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
            <p className="text-[13px] text-gray-900 leading-relaxed mt-0.5">{DIAGNOSIS[d.decision](d)}</p>
            {d.primary && (
              <p className="text-[11px] text-gray-600 mt-1.5">
                <span className="font-semibold">Drivers:</span> {d.primary}{d.secondary && <> · {d.secondary}</>}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Supporting metrics */}
        <Section title="Supporting metrics" subtitle="Current period vs prior">
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Spend"    value={fc(d.row.spend, currency, { compact: true })}  pop={d.row.spendPoP} polarity="neutral" />
            <Tile label="Ad sales" value={fc(d.row.sales, currency, { compact: true })}   pop={d.row.salesPoP} polarity="higher" />
            <Tile label="ACOS"     value={`${d.row.acos.toFixed(1)}%`}                    pop={d.row.acosPoP}  polarity="lower" />
            <Tile label="ROAS"     value={`${d.row.roas.toFixed(2)}x`}                    pop={0}             polarity="higher" />
            <Tile label="CPC"      value={fc(d.row.cpc, currency, { compact: false, decimals: 2 })} pop={d.row.cpcPoP} polarity="lower" />
            <Tile label="CTR"      value={`${d.row.ctr.toFixed(2)}%`}                     pop={d.row.ctrPoP}  polarity="higher" />
            <Tile label="CVR"      value={`${d.row.cvr.toFixed(1)}%`}                     pop={d.row.cvrPoP}  polarity="higher" />
            <Tile label="Orders"   value={d.row.orders.toLocaleString()}                   pop={d.row.ordersPoP} polarity="higher" />
          </div>
        </Section>

        {/* Product-only readiness section */}
        {d.row.kind === 'product' && (d.row.buyBoxPct !== undefined || d.row.rating !== undefined || d.row.inventoryDays !== undefined) && (
          <Section title="Product readiness" subtitle="PDP / supply signals">
            <div className="grid grid-cols-3 gap-2">
              {d.row.buyBoxPct !== undefined && (
                <Tile label="Buy Box" value={`${d.row.buyBoxPct.toFixed(0)}%`} pop={0} polarity="higher" warn={d.row.buyBoxPct < 85} />
              )}
              {d.row.rating !== undefined && (
                <Tile label="Rating" value={`${d.row.rating.toFixed(1)}★`} pop={0} polarity="higher" warn={d.row.rating < 4.0} />
              )}
              {d.row.inventoryDays !== undefined && (
                <Tile label="Days of cover" value={`${d.row.inventoryDays}d`} pop={0} polarity="higher" warn={d.row.inventoryDays < 14} />
              )}
            </div>
          </Section>
        )}

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
        {cta.ctaLabel && (
          <button
            onClick={() => onCta?.(cta.ctaRoute)}
            className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold transition-colors group"
          >
            <div className="text-left">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Next step</div>
              <div>{cta.ctaLabel}</div>
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

function Tile({ label, value, pop, polarity, warn = false }: {
  label: string;
  value: string;
  pop: number;
  polarity: 'higher' | 'lower' | 'neutral';
  warn?: boolean;
}) {
  const good = polarity === 'neutral' ? null : polarity === 'higher' ? pop > 0 : pop < 0;
  const popClass = pop === 0 || polarity === 'neutral'
    ? 'text-gray-400'
    : good ? 'text-emerald-700' : 'text-rose-700';
  const valueClass = warn ? 'text-rose-700' : 'text-gray-900';
  return (
    <div className={`rounded-md border p-2 ${warn ? 'border-rose-200 bg-rose-50/40' : 'border-gray-200'}`}>
      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`text-[14px] font-bold tabular-nums mt-0.5 ${valueClass}`}>{value}</div>
      {pop !== 0 && (
        <div className={`text-[10px] font-semibold tabular-nums ${popClass}`}>
          {pop > 0 ? '+' : ''}{pop.toFixed(1)}% PoP
        </div>
      )}
    </div>
  );
}
