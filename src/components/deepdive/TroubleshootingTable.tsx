// ─── Sales Deepdive — Troubleshooting Table ──────────────────────────────
// Decision-mode-driven table. Default columns:
//   Entity · Entity type · Issue type · Severity · Confidence ·
//   Profit impact · Revenue impact · Primary driver · Secondary driver ·
//   Next step
// Decision-mode tabs (Profit risks default) and a Rank-by dropdown
// control filtering and sort order. Entity-type filter scopes the rows
// (default: All).

import { useMemo } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import {
  ISSUE_META, ISSUE_STYLE, SEVERITY_STYLE, CONFIDENCE_STYLE,
  MODE_TABS, RANK_OPTIONS, ENTITY_KIND_LABEL,
  matchesMode, sortByRank,
  type Diagnostic, type DecisionMode, type EntityKind, type RankKey,
} from '../../data/deepdiveDiagnostics';

export type ModeTabId = DecisionMode | 'all-issues';
export type EntityFilter = EntityKind | 'all';

const ENTITY_FILTERS: { id: EntityFilter; label: string }[] = [
  { id: 'all',         label: 'All entities' },
  { id: 'marketplace', label: 'Marketplaces' },
  { id: 'category',    label: 'Categories' },
  { id: 'asin',        label: 'ASINs' },
];

export default function TroubleshootingTable({
  diagnostics, mode, onModeChange, entityFilter, onEntityFilterChange,
  rank, onRankChange, onRowClick,
}: {
  diagnostics: Diagnostic[];
  mode: ModeTabId;
  onModeChange: (m: ModeTabId) => void;
  entityFilter: EntityFilter;
  onEntityFilterChange: (e: EntityFilter) => void;
  rank: RankKey;
  onRankChange: (r: RankKey) => void;
  onRowClick?: (d: Diagnostic) => void;
}) {
  const { currency } = useCurrency();

  const filtered = useMemo(() => {
    return diagnostics
      .filter((d) => entityFilter === 'all' || d.kind === entityFilter)
      .filter((d) => matchesMode(d, mode));
  }, [diagnostics, entityFilter, mode]);

  const sorted = useMemo(() => sortByRank(filtered, rank), [filtered, rank]);

  // Mode-tab counts respect the active entity filter (so switching modes is
  // honest about what's in scope right now).
  const entityScoped = useMemo(
    () => diagnostics.filter((d) => entityFilter === 'all' || d.kind === entityFilter),
    [diagnostics, entityFilter],
  );
  const modeCount = (m: ModeTabId) => entityScoped.filter((d) => matchesMode(d, m)).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Decision-mode tabs */}
      <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex items-center gap-1 flex-wrap">
        {MODE_TABS.map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] tabular-nums ${active ? 'text-gray-300' : 'text-gray-400'}`}>{modeCount(tab.id)}</span>
            </button>
          );
        })}
      </div>

      {/* Controls: entity filter + rank-by */}
      <div className="px-5 py-2 border-b border-gray-100 flex items-center gap-3 flex-wrap text-[11px]">
        <label className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Filter</span>
          <Select value={entityFilter} options={ENTITY_FILTERS} onChange={onEntityFilterChange} />
        </label>
        <span className="text-gray-200">·</span>
        <label className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Rank by</span>
          <Select value={rank} options={RANK_OPTIONS} onChange={onRankChange} />
        </label>
        <div className="ml-auto text-[10px] text-gray-400">
          {sorted.length} {sorted.length === 1 ? 'row' : 'rows'}
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-xs text-gray-500">
          No rows match this view. Try a different decision mode or widen the entity filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <Th>Entity</Th>
                <Th>Type</Th>
                <Th>Issue</Th>
                <Th>Severity</Th>
                <Th>Confidence</Th>
                <Th align="right">Profit impact</Th>
                <Th align="right">Revenue impact</Th>
                <Th>Primary driver</Th>
                <Th>Secondary driver</Th>
                <Th>Next step</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <Row key={d.key} d={d} onClick={() => onRowClick?.(d)} currency={currency} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function Select<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none text-[11px] font-semibold text-gray-800 bg-white border border-gray-200 rounded-md pl-2 pr-6 py-1 focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none cursor-pointer"
      >
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function Row({
  d, onClick, currency,
}: {
  d: Diagnostic;
  onClick: () => void;
  currency: Parameters<typeof fc>[1];
}) {
  const meta = ISSUE_META[d.issue];
  const issueStyle = ISSUE_STYLE[d.issue];
  const sev = SEVERITY_STYLE[d.severityLevel];
  const salesPoP = d.row.salesPoP;
  const isDown = salesPoP < 0;
  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-50 cursor-pointer hover:bg-gray-50/60 transition-colors"
    >
      <td className="px-3 py-2.5 align-top min-w-[180px]">
        <div className="text-[12px] font-semibold text-gray-900 leading-tight">{d.name}</div>
        <div className="text-[10px] text-gray-500 mt-0.5 inline-flex items-center gap-1.5">
          <span className={`tabular-nums ${isDown ? 'text-rose-700' : salesPoP > 0 ? 'text-emerald-700' : 'text-gray-500'}`}>
            {isDown ? <ArrowDown className="w-2.5 h-2.5 inline" /> : salesPoP > 0 ? <ArrowUp className="w-2.5 h-2.5 inline" /> : null}
            {salesPoP > 0 ? '+' : ''}{salesPoP.toFixed(1)}% sales
          </span>
          {d.subLabel && <span className="truncate max-w-[200px]" title={d.subLabel}>· {d.subLabel}</span>}
        </div>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{ENTITY_KIND_LABEL[d.kind]}</span>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${issueStyle.chip}`}>
          {d.issue}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${sev.chip}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${sev.dot}`} />
          {sev.label}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${CONFIDENCE_STYLE[d.confidence]}`}>
          {d.confidence}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top text-right">
        <span className={`text-[12px] font-bold tabular-nums ${d.profitImpact > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
          {d.profitImpact > 0 ? `−${fc(d.profitImpact, currency, { compact: true })}` : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top text-right">
        <span className={`text-[12px] font-semibold tabular-nums ${d.revenueImpact > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
          {d.revenueImpact > 0 ? `−${fc(d.revenueImpact, currency, { compact: true })}` : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className="text-[11px] text-gray-800 font-medium">{d.primary?.label ?? '—'}</span>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className="text-[11px] text-gray-600">{d.secondary?.label ?? '—'}</span>
      </td>
      <td className="px-3 py-2.5 align-top max-w-[260px]">
        {meta.ctaLabel ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-900">
            {meta.ctaLabel}
            <ArrowRight className="w-3 h-3 text-gray-500" />
          </span>
        ) : (
          <span className="text-[11px] text-gray-400">No action needed</span>
        )}
      </td>
    </tr>
  );
}
