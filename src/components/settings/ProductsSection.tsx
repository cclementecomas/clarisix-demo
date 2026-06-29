import { useCallback, useMemo, useState } from 'react';
import {
  Boxes, Search, Download, Upload, Check, AlertTriangle,
} from 'lucide-react';
import { inventoryData } from '../../data/inventoryData';
import {
  seedMappings, getMappingStatus, MAPPING_HEADERS,
} from '../../data/productMappingData';
import type { ProductMappingRow, MappingStatus } from '../../data/productMappingData';
import InfoTooltip from '../InfoTooltip';
import LastRefreshed from '../LastRefreshed';

type View = 'all' | 'needs' | 'mapped';

interface MappingDraft {
  brand: string;
  category: string;
  subcategory: string;
  tag: string;
}

export default function ProductsSection() {
  // Mapping state per SKU. Initialized from seedMappings; rest are empty.
  const [mappings, setMappings] = useState<Map<string, MappingDraft>>(() => {
    const m = new Map<string, MappingDraft>();
    for (const sku of inventoryData) {
      const seed = seedMappings.find((s) => s.sku === sku.sku);
      m.set(sku.sku, {
        brand: seed?.brand ?? '',
        category: seed?.category ?? '',
        subcategory: seed?.subcategory ?? '',
        tag: seed?.tag ?? '',
      });
    }
    return m;
  });

  const [view, setView] = useState<View>('needs');
  const [search, setSearch] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedRowCount, setUploadedRowCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Build joined rows
  const rows: ProductMappingRow[] = useMemo(() => {
    return inventoryData.map((sku) => {
      const m = mappings.get(sku.sku) || { brand: '', category: '', subcategory: '', tag: '' };
      return {
        sku: sku.sku,
        asin: sku.asin,
        title: sku.title,
        brand: m.brand,
        category: m.category,
        subcategory: m.subcategory,
        tag: m.tag,
        status: getMappingStatus(m),
      };
    });
  }, [mappings]);

  const stats = useMemo(() => {
    const total = rows.length;
    const complete = rows.filter((r) => r.status === 'complete').length;
    const partial = rows.filter((r) => r.status === 'partial').length;
    const needs = rows.filter((r) => r.status === 'needs-mapping').length;
    const mapped = complete + partial; // brand+category set
    const coverage = total > 0 ? Math.round((mapped / total) * 100) : 100;
    return { total, complete, partial, needs, mapped, coverage };
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (view === 'needs') list = list.filter((r) => r.status === 'needs-mapping');
    if (view === 'mapped') list = list.filter((r) => r.status !== 'needs-mapping');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.sku.toLowerCase().includes(q) || r.asin.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)
          || r.brand.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
      );
    }
    // Sort needs-mapping first inside the visible list
    return [...list].sort((a, b) => {
      const order: Record<MappingStatus, number> = { 'needs-mapping': 0, 'partial': 1, 'complete': 2 };
      return order[a.status] - order[b.status];
    });
  }, [rows, view, search]);

  const setField = useCallback((sku: string, field: keyof MappingDraft, value: string) => {
    setMappings((prev) => {
      const next = new Map(prev);
      const cur = next.get(sku) || { brand: '', category: '', subcategory: '', tag: '' };
      next.set(sku, { ...cur, [field]: value });
      return next;
    });
  }, []);

  // ─── Download / Upload ────────────────────────────────────────────────

  const downloadMapping = useCallback(() => {
    const csv = [
      MAPPING_HEADERS.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => [r.sku, r.asin, r.title, r.brand, r.category, r.subcategory, r.tag]
        .map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `clarisix-product-mapping-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const handleFile = useCallback((file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
      setUploadedRowCount(Math.max(0, lines.length - 1));
    };
    reader.readAsText(file);
  }, []);

  // ─── Header tier ──────────────────────────────────────────────────────

  const tier = stats.coverage >= 90 ? 'good' : stats.coverage >= 60 ? 'warn' : 'bad';
  const tierColors = {
    good: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'STRONG' },
    warn: { bar: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', badge: 'PARTIAL' },
    bad:  { bar: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200', badge: 'NEEDS WORK' },
  }[tier];

  const headline = stats.coverage >= 100
    ? 'All products are mapped.'
    : stats.coverage >= 60
      ? `${stats.needs} product${stats.needs !== 1 ? 's' : ''} still need brand or category — they fall back to "NA" in filters.`
      : `${stats.needs} unmapped product${stats.needs !== 1 ? 's' : ''} are bucketed under "NA" in your filters and breakdowns.`;

  return (
    <div className="space-y-4">
      {/* Coverage header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Boxes className="w-4 h-4 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Product Mapping</h2>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${tierColors.bg} ${tierColors.text} border ${tierColors.border}`}>
                {tierColors.badge}
              </span>
              <InfoTooltip content="Map every Amazon SKU to a Brand, Category, Subcategory, and Tag. SKUs without Brand or Category fall back to 'NA' in filters and breakdown tables — making your reports less useful. Aim for 100% mapping coverage." />
            </div>
            <p className="text-xs text-gray-500">{headline}</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-end gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${tierColors.text}`}>{stats.coverage}%</span>
                <span className="text-xs text-gray-400 font-medium">mapping coverage</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {stats.mapped} mapped of {stats.total} products
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full ${tierColors.bar} transition-all`}
                  style={{ width: `${Math.max(2, stats.coverage)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Complete</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{stats.complete}</div>
                  <div className="text-[10px] text-gray-400">Brand · Category · Sub · Tag all set</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Partial</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{stats.partial}</div>
                  <div className="text-[10px] text-gray-400">Brand + Category set; Sub or Tag empty</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Needs mapping</div>
                  <div className="text-sm font-semibold text-rose-700 mt-0.5">{stats.needs}</div>
                  <div className="text-[10px] text-gray-400">Brand or Category missing → "NA"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editable table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {([
                { k: 'needs' as const,  label: `Needs mapping (${stats.needs})` },
                { k: 'all' as const,    label: `All (${stats.total})` },
                { k: 'mapped' as const, label: `Mapped (${stats.mapped})` },
              ]).map((t) => (
                <button
                  key={t.k}
                  onClick={() => setView(t.k)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    view === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, ASIN, title, brand…"
                className="pl-8 pr-3 py-1.5 text-xs w-72 border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
              />
            </div>
            <span className="text-[10px] text-gray-400 ml-1">
              {filteredRows.length} {filteredRows.length === 1 ? 'product' : 'products'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadMapping}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download mapping
            </button>
            {!uploadedFileName ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer transition-colors ${
                  dragOver
                    ? 'text-cx-700 bg-cx-100 border border-cx-300'
                    : 'text-cx-700 bg-cx-50 border border-cx-200 hover:bg-cx-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload mapping CSV
                <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
              </label>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                <Check className="w-3.5 h-3.5" />
                <span className="truncate max-w-[180px]">{uploadedFileName}</span>
                <span className="text-emerald-600">({uploadedRowCount} rows)</span>
                <label className="ml-1 text-[10px] text-cx-600 hover:text-cx-700 cursor-pointer">
                  Replace
                  <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">SKU</th>
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">ASIN</th>
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Product Title</th>
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Brand <span className="text-rose-500">*</span></th>
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Category <span className="text-rose-500">*</span></th>
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Subcategory</th>
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Tag</th>
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRows.map((r) => (
                <ProductRow
                  key={r.sku}
                  row={r}
                  onChange={(field, val) => setField(r.sku, field, val)}
                />
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-gray-400">
                    {view === 'needs' ? 'All products are mapped — nothing to fix here.' : 'No products match this view.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2 border-t border-gray-100 flex items-center justify-end">
          <LastRefreshed offsetMinutes={4} />
        </div>
      </div>

      {/* Workflow note */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
        <p className="text-[11px] text-gray-600">
          <span className="font-semibold text-gray-700">Workflow:</span> Edit fields directly in the table above, or download the current mapping → edit in bulk in Excel/Sheets → upload the updated file.
          Changes aren't instant — they're queued for processing and roll out to filters and breakdown tables shortly after upload. <span className="font-semibold">Brand</span> and <span className="font-semibold">Category</span> are required — products missing either are bucketed as "NA" downstream.
        </p>
      </div>
    </div>
  );
}

// ─── Row component ───────────────────────────────────────────────────────

function ProductRow({
  row, onChange,
}: {
  row: ProductMappingRow;
  onChange: (field: 'brand' | 'category' | 'subcategory' | 'tag', value: string) => void;
}) {
  const isUnmapped = row.status === 'needs-mapping';
  const isPartial = row.status === 'partial';

  const inputClass = (val: string, required: boolean) => {
    const base = 'w-full px-2 py-1 text-[11px] border rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none';
    if (required && !val.trim()) return `${base} bg-white border-rose-300 placeholder:text-rose-400 placeholder:font-bold`;
    return `${base} bg-white border-gray-200`;
  };

  return (
    <tr className={`transition-colors ${
      isUnmapped ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-gray-50/40'
    }`}>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-semibold text-gray-800">{row.sku}</span>
          {isUnmapped && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
              NEEDS MAPPING
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 align-top">
        <span className="text-[10px] text-gray-500 font-mono">{row.asin}</span>
      </td>
      <td className="px-3 py-2 align-top">
        <span className="text-[11px] text-gray-700 block max-w-[260px] truncate" title={row.title}>{row.title}</span>
      </td>
      <td className="px-3 py-2 align-top w-[140px]">
        <input
          type="text"
          value={row.brand}
          onChange={(e) => onChange('brand', e.target.value)}
          placeholder={isUnmapped ? 'Required' : 'Brand'}
          className={inputClass(row.brand, true)}
        />
      </td>
      <td className="px-3 py-2 align-top w-[150px]">
        <input
          type="text"
          value={row.category}
          onChange={(e) => onChange('category', e.target.value)}
          placeholder={isUnmapped ? 'Required' : 'Category'}
          className={inputClass(row.category, true)}
        />
      </td>
      <td className="px-3 py-2 align-top w-[150px]">
        <input
          type="text"
          value={row.subcategory}
          onChange={(e) => onChange('subcategory', e.target.value)}
          placeholder="Optional"
          className={inputClass(row.subcategory, false)}
        />
      </td>
      <td className="px-3 py-2 align-top w-[120px]">
        <input
          type="text"
          value={row.tag}
          onChange={(e) => onChange('tag', e.target.value)}
          placeholder="Optional"
          className={inputClass(row.tag, false)}
        />
      </td>
      <td className="px-3 py-2 align-top">
        <StatusBadge status={row.status} isPartial={isPartial} />
      </td>
    </tr>
  );
}

function StatusBadge({ status, isPartial }: { status: MappingStatus; isPartial: boolean }) {
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Check className="w-2.5 h-2.5" />
        Complete
      </span>
    );
  }
  if (isPartial) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
      <AlertTriangle className="w-2.5 h-2.5" />
      Needs mapping
    </span>
  );
}
