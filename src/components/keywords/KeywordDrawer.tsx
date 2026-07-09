import { useEffect } from 'react';
import { X, Lightbulb, CheckSquare, Truck } from 'lucide-react';
import type { SqpRow } from '../../lib/sqp/types';
import type { QueryRow } from './selectors';
import { keywordDetail } from './selectors';
import { QUADRANT_META } from './quadrant';
import { LEAK_CHIP } from '../searchfunnel/leakChip';
import { productImageUrl } from '../searchfunnel/selectors';
import MiniWaterfall from '../sqpui/MiniWaterfall';
import { eur, money, int } from '../searchfunnel/format';

export default function KeywordDrawer({ row, rows, onClose }: { row: QueryRow | null; rows: SqpRow[]; onClose: () => void }) {
  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [row, onClose]);

  const open = row !== null;
  const d = row ? keywordDetail(rows, row) : null;
  const q = row ? QUADRANT_META[row.quadrant] : null;

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed top-0 right-0 z-50 h-screen w-full max-w-[540px] bg-white shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        {row && d && q && (
          <>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ring-1 ring-inset ${q.chip}`}>{q.label}</span>
                  {row.branded && <span className="text-[10px] text-gray-400 uppercase">branded</span>}
                </div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">{row.query}</h2>
                <div className="text-[11px] text-gray-500 mt-1">Volume {int(row.volumeWk)}/wk · Opportunity {eur(row.oppTotal)}/wk (conv {eur(row.oppConv)} + vis {eur(row.oppVis)})</div>
              </div>
              <button onClick={onClose} className="flex-shrink-0 w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500"><X className="w-4 h-4" /></button>
            </div>

            <div className="px-5 py-3 bg-amber-50/40 border-b border-amber-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Recommended</span>
                    {row.worstKey && row.worstGapPp != null && <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${LEAK_CHIP[row.worstKey].cls}`}>{LEAK_CHIP[row.worstKey].short} {row.worstGapPp.toFixed(1)}pp</span>}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">{d.play.rationale}</div>
                  <ul className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                    {d.play.actions.map((a) => <li key={a} className="flex items-start gap-1.5 text-[11px] text-gray-700"><span className="mt-[6px] w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />{a}</li>)}
                  </ul>
                  {d.underInvested && (
                    <div className="mt-2 flex items-start gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 rounded-md px-2 py-1.5 border border-indigo-100">
                      <CheckSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> Verify relevancy on Amazon before investing — SQP can't confirm the top results are products like yours.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-5">
              <Section title="Your ASINs on this keyword" subtitle="Each ASIN's funnel share on this query, worst gap vs market · sorted by purchases">
                <div className="space-y-1.5">
                  {d.asinSplit.slice(0, 6).map((a) => (
                    <div key={a.asin} className="rounded-lg border border-gray-100 bg-gray-50/40 px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <img src={productImageUrl(a.asin)} alt="" width={28} height={28} className="w-7 h-7 rounded-md object-cover bg-gray-100 border border-gray-200 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-gray-800 truncate" title={a.title}>{a.title}</div>
                          <div className="text-[9px] text-gray-400 font-mono">{a.asin}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[11px] font-bold text-gray-900 tabular-nums">{a.purchWk >= 10 ? Math.round(a.purchWk) : a.purchWk.toFixed(1)} purch/wk</div>
                          <div className="text-[9px] text-gray-400 tabular-nums">{a.clicksPct.toFixed(0)}% of your clicks</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <MiniWaterfall imp={a.impShare} click={a.clickShare} basket={a.basketShare} purch={a.purchShare} />
                        {a.worstKey && a.worstGapPp != null && a.worstGapPp < 0 && (
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${LEAK_CHIP[a.worstKey].cls}`}>{LEAK_CHIP[a.worstKey].short} {a.worstGapPp.toFixed(1)}pp</span>
                        )}
                        {a.impactEurWk > 0 && <span className="text-[10px] font-bold text-rose-700 tabular-nums ml-auto">{eur(a.impactEurWk)}/wk missed</span>}
                      </div>
                    </div>
                  ))}
                  {d.asinSplit.length > 6 && <div className="text-[10px] text-gray-400">+{d.asinSplit.length - 6} more ASIN{d.asinSplit.length - 6 === 1 ? '' : 's'} with activity on this keyword</div>}
                </div>
              </Section>

              <Section title="Your price vs market" subtitle="Median price at each stage">
                <div className="grid grid-cols-3 gap-2">
                  {d.priceByStage.map((p) => (
                    <div key={p.stage} className="rounded-md bg-gray-50/60 border border-gray-200 px-2 py-2">
                      <div className="text-[9px] uppercase tracking-wider text-gray-400">{p.stage}</div>
                      <div className="text-[12px] font-bold text-gray-900 tabular-nums">{money(p.your)}</div>
                      <div className="text-[10px] text-gray-500">mkt {money(p.mkt)}</div>
                    </div>
                  ))}
                </div>
              </Section>

              {d.fastShipPct >= 40 && (
                <div className="flex items-start gap-2 text-[11px] text-gray-600 bg-gray-50/60 border border-gray-200 rounded-md px-3 py-2">
                  <Truck className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  {Math.round(d.fastShipPct)}% of market purchases on this query buy fast delivery (same/1-day) — delivery speed matters here for the close.
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2"><h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-700">{title}</h3>{subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}</div>
      {children}
    </section>
  );
}
