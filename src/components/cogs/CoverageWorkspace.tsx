import { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle, Search, Plus, ChevronDown, ChevronRight, X, Layers,
  TrendingUp, Package, Inbox, Moon, Globe, Target, FileSpreadsheet, Hand,
  Upload, Cpu, ArrowRight,
} from 'lucide-react';
import {
  buildSkuCostProfiles, computeCoverage, demoCostRecords, demoInboundEvents, demoInboundClusters,
  MARKETPLACE_LABELS,
} from '../../data/cogsData';
import type {
  SkuCostProfile, CostRecord, CostMarketplace, CostCurrency, CostSource,
  SkuCoverageStatus, InboundCluster,
} from '../../data/cogsData';
import { inventoryData } from '../../data/inventoryData';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import LastRefreshed from '../LastRefreshed';
import InfoTooltip from '../InfoTooltip';
import PasteUploadModal from './PasteUploadModal';
import InboundReceiptsView from './InboundReceiptsView';

// ─── Types ────────────────────────────────────────────────────────────────

type WorklistKey = 'all' | 'needs-cost' | 'top-revenue' | 'inbound' | 'dormant';

const CURRENCIES: CostCurrency[] = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'CAD', 'AUD'];
const MARKETPLACES: CostMarketplace[] = ['all', 'US', 'UK', 'DE', 'FR', 'IT', 'ES', 'CA'];

const SOURCE_LABELS: Record<CostSource, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  manual: { label: 'Manual entry', icon: Hand },
  paste: { label: 'Pasted data', icon: FileSpreadsheet },
  csv: { label: 'CSV upload', icon: Upload },
  inbound: { label: 'Inbound shipment', icon: Inbox },
  builder: { label: 'Landed cost builder', icon: Cpu },
  api: { label: 'API import', icon: Cpu },
};

// ─── Component ────────────────────────────────────────────────────────────

