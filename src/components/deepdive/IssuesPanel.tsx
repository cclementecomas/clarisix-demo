// ─── Sales Deepdive — Issues Detected panel ──────────────────────────────
// Top of page. Shows the top 5 issues across Marketplace / Category / ASIN
// ranked by severity (= |profit impact| × confidence multiplier). Each
// card surfaces the severity LEVEL chip, profit + revenue impact, primary
// + secondary driver, confidence, and an issue-specific next-step CTA.

import { AlertCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import {
  topIssues, ISSUE_META, ISSUE_STYLE, SEVERITY_STYLE, CONFIDENCE_STYLE,
  ENTITY_KIND_LABEL,
  type Diagnostic,
} from '../../data/deepdiveDiagnostics';

const TONE_ICON = {
  critical: AlertCircle,
  warning:  AlertTriangle,
  info:     Info,
  neutral:  Info,
} as const;

const TONE_BG_BORDER = {
  critical: { bg: 'bg-rose-50/60',   border: 'border-rose-200',   icon: 'text-rose-600',   hover: 'hover:border-rose-300' },
  warning:  { bg: 'bg-amber-50/60',  border: 'border-amber-200',  icon: 'text-amber-600',  hover: 'hover:border-amber-300' },
  info:     { bg: 'bg-sky-50/60',    border: 'border-sky-200',    icon: 'text-sky-600',    hover: 'hover:border-sky-300' },
  neutral:  { bg: 'bg-slate-50/60',  border: 'border-slate-200',  icon: 'text-slate-600',  hover: 'hover:border-slate-300' },
} as const;

export default function IssuesPanel({ onIssueClick }: {
  onIssueClick?: (d: Diagnostic) => void;
}) {
  if (topIssues.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm px-5 py-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center">
          <Info className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">No issues detected</h3>
          <p className="text-[11px] text-gray-500">All marketplaces, categories and ASINs are within healthy thresholds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">Issues detected</h3>
        <span className="text-[10px] text-gray-400 ml-1">
          Top {topIssues.length} · ranked by profit impact × confidence
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 p-3">
        {topIssues.map((d, i) => (
          <IssueCard key={d.key} d={d} rank={i + 1} onClick={() => onIssueClick?.(d)} />
        ))}
      </div>
    </div>
  );
}

function IssueCard({ d, rank, onClick }: { d: Diagnostic; rank: number; onClick: () => void }) {
  const meta = ISSUE_META[d.issue];
  const tone = TONE_BG_BORDER[meta.tone];
  const Icon = TONE_ICON[meta.tone];
  const sev = SEVERITY_STYLE[d.severityLevel];
  const issueStyle = ISSUE_STYLE[d.issue];

  return (
    <button
      onClick={onClick}
      className={`group text-left flex items-start gap-2.5 p-3 rounded-lg border ${tone.bg} ${tone.border} ${tone.hover} transition-colors`}
    >
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">#{rank}</span>
        <Icon className={`w-3.5 h-3.5 ${tone.icon}`} />
      </div>
      <div className="min-w-0 flex-1">
        {/* Top row: severity + entity kind */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[10px] font-bold border ${sev.chip}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${sev.dot}`} />
            {sev.label}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{ENTITY_KIND_LABEL[d.kind]}</span>
        </div>
        {/* Entity name */}
        <div className="text-[13px] font-semibold text-gray-900 leading-snug mt-1">
          {d.name}
          {d.kind === 'asin' && d.subLabel ? <span className="text-[11px] text-gray-500 font-normal"> · {d.subLabel}</span> : null}
        </div>
        {/* Issue + confidence */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-bold border ${issueStyle.chip}`}>
            {d.issue}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold border ${CONFIDENCE_STYLE[d.confidence]}`}>
            {d.confidence} confidence
          </span>
        </div>
        {/* Drivers */}
        <div className="text-[11px] text-gray-700 mt-1.5 leading-snug">
          {d.primary && <><span className="text-gray-500">Main:</span> <span className="font-medium text-gray-900">{d.primary.label}</span></>}
          {d.secondary && (
            <>
              <span className="text-gray-300 mx-1.5">·</span>
              <span className="text-gray-500">Then:</span> <span className="text-gray-700">{d.secondary.label}</span>
            </>
          )}
        </div>
        {/* Impact split */}
        <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px]">
          <span className="text-gray-500">
            Profit <span className={`font-bold tabular-nums ${d.profitImpact > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
              {d.profitImpact > 0 ? `−€${d.profitImpact.toLocaleString()}` : '—'}
            </span>
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-500">
            Revenue <span className={`font-bold tabular-nums ${d.revenueImpact > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
              {d.revenueImpact > 0 ? `−€${d.revenueImpact.toLocaleString()}` : '—'}
            </span>
          </span>
        </div>
        {/* CTA */}
        <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-gray-900 group-hover:gap-1.5 transition-all">
          {meta.ctaLabel}
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}
