import { useState, useMemo, useCallback } from 'react';
import {
  Upload, Download, Plus, ChevronDown, ChevronRight,
  Search, X, Check, Layers, AlertTriangle, DollarSign,
} from 'lucide-react';
import {
  purchaseOrders, demoCostLayers,
  getCurrentUnitCost, getInventoryValue,
} from '../data/cogsData';
import type { PurchaseOrder, CostLayer, CostingMethod } from '../data/cogsData';
import { inventoryData } from '../data/inventoryData';
import { useAccountSpecifics } from '../contexts/AccountSpecificsContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';

// ─── COGS Currencies (superset of display currencies — includes supplier currencies) ─

const COGS_CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'CAD', 'AUD'] as const;
type COGSCurrency = (typeof COGS_CURRENCIES)[number];

const MARKETPLACE_OPTIONS = ['All', 'US', 'UK', 'DE', 'FR', 'IT', 'ES'] as const;
type MarketplaceOption = (typeof MARKETPLACE_OPTIONS)[number];

// ─── CSV Templates ─────────────────────────────────────────────────────────

const SKU_COST_HEADERS = ['SKU', 'Marketplace', 'Landed Cost Per Unit', 'Currency'];
const PO_REQUIRED_HEADERS = ['Date', 'SKU', 'Quantity', 'Landed Cost Per Unit'];
const PO_OPTIONAL_HEADERS = ['Currency', 'Marketplace', 'PO Number', 'Supplier', 'Unit Cost', 'Freight Per Unit', 'Duties Per Unit', 'Other Per Unit'];

