import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Download, CheckCircle2, Filter, Sheet } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import * as XLSX from 'xlsx';
import InfoTooltip from './InfoTooltip';
import { exportToGoogleSheets } from '../utils/exportSheets';
import LastRefreshed from './LastRefreshed';
import {
  contentProducts,
  contentKPIs,
  fieldMatchRates,
  caseBatches,
  marketplaceBreakdown,
  contentScoreTrend,
} from '../data/contentTrackerData';
import type { ContentProduct, FieldComparison } from '../data/contentTrackerData';

// ─── Palette ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  green: 'bg-green-50 border-green-200/60 text-green-900',
  yellow: 'bg-yellow-50 border-yellow-200/60 text-yellow-900',
  red: 'bg-red-50 border-red-200/60 text-red-900',
  neutral: 'bg-white border-gray-200 text-gray-900',
};

const LABEL_COLORS: Record<string, string> = {
  green: 'text-green-700/70',
  yellow: 'text-yellow-700/70',
  red: 'text-red-700/70',
  neutral: 'text-gray-500',
};

function matchColor(pct: number): string {
  if (pct >= 90) return '#16A34A';
  if (pct >= 70) return '#EAB308';
  return '#DC2626';
}

function matchBg(pct: number): string {
  if (pct >= 90) return 'bg-green-50 text-green-700';
  if (pct >= 70) return 'bg-yellow-50 text-yellow-700';
  return 'bg-red-50 text-red-700';
}

