import { useState, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useCx } from '../../../contexts/CxContext';
import DeepDiveTable, { type ColumnDef } from '../../deepdive/DeepDiveTable';
import InfoTooltip from '../../InfoTooltip';
import { EvidenceBanner, money, pct, Thumb, StatusChip, CX } from '../ui';
import { StackedBars } from '../charts';
import {
  cxProducts, subQuality, productStatus, pctChange, share, portfolioTotals, weeklySeries, METRIC_DEFS, type CxProduct,
} from '../../../data/cxData';

/* eslint-disable @typescript-eslint/no-explicit-any */
const deltaStyle = (higherBetter = true) => ({ value }: { value: unknown }): Record<string, string> => {
  const v = value as number | null; if (v == null) return {};
  const good = higherBetter ? v >= 0 : v <= 0;
  return { color: good ? '#047857' : '#be123c' };
};
const moneyF = ({ value }: { value: unknown }) => money(value as number);
const pctF = ({ value }: { value: unknown }) => (value == null ? 'Not supplied' : pct(value as number));
const deltaPctF = ({ value }: { value: unknown }) => { const v = value as number; return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; };

function buildRow(p: CxProduct) {
  const t = portfolioTotals();
  const q = subQuality(p);
  return {
    asin: p.asin, hue: p.hue, title: p.title, parentAsin: p.parentAsin, childAsin: p.childAsin, marketplace: p.marketplace,
    status: productStatus(p),
    salesCur: p.salesCur, salesPrev: p.salesPrev, salesDelta: p.salesCur - p.salesPrev, salesPct: pctChange(p.salesCur, p.salesPrev),
    contrib: share(p.salesCur - p.salesPrev, t.salesCur - t.salesPrev),
    repeatCur: p.repeatCur, repeatPrev: p.repeatPrev, repeatPct: pctChange(p.repeatCur, p.repeatPrev), repeatShare: share(p.repeatCur, p.salesCur),
    ntbCur: p.ntbCur, ntbPrev: p.ntbPrev, ntbPct: pctChange(p.ntbCur, p.ntbPrev), ntbShare: share(p.ntbCur, p.salesCur),
    subCur: p.subCur, subPrev: p.subPrev, subPct: pctChange(p.subCur, p.subPrev), subShare: share(p.subCur, p.salesCur),
    recurringShare: q.recurringShare, lowQualityShare: q.lowQualityShare,
  };
}

// Short per-column headers (the band group supplies the context) + generous widths so nothing
// truncates. Less-critical columns are hidden by default and revealable via the Columns chooser.
const columns: ColumnDef[] = [
  { field: 'title', headerName: 'Product', pinned: 'left', width: 240,
    valueFormatter: ({ row }: any) => (
      <span className="inline-flex items-center gap-2 min-w-0"><Thumb hue={row.hue} size={26} />
        <span className="min-w-0"><span className="block truncate font-semibold text-gray-800">{row.title}</span>
          <span className="block text-[10px] text-gray-400 font-mono">{row.parentAsin}</span></span></span>) },
  { field: 'marketplace', headerName: 'Marketplace', width: 128, group: 'Identity' },
  { field: 'status', headerName: 'Status', width: 168, group: 'Identity', valueFormatter: ({ value }: any) => <StatusChip status={value} /> },
  { field: 'salesCur', headerName: 'Sales', width: 104, group: 'Portfolio', valueFormatter: moneyF, tooltip: 'Total sales this period.' },
  { field: 'salesPrev', headerName: 'Previous', width: 104, group: 'Portfolio', valueFormatter: moneyF, hide: true },
  { field: 'salesPct', headerName: 'Change', width: 100, group: 'Portfolio', valueFormatter: deltaPctF, cellStyle: deltaStyle() },
  { field: 'contrib', headerName: 'Contribution', width: 140, group: 'Portfolio', valueFormatter: pctF, tooltip: 'Share of the portfolio-level sales change this product accounts for.' },
  { field: 'repeatCur', headerName: 'Sales', width: 104, group: 'Repeat customers', valueFormatter: moneyF, tooltip: METRIC_DEFS.repeatSales },
  { field: 'repeatPct', headerName: 'Change', width: 100, group: 'Repeat customers', valueFormatter: deltaPctF, cellStyle: deltaStyle() },
  { field: 'repeatShare', headerName: 'Share', width: 92, group: 'Repeat customers', valueFormatter: pctF, hide: true },
  { field: 'ntbCur', headerName: 'Sales', width: 104, group: 'New customers', valueFormatter: moneyF, tooltip: METRIC_DEFS.ntbSales },
  { field: 'ntbPct', headerName: 'Change', width: 100, group: 'New customers', valueFormatter: deltaPctF, cellStyle: deltaStyle() },
  { field: 'ntbShare', headerName: 'Share', width: 92, group: 'New customers', valueFormatter: pctF, hide: true },
  { field: 'subCur', headerName: 'Sales', width: 104, group: 'Subscription', valueFormatter: moneyF },
  { field: 'subPct', headerName: 'Change', width: 100, group: 'Subscription', valueFormatter: deltaPctF, cellStyle: deltaStyle() },
  { field: 'subShare', headerName: 'Share', width: 92, group: 'Subscription', valueFormatter: pctF, hide: true },
  { field: 'recurringShare', headerName: 'Real S&S', width: 104, group: 'Subscription quality', valueFormatter: pctF, tooltip: METRIC_DEFS.recurringShare, hide: true },
  { field: 'lowQualityShare', headerName: 'Fake S&S', width: 108, group: 'Subscription quality', heat: 'down', valueFormatter: pctF, cellStyle: deltaStyle(false), tooltip: METRIC_DEFS.lowQualityShare },
];

