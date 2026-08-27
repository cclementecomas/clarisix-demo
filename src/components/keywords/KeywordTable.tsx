import { X } from 'lucide-react';
import type { QueryRow } from './selectors';
import type { KeywordFilter } from './MainIssueBanner';
import { QUADRANT_META } from './quadrant';
import { eur, int } from '../searchfunnel/format';
import { flags } from '../../lib/sqp/constants';
import MiniWaterfall from '../sqpui/MiniWaterfall';
import InfoTooltip from '../InfoTooltip';

const FILTER_LABEL: Record<Exclude<KeywordFilter, 'all'>, string> = {
  top5: 'top 5 keywords by purchases',
  under_indexed: 'under-indexed keywords',
};

export default function KeywordTable({ rows, selected, onSelect, filter = 'all', onClearFilter }: {
  rows: QueryRow[]; selected: string | null; onSelect: (r: QueryRow) => void;
  filter?: KeywordFilter; onClearFilter?: () => void;
}) {
  const shown = filter === 'top5'
    ? [...rows].sort((a, b) => b.purchases - a.purchases).slice(0, 5)
    : filter === 'under_indexed'
      ? rows.filter((r) => r.flags.some((f) => f.key === 'UNDER_INVESTED'))
      : rows;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" id="keyword-table">
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Prioritized keywords</h3>
        <span className="text-[10px] text-gray-400">{shown.length}{filter !== 'all' ? ` of ${rows.length}` : ''} queries · sorted by opportunity · click a row for detail</span>
      </div>
      {filter !== 'all' && (
        <div className="px-5 py-2 bg-cx-50/60 border-b border-cx-100 flex items-center justify-between">
          <span className="text-[11px] text-cx-800">Filtered to the <span className="font-semibold">{FILTER_LABEL[filter]}</span> — {shown.length} shown.</span>
          <button onClick={onClearFilter} className="inline-flex items-center gap-1 text-[11px] font-semibold text-cx-600 hover:text-cx-700">Clear filter <X className="w-3 h-3" /></button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2 text-left min-w-[220px]">Keyword</th>
              <th className="px-3 py-2 text-left">Quadrant</th>
              <th className="px-3 py-2 text-right">SQ vol/wk</th>
              <th className="px-3 py-2 text-center">Shares I·C·B·P</th>
              <th className="px-3 py-2 text-right">Visibility opp/wk</th>
              <th className="px-3 py-2 text-right">Price vs mkt</th>
              <th className="px-3 py-2 text-left">Top ASIN</th>
              <th className="px-3 py-2 text-center">Trend 4wk</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-right text-gray-300">ACOS / PPC</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const q = QUADRANT_META[r.quadrant];
              const isSel = selected === r.query;
              return (
                <tr key={r.query} onClick={() => onSelect(r)} className={`border-b border-gray-50 cursor-pointer transition-colors ${isSel ? 'bg-cx-50/40' : 'hover:bg-gray-50/40'}`}>
                  <td className="px-3 py-2 align-top">
                    <div className="text-[12px] font-semibold text-gray-900">{r.query}</div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {r.branded && <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">branded</span>}
                      {r.flags.filter((f) => f.key !== 'LOW_DATA' && f.key !== 'TREND_UP' && f.key !== 'TREND_DOWN').slice(0, 2).map((f) => (
                        <span key={f.key} className="text-[9px] px-1 py-0.5 rounded bg-white border border-gray-200 text-gray-600">{f.label}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top"><span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ring-1 ring-inset ${q.chip}`}>{q.label}</span></td>
                  <td className="px-3 py-2 align-top text-right tabular-nums text-gray-900">{int(r.volumeWk)}</td>
                  <td className="px-3 py-2 align-top"><MiniWaterfall imp={r.impShare} click={r.clickShare} basket={r.basketShare} purch={r.purchShare} /></td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span className="text-[12px] font-bold text-emerald-700 tabular-nums">{eur(r.oppVis)}</span>
                      <InfoTooltip content={`Visibility gap ${eur(r.oppVis)}/wk — what a market-level share of this keyword would add at your current conversion. Shown before the closure factor. This keyword's conversion gap (${eur(r.oppConv)}/wk) is on the Search funnel page.`} wide />
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    {r.priceDeltaPct == null ? <span className="text-[10px] text-gray-300">—</span> : (
                      <span className={`text-[12px] font-semibold tabular-nums ${r.priceDeltaPct > 0 ? 'text-rose-700' : r.priceDeltaPct < 0 ? 'text-emerald-700' : 'text-gray-600'}`}>{r.priceDeltaPct > 0 ? '+' : ''}{r.priceDeltaPct}%</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {r.topAsin ? <div><div className="text-[10px] font-mono text-gray-600">{r.topAsin.asin}</div><div className="text-[9px] text-gray-400">{int(r.topAsin.clicks)} clicks</div></div> : <span className="text-[10px] text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 align-top"><Spark values={r.spark.slice(-4)} /></td>
                  <td className="px-3 py-2 align-top max-w-[180px]"><span className="text-[11px] text-gray-700 inline-flex items-center gap-1">{r.actionLabel}<InfoTooltip content={r.actionRationale} /></span></td>
                  <td className="px-3 py-2 align-top text-right">
                    {flags.ads ? '—' : <span className="text-[10px] text-gray-300 italic">Connect Ads</span>}
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && <tr><td colSpan={10} className="px-5 py-8 text-center text-[12px] text-gray-400">No keywords match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="text-[9px] text-gray-300 text-center">—</div>;
  const w = 52, h = 16;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => h - ((v - min) / range) * h;
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const up = values[values.length - 1] >= values[0];
  return <svg width={w} height={h} className="block mx-auto"><path d={d} fill="none" stroke={up ? '#10B981' : '#EF4444'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
