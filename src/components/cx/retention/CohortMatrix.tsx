import { useState, useMemo } from 'react';
import { cohortRows, cohortValue, MAX_MATURITY, type CohortMetricKey, type CohortRow } from '../../../data/cxData';
import { money } from '../ui';

const fmt = (v: number | null, format: string): string => {
  if (v == null) return '';
  switch (format) {
    case 'money': return money(v, true);
    case 'pct': return `${v.toFixed(0)}%`;
    case 'int': return Math.round(v).toLocaleString('en-US');
    default: return v.toFixed(2);
  }
};

export function CohortMatrix({ metric, format, calc, heatmap, rows = cohortRows }: {
  metric: CohortMetricKey; format: string; calc?: boolean; heatmap: boolean; rows?: CohortRow[];
}) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const months = Array.from({ length: MAX_MATURITY + 1 }, (_, m) => m);

  // per-column min/max for the heatmap
  const colStats = useMemo(() => months.map((m) => {
    const vals = rows.map((r) => cohortValue(r, metric, m)).filter((v): v is number => v != null);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }), [rows, metric, months]);

  const bg = (v: number | null, m: number): string => {
    if (!heatmap || v == null) return '';
    const { min, max } = colStats[m]; const range = max - min || 1;
    const a = 0.08 + 0.5 * ((v - min) / range);
    return v < 0 ? `rgba(153,27,27,${a})` : `rgba(14,90,138,${a})`; // Clarisix red (cx-error) / blue (cx-500)
  };

  // sum-safe metrics vs weighted-average metrics for the Total row
  const isSum = metric === 'retainedCustomers' || metric === 'totalRevenue' || metric === 'cumulativeRevenue';
  const total = (m: number): number | null => {
    const pairs = rows.map((r) => ({ v: cohortValue(r, metric, m), w: r.newCustomers })).filter((p) => p.v != null) as { v: number; w: number }[];
    if (!pairs.length) return null;
    return isSum ? pairs.reduce((s, p) => s + p.v, 0) : pairs.reduce((s, p) => s + p.v * p.w, 0) / pairs.reduce((s, p) => s + p.w, 0);
  };

  const ctxCols: { key: keyof CohortRow | 'cohort'; label: string; f: (r: CohortRow) => string }[] = [
    { key: 'newCustomers', label: 'New customers', f: (r) => r.newCustomers.toLocaleString('en-US') },
    { key: 'ppcSpend', label: 'PPC spend', f: (r) => money(r.ppcSpend) },
    { key: 'cac', label: 'CAC', f: (r) => money(r.cac, false) },
    { key: 'firstPurchase', label: 'First purchase', f: (r) => r.firstPurchase.toFixed(2) },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[520px] cx-scroll">
        <table className="border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-30 bg-slate-50 text-left px-3 py-2 text-[11px] font-semibold text-slate-500 border-b-2 border-slate-200" style={{ width: 110, minWidth: 110 }}>
                Cohort {calc && <span className="ml-1 text-[9px] font-mono bg-cx-100 text-cx-600 px-1 rounded" title="Calculated field">ƒx</span>}
              </th>
              {ctxCols.map((c) => (
                <th key={c.key} className="bg-slate-50 text-right px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 border-b-2 border-slate-200 whitespace-nowrap" style={{ width: 96 }}>{c.label}</th>
              ))}
              {months.map((m) => (
                <th key={m} onMouseEnter={() => setHoverCol(m)}
                  className={`text-right px-2 py-2 text-[11px] font-semibold border-b-2 border-slate-200 whitespace-nowrap transition-colors ${hoverCol === m ? 'bg-cx-50 text-cx-700' : 'bg-slate-50 text-slate-500'}`} style={{ width: 62, minWidth: 62 }}>M{m}</th>
              ))}
            </tr>
          </thead>
          <tbody onMouseLeave={() => { setHoverCol(null); setHoverRow(null); }}>
            {rows.map((r, ri) => (
              <tr key={r.cohort} onMouseEnter={() => setHoverRow(r.cohort)} className={hoverRow === r.cohort ? 'bg-cx-50/40' : ri % 2 ? 'bg-slate-50/30' : 'bg-white'}>
                <td className={`sticky left-0 z-10 px-3 py-1.5 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-100 ${hoverRow === r.cohort ? 'bg-cx-50' : ri % 2 ? 'bg-slate-50' : 'bg-white'}`}>{r.cohort}</td>
                {ctxCols.map((c) => <td key={c.key} className="px-2.5 py-1.5 text-right tabular-nums text-slate-500 whitespace-nowrap border-r border-slate-50">{c.f(r)}</td>)}
                {months.map((m) => {
                  const v = cohortValue(r, metric, m);
                  const immature = m > r.ageMonths;
                  return (
                    <td key={m} onMouseEnter={() => setHoverCol(m)}
                      className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${v != null && v < 0 ? 'text-rose-600' : 'text-slate-700'} ${hoverCol === m ? 'ring-1 ring-inset ring-cx-200' : ''}`}
                      style={{ background: bg(v, m) }}
                      title={immature ? 'Not yet matured' : v == null ? 'Not applicable' : `${r.cohort} · month ${m}`}>
                      {immature ? <span className="text-slate-300" style={{ background: 'repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 2px,transparent 2px,transparent 4px)' }}>·</span> : fmt(v, format)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Total row (sum-safe metrics summed; per-customer & rates weighted by cohort size) */}
            <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold sticky bottom-0">
              <td className="sticky left-0 z-10 bg-slate-100 px-3 py-2 text-slate-700 whitespace-nowrap">Total{!isSum && <span className="text-[9px] font-normal text-slate-400 ml-1">(wtd avg)</span>}</td>
              {ctxCols.map((c) => <td key={c.key} className="px-2.5 py-2 text-right tabular-nums text-slate-500">{c.key === 'newCustomers' ? rows.reduce((s, r) => s + r.newCustomers, 0).toLocaleString('en-US') : c.key === 'ppcSpend' ? money(rows.reduce((s, r) => s + r.ppcSpend, 0)) : ''}</td>)}
              {months.map((m) => <td key={m} className={`px-2 py-2 text-right tabular-nums ${hoverCol === m ? 'bg-cx-50/60' : ''}`}>{fmt(total(m), format)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
