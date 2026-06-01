// ─── Sales Overview Executive Insight Card ───────────────────────────────
// Top-of-page hero that answers four questions in one read:
//   1. Are we on track?  (pace badge)
//   2. What's the projected outcome?  (Projected EOM + gap)
//   3. What changed?  (Main driver + Main watchout)
//   4. What should I do next?  (CTA)

import { AlertTriangle, ArrowRight, Coins, Target, TrendingDown, TrendingUp } from 'lucide-react';
import {
  paceStatus, executiveHeadline,
  PROJECTED_EOM, MTD_ACTUAL, LAST_YEAR_SAME_PERIOD, gapToTarget, popChangePct, yoyChangePct, TARGET_SALES,
  mainDriver, mainWatchout, headlineCta,
  signedCompactEur, compactEur,
} from '../../data/salesOverviewInsights';

const PACE_STYLE: Record<'good' | 'neutral' | 'bad', { ring: string; bg: string; text: string; accent: string }> = {
  good:    { ring: 'border-emerald-200', bg: 'from-emerald-50 via-white to-emerald-50/40', text: 'text-emerald-700', accent: 'from-emerald-500 via-emerald-400 to-emerald-500' },
  neutral: { ring: 'border-slate-200',   bg: 'from-slate-50 via-white to-slate-50/40',     text: 'text-slate-700',   accent: 'from-slate-500 via-slate-400 to-slate-500' },
  bad:     { ring: 'border-rose-200',    bg: 'from-rose-50 via-white to-amber-50/40',      text: 'text-rose-700',    accent: 'from-rose-500 via-amber-500 to-rose-500' },
};

export default function ExecutiveInsightCard({ onCta }: { onCta?: (route: string) => void }) {
  const cta = headlineCta();
  const style = PACE_STYLE[paceStatus.tone];
  const headlineIcon = paceStatus.tone === 'good' ? TrendingUp : AlertTriangle;
  const HeadlineIcon = headlineIcon;

  return (
    <div className={`relative bg-gradient-to-br ${style.bg} rounded-xl border-2 ${style.ring} shadow-sm overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.accent}`} />

      <div className="px-6 py-5">
        <div className="flex items-start gap-6 flex-wrap lg:flex-nowrap">
          {/* Headline column */}
          <div className="flex items-start gap-3 min-w-[260px] flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${paceStatus.tone === 'good' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              <HeadlineIcon className={`w-5 h-5 ${style.text}`} />
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>Pace</div>
              <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">
                {paceStatus.label}
              </div>
              <div className="text-[12px] text-gray-600 mt-1 max-w-[520px] leading-relaxed">
                {executiveHeadline}
              </div>
            </div>
          </div>

          {/* Metric row */}
          <div className="grid grid-cols-3 gap-3 flex-shrink-0">
            <MetricTile
              label="Projected EOM"
              value={compactEur(PROJECTED_EOM)}
              sub={`MTD ${compactEur(MTD_ACTUAL)} actual`}
              icon={<Coins className="w-3.5 h-3.5 text-amber-600" />}
            />
            <MetricTile
              label={TARGET_SALES ? 'Gap to target' : 'vs Last period'}
              value={TARGET_SALES ? signedCompactEur(gapToTarget) : `${popChangePct >= 0 ? '+' : ''}${popChangePct}%`}
              sub={TARGET_SALES ? `Target ${compactEur(TARGET_SALES)}` : 'vs prior month'}
              icon={<Target className="w-3.5 h-3.5 text-rose-600" />}
              tone={TARGET_SALES && gapToTarget < 0 ? 'bad' : 'good'}
            />
            <MetricTile
              label="vs Last year"
              value={`${yoyChangePct >= 0 ? '+' : ''}${yoyChangePct}%`}
              sub={`vs ${compactEur(LAST_YEAR_SAME_PERIOD)} same month '25`}
              icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
              tone={yoyChangePct >= 0 ? 'good' : 'bad'}
            />
          </div>

          {/* CTA */}
          <button
            onClick={() => onCta?.(cta.route)}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold shadow-sm transition-colors group"
          >
            <div className="text-left">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Next step</div>
              <div className="leading-tight">{cta.label}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Driver / watchout strip */}
        {(mainDriver || mainWatchout) && (
          <div className="mt-5 pt-4 border-t border-white/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mainDriver && (
              <DriverChip
                kind="driver"
                name={mainDriver.row.name}
                category={mainDriver.kind}
                change={mainDriver.row.change}
                contribution={mainDriver.row.contributionPct}
              />
            )}
            {mainWatchout && (
              <DriverChip
                kind="watchout"
                name={mainWatchout.row.name}
                category={mainWatchout.kind}
                change={mainWatchout.row.change}
                changePct={mainWatchout.row.changePct}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value, sub, icon, tone = 'neutral' }: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  const valueCls = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : 'text-gray-900';
  return (
    <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 min-w-[120px]">
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
        {icon}
        {label}
      </div>
      <div className={`text-lg font-bold tabular-nums leading-tight mt-1 ${valueCls}`}>{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

function DriverChip({ kind, name, category, change, changePct, contribution }: {
  kind: 'driver' | 'watchout';
  name: string;
  category: 'marketplace' | 'category' | 'asin';
  change: number;
  changePct?: number;
  contribution?: number;
}) {
  const positive = kind === 'driver';
  const labelText = positive ? 'Main driver' : 'Watchout';
  const Icon = positive ? TrendingUp : TrendingDown;
  const toneCls = positive ? 'text-emerald-700' : 'text-rose-700';
  const bgCls   = positive ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200';

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${bgCls}`}>
      <div className={`w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0 border ${positive ? 'border-emerald-200' : 'border-rose-200'}`}>
        <Icon className={`w-3.5 h-3.5 ${toneCls}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{labelText} · {category}</div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[13px] font-semibold text-gray-900 truncate">{name}</span>
          <span className={`text-[12px] font-bold tabular-nums ${toneCls}`}>{signedCompactEur(change)}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          {positive && contribution !== undefined
            ? `${contribution.toFixed(0)}% of growth`
            : changePct !== undefined
              ? `${changePct.toFixed(1)}% vs prior period`
              : null}
        </div>
      </div>
    </div>
  );
}
