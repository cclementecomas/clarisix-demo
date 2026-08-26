import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCx } from '../../../contexts/CxContext';
import { portfolioTotals, cxProducts, productStatus, pctChange, share, weeklySeries } from '../../../data/cxData';
import { MetricCard, StatusChip, Delta, Thumb, money, pct, Freshness, CX } from '../ui';
import { StackedBars } from '../charts';

type Lens = 'mix' | 'subs';

export default function OverviewDecision() {
  const { setMode, setSelectedAsin } = useCx();
  const [lens, setLens] = useState<Lens>('mix');
  const t = portfolioTotals();

  const repeatShareCur = share(t.repeatCur, t.salesCur);
  const repeatSharePp = repeatShareCur - share(t.repeatPrev, t.salesPrev);
  const subShareCur = share(t.subCur, t.salesCur);
  const subSharePp = subShareCur - share(t.subPrev, t.salesPrev);
  const ntbCh = pctChange(t.ntbCur, t.ntbPrev);

  // customer-type mix (Repeat vs New) as a clean 100% split
  const mixTotal = t.repeatCur + t.ntbCur;
  const repeatMix = (t.repeatCur / mixTotal) * 100, newMix = (t.ntbCur / mixTotal) * 100;

  const watch = [...cxProducts]
    .map((p) => ({ p, score: Math.abs(p.salesCur - p.salesPrev) + Math.abs(p.ntbCur - p.ntbPrev) * 1.5 }))
    .sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.p);

  const openProduct = (asin: string) => { setSelectedAsin(asin); setMode('analyst'); };

  return (
    <div className="space-y-4">
      {/* Decision summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-3xl">
          <h2 className="text-lg font-bold text-gray-900 leading-snug">Loyalty is growing. Winning new customers is not.</h2>
          <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">
            Repeat customers now make up <span className="font-semibold text-gray-800">{pct(repeatShareCur)}</span> of sales
            (<Delta value={repeatSharePp} unit="pp" className="!text-xs" /> vs last period). New-customer sales are the only thing falling —
            down <span className="font-semibold text-rose-700">{Math.abs(ntbCh).toFixed(0)}%</span>.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Freshness />
          <button onClick={() => setMode('analyst')} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-cx-600 hover:text-cx-800">Open detailed data <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Three primary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Repeat sales" value={money(t.repeatCur)} shareLabel={`${pct(repeatShareCur)} of sales`}
          delta={pctChange(t.repeatCur, t.repeatPrev)} context="Customers who've bought before — the biggest, fastest-growing group."
          spark={weeklySeries.map((w) => w.repeat)} />
        <MetricCard label="Subscription sales" value={money(t.subCur)} shareLabel={`${pct(subShareCur)} of sales`}
          delta={pctChange(t.subCur, t.subPrev)} context="Recurring Subscribe & Save orders. Rising, but check quality."
          spark={weeklySeries.map((w) => w.sub)} />
        <MetricCard label="New-customer sales" value={money(t.ntbCur)} shareLabel={`${pct(share(t.ntbCur, t.salesCur))} of sales`}
          delta={ntbCh} context="First-time buyers of the brand. The only group in decline."
          spark={weeklySeries.map((w) => w.ntb)} />
      </div>

      {/* Mix chart + at-a-glance */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-stretch">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-w-0 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Customer mix over time</h3>
              <p className="text-[11px] text-gray-500">{lens === 'mix' ? 'Sales from repeat vs new customers, week by week.' : 'Subscription vs one-off sales, week by week.'}</p>
            </div>
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
              {(['mix', 'subs'] as Lens[]).map((l) => (
                <button key={l} onClick={() => setLens(l)} className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${lens === l ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{l === 'mix' ? 'Customer mix' : 'Subscriptions'}</button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            {lens === 'mix' ? (
              <StackedBars points={weeklySeries as any} splitIndex={8} fmt={(v) => money(v)}
                segments={[{ key: 'repeat', label: 'Repeat', color: CX.primary }, { key: 'ntb', label: 'New', color: CX.brand }]} />
            ) : (
              <StackedBars points={weeklySeries as any} splitIndex={8} fmt={(v) => money(v)}
                segments={[{ key: 'sub', label: 'Subscription', color: CX.primary }, { key: 'regular', label: 'One-off', color: CX.neutral }]} />
            )}
          </div>
          <Legend items={lens === 'mix' ? [{ c: CX.primary, l: 'Repeat customers' }, { c: CX.brand, l: 'New customers' }] : [{ c: CX.primary, l: 'Subscription' }, { c: CX.neutral, l: 'One-off' }]} />
        </div>

        {/* This period at a glance */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">This period at a glance</h3>
          <div>
            <div className="flex items-center justify-between mb-1.5"><span className="text-[12px] font-semibold text-gray-700">Customer mix</span><span className="text-[11px] text-gray-400">of sales</span></div>
            <div className="flex h-7 rounded-md overflow-hidden ring-1 ring-black/5">
              <div className="flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${repeatMix}%`, background: CX.primary }}>{repeatMix.toFixed(0)}%</div>
              <div className="flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${newMix}%`, background: CX.brand }}>{newMix.toFixed(0)}%</div>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: CX.primary }} />Repeat</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: CX.brand }} />New</span>
              <span className="ml-auto inline-flex items-center gap-1">Repeat <Delta value={repeatSharePp} unit="pp" className="!text-[11px]" /></span>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-1.5"><span className="text-[12px] font-semibold text-gray-700">Subscription share</span><span className="text-sm font-bold text-gray-900 tabular-nums">{pct(subShareCur)}</span></div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${subShareCur}%`, background: CX.teal }} /></div>
            <div className="mt-1.5 text-[11px] text-gray-500 inline-flex items-center gap-1">Subscription <Delta value={subSharePp} unit="pp" className="!text-[11px]" /> vs last period</div>
          </div>
          <div className="border-t border-gray-100 pt-3 mt-auto">
            <p className="text-[11px] text-gray-500 leading-snug">Repeat and subscription revenue are both up — the gap is <span className="font-semibold text-gray-700">new-customer acquisition</span>. Open detailed data to see which products.</p>
          </div>
        </div>
      </div>

      {/* Product watchlist */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Products to watch</h3>
          <p className="text-[11px] text-gray-500">The five products moving the result the most. Click a row to see the detail.</p>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-right px-3 py-2">Repeat Δ</th>
              <th className="text-right px-3 py-2">Subscription Δ</th>
              <th className="text-right px-3 py-2">New Δ</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {watch.map((p) => (
              <tr key={p.asin} onClick={() => openProduct(p.asin)} className="border-b border-gray-50 last:border-0 hover:bg-cx-50/40 cursor-pointer transition-colors">
                <td className="px-4 py-2.5"><div className="flex items-center gap-2.5 min-w-0"><Thumb hue={p.hue} /><div className="min-w-0"><div className="font-semibold text-gray-800 truncate">{p.title}</div><div className="text-[10px] text-gray-400 font-mono">{p.parentAsin}</div></div></div></td>
                <td className="px-3 py-2.5 text-right"><Delta value={pctChange(p.repeatCur, p.repeatPrev)} /></td>
                <td className="px-3 py-2.5 text-right"><Delta value={pctChange(p.subCur, p.subPrev)} /></td>
                <td className="px-3 py-2.5 text-right"><Delta value={pctChange(p.ntbCur, p.ntbPrev)} /></td>
                <td className="px-4 py-2.5"><StatusChip status={productStatus(p)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Legend({ items }: { items: { c: string; l: string }[] }) {
  return (
    <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
      {items.map((it) => <span key={it.l} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: it.c }} />{it.l}</span>)}
    </div>
  );
}