export default function CoverageWorkspace() {
  const { currency } = useCurrency();
  const cur = currency as 'EUR' | 'USD' | 'GBP';

  // Local state representing the in-memory cost records (demo)
  const [costRecords, setCostRecords] = useState<CostRecord[]>(demoCostRecords);
  const [ignoredSkus, setIgnoredSkus] = useState<Set<string>>(new Set());
  const [inboundClusters, setInboundClusters] = useState<InboundCluster[]>(demoInboundClusters);

  // UI state
  const [activeWorklist, setActiveWorklist] = useState<WorklistKey>('needs-cost');
  const [search, setSearch] = useState('');
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [inboundOpen, setInboundOpen] = useState(false);
  const [showCoverageDetails, setShowCoverageDetails] = useState(false);
  const [showDormant, setShowDormant] = useState(false);

  // Build profiles from current records + inventory
  const profiles = useMemo(() => {
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
    return buildSkuCostProfiles(inventoryShape, costRecords, demoInboundEvents, ignoredSkus);
  }, [costRecords, ignoredSkus]);

  const coverage = useMemo(() => computeCoverage(profiles), [profiles]);

  // Filter profiles by active worklist + search
  const filteredProfiles = useMemo(() => {
    let list = profiles;
    if (activeWorklist === 'needs-cost') {
      list = list.filter((p) => p.status === 'needs-cost-active' || p.status === 'needs-cost-inventory' || p.status === 'needs-cost-inbound');
    } else if (activeWorklist === 'top-revenue') {
      list = list.filter((p) => p.revenue90d > 0);
    } else if (activeWorklist === 'inbound') {
      list = list.filter((p) => p.inboundEvents.length > 0);
    } else if (activeWorklist === 'dormant') {
      list = list.filter((p) => p.status === 'dormant' || p.status === 'ignored');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.sku.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.asin.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.revenue90d - a.revenue90d);
  }, [profiles, activeWorklist, search]);

  // ─── Inline cost edit ───────────────────────────────────────────────────

  const setSkuCost = useCallback(
    (sku: string, value: number, currencyVal: CostCurrency, marketplace: CostMarketplace = 'all') => {
      setCostRecords((prev) => {
        // If a global record exists with no end date, update it; otherwise append
        const existingIdx = prev.findIndex(
          (r) => r.sku === sku && r.marketplace === marketplace && !r.effectiveTo && !r.effectiveFrom
        );
        const next = [...prev];
        if (existingIdx >= 0) {
          next[existingIdx] = {
            ...next[existingIdx],
            landedCost: value,
            currency: currencyVal,
            source: 'manual',
            createdAt: new Date().toISOString().slice(0, 10),
          };
        } else {
          next.push({
            id: `CR-${Date.now()}`,
            sku,
            marketplace,
            landedCost: value,
            currency: currencyVal,
            effectiveFrom: null,
            effectiveTo: null,
            source: 'manual',
            confidence: 'high',
            createdAt: new Date().toISOString().slice(0, 10),
          });
        }
        return next;
      });
    },
    []
  );

  const addCostRecord = useCallback((record: CostRecord) => {
    setCostRecords((prev) => [...prev, record]);
  }, []);

  const removeCostRecord = useCallback((id: string) => {
    setCostRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleApplyImport = useCallback((rows: Array<Omit<CostRecord, 'id' | 'createdAt' | 'confidence'>>) => {
    const today = new Date().toISOString().slice(0, 10);
    setCostRecords((prev) => {
      const next = [...prev];
      let seq = Date.now();
      for (const row of rows) {
        // Replace any existing global record with no dates
        const existingIdx = next.findIndex(
          (r) => r.sku === row.sku && r.marketplace === row.marketplace && !r.effectiveTo && r.effectiveFrom === row.effectiveFrom
        );
        const newRecord: CostRecord = {
          ...row,
          id: `CR-${seq++}`,
          createdAt: today,
          confidence: 'high',
        };
        if (existingIdx >= 0) next[existingIdx] = newRecord;
        else next.push(newRecord);
      }
      return next;
    });
    setPasteOpen(false);
  }, []);

  const handleApplyInbound = useCallback(
    (
      sku: string,
      action: 'reuse' | 'new' | 'batch' | 'ignore',
      payload?: { cost: number; currency: CostCurrency; effectiveFrom: string; applyAs: 'cost-change' | 'batch' }
    ) => {
      if (action === 'ignore') {
        setInboundClusters((prev) => prev.map((c) => (c.sku === sku ? { ...c, reviewed: true } : c)));
        return;
      }
      if (action === 'reuse') {
        const cluster = inboundClusters.find((c) => c.sku === sku);
        if (cluster && cluster.previousCost !== null) {
          addCostRecord({
            id: `CR-${Date.now()}`,
            sku,
            marketplace: 'all',
            landedCost: cluster.previousCost,
            currency: cluster.previousCurrency || 'USD',
            effectiveFrom: cluster.firstDate,
            effectiveTo: null,
            source: 'inbound',
            confidence: 'medium',
            createdAt: new Date().toISOString().slice(0, 10),
            reason: `Reused previous cost for inbound on ${cluster.firstDate}`,
          });
        }
        setInboundClusters((prev) => prev.map((c) => (c.sku === sku ? { ...c, reviewed: true } : c)));
        return;
      }
      if (payload) {
        addCostRecord({
          id: `CR-${Date.now()}`,
          sku,
          marketplace: 'all',
          landedCost: payload.cost,
          currency: payload.currency,
          effectiveFrom: payload.effectiveFrom,
          effectiveTo: null,
          source: 'inbound',
          confidence: 'high',
          createdAt: new Date().toISOString().slice(0, 10),
          reason: payload.applyAs === 'batch' ? 'Batch from inbound shipment' : 'Cost change from inbound',
        });
        setInboundClusters((prev) => prev.map((c) => (c.sku === sku ? { ...c, reviewed: true } : c)));
      }
    },
    [inboundClusters, addCostRecord]
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  if (inboundOpen) {
    return (
      <InboundReceiptsView
        clusters={inboundClusters}
        onClose={() => setInboundOpen(false)}
        onAction={handleApplyInbound}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">COGS Coverage</h1>
            <InfoTooltip content="Keep product costs accurate so profit, margin, and reports stay trustworthy. Missing costs show as Unknown — never as zero." />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Type, paste, or upload landed costs. We stage imports and use Amazon inbound shipments as suggestions.
          </p>
        </div>
        <LastRefreshed />
      </div>

      {/* Coverage header */}
      <CoverageHeaderCard
        coverage={coverage}
        cur={cur}
        showDetails={showCoverageDetails}
        onToggleDetails={() => setShowCoverageDetails((v) => !v)}
        onFixNext={() => { setActiveWorklist('needs-cost'); setSearch(''); }}
        onPaste={() => setPasteOpen(true)}
        onInbound={() => setInboundOpen(true)}
      />

      {/* Workspace: sidebar + grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex">
        {/* Sidebar */}
        <WorklistSidebar
          coverage={coverage}
          active={activeWorklist}
          onSelect={setActiveWorklist}
        />

        {/* Grid area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search SKU, ASIN, title…"
                  className="pl-8 pr-3 py-1.5 text-xs w-72 border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
                />
              </div>
              <span className="text-[11px] text-gray-500">
                {filteredProfiles.length} {filteredProfiles.length === 1 ? 'SKU' : 'SKUs'}
                {activeWorklist === 'needs-cost' && ' missing cost'}
                {activeWorklist === 'top-revenue' && ', sorted by 90d revenue'}
                {activeWorklist === 'inbound' && ' with inbound activity'}
                {activeWorklist === 'dormant' && ' dormant'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPasteOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 px-3 py-1.5 rounded-md transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Paste / Upload
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 w-[28px]"></th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Product</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Mkts</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">90d Rev</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">90d Units</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">Inv / Inbound</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">Landed Cost</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Currency</th>
                  <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProfiles.map((p) => (
                  <SkuRow
                    key={p.sku}
                    profile={p}
                    cur={cur}
                    expanded={expandedSku === p.sku}
                    onToggleExpand={() => setExpandedSku(expandedSku === p.sku ? null : p.sku)}
                    onSetCost={setSkuCost}
                    onAddRecord={addCostRecord}
                    onRemoveRecord={removeCostRecord}
                    onIgnoreDormant={() =>
                      setIgnoredSkus((prev) => {
                        const next = new Set(prev);
                        next.add(p.sku);
                        return next;
                      })
                    }
                  />
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-xs text-gray-400">
                      No SKUs match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Paste / Upload modal */}
      {pasteOpen && (
        <PasteUploadModal
          onClose={() => setPasteOpen(false)}
          onApply={handleApplyImport}
          knownSkus={new Set(profiles.map((p) => p.sku))}
          coverage={coverage}
        />
      )}

      {/* Dormant footer prompt */}
      {coverage.dormantCount > 0 && activeWorklist !== 'dormant' && !showDormant && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] text-gray-600">
              <span className="font-semibold">{coverage.dormantCount} dormant SKUs</span> have no recent sales, inventory, or inbound. They aren't blocking current profit.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveWorklist('dormant'); setShowDormant(true); }}
              className="text-[10px] font-semibold text-cx-600 hover:text-cx-700 transition-colors"
            >
              Review list
            </button>
            <button
              onClick={() => setShowDormant(true)}
              className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Ignore for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Coverage Header ──────────────────────────────────────────────────────

function CoverageHeaderCard({
  coverage, cur, showDetails, onToggleDetails, onFixNext, onPaste, onInbound,
}: {
  coverage: ReturnType<typeof computeCoverage>;
  cur: 'EUR' | 'USD' | 'GBP';
  showDetails: boolean;
  onToggleDetails: () => void;
  onFixNext: () => void;
  onPaste: () => void;
  onInbound: () => void;
}) {
  const score = coverage.revenueCoverage;
  const tier = score >= 90 ? 'success' : score >= 60 ? 'warn' : 'danger';
  const tierColors = {
    success: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    warn:    { bar: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
    danger:  { bar: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  }[tier];

  const headline = score >= 90
    ? 'Profit reliability is strong.'
    : score >= 60
    ? `${100 - score}% of revenue has unknown COGS — profit is partial.`
    : 'Your profit is not ready yet.';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Profit reliability</h2>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${tierColors.bg} ${tierColors.text} border ${tierColors.border}`}>
              {tier === 'success' ? 'STRONG' : tier === 'warn' ? 'PARTIAL' : 'NOT READY'}
            </span>
          </div>
          <p className="text-xs text-gray-500">{headline}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onPaste}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 px-3 py-1.5 rounded-md transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Paste / Upload Costs
          </button>
          {coverage.inboundReviewCount > 0 && (
            <button
              onClick={onInbound}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <Inbox className="w-3.5 h-3.5" />
              Review {coverage.inboundReviewCount} inbound
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-end gap-6">
          {/* Headline number */}
          <div className="flex-shrink-0">
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-bold ${tierColors.text}`}>{score}%</span>
              <span className="text-xs text-gray-400 font-medium">revenue coverage</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {fc(coverage.coveredRevenue90d, cur)} covered of {fc(coverage.totalRevenue90d, cur)}
            </div>
          </div>

          {/* Bar */}
          <div className="flex-1 min-w-0">
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full ${tierColors.bar} transition-all`}
                style={{ width: `${Math.max(2, score)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={onToggleDetails}
                className="text-[10px] font-medium text-gray-400 hover:text-gray-600 inline-flex items-center gap-1"
              >
                {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
              {coverage.topRevenueGap > 0 && (
                <button
                  onClick={onFixNext}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-cx-600 hover:text-cx-700"
                >
                  Fix next {coverage.topRevenueGap} SKU{coverage.topRevenueGap !== 1 ? 's' : ''} to reach 90%
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Units coverage</div>
              <div className="text-lg font-semibold text-gray-900 mt-0.5">{coverage.unitsCoverage}%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {coverage.coveredUnits90d.toLocaleString()} of {coverage.totalUnits90d.toLocaleString()} units
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active SKU coverage</div>
              <div className="text-lg font-semibold text-gray-900 mt-0.5">{coverage.activeSkuCoverage}%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {coverage.costedActiveSkus} of {coverage.activeSkus} active SKUs
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Uncovered revenue</div>
              <div className="text-lg font-semibold text-gray-900 mt-0.5">{fc(coverage.uncoveredRevenue90d, cur)}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                across {coverage.needsCostCount} SKU{coverage.needsCostCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Worklist Sidebar ─────────────────────────────────────────────────────

function WorklistSidebar({
  coverage, active, onSelect,
}: {
  coverage: ReturnType<typeof computeCoverage>;
  active: WorklistKey;
  onSelect: (k: WorklistKey) => void;
}) {
  const items: Array<{ key: WorklistKey; icon: React.ComponentType<{ className?: string }>; label: string; sub: string; count: number; tone: 'red' | 'amber' | 'gray' | 'cx' }> = [
    { key: 'needs-cost',  icon: AlertTriangle, label: 'Needs COGS',     sub: 'Sold or stocked, no cost',   count: coverage.needsCostCount,        tone: 'red' },
    { key: 'top-revenue', icon: TrendingUp,    label: 'Top revenue',    sub: 'Sorted by 90d revenue',      count: coverage.activeSkus,            tone: 'cx' },
    { key: 'inbound',     icon: Inbox,         label: 'Inbound review', sub: 'Recent FBA receipts',        count: coverage.inboundReviewCount,    tone: 'amber' },
    { key: 'dormant',     icon: Moon,          label: 'Dormant',        sub: 'No recent activity',         count: coverage.dormantCount,          tone: 'gray' },
    { key: 'all',         icon: Package,       label: 'All SKUs',       sub: 'Full catalog',               count: coverage.activeSkus + coverage.dormantCount, tone: 'gray' },
  ];

  const toneClass = {
    red:   { dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    amber: { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    gray:  { dot: 'bg-gray-400',    badge: 'bg-gray-50 text-gray-700 border-gray-200' },
    cx:    { dot: 'bg-cx-500',      badge: 'bg-cx-50 text-cx-700 border-cx-200' },
  };

  return (
    <aside className="w-[200px] flex-shrink-0 border-r border-gray-100 bg-gray-50/50">
      <div className="px-3 py-2.5 border-b border-gray-100">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Worklist</span>
      </div>
      <nav className="py-1">
        {items.map((item) => {
          const isActive = active === item.key;
          const tone = toneClass[item.tone];
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`w-full text-left flex items-start gap-2 px-3 py-2 transition-colors ${
                isActive ? 'bg-white border-l-2 border-cx-500' : 'border-l-2 border-transparent hover:bg-white/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${tone.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`text-[11px] font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  <span className={`inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded text-[9px] font-bold border ${tone.badge}`}>
                    {item.count}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">{item.sub}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── SKU Row (with inline expand) ─────────────────────────────────────────

function SkuRow({
  profile, cur, expanded, onToggleExpand, onSetCost, onAddRecord, onRemoveRecord, onIgnoreDormant,
}: {
  profile: SkuCostProfile;
  cur: 'EUR' | 'USD' | 'GBP';
  expanded: boolean;
  onToggleExpand: () => void;
  onSetCost: (sku: string, value: number, currency: CostCurrency, marketplace?: CostMarketplace) => void;
  onAddRecord: (record: CostRecord) => void;
  onRemoveRecord: (id: string) => void;
  onIgnoreDormant: () => void;
}) {
  const isUncosted = profile.currentCost === null;
  const isIgnored = profile.status === 'ignored';

  // Local edit state for the inline cost cell
  const [editValue, setEditValue] = useState<string>(profile.currentCost?.toString() || '');
  const [editCurrency, setEditCurrency] = useState<CostCurrency>(profile.currentCurrency || 'USD');

  const commitCost = () => {
    const num = parseFloat(editValue);
    if (!isNaN(num) && num > 0) {
      onSetCost(profile.sku, num, editCurrency, 'all');
    }
  };

  const globalRecord = profile.costRecords.find((r) => r.marketplace === 'all' && !r.effectiveTo && !r.effectiveFrom);
  const sourceForBadge = globalRecord?.source || profile.costRecords[0]?.source;
  const SourceIcon = sourceForBadge ? SOURCE_LABELS[sourceForBadge].icon : null;

  return (
    <>
      <tr className={`group transition-colors ${
        isUncosted ? 'bg-rose-50/30 hover:bg-rose-50/60' :
        isIgnored ? 'bg-gray-50/30 opacity-60' :
        'hover:bg-gray-50/40'
      }`}>
        <td className="px-3 py-2 align-top">
          <button onClick={onToggleExpand} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </td>
        <td className="px-3 py-2 align-top">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-semibold text-gray-800">{profile.sku}</span>
            {isUncosted && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                NEEDS COST
              </span>
            )}
            {profile.hasMarketplaceOverrides && (
              <span title="Has marketplace overrides" className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Globe className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 block truncate max-w-[260px]">{profile.title}</span>
          <span className="text-[9px] text-gray-300 font-mono">{profile.asin}</span>
        </td>
        <td className="px-3 py-2 align-top">
          <span className="text-[10px] text-gray-600">{profile.marketplaces.includes('all') ? 'All' : profile.marketplaces.join(', ')}</span>
        </td>
        <td className="px-3 py-2 align-top text-right">
          <span className="text-[11px] font-medium text-gray-900">{fc(profile.revenue90d, cur)}</span>
        </td>
        <td className="px-3 py-2 align-top text-right">
          <span className="text-[11px] text-gray-600">{profile.units90d.toLocaleString()}</span>
        </td>
        <td className="px-3 py-2 align-top text-right">
          <div className="text-[10px] text-gray-600 leading-tight">
            <div>{profile.fbaInventory.toLocaleString()} on hand</div>
            {profile.inboundUnits > 0 && (
              <div className="text-amber-600 font-medium">+{profile.inboundUnits.toLocaleString()} inbound</div>
            )}
          </div>
        </td>
        <td className="px-3 py-2 align-top">
          <div className="flex items-center justify-end gap-1">
            <input
              type="number"
              step="0.01"
              min="0"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitCost}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder={isUncosted ? 'Unknown' : '0.00'}
              className={`w-[80px] px-2 py-1 text-[11px] text-right font-semibold rounded border outline-none focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 ${
                isUncosted
                  ? 'bg-white border-rose-300 placeholder:text-rose-400 placeholder:font-bold text-gray-900'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
            {SourceIcon && !isUncosted && (
              <span title={SOURCE_LABELS[sourceForBadge!].label} className="text-gray-400">
                <SourceIcon className="w-3 h-3" />
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2 align-top">
          <select
            value={editCurrency}
            onChange={(e) => {
              const next = e.target.value as CostCurrency;
              setEditCurrency(next);
              const num = parseFloat(editValue);
              if (!isNaN(num) && num > 0) onSetCost(profile.sku, num, next, 'all');
            }}
            className="border border-gray-200 rounded-md bg-white text-gray-700 px-1 py-0.5 text-[10px] font-medium focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none w-[58px]"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>
        <td className="px-3 py-2 align-top">
          <StatusBadge status={profile.status} />
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/40">
          <td colSpan={9} className="px-0 py-0">
            <SkuCostProfileDrawer
              profile={profile}
              cur={cur}
              onAddRecord={onAddRecord}
              onRemoveRecord={onRemoveRecord}
              onIgnoreDormant={onIgnoreDormant}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SkuCoverageStatus }) {
  const map: Record<SkuCoverageStatus, { label: string; className: string }> = {
    'costed':                { label: 'Complete',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'needs-cost-active':     { label: 'Missing',     className: 'bg-rose-50 text-rose-700 border-rose-200' },
    'needs-cost-inventory':  { label: 'No cost set', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    'needs-cost-inbound':    { label: 'Inbound',     className: 'bg-amber-50 text-amber-700 border-amber-200' },
    'dormant':               { label: 'Dormant',     className: 'bg-gray-50 text-gray-600 border-gray-200' },
    'ignored':               { label: 'Ignored',     className: 'bg-gray-50 text-gray-400 border-gray-200' },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${m.className}`}>
      {m.label}
    </span>
  );
}

// ─── SKU Cost Profile Drawer (inline expansion) ──────────────────────────

function SkuCostProfileDrawer({
  profile, cur, onAddRecord, onRemoveRecord, onIgnoreDormant,
}: {
  profile: SkuCostProfile;
  cur: 'EUR' | 'USD' | 'GBP';
  onAddRecord: (record: CostRecord) => void;
  onRemoveRecord: (id: string) => void;
  onIgnoreDormant: () => void;
}) {
  const [tab, setTab] = useState<'cost' | 'timeline' | 'overrides' | 'advanced'>('cost');
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [showAddChange, setShowAddChange] = useState(false);
  const [advancedEnabled, setAdvancedEnabled] = useState(false);

  const overrides = profile.costRecords.filter((r) => r.marketplace !== 'all');
  const timeline = profile.costRecords
    .filter((r) => r.marketplace === 'all')
    .sort((a, b) => (a.effectiveFrom || '0000-00-00').localeCompare(b.effectiveFrom || '0000-00-00'));

  return (
    <div className="px-6 py-4 border-y border-gray-100">
      {/* Drawer header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{profile.title}</span>
            <span className="text-[11px] font-mono text-gray-500">{profile.sku}</span>
            <span className="text-[10px] text-gray-400 font-mono">{profile.asin}</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            Sells in: {profile.marketplaces.includes('all') ? 'All' : profile.marketplaces.join(', ')} ·
            {' '}{profile.units90d.toLocaleString()} units in last 90d ·
            {' '}{fc(profile.revenue90d, cur)} revenue
          </div>
        </div>
        {profile.status === 'dormant' && (
          <button
            onClick={onIgnoreDormant}
            className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
          >
            Ignore dormant SKU
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-gray-200 mb-3">
        {([
          { key: 'cost' as const,      label: 'Current cost' },
          { key: 'timeline' as const,  label: `Cost timeline (${timeline.length})` },
          { key: 'overrides' as const, label: `Marketplace overrides (${overrides.length})` },
          { key: 'advanced' as const,  label: 'Advanced batches' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-cx-500 text-cx-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cost' && (
        <CurrentCostPanel profile={profile} cur={cur} onAddRecord={onAddRecord} onRemoveRecord={onRemoveRecord} />
      )}

      {tab === 'timeline' && (
        <CostTimelinePanel
          profile={profile}
          cur={cur}
          timeline={timeline}
          showAddChange={showAddChange}
          setShowAddChange={setShowAddChange}
          onAddRecord={onAddRecord}
          onRemoveRecord={onRemoveRecord}
        />
      )}

      {tab === 'overrides' && (
        <MarketplaceOverridesPanel
          profile={profile}
          overrides={overrides}
          showAdd={showAddOverride}
          setShowAdd={setShowAddOverride}
          onAddRecord={onAddRecord}
          onRemoveRecord={onRemoveRecord}
        />
      )}

      {tab === 'advanced' && (
        <AdvancedBatchesPanel
          profile={profile}
          enabled={advancedEnabled}
          onEnable={() => setAdvancedEnabled(true)}
        />
      )}
    </div>
  );
}

// ─── Drawer panels ────────────────────────────────────────────────────────

function CurrentCostPanel({
  profile, cur, onAddRecord, onRemoveRecord,
}: {
  profile: SkuCostProfile;
  cur: 'EUR' | 'USD' | 'GBP';
  onAddRecord: (record: CostRecord) => void;
  onRemoveRecord: (id: string) => void;
}) {
  const globalRecord = profile.costRecords.find((r) => r.marketplace === 'all' && !r.effectiveTo);
  const [draft, setDraft] = useState({
    cost: globalRecord?.landedCost.toString() || '',
    currency: (globalRecord?.currency || 'USD') as CostCurrency,
    marketplace: 'all' as CostMarketplace,
  });

  const save = () => {
    const num = parseFloat(draft.cost);
    if (isNaN(num) || num <= 0) return;
    if (globalRecord) onRemoveRecord(globalRecord.id);
    onAddRecord({
      id: `CR-${Date.now()}`,
      sku: profile.sku,
      marketplace: draft.marketplace,
      landedCost: num,
      currency: draft.currency,
      effectiveFrom: null,
      effectiveTo: null,
      source: 'manual',
      confidence: 'high',
      createdAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Landed cost</div>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-[9px] font-semibold text-gray-500 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={draft.cost}
              onChange={(e) => setDraft({ ...draft, cost: e.target.value })}
              placeholder="0.00"
              className="w-[100px] px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400"
            />
          </div>
          <div>
            <label className="block text-[9px] font-semibold text-gray-500 mb-1">Currency</label>
            <select
              value={draft.currency}
              onChange={(e) => setDraft({ ...draft, currency: e.target.value as CostCurrency })}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-semibold text-gray-500 mb-1">Applies to</label>
            <select
              value={draft.marketplace}
              onChange={(e) => setDraft({ ...draft, marketplace: e.target.value as CostMarketplace })}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400"
            >
              {MARKETPLACES.map((m) => <option key={m} value={m}>{m === 'all' ? 'All marketplaces' : m}</option>)}
            </select>
          </div>
          <button
            onClick={save}
            className="px-3 py-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-md"
          >
            Save
          </button>
        </div>
        {globalRecord && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
            Source: <span className="font-semibold text-gray-600">{SOURCE_LABELS[globalRecord.source].label}</span>
            {' · '}Last edited: <span className="font-semibold text-gray-600">{globalRecord.createdAt}</span>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">What this means</div>
        {globalRecord ? (
          <div className="text-[11px] text-gray-700 space-y-1">
            <div><span className="font-mono font-semibold">{fc(globalRecord.landedCost, cur)}</span> {globalRecord.currency} per unit globally.</div>
            {profile.hasMarketplaceOverrides && (
              <div className="text-purple-700">Marketplace overrides apply for: {profile.costRecords.filter((r) => r.marketplace !== 'all').map((r) => r.marketplace).join(', ')}</div>
            )}
            <div className="text-gray-400">Profit & margin in dashboards use this cost.</div>
          </div>
        ) : (
          <div className="text-[11px] text-rose-700">
            Cost is unknown. Profit and margin for this SKU will display as <span className="font-semibold">Unknown</span> in dashboards.
          </div>
        )}
      </div>
    </div>
  );
}

function CostTimelinePanel({
  profile, cur, timeline, showAddChange, setShowAddChange, onAddRecord, onRemoveRecord,
}: {
  profile: SkuCostProfile;
  cur: 'EUR' | 'USD' | 'GBP';
  timeline: CostRecord[];
  showAddChange: boolean;
  setShowAddChange: (v: boolean) => void;
  onAddRecord: (record: CostRecord) => void;
  onRemoveRecord: (id: string) => void;
}) {
  const [draft, setDraft] = useState({
    cost: '',
    currency: 'USD' as CostCurrency,
    effectiveFrom: '',
  });

  const save = () => {
    const num = parseFloat(draft.cost);
    if (isNaN(num) || num <= 0 || !draft.effectiveFrom) return;
    // Close out the previous open-ended global record
    const open = timeline.find((r) => !r.effectiveTo);
    if (open) {
      onRemoveRecord(open.id);
      onAddRecord({ ...open, id: `CR-${Date.now() - 1}`, effectiveTo: draft.effectiveFrom });
    }
    onAddRecord({
      id: `CR-${Date.now()}`,
      sku: profile.sku,
      marketplace: 'all',
      landedCost: num,
      currency: draft.currency,
      effectiveFrom: draft.effectiveFrom,
      effectiveTo: null,
      source: 'manual',
      confidence: 'high',
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setDraft({ cost: '', currency: 'USD', effectiveFrom: '' });
    setShowAddChange(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Effective from</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Effective to</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">Landed cost</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Currency</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Source</th>
              <th className="px-3 py-1.5 w-[40px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {timeline.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-[11px] text-gray-400">No timeline entries yet.</td></tr>
            ) : (
              timeline.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-1.5 text-[11px] text-gray-700">{r.effectiveFrom || 'All time'}</td>
                  <td className="px-3 py-1.5 text-[11px] text-gray-500">{r.effectiveTo || '—'}</td>
                  <td className="px-3 py-1.5 text-[11px] font-semibold text-gray-900 text-right">{fc(r.landedCost, cur)}</td>
                  <td className="px-3 py-1.5 text-[10px] text-gray-500">{r.currency}</td>
                  <td className="px-3 py-1.5 text-[10px] text-gray-500">{SOURCE_LABELS[r.source].label}</td>
                  <td className="px-3 py-1.5">
                    <button onClick={() => onRemoveRecord(r.id)} className="text-gray-300 hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!showAddChange ? (
        <button
          onClick={() => setShowAddChange(true)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cx-600 hover:text-cx-700"
        >
          <Plus className="w-3 h-3" />
          Add cost change
        </button>
      ) : (
        <div className="mt-3 p-3 bg-white border border-cx-200 rounded-lg">
          <div className="text-[10px] font-semibold text-gray-700 mb-2">Add cost change</div>
          <div className="flex items-end gap-2.5">
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">New landed cost *</label>
              <input
                type="number"
                step="0.01"
                value={draft.cost}
                onChange={(e) => setDraft({ ...draft, cost: e.target.value })}
                placeholder="0.00"
                className="w-[100px] px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">Currency</label>
              <select
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value as CostCurrency })}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">Effective from *</label>
              <input
                type="date"
                value={draft.effectiveFrom}
                onChange={(e) => setDraft({ ...draft, effectiveFrom: e.target.value })}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
              />
            </div>
            <button onClick={save} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-md">
              Save change
            </button>
            <button onClick={() => setShowAddChange(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {draft.cost && draft.effectiveFrom && (
            <div className="mt-2 text-[10px] text-gray-500">
              Sales before {draft.effectiveFrom} use the previous cost. Sales from {draft.effectiveFrom} use {draft.cost} {draft.currency}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MarketplaceOverridesPanel({
  profile, overrides, showAdd, setShowAdd, onAddRecord, onRemoveRecord,
}: {
  profile: SkuCostProfile;
  overrides: CostRecord[];
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  onAddRecord: (record: CostRecord) => void;
  onRemoveRecord: (id: string) => void;
}) {
  const [draft, setDraft] = useState({
    marketplace: 'UK' as CostMarketplace,
    cost: '',
    currency: 'GBP' as CostCurrency,
    effectiveFrom: '',
    reason: '',
  });
  const globalRecord = profile.costRecords.find((r) => r.marketplace === 'all' && !r.effectiveTo);

  const save = () => {
    const num = parseFloat(draft.cost);
    if (isNaN(num) || num <= 0) return;
    onAddRecord({
      id: `CR-${Date.now()}`,
      sku: profile.sku,
      marketplace: draft.marketplace,
      landedCost: num,
      currency: draft.currency,
      effectiveFrom: draft.effectiveFrom || null,
      effectiveTo: null,
      source: 'manual',
      confidence: 'high',
      createdAt: new Date().toISOString().slice(0, 10),
      reason: draft.reason || undefined,
    });
    setDraft({ marketplace: 'UK', cost: '', currency: 'GBP', effectiveFrom: '', reason: '' });
    setShowAdd(false);
  };

  return (
    <div className="max-w-3xl space-y-3">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Marketplace</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">Landed cost</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Currency</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Effective from</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Reason</th>
              <th className="px-3 py-1.5 w-[40px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {overrides.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-[11px] text-gray-400">No marketplace overrides.</td></tr>
            ) : (
              overrides.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-1.5 text-[11px] text-gray-700 font-semibold">{MARKETPLACE_LABELS[r.marketplace]}</td>
                  <td className="px-3 py-1.5 text-[11px] font-semibold text-gray-900 text-right">{r.landedCost.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-[10px] text-gray-500">{r.currency}</td>
                  <td className="px-3 py-1.5 text-[10px] text-gray-500">{r.effectiveFrom || 'All time'}</td>
                  <td className="px-3 py-1.5 text-[10px] text-gray-500 truncate max-w-[160px]">{r.reason || '—'}</td>
                  <td className="px-3 py-1.5">
                    <button onClick={() => onRemoveRecord(r.id)} className="text-gray-300 hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-cx-600 hover:text-cx-700"
        >
          <Plus className="w-3 h-3" />
          Add marketplace override
        </button>
      ) : (
        <div className="p-3 bg-white border border-cx-200 rounded-lg space-y-2.5">
          <div className="text-[10px] font-semibold text-gray-700">Add marketplace override</div>
          <div className="text-[10px] text-gray-500">
            Default cost: <span className="font-semibold text-gray-700">{globalRecord ? `${globalRecord.landedCost.toFixed(2)} ${globalRecord.currency}` : 'Not set'}</span> globally.
          </div>
          <div className="flex items-end gap-2.5">
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">Marketplace</label>
              <select
                value={draft.marketplace}
                onChange={(e) => setDraft({ ...draft, marketplace: e.target.value as CostMarketplace })}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
              >
                {MARKETPLACES.filter((m) => m !== 'all').map((m) => (
                  <option key={m} value={m}>{MARKETPLACE_LABELS[m]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">Landed cost *</label>
              <input
                type="number"
                step="0.01"
                value={draft.cost}
                onChange={(e) => setDraft({ ...draft, cost: e.target.value })}
                placeholder="0.00"
                className="w-[90px] px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">Currency</label>
              <select
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value as CostCurrency })}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">Effective from</label>
              <input
                type="date"
                value={draft.effectiveFrom}
                onChange={(e) => setDraft({ ...draft, effectiveFrom: e.target.value })}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-semibold text-gray-500 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={draft.reason}
              onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              placeholder="Higher duties / shipping…"
              className="w-full max-w-md px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-md">
              Save override
            </button>
            <button onClick={() => setShowAdd(false)} className="text-[11px] font-semibold text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdvancedBatchesPanel({
  profile, enabled, onEnable,
}: {
  profile: SkuCostProfile;
  enabled: boolean;
  onEnable: () => void;
}) {
  if (!enabled) {
    return (
      <div className="max-w-2xl bg-white border border-dashed border-gray-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Layers className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-semibold text-gray-700">Batch tracking is off</div>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Most sellers use the simple cost timeline. Enable batch tracking only if you need inventory-layer accuracy
              (e.g. FIFO or LIFO consumption with quantity-aware cost layers).
            </p>
            <button
              onClick={onEnable}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cx-600 hover:text-cx-700"
            >
              <Plus className="w-3 h-3" />
              Enable batch tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <label className="block text-[9px] font-semibold text-gray-500 mb-1">Costing method</label>
          <select className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none">
            <option value="wac">Weighted average</option>
            <option value="fifo">FIFO</option>
            <option value="lifo">LIFO</option>
          </select>
        </div>
        <span className="text-[10px] text-gray-400 mt-4">Default for SKUs with batch tracking enabled.</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 text-[11px] text-gray-500">
        Batch entries from purchase orders or inbound shipments would appear here. Use the
        {' '}<button className="font-semibold text-cx-600 hover:text-cx-700">Paste / Upload</button>{' '}
        flow with quantity + received_date columns to populate batches for {profile.sku}.
      </div>
    </div>
  );
}
