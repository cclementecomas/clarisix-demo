import { useCallback, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { AsinLeakRow } from './selectors';
import { productImageUrl } from './selectors';
import type { TransitionKey } from '../../lib/sqp/types';
import { LEAK_CHIP } from './leakChip';
import { eur, pct, pp, abbrev, int } from './format';
import { TRANSITION_NAME } from '../sqpui/tokens';
import InfoTooltip from '../InfoTooltip';

type Stage = TransitionKey | 'all';
const PILLS: { v: Stage; label: string }[] = [
  { v: 'all', label: 'All (worst per ASIN)' },
  { v: 'imp_click', label: TRANSITION_NAME.imp_click },
  { v: 'click_basket', label: TRANSITION_NAME.click_basket },
  { v: 'basket_purch', label: TRANSITION_NAME.basket_purch },
];

type SortField = 'missed' | 'impr' | 'imprShare' | 'ctr' | 'atc' | 'close' | 'purch' | 'product' | 'topQuery';

export default function AsinLeakTable({ rows, stage, onStageChange, onSelect }: {
  rows: AsinLeakRow[]; stage: Stage; onStageChange: (s: Stage) => void; onSelect: (asin: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: 'asc' | 'desc' } | null>(null);
  const missedOf = useCallback((r: AsinLeakRow) => (stage === 'all' ? r.missedEurWk : r.byStage[stage]), [stage]);
  const leakOf = (r: AsinLeakRow): TransitionKey | null => (stage === 'all' ? r.leakKey : r.byStage[stage] > 0 ? stage : null);

  const accessor = useCallback((r: AsinLeakRow, f: SortField): number | string | null => {
    switch (f) {
      case 'missed': return missedOf(r);
      case 'impr': return r.impressionsWk;
      case 'imprShare': return r.impShare;
      case 'ctr': return r.ctrDeltaPp;
      case 'atc': return r.atcDeltaPp;
      case 'close': return r.closeDeltaPp;
      case 'purch': return r.purchasesWk;
      case 'product': return r.title.toLowerCase();
      case 'topQuery': return r.topQuery.toLowerCase();
    }
  }, [missedOf]);

  const toggleSort = (field: SortField) => setSort((prev) =>
    prev?.field === field
      ? { field, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { field, dir: field === 'product' || field === 'topQuery' ? 'asc' : 'desc' });

  const total = useMemo(() => rows.reduce((s, r) => s + missedOf(r), 0), [rows, missedOf]);
  const top3Pct = useMemo(() => {
    const t3 = [...rows].map(missedOf).sort((a, b) => b - a).slice(0, 3).reduce((s, v) => s + v, 0);
    return total > 0 ? Math.round((t3 / total) * 100) : 0;
  }, [rows, missedOf, total]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const f = q ? rows.filter((r) =>
      r.asin.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.queries.some((kw) => kw.toLowerCase().includes(q))
    ) : rows;
    if (!sort) return [...f].sort((a, b) => missedOf(b) - missedOf(a));
    const { field, dir } = sort;
    return [...f].sort((a, b) => {
      const va = accessor(a, field), vb = accessor(b, field);
      if (typeof va === 'string' || typeof vb === 'string') return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      const na = va == null, nb = vb == null;                 // nulls (low-data cells) always last
      if (na && nb) return 0; if (na) return 1; if (nb) return -1;
      return dir === 'asc' ? va - vb : vb - va;
    });
  }, [rows, missedOf, search, sort, accessor]);

  const stageLabel = stage === 'all' ? 'their worst transition' : PILLS.find((p) => p.v === stage)!.label;
  const SortHead = ({ field, thClass, reverse, children }: { field: SortField; thClass: string; reverse?: boolean; children: React.ReactNode }) => {
    const active = sort?.field === field;
    return (
      <th className={`${thClass} cursor-pointer select-none hover:bg-gray-100 transition-colors`} onClick={() => toggleSort(field)}>
        <span className={`inline-flex items-center gap-1 ${reverse ? 'flex-row-reverse' : ''}`}>
          {children}
          {active && (sort!.dir === 'asc' ? <ArrowUp className="w-3 h-3 text-cx-500 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 text-cx-500 flex-shrink-0" />)}
        </span>
      </th>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" id="asin-leak-table">
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900">ASINs causing the leak</h3>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ASIN, product or keyword…"
            className="px-3 py-1.5 text-xs w-64 border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none" />
        </div>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {PILLS.map((p) => (
            <button key={p.v} onClick={() => onStageChange(p.v)} className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors ${stage === p.v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{p.label}</button>
          ))}
        </div>
        <p className="text-[12px] text-gray-700 leading-relaxed mt-2 max-w-4xl">
          <span className="font-semibold">So what:</span> <span className="text-gray-600">Top 3 ASINs account for {top3Pct}% of the €{Math.round(total).toLocaleString()}/wk recoverable at {stageLabel} — fixing these moves the brand number more than anything else.</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500 align-bottom">
              <SortHead field="product" thClass="px-3 py-2 text-left min-w-[210px]">Product / ASIN</SortHead>
              <SortHead field="missed" thClass="px-3 py-2 text-right" reverse>Missed €/wk</SortHead>
              <SortHead field="impr" thClass="px-3 py-2 text-right" reverse>Search impr/wk</SortHead>
              <SortHead field="imprShare" thClass="px-3 py-2 text-right" reverse>Impr share</SortHead>
              <SortHead field="ctr" thClass="px-3 py-2 text-right" reverse><span className="inline-flex items-center gap-1 flex-row-reverse">CTR Δ<InfoTooltip content="Your CTR minus market CTR (pp) — CTR = clicks ÷ impressions. Muted below the 200-impr/wk floor." /></span></SortHead>
              <SortHead field="atc" thClass="px-3 py-2 text-right" reverse>Basket-<br />add Δ</SortHead>
              <SortHead field="close" thClass="px-3 py-2 text-right" reverse>Purchase-<br />rate Δ</SortHead>
              <th className="px-3 py-2 text-left">Leak stage</th>
              <SortHead field="purch" thClass="px-3 py-2 text-right" reverse>SQP purch/wk</SortHead>
              <th className="px-3 py-2 text-center">Click share 4wk</th>
              <SortHead field="topQuery" thClass="px-3 py-2 text-left">Top query</SortHead>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const missed = missedOf(r); const lk = leakOf(r);
              return (
                <tr key={r.asin} onClick={() => onSelect(r.asin)} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <img src={productImageUrl(r.asin)} alt="" width={32} height={32} loading="lazy" className="w-8 h-8 rounded-md object-cover bg-gray-100 border border-gray-200 flex-shrink-0" />
                      <div className="min-w-0"><div className="text-[12px] font-semibold text-gray-900 truncate max-w-[190px]" title={r.title}>{r.title}</div><div className="text-[10px] font-mono text-gray-400">{r.asin}</div></div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className={`text-[13px] font-bold tabular-nums ${missed > 0 ? 'text-rose-700' : 'text-gray-300'}`}>{missed > 0 ? eur(missed) : '—'}</div>
                    {missed > 0 && total > 0 && <div className="flex items-center justify-end gap-1 mt-0.5"><div className="h-1 w-12 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${Math.min(100, (missed / total) * 100)}%` }} /></div><span className="text-[9px] text-gray-400 tabular-nums">{Math.round((missed / total) * 100)}%</span></div>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-900">{abbrev(r.impressionsWk)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-900">{pct(r.impShare)}</td>
                  <DeltaCell value={r.ctrDeltaPp} floorOk={r.ctrFloorOk} />
                  <DeltaCell value={r.atcDeltaPp} floorOk={r.atcFloorOk} />
                  <DeltaCell value={r.closeDeltaPp} floorOk={r.closeFloorOk} />
                  <td className="px-3 py-2">{lk ? <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${LEAK_CHIP[lk].cls}`}>{LEAK_CHIP[lk].short}</span> : <span className="text-[10px] text-gray-400">—</span>}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-900">{int(r.purchasesWk)}</td>
                  <td className="px-3 py-2"><Spark values={r.clickSpark.slice(-4)} /></td>
                  <td className="px-3 py-2"><span className="text-[11px] text-gray-600 truncate max-w-[130px] inline-block align-middle" title={r.topQuery}>{r.topQuery}</span></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-700">
              <td className="px-3 py-2">{shown.length} of {rows.length} ASINs</td>
              <td className="px-3 py-2 text-right text-rose-700 tabular-nums">{eur(total)}/wk</td>
              <td colSpan={9} className="px-3 py-2 text-left text-[10px] font-normal text-gray-400">Σ = recoverable at {stageLabel}{stage !== 'all' ? ' — matches the banner' : ''}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function DeltaCell({ value, floorOk }: { value: number | null; floorOk: boolean }) {
  if (!floorOk || value == null) return <td className="px-3 py-2 text-right"><span className="text-[10px] text-gray-300 italic">low data</span></td>;
  const good = value >= 0;
  return <td className="px-3 py-2 text-right"><span className={`text-[12px] font-semibold tabular-nums ${good ? 'text-emerald-700' : 'text-rose-700'}`}>{pp(value)}</span></td>;
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
