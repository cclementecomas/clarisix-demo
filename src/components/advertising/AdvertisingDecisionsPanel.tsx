// ─── Advertising Overview — Top Advertising Decisions ────────────────────
// Default shows 3 cards (best scale opportunity + biggest waste/pause +
// biggest diagnostic issue). "View all decisions" expands to the full
// list of opportunities + risks, split into two labeled sections.
//
// Card surface kept tight per spec rule 4: ONE decision badge, ONE
// confidence badge, entity name, Because sentence, optional Watch line,
// "Opportunity / Risk / Waste" amount, action.

import { useState } from 'react';
import { AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Sparkles, TrendingUp, Wrench, Eye, Check, Clock, Ban } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import { useAdDecisionLog, clearAllDecisions, type DecisionAction } from '../../utils/adDecisionLog';
import {
  topThreeDecisions, topScaleOpportunities, topRiskDecisions,
  DECISION_STYLE, CONFIDENCE_STYLE, ISSUE_CTA, ENTITY_KIND_LABEL,
  type Diagnostic, type Decision,
} from '../../data/advertisingDiagnostics';

type CardKind = 'opportunity' | 'risk' | 'waste';

function kindOf(decision: Decision): CardKind {
  if (decision === 'Scale' || decision === 'Protect') return 'opportunity';
  if (decision === 'Pause' || decision === 'Waste')   return 'waste';
  return 'risk';
}

function impactLabel(kind: CardKind): string {
  return kind === 'opportunity' ? 'Opportunity' : kind === 'waste' ? 'Waste' : 'Risk';
}

const SLOT_META: { key: 'bestScale' | 'biggestWaste' | 'biggestFix'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'bestScale',   label: 'Best scale opportunity', icon: TrendingUp },
  { key: 'biggestWaste', label: 'Biggest waste / risk',  icon: AlertTriangle },
  { key: 'biggestFix',  label: 'Biggest diagnostic issue', icon: Wrench },
];

function DecisionStateChip({ action, at }: { action: DecisionAction; at: number }) {
  const cls = action === 'accepted'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : action === 'snoozed'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-gray-100 text-gray-500 border-gray-200';
  const Icon = action === 'accepted' ? Check : action === 'snoozed' ? Clock : Ban;
  const label = action === 'accepted' ? 'Accepted' : action === 'snoozed' ? 'Snoozed' : 'Dismissed';
  const date = new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[10px] font-semibold border ${cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {label} · {date}
    </span>
  );
}

