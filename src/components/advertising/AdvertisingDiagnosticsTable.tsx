// ─── Advertising Diagnostics — decision-first table ──────────────────────
// Decision-mode tabs, entity selector, simplified columns, severity sort.

import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import InfoTooltip from '../InfoTooltip';
import {
  DECISION_STYLE, DECISION_TABS, ISSUE_STYLE, SEVERITY_STYLE,
  CONFIDENCE_STYLE, ISSUE_CTA, ENTITY_KIND_LABEL,
  matchesDecisionTab,
  type Diagnostic, type DecisionTab, type EntityKind,
} from '../../data/advertisingDiagnostics';

// ── Rule-book tooltip copy ──────────────────────────────────────────────
// Surfaces the deterministic classification rules in the column headers so
// the user can see WHY every chip was assigned without opening the drawer.

const DECISION_RULES_TOOLTIP =
  'Decisions are assigned by a deterministic rule engine, evaluated in order:\n\n' +
  '• Pause — material spend (≥€5k) AND zero orders → "Spend without sales"\n' +
  '• Waste — material spend AND ACOS past break-even (>45%)\n' +
  '• Fix — material spend AND ACOS above target (>30%) AND orders >0\n' +
  '• Scale — ACOS at/below target (≤30%) AND conversion stable or improving\n' +
  '• Protect — high sales share AND ACOS healthy AND TACOS stable\n' +
  '• Monitor — low volume or mixed signals; no action yet\n\n' +
  'Hover any chip below to see the row-specific reason. Click the row for the full diagnosis.';

const ISSUE_RULES_TOOLTIP =
  'Issue types describe WHAT triggered the decision:\n\n' +
  '• High ACOS — ACOS exceeds the 30% target\n' +
  '• Spend without sales — spend ≥€5k with 0 orders\n' +
  '• CPC inflation — CPC up ≥5% PoP while ACOS over target\n' +
  '• CVR decline — conversion rate down ≥5% PoP\n' +
  '• CTR decline — click-through rate down ≥5% PoP\n' +
  '• Profitable scaling opportunity — ACOS under target, room to grow\n' +
  '• Product readiness issue — Buy Box <85%, rating <4.0, or stock <14 days\n' +
  '• Placement inefficiency — placement-level cost outpaces return\n' +
  '• Search term waste — managed term spend with no orders\n\n' +
  'Confidence reflects how many supporting metrics align.';

type SortKey = 'severity' | 'spend' | 'sales' | 'acos' | 'impact';

