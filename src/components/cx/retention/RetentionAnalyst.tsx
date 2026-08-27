import { useState, useMemo, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useCx } from '../../../contexts/CxContext';
import DeepDiveTable, { type ColumnDef } from '../../deepdive/DeepDiveTable';
import InfoTooltip from '../../InfoTooltip';
import { CohortMatrix } from './CohortMatrix';
import { EvidenceBanner, money, Thumb } from '../ui';
import {
  COHORT_METRICS, METRIC_DEFS, cohortRows, cohortValue, subEconomics, type CohortMetricKey, type SubEconRow,
} from '../../../data/cxData';

/* eslint-disable @typescript-eslint/no-explicit-any */
// ── Cohort analysis ──────────────────────────────────────────────────────────
function CohortAnalysis() {
  const { evidence } = useCx();
  const [metricKey, setMetricKey] = useState<CohortMetricKey>('revenuePerCustomer');
  const [heatmap, setHeatmap] = useState(true);
  const metric = COHORT_METRICS.find((m) => m.key === metricKey)!;
  const filtered = evidence?.rule === 'm3_below'
    ? cohortRows.filter((r) => (cohortValue(r, 'retentionRate', 3) ?? 100) < 40)
    : evidence?.rule === 'm0_negative' ? cohortRows.filter((r) => (cohortValue(r, 'profitPerCustomer', 0) ?? 0) < 0) : cohortRows;

  const exportCsv = () => {
    const months = Array.from({ length: 13 }, (_, m) => `M${m}`);
    const head = ['Cohort', 'New customers', 'PPC spend', 'CAC', ...months];
    const lines = [head.join(','), ...filtered.map((r) => [r.cohort, r.newCustomers, r.ppcSpend, r.cac, ...months.map((_, m) => cohortValue(r, metricKey, m) ?? '')].join(','))];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); a.download = `clarisix_cohort_${metricKey}.csv`; a.click();
  };

  return (
    <div className="space-y-3">
      {evidence && <EvidenceBanner matches={filtered.length} />}
      <div className="flex items-center gap-2 flex-wrap">
        <select value={metricKey} onChange={(e) => setMetricKey(e.target.value as CohortMetricKey)} className="text-[12px] border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-cx-400">
          {COHORT_METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}{m.calc ? ' ƒx' : ''}</option>)}
        </select>
        <InfoTooltip content={metric.calc ? `${metric.label}. Calculated field (ƒx) — ${METRIC_DEFS.ltv}` : METRIC_DEFS[metricKey === 'retentionRate' ? 'retentionRate' : 'ltv']} />
        <label className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={heatmap} onChange={(e) => setHeatmap(e.target.checked)} className="accent-cx-500" />Heatmap
        </label>
        <span className="text-[11px] text-gray-400 inline-flex items-center gap-1"><HelpCircle className="w-3 h-3" />Blank cells are not yet matured — never interpolated</span>
        <button onClick={exportCsv} className="ml-auto text-[11px] font-semibold text-gray-500 hover:text-cx-600 border border-gray-200 rounded-md px-2.5 py-1.5">Export CSV</button>
      </div>
      <CohortMatrix metric={metricKey} format={metric.format} calc={metric.calc} heatmap={heatmap} rows={filtered} />
    </div>
  );
}

// ── Subscription economics ───────────────────────────────────────────────────
const acosF = ({ value }: { value: unknown }) => (value == null ? 'Not supplied' : `${(value as number).toFixed(0)}%`);
const moneyF = ({ value }: { value: unknown }) => money(value as number);
const CEIL_CLS: Record<string, string> = { headroom: 'bg-emerald-50 text-emerald-700 ring-emerald-200', near_limit: 'bg-amber-50 text-amber-700 ring-amber-200', over_limit: 'bg-rose-50 text-rose-700 ring-rose-200', insufficient_data: 'bg-gray-100 text-gray-500 ring-gray-200' };
const CEIL_LABEL: Record<string, string> = { headroom: 'Headroom', near_limit: 'Near limit', over_limit: 'Over limit', insufficient_data: 'Insufficient data' };

