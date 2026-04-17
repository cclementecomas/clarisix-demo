import { useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutGrid, List, Download, ChevronDown, Search, MousePointer2, Lock,
} from 'lucide-react';

import DeepDiveTable, {
  ColumnDef,
  currencyFormatter,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import ColumnToggle from './deepdive/ColumnToggle';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';
import { useCurrency } from '../contexts/CurrencyContext';
import type { Currency } from '../contexts/CurrencyContext';
import { useAccountSpecifics } from '../contexts/AccountSpecificsContext';
import {
  placementRows, placementRowsSP, placementRowsSB,
  audienceRows,
  adTypeRows,
  searchTermData,
  campaignData,
} from '../data/advertisingDeepdiveData';
import * as XLSX from 'xlsx';

// suppress unused import warnings for formatters imported for potential column use
void numberFormatter;
void pctShareFormatter;

type AdType = 'All' | 'SP' | 'SB' | 'SBV' | 'SD';
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
  SBV: 'Sponsored Brands Video',
  SD:  'Sponsored Display',
};

function AdTypeToggle({
  value, onChange,
}: { value: AdType; onChange: (v: AdType) => void }) {
  return (
    <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
      {(['All', 'SP', 'SB', 'SBV', 'SD'] as AdType[]).map((t) => (
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

  const roasFmt = ({ value }: { value: unknown }) => {
    const v = value as number;
    return v == null ? '' : `${v.toFixed(2)}x`;
  };

  return [
    { field: dimField, headerName: dimHeader, pinned: 'left', width: 200 },
    { field: 'spend',  headerName: 'Spend',  valueFormatter: cf,     subFields: [popSubField('spendPoP')] },
    { field: 'sales',  headerName: 'Sales',  valueFormatter: cf,     subFields: [popSubField('salesPoP')] },
    { field: 'acos',   headerName: 'ACOS',   valueFormatter: pctFmt, subFields: [popSubField('acosPoP', 'down')], cellStyle: ({ value }: { value: unknown }): Record<string, string> => { const v = value as number; return v > 35 ? { color: '#991B1B' } : v < 20 ? { color: '#166534' } : {}; } },
    { field: 'roas',   headerName: 'ROAS',   valueFormatter: roasFmt, tooltip: 'Return on Ad Spend — ad sales ÷ ad spend. Inverse of ACOS. Higher is better.', cellStyle: ({ value }: { value: unknown }): Record<string, string> => { const v = value as number; return v >= 5 ? { color: '#166534' } : v < 3 ? { color: '#991B1B' } : {}; } },
    { field: 'cpc',    headerName: 'CPC',    valueFormatter: cf,     subFields: [popSubField('cpcPoP', 'down')] },
    { field: 'cpa',    headerName: 'CPA',    valueFormatter: cf,     subFields: [popSubField('cpaPoP', 'down')] },
    { field: 'cvr',    headerName: 'CVR',    valueFormatter: pctFmt, subFields: [popSubField('cvrPoP')] },
    { field: 'ctr',    headerName: 'CTR',    valueFormatter: ({ value }: { value: unknown }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; }, subFields: [popSubField('ctrPoP')] },
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

function useSectionControls(initCols: ColumnDef[], hiddenByDefault: string[] = []) {
  const [showPoP, setShowPoP] = useState(true);
  const [showLY, setShowLY] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [selVals, setSelVals] = useState<number[]>([]);
  const [visCols, setVisCols] = useState<Set<string>>(
    () => new Set(initCols.map((c) => c.field).filter((f) => !hiddenByDefault.includes(f)))
  );
  const toggleCol = useCallback((field: string) => {
    setVisCols((prev) => { const s = new Set(prev); s.has(field) ? s.delete(field) : s.add(field); return s; });
  }, []);
  return { showPoP, setShowPoP, showLY, setShowLY, selMode, setSelMode, selVals, setSelVals, visCols, toggleCol };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdvertisingDeepDive() {
  const { currency } = useCurrency();
  const { audienceLabelingEnabled } = useAccountSpecifics();

  // ── Global ad type filter ──
  const [adType, setAdType] = useState<AdType>('All');

  // ── Placement ──
  const [placView,   setPlacView]   = useState<ViewMode>('table');
  const [placMet,    setPlacMet]    = useState(['spend', 'sales', 'acos']);

  // ── Audience ──
  const [audView,   setAudView]   = useState<ViewMode>('table');
  const [audMet,    setAudMet]    = useState(['spend', 'sales', 'acos']);

  // ── Ad Type ──
  const [atView, setAtView] = useState<ViewMode>('table');
  const [atMet,  setAtMet]  = useState(['spend', 'sales', 'acos']);

  // ── Search Term ──
  const [stView, setStView] = useState<ViewMode>('table');
  const [stMet,  setStMet]  = useState(['spend', 'sales', 'acos']);

  // Helper: enrich row with computed ROAS (ad sales ÷ ad spend)
  const withRoas = <T extends { spend: number; sales: number }>(rows: T[]) =>
    rows.map((r) => ({ ...r, roas: r.spend > 0 ? Math.round((r.sales / r.spend) * 100) / 100 : 0 }));

  // Placement data filtered by global ad type
  const placData = withRoas(
    adType === 'SP' ? placementRowsSP
    : adType === 'SB' ? placementRowsSB
    : adType === 'SBV' ? placementRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.12), sales: Math.round(r.sales * 0.12) }))
    : adType === 'SD' ? placementRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.18), sales: Math.round(r.sales * 0.18) }))
    : placementRows
  );
  const audData = withRoas(
    adType === 'SP'
    ? audienceRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.62), sales: Math.round(r.sales * 0.62) }))
    : adType === 'SB'
    ? audienceRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.38), sales: Math.round(r.sales * 0.38) }))
    : adType === 'SBV'
    ? audienceRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.12), sales: Math.round(r.sales * 0.12) }))
    : adType === 'SD'
    ? audienceRows.map((r) => ({ ...r, spend: Math.round(r.spend * 0.18), sales: Math.round(r.sales * 0.18) }))
    : audienceRows
  );
  const adTypeData = withRoas(adTypeRows);
  const stData = withRoas(searchTermData);

  const placCols = useMemo(() => buildCols('placement', 'Placement', currency as Currency), [currency]);
  const audCols  = useMemo(() => buildCols('segment',   'Audience',  currency as Currency), [currency]);
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
      { field: 'roas', headerName: 'ROAS', valueFormatter: ({ value }: { value: unknown }) => { const v = value as number; return v == null ? '' : `${v.toFixed(2)}x`; }, tooltip: 'Return on Ad Spend — ad sales ÷ ad spend. Inverse of ACOS. Higher is better.', cellStyle: ({ value }: { value: unknown }): Record<string, string> => { const v = value as number; return v >= 5 ? { color: '#166534' } : v < 3 ? { color: '#991B1B' } : {}; } },
      { field: 'cpc', headerName: 'CPC', valueFormatter: cf, subFields: [popSubField('cpcPoP', 'down')] },
      { field: 'cvr', headerName: 'CVR', valueFormatter: pctFmt, subFields: [popSubField('cvrPoP')] },
      { field: 'ctr', headerName: 'CTR', valueFormatter: ({ value }: { value: unknown }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; }, subFields: [popSubField('ctrPoP')] },
    ];
  }, [currency]);

  // Campaign data filtered by global ad type, enriched with ROAS
  const filteredCampaignData = useMemo(() => {
    const base = adType === 'All' ? campaignData : campaignData.filter((r) => r.type === adType);
    return base.map((r) => ({
      ...r,
      roas: r.spend > 0 ? Math.round((r.sales / r.spend) * 100) / 100 : 0,
      placements: r.placements?.map((p) => ({
        ...p,
        roas: p.spend > 0 ? Math.round((p.sales / p.spend) * 100) / 100 : 0,
      })),
    }));
  }, [adType]);

  const campChildRowsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const row of filteredCampaignData) {
      if (row.placements?.length) map[row.campaign] = row.placements;
    }
    return map;
  }, [filteredCampaignData]);

  // Per-section table controls (PoP, LY, Select, column visibility)
  const plac = useSectionControls(placCols, ['roas']);
  const aud  = useSectionControls(audCols, ['roas']);
  const at   = useSectionControls(atCols, ['roas']);
  const camp = useSectionControls(campCols, ['roas']);
  const st   = useSectionControls(stCols, ['roas']);
  void plac.selVals; void aud.selVals; void at.selVals; void camp.selVals; void st.selVals;

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
    tooltip?: string,
  ) => (
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
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

      {/* Global Campaign Type filter */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-xs font-medium text-gray-500">Campaign Type</span>
        <AdTypeToggle value={adType} onChange={setAdType} />
      </div>

      {/* 1 — Performance by Placement */}
      {sectionCard(<>
        {sectionHeader('Performance by Placement', placView, setPlacView, STANDARD_METRICS, placMet, setPlacMet, placData, undefined, true, { cols: placCols, showPoP: plac.showPoP, setShowPoP: plac.setShowPoP, showLY: plac.showLY, setShowLY: plac.setShowLY, selMode: plac.selMode, setSelMode: plac.setSelMode, visCols: plac.visCols, toggleCol: plac.toggleCol }, 'Ad metrics split by placement (Top of Search, Rest of Search, Product Pages).')}
        {placView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={placData} dimKey="placement" metrics={STANDARD_METRICS} selectedMetrics={placMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={plac.showPoP} onPoPChange={plac.setShowPoP} showLY={plac.showLY} onLYChange={plac.setShowLY} selectMode={plac.selMode} onSelectModeChange={plac.setSelMode} onSelectedValuesChange={plac.setSelVals} visibleColumnsOverride={plac.visCols} rowData={placData} columnDefs={placCols} />}
      </>)}

      {/* 2 — Performance by Ad Type */}
      {sectionCard(<>
        {sectionHeader('Performance by Ad Type', atView, setAtView, STANDARD_METRICS, atMet, setAtMet, adTypeData, undefined, true, { cols: atCols, showPoP: at.showPoP, setShowPoP: at.setShowPoP, showLY: at.showLY, setShowLY: at.setShowLY, selMode: at.selMode, setSelMode: at.setSelMode, visCols: at.visCols, toggleCol: at.toggleCol }, 'Ad metrics split by campaign type (Sponsored Products, Sponsored Brands, Sponsored Display).')}
        {atView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={adTypeData} dimKey="adType" metrics={STANDARD_METRICS} selectedMetrics={atMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={at.showPoP} onPoPChange={at.setShowPoP} showLY={at.showLY} onLYChange={at.setShowLY} selectMode={at.selMode} onSelectModeChange={at.setSelMode} onSelectedValuesChange={at.setSelVals} visibleColumnsOverride={at.visCols} rowData={adTypeData} columnDefs={atCols} />}
      </>)}

      {/* 6 — Performance by Campaign */}
      {sectionCard(<>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Performance by Campaign</h3>
            <InfoTooltip content="Ad metrics per campaign. Expand a row to see placement-level breakdown." />
          </div>
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
              onClick={() => exportSection('Performance by Campaign', filteredCampaignData)}
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
          rowData={filteredCampaignData} columnDefs={campCols}
          childRowsMap={campChildRowsMap} rowKeyField="campaign" childLabelField="placement"
        />
      </>)}

      {/* 7 — Performance by Search Term */}
      {sectionCard(<>
        {sectionHeader('Performance by Search Term', stView, setStView, SEARCH_METRICS, stMet, setStMet, stData, undefined, true, { cols: stCols, showPoP: st.showPoP, setShowPoP: st.setShowPoP, showLY: st.showLY, setShowLY: st.setShowLY, selMode: st.selMode, setSelMode: st.setSelMode, visCols: st.visCols, toggleCol: st.toggleCol }, 'Ad metrics per search term. Shows which keywords drive spend, clicks, and conversions.')}
        {stView === 'chart'
          ? <div className="p-5"><SmallMultiplesChart data={stData.slice(0, 15)} dimKey="searchTerm" metrics={SEARCH_METRICS} selectedMetrics={stMet} currency={currency} /></div>
          : <DeepDiveTable title="" embedded showPoP={st.showPoP} onPoPChange={st.setShowPoP} showLY={st.showLY} onLYChange={st.setShowLY} selectMode={st.selMode} onSelectModeChange={st.setSelMode} onSelectedValuesChange={st.setSelVals} visibleColumnsOverride={st.visCols} rowData={stData} columnDefs={stCols} />}
      </>)}

      {/* 6 — Performance by Audience (gated on audience labeling toggle) */}
      {audienceLabelingEnabled
        ? sectionCard(<>
            {sectionHeader('Performance by Audience', audView, setAudView, STANDARD_METRICS, audMet, setAudMet, audData, undefined, false, { cols: audCols, showPoP: aud.showPoP, setShowPoP: aud.setShowPoP, showLY: aud.showLY, setShowLY: aud.setShowLY, selMode: aud.selMode, setSelMode: aud.setSelMode, visCols: aud.visCols, toggleCol: aud.toggleCol }, 'Ad metrics split by audience segment (e.g., remarketing, in-market, lifestyle).')}
            {audView === 'chart'
              ? <div className="p-5"><SmallMultiplesChart data={audData} dimKey="segment" metrics={STANDARD_METRICS} selectedMetrics={audMet} currency={currency} /></div>
              : <DeepDiveTable title="" embedded showPoP={aud.showPoP} onPoPChange={aud.setShowPoP} showLY={aud.showLY} onLYChange={aud.setShowLY} selectMode={aud.selMode} onSelectModeChange={aud.setSelMode} onSelectedValuesChange={aud.setSelVals} visibleColumnsOverride={aud.visCols} rowData={audData} columnDefs={audCols} />}
          </>)
        : sectionCard(<>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-gray-900">Performance by Audience</h3>
                <InfoTooltip content="Ad metrics split by audience segment (e.g., remarketing, in-market, lifestyle). Requires audience labeling to be configured at the account level." />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <Lock className="w-3 h-3" />
                Not configured
              </div>
            </div>
            <div className="relative">
              <div className="pointer-events-none select-none opacity-30 blur-[1.5px]">
                {audView === 'chart'
                  ? <div className="p-5"><SmallMultiplesChart data={audData} dimKey="segment" metrics={STANDARD_METRICS} selectedMetrics={audMet} currency={currency} /></div>
                  : <DeepDiveTable title="" embedded showPoP={aud.showPoP} onPoPChange={aud.setShowPoP} showLY={aud.showLY} onLYChange={aud.setShowLY} selectMode={aud.selMode} onSelectModeChange={aud.setSelMode} onSelectedValuesChange={aud.setSelVals} visibleColumnsOverride={aud.visCols} rowData={audData} columnDefs={audCols} />}
              </div>
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="max-w-md text-center bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-5">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 mb-3">
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Audience labeling not enabled</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Audience-level reporting requires audience segments to be configured for this account.
                    Go to <span className="font-semibold text-gray-800">Settings → Account</span> to enable it.
                  </p>
                </div>
              </div>
            </div>
          </>)
      }

      <LastRefreshed offsetMinutes={12} />
    </div>
  );
}
