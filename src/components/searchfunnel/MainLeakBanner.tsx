import { useState } from 'react';
import { AlertTriangle, ShieldCheck, ArrowRight, TrendingDown, Coins, Percent, HelpCircle } from 'lucide-react';
import InfoTooltip from '../InfoTooltip';
import HowCalculatedModal from '../sqpui/HowCalculatedModal';
import type { Verdict } from '../../lib/sqp/verdict';
import type { TransitionKey } from '../../lib/sqp/types';
import { eur, pct, int } from './format';
import { TRANSITION_NAME as STAGE_NAME } from '../sqpui/tokens';

const STAGE_SHORT: Record<'impressions' | 'clicks' | 'baskets' | 'purchases', string> = { impressions: 'impressions', clicks: 'clicks', baskets: 'basket adds', purchases: 'purchases' };

export default function MainLeakBanner({ verdict, nWeeks, onFocusStage, onFocusTrend }: {
  verdict: Verdict; nWeeks: number; onFocusStage: (s: TransitionKey | null) => void; onFocusTrend: () => void;
}) {
  const [modal, setModal] = useState(false);
  const v = verdict;
  const sev = v.severity.level;

  // Severity-scaled shell
  const shell = sev === 'critical' ? 'border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50/40'
    : sev === 'warning' ? 'border border-gray-200 border-l-4 border-l-amber-400 bg-white'
    : v.primary === 'healthy' ? 'border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white'
    : 'border border-gray-200 bg-white';

  return (
    <div className={`relative rounded-xl shadow-sm overflow-hidden ${shell}`}>
      {sev === 'critical' && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />}
      <div className="px-6 py-5 flex items-start gap-6 flex-wrap lg:flex-nowrap">
        {v.primary === 'healthy' ? <HealthyBody v={v} /> : (
          <>
            <div className="flex items-start gap-3 min-w-[280px] flex-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${sev === 'critical' ? 'bg-rose-100' : 'bg-amber-100'}`}>
                {sev === 'critical' ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <TrendingDown className="w-5 h-5 text-amber-600" />}
              </div>
              <div className="min-w-0">
                {v.primary === 'share' ? <ShareHead v={v} nWeeks={nWeeks} /> : <ConvHead v={v} />}
                <div className="mt-1.5">{v.primary === 'share' ? <SecondaryConv v={v} onFocusStage={onFocusStage} /> : <SecondaryShare v={v} nWeeks={nWeeks} onFocusTrend={onFocusTrend} />}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 min-w-[130px]">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500"><Coins className="w-3.5 h-3.5 text-amber-600" />€ / wk<InfoTooltip content={
                  v.primary === 'share'
                    ? `Purchase-share loss you'd win back by matching the market: max(0, −Δpurchase share) × market purchases/wk × €${v.asp} ASP. ≈ ${int(v.headlineEurWk / v.asp)} units/wk.`
                    : `Recoverable € at ${v.conv.stage ? STAGE_NAME[v.conv.stage] : ''} = what you'd win back by matching the market, summed per ASIN so over-performers don't hide under-performers. ≈ ${int(v.headlineEurWk / v.asp)} units/wk.`
                } wide /></div>
                <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight mt-1">{eur(v.headlineEurWk)}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 min-w-[130px]">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500"><Percent className="w-3.5 h-3.5 text-rose-600" />of search revenue<InfoTooltip content="Headline € ÷ your weekly SQP purchase revenue (purchases/wk × ASP). ≥10% critical · 3–10% warning · <3% watch." /></div>
                <div className={`text-lg font-bold tabular-nums leading-tight mt-1 ${sev === 'critical' ? 'text-rose-700' : sev === 'warning' ? 'text-amber-700' : 'text-gray-900'}`}>{(v.severity.ratio * 100).toFixed(1)}%</div>
                <div className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">{sev}</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button onClick={() => (v.primary === 'share' ? onFocusTrend() : onFocusStage(v.conv.stage))}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold shadow-sm transition-colors group">
                <div className="text-left"><div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Next step</div><div className="leading-tight">Review leaking ASINs</div></div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={() => setModal(true)} className="inline-flex items-center gap-1 text-[10px] text-cx-600 hover:text-cx-700 font-semibold"><HelpCircle className="w-3 h-3" /> How this is calculated</button>
            </div>
          </>
        )}
      </div>
      <HowCalculatedModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}

function ShareHead({ v, nWeeks }: { v: Verdict; nWeeks: number }) {
  const s = v.share.firstFallingStage ? STAGE_SHORT[v.share.firstFallingStage] : 'the funnel';
  return (
    <>
      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Share decline · started at {s}</div>
      <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">Your search share is falling across the funnel</div>
      <div className="text-[11px] text-gray-500 mt-1">Purchase share {pct(v.share.firstShare)} → {pct(v.share.lastShare)} over {nWeeks} weeks.</div>
    </>
  );
}
function ConvHead({ v }: { v: Verdict }) {
  return (
    <>
      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Main leak · {v.conv.stage ? STAGE_NAME[v.conv.stage] : '—'}</div>
      <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">You convert below the market at {v.conv.stage ? STAGE_NAME[v.conv.stage] : 'this stage'}</div>
      <div className="text-[11px] text-gray-500 mt-1">Recoverable across {v.conv.nAsins} ASIN{v.conv.nAsins === 1 ? '' : 's'} · you {pct(v.conv.yourRate ?? 0)} vs market {pct(v.conv.marketRate ?? 0)}.</div>
    </>
  );
}
function SecondaryConv({ v, onFocusStage }: { v: Verdict; onFocusStage: (s: TransitionKey | null) => void }) {
  return (
    <button onClick={() => onFocusStage(v.conv.stage)} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-0.5">
      Also: conversion leaks {eur(v.conv.addressableTotal)}/wk <ArrowRight className="w-3 h-3" />
    </button>
  );
}
function SecondaryShare({ v, nWeeks, onFocusTrend }: { v: Verdict; nWeeks: number; onFocusTrend: () => void }) {
  return (
    <button onClick={onFocusTrend} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-0.5">
      Also: purchase share {(v.share.purchDeltaPp * 100).toFixed(1)}pp vs prior {nWeeks}w <ArrowRight className="w-3 h-3" />
    </button>
  );
}

function HealthyBody({ v }: { v: Verdict }) {
  const rates: { label: string; you: number | null; mkt: number | null }[] = [
    { label: 'CTR', you: v.rates.ctr, mkt: v.rates.ctrM },
    { label: 'Basket-add', you: v.rates.atc, mkt: v.rates.atcM },
    { label: 'Purchase', you: v.rates.close, mkt: v.rates.closeM },
  ];
  return (
    <>
      <div className="flex items-start gap-3 min-w-[280px] flex-1">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">No material leak</div>
          <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">Funnel at or above market at every stage, share stable</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        {rates.map((r) => (
          <div key={r.label} className="rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 min-w-[110px]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{r.label}</div>
            <div className="text-base font-bold text-emerald-700 tabular-nums leading-tight mt-1">{pct(r.you ?? 0)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">market {pct(r.mkt ?? 0)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
