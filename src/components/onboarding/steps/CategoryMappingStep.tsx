import { useState } from 'react';
import { Download, Upload, Boxes, Check, Sparkles, ChevronDown } from 'lucide-react';
import { DISCOVERED_ACTIVE_PRODUCTS as DETECTED_TOTAL } from '../../../data/connectionsData';

const TEMPLATE_HEADERS = ['SKU', 'ASIN', 'Product Title', 'Brand', 'Category', 'Subcategory', 'Tag'];
const CATEGORY_OPTIONS = ['Health & Household', 'Beauty & Personal Care', 'Home & Kitchen', 'Sports & Outdoors', 'Grocery', 'Baby', 'Other'];

interface CatalogRow { sku: string; asin: string; title: string; brand: string; category: string; auto: boolean; }
const SEED: CatalogRow[] = [
  { sku: 'GUM-SP-ADV-S', asin: 'B0DEMOG201', title: 'GUM Soft-Picks Advanced (Size S)',        brand: 'GUM', category: 'Health & Household', auto: true },
  { sku: 'GUM-SP-PRO',   asin: 'B0DCBQC3JX', title: 'GUM Soft-Picks Pro Interdental Cleaners',  brand: 'GUM', category: 'Health & Household', auto: true },
  { sku: 'GUM-IDB-TRAV', asin: 'B0DEMOG203', title: 'GUM Trav-Ler Interdental Brushes',         brand: 'GUM', category: 'Health & Household', auto: true },
  { sku: 'GUM-ORTHO',    asin: 'B0DEMOG204', title: 'GUM Ortho Interdental Brushes',            brand: 'GUM', category: 'Health & Household', auto: true },
  { sku: 'GUM-FLOSS-EZ', asin: 'B0DEMOG210', title: 'GUM Eez-Thru Floss Threaders',             brand: '',    category: '',                  auto: false },
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, ...SEED.map((r) => [r.sku, r.asin, r.title, r.brand, r.category, '', ''])];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'clarisix-category-mapping.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function CategoryMappingStep() {
  const [rows, setRows] = useState<CatalogRow[]>(SEED);
  const [showCsv, setShowCsv] = useState(false);
  const [uploaded, setUploaded] = useState<{ name: string; count: number } | null>(null);

  const autoMapped = DETECTED_TOTAL - 24; // 24 need a human touch
  const update = (i: number, patch: Partial<CatalogRow>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch, auto: false } : row)));

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
      setUploaded({ name: file.name, count: Math.max(0, lines.length - 1) });
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cx-50 mb-3">
          <Boxes className="w-6 h-6 text-cx-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Map your catalog</h2>
        <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
          We pulled your live catalog from Amazon and auto-suggested a brand and category for each SKU. Review the suggestions below — this powers the filters and breakdowns across every module.
        </p>
      </div>

      {/* detected banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cx-50 border border-cx-100">
        <Sparkles className="w-5 h-5 text-cx-600 flex-shrink-0" />
        <p className="text-[12px] text-gray-600">
          <span className="font-semibold text-gray-800">{DETECTED_TOTAL} SKUs detected</span> from your Catalog · <span className="font-semibold text-emerald-700">{autoMapped} auto-mapped</span>, {DETECTED_TOTAL - autoMapped} need a quick review.
        </p>
      </div>

      {/* editable preview */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2 text-left min-w-[220px]">Product</th>
                <th className="px-3 py-2 text-left w-40">Brand</th>
                <th className="px-3 py-2 text-left w-48">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, i) => {
                const needsReview = !r.brand || !r.category;
                return (
                  <tr key={r.sku} className={needsReview ? 'bg-amber-50/40' : ''}>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-900 truncate max-w-[240px]">{r.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{r.sku} · {r.asin}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="relative">
                        <input value={r.brand} onChange={(e) => update(i, { brand: e.target.value })} placeholder="Brand"
                          className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none" />
                        {r.auto && r.brand && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-cx-600 bg-cx-50 rounded px-1 py-0.5">AUTO</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <select value={r.category} onChange={(e) => update(i, { category: e.target.value })}
                        className={`w-full px-2 py-1.5 text-[12px] border rounded-md bg-white outline-none focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 ${r.category ? 'border-gray-200 text-gray-800' : 'border-amber-300 text-gray-400'}`}>
                        <option value="">Select…</option>
                        {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 bg-gray-50/60 border-t border-gray-100 text-[11px] text-gray-400">
          Showing 5 of {DETECTED_TOTAL} · the rest are auto-mapped and editable anytime in Settings → Data → Products.
        </div>
      </div>

      {/* CSV fallback */}
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <button onClick={() => setShowCsv((v) => !v)} className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] text-gray-600 hover:bg-gray-50">
          <span className="font-medium">Prefer a spreadsheet? Bulk-edit with CSV</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCsv ? 'rotate-180' : ''}`} />
        </button>
        {showCsv && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3 flex-wrap">
            <button onClick={downloadTemplate} className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-cx-700 bg-cx-50 border border-cx-200 rounded-lg hover:bg-cx-100">
              <Download className="w-4 h-4" /> Download catalog CSV
            </button>
            {uploaded ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-green-700"><Check className="w-4 h-4" /> {uploaded.name} · {uploaded.count} rows</span>
            ) : (
              <label className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4" /> Upload edited CSV
                <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
              </label>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        You can skip this — everything auto-maps and stays editable in <span className="font-medium text-gray-500">Settings → Data → Products</span>.
      </p>
    </div>
  );
}
