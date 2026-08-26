import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCx } from '../../../contexts/CxContext';
import {
  retentionCurves, subEconomics, CX_CONFIG, MAX_MATURITY, cohortRows, type CohortMetricKey,
  portfolioLtvCac, TIME_TO_SECOND_PURCHASE_DAYS, REPEAT_WINDOWS,
} from '../../../data/cxData';
import { MetricCard, money, pct, Thumb, Freshness, CX } from '../ui';
import { CohortCurveChart } from '../charts';

type Lens = 'value' | 'retention' | 'profit';
const LENS_META: Record<Lens, { metric: CohortMetricKey; label: string; fmt: (v: number) => string; note: string; unit: 'money' | 'pct' }> = {
  value: { metric: 'revenuePerCustomer', label: 'Value', fmt: (v) => money(v), unit: 'money', note: 'Cumulative revenue one customer brings in, month by month after their first order — higher and steeper is better.' },
  retention: { metric: 'retentionRate', label: 'Retention', fmt: (v) => `${v.toFixed(0)}%`, unit: 'pct', note: 'Share of a cohort still buying at each month after their first order.' },
  profit: { metric: 'profitPerCustomer', label: 'Profitability', fmt: (v) => money(v), unit: 'money', note: 'Profit per customer over time — negative at first (acquisition cost), then compounding.' },
};