const subCols: ColumnDef[] = [
  { field: 'title', headerName: 'Product', pinned: 'left', width: 240, valueFormatter: ({ row }: any) => (
    <span className="inline-flex items-center gap-2 min-w-0"><Thumb hue={row.hue} size={26} /><span className="min-w-0"><span className="block truncate font-semibold text-gray-800">{row.title}</span><span className="block text-[10px] text-gray-400 font-mono">{row.childAsin}</span></span></span>) },
  { field: 'marketplace', headerName: 'Marketplace', width: 128, group: 'Identity' },
  { field: 'asp', headerName: 'ASP', width: 88, group: 'Unit economics', valueFormatter: ({ value }: any) => money(value, false), tooltip: 'Average selling price.' },
  { field: 'contributionPerUnit', headerName: 'Contribution', width: 118, group: 'Unit economics', valueFormatter: ({ value }: any) => money(value, false), tooltip: 'Contribution per unit sold.' },
  { field: 'safe1', headerName: '1-mo', width: 82, group: 'Acquisition ceiling', valueFormatter: acosF, tooltip: 'Safe ACoS at 1-month customer value.', hide: true },
  { field: 'safe3', headerName: '3-mo', width: 82, group: 'Acquisition ceiling', valueFormatter: acosF, tooltip: 'Safe ACoS at 3-month customer value.' },
  { field: 'safe6', headerName: '6-mo', width: 82, group: 'Acquisition ceiling', valueFormatter: acosF, tooltip: 'Safe ACoS at 6-month customer value.' },
  { field: 'safe12', headerName: '12-mo', width: 82, group: 'Acquisition ceiling', valueFormatter: acosF, tooltip: 'Safe ACoS at 12-month customer value.' },
  { field: 'currentAcos', headerName: 'Current ACoS', width: 124, group: 'Current acquisition', heat: 'down', valueFormatter: acosF, cellStyle: ({ value }: any): Record<string, string> => (value == null ? { color: '#9ca3af' } : {}) },
  { field: 'spend', headerName: 'Spend', width: 100, group: 'Current acquisition', heat: 'down', valueFormatter: ({ value }: any) => (value == null ? 'Not supplied' : money(value)) },
  { field: 'payback', headerName: 'Payback', width: 98, group: 'Current acquisition', heat: 'down', valueFormatter: ({ value }: any) => (value == null ? '—' : `${(value as number).toFixed(1)} mo`) },
  { field: 'ltvCac', headerName: 'LTV:CAC', width: 96, group: 'Current acquisition', valueFormatter: ({ value }: any) => (value == null ? <span className="text-gray-300">Not supplied</span> : <span className={`font-semibold ${(value as number) >= 3 ? 'text-emerald-700' : (value as number) >= 1 ? 'text-amber-700' : 'text-rose-700'}`}>{(value as number).toFixed(1)}×</span>), tooltip: '12-month gross-profit LTV ÷ CAC. ≥3× healthy, <1× unprofitable.' },
  { field: 'status', headerName: 'Coverage', width: 150, group: 'Current acquisition', valueFormatter: ({ value }: any) => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ring-1 ${CEIL_CLS[value]}`}>{CEIL_LABEL[value]}</span> },
  { field: 'ltv1', headerName: '1-mo', width: 84, group: 'Customer value', valueFormatter: moneyF, hide: true },
  { field: 'ltv3', headerName: '3-mo', width: 84, group: 'Customer value', valueFormatter: moneyF },
  { field: 'ltv6', headerName: '6-mo', width: 84, group: 'Customer value', valueFormatter: moneyF },
  { field: 'ltv12', headerName: '12-mo', width: 86, group: 'Customer value', valueFormatter: moneyF },
];

function aggregateByParent(rows: SubEconRow[]): SubEconRow[] {
  const groups = new Map<string, SubEconRow[]>();
  rows.forEach((r) => { const g = groups.get(r.parentAsin) ?? []; g.push(r); groups.set(r.parentAsin, g); });
  return [...groups.entries()].map(([parent, g]) => {
    const avg = (f: (r: SubEconRow) => number) => g.reduce((s, r) => s + f(r), 0) / g.length;
    const acosVals = g.map((r) => r.currentAcos).filter((v): v is number => v != null);
    const spendVals = g.map((r) => r.spend).filter((v): v is number => v != null);
    const cacVals = g.map((r) => r.cac).filter((v): v is number => v != null);
    const ltvCacVals = g.map((r) => r.ltvCac).filter((v): v is number => v != null);
    return {
      ...g[0], asin: parent, childAsin: parent, title: g[0].title.replace(/—.*/, '').trim() + ` (${g.length})`,
      asp: +avg((r) => r.asp).toFixed(2), contributionPerUnit: +avg((r) => r.contributionPerUnit).toFixed(2),
      safe1: +avg((r) => r.safe1).toFixed(1), safe3: +avg((r) => r.safe3).toFixed(1), safe6: +avg((r) => r.safe6).toFixed(1), safe12: +avg((r) => r.safe12).toFixed(1),
      currentAcos: acosVals.length ? +(acosVals.reduce((a, b) => a + b, 0) / acosVals.length).toFixed(1) : null,
      spend: spendVals.length ? spendVals.reduce((a, b) => a + b, 0) : null,
      cac: cacVals.length ? +(cacVals.reduce((a, b) => a + b, 0) / cacVals.length).toFixed(1) : null,
      ltvCac: ltvCacVals.length ? +(ltvCacVals.reduce((a, b) => a + b, 0) / ltvCacVals.length).toFixed(1) : null,
      ltv1: +avg((r) => r.ltv1).toFixed(1), ltv3: +avg((r) => r.ltv3).toFixed(1), ltv6: +avg((r) => r.ltv6).toFixed(1), ltv12: +avg((r) => r.ltv12).toFixed(1),
      status: acosVals.length ? g.find((r) => r.currentAcos != null)!.status : 'insufficient_data',
    };
  });
}

function SubscriptionEconomics() {
  const { evidence, clearEvidence } = useCx();
  const [grain, setGrain] = useState<'child' | 'parent'>('child');
  const rows = useMemo(() => {
    let r = subEconomics();
    if (evidence?.rule === 'acos_missing') r = r.filter((x) => x.currentAcos == null);
    return grain === 'parent' ? aggregateByParent(r) : r;
  }, [evidence, grain]);

  return (
    <div className="space-y-3">
      {evidence && <EvidenceBanner matches={rows.length} />}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Group by</span>
        <div className="inline-flex items-center bg-gray-100 rounded-md p-0.5">
          {(['child', 'parent'] as const).map((g) => <button key={g} onClick={() => setGrain(g)} className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${grain === g ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{g === 'child' ? 'Child ASIN' : 'Parent ASIN'}</button>)}
        </div>
        <InfoTooltip content="The acquisition ceiling is the safe ACoS implied by X-month customer value. Where current ACoS isn’t supplied, coverage reads ‘Insufficient data’ — no current-vs-safe status is inferred." wide />
      </div>
      {rows.length === 0
        ? <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">No products match. <button onClick={clearEvidence} className="text-cx-600 font-semibold">Clear filter</button></div>
        : <DeepDiveTable title="Subscription economics" tooltip="Unit economics, acquisition ceiling and customer value per product. Missing current-acquisition data is shown as ‘Not supplied’, never zero." subtitle="Grouped columns · frozen product identity." rowData={rows} columnDefs={subCols} copyablePinnedCell />}
    </div>
  );
}

export default function RetentionAnalyst() {
  const { evidence } = useCx();
  const [tab, setTab] = useState<'cohort' | 'subeconomics'>('cohort');
  useEffect(() => { if (evidence?.tab === 'subeconomics') setTab('subeconomics'); else if (evidence?.tab === 'cohort') setTab('cohort'); }, [evidence]);
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
        {(['cohort', 'subeconomics'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t === 'cohort' ? 'Cohort analysis' : 'Subscription economics'}</button>)}
      </div>
      {tab === 'cohort' ? <CohortAnalysis /> : <SubscriptionEconomics />}
    </div>
  );
}