export default function AdvertisingDecisionsPanel({ onCardClick }: {
  onCardClick?: (d: Diagnostic) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const log = useAdDecisionLog();

  const hasAny = topScaleOpportunities.length > 0 || topRiskDecisions.length > 0;
  if (!hasAny) return null;

  const decided = Object.values(log);
  const counts = {
    accepted: decided.filter((e) => e.action === 'accepted').length,
    snoozed: decided.filter((e) => e.action === 'snoozed').length,
    dismissed: decided.filter((e) => e.action === 'dismissed').length,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">Top advertising decisions</h3>
        <span className="text-[10px] text-gray-400 ml-1">
          {showAll ? 'All opportunities and risks' : 'Default — top 3 by spend × confidence'}
        </span>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-cx-700 bg-cx-50 hover:bg-cx-100 transition-colors"
        >
          {showAll ? <ChevronUp className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showAll ? 'Hide expanded view' : 'View all decisions'}
        </button>
      </div>

      {decided.length > 0 && (
        <div className="px-5 py-1.5 bg-gray-50/60 border-b border-gray-100 flex items-center gap-2 text-[11px] flex-wrap">
          <span className="font-semibold text-gray-700">Decision log:</span>
          <span className="text-emerald-700 font-medium">{counts.accepted} accepted</span>
          <span className="text-gray-300">·</span>
          <span className="text-amber-700 font-medium">{counts.snoozed} snoozed</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-500 font-medium">{counts.dismissed} dismissed</span>
          <span className="text-gray-400">— outcomes measured next period</span>
          <button onClick={clearAllDecisions} className="ml-auto text-[10px] text-gray-400 hover:text-gray-700 underline">
            Clear log
          </button>
        </div>
      )}

      {!showAll ? (
        // Default — top 3 slotted cards (best scale, biggest waste, biggest fix)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 p-3">
          {SLOT_META.map((slot) => {
            const d = topThreeDecisions[slot.key];
            return (
              <SlotCard
                key={slot.key}
                slot={slot}
                d={d}
                onClick={() => d && onCardClick?.(d)}
              />
            );
          })}
        </div>
      ) : (
        // Expanded — full lists split into opportunities + risks
        <>
          {topScaleOpportunities.length > 0 && (
            <Section
              icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
              label="Scale opportunities"
              tone="opportunity"
            >
              {topScaleOpportunities.map((d, i) => (
                <DecisionCard key={d.row.key} d={d} rank={i + 1} onClick={() => onCardClick?.(d)} />
              ))}
            </Section>
          )}
          {topRiskDecisions.length > 0 && (
            <Section
              icon={<AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
              label="Fix / reduce risks"
              tone="risk"
              isLast
            >
              {topRiskDecisions.map((d, i) => (
                <DecisionCard key={d.row.key} d={d} rank={i + 1} onClick={() => onCardClick?.(d)} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ icon, label, tone, isLast, children }: {
  icon: React.ReactNode;
  label: string;
  tone: 'opportunity' | 'risk';
  isLast?: boolean;
  children: React.ReactNode;
}) {
  const labelColor = tone === 'opportunity' ? 'text-emerald-700' : 'text-rose-700';
  return (
    <div className={isLast ? '' : 'border-b border-gray-100'}>
      <div className="px-5 py-2 flex items-center gap-1.5 bg-gray-50/40">
        {icon}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>{label}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 p-3">
        {children}
      </div>
    </div>
  );
}

function SlotCard({ slot, d, onClick }: {
  slot: { key: string; label: string; icon: React.ComponentType<{ className?: string }> };
  d: Diagnostic | null;
  onClick: () => void;
}) {
  const SlotIcon = slot.icon;
  if (!d) {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/40">
        <SlotIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{slot.label}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">No qualifying entity this period.</p>
        </div>
      </div>
    );
  }
  return (
    <DecisionCard d={d} slotLabel={slot.label} slotIcon={SlotIcon} onClick={onClick} />
  );
}

function DecisionCard({ d, slotLabel, slotIcon, rank, onClick }: {
  d: Diagnostic;
  slotLabel?: string;
  slotIcon?: React.ComponentType<{ className?: string }>;
  rank?: number;
  onClick: () => void;
}) {
  const { currency } = useCurrency();
  const log = useAdDecisionLog();
  const entry = log[d.row.key];
  const dec = DECISION_STYLE[d.decision];
  const cta = ISSUE_CTA[d.issue];
  const kind = kindOf(d.decision);
  const accent = kind === 'opportunity'
    ? 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/30'
    : kind === 'waste'
      ? 'border-rose-300 hover:border-rose-400 bg-rose-50/40'
      : 'border-rose-200 hover:border-rose-300 bg-rose-50/30';
  const SlotIcon = slotIcon;
  const amountColor = kind === 'opportunity' ? 'text-emerald-700' : 'text-rose-700';
  const amountSign  = kind === 'opportunity' ? '+' : '−';

  return (
    <button
      onClick={onClick}
      className={`group text-left flex items-start gap-2.5 p-3 rounded-lg border ${accent} transition-colors ${entry?.action === 'dismissed' ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
        {rank !== undefined && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">#{rank}</span>}
        {SlotIcon && <SlotIcon className={`w-3.5 h-3.5 ${kind === 'opportunity' ? 'text-emerald-600' : 'text-rose-600'}`} />}
      </div>
      <div className="min-w-0 flex-1">
        {/* Slot label (top-3 default mode) */}
        {slotLabel && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{slotLabel}</div>
        )}

        {/* ONE decision badge + ONE confidence badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[10px] font-bold border ${dec.chip}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dec.dot}`} />
            {d.decision} · {d.severityLabel}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold border ${CONFIDENCE_STYLE[d.confidence]}`}>
            {d.confidence}
          </span>
          {entry && <DecisionStateChip action={entry.action} at={entry.at} />}
        </div>

        {/* Entity name */}
        <div className="text-[13px] font-semibold text-gray-900 leading-snug mt-1 truncate" title={d.row.name}>
          {d.row.name}
          {d.row.subLabel && <span className="text-[11px] text-gray-500 font-normal"> · {d.row.subLabel}</span>}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
          {ENTITY_KIND_LABEL[d.row.kind]}
        </div>

        {/* Because sentence */}
        <p className="text-[11px] text-gray-700 leading-snug mt-1.5">{d.because}</p>

        {/* Watch counter-signal (only when present) */}
        {d.watch && (
          <p className="text-[11px] text-amber-700 leading-snug mt-1 font-medium">{d.watch}</p>
        )}

        {/* Opportunity / Risk / Waste amount + CTA */}
        <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
          <span className="text-[10px] text-gray-500">
            {impactLabel(kind)}{' '}
            <span className={`font-bold tabular-nums ${amountColor}`}>
              {amountSign}{fc(d.revenueImpact, currency, { compact: true })}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-900 group-hover:gap-1.5 transition-all">
            {cta.ctaLabel}
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </button>
  );
}
