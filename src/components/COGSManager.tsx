import { useState, useMemo, useCallback } from 'react';
import {
  Package, Upload, Download, Plus, ChevronDown, ChevronRight,
  Search, X, Check, Layers, AlertTriangle, DollarSign,
} from 'lucide-react';
import {
  purchaseOrders, demoCostLayers,
  getCurrentUnitCost, getInventoryValue,
} from '../data/cogsData';
import type { PurchaseOrder, CostLayer, CostingMethod } from '../data/cogsData';
import { useAccountSpecifics } from '../contexts/AccountSpecificsContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';

// ─── CSV Template (simplified) ─────────────────────────────────────────────

const REQUIRED_HEADERS = ['Date', 'SKU', 'Quantity', 'Landed Cost Per Unit'];
const OPTIONAL_HEADERS = ['PO Number', 'Supplier', 'Unit Cost', 'Freight Per Unit', 'Duties Per Unit', 'Other Per Unit'];

function downloadTemplate() {
  const allHeaders = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
  const csv = allHeaders.map((h) => `"${h}"`).join(',') + '\n'
    + '"2026-01-15","SKU-01A",100,4.77,"PO-0001","Supplier A",4.50,0.15,0.10,0.02\n'
    + '"2026-02-10","SKU-01A",200,4.85,,,,,,\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clarisix-cogs-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPOHistory(pos: PurchaseOrder[]) {
  const header = ['Date', 'SKU', 'Quantity', 'Landed Cost Per Unit', 'PO Number', 'Supplier'].map((h) => `"${h}"`).join(',');
  const rows = pos.map((po) =>
    [po.date, po.sku, po.qty, po.landedCost, po.id, `"${po.supplier}"`].join(',')
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

// ─── Method Badge ──────────────────────────────────────────────────────────

const METHOD_LABELS: Record<CostingMethod, { short: string; full: string }> = {
  fifo: { short: 'FIFO', full: 'First In, First Out' },
  lifo: { short: 'LIFO', full: 'Last In, First Out' },
  wac: { short: 'WAC', full: 'Weighted Average Cost' },
};

// ─── Component ─────────────────────────────────────────────────────────────

type Tab = 'skucosts' | 'orders' | 'upload' | 'layers';

export default function COGSManager() {
  const { cogsMethod } = useAccountSpecifics();
  const { currency } = useCurrency();
  const cur = currency as 'EUR' | 'USD' | 'GBP';

  const [activeTab, setActiveTab] = useState<Tab>('skucosts');
  const [search, setSearch] = useState('');
  const [expandedSku, setExpandedSku] = useState<string | null>(null);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string[][]>([]);
  const [uploadValid, setUploadValid] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Add PO inline form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ date: '', sku: '', qty: '', landedCost: '' });
  const [addFormExpanded, setAddFormExpanded] = useState(false);
  const [addFormAdvanced, setAddFormAdvanced] = useState({ supplier: '', unitCost: '', freight: '', duties: '', other: '' });
  const [addSubmitted, setAddSubmitted] = useState(false);

  // ─── SKU Cost Table ────────────────────────────────────────────────────

  const skuCostTable = useMemo(() => {
    const skus = new Map<string, { sku: string; title: string; landedCost: number }>();
    for (const po of purchaseOrders) {
      if (!skus.has(po.sku)) {
        skus.set(po.sku, { sku: po.sku, title: po.title, landedCost: po.landedCost });
      }
    }
    // Override with method-aware current cost from layers
    for (const [sku, entry] of skus) {
      const layers = demoCostLayers.get(sku);
      if (layers) {
        const cost = getCurrentUnitCost(cogsMethod, layers);
        if (cost > 0) entry.landedCost = cost;
      }
    }
    return Array.from(skus.values());
  }, [cogsMethod]);

  const filteredSkuCosts = useMemo(() => {
    if (!search.trim()) return skuCostTable;
    const q = search.toLowerCase();
    return skuCostTable.filter(
      (s) => s.sku.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
    );
  }, [search, skuCostTable]);

  // ─── Filtered POs ──────────────────────────────────────────────────────

  const filteredPOs = useMemo(() => {
    if (!search.trim()) return purchaseOrders;
    const q = search.toLowerCase();
    return purchaseOrders.filter(
      (po) => po.sku.toLowerCase().includes(q) || po.supplier.toLowerCase().includes(q)
        || po.id.toLowerCase().includes(q)
    );
  }, [search]);

  // ─── SKU Summary for Cost Layers ───────────────────────────────────────

  const skuSummary = useMemo(() => {
    const skus = new Map<string, { sku: string; title: string; totalPOs: number; totalQty: number; layers: CostLayer[] }>();
    for (const po of purchaseOrders) {
      if (!skus.has(po.sku)) {
        skus.set(po.sku, {
          sku: po.sku, title: po.title, totalPOs: 0, totalQty: 0,
          layers: demoCostLayers.get(po.sku) || [],
        });
      }
      const entry = skus.get(po.sku)!;
      entry.totalPOs++;
      entry.totalQty += po.qty;
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
      // Validate: first 4 headers must match required columns
      const header = parsed[0]?.map((h) => h.toLowerCase());
      const expected = REQUIRED_HEADERS.map((h) => h.toLowerCase());
      setUploadValid(
        parsed.length >= 2 && expected.every((h, i) => header?.[i] === h)
      );
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

  // ─── Add PO Handler ───────────────────────────────────────────────────

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddSubmitted(true);
    setTimeout(() => { setAddSubmitted(false); setShowAddForm(false); }, 2000);
    setAddForm({ date: '', sku: '', qty: '', landedCost: '' });
    setAddFormAdvanced({ supplier: '', unitCost: '', freight: '', duties: '', other: '' });
    setAddFormExpanded(false);
  }

  // ─── Export ────────────────────────────────────────────────────────────

  const exportPOs = useCallback(() => downloadPOHistory(filteredPOs), [filteredPOs]);

  const exportSkuCosts = useCallback(() => {
    const header = ['SKU', 'Product Title', 'Landed Cost Per Unit'].map((h) => `"${h}"`).join(',');
    const rows = filteredSkuCosts.map((s) =>
      [s.sku, `"${s.title.replace(/"/g, '""')}"`, s.landedCost].join(',')
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
    { key: 'orders', label: 'Purchase Orders', icon: <Package className="w-3.5 h-3.5" /> },
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
            Set landed costs per SKU or log purchase orders for batch-level tracking.
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

        {/* ─── SKU Costs Tab (primary, simple) ───────────────────────── */}
        {activeTab === 'skucosts' && (
          <div>
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
                <InfoTooltip content="Set a default landed cost per SKU. For batch-level tracking with different costs per shipment, use the Purchase Orders tab instead." />
              </div>
              <button
                onClick={exportSkuCosts}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 w-[140px]">SKU</th>
                    <th className="px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Product Title</th>
                    <th className="px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right w-[160px]">Landed Cost / Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSkuCosts.map((s) => (
                    <tr key={s.sku} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-mono font-semibold text-gray-800">{s.sku}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] text-gray-600 truncate block max-w-[400px]">{s.title}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-semibold text-gray-900 min-w-[80px] justify-end">
                          {fc(s.landedCost, cur)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                {filteredSkuCosts.length} SKUs
              </span>
              <span className="text-[10px] text-gray-400">
                Costs derived from purchase order history using {METHOD_LABELS[cogsMethod].short}
              </span>
            </div>
          </div>
        )}

        {/* ─── Purchase Orders Tab (simplified) ──────────────────────── */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search POs, SKUs..."
                    className="pl-8 pr-3 py-1.5 text-xs w-56 border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
                  />
                </div>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-cx-600 hover:text-cx-700 bg-cx-50 hover:bg-cx-100 px-2.5 py-1.5 rounded-md transition-colors border border-cx-200"
                  >
                    <Plus className="w-3 h-3" />
                    Add PO
                  </button>
                )}
              </div>
              <button
                onClick={exportPOs}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </div>

            {/* Inline Add PO Form */}
            {showAddForm && (
              <div className="px-5 py-4 border-b border-gray-100 bg-cx-50/20">
                <form onSubmit={handleAddSubmit} className="space-y-3">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 max-w-[140px]">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Date *</label>
                      <input
                        type="date"
                        value={addForm.date}
                        onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                        required
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                      />
                    </div>
                    <div className="flex-1 max-w-[120px]">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">SKU *</label>
                      <input
                        type="text"
                        value={addForm.sku}
                        onChange={(e) => setAddForm({ ...addForm, sku: e.target.value })}
                        placeholder="SKU-01A"
                        required
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                      />
                    </div>
                    <div className="flex-1 max-w-[90px]">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Qty *</label>
                      <input
                        type="number"
                        min="1"
                        value={addForm.qty}
                        onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })}
                        placeholder="100"
                        required
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                      />
                    </div>
                    <div className="flex-1 max-w-[120px]">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Landed Cost / Unit *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={addForm.landedCost}
                        onChange={(e) => setAddForm({ ...addForm, landedCost: e.target.value })}
                        placeholder="4.77"
                        required
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setAddFormExpanded(false); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {addSubmitted && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <Check className="w-3.5 h-3.5" />
                        Added
                      </span>
                    )}
                  </div>

                  {/* Optional advanced fields */}
                  <button
                    type="button"
                    onClick={() => setAddFormExpanded(!addFormExpanded)}
                    className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {addFormExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Optional: cost breakdown & supplier
                  </button>

                  {addFormExpanded && (
                    <div className="flex items-end gap-3 pl-4 border-l-2 border-gray-200">
                      <div className="flex-1 max-w-[130px]">
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Supplier</label>
                        <input
                          type="text"
                          value={addFormAdvanced.supplier}
                          onChange={(e) => setAddFormAdvanced({ ...addFormAdvanced, supplier: e.target.value })}
                          placeholder="Supplier name"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                        />
                      </div>
                      <div className="flex-1 max-w-[100px]">
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Unit Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          value={addFormAdvanced.unitCost}
                          onChange={(e) => setAddFormAdvanced({ ...addFormAdvanced, unitCost: e.target.value })}
                          placeholder="4.50"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                        />
                      </div>
                      <div className="flex-1 max-w-[90px]">
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Freight</label>
                        <input
                          type="number"
                          step="0.01"
                          value={addFormAdvanced.freight}
                          onChange={(e) => setAddFormAdvanced({ ...addFormAdvanced, freight: e.target.value })}
                          placeholder="0.15"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                        />
                      </div>
                      <div className="flex-1 max-w-[90px]">
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Duties</label>
                        <input
                          type="number"
                          step="0.01"
                          value={addFormAdvanced.duties}
                          onChange={(e) => setAddFormAdvanced({ ...addFormAdvanced, duties: e.target.value })}
                          placeholder="0.10"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                        />
                      </div>
                      <div className="flex-1 max-w-[90px]">
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Other</label>
                        <input
                          type="number"
                          step="0.01"
                          value={addFormAdvanced.other}
                          onChange={(e) => setAddFormAdvanced({ ...addFormAdvanced, other: e.target.value })}
                          placeholder="0.02"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white"
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Date', 'SKU', 'Qty', 'Landed Cost / Unit', 'PO #', 'Supplier'].map((h) => (
                      <th key={h} className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPOs.slice(0, 50).map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-[11px] text-gray-600">{po.date}</td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] font-mono font-semibold text-gray-800">{po.sku}</span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-700 text-right font-medium">{po.qty.toLocaleString()}</td>
                      <td className="px-3 py-2 text-[11px] font-semibold text-gray-900 text-right">{fc(po.landedCost, cur)}</td>
                      <td className="px-3 py-2 text-[11px] font-mono text-gray-400">{po.id}</td>
                      <td className="px-3 py-2 text-[11px] text-gray-400">{po.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                Showing {Math.min(50, filteredPOs.length)} of {filteredPOs.length} purchase orders
              </span>
              <span className="text-[10px] text-gray-400">
                Sorted by date
              </span>
            </div>
          </div>
        )}

        {/* ─── CSV Upload Tab (simplified) ────────────────────────────── */}
        {activeTab === 'upload' && (
          <div className="px-6 py-5 space-y-5">
            {/* Step 1: Download template */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Step 1: Download Template</h3>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download CSV Template
              </button>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Only 4 columns required: Date, SKU, Quantity, and Landed Cost Per Unit.
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
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-cx-400 bg-cx-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                  }`}
                >
                  <Upload className={`w-8 h-8 mb-2 ${dragOver ? 'text-cx-500' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-gray-600">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    uploadValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {uploadValid ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[300px]">{uploadedFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({uploadPreview.length > 1 ? uploadPreview.length - 1 : 0} rows)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadValid && (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cx-500 hover:bg-cx-600 rounded-lg transition-colors">
                          <Check className="w-3 h-3" />
                          Import
                        </button>
                      )}
                      <button onClick={clearUpload} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
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
                        <span className="font-semibold">Validation Error:</span> The first 4 columns must be: Date, SKU, Quantity, Landed Cost Per Unit.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-blue-800">
                  <span className="font-semibold">Required:</span> {REQUIRED_HEADERS.join(', ')}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-600">Optional:</span> {OPTIONAL_HEADERS.join(', ')}.
                  These columns are for detailed cost breakdown tracking — leave empty if you only have the total landed cost.
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
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )}
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
                                      <span className={`font-medium ${depleted ? 'text-gray-400' : 'text-gray-900'}`}>
                                        {layer.qtyRemaining.toLocaleString()}
                                      </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-[11px] font-semibold text-gray-900 text-right">{fc(layer.landedCost, cur)}</td>
                                    <td className="px-3 py-1.5 text-[11px] text-right">
                                      <span className={`font-medium ${depleted ? 'text-gray-400' : 'text-gray-900'}`}>
                                        {fc(layer.qtyRemaining * layer.landedCost, cur)}
                                      </span>
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
