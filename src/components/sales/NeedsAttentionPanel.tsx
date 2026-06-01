// ─── Needs Attention Panel ───────────────────────────────────────────────
// Compact alert strip below the executive insight card. Renders up to 3
// alerts, priority-ordered (see Rule 6 in salesOverviewInsights.ts).
//
// Each alert is a clickable card with a title, supporting detail, and a
// CTA chip that routes the user to the right diagnostic surface.

import { AlertCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { attentionAlerts, type AttentionAlert, type AttentionCta } from '../../data/salesOverviewInsights';

const SEVERITY_STYLE: Record<AttentionAlert['severity'], { bg: string; border: string; iconColor: string; ringHover: string }> = {
  critical: { bg: 'bg-rose-50/60',    border: 'border-rose-200',    iconColor: 'text-rose-600',    ringHover: 'hover:border-rose-300' },
  warning:  { bg: 'bg-amber-50/60',   border: 'border-amber-200',   iconColor: 'text-amber-600',   ringHover: 'hover:border-amber-300' },
  info:     { bg: 'bg-sky-50/60',     border: 'border-sky-200',     iconColor: 'text-sky-600',     ringHover: 'hover:border-sky-300' },
};

const SEVERITY_ICON: Record<AttentionAlert['severity'], React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  warning:  AlertTriangle,
  info:     Info,
};

export default function NeedsAttentionPanel({ onCta }: { onCta?: (route: AttentionCta['route']) => void }) {
  if (attentionAlerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">Needs attention</h3>
        <span className="text-[10px] text-gray-400 ml-1">
          {attentionAlerts.length} {attentionAlerts.length === 1 ? 'alert' : 'alerts'} · ranked by impact
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3">
        {attentionAlerts.map((alert) => {
          const style = SEVERITY_STYLE[alert.severity];
          const Icon = SEVERITY_ICON[alert.severity];
          return (
            <button
              key={alert.id}
              onClick={() => onCta?.(alert.cta.route)}
              className={`group text-left flex items-start gap-2.5 p-3 rounded-lg border ${style.bg} ${style.border} ${style.ringHover} transition-colors`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-gray-900 leading-snug">{alert.title}</div>
                <p className="text-[11px] text-gray-600 leading-snug mt-1">{alert.detail}</p>
                <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-gray-900 group-hover:gap-1.5 transition-all">
                  {alert.cta.label}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