function matchRowBg(pct: number): string {
  if (pct >= 90) return '';
  if (pct >= 70) return 'bg-yellow-50/30';
  return 'bg-red-50/30';
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ContentTracker() {
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('All');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showCaseAssistant, setShowCaseAssistant] = useState(false);
  const [downloadedBatches, setDownloadedBatches] = useState<Set<number>>(new Set());
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(['Product Title', 'Description', 'Bullet Point 1', 'Bullet Point 2', 'Bullet Point 3', 'Bullet Point 4', 'Bullet Point 5'])
  );
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const marketplaces = useMemo(() => {
    const mps = [...new Set(contentProducts.map((p) => p.marketplace))].sort();
    return ['All', ...mps];
  }, []);

  const filteredProducts = useMemo(() => {
    let prods = contentProducts;
    if (marketplaceFilter !== 'All') {
      prods = prods.filter((p) => p.marketplace === marketplaceFilter);
    }
    return prods.sort((a, b) => a.overallMatch - b.overallMatch);
  }, [marketplaceFilter]);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        if (next.size > 1) next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const buildBatchRows = (batchNumber: number): (string | number)[][] => {
    const batch = caseBatches.find((b) => b.batchNumber === batchNumber);
    if (!batch) return [];

    const dataRows: Record<string, string | number>[] = [];
    batch.asins.forEach((item) => {
      const product = contentProducts.find((p) => p.asin === item.asin && p.marketplace === item.marketplace);
      if (!product) return;
      const row: Record<string, string | number> = {
        ASIN: product.asin,
        Marketplace: product.marketplace,
        'Overall Match %': product.overallMatch,
      };
      product.fields
        .filter((f) => selectedFields.has(f.field))
        .forEach((f) => {
          row[`${f.field} (Match %)`] = f.similarity;
          row[`${f.field} (Source)`] = f.sourceContent;
          row[`${f.field} (Amazon)`] = f.amazonContent;
        });
      dataRows.push(row);
    });
    if (dataRows.length === 0) return [];
    const headers = Object.keys(dataRows[0]);
    return [headers, ...dataRows.map((r) => headers.map((h) => r[h]))];
  };

  const handleSheetsBatch = async (batchNumber: number) => {
    const rows = buildBatchRows(batchNumber);
    if (rows.length === 0) return;
    const url = await exportToGoogleSheets(rows, `Content Batch ${batchNumber}`);
    if (url) setSheetsUrl(url);
  };

  const downloadBatch = (batchNumber: number) => {
    const batch = caseBatches.find((b) => b.batchNumber === batchNumber);
    if (!batch) return;

    const rows: Record<string, string | number>[] = [];
    batch.asins.forEach((item) => {
      const product = contentProducts.find((p) => p.asin === item.asin && p.marketplace === item.marketplace);
      if (!product) return;

      const row: Record<string, string | number> = {
        ASIN: product.asin,
        Marketplace: product.marketplace,
        'Overall Match %': product.overallMatch,
      };
      product.fields
        .filter((f) => selectedFields.has(f.field))
        .forEach((f) => {
          row[`${f.field} (Match %)`] = f.similarity;
          row[`${f.field} (Source)`] = f.sourceContent;
          row[`${f.field} (Amazon)`] = f.amazonContent;
        });
      rows.push(row);
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 20),
    }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Batch ${batchNumber}`);

    // Disclaimer row
    const disclaimerWs = XLSX.utils.aoa_to_sheet([['Generated with clarisix.com — Content Tracker']]);
    XLSX.utils.book_append_sheet(wb, disclaimerWs, 'Info');

    XLSX.writeFile(wb, `content-cases-batch-${batchNumber}.xlsx`);
    setDownloadedBatches((prev) => new Set(prev).add(batchNumber));
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        {contentKPIs.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border shadow-sm p-4 flex flex-col items-center ${STATUS_COLORS[kpi.color]}`}
          >
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${LABEL_COLORS[kpi.color]}`}>
              {kpi.label}
            </p>
            <span className="text-lg font-extrabold">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Content Score Trend */}
      <ContentScoreChart />

      {/* Field Match Rates + Marketplace Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FieldMatchRatesPanel />
        <MarketplacePanel />
      </div>

      {/* Toolbar: Filter + Field Selector + Case Assistant */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Marketplace filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={marketplaceFilter}
                onChange={(e) => setMarketplaceFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:border-cx-300 focus:border-cx-300 focus:outline-none transition-colors"
              >
                {marketplaces.map((mp) => (
                  <option key={mp} value={mp}>{mp === 'All' ? 'All Marketplaces' : mp}</option>
                ))}
              </select>
            </div>

            {/* Field selector */}
            <button
              onClick={() => setShowFieldSelector(!showFieldSelector)}
              className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-cx-300 hover:text-cx-700 transition-colors"
            >
              <span className="text-gray-600">Fields</span>
              <span className="text-[10px] font-semibold text-cx-500 bg-cx-50 px-1.5 py-0.5 rounded">
                {selectedFields.size}/{7}
              </span>
            </button>
          </div>

          {/* Open Cases Assistant */}
          <button
            onClick={() => setShowCaseAssistant(!showCaseAssistant)}
            className="flex items-center gap-2 text-xs font-semibold border border-gray-200 rounded-lg px-3 py-1.5 hover:border-cx-300 hover:text-cx-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Open Cases Assistant</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              {caseBatches.reduce((s, b) => s + b.asins.length, 0)} ASINs
            </span>
          </button>
        </div>

        {/* Expandable field selector */}
        {showFieldSelector && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            {['Product Title', 'Description', 'Bullet Point 1', 'Bullet Point 2', 'Bullet Point 3', 'Bullet Point 4', 'Bullet Point 5'].map((field) => (
              <label
                key={field}
                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedFields.has(field)
                    ? 'bg-cx-50 border-cx-300 text-cx-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.has(field)}
                  onChange={() => toggleField(field)}
                  className="sr-only"
                />
                <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                  selectedFields.has(field) ? 'bg-cx-500 border-cx-500' : 'border-gray-300'
                }`}>
                  {selectedFields.has(field) && (
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {field}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Case Assistant Panel */}
      {showCaseAssistant && (
        <CaseAssistantPanel
          downloadedBatches={downloadedBatches}
          onDownload={downloadBatch}
          onSheets={handleSheetsBatch}
          sheetsUrl={sheetsUrl}
          onCloseSheets={() => setSheetsUrl(null)}
        />
      )}

      {/* Comparison Table */}
      <ComparisonTable
        products={filteredProducts}
        expandedRows={expandedRows}
        onToggleRow={toggleRow}
        selectedFields={selectedFields}
      />

      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={12} />
      </div>
    </div>
  );
}

// ─── Content Score Trend ────────────────────────────────────────────────────