const CEIL_STATUS: Record<string, { label: string; cls: string }> = {
  headroom: { label: 'Headroom', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  near_limit: { label: 'Near limit', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  over_limit: { label: 'Over limit', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  insufficient_data: { label: 'Insufficient data', cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
};

export default function RetentionDecision() {
  const { setMode, setSelectedAsin } = useCx();
  const [lens, setLens] = useState<Lens>('value');

  const rpc = retentionCurves('revenuePerCustomer');
  const ret = retentionCurves('retentionRate');
  const ltv6 = rpc.benchmark.values[6] ?? 0;
  const ltv12 = rpc.benchmark.values[12] ?? 0;
  const retMature = ret.benchmark.values[CX_CONFIG.matureCohortMonths] ?? 0;
  const recent6 = rpc.recent.values[6] ?? ltv6;

  const curves = retentionCurves(LENS_META[lens].metric);
  const recentAge = cohortRows.find((r) => r.cohort === curves.recent.label)?.ageMonths ?? 6;

  const ltvCac = portfolioLtvCac();
  const ltvCacTone = ltvCac >= 3 ? CX.green : ltvCac >= 1 ? CX.amber : CX.rose;
  const ltvCacLabel = ltvCac >= 3 ? 'Healthy' : ltvCac >= 1 ? 'Profitable but thin' : 'Unprofitable';
  const peakWindow = REPEAT_WINDOWS.reduce((a, b) => (b.pct > a.pct ? b : a));
  const maxWin = Math.max(...REPEAT_WINDOWS.map((w) => w.pct));

  const econ = subEconomics();
  const ceiling = [...econ].sort((a, b) => {
    const rank = (s: string) => (s === 'over_limit' ? 0 : s === 'near_limit' ? 1 : s === 'insufficient_data' ? 2 : 3);
    return rank(a.status) - rank(b.status) || b.ltv12 - a.ltv12;
  }).slice(0, 5);

  const openProduct = (asin: string) => { setSelectedAsin(asin); setMode('analyst'); };

  return (
    <div className="space-y-4">
      {/* summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-3xl">
          <h2 className="text-lg font-bold text-gray-900 leading-snug">Customer value compounds quickly — recent cohorts are the ones to watch</h2>
          <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">
            A customer is worth <span className="font-semibold text-gray-800">{money(ltv6)}</span> by month six and <span className="font-semibold text-gray-800">{money(ltv12)}</span> by month twelve —
            an LTV:CAC of <span className="font-semibold" style={{ color: ltvCacTone }}>{ltvCac.toFixed(1)}:1</span>.
            First orders are acquired at a loss and pay back within 2–3 months, which sets a healthy acquisition ceiling — but a few recent cohorts are retaining below benchmark.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Freshness label={`${cohortRows.filter((r) => r.ageMonths >= CX_CONFIG.matureCohortMonths).length} cohorts mature · ${Math.round((cohortRows.filter((r) => r.ageMonths >= MAX_MATURITY).length / cohortRows.length) * 100)}% fully matured`} />
          <button onClick={() => setMode('analyst')} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-cx-600 hover:text-cx-800">Open detailed data <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* 3 metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="6-month customer value" value={money(ltv6)} delta={((recent6 - ltv6) / ltv6) * 100} context="Cumulative revenue per customer by month six (portfolio benchmark)." />
        <MetricCard label="12-month customer value" value={money(ltv12)} delta={((rpc.recent.values[Math.min(recentAge, 12)] ?? ltv12) - ltv12) / ltv12 * 100} context="What a customer is worth after a full year of repeat and subscription revenue." />
        <MetricCard label={`Retention at month ${CX_CONFIG.matureCohortMonths}`} value={pct(retMature, 0)} delta={(ret.recent.values[CX_CONFIG.matureCohortMonths] ?? retMature) - retMature} deltaUnit="pp" context="Share of customers still purchasing at the maturity point." />
      </div>

      {/* cohort curve + insights */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div><h3 className="text-sm font-semibold text-gray-900">How customer value builds after the first order</h3><p className="text-[11px] text-gray-500">{LENS_META[lens].note}</p></div>
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
              {(Object.keys(LENS_META) as Lens[]).map((l) => (
                <button key={l} onClick={() => setLens(l)} className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${lens === l ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{LENS_META[l].label}</button>
              ))}
            </div>
          </div>
          {/* plain-language takeaway — the one meaningful change */}
          {(() => {
            const lastM = Math.min(recentAge, MAX_MATURITY);
            const rv = curves.recent.values[lastM] ?? 0, bv = curves.benchmark.values[lastM] ?? 0;
            const isPct = LENS_META[lens].unit === 'pct';
            const diff = isPct ? rv - bv : bv ? ((rv - bv) / bv) * 100 : 0;
            const behind = diff < 0, mag = Math.abs(diff);
            const f = LENS_META[lens].fmt;
            const take = isPct
              ? `At month ${lastM}, your newest mature cohort (${curves.recent.label}) is retaining ${rv.toFixed(0)}% — ${mag.toFixed(0)}pp ${behind ? 'below' : 'above'} the ${bv.toFixed(0)}% portfolio average.`
              : `At month ${lastM} — its latest data — your newest mature cohort (${curves.recent.label}) is worth ${f(rv)} per customer, ${mag.toFixed(0)}% ${behind ? 'below' : 'above'} the ${f(bv)} average.`;
            return (
              <div className="mb-2.5 flex items-start gap-2 text-[12px] text-gray-700 bg-cx-50/60 border border-cx-100 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: behind ? CX.amber : CX.green }} />
                <span>{take} {behind ? 'Early value is building slower than usual — watch acquisition quality.' : 'It’s tracking ahead of the pack.'}</span>
              </div>
            );
          })()}
          <CohortCurveChart months={curves.months} matureFrom={recentAge} fmt={LENS_META[lens].fmt} xLabel="Months since a customer’s first order"
            series={[
              { label: curves.recent.label, color: CX.primary, values: curves.recent.values, emphasis: true },
              { label: curves.strong.label, color: CX.teal, values: curves.strong.values },
              { label: 'Benchmark', color: CX.benchmark, values: curves.benchmark.values },
            ]} />
          {/* reading guide / legend */}
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
            Each line follows one <span className="font-semibold text-gray-600">cohort</span> — customers who first bought in the same month — as it ages.
            <span className="inline-flex flex-wrap gap-x-3 gap-y-0.5 ml-1">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-0.5 rounded" style={{ background: CX.primary }} /><b className="font-semibold text-gray-600">{curves.recent.label}</b> newest mature cohort</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-0.5 rounded" style={{ background: CX.teal }} /><b className="font-semibold text-gray-600">{curves.strong.label}</b> strongest historical</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-0.5 rounded" style={{ background: CX.benchmark }} />portfolio average</span>
            </span>
          </div>
      </div>

      {/* second-purchase behaviour: LTV:CAC · time-to-2nd · repeat windows */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] gap-4 items-stretch">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">LTV : CAC</h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums" style={{ color: ltvCacTone }}>{ltvCac.toFixed(1)}</span>
            <span className="text-base font-semibold text-gray-400">: 1</span>
          </div>
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: ltvCacTone }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: ltvCacTone }} />{ltvCacLabel}</span>
          {/* scale marker at 3:1 healthy line */}
          <div className="mt-3 relative h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min((ltvCac / 6) * 100, 100)}%`, background: ltvCacTone }} />
            <div className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-gray-400" style={{ left: `${(3 / 6) * 100}%` }} />
          </div>
          <p className="mt-auto pt-2 text-[11px] text-gray-500 leading-snug">12-mo profit per customer ÷ CAC. <span className="font-semibold text-gray-600">3:1</span> (marker) is the healthy line.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Time to 2nd purchase</h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums text-gray-900">{TIME_TO_SECOND_PURCHASE_DAYS}</span>
            <span className="text-base font-semibold text-gray-400">days</span>
          </div>
          <span className="mt-0.5 text-[11px] font-semibold text-cx-700">avg 1st → 2nd order</span>
          <p className="mt-auto pt-2 text-[11px] text-gray-500 leading-snug">Retarget and time Subscribe &amp; Save prompts around <span className="font-semibold text-gray-600">week {Math.round(TIME_TO_SECOND_PURCHASE_DAYS / 7)}</span> to catch the reorder.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">When repeat customers come back</h3>
            <span className="text-[11px] text-gray-500">peak <span className="font-semibold text-gray-700">{peakWindow.label}</span></span>
          </div>
          <div className="mt-3 flex-1 flex items-end gap-1.5">
            {REPEAT_WINDOWS.map((w) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-[10px] font-semibold tabular-nums text-gray-500">{w.pct}%</span>
                <div className="w-full rounded-t" style={{ height: `${Math.max((w.pct / maxWin) * 68, 3)}px`, background: w === peakWindow ? CX.primary : CX.blue2 }} />
                <span className="text-[9px] text-gray-400 text-center leading-tight whitespace-nowrap">{w.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-500 leading-snug">Share of repeat orders by days since the first order. Most reorders land <span className="font-semibold text-gray-600">16–90 days</span> in.</p>
        </div>
      </div>

      {/* acquisition ceiling */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Acquisition ceiling by product</h3>
          <p className="text-[11px] text-gray-500">The highest ACoS each product can sustain given its customer value. Status is withheld where current ACoS isn’t supplied.</p>
        </div>
        <table className="w-full text-[12px]">
          <thead><tr className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
            <th className="text-left px-4 py-2">Product</th><th className="text-right px-3 py-2">12-mo value</th><th className="text-right px-3 py-2">Contribution / unit</th>
            <th className="text-right px-3 py-2">Current ACoS</th><th className="text-right px-3 py-2">Safe ACoS (6-mo)</th><th className="text-right px-3 py-2">LTV:CAC</th><th className="text-right px-3 py-2">Payback</th><th className="text-left px-4 py-2">Status</th>
          </tr></thead>
          <tbody>
            {ceiling.map((r) => (
              <tr key={r.asin} onClick={() => openProduct(r.asin)} className="border-b border-gray-50 last:border-0 hover:bg-cx-50/40 cursor-pointer transition-colors">
                <td className="px-4 py-2.5"><div className="flex items-center gap-2.5 min-w-0"><Thumb hue={r.hue} /><div className="min-w-0"><div className="font-semibold text-gray-800 truncate">{r.title}</div><div className="text-[10px] text-gray-400 font-mono">{r.parentAsin}</div></div></div></td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{money(r.ltv12)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(r.contributionPerUnit, false)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.currentAcos == null ? <span className="text-gray-300">Not supplied</span> : `${r.currentAcos.toFixed(0)}%`}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-cx-700">{r.safe6.toFixed(0)}%</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{r.ltvCac == null ? <span className="text-gray-300">—</span> : <span className={r.ltvCac >= 3 ? 'text-emerald-700' : r.ltvCac >= 1 ? 'text-amber-700' : 'text-rose-700'}>{r.ltvCac.toFixed(1)}×</span>}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.payback == null ? <span className="text-gray-300">—</span> : `${r.payback.toFixed(1)} mo`}</td>
                <td className="px-4 py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ring-1 ${CEIL_STATUS[r.status].cls}`}>{CEIL_STATUS[r.status].label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
