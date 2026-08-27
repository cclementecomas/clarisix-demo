import { AlertTriangle, ArrowRight, Coins, Target, Layers } from 'lucide-react';
import InfoTooltip from '../InfoTooltip';
import type { PortfolioBanner } from './selectors';
import { QUADRANT_META } from './quadrant';
import { eur } from '../searchfunnel/format';

const CLOSURES = [0.25, 0.5, 0.75];

export type KeywordFilter = 'all' | 'top5' | 'under_indexed';

export default function MainIssueBanner({ banner, nTracked, closure, setClosure, onNextStep, activeFilter = 'all', onFilter }: {
  banner: PortfolioBanner; nTracked: number; closure: number; setClosure: (c: number) => void; onNextStep: () => void;
  activeFilter?: KeywordFilter; onFilter?: (f: 'top5' | 'under_indexed') => void;
}) {
  const opportunityWk = banner.opportunityWkFull * closure;
  const q = QUADRANT_META[banner.dominant];

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-white to-rose-50/40 rounded-xl border-2 border-amber-200 shadow-sm overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-400 to-amber-500" />
      <div className="px-6 py-5 flex items-start gap-6 flex-wrap lg:flex-nowrap">
        <div className="flex items-start gap-3 min-w-[260px] flex-1">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Main issue</div>
            <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">
              {Math.round(banner.dominantPct)}% of recoverable visibility € sits in the <span className={`px-1.5 py-0.5 rounded ${q.chip}`}>{q.label}</span> quadrant
            </div>
            <div className="text-[11px] text-gray-500 mt-1">{q.action} — {banner.dominant === 'invest' ? 'high-volume queries where you are barely visible.' : banner.dominant === 'defend' ? 'high-volume queries you already win — protect them.' : banner.dominant === 'harvest' ? 'low-volume queries you win — keep, don’t overspend.' : 'scattered low-volume, low-share terms.'}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 flex-shrink-0">
          <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 min-w-[130px]">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500"><Coins className="w-3.5 h-3.5 text-amber-600" />Visibility opp / wk<InfoTooltip content={`Σ per-query VISIBILITY gap (share below the market at the same conversion) × ${Math.round(closure * 100)}% closure. The conversion gap is the Search funnel page's €. Each query's split is in its row tooltip.`} wide /></div>
            <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight mt-1">{eur(opportunityWk)}</div>
            <div className="flex items-center gap-1 mt-1">
              {CLOSURES.map((c) => (
                <button key={c} onClick={() => setClosure(c)} className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${closure === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>{c * 100}%</button>
              ))}
            </div>
          </div>
          <button onClick={() => onFilter?.('top5')} title="Show the top 5 keywords by purchases"
            className={`text-left rounded-lg border bg-white/80 px-3 py-2 min-w-[120px] transition-all ${activeFilter === 'top5' ? 'border-cx-400 ring-1 ring-cx-400/40 bg-white' : 'border-gray-200 hover:border-cx-300 hover:bg-white'}`}>
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500"><Target className="w-3.5 h-3.5 text-rose-600" />Concentration<InfoTooltip content="Top-5 queries' share of your SQP purchases. High = a short to-do list." /></div>
            <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight mt-1">{Math.round(banner.concentration)}%</div>
            <div className="text-[10px] text-gray-500 mt-0.5 flex items-center justify-between gap-1">of purchases in top 5<span className="text-cx-600 font-semibold">{activeFilter === 'top5' ? 'showing' : 'view →'}</span></div>
          </button>
          <button onClick={() => onFilter?.('under_indexed')} title="Show the under-indexed keywords"
            className={`text-left rounded-lg border bg-white/80 px-3 py-2 min-w-[120px] transition-all ${activeFilter === 'under_indexed' ? 'border-cx-400 ring-1 ring-cx-400/40 bg-white' : 'border-gray-200 hover:border-cx-300 hover:bg-white'}`}>
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500"><Layers className="w-3.5 h-3.5 text-indigo-600" />Under-indexed</div>
            <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight mt-1">{banner.underIndexed}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 flex items-center justify-between gap-1">of {nTracked} tracked<span className="text-cx-600 font-semibold">{activeFilter === 'under_indexed' ? 'showing' : 'view →'}</span></div>
          </button>
        </div>

        <button onClick={onNextStep} className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold shadow-sm transition-colors group">
          <div className="text-left"><div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Next step</div><div className="leading-tight">Work the top opportunities</div></div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
