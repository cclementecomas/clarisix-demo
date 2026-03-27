import { useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  LayoutGrid, List, Download, ChevronDown, Search, MousePointer2,
} from 'lucide-react';

import DeepDiveTable, {
  ColumnDef,
  currencyFormatter,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import ColumnToggle from './deepdive/ColumnToggle';
import LastRefreshed from './LastRefreshed';
import { useCurrency } from '../contexts/CurrencyContext';
import type { Currency } from '../contexts/CurrencyContext';
import {
  placementRows, placementRowsSP, placementRowsSB,
  audienceRows,
  tacticData,
  funnelData,
  adTypeRows,
  searchTermData,
  hourlyData,
  campaignData,
} from '../data/advertisingDeepdiveData';
import * as XLSX from 'xlsx';

// suppress unused import warnings for formatters imported for potential column use
void numberFormatter;
void pctShareFormatter;

type AdType = 'All' | 'SP' | 'SB' | 'SD';
type ViewMode = 'chart' | 'table';

// ─── Metric definitions ───────────────────────────────────────────────────────

interface MetricDef {
  key: string;
  label: string;
  color: string;
  isPercent?: boolean;
  isCurrency?: boolean;
}

const STANDARD_METRICS: MetricDef[] = [
  { key: 'spend',  label: 'Spend',  color: '#3B82F6', isCurrency: true },
  { key: 'sales',  label: 'Sales',  color: '#10B981', isCurrency: true },
  { key: 'acos',   label: 'ACOS',   color: '#F59E0B', isPercent: true },
  { key: 'cpc',    label: 'CPC',    color: '#8B5CF6', isCurrency: true },
  { key: 'cpa',    label: 'CPA',    color: '#EF4444', isCurrency: true },
  { key: 'cvr',    label: 'CVR',    color: '#06B6D4', isPercent: true },
  { key: 'ctr',    label: 'CTR',    color: '#F97316', isPercent: true },
];

const HOURLY_METRICS: MetricDef[] = [
  { key: 'spend',  label: 'Spend',  color: '#3B82F6', isCurrency: true },
  { key: 'sales',  label: 'Sales',  color: '#10B981', isCurrency: true },
  { key: 'acos',   label: 'ACOS',   color: '#F59E0B', isPercent: true },
  { key: 'cvr',    label: 'CVR',    color: '#06B6D4', isPercent: true },
  { key: 'orders', label: 'Orders', color: '#8B5CF6' },
];

const SEARCH_METRICS: MetricDef[] = [
  ...STANDARD_METRICS,
  { key: 'impressionShare', label: 'Imp. Share', color: '#64748B', isPercent: true },
];

// ─── MetricPicker ─────────────────────────────────────────────────────────────

function MetricPicker({
  metrics, selected, onChange,
}: {
  metrics: MetricDef[];
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const toggle = useCallback(() => {
    if (!open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((v) => !v);
  }, [open]);

  const filtered = metrics.filter((m) =>
    m.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMetric = (key: string) => {
    if (selected.includes(key)) {
      if (selected.length === 1) return; // keep at least one
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <>
      <button
        ref={anchorRef}
        onClick={toggle}
        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold border border-gray-200 rounded-lg text-gray-600 hover:text-cx-500 hover:border-cx-300 transition-colors bg-white"
      >
        {selected.length} metric{selected.length !== 1 ? 's' : ''}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl py-2"
            style={{ top: pos.top, left: pos.left, width: 200 }}
          >
            <div className="px-3 pb-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search metrics..."
                  className="w-full text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
            {filtered.map((m) => (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-gray-50"
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${selected.includes(m.key) ? 'border-cx-500' : 'border-gray-300'}`}
                  style={{ backgroundColor: selected.includes(m.key) ? m.color : 'transparent' }}
                >
                  {selected.includes(m.key) && <span className="text-white text-[8px] font-bold">✓</span>}
                </span>
                <span className="text-xs text-gray-700">{m.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

const AD_TYPE_LABELS: Record<AdType, string> = {
  All: 'All ad types',
  SP:  'Sponsored Products',
  SB:  'Sponsored Brands',
  SD:  'Sponsored Display',
};

function AdTypeToggle({
  value, onChange,
}: { value: AdType; onChange: (v: AdType) => void }) {
  return (
    <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
      {(['All', 'SP', 'SB', 'SD'] as AdType[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          title={AD_TYPE_LABELS[t]}
          className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${t === value ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function ViewToggle({
  value, onChange,
}: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
      {([
        { mode: 'chart' as ViewMode, Icon: LayoutGrid, label: 'Chart' },
        { mode: 'table' as ViewMode, Icon: List,        label: 'Table' },
      ]).map(({ mode, Icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold transition-colors ${value === mode ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
        >
          <Icon className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── SmallMultiplesChart ──────────────────────────────────────────────────────
// One horizontal bar panel per metric — avoids dual-axis scale confusion.
// Categories sorted by first selected metric (descending).

/* eslint-disable @typescript-eslint/no-explicit-any */
function SmallMultiplesChart({
  data,
  dimKey,
  metrics,
  selectedMetrics,
  currency,
}: {
  data: any[];
  dimKey: string;
  metrics: MetricDef[];
  selectedMetrics: string[];
  currency: string;
}) {
  const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  const visibleMetrics = metrics.filter((m) => selectedMetrics.includes(m.key));

  const fmt = (value: number, m: MetricDef) => {
    if (m.isCurrency) return `${sym}${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}`;
    if (m.isPercent) return `${value.toFixed(1)}%`;
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString();
  };

  // Sort rows by first selected metric descending
  const sorted = useMemo(() => {
    const first = visibleMetrics[0];
    if (!first) return data;
    return [...data].sort((a, b) => (b[first.key] ?? 0) - (a[first.key] ?? 0));
  }, [data, visibleMetrics]);

  const cols = Math.min(visibleMetrics.length, 4);
  const gridCols = cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-x-6 gap-y-4`}>
      {visibleMetrics.map((metric, mi) => {
        const values = sorted.map((d) => (d[metric.key] as number) ?? 0);
        const max = Math.max(...values, 0.0001);
        return (
          <div key={metric.key}>
            {/* Panel header */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: metric.color }} />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{metric.label}</span>
            </div>
            {/* Rows */}
            <div className="space-y-2">
              {sorted.map((row) => {
                const val = (row[dimKey] as string) ?? '';
                const num = (row[metric.key] as number) ?? 0;
                const barPct = (num / max) * 100;
                // subtle "good/bad" tint for ACOS (lower = better)
                const barColor = metric.key === 'acos'
                  ? (num > 35 ? '#EF4444' : num < 20 ? '#10B981' : metric.color)
                  : metric.color;
                return (
                  <div key={val} className="flex items-center gap-2 group">
                    {/* Category label — fixed width, right-aligned, truncated */}
                    <div
                      className="text-[11px] text-gray-500 flex-shrink-0 truncate text-right"
                      style={{ width: mi === 0 ? 120 : 90 }}
                      title={val}
                    >
                      {val}
                    </div>
                    {/* Bar track */}
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-[18px] bg-gray-100 rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all duration-300"
                          style={{ width: `${barPct}%`, backgroundColor: barColor, opacity: 0.85 }}
                        />
                      </div>
                      {/* Direct value label */}
                      <span className="text-[11px] font-semibold text-gray-700 w-12 flex-shrink-0">
                        {fmt(num, metric)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── HourlyLineChart ──────────────────────────────────────────────────────────
// Time-series: one area panel per metric group (currency vs %).
// Avoids scale confusion by splitting into separate panels with shared X-axis.

function HourlyLineChart({
  data,
  metrics,
  selectedMetrics,
  currency,
}: {
  data: any[];
  metrics: MetricDef[];
  selectedMetrics: string[];
  currency: string;
}) {
  const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  const visibleMetrics = metrics.filter((m) => selectedMetrics.includes(m.key));

  // Group into currency/count panel and percent panel
  const currencyMetrics = visibleMetrics.filter((m) => m.isCurrency || (!m.isPercent));
  const percentMetrics  = visibleMetrics.filter((m) => m.isPercent);
  const panels = [
    ...(currencyMetrics.length ? [{ metrics: currencyMetrics, isPercent: false }] : []),
    ...(percentMetrics.length  ? [{ metrics: percentMetrics,  isPercent: true  }] : []),
  ];

  const fmtTick = (v: number, isPercent: boolean) => {
    if (isPercent) return `${v}%`;
    if (v >= 1000) return `${sym}${(v / 1000).toFixed(0)}k`;
    return `${sym}${v}`;
  };

  return (
    <div className="space-y-4">
      {panels.map((panel, pi) => (
        <div key={pi}>
          {/* Panel metric labels */}
          <div className="flex items-center gap-3 mb-2">
            {panel.metrics.map((m) => (
              <div key={m.key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-[11px] font-semibold text-gray-500">{m.label}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  {panel.metrics.map((m) => (
                    <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={m.color} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={m.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmtTick(v, panel.isPercent)}
                  width={48}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
                        <p className="font-semibold mb-1">{label}</p>
                        {payload.map((p: any) => {
                          const m = metrics.find((mm) => mm.key === p.dataKey);
                          if (!m) return null;
                          const val = p.value as number;
                          const display = m.isCurrency
                            ? `${sym}${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}`
                            : m.isPercent ? `${val.toFixed(1)}%`
                            : val.toLocaleString();
                          return (
                            <p key={p.dataKey} style={{ color: m.color }}>
                              {m.label}: {display}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                />
                {panel.metrics.map((m) => (
                  <Area
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.color}
                    strokeWidth={2}
                    fill={`url(#grad-${m.key})`}
                    dot={false}
                    activeDot={{ r: 3, fill: m.color }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Column builder helpers ────────────────────────────────────────────────────

function popSubField(popKey: string, goodDir: 'up' | 'down' = 'up') {
  return {
    field: popKey,
    label: 'PoP',
    formatter: ({ value }: { value: unknown }) => {
      const v = value as number;
      if (v == null) return '';
      return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
    },
    cellStyle: ({ value }: { value: unknown }): Record<string, string> => {
      const v = value as number;
      const isGood = goodDir === 'up' ? v > 0 : v < 0;
      return v === 0 ? {} : isGood ? { color: '#166534' } : { color: '#991B1B' };
    },
  };
}

function buildCols(
  dimField: string,
  dimHeader: string,
  currency: Currency,
  extras: ColumnDef[] = [],
): ColumnDef[] {
  const cf = currencyFormatter(currency);
  const pctFmt = ({ value }: { value: unknown }) => {
    const v = value as number;
    return v == null ? '' : `${v.toFixed(1)}%`;
  };

  return [
    { field: dimField, headerName: dimHeader, pinned: 'left', width: 200 },
    { field: 'spend',  headerName: 'Spend',  valueFormatter: cf,     subFields: [popSubField('spendPoP')] },
    { field: 'sales',  headerName: 'Sales',  valueFormatter: cf,     subFields: [popSubField('salesPoP')] },
    { field: 'acos',   headerName: 'ACOS',   valueFormatter: pctFmt, subFields: [popSubField('acosPoP', 'down')], cellStyle: ({ value }: { value: unknown }): Record<string, string> => { const v = value as number; return v > 35 ? { color: '#991B1B' } : v < 20 ? { color: '#166534' } : {}; } },
    { field: 'cpc',    headerName: 'CPC',    valueFormatter: cf,     subFields: [popSubField('cpcPoP', 'down')] },
    { field: 'cpa',    headerName: 'CPA',    valueFormatter: cf,     subFields: [popSubField('cpaPoP', 'down')] },
    { field: 'cvr',    headerName: 'CVR',    valueFormatter: pctFmt, subFields: [popSubField('cvrPoP')] },
    { field: 'ctr',    headerName: 'CTR',    valueFormatter: ({ value }: { value: unknown }) => { const v = value as number; return v == null ? '' : `${v.toFixed(2)}%`; }, subFields: [popSubField('ctrPoP')] },
    ...extras,
  ];
}

// ─── Export helper ────────────────────────────────────────────────────────────

function exportSection(title: string, data: any[]) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const ws = XLSX.utils.aoa_to_sheet([keys, ...data.map((r) => keys.map((k) => r[k]))]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  XLSX.writeFile(wb, `clarisix_${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Per-section table controls hook ─────────────────────────────────────────

function useSectionControls(initCols: ColumnDef[]) {
  const [showPoP, setShowPoP] = useState(true);
  const [showLY, setShowLY] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [selVals, setSelVals] = useState<number[]>([]);
  const [visCols, setVisCols] = useState<Set<string>>(
    () => new Set(initCols.map((c) => c.field))
  );
  const toggleCol = useCallback((field: string) => {
    setVisCols((prev) => { const s = new Set(prev); s.has(field) ? s.delete(field) : s.add(field); return s; });
  }, []);
  return { showPoP, setShowPoP, showLY, setShowLY, selMode, setSelMode, selVals, setSelVals, visCols, toggleCol };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdvertisingDeepDive() {
  const { currency } = useCurrency();

  // ── Placement ──
  const [placAdType, setPlacAdType] = useState<AdType>('All');
  const [placView,   setPlacView]   = useState<ViewMode>('table');
  const [placMet,    setPlacMet]    = useState(['spend', 'sales', 'acos']);

  // ── Audience ──
  const [audAdType, setAudAdType] = useState<AdType>('All');
  const [audView,   setAudView]   = useState<ViewMode>('table');
  const [audMet,    setAudMet]    = useState(['spend', 'sales', 'acos']);

  // ── Tactic ──
  const [tacView, setTacView] = useState<ViewMode>('table');
  const [tacMet,  setTacMet]  = useState(['spend', 'sales', 'acos']);

  // ── Funnel ──
  const [funView, setFunView] = useState<ViewMode>('table');
  const [funMet,  setFunMet]  = useState(['spend', 'sales', 'acos']);

  // ── Ad Type ──
  const [atView, setAtView] = useState<ViewMode>('table');
  const [atMet,  setAtMet]  = useState(['spend', 'sales', 'acos']);

  // ── Search Term ──
  const [stView, setStView] = useState<ViewMode>('table');
  const [stMet,  setStMet]  = useState(['spend', 'sales', 'acos']);

  // ── Hourly ──
  const [hourMet, setHourMet] = useState(['spend', 'sales']);

  // Placement data by ad type (SD ≈ 18% of total — Sponsored Display)
  const placData = placAdType === 'SP' ? placementRowsSP
    : placAdType === 'SB' ? placementRowsSB
    : placAdType === 'SD' ? placementRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.18), sales: Math.round(r.sales * 0.18) }))
    : placementRows;
  const audData  = audAdType === 'SP'
    ? audienceRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.62), sales: Math.round(r.sales * 0.62) }))
    : audAdType === 'SB'
    ? audienceRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.38), sales: Math.round(r.sales * 0.38) }))
    : audAdType === 'SD'
    ? audienceRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.18), sales: Math.round(r.sales * 0.18) }))
    : audienceRows;

  const placCols = useMemo(() => buildCols('placement', 'Placement', currency as Currency), [currency]);
  const audCols  = useMemo(() => buildCols('segment',   'Audience',  currency as Currency), [currency]);
  const tacCols  = useMemo(() => buildCols('tactic',    'Tactic',    currency as Currency), [currency]);
  const funCols  = useMemo(() => buildCols('stage',     'Funnel Stage', currency as Currency), [currency]);
  const atCols   = useMemo(() => buildCols('adType',    'Ad Type',   currency as Currency), [currency]);
  const stCols   = useMemo((): ColumnDef[] => [
    ...buildCols('searchTerm', 'Search Term', currency as Currency, [
      {
        field: 'impressionShare',
        headerName: 'Imp. Share',
        valueFormatter: ({ value }: { value: unknown }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; },
        subFields: [popSubField('impressionSharePoP')],
      },
    ]),
    { field: 'matchType', headerName: 'Match', width: 80, valueFormatter: ({ value }: { value: unknown }) => String(value ?? '') },
  ], [currency]);

  const campCols = useMemo((): ColumnDef[] => {
    const cf = currencyFormatter(currency as Currency);
    const pctFmt = ({ value }: { value: unknown }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; };
    return [
      { field: 'campaign', headerName: 'Campaign', pinned: 'left', width: 220 },
      { field: 'type', headerName: 'Type', width: 60, valueFormatter: ({ value }: { value: unknown }) => String(value ?? '') },
      { field: 'status', headerName: 'Status', width: 80, valueFormatter: ({ value }: { value: unknown }) => String(value ?? '') },
      { field: 'spend', headerName: 'Spend', valueFormatter: cf, subFields: [popSubField('spendPoP')] },
      { field: 'pctTotal', headerName: '% Total', width: 80, valueFormatter: ({ value }: { value: unknown }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; } },
      { field: 'sales', headerName: 'Sales', valueFormatter: cf, subFields: [popSubField('salesPoP')] },
      { field: 'acos', headerName: 'ACOS', valueFormatter: pctFmt, subFields: [popSubField('acosPoP', 'down')], cellStyle: ({ value }: { value: unknown }): Record<string, string> => { const v = value as number; return v > 35 ? { color: '#991B1B' } : v < 20 ? { color: '#166534' } : {}; } },
      { field: 'cpc', headerName: 'CPC', valueFormatter: cf, subFields: [popSubField('cpcPoP', 'down')] },
      { field: 'cvr', headerName: 'CVR', valueFormatter: pctFmt, subFields: [popSubField('cvrPoP')] },
      { field: 'ctr', headerName: 'CTR', valueFormatter: ({ value }: { value: unknown }) => { const v = value as number; return v == null ? '' : `${v.toFixed(2)}%`; }, subFields: [popSubField('ctrPoP')] },
    ];
  }, [currency]);

  const campChildRowsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const row of campaignData) {
      if (row.placements?.length) map[row.campaign] = row.placements;
    }
    return map;
  }, []);

  // Per-section table controls (PoP, LY, Select, column visibility)
  const plac = useSectionControls(placCols);
  const aud  = useSectionControls(audCols);
  const tac  = useSectionControls(tacCols);
  const fun  = useSectionControls(funCols);
  const at   = useSectionControls(atCols);
  const camp = useSectionControls(campCols);
  const st   = useSectionControls(stCols);
  void plac.selVals; void aud.selVals; void tac.selVals; void fun.selVals; void at.selVals; void camp.selVals; void st.selVals;

  const sectionCard = (content: React.ReactNode) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {content}
    </div>
  );

  const sectionHeader = (
    title: string,
    view: ViewMode, setView: (v: ViewMode) => void,
    metrics: MetricDef[], selMet: string[], setMet: (m: string[]) => void,
    data: any[],
    adType?: { value: AdType; onChange: (v: AdType) => void },
    showExport = true,
    tableControls?: {
      cols: ColumnDef[];
      showPoP: boolean; setShowPoP: (v: boolean) => void;
      showLY: boolean; setShowLY: (v: boolean) => void;
      selMode: boolean; setSelMode: (v: boolean) => void;
      visCols: Set<string>; toggleCol: (field: string) => void;
    },
  ) => (
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="flex items-center gap-2">
        {adType && <AdTypeToggle value={adType.value} onChange={adType.onChange} />}
        {view === 'chart'
          ? <MetricPicker metrics={metrics} selected={selMet} onChange={setMet} />
          : tableControls && <ColumnToggle columns={tableControls.cols} visibleColumns={tableControls.visCols} onToggle={tableControls.toggleCol} />
        }
        {view === 'table' && tableControls && (
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => tableControls.setShowPoP(!tableControls.showPoP)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${tableControls.showPoP ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >PoP</button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onClick={() => tableControls.setShowLY(!tableControls.showLY)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${tableControls.showLY ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >LY</button>
          </div>
        )}
        {view === 'table' && tableControls && (
          <button
            onClick={() => tableControls.setSelMode(!tableControls.selMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold border rounded-lg transition-colors ${
              tableControls.selMode ? 'bg-cx-500 text-white border-cx-500' : 'border-gray-200 text-gray-500 hover:text-cx-500 hover:border-cx-300'
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            Select
          </button>
        )}
        <ViewToggle value={view} onChange={setView} />
        {showExport && (
          <button
            onClick={() => exportSection(title, data)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-cx-500 hover:border-cx-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* 1 — Performance by Placement */}
      {sectionCard(<>
        {sectionHeader('Performance by Placement', placView, setPlacView, STANDARD_METRICS, placMet, setPlacMet, placData, { value: placAdType, onChange: setPlacAdType }, true, { cols: placCols, showPoP: plac.showPoP, setShowPoP: plac.setShowPoP, showLY: plac.showLY, setShowLY: plac.setShowLY, selMode: plac.selMode, setSelMode: plac.setSelMode, visCols: plac.visCols, toggleCol: plac.toggleCol })}
        {placView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={placData} dimKey="placement" metrics={STANDARD_METRICS} selectedMetrics={placMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={plac.showPoP} onPoPChange={plac.setShowPoP} showLY={plac.showLY} onLYChange={plac.setShowLY} selectMode={plac.selMode} onSelectModeChange={plac.setSelMode} onSelectedValuesChange={plac.setSelVals} visibleColumnsOverride={plac.visCols} rowData={placData} columnDefs={placCols} />}
      </>)}

      {/* 2 — Performance by Audience */}
      {sectionCard(<>
        {sectionHeader('Performance by Audience', audView, setAudView, STANDARD_METRICS, audMet, setAudMet, audData, { value: audAdType, onChange: setAudAdType }, true, { cols: audCols, showPoP: aud.showPoP, setShowPoP: aud.setShowPoP, showLY: aud.showLY, setShowLY: aud.setShowLY, selMode: aud.selMode, setSelMode: aud.setSelMode, visCols: aud.visCols, toggleCol: aud.toggleCol })}
        {audView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={audData} dimKey="segment" metrics={STANDARD_METRICS} selectedMetrics={audMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={aud.showPoP} onPoPChange={aud.setShowPoP} showLY={aud.showLY} onLYChange={aud.setShowLY} selectMode={aud.selMode} onSelectModeChange={aud.setSelMode} onSelectedValuesChange={aud.setSelVals} visibleColumnsOverride={aud.visCols} rowData={audData} columnDefs={audCols} />}
      </>)}

      {/* 3 — Performance by Tactic */}
      {sectionCard(<>
        {sectionHeader('Performance by Tactic', tacView, setTacView, STANDARD_METRICS, tacMet, setTacMet, tacticData, undefined, true, { cols: tacCols, showPoP: tac.showPoP, setShowPoP: tac.setShowPoP, showLY: tac.showLY, setShowLY: tac.setShowLY, selMode: tac.selMode, setSelMode: tac.setSelMode, visCols: tac.visCols, toggleCol: tac.toggleCol })}
        {tacView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={tacticData} dimKey="tactic" metrics={STANDARD_METRICS} selectedMetrics={tacMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={tac.showPoP} onPoPChange={tac.setShowPoP} showLY={tac.showLY} onLYChange={tac.setShowLY} selectMode={tac.selMode} onSelectModeChange={tac.setSelMode} onSelectedValuesChange={tac.setSelVals} visibleColumnsOverride={tac.visCols} rowData={tacticData} columnDefs={tacCols} />}
      </>)}

      {/* 4 — Performance by Funnel */}
      {sectionCard(<>
        {sectionHeader('Performance by Funnel', funView, setFunView, STANDARD_METRICS, funMet, setFunMet, funnelData, undefined, true, { cols: funCols, showPoP: fun.showPoP, setShowPoP: fun.setShowPoP, showLY: fun.showLY, setShowLY: fun.setShowLY, selMode: fun.selMode, setSelMode: fun.setSelMode, visCols: fun.visCols, toggleCol: fun.toggleCol })}
        {funView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={funnelData} dimKey="stage" metrics={STANDARD_METRICS} selectedMetrics={funMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={fun.showPoP} onPoPChange={fun.setShowPoP} showLY={fun.showLY} onLYChange={fun.setShowLY} selectMode={fun.selMode} onSelectModeChange={fun.setSelMode} onSelectedValuesChange={fun.setSelVals} visibleColumnsOverride={fun.visCols} rowData={funnelData} columnDefs={funCols} />}
      </>)}

      {/* 5 — Performance by Ad Type */}
      {sectionCard(<>
        {sectionHeader('Performance by Ad Type', atView, setAtView, STANDARD_METRICS, atMet, setAtMet, adTypeRows, undefined, true, { cols: atCols, showPoP: at.showPoP, setShowPoP: at.setShowPoP, showLY: at.showLY, setShowLY: at.setShowLY, selMode: at.selMode, setSelMode: at.setSelMode, visCols: at.visCols, toggleCol: at.toggleCol })}
        {atView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={adTypeRows} dimKey="adType" metrics={STANDARD_METRICS} selectedMetrics={atMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={at.showPoP} onPoPChange={at.setShowPoP} showLY={at.showLY} onLYChange={at.setShowLY} selectMode={at.selMode} onSelectModeChange={at.setSelMode} onSelectedValuesChange={at.setSelVals} visibleColumnsOverride={at.visCols} rowData={adTypeRows} columnDefs={atCols} />}
      </>)}

      {/* 6 — Performance by Campaign */}
      {sectionCard(<>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Performance by Campaign</h3>
          <div className="flex items-center gap-2">
            <ColumnToggle columns={campCols} visibleColumns={camp.visCols} onToggle={camp.toggleCol} />
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => camp.setShowPoP(!camp.showPoP)} className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${camp.showPoP ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}>PoP</button>
              <div className="w-px h-4 bg-gray-200" />
              <button onClick={() => camp.setShowLY(!camp.showLY)} className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${camp.showLY ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}>LY</button>
            </div>
            <button
              onClick={() => camp.setSelMode(!camp.selMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold border rounded-lg transition-colors ${camp.selMode ? 'bg-cx-500 text-white border-cx-500' : 'border-gray-200 text-gray-500 hover:text-cx-500 hover:border-cx-300'}`}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              Select
            </button>
            <button
              onClick={() => exportSection('Performance by Campaign', campaignData)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-cx-500 hover:border-cx-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <DeepDiveTable
          title="" embedded
          showPoP={camp.showPoP} onPoPChange={camp.setShowPoP}
          showLY={camp.showLY} onLYChange={camp.setShowLY}
          selectMode={camp.selMode} onSelectModeChange={camp.setSelMode}
          onSelectedValuesChange={camp.setSelVals}
          visibleColumnsOverride={camp.visCols}
          rowData={campaignData} columnDefs={campCols}
          childRowsMap={campChildRowsMap} rowKeyField="campaign" childLabelField="placement"
        />
      </>)}

      {/* 7 — Performance by Search Term */}
      {sectionCard(<>
        {sectionHeader('Performance by Search Term', stView, setStView, SEARCH_METRICS, stMet, setStMet, searchTermData, undefined, true, { cols: stCols, showPoP: st.showPoP, setShowPoP: st.setShowPoP, showLY: st.showLY, setShowLY: st.setShowLY, selMode: st.selMode, setSelMode: st.setSelMode, visCols: st.visCols, toggleCol: st.toggleCol })}
        {stView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={searchTermData.slice(0, 15)} dimKey="searchTerm" metrics={SEARCH_METRICS} selectedMetrics={stMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={st.showPoP} onPoPChange={st.setShowPoP} showLY={st.showLY} onLYChange={st.setShowLY} selectMode={st.selMode} onSelectModeChange={st.setSelMode} onSelectedValuesChange={st.setSelVals} visibleColumnsOverride={st.visCols} rowData={searchTermData} columnDefs={stCols} />}
      </>)}

      {/* 7 — Hourly Performance */}
      {sectionCard(<>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Hourly Performance</h3>
          <div className="flex items-center gap-2">
            <MetricPicker metrics={HOURLY_METRICS} selected={hourMet} onChange={setHourMet} />
          </div>
        </div>
        <div className="p-5">
          <HourlyLineChart data={hourlyData} metrics={HOURLY_METRICS} selectedMetrics={hourMet} currency={currency} />
        </div>
      </>)}

      <LastRefreshed offsetMinutes={12} />
    </div>
  );
}