export default function AdvertisingDiagnosticsTable({
  diagnostics, entity, onEntityChange, tab, onTabChange, onRowClick,
}: {
  diagnostics: Diagnostic[];
  entity: EntityKind;
  onEntityChange: (k: EntityKind) => void;
  tab: DecisionTab;
  onTabChange: (t: DecisionTab) => void;
  onRowClick?: (d: Diagnostic) => void;
}) {
  const { currency } = useCurrency();
  const [sortKey, setSortKey] = useState<SortKey>('severity');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return diagnostics
      .filter((d) => matchesDecisionTab(d, tab))
      .filter((d) => !search.trim() || d.row.name.toLowerCase().includes(search.toLowerCase().trim()));
  }, [diagnostics, tab, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'spend':    return b.row.spend - a.row.spend;
        case 'sales':    return b.row.sales - a.row.sales;
        case 'acos':     return b.row.acos  - a.row.acos;
        case 'impact':   return b.revenueImpact - a.revenueImpact;
        case 'severity':
        default:         return b.severity - a.severity;
      }
    });
    return arr;
  }, [filtered, sortKey]);

  const tabCount = (t: DecisionTab) => diagnostics.filter((d) => matchesDecisionTab(d, t)).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Decision-mode tabs */}
      <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex items-center gap-1 flex-wrap">
        {DECISION_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                active ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[10px] tabular-nums ${active ? 'text-gray-300' : 'text-gray-400'}`}>{tabCount(t.id)}</span>
            </button>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="px-5 py-2 border-b border-gray-100 flex items-center gap-3 flex-wrap text-[11px]">
        <label className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Entity</span>
          <div className="relative inline-block">
            <select
              value={entity}
              onChange={(e) => onEntityChange(e.target.value as EntityKind)}
              className="appearance-none text-[11px] font-semibold text-gray-800 bg-white border border-gray-200 rounded-md pl-2 pr-6 py-1 focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none cursor-pointer"
            >
              <option value="campaign">Campaigns</option>
              <option value="adGroup">Ad groups</option>
              <option value="placement">Placements</option>
              <option value="campaignType">Campaign type</option>
              <option value="product">Products / ASINs</option>
              <option value="searchTerm">Search terms</option>
              <option value="keyword">Keywords</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </label>
        <span className="text-gray-200">·</span>
        <label className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Sort</span>
          <div className="relative inline-block">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="appearance-none text-[11px] font-semibold text-gray-800 bg-white border border-gray-200 rounded-md pl-2 pr-6 py-1 focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none cursor-pointer"
            >
              <option value="severity">Severity</option>
              <option value="spend">Spend</option>
              <option value="sales">Ad sales</option>
              <option value="acos">ACOS</option>
              <option value="impact">Revenue impact</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </label>
        <span className="text-gray-200">·</span>
        <div className="relative">
          <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-6 pr-2 py-1 text-[11px] border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none w-44"
          />
        </div>
        <div className="ml-auto text-[10px] text-gray-400">
          {sorted.length} {sorted.length === 1 ? 'row' : 'rows'}
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-xs text-gray-500">
          {search.trim() ? 'No rows match your search.' : 'Data for this entity is not available yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <Th>Entity</Th>
                <Th>Type</Th>
                <Th tooltip={DECISION_RULES_TOOLTIP}>Decision</Th>
                <Th tooltip={ISSUE_RULES_TOOLTIP}>Issue</Th>
                <Th align="right">Spend</Th>
                <Th align="right">Ad sales</Th>
                <Th align="right">ACOS</Th>
                <Th align="right">ROAS</Th>
                <Th align="right">CPC</Th>
                <Th align="right">CTR</Th>
                <Th align="right">CVR</Th>
                <Th align="right">Orders</Th>
                <Th align="right">Revenue impact</Th>
                <Th>Profit</Th>
                <Th>Conf.</Th>
                <Th>Next step</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <Row key={d.row.key} d={d} onClick={() => onRowClick?.(d)} currency={currency} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'left', tooltip }: { children: React.ReactNode; align?: 'left' | 'right'; tooltip?: string }) {
  return (
    <th className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {children}
        {tooltip && <InfoTooltip content={tooltip} wide />}
      </span>
    </th>
  );
}

function Row({ d, onClick, currency }: { d: Diagnostic; onClick: () => void; currency: Parameters<typeof fc>[1] }) {
  const dec = DECISION_STYLE[d.decision];
  const issueCls = ISSUE_STYLE[d.issue];
  const sev = SEVERITY_STYLE[d.sevLevel];
  const cta = ISSUE_CTA[d.issue];
  const acosCls = d.row.acos > 45 ? 'text-rose-700' : d.row.acos > 30 ? 'text-amber-700' : d.row.acos > 0 ? 'text-emerald-700' : 'text-gray-400';
  return (
    <tr onClick={onClick} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50/60 transition-colors">
      <td className="px-3 py-2.5 align-top min-w-[200px] max-w-[280px]">
        <div className="text-[12px] font-semibold text-gray-900 leading-tight truncate" title={d.row.name}>{d.row.name}</div>
        {d.row.subLabel && <div className="text-[10px] text-gray-500 truncate">{d.row.subLabel}</div>}
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{ENTITY_KIND_LABEL[d.row.kind]}</span>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span
          title={`${d.because}${d.watch ? '\n\n' + d.watch : ''}\n\n— Click row for full diagnosis —`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-help ${dec.chip}`}
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dec.dot}`} />
          {d.decision}
        </span>
        <span
          title={`Severity = |revenue impact| × confidence multiplier.\nImpact: €${d.revenueImpact.toLocaleString()} · Confidence: ${d.confidence}`}
          className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-bold border cursor-help ${sev.chip} ml-1`}
        >{sev.label}</span>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span
          title={`${d.issue}${d.evidence.length ? '\n\nEvidence:\n• ' + d.evidence.join('\n• ') : ''}`}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-help ${issueCls}`}
        >{d.issue}</span>
      </td>
      <td className="px-3 py-2.5 align-top text-right tabular-nums">{fc(d.row.spend, currency, { compact: true })}</td>
      <td className="px-3 py-2.5 align-top text-right tabular-nums">{fc(d.row.sales, currency, { compact: true })}</td>
      <td className={`px-3 py-2.5 align-top text-right font-semibold tabular-nums ${acosCls}`}>{d.row.acos.toFixed(1)}%</td>
      <td className="px-3 py-2.5 align-top text-right tabular-nums">{d.row.roas.toFixed(2)}x</td>
      <td className="px-3 py-2.5 align-top text-right tabular-nums">{fc(d.row.cpc, currency, { compact: false, decimals: 2 })}</td>
      <td className="px-3 py-2.5 align-top text-right tabular-nums">{d.row.ctr.toFixed(2)}%</td>
      <td className="px-3 py-2.5 align-top text-right tabular-nums">{d.row.cvr.toFixed(1)}%</td>
      <td className="px-3 py-2.5 align-top text-right tabular-nums">{d.row.orders.toLocaleString()}</td>
      <td className="px-3 py-2.5 align-top text-right">
        <span className={`text-[12px] font-bold tabular-nums ${d.revenueImpact > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
          {d.revenueImpact > 0 ? `−${fc(d.revenueImpact, currency, { compact: true })}` : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top">
        {d.unprofitable
          ? <span className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200">Unprof.</span>
          : <span className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">OK</span>}
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold border ${CONFIDENCE_STYLE[d.confidence]}`}>{d.confidence}</span>
      </td>
      <td className="px-3 py-2.5 align-top max-w-[260px]">
        {cta.ctaLabel ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-900">
            {cta.ctaLabel}
            <ArrowRight className="w-3 h-3 text-gray-500" />
          </span>
        ) : (
          <span className="text-[11px] text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}