const ruleFilter: Record<string, (r: ReturnType<typeof buildRow>) => boolean> = {
  ntb_decline: (r) => r.ntbPct <= -10,
  repeat_gain: (r) => r.repeatPct > 0,
  sub_quality: (r) => r.lowQualityShare != null && r.lowQualityShare > 25,
};

function ProductAnalysis() {
  const { evidence, clearEvidence } = useCx();
  const [q, setQ] = useState('');
  const [dir, setDir] = useState<'all' | 'up' | 'down'>('all');
  const allRows = useMemo(() => cxProducts.map(buildRow), []);

  const rows = useMemo(() => {
    let r = allRows;
    if (evidence && ruleFilter[evidence.rule]) r = r.filter(ruleFilter[evidence.rule]);
    if (q.trim()) { const s = q.toLowerCase(); r = r.filter((x) => x.title.toLowerCase().includes(s) || x.asin.toLowerCase().includes(s) || x.parentAsin.toLowerCase().includes(s)); }
    if (dir !== 'all') r = r.filter((x) => (dir === 'up' ? x.salesPct >= 0 : x.salesPct < 0));
    return r;
  }, [allRows, evidence, q, dir]);

  const chips: { label: string; clear: () => void }[] = [];
  if (evidence) chips.push({ label: evidence.filterLabel, clear: clearEvidence });
  if (dir !== 'all') chips.push({ label: `Sales ${dir === 'up' ? 'increasing' : 'decreasing'}`, clear: () => setDir('all') });
  if (q.trim()) chips.push({ label: `“${q}”`, clear: () => setQ('') });

  return (
    <div className="space-y-3">
      {evidence && <EvidenceBanner matches={rows.length} />}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product or ASIN…"
            className="pl-8 pr-3 py-1.5 text-xs w-60 border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-400/40 focus:border-cx-400 outline-none" />
        </div>
        <div className="inline-flex items-center bg-gray-100 rounded-md p-0.5">
          {(['all', 'up', 'down'] as const).map((d) => (
            <button key={d} onClick={() => setDir(d)} className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${dir === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {d === 'all' ? 'All' : d === 'up' ? '▲ Gaining' : '▼ Declining'}
            </button>
          ))}
        </div>
        <button className="text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-md px-2.5 py-1.5 cursor-default" title="Saved views — coming soon">Saved views</button>
        {chips.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-cx-50 text-cx-700 border border-cx-200 rounded-full pl-2.5 pr-1.5 py-1">
            {c.label}<button onClick={c.clear} className="text-cx-500 hover:text-cx-700"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">No products match the current filters. <button onClick={() => { setQ(''); setDir('all'); clearEvidence(); }} className="text-cx-600 font-semibold">Clear all</button></div>
      ) : (
        <DeepDiveTable title="Product analysis" tooltip="Every customer-mix metric per product, current vs previous period. Sort, search, filter, choose columns and export."
          subtitle="Grouped columns · frozen product identity · previous-period comparison." rowData={rows} columnDefs={columns} copyablePinnedCell />
      )}
    </div>
  );
}

