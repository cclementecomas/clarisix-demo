import { useEffect } from 'react';
import { X, Lightbulb, Lock, ArrowUpRight } from 'lucide-react';
import type { SqpRow } from '../../lib/sqp/types';
import { asinDetail, productImageUrl } from './selectors';
import type { AsinTransition } from './selectors';
import { LEAK_CHIP } from './leakChip';
import { transitionColor } from '../sqpui/tokens';
import MiniWaterfall from '../sqpui/MiniWaterfall';
import { flags } from '../../lib/sqp/constants';
import { pct, pp, eur, money, int } from './format';

const SEV_TINT: Record<string, string> = { critical: 'bg-rose-50 text-rose-700 ring-rose-200', warning: 'bg-amber-50 text-amber-700 ring-amber-200', watch: 'bg-gray-100 text-gray-600 ring-gray-200', none: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };

export default function AsinDrawer({ asin, rows, onClose, onOpenKeyword }: { asin: string | null; rows: SqpRow[]; onClose: () => void; onOpenKeyword?: (query: string, branded: boolean) => void }) {
  useEffect(() => {
    if (!asin) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [asin, onClose]);

  const open = asin !== null;
  const d = asin ? asinDetail(rows, asin) : null;
  const aspSource = d ? (d.asp.source === 'purchases' ? 'median purchase price' : d.asp.source === 'clicks' ? 'median click price' : 'default') : '';

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed top-0 right-0 z-50 h-screen w-full max-w-[560px] bg-white shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        {d && (
          <>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3 z-10">
              <div className="flex items-start gap-3 min-w-0">
                <img src={productImageUrl(d.asin)} alt="" width={44} height={44} className="w-11 h-11 rounded-md object-cover bg-gray-100 border border-gray-200 flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900 leading-tight truncate" title={d.title}>{d.title}</h2>
                  <div className="text-[11px] text-gray-500 mt-0.5 font-mono">{d.asin}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {d.missedEurWk > 0 && <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${SEV_TINT[d.severity]}`}>Missed {eur(d.missedEurWk)}/wk</span>}
                    {d.leakKey && <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${LEAK_CHIP[d.leakKey].cls}`}>{LEAK_CHIP[d.leakKey].short} leak</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">ASP €{d.asp.value} ({aspSource})</div>
                </div>
              </div>
              <button onClick={onClose} className="flex-shrink-0 w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500"><X className="w-4 h-4" /></button>
            </div>

            {d.actions.length > 0 && (
              <div className="px-5 py-3 bg-amber-50/40 border-b border-amber-100">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Recommended — ranked by evidence</div>
                    <ol className="space-y-1.5">
                      {d.actions.map((a, i) => (
                        <li key={i} className="text-[12px]">
                          <span className="font-semibold text-gray-900">{i + 1}. {a.text}</span>
                          <span className="text-gray-500"> — {a.evidence}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 py-4 space-y-5">
              <Section title="Rate vs market by transition" subtitle="Bar = you, tick = market · € = recoverable on this ASIN">
                <div className="space-y-2">{d.transitions.map((t) => <TransitionRow key={t.key} t={t} />)}</div>
              </Section>

              <Section title="Your price vs market" subtitle="Median click price">
                <div className="flex items-center gap-3">
                  <PriceChip label="Your price" value={money(d.price.your)} />
                  <PriceChip label="Market median" value={money(d.price.mkt)} muted />
                  {d.price.your != null && d.price.mkt != null && d.price.mkt > 0 && <span className={`text-[12px] font-bold tabular-nums ${d.price.your > d.price.mkt ? 'text-rose-700' : 'text-emerald-700'}`}>{d.price.your > d.price.mkt ? '+' : ''}{Math.round((d.price.your / d.price.mkt - 1) * 100)}% vs market</span>}
                </div>
              </Section>

              <Section title="Top queries for this ASIN" subtitle="By € impact of the worst transition">
                <div className="space-y-1.5">
                  {d.queries.map((q) => (
                    <div key={q.query} className="rounded-lg border border-gray-100 bg-gray-50/40 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold text-gray-900 truncate" title={q.query}>{q.query}{q.branded && <span className="ml-1 text-[9px] text-gray-400 uppercase">branded</span>}</span>
                        <span className="text-[11px] font-bold text-rose-700 tabular-nums flex-shrink-0">{q.impactEurWk > 0 ? eur(q.impactEurWk) : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <MiniWaterfall imp={q.impShare} click={q.clickShare} basket={q.basketShare} purch={q.purchShare} />
                        <span className="text-[10px] text-gray-500">{int(q.volumeWk)}/wk</span>
                        {q.worstKey && q.worstGapPp != null && <span className="text-[10px] font-semibold text-rose-700">{LEAK_CHIP[q.worstKey].short} {q.worstGapPp.toFixed(1)}pp</span>}
                        <button onClick={() => onOpenKeyword?.(q.query, q.branded)} disabled={!onOpenKeyword} className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-semibold text-cx-600 hover:text-cx-700 disabled:text-gray-300 disabled:cursor-default" title="Open this query in the Keyword Portfolio">Keyword Portfolio <ArrowUpRight className="w-3 h-3" /></button>
                      </div>
                      {q.flags.filter((f) => f.key !== 'LOW_DATA').length > 0 && <div className="flex flex-wrap gap-1 mt-1.5">{q.flags.filter((f) => f.key !== 'LOW_DATA').map((f) => <span key={f.key} className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">{f.label}</span>)}</div>}
                    </div>
                  ))}
                </div>
              </Section>

              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400"><Lock className="w-3 h-3" /> Listing context — Business Reports (all traffic, different scope)</div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['Sessions', 'Buy Box %', 'Unit session %'].map((k) => (
                    <div key={k} className="rounded-md bg-white border border-gray-200 px-2 py-2 text-center"><div className="text-[9px] uppercase tracking-wider text-gray-400">{k}</div><div className="text-[13px] font-bold text-gray-300 mt-0.5">{flags.business_reports ? '—' : '· · ·'}</div></div>
                  ))}
                </div>
                {!flags.business_reports && <div className="text-[10px] text-gray-400 mt-2">Connect Business Reports to add sessions &amp; Buy Box (all-traffic scope, not SQP search-only).</div>}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <section><div className="mb-2"><h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-700">{title}</h3>{subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}</div>{children}</section>;
}

function TransitionRow({ t }: { t: AsinTransition }) {
  const color = transitionColor(t.key);
  const max = Math.max(t.your ?? 0, t.mkt ?? 0, 0.01);
  const spark = t.spark;
  const sMin = Math.min(...spark), sMax = Math.max(...spark), sRange = sMax - sMin || 1;
  const w = 60, h = 18;
  const sd = spark.length >= 2 ? spark.map((v, i) => `${i === 0 ? 'M' : 'L'} ${((i / (spark.length - 1)) * w).toFixed(1)} ${(h - ((v - sMin) / sRange) * h).toFixed(1)}`).join(' ') : '';
  return (
    <div className="px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/40">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] font-semibold text-gray-700">{t.label}</span>
        <div className="flex items-center gap-2">
          {t.belowFloor ? <span className="text-[10px] italic text-gray-400">insufficient data</span> : <>
            <span className={`text-[10px] font-semibold ${(t.deltaPp ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{pp(t.deltaPp ?? 0)}</span>
            {t.impactEurWk > 0 && <span className="text-[10px] font-bold text-rose-700 tabular-nums">{eur(t.impactEurWk)}/wk</span>}
          </>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 h-2.5 bg-white rounded-full overflow-hidden border border-gray-100">
          <div className="h-full rounded-full" style={{ width: `${((t.your ?? 0) / max) * 100}%`, backgroundColor: color }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-gray-700" style={{ left: `${((t.mkt ?? 0) / max) * 100}%` }} title={`market ${pct(t.mkt ?? 0)}`} />
        </div>
        <span className="text-[10px] tabular-nums text-gray-600 w-24 text-right">{pct(t.your ?? 0)} vs {pct(t.mkt ?? 0)}</span>
        {sd && <svg width={w} height={h} className="flex-shrink-0"><path d={sd} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
    </div>
  );
}

function PriceChip({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return <div className="rounded-md bg-gray-50/60 border border-gray-200 px-3 py-1.5"><div className="text-[9px] uppercase tracking-wider text-gray-400">{label}</div><div className={`text-[13px] font-bold tabular-nums ${muted ? 'text-gray-500' : 'text-gray-900'}`}>{value}</div></div>;
}
