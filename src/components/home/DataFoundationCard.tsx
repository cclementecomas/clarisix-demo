import { useMemo } from 'react';
import {
  Shield, ArrowRight, Check, AlertTriangle, Boxes, DollarSign, Cable, Settings as SettingsIcon,
} from 'lucide-react';
import { inventoryData } from '../../data/inventoryData';
import {
  buildSkuCostProfiles, computeCoverage, demoCostRecords, demoInboundEvents,
} from '../../data/cogsData';
import type { CostMarketplace } from '../../data/cogsData';
import { seedMappings, getMappingStatus } from '../../data/productMappingData';
import { connectors as connectorsData } from '../../data/connectorsData';

type Tier = 'strong' | 'partial' | 'weak';

interface SignalRow {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad';
  cta?: string;
  onClick?: () => void;
}

export default function DataFoundationCard({
  onNavigateToSettings,
}: {
  /** Called with a Settings tab id ('costs' | 'products' | 'connections' | 'account'). */
  onNavigateToSettings: (tab: string) => void;
}) {
  // ─── Profit reliability (revenue coverage from COGS) ───────────────────
  const cogsCoverage = useMemo(() => {
    const inventoryShape = inventoryData.map((item) => ({
      sku: item.sku,
      asin: item.asin,
      title: item.title,
      marketplace: item.marketplace as CostMarketplace,
      avgDailySales: item.avgDailySales,
      unitsSold: item.unitsSold,
      currentStock: item.currentStock,
      inbound: item.inbound,
    }));
    const profiles = buildSkuCostProfiles(inventoryShape, demoCostRecords, demoInboundEvents);
    return computeCoverage(profiles);
  }, []);

  // ─── Mapping coverage (Brand + Category set per SKU) ───────────────────
  const mapping = useMemo(() => {
    const seedBySku = new Map(seedMappings.map((s) => [s.sku, s]));
    let mapped = 0;
    for (const sku of inventoryData) {
      const m = seedBySku.get(sku.sku);
      const draft = {
        brand: m?.brand ?? '',
        category: m?.category ?? '',
        subcategory: m?.subcategory ?? '',
        tag: m?.tag ?? '',
      };
      const status = getMappingStatus(draft);
      if (status !== 'needs-mapping') mapped += 1;
    }
    const total = inventoryData.length;
    return {
      total,
      mapped,
      coverage: total > 0 ? Math.round((mapped / total) * 100) : 100,
      missing: total - mapped,
    };
  }, []);

  // ─── Connectors ─────────────────────────────────────────────────────────
  const connectors = useMemo(() => {
    const configured = connectorsData.filter((c) => c.configured).length;
    return { configured, total: connectorsData.length };
  }, []);

  // ─── Composite score ────────────────────────────────────────────────────
  // Weight: revenue coverage 60%, mapping coverage 40% (revenue impact > catalog completeness).
  // Connectors / inventory rules are gating signals — if connectors == 0, hard cap at 0.
  const score = useMemo(() => {
    if (connectors.configured === 0) return 0;
    return Math.round(cogsCoverage.revenueCoverage * 0.6 + mapping.coverage * 0.4);
  }, [cogsCoverage.revenueCoverage, mapping.coverage, connectors.configured]);

  const tier: Tier = score >= 90 ? 'strong' : score >= 60 ? 'partial' : 'weak';
  const tierStyle = {
    strong:  { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'STRONG' },
    partial: { bar: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', badge: 'PARTIAL' },
    weak:    { bar: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200', badge: 'NEEDS WORK' },
  }[tier];

  const headline = tier === 'strong'
    ? 'Reports are trustworthy across the board.'
    : tier === 'partial'
      ? 'Some inputs are incomplete — reports are partial.'
      : 'Critical inputs missing — reports may be misleading.';

  // ─── Rows ───────────────────────────────────────────────────────────────
  const rows: SignalRow[] = [
    {
      key: 'cogs',
      icon: DollarSign,
      label: 'Profit reliability',
      detail: `${cogsCoverage.revenueCoverage}% revenue coverage` + (cogsCoverage.needsCostCount > 0 ? ` · ${cogsCoverage.needsCostCount} SKUs need cost` : ''),
      tone: cogsCoverage.revenueCoverage >= 90 ? 'good' : cogsCoverage.revenueCoverage >= 60 ? 'warn' : 'bad',
      cta: cogsCoverage.needsCostCount > 0 ? 'Open Costs' : undefined,
      onClick: () => onNavigateToSettings('costs'),
    },
    {
      key: 'mapping',
      icon: Boxes,
      label: 'Product mapping',
      detail: `${mapping.coverage}% mapped` + (mapping.missing > 0 ? ` · ${mapping.missing} fall back to "NA"` : ''),
      tone: mapping.coverage >= 90 ? 'good' : mapping.coverage >= 60 ? 'warn' : 'bad',
      cta: mapping.missing > 0 ? 'Open Products' : undefined,
      onClick: () => onNavigateToSettings('products'),
    },
    {
      key: 'connectors',
      icon: Cable,
      label: 'Connections',
      detail: connectors.configured === 0
        ? 'No data sources connected'
        : `${connectors.configured} active connector${connectors.configured !== 1 ? 's' : ''}`,
      tone: connectors.configured === 0 ? 'bad' : connectors.configured >= 1 ? 'good' : 'warn',
      cta: connectors.configured === 0 ? 'Connect data' : undefined,
      onClick: () => onNavigateToSettings('connections'),
    },
    {
      key: 'account',
      icon: SettingsIcon,
      label: 'Account specifics',
      detail: 'COGS method, campaign naming, audience labeling',
      tone: 'good',
      onClick: () => onNavigateToSettings('account'),
    },
  ];

  const fixCount = rows.filter((r) => r.tone !== 'good').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Data Foundation</h2>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}>
              {tierStyle.badge}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Reports are only as trustworthy as their inputs. {headline}
          </p>
        </div>

        <div className="flex-shrink-0 flex items-end gap-3">
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold leading-none ${tierStyle.text}`}>{score}</span>
              <span className="text-xs text-gray-400 font-medium">%</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{fixCount === 0 ? 'No gaps' : `${fixCount} gap${fixCount !== 1 ? 's' : ''}`}</div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-3 pb-4">
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden mb-3">
          <div
            className={`h-full ${tierStyle.bar} transition-all`}
            style={{ width: `${Math.max(2, score)}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {rows.map((r) => (
            <button
              key={r.key}
              onClick={r.onClick}
              className="group flex items-center gap-2.5 py-1.5 text-left hover:bg-gray-50/60 -mx-2 px-2 rounded-md transition-colors"
            >
              <ToneIcon tone={r.tone} fallbackIcon={r.icon} />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-gray-800 truncate">{r.label}</div>
                <div className="text-[10px] text-gray-500 truncate">{r.detail}</div>
              </div>
              {r.cta && (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-cx-600 group-hover:text-cx-700 flex-shrink-0">
                  {r.cta}
                  <ArrowRight className="w-3 h-3" />
                </span>
              )}
              {!r.cta && (
                <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToneIcon({
  tone, fallbackIcon: FallbackIcon,
}: {
  tone: 'good' | 'warn' | 'bad';
  fallbackIcon: React.ComponentType<{ className?: string }>;
}) {
  if (tone === 'good') {
    return (
      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <Check className="w-3 h-3 text-emerald-700" />
      </span>
    );
  }
  if (tone === 'warn') {
    return (
      <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-3 h-3 text-amber-700" />
      </span>
    );
  }
  if (tone === 'bad') {
    return (
      <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-3 h-3 text-rose-700" />
      </span>
    );
  }
  return (
    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <FallbackIcon className="w-3 h-3 text-gray-500" />
    </span>
  );
}