function downloadSkuCostTemplate() {
  const csv = SKU_COST_HEADERS.map((h) => `"${h}"`).join(',') + '\n'
    + '"SKU-01A","All",4.77,"USD"\n'
    + '"SKU-01A","DE",5.20,"EUR"\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clarisix-sku-costs-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPOTemplate() {
  const allHeaders = [...PO_REQUIRED_HEADERS, ...PO_OPTIONAL_HEADERS];
  const csv = allHeaders.map((h) => `"${h}"`).join(',') + '\n'
    + '"2026-01-15","SKU-01A",100,4.77,"USD","All","PO-0001","Supplier A",4.50,0.15,0.10,0.02\n'
    + '"2026-02-10","SKU-01A",200,4.85,"USD",,,,,,\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clarisix-cogs-po-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPOHistory(pos: PurchaseOrder[], baseCurrency: string) {
  const header = ['Date', 'SKU', 'Quantity', 'Landed Cost Per Unit', 'Currency', 'PO Number', 'Supplier'].map((h) => `"${h}"`).join(',');
  const rows = pos.map((po) =>
    [po.date, po.sku, po.qty, po.landedCost, baseCurrency, po.id, `"${po.supplier}"`].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toISOString().slice(0, 10);
  a.download = `clarisix-purchase-orders-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Method Labels ─────────────────────────────────────────────────────────

const METHOD_LABELS: Record<CostingMethod, { short: string; full: string }> = {
  fifo: { short: 'FIFO', full: 'First In, First Out' },
  lifo: { short: 'LIFO', full: 'Last In, First Out' },
  wac: { short: 'WAC', full: 'Weighted Average Cost' },
};

// ─── Currency Select (small inline) ────────────────────────────────────────

function CurrencySelect({ value, onChange, small }: { value: COGSCurrency; onChange: (v: COGSCurrency) => void; small?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as COGSCurrency)}
      className={`border border-gray-200 rounded-md bg-white text-gray-700 font-medium focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none ${
        small ? 'px-1 py-0.5 text-[10px] w-[52px]' : 'px-2 py-1.5 text-xs'
      }`}
    >
      {COGS_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

function MarketplaceSelect({ value, onChange, small }: { value: MarketplaceOption; onChange: (v: MarketplaceOption) => void; small?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MarketplaceOption)}
      className={`border border-gray-200 rounded-md bg-white text-gray-700 font-medium focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none ${
        small ? 'px-1 py-0.5 text-[10px] w-[44px]' : 'px-2 py-1.5 text-xs'
      }`}
    >
      {MARKETPLACE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

type Tab = 'skucosts' | 'upload' | 'layers';
type UploadMode = 'sku_costs' | 'purchase_orders';

export default function COGSManager() {
  const { cogsMethod } = useAccountSpecifics();
  const { currency } = useCurrency();
  const cur = currency as 'EUR' | 'USD' | 'GBP';
  const defaultCogsCurrency = (currency as COGSCurrency) || 'EUR';

  const [activeTab, setActiveTab] = useState<Tab>('skucosts');
  const [search, setSearch] = useState('');
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const [zeroCostsOnly, setZeroCostsOnly] = useState(false);

  // Upload state
  const [uploadMode, setUploadMode] = useState<UploadMode>('sku_costs');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string[][]>([]);
  const [uploadValid, setUploadValid] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Add batch inline form
  const [addBatchSku, setAddBatchSku] = useState<string | null>(null);
  const [batchForm, setBatchForm] = useState({ date: '', qty: '', landedCost: '', currency: defaultCogsCurrency as COGSCurrency, marketplace: 'All' as MarketplaceOption });
  const [batchAdvanced, setBatchAdvanced] = useState(false);
  const [batchAdvancedFields, setBatchAdvancedFields] = useState({ supplier: '', unitCost: '', freight: '', duties: '', other: '' });
  const [batchSubmitted, setBatchSubmitted] = useState(false);

  // ─── SKU Cost Table with marketplace + currency ────────────────────────

  interface SkuCostRow {
    sku: string;
    title: string;
    marketplace: MarketplaceOption;
    landedCost: number;
    currency: COGSCurrency;
    poCount: number;
    pos: PurchaseOrder[];
  }

  const skuCostData = useMemo(() => {
    // Build PO lookup
    const poMap = new Map<string, PurchaseOrder[]>();
    for (const po of purchaseOrders) {
      if (!poMap.has(po.sku)) poMap.set(po.sku, []);
      poMap.get(po.sku)!.push(po);
    }

    // Start from ALL SKUs in inventory (pulled from Amazon)
    const rows: SkuCostRow[] = inventoryData.map((item) => {
      const pos = poMap.get(item.sku) || [];
      const layers = demoCostLayers.get(item.sku);
      const cost = layers ? getCurrentUnitCost(cogsMethod, layers) : pos.length > 0 ? pos[pos.length - 1].landedCost : 0;
      return {
        sku: item.sku,
        title: item.title,
        marketplace: 'All',
        landedCost: cost > 0 ? cost : 0,
        currency: defaultCogsCurrency,
        poCount: pos.length,
        pos,
      };
    });

    return rows;
  }, [cogsMethod, defaultCogsCurrency]);

  const uncostCount = useMemo(() => skuCostData.filter((s) => s.landedCost === 0).length, [skuCostData]);

  const filteredSkuCosts = useMemo(() => {
    let data = skuCostData;
    if (zeroCostsOnly) data = data.filter((s) => s.landedCost === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((s) => s.sku.toLowerCase().includes(q) || s.title.toLowerCase().includes(q));
    }
    return data;
  }, [search, skuCostData, zeroCostsOnly]);

  // ─── SKU Summary for Cost Layers ───────────────────────────────────────

  const skuSummary = useMemo(() => {
    const skus = new Map<string, { sku: string; title: string; layers: CostLayer[] }>();
    for (const po of purchaseOrders) {
      if (!skus.has(po.sku)) {
        skus.set(po.sku, { sku: po.sku, title: po.title, layers: demoCostLayers.get(po.sku) || [] });
      }
    }
    return Array.from(skus.values());
  }, []);

  // ─── Upload Handlers ──────────────────────────────────────────────────

  function handleFile(file: File) {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
      const parsed = lines.map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));
      setUploadPreview(parsed.slice(0, 6));
      const header = parsed[0]?.map((h) => h.toLowerCase());
      if (uploadMode === 'sku_costs') {
        const expected = SKU_COST_HEADERS.slice(0, 3).map((h) => h.toLowerCase()); // First 3 required
        setUploadValid(parsed.length >= 2 && expected.every((h, i) => header?.[i] === h));
      } else {
        const expected = PO_REQUIRED_HEADERS.map((h) => h.toLowerCase());
        setUploadValid(parsed.length >= 2 && expected.every((h, i) => header?.[i] === h));
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function clearUpload() {
    setUploadedFile(null);
    setUploadPreview([]);
    setUploadValid(false);
  }

  // ─── Add Batch Handler ────────────────────────────────────────────────

  function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBatchSubmitted(true);
    setTimeout(() => { setBatchSubmitted(false); setAddBatchSku(null); }, 2000);
    setBatchForm({ date: '', qty: '', landedCost: '', currency: defaultCogsCurrency, marketplace: 'All' });
    setBatchAdvancedFields({ supplier: '', unitCost: '', freight: '', duties: '', other: '' });
    setBatchAdvanced(false);
  }

  // ─── Export ────────────────────────────────────────────────────────────

  const exportSkuCosts = useCallback(() => {
    const header = ['SKU', 'Product Title', 'Marketplace', 'Landed Cost Per Unit', 'Currency'].map((h) => `"${h}"`).join(',');
    const rows = filteredSkuCosts.map((s) =>
      [s.sku, `"${s.title.replace(/"/g, '""')}"`, s.marketplace, s.landedCost, s.currency].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `clarisix-sku-costs-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSkuCosts]);

  // ─── Tab Config ────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'skucosts', label: 'SKU Costs', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { key: 'upload', label: 'CSV Upload', icon: <Upload className="w-3.5 h-3.5" /> },
    { key: 'layers', label: 'Cost Layers', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">COGS Manager</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cx-100 text-cx-700 border border-cx-200">
              {METHOD_LABELS[cogsMethod].short}
            </span>
            <InfoTooltip content={`Currently using ${METHOD_LABELS[cogsMethod].full}. Change in Settings → Account → COGS Method.`} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Set landed costs per SKU or expand a row to view and add purchase order batches.
          </p>
        </div>
        <LastRefreshed />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total POs</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{purchaseOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Unique SKUs</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{demoCostLayers.size}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Inventory Value</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {fc(Array.from(demoCostLayers.values()).reduce((s, layers) => s + getInventoryValue(layers), 0), cur)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Avg Unit Cost ({METHOD_LABELS[cogsMethod].short})</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {(() => {
              const costs = Array.from(demoCostLayers.values()).map((l) => getCurrentUnitCost(cogsMethod, l)).filter((c) => c > 0);
              return costs.length > 0 ? fc(costs.reduce((s, c) => s + c, 0) / costs.length, cur) : '—';
            })()}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-cx-500 text-cx-600 bg-cx-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── SKU Costs Tab (merged with PO history) ────────────────── */}
        {activeTab === 'skucosts' && (
          <div>
            {/* Uncosted banner */}
            {uncostCount > 0 && (
              <div className="flex items-center justify-between px-5 py-2.5 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-800">
                    {uncostCount} product{uncostCount !== 1 ? 's' : ''} with no COGS assigned
                  </span>
                  <span className="text-[11px] text-amber-600">
                    — profitability data will be incomplete until costs are set.
                  </span>
                </div>
                <button
                  onClick={() => setZeroCostsOnly(!zeroCostsOnly)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                    zeroCostsOnly
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {zeroCostsOnly ? 'Show all' : 'Show uncosted only'}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search SKUs..."
                    className="pl-8 pr-3 py-1.5 text-xs w-56 border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
                  />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={zeroCostsOnly}
                    onChange={(e) => setZeroCostsOnly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-cx-500 focus:ring-cx-500/30"
                  />
                  <span className="text-[10px] font-medium text-gray-500">Only show products with 0 COGS</span>
                </label>
                <InfoTooltip content="All SKUs from your Amazon catalog are listed here. Set a landed cost per SKU and marketplace, or expand to add purchase order batches." />
              </div>
              <button
                onClick={exportSkuCosts}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {filteredSkuCosts.map((row) => {
                const isExpanded = expandedSku === row.sku;
                const isAddingBatch = addBatchSku === row.sku;
                const isUncosted = row.landedCost === 0;

                return (
                  <div key={row.sku}>
                    {/* SKU Row */}
                    <div className={`flex items-center transition-colors ${isUncosted ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-gray-50/50'}`}>
                      <button
                        onClick={() => setExpandedSku(isExpanded ? null : row.sku)}
                        className="flex items-center gap-2 px-4 py-2.5 text-left min-w-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-semibold text-gray-800">{row.sku}</span>
                            {isUncosted && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                NEEDS COST
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block truncate max-w-[220px]">{row.title}</span>
                        </div>
                      </button>

                      <div className="flex items-center gap-3 ml-auto pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase">Mkt</span>
                          <MarketplaceSelect value={row.marketplace} onChange={() => {}} small />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold min-w-[70px] justify-end ${
                            isUncosted
                              ? 'bg-amber-50 border border-amber-300 text-amber-600'
                              : 'bg-gray-50 border border-gray-200 text-gray-900'
                          }`}>
                            {isUncosted ? '—' : fc(row.landedCost, cur)}
                          </span>
                          <CurrencySelect value={row.currency} onChange={() => {}} small />
                        </div>
                        <span className="text-[10px] text-gray-400 w-[50px] text-right">{row.poCount} POs</span>
                      </div>
                    </div>

                    {/* Expanded: PO History + Add Batch */}
                    {isExpanded && (
                      <div className="px-5 pb-4 bg-gray-50/30">
                        <div className="ml-6">
                          {/* PO History Table */}
                          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                  {['Date', 'Qty', 'Landed Cost / Unit', 'Currency', 'Marketplace', 'Supplier', 'PO #'].map((h) => (
                                    <th key={h} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {row.pos.map((po) => (
                                  <tr key={po.id} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-1.5 text-[11px] text-gray-600">{po.date}</td>
                                    <td className="px-3 py-1.5 text-[11px] text-gray-700 text-right font-medium">{po.qty.toLocaleString()}</td>
                                    <td className="px-3 py-1.5 text-[11px] font-semibold text-gray-900 text-right">{fc(po.landedCost, cur)}</td>
                                    <td className="px-3 py-1.5 text-[10px] text-gray-500">{cur}</td>
                                    <td className="px-3 py-1.5 text-[10px] text-gray-500">All</td>
                                    <td className="px-3 py-1.5 text-[11px] text-gray-400">{po.supplier || '—'}</td>
                                    <td className="px-3 py-1.5 text-[11px] font-mono text-gray-400">{po.id}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Add Batch Form */}
                          {!isAddingBatch ? (
                            <button
                              onClick={() => setAddBatchSku(row.sku)}
                              className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-cx-600 hover:text-cx-700 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Add batch
                            </button>
                          ) : (
                            <form onSubmit={handleBatchSubmit} className="mt-3 space-y-2.5 p-3 bg-white rounded-lg border border-cx-200">
                              <div className="flex items-end gap-2.5">
                                <div className="w-[120px]">
                                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Date *</label>
                                  <input
                                    type="date"
                                    value={batchForm.date}
                                    onChange={(e) => setBatchForm({ ...batchForm, date: e.target.value })}
                                    required
                                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
                                  />
                                </div>
                                <div className="w-[80px]">
                                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Qty *</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={batchForm.qty}
                                    onChange={(e) => setBatchForm({ ...batchForm, qty: e.target.value })}
                                    placeholder="100"
                                    required
                                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
                                  />
                                </div>
                                <div className="w-[100px]">
                                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Landed Cost *</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={batchForm.landedCost}
                                    onChange={(e) => setBatchForm({ ...batchForm, landedCost: e.target.value })}
                                    placeholder="4.77"
                                    required
                                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
                                  />
                                </div>
                                <div className="w-[60px]">
                                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Currency</label>
                                  <CurrencySelect value={batchForm.currency} onChange={(v) => setBatchForm({ ...batchForm, currency: v })} small />
                                </div>
                                <div className="w-[52px]">
                                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Mkt</label>
                                  <MarketplaceSelect value={batchForm.marketplace} onChange={(v) => setBatchForm({ ...batchForm, marketplace: v })} small />
                                </div>
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-md transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setAddBatchSku(null); setBatchAdvanced(false); }}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                {batchSubmitted && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600">
                                    <Check className="w-3 h-3" /> Added
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setBatchAdvanced(!batchAdvanced)}
                                className="flex items-center gap-1 text-[9px] font-medium text-gray-400 hover:text-gray-600"
                              >
                                {batchAdvanced ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                Optional: cost breakdown & supplier
                              </button>

                              {batchAdvanced && (
                                <div className="flex items-end gap-2.5 pl-3 border-l-2 border-gray-200">
                                  <div className="w-[110px]">
                                    <label className="block text-[9px] font-semibold text-gray-400 mb-1">Supplier</label>
                                    <input type="text" value={batchAdvancedFields.supplier} onChange={(e) => setBatchAdvancedFields({ ...batchAdvancedFields, supplier: e.target.value })} placeholder="Name" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none" />
                                  </div>
                                  <div className="w-[80px]">
                                    <label className="block text-[9px] font-semibold text-gray-400 mb-1">Unit Cost</label>
                                    <input type="number" step="0.01" value={batchAdvancedFields.unitCost} onChange={(e) => setBatchAdvancedFields({ ...batchAdvancedFields, unitCost: e.target.value })} placeholder="4.50" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none" />
                                  </div>
                                  <div className="w-[70px]">
                                    <label className="block text-[9px] font-semibold text-gray-400 mb-1">Freight</label>
                                    <input type="number" step="0.01" value={batchAdvancedFields.freight} onChange={(e) => setBatchAdvancedFields({ ...batchAdvancedFields, freight: e.target.value })} placeholder="0.15" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none" />
                                  </div>
                                  <div className="w-[70px]">
                                    <label className="block text-[9px] font-semibold text-gray-400 mb-1">Duties</label>
                                    <input type="number" step="0.01" value={batchAdvancedFields.duties} onChange={(e) => setBatchAdvancedFields({ ...batchAdvancedFields, duties: e.target.value })} placeholder="0.10" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none" />
                                  </div>
                                  <div className="w-[70px]">
                                    <label className="block text-[9px] font-semibold text-gray-400 mb-1">Other</label>
                                    <input type="number" step="0.01" value={batchAdvancedFields.other} onChange={(e) => setBatchAdvancedFields({ ...batchAdvancedFields, other: e.target.value })} placeholder="0.02" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none" />
                                  </div>
                                </div>
                              )}
                            </form>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                {filteredSkuCosts.length} SKUs · Expand a row to see purchase history or add a batch
              </span>
              <span className="text-[10px] text-gray-400">
                Costs calculated using {METHOD_LABELS[cogsMethod].short}
              </span>
            </div>
          </div>
        )}

        {/* ─── CSV Upload Tab (mode toggle) ──────────────────────────── */}
        {activeTab === 'upload' && (
          <div className="px-6 py-5 space-y-5">
            {/* Mode toggle */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">What are you uploading?</p>
              <div className="flex items-center gap-2">
                {([
                  { key: 'sku_costs' as UploadMode, label: 'Default SKU Costs', desc: 'Set a flat landed cost per SKU' },
                  { key: 'purchase_orders' as UploadMode, label: 'Purchase Orders', desc: 'Batch-level cost history with dates' },
                ]).map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => { setUploadMode(mode.key); clearUpload(); }}
                    className={`flex-1 text-left p-3 rounded-lg border-2 transition-all ${
                      uploadMode === mode.key
                        ? 'border-cx-500 bg-cx-50/50 ring-1 ring-cx-500/20'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold block ${uploadMode === mode.key ? 'text-cx-600' : 'text-gray-700'}`}>
                      {mode.label}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1: Download template */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Step 1: Download Template</h3>
              <button
                onClick={uploadMode === 'sku_costs' ? downloadSkuCostTemplate : downloadPOTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download {uploadMode === 'sku_costs' ? 'SKU Costs' : 'Purchase Orders'} Template
              </button>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {uploadMode === 'sku_costs'
                  ? 'Only 3 columns required: SKU, Marketplace, and Landed Cost Per Unit. Currency column is optional (defaults to account currency).'
                  : 'Only 4 columns required: Date, SKU, Quantity, and Landed Cost Per Unit. Currency and other columns are optional.'
                }
              </p>
            </div>

            {/* Step 2: Upload */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Step 2: Upload Completed File</h3>
              {!uploadedFile ? (
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-cx-400 bg-cx-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                  }`}
                >
                  <Upload className={`w-7 h-7 mb-2 ${dragOver ? 'text-cx-500' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-gray-600">Drag and drop your CSV file here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    uploadValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {uploadValid ? <Check className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[300px]">{uploadedFile.name}</span>
                      <span className="text-xs text-gray-500">({uploadPreview.length > 1 ? uploadPreview.length - 1 : 0} rows)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadValid && (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-lg transition-colors">
                          <Check className="w-3 h-3" /> Import
                        </button>
                      )}
                      <button onClick={clearUpload} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {uploadPreview.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-gray-50">
                            {uploadPreview[0]?.map((h, i) => (
                              <th key={i} className="px-2.5 py-1.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {uploadPreview.slice(1).map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className="px-2.5 py-1.5 text-gray-700 whitespace-nowrap">{cell || <span className="text-gray-300">—</span>}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!uploadValid && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-amber-800">
                        <span className="font-semibold">Validation Error:</span>{' '}
                        {uploadMode === 'sku_costs'
                          ? 'The first 3 columns must be: SKU, Marketplace, Landed Cost Per Unit.'
                          : 'The first 4 columns must be: Date, SKU, Quantity, Landed Cost Per Unit.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-blue-800">
                  <span className="font-semibold">Required:</span>{' '}
                  {uploadMode === 'sku_costs' ? SKU_COST_HEADERS.slice(0, 3).join(', ') : PO_REQUIRED_HEADERS.join(', ')}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-600">Optional:</span>{' '}
                  {uploadMode === 'sku_costs'
                    ? 'Currency (defaults to account currency if empty).'
                    : `${PO_OPTIONAL_HEADERS.join(', ')}. Currency defaults to account currency if empty.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Cost Layers Tab ────────────────────────────────────────── */}
        {activeTab === 'layers' && (
          <div>
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">
                  Cost layers per SKU using {METHOD_LABELS[cogsMethod].full}
                </span>
                <InfoTooltip content="Cost layers represent individual purchase batches. The active costing method determines which layers are consumed first when units sell." />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cx-100 text-cx-700">
                {METHOD_LABELS[cogsMethod].short}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {skuSummary.map((sku) => {
                const isExpanded = expandedSku === sku.sku;
                const activeLayers = sku.layers.filter((l) => l.qtyRemaining > 0);
                const currentCost = getCurrentUnitCost(cogsMethod, sku.layers);
                const invValue = getInventoryValue(sku.layers);
                const totalRemaining = activeLayers.reduce((s, l) => s + l.qtyRemaining, 0);

                return (
                  <div key={sku.sku}>
                    <button
                      onClick={() => setExpandedSku(isExpanded ? null : sku.sku)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                        <div className="min-w-0">
                          <span className="text-[11px] font-mono font-semibold text-gray-800 block">{sku.sku}</span>
                          <span className="text-[10px] text-gray-400 block truncate max-w-[250px]">{sku.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase block">Layers</span>
                          <span className="text-[11px] font-medium text-gray-700">{activeLayers.length} active</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase block">Remaining</span>
                          <span className="text-[11px] font-medium text-gray-700">{totalRemaining.toLocaleString()} units</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase block">Unit Cost</span>
                          <span className="text-[11px] font-semibold text-gray-900">{fc(currentCost, cur)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase block">Inv Value</span>
                          <span className="text-[11px] font-semibold text-gray-900">{fc(invValue, cur)}</span>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4">
                        <div className="ml-7 overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-gray-50">
                                {['Date', 'Purchased', 'Remaining', 'Landed Cost / Unit', 'Layer Value', 'PO #'].map((h) => (
                                  <th key={h} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {sku.layers.map((layer, i) => {
                                const depleted = layer.qtyRemaining === 0;
                                return (
                                  <tr key={i} className={depleted ? 'opacity-40' : 'hover:bg-gray-50/50'}>
                                    <td className="px-3 py-1.5 text-[11px] text-gray-600">{layer.date}</td>
                                    <td className="px-3 py-1.5 text-[11px] text-gray-700 text-right">{layer.qtyPurchased.toLocaleString()}</td>
                                    <td className="px-3 py-1.5 text-[11px] text-right">
                                      <span className={`font-medium ${depleted ? 'text-gray-400' : 'text-gray-900'}`}>{layer.qtyRemaining.toLocaleString()}</span>
                                    </td>
                                    <td className="px-3 py-1.5 text-[11px] font-semibold text-gray-900 text-right">{fc(layer.landedCost, cur)}</td>
                                    <td className="px-3 py-1.5 text-[11px] text-right">
                                      <span className={`font-medium ${depleted ? 'text-gray-400' : 'text-gray-900'}`}>{fc(layer.qtyRemaining * layer.landedCost, cur)}</span>
                                    </td>
                                    <td className="px-3 py-1.5 text-[11px] font-mono text-gray-400">{layer.poId}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-400">
                {skuSummary.length} SKUs · Click a row to expand cost layers
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
