import { useState } from 'react';
import { Download, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';

const TEMPLATE_HEADERS = ['SKU', 'ASIN', 'Product Title', 'Brand', 'Category', 'Subcategory', 'Tag'];

const EXAMPLE_ROWS = [
  ['SKU-01A', 'B0DEMO001X', 'ZeroWater 10-Cup Pitcher', 'ZeroWater', 'Home & Kitchen', 'Water Filtration', 'Bestseller'],
  ['SKU-01B', 'B0DEMO002X', 'ZeroWater Replacement Filter 4-Pack', 'ZeroWater', 'Home & Kitchen', 'Water Filtration', 'Replenishable'],
  ['SKU-02A', 'B0DEMO003X', 'Zamst A2-DX Ankle Brace', 'Zamst', 'Sports & Outdoors', 'Braces & Supports', 'New'],
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, ...EXAMPLE_ROWS];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clarisix-category-mapping-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function CategoryMappingStep() {
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
      setRowCount(Math.max(0, lines.length - 1));
      setUploaded(true);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cx-50 mb-3">
          <FileSpreadsheet className="w-6 h-6 text-cx-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Category Mapping</h2>
        <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
          While we fetch your Amazon data, map your SKUs to brands, categories, and tags.
          This powers the filters and breakdowns across every Clarisix module.
        </p>
      </div>

      {/* Step 1 — Download */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cx-100 text-cx-700 text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Download the template</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pre-filled with your SKUs and ASINs once data loads. For now, use the example template.
              </p>
              <button
                onClick={downloadTemplate}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cx-700 bg-cx-50 border border-cx-200 rounded-lg hover:bg-cx-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 — Fill */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cx-100 text-cx-700 text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Fill in your mapping</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Open in Excel or Google Sheets. For each SKU, fill in Brand, Category, Subcategory, and optionally a Tag.
              </p>
              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-gray-50">
                      {TEMPLATE_HEADERS.map((h) => (
                        <th key={h} className="px-2.5 py-1.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {EXAMPLE_ROWS.map((row, i) => (
                      <tr key={i} className="text-gray-700">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2.5 py-1.5 whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">
                  Brand names are case-sensitive. "Zamst" and "ZAMST" will be treated as different brands.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3 — Upload */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cx-100 text-cx-700 text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Upload your mapping</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload the completed CSV. You can always update it later from Settings → Account.
              </p>

              {!uploaded ? (
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`mt-3 flex flex-col items-center gap-2 px-6 py-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    dragOver ? 'border-cx-400 bg-cx-50' : 'border-gray-200 hover:border-cx-300 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Drop your CSV here or <span className="text-cx-600 font-medium">browse</span>
                  </span>
                  <span className="text-[11px] text-gray-400">CSV files only</span>
                  <input type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
                </label>
              ) : (
                <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 truncate">{fileName}</p>
                    <p className="text-[11px] text-green-700">{rowCount} SKU{rowCount !== 1 ? 's' : ''} mapped</p>
                  </div>
                  <label className="text-xs font-medium text-cx-600 hover:text-cx-700 cursor-pointer transition-colors">
                    Replace
                    <input type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        You can skip this step and upload later from <span className="font-medium text-gray-500">Settings → Account</span>.
      </p>
    </div>
  );
}
