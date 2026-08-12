import { X, ArrowRight, CheckCircle2, CornerDownRight } from 'lucide-react';
import { NATURE_META, type RootCause } from '../data/rootCauseData';

interface RootCausePanelProps {
  metric: string;
  periodLabel: string;
  displayValue: string;
  changeStr: string;
  isPositive: boolean;
  cause: RootCause;
  onClose: () => void;
  onNavigate?: (section: string, sub: string) => void;
}

/** Cross-metric root cause — the "why" behind one snapshot cell. Sorts the other
 *  pillars into cause / knock-on / ruled-out so the reader gets one answer, not six numbers. */
export default function RootCausePanel({
  metric, periodLabel, displayValue, changeStr, isPositive, cause, onClose, onNavigate,
}: RootCausePanelProps) {
  const nat = NATURE_META[cause.nature];
  const metricTone = isPositive
    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
    : 'bg-rose-50 border-rose-200 text-rose-900';

  return (
    <div className="border-t border-cx-100 bg-gradient-to-b from-cx-50/40 to-white animate-fade-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cx-700">Why did it move?</span>
          <span className="text-[11px] text-gray-500">
            {metric} · <span className="tabular-nums font-semibold">{displayValue}</span>
            {changeStr && <span className={`tabular-nums font-semibold ml-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{changeStr}</span>}
            <span className="text-gray-400"> · {periodLabel}</span>
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${nat.cls}`}>{nat.label}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0" title="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Verdict — the answer, read this and stop */}
      <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed max-w-3xl">{cause.verdict}</p>

      {/* Causal chain: causes ──▶ the focused metric */}
      {cause.causes.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-stretch gap-3 flex-col lg:flex-row">
            {/* Causes */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">What moved it</p>
              <div className="space-y-1.5">
                {cause.causes.map((c) => {
                  const hurt = c.effect === 'hurt';
                  return (
                    <div key={c.pillar} className={`rounded-lg border px-3 py-2 ${hurt ? 'border-rose-200 bg-rose-50/60' : 'border-emerald-200 bg-emerald-50/60'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-gray-800 truncate">{c.pillar}</span>
                          <span className={`text-[11px] font-bold tabular-nums ${hurt ? 'text-rose-600' : 'text-emerald-600'}`}>{c.delta}</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${hurt ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {hurt ? (c.weightPct > 0 ? `~${c.weightPct}% of the move` : 'drag') : (c.weightPct > 0 ? 'main tailwind' : 'helped · offset')}
                        </span>
                      </div>
                      {/* contribution bar (hurt drivers with a weight) */}
                      {hurt && c.weightPct > 0 && (
                        <div className="mt-1.5 h-1 w-full rounded-full bg-rose-100 overflow-hidden">
                          <div className="h-full rounded-full bg-rose-400" style={{ width: `${c.weightPct}%` }} />
                        </div>
                      )}
                      <p className="text-[11px] text-gray-600 mt-1 leading-snug">{c.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center px-1 text-gray-300">
              <ArrowRight className="w-6 h-6" />
            </div>

            {/* Focused metric node */}
            <div className="lg:w-52 flex-shrink-0 flex lg:items-center">
              <div className={`w-full rounded-lg border-2 px-3 py-2.5 ${metricTone}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{metric}</p>
                <p className="text-lg font-bold tabular-nums leading-tight">{displayValue}</p>
                {changeStr && <p className="text-xs font-bold tabular-nums">{changeStr} · {periodLabel}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Knock-on effects */}
      {cause.consequences.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Knock-on — moved because {metric} did</p>
          <div className="space-y-1">
            {cause.consequences.map((c) => (
              <div key={c.pillar} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                <CornerDownRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold text-gray-800">{c.pillar}</span> <span className="tabular-nums font-semibold text-gray-500">{c.delta}</span> — {c.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ruled out — what NOT to worry about */}
      {cause.ruledOut.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Ruled out — healthy, not the cause</p>
          <div className="flex flex-wrap gap-1.5">
            {cause.ruledOut.map((r) => (
              <span key={r.pillar} title={r.note}
                className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full pl-1.5 pr-2 py-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="font-semibold">{r.pillar}</span>
                <span className="tabular-nums text-emerald-600">{r.delta}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      {cause.action && (
        <div className="px-4 pb-3.5 pt-1">
          <button
            onClick={() => onNavigate?.(cause.action!.section, cause.action!.sub)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-cx-700 bg-white border border-cx-200 hover:border-cx-400 hover:bg-cx-50 rounded-lg px-3 py-1.5 transition-colors"
          >
            <span>{cause.action.text}</span>
            <span className="text-cx-400">·</span>
            <span className="inline-flex items-center gap-0.5 text-cx-600">Open {cause.action.sub} <ArrowRight className="w-3 h-3" /></span>
          </button>
        </div>
      )}
    </div>
  );
}