function ContentScoreChart() {
  const latest = contentScoreTrend[contentScoreTrend.length - 1];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-gray-900">Content Score Tracker</h3>
          <InfoTooltip />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-gray-400 uppercase font-bold">Current</span>
            <span className="text-sm font-extrabold text-cx-700">{latest.score}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 bg-gray-300 rounded" style={{ borderTop: '2px dashed #C7D0DA' }} />
            <span className="text-[9px] text-gray-400">90% Target</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={contentScoreTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="contentScoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0E5A8A" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0E5A8A" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#93A4B8' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#93A4B8' }} tickFormatter={(v) => `${v}%`} />
          <ReferenceLine y={90} stroke="#C7D0DA" strokeDasharray="4 4" label={{ value: '90%', position: 'right', fontSize: 10, fill: '#93A4B8' }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as typeof contentScoreTrend[0];
              return (
                <div className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl">
                  <p className="font-semibold mb-1">{label}</p>
                  <p>Overall Score: <span className="font-bold">{d.score}%</span></p>
                  <p className="text-green-300">Perfect: {d.perfectPct}%</p>
                  <p className="text-yellow-300">Partial: {d.partialPct}%</p>
                  <p className="text-red-300">Mismatch: {d.mismatchPct}%</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#0E5A8A"
            strokeWidth={2.5}
            fill="url(#contentScoreGrad)"
            dot={{ r: 3, fill: '#0E5A8A', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#0E5A8A', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Field Match Rates ──────────────────────────────────────────────────────

function FieldMatchRatesPanel() {
  const maxRate = Math.max(...fieldMatchRates.map((f) => f.rate));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Field Match Rates</h3>
        <InfoTooltip />
      </div>
      <div className="space-y-3">
        {fieldMatchRates.map((fm, idx) => {
          const opacity = 1 - idx * 0.08;
          return (
            <div key={fm.field}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-600">{fm.field}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">
                    <span className="text-green-600 font-medium">{fm.perfectCount}</span>
                    {' / '}
                    <span className="text-yellow-600 font-medium">{fm.partialCount}</span>
                    {' / '}
                    <span className="text-red-600 font-medium">{fm.mismatchCount}</span>
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: `rgba(14, 90, 138, ${Math.max(opacity, 0.5)})` }}>
                    {fm.rate}%
                  </span>
                </div>
              </div>
              <div className="h-5 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{ width: `${(fm.rate / maxRate) * 100}%`, backgroundColor: `rgba(14, 90, 138, ${opacity})` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Marketplace Breakdown ──────────────────────────────────────────────────

function MarketplacePanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Match Rate by Marketplace</h3>
        <InfoTooltip />
      </div>
      <div className="space-y-0">
        {/* Header */}
        <div className="flex items-center gap-3 pb-2 mb-2 border-b border-gray-100">
          <span className="text-[9px] text-gray-400 uppercase font-bold w-[40px]">MP</span>
          <div className="flex-1 text-[9px] text-gray-400 uppercase font-bold">Avg Match</div>
          <span className="text-[9px] text-gray-400 uppercase font-bold w-[50px] text-right">Products</span>
          <span className="text-[9px] text-gray-400 uppercase font-bold w-[50px] text-right">Perfect</span>
          <span className="text-[9px] text-gray-400 uppercase font-bold w-[50px] text-right">Issues</span>
        </div>

        {marketplaceBreakdown.map((mp, i) => {
          const opacity = 1 - i * 0.12;
          return (
            <div
              key={mp.marketplace}
              className={`flex items-center gap-3 py-2.5 ${i < marketplaceBreakdown.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <span className="text-[11px] font-semibold text-gray-700 w-[40px]">{mp.marketplace}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${mp.avgMatch}%`, backgroundColor: `rgba(14, 90, 138, ${opacity})` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold w-[36px] text-right" style={{ color: `rgba(14, 90, 138, ${Math.max(opacity, 0.5)})` }}>
                    {mp.avgMatch}%
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-gray-600 w-[50px] text-right font-medium">{mp.totalProducts}</span>
              <span className="text-[10px] text-green-600 w-[50px] text-right font-medium">{mp.perfectCount}</span>
              <span className="text-[10px] text-red-600 w-[50px] text-right font-medium">
                {mp.issueCount > 0 ? mp.issueCount : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Case Assistant Panel ───────────────────────────────────────────────────

function CaseAssistantPanel({
  downloadedBatches,
  onDownload,
  onSheets,
  sheetsUrl,
  onCloseSheets,
}: {
  downloadedBatches: Set<number>;
  onDownload: (batchNumber: number) => void;
  onSheets: (batchNumber: number) => void;
  sheetsUrl: string | null;
  onCloseSheets: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Open Cases Assistant</h3>
        <InfoTooltip />
      </div>
      {sheetsUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onClick={onCloseSheets}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Sheet className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">Data copied to clipboard</h4>
            <p className="text-xs text-gray-500 mb-3">Click below to open a new Google Sheet, then paste with <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono font-semibold">⌘V</kbd></p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={onCloseSheets} className="text-xs font-semibold text-gray-400 hover:text-gray-600">Cancel</button>
              <button
                onClick={() => { window.open(sheetsUrl, '_blank'); onCloseSheets(); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-cx-500 text-white text-xs font-semibold rounded-lg hover:bg-cx-600 transition-colors"
              >
                <Sheet className="w-3.5 h-3.5" />
                Open Google Sheets
              </button>
            </div>
          </div>
        </div>
      )}
      <p className="text-[11px] text-gray-500 mb-4">
        Products with any field below 90% similarity grouped into batches of 10 for case submission.
        Each Excel file includes source-of-truth content with mismatched cells highlighted.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {caseBatches.map((batch) => {
          const downloaded = downloadedBatches.has(batch.batchNumber);
          return (
            <div
              key={batch.batchNumber}
              className={`rounded-lg border p-3 transition-colors ${
                downloaded ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-800">
                    Batch {batch.batchNumber}
                  </span>
                  <span className="text-[9px] font-bold text-cx-500 bg-cx-50 px-1.5 py-0.5 rounded">
                    {batch.asins.length} ASINs
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSheets(batch.batchNumber)}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors bg-gray-100 text-gray-600 hover:bg-cx-50 hover:text-cx-700"
                  >
                    <Sheet className="w-3 h-3" />
                    Sheets
                  </button>
                  <button
                    onClick={() => onDownload(batch.batchNumber)}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                      downloaded
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-cx-50 hover:text-cx-700'
                    }`}
                  >
                    {downloaded ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        Excel
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-0.5">
                {batch.asins.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-gray-700">{item.asin}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{item.marketplace}</span>
                      <span className="font-semibold" style={{ color: matchColor(item.overallMatch) }}>
                        {item.overallMatch}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Comparison Table ───────────────────────────────────────────────────────

function ComparisonTable({
  products,
  expandedRows,
  onToggleRow,
  selectedFields,
}: {
  products: ContentProduct[];
  expandedRows: Set<string>;
  onToggleRow: (key: string) => void;
  selectedFields: Set<string>;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-1.5 p-5 pb-0 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Content Comparison</h3>
        <InfoTooltip />
        <span className="text-[10px] text-gray-400 ml-auto">{products.length} products</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-700">
              {['', 'ASIN', 'Product', 'Marketplace', 'Overall Match', 'Last Checked', 'Status'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const rowKey = `${product.asin}-${product.marketplace}-${idx}`;
              const isExpanded = expandedRows.has(rowKey);
              return (
                <ComparisonRow
                  key={rowKey}
                  product={product}
                  rowKey={rowKey}
                  isExpanded={isExpanded}
                  onToggle={() => onToggleRow(rowKey)}
                  selectedFields={selectedFields}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonRow({
  product,
  isExpanded,
  onToggle,
  selectedFields,
}: {
  product: ContentProduct;
  rowKey: string;
  isExpanded: boolean;
  onToggle: () => void;
  selectedFields: Set<string>;
}) {
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors ${matchRowBg(product.overallMatch)}`}
        onClick={onToggle}
      >
        <td className="px-4 py-2.5">
          <ChevronIcon className="w-3.5 h-3.5 text-gray-400" />
        </td>
        <td className="px-4 py-2.5 text-xs font-semibold text-gray-800 font-mono">
          {product.asin}
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-700 max-w-[250px] truncate">
          {product.title}
        </td>
        <td className="px-4 py-2.5">
          <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            {product.marketplace}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${product.overallMatch}%`, backgroundColor: matchColor(product.overallMatch) }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: matchColor(product.overallMatch) }}>
              {product.overallMatch}%
            </span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-[11px] text-gray-500">
          {product.lastChecked}
        </td>
        <td className="px-4 py-2.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${matchBg(product.overallMatch)}`}>
            {product.status === 'perfect' ? 'Perfect' : product.status === 'partial' ? 'Partial' : 'Mismatch'}
          </span>
        </td>
      </tr>

      {/* Expanded field details */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-0 py-0">
            <div className="bg-gray-50/70 border-y border-gray-100">
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-3">
                  {product.fields
                    .filter((f) => selectedFields.has(f.field))
                    .map((field) => (
                      <FieldComparisonCard key={field.field} field={field} />
                    ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function FieldComparisonCard({ field }: { field: FieldComparison }) {
  const color = matchColor(field.similarity);
  const isMatch = field.similarity >= 90;

  return (
    <div className={`rounded-lg border p-3 ${isMatch ? 'border-green-100 bg-white' : 'border-gray-200 bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-gray-800">{field.field}</span>
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${field.similarity}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[10px] font-bold" style={{ color }}>
            {field.similarity}%
          </span>
        </div>
      </div>

      {/* Side-by-side content */}
      {!isMatch && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <div className="text-[9px] font-bold uppercase text-gray-400 tracking-wider mb-1">Amazon Current</div>
            <div className="text-[11px] text-gray-600 leading-relaxed bg-red-50/50 rounded p-2 border border-red-100/50">
              {field.amazonContent}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase text-green-600/70 tracking-wider mb-1">Source of Truth</div>
            <div className="text-[11px] text-gray-600 leading-relaxed bg-green-50/50 rounded p-2 border border-green-100/50">
              {field.sourceContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