// ── Portfolio trend data ─────────────────────────────────────────────────────
type LensKey = 'mix' | 'ntb' | 'detail' | 'submix' | 'subacq' | 'subquality';
const LENSES: { key: LensKey; label: string; areas: { key: string; label: string; color: string }[] }[] = [
  { key: 'mix', label: 'Customer mix', areas: [{ key: 'ntb', label: 'New', color: CX.brand }, { key: 'repeat', label: 'Repeat', color: CX.primary }] },
  { key: 'ntb', label: 'New-customer performance', areas: [{ key: 'ntb', label: 'New', color: CX.brand }] },
  { key: 'detail', label: 'Customer type detail', areas: [{ key: 'ntb', label: 'New', color: CX.brand }, { key: 'repeat', label: 'Repeat', color: CX.primary }, { key: 'sub', label: 'Subscription', color: CX.teal }] },
  { key: 'submix', label: 'Subscription mix', areas: [{ key: 'regular', label: 'One-off', color: CX.neutral }, { key: 'sub', label: 'Subscription', color: CX.primary }] },
  { key: 'subacq', label: 'Subscription acquisition', areas: [{ key: 'subNewOrders', label: 'New sub orders', color: CX.primary }, { key: 'subPromoOrders', label: 'Promotional orders', color: CX.amber }] },
  { key: 'subquality', label: 'Subscription quality', areas: [{ key: 'subLowQuality', label: 'Fake S&S', color: CX.amber }, { key: 'subRecurring', label: 'Real S&S', color: CX.primary }] },
];

function PortfolioTrend() {
  const [lens, setLens] = useState<LensKey>('mix');
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const cfg = LENSES.find((l) => l.key === lens)!;
  const exportCsv = () => {
    const cols = cfg.areas.map((a) => a.key);
    const head = ['Week', ...cfg.areas.map((a) => a.label)];
    const lines = [head.join(','), ...weeklySeries.map((w) => [w.label, ...cols.map((c) => (w as any)[c])].join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `clarisix_cx_${lens}.csv`; a.click();
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Portfolio trend</h3>
          <InfoTooltip content="Weekly customer-mix and subscription trends. Pick a lens; toggle chart or table; export the underlying values." />
        </div>
        <div className="flex items-center gap-2">
          <select value={lens} onChange={(e) => setLens(e.target.value as LensKey)} className="text-[12px] border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-cx-400">
            {LENSES.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
          <div className="inline-flex items-center bg-gray-100 rounded-md p-0.5">
            {(['chart', 'table'] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`px-2.5 py-1 text-[11px] font-semibold rounded capitalize transition-colors ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{v}</button>)}
          </div>
          <button onClick={exportCsv} className="text-[11px] font-semibold text-gray-500 hover:text-cx-600 border border-gray-200 rounded-md px-2.5 py-1.5">Export CSV</button>
        </div>
      </div>
      <div className="p-4">
        {view === 'chart' ? (
          <StackedBars points={weeklySeries as any} segments={cfg.areas} splitIndex={8} fmt={(v) => money(v)} showPct={cfg.areas.length > 1} />
        ) : (
          <div className="overflow-x-auto max-h-[320px]">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-white"><tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="text-left px-2 py-1.5">Week</th>{cfg.areas.map((a) => <th key={a.key} className="text-right px-2 py-1.5">{a.label}</th>)}
              </tr></thead>
              <tbody>{weeklySeries.map((w) => <tr key={w.label} className="border-b border-gray-50">
                <td className="px-2 py-1.5 text-gray-500">{w.label}</td>
                {cfg.areas.map((a) => <td key={a.key} className="px-2 py-1.5 text-right tabular-nums">{money((w as any)[a.key])}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OverviewAnalyst() {
  const { evidence } = useCx();
  const [tab, setTab] = useState<'product' | 'trend'>('product');
  useEffect(() => { if (evidence?.tab === 'product') setTab('product'); }, [evidence]);
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
        {(['product', 'trend'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'product' ? 'Product analysis' : 'Portfolio trend data'}
          </button>
        ))}
      </div>
      {tab === 'product' ? <ProductAnalysis /> : <PortfolioTrend />}
    </div>
  );
}
