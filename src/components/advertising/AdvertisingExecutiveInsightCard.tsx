// ─── Advertising Overview — Executive Insight Card ────────────────────────
// Top of the Overview page. Deterministic insight, no LLM.

import { AlertTriangle, ArrowRight, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
import { buildExecutiveInsight, advertisingSummary, CONFIDENCE_STYLE } from '../../data/advertisingDiagnostics';

export default function AdvertisingExecutiveInsightCard({ onCta }: { onCta?: (route: string) => void }) {
  const insight = buildExecutiveInsight();
  const s = advertisingSummary;
  const acosGetting = s.acosPoP > 0; // ACOS going up = worse
  const salesGrowing = s.salesPoP > 0;

  const tone = acosGetting ? 'critical' : salesGrowing ? 'good' : 'neutral';
  const toneCls = tone === 'critical'
    ? 'from-rose-50 via-white to-amber-50/40 border-rose-200'
    : tone === 'good'
      ? 'from-emerald-50 via-white to-emerald-50/40 border-emerald-200'
      : 'from-slate-50 via-white to-slate-50/40 border-slate-200';
  const accentCls = tone === 'critical'
    ? 'from-rose-500 via-amber-500 to-rose-500'
    : tone === 'good'
      ? 'from-emerald-500 via-emerald-400 to-emerald-500'
      : 'from-slate-500 via-slate-400 to-slate-500';
  const iconBg = tone === 'critical' ? 'bg-rose-100 text-rose-600' : tone === 'good' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600';
  const HeadlineIcon = tone === 'critical' ? AlertTriangle : tone === 'good' ? TrendingUp : Lightbulb;

  return (
    <div className={`relative bg-gradient-to-br ${toneCls} rounded-xl border-2 shadow-sm overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentCls}`} />
      <div className="px-6 py-5">
        <div className="flex items-start gap-6 flex-wrap lg:flex-nowrap">
          {/* Headline */}
          <div className="flex items-start gap-3 min-w-[260px] flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <HeadlineIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Executive insight</span>
                <span className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold border bg-slate-50 text-slate-700 border-slate-200">
                  Comparison · {insight.comparison}
                </span>
                <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold border ${CONFIDENCE_STYLE[insight.confidence]}`}>
                  {insight.confidence} confidence
                </span>
              </div>
              <div className="text-xl font-bold text-gray-900 leading-tight">
                <span className="text-gray-500 font-semibold mr-1.5">{insight.comparison}:</span>
                {insight.headline}
              </div>
              <p className="text-[12px] text-gray-700 leading-relaxed mt-1.5 max-w-[640px]">{insight.body}</p>
              <p className="text-[12px] text-gray-700 leading-relaxed mt-1 max-w-[640px]">
                <span className="font-semibold">Main issue:</span> {insight.issueLabel}. <span className="font-semibold">Driver:</span> {insight.driver}.
              </p>
            </div>
          </div>

          {/* Headline metric tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-shrink-0">
            <Tile label="Ad sales" value={fmtEur(s.totalSales)} pop={s.salesPoP} polarity="higher" />
            <Tile label="Spend"    value={fmtEur(s.totalSpend)} pop={s.spendPoP} polarity="neutral" />
            <Tile label="ACOS"     value={`${s.acos.toFixed(1)}%`} pop={s.acosPoP} polarity="lower" />
            <Tile label="TACOS"    value={`${s.tacos.toFixed(1)}%`} pop={0}        polarity="lower" />
          </div>

          {/* CTA */}
          <button
            onClick={() => onCta?.(insight.ctaRoute)}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold shadow-sm transition-colors group"
          >
            <div className="text-left">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Next step</div>
              <div className="leading-tight">{insight.ctaLabel}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, pop, polarity }: {
  label: string;
  value: string;
  pop: number;
  polarity: 'higher' | 'lower' | 'neutral';
}) {
  const good = polarity === 'neutral' ? null : polarity === 'higher' ? pop > 0 : pop < 0;
  const popColor = pop === 0 || polarity === 'neutral'
    ? 'text-gray-500'
    : good ? 'text-emerald-700' : 'text-rose-700';
  return (
    <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 min-w-[110px]">
      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-base font-bold text-gray-900 tabular-nums leading-tight mt-1">{value}</div>
      <div className={`text-[10px] font-semibold tabular-nums inline-flex items-center gap-0.5 mt-0.5 ${popColor}`}>
        {pop !== 0 && (pop > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />)}
        {pop !== 0 ? `${pop > 0 ? '+' : ''}${pop.toFixed(1)}% PoP` : '—'}
      </div>
    </div>
  );
}

function fmtEur(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `€${(n / 1_000).toFixed(0)}k`;
  return `€${n.toFixed(0)}`;
}
