import { useState } from 'react';
import { useAccountSpecifics } from '../../contexts/AccountSpecificsContext';
import { Info, Download, Upload, Check, FileSpreadsheet, Calculator } from 'lucide-react';
import type { CostingMethod } from '../../data/cogsData';

const MAPPING_HEADERS = ['SKU', 'ASIN', 'Product Title', 'Brand', 'Category', 'Subcategory', 'Tag'];

const DEMO_MAPPING = [
  ['SKU-01A', 'B0DEMO001X', 'ZeroWater 10-Cup Pitcher', 'ZeroWater', 'Home & Kitchen', 'Water Filtration', 'Bestseller'],
  ['SKU-01B', 'B0DEMO002X', 'ZeroWater Replacement Filter 4-Pack', 'ZeroWater', 'Home & Kitchen', 'Water Filtration', 'Replenishable'],
  ['SKU-02A', 'B0DEMO003X', 'Zamst A2-DX Ankle Brace', 'Zamst', 'Sports & Outdoors', 'Braces & Supports', 'New'],
  ['SKU-03A', 'B0DEMO004X', 'BrightLife LED Desk Lamp', 'BrightLife', 'Electronics', 'Lighting', ''],
  ['SKU-04A', 'B0DEMO005X', 'ClearPath Travel Backpack', 'ClearPath', 'Accessories', 'Bags & Packs', 'Seasonal'],
];

function downloadCurrentMapping() {
  const rows = [MAPPING_HEADERS, ...DEMO_MAPPING];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toISOString().slice(0, 10);
  a.download = `clarisix-category-mapping-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AccountSection() {
  const {
    campaignNamingEnabled, setCampaignNamingEnabled,
    campaignNamingPattern, setCampaignNamingPattern,
    audienceLabelingEnabled, setAudienceLabelingEnabled,
    cogsMethod, setCogsMethod,
  } = useAccountSpecifics();

  const [mappingUploaded, setMappingUploaded] = useState(false);
  const [mappingFileName, setMappingFileName] = useState('');
  const [mappingRowCount, setMappingRowCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  function handleMappingFile(file: File) {
    setMappingFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
      setMappingRowCount(Math.max(0, lines.length - 1));
      setMappingUploaded(true);
    };
    reader.readAsText(file);
  }

  function handleMappingDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleMappingFile(file);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Account Specifics</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure account-level features that unlock additional reporting views across advertising modules.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Campaign Naming Convention */}
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900">Campaign Naming Convention</h3>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      When enabled, Clarisix parses your campaign names to extract Brand and Category dimensions, powering the "Performance by Brand" and "Performance by Category" tables in Advertising Overview.
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enable if your campaigns follow a structured naming pattern that encodes brand and category.
                </p>

                {campaignNamingEnabled && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Naming Pattern</label>
                      <input
                        type="text"
                        value={campaignNamingPattern}
                        onChange={(e) => setCampaignNamingPattern(e.target.value)}
                        className="w-full max-w-sm px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">Example</p>
                      <code className="text-xs text-gray-700 font-mono">XXXXXX|ZeroWater-Filters</code>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Where <span className="font-semibold text-gray-700">ZeroWater</span> = Brand and <span className="font-semibold text-gray-700">Filters</span> = Category
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-amber-800">
                        <span className="font-semibold">Note:</span> Brand names are case-sensitive. "Zamst" is not equal to "ZAMST".
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={campaignNamingEnabled}
                onClick={() => setCampaignNamingEnabled(!campaignNamingEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cx-500 focus:ring-offset-2 ${
                  campaignNamingEnabled ? 'bg-cx-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    campaignNamingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Audience Labeling */}
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900">Audience Labeling</h3>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      When enabled, Clarisix maps your audience segments (retargeting, in-market, lifestyle, etc.) to campaign performance data, unlocking the "Performance by Audience" table in Advertising Deep Dive.
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enable if your account has audience segments configured for Sponsored Display and DSP campaigns.
                </p>

                {audienceLabelingEnabled && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-green-800">
                      <span className="font-semibold">Active.</span> The "Performance by Audience" table in Advertising Deep Dive is now unlocked.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={audienceLabelingEnabled}
                onClick={() => setAudienceLabelingEnabled(!audienceLabelingEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cx-500 focus:ring-offset-2 ${
                  audienceLabelingEnabled ? 'bg-cx-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    audienceLabelingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Mapping */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Data Mapping</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage the SKU-to-brand/category mapping that powers your filters and breakdown tables.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Current mapping preview */}
          <div>
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Current Mapping</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-gray-50">
                    {MAPPING_HEADERS.map((h) => (
                      <th key={h} className="px-2.5 py-1.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {DEMO_MAPPING.map((row, i) => (
                    <tr key={i} className="text-gray-700">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2.5 py-1.5 whitespace-nowrap">{cell || <span className="text-gray-300">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">{DEMO_MAPPING.length} SKUs mapped</p>
          </div>

          {/* Download / Upload actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadCurrentMapping}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Current Mapping
            </button>

            {!mappingUploaded ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleMappingDrop}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                  dragOver
                    ? 'text-cx-700 bg-cx-50 border border-cx-300'
                    : 'text-cx-700 bg-cx-50 border border-cx-200 hover:bg-cx-100'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Updated Mapping
                <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMappingFile(f); }} className="hidden" />
              </label>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{mappingFileName}</span>
                <span className="text-green-600">({mappingRowCount} SKUs)</span>
                <label className="ml-1 text-xs text-cx-600 hover:text-cx-700 cursor-pointer font-medium">
                  Replace
                  <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMappingFile(f); }} className="hidden" />
                </label>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-[11px] text-gray-500">
              <span className="font-semibold text-gray-600">Workflow:</span> Download your current mapping → add or edit rows in Excel/Sheets → upload the updated file.
              Changes apply immediately to all filters and breakdown tables.
            </p>
          </div>
        </div>
      </div>

      {/* COGS Method */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Default costing method for batch tracking</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Most SKUs use a simple cost timeline (set a landed cost, change it when costs change). This setting only applies to SKUs where you've explicitly enabled batch tracking — useful when you need inventory-layer accuracy.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'fifo' as CostingMethod, label: 'FIFO', title: 'First In, First Out', desc: 'Oldest inventory costs are used first. Most common method and Amazon default.' },
              { key: 'lifo' as CostingMethod, label: 'LIFO', title: 'Last In, First Out', desc: 'Newest inventory costs are used first. Can reduce taxable income when costs are rising.' },
              { key: 'wac' as CostingMethod, label: 'WAC', title: 'Weighted Average Cost', desc: 'Blends all purchase costs into one average. Smooths out cost fluctuations.' },
            ]).map((m) => (
              <button
                key={m.key}
                onClick={() => setCogsMethod(m.key)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  cogsMethod === m.key
                    ? 'border-cx-500 bg-cx-50/50 ring-1 ring-cx-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold ${cogsMethod === m.key ? 'text-cx-600' : 'text-gray-700'}`}>
                    {m.label}
                  </span>
                  {cogsMethod === m.key && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-cx-500 text-white">Active</span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-700">{m.title}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <p className="text-[11px] text-blue-800">
              <span className="font-semibold">Note:</span> SKUs without batch tracking use their cost timeline directly — this method does not apply to them.
              Set landed costs and review missing COGS in <span className="font-semibold">Profitability → COGS</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
