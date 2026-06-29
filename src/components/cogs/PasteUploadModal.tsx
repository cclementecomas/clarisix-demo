import { useState, useMemo, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Upload, Check, AlertTriangle, FileSpreadsheet, ClipboardPaste, Download } from 'lucide-react';
import {
  detectColumn, computeCoverage,
} from '../../data/cogsData';
import type {
  CostRecord, CostMarketplace, CostCurrency,
} from '../../data/cogsData';

type Step = 'add' | 'map' | 'review';

const CURRENCIES: CostCurrency[] = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'CAD', 'AUD'];
const MARKETPLACES: CostMarketplace[] = ['all', 'US', 'UK', 'DE', 'FR', 'IT', 'ES', 'CA'];

const TARGET_COLUMNS = [
  { key: 'sku' as const,           label: 'SKU',                required: true },
  { key: 'landedCost' as const,    label: 'Landed cost',        required: true },
  { key: 'currency' as const,      label: 'Currency',           required: false },
  { key: 'marketplace' as const,   label: 'Marketplace',        required: false },
  { key: 'effectiveFrom' as const, label: 'Effective from',     required: false },
  { key: 'effectiveTo' as const,   label: 'Effective to',       required: false },
  { key: 'quantity' as const,      label: 'Quantity / batch',   required: false },
  { key: 'receivedDate' as const,  label: 'Received date',      required: false },
  { key: 'batchId' as const,       label: 'Batch ID / PO',      required: false },
  { key: 'freight' as const,       label: 'Freight per unit',   required: false },
  { key: 'duties' as const,        label: 'Duties per unit',    required: false },
  { key: 'other' as const,         label: 'Other per unit',     required: false },
];

type TargetKey = (typeof TARGET_COLUMNS)[number]['key'] | 'ignore';

interface ParsedRow {
  rowNum: number;
  raw: string[];
}

interface MappedRow {
  rowNum: number;
  raw: string[];
  values: Partial<Record<TargetKey, string>>;
}

interface ReviewedRow {
  rowNum: number;
  values: Partial<Record<TargetKey, string>>;
  status: 'ready' | 'warning' | 'needs-review';
  warnings: string[];
  errors: string[];
  cost?: Omit<CostRecord, 'id' | 'createdAt' | 'confidence'>;
}

export default function PasteUploadModal({
  onClose, onApply, knownSkus, coverage,
}: {
  onClose: () => void;
  onApply: (rows: Array<Omit<CostRecord, 'id' | 'createdAt' | 'confidence'>>) => void;
  knownSkus: Set<string>;
  coverage: ReturnType<typeof computeCoverage>;
}) {
  const [step, setStep] = useState<Step>('add');
  const [pasted, setPasted] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [defaults, setDefaults] = useState({
    currency: 'USD' as CostCurrency,
    marketplace: 'all' as CostMarketplace,
    effectiveFrom: '',
  });

  // Parsing
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<number, TargetKey>>({});

  // Review
  const [reviewedRows, setReviewedRows] = useState<ReviewedRow[]>([]);
  const [issueFilter, setIssueFilter] = useState<'all' | 'warning' | 'needs-review'>('all');

  // ─── Step 1: parse pasted/uploaded data ────────────────────────────────

  const parseInput = useCallback((text: string) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] as ParsedRow[] };

    // Detect delimiter
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delim = tabCount > commaCount ? '\t' : ',';

    const split = (s: string) => s.split(delim).map((c) => c.replace(/^"|"$/g, '').trim());
    const headers = split(lines[0]);
    const rows: ParsedRow[] = lines.slice(1).map((l, i) => ({ rowNum: i + 2, raw: split(l) }));
    return { headers, rows };
  }, []);

  const handleContinueFromAdd = () => {
    const text = pasted;
    if (!text.trim()) return;
    const { headers: h, rows: r } = parseInput(text);
    setHeaders(h);
    setRows(r);
    // Auto-map
    const initial: Record<number, TargetKey> = {};
    h.forEach((header, i) => {
      const detected = detectColumn(header);
      initial[i] = (detected as TargetKey) || 'ignore';
    });
    setMapping(initial);
    setStep('map');
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setPasted(text);
    };
    reader.readAsText(file);
  };

  // ─── Step 2: column mapping → mapped rows ──────────────────────────────

  const mappedRows: MappedRow[] = useMemo(() => {
    return rows.map((r) => {
      const values: Partial<Record<TargetKey, string>> = {};
      for (let i = 0; i < r.raw.length; i++) {
        const target = mapping[i];
        if (target && target !== 'ignore') {
          values[target] = r.raw[i];
        }
      }
      return { rowNum: r.rowNum, raw: r.raw, values };
    });
  }, [rows, mapping]);

  const hasSku = Object.values(mapping).includes('sku');
  const hasCost = Object.values(mapping).includes('landedCost');
  const canProceedToReview = hasSku && hasCost && rows.length > 0;

  const handleContinueFromMap = () => {
    // Run validation
    const reviewed: ReviewedRow[] = mappedRows.map((row) => {
      const warnings: string[] = [];
      const errors: string[] = [];

      const sku = (row.values.sku || '').trim();
      const costStr = (row.values.landedCost || '').trim();
      const cost = parseFloat(costStr.replace(/[^0-9.-]/g, ''));

      if (!sku) errors.push('Missing SKU');
      else if (!knownSkus.has(sku)) errors.push('Unknown SKU');
      if (!costStr) errors.push('Missing landed cost');
      else if (isNaN(cost) || cost <= 0) errors.push('Invalid landed cost');

      let currency: CostCurrency = (row.values.currency as CostCurrency) || defaults.currency;
      if (row.values.currency && !CURRENCIES.includes(currency)) {
        errors.push(`Invalid currency: ${row.values.currency}`);
      } else if (!row.values.currency) {
        warnings.push(`Currency not specified — using ${defaults.currency}`);
      }

      let marketplace: CostMarketplace = defaults.marketplace;
      if (row.values.marketplace) {
        const mk = row.values.marketplace.trim().toUpperCase();
        if (mk === 'ALL' || mk === 'GLOBAL') marketplace = 'all';
        else if (MARKETPLACES.includes(mk as CostMarketplace)) marketplace = mk as CostMarketplace;
        else errors.push(`Unknown marketplace: ${row.values.marketplace}`);
      }

      const effectiveFrom = (row.values.effectiveFrom || '').trim() || defaults.effectiveFrom || null;
      const effectiveTo = (row.values.effectiveTo || '').trim() || null;

      const status: ReviewedRow['status'] = errors.length > 0 ? 'needs-review' : warnings.length > 0 ? 'warning' : 'ready';

      const reviewed: ReviewedRow = {
        rowNum: row.rowNum,
        values: row.values,
        status,
        warnings,
        errors,
        cost: errors.length === 0 ? {
          sku,
          marketplace,
          landedCost: cost,
          currency,
          effectiveFrom,
          effectiveTo,
          source: 'paste',
        } : undefined,
      };

      return reviewed;
    });

    // Detect duplicates: same SKU + marketplace + dates appearing multiple times with different costs
    const sigMap = new Map<string, ReviewedRow[]>();
    for (const r of reviewed) {
      if (!r.cost) continue;
      const sig = `${r.cost.sku}|${r.cost.marketplace}|${r.cost.effectiveFrom || ''}`;
      if (!sigMap.has(sig)) sigMap.set(sig, []);
      sigMap.get(sig)!.push(r);
    }
    for (const [, dupes] of sigMap) {
      if (dupes.length > 1) {
        const costs = new Set(dupes.map((d) => d.cost!.landedCost));
        if (costs.size > 1) {
          for (const d of dupes) {
            d.errors.push('Duplicate SKU with different costs');
            d.status = 'needs-review';
            d.cost = undefined;
          }
        } else {
          for (const d of dupes) {
            d.warnings.push('Duplicate row (same cost)');
            d.status = 'warning';
          }
        }
      }
    }

    setReviewedRows(reviewed);
    setStep('review');
  };

  // ─── Step 3: review ─────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const ready = reviewedRows.filter((r) => r.status === 'ready').length;
    const warning = reviewedRows.filter((r) => r.status === 'warning').length;
    const needsReview = reviewedRows.filter((r) => r.status === 'needs-review').length;
    return { total: reviewedRows.length, ready, warning, needsReview, applyable: ready + warning };
  }, [reviewedRows]);

  const apply = () => {
    const toApply = reviewedRows.filter((r) => r.cost).map((r) => r.cost!);
    onApply(toApply);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cx-500" />
              <h2 className="text-sm font-semibold text-gray-900">Paste or upload costs</h2>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {(['add', 'map', 'review'] as const).map((s, i) => {
                const isActive = step === s;
                const isPast = (['add', 'map', 'review'] as const).indexOf(step) > i;
                const labels = { add: 'Add data', map: 'Map columns', review: 'Review' };
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                        isActive ? 'bg-cx-500 text-white' : isPast ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isPast ? <Check className="w-2.5 h-2.5" /> : i + 1}
                    </span>
                    <span className={`text-[10px] font-semibold ${isActive ? 'text-cx-600' : 'text-gray-400'}`}>
                      {labels[s]}
                    </span>
                    {i < 2 && <span className="text-gray-300">·</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {step === 'add' && (
            <AddDataStep
              pasted={pasted}
              setPasted={setPasted}
              fileName={fileName}
              onFile={handleFile}
              defaults={defaults}
              setDefaults={setDefaults}
            />
          )}

          {step === 'map' && (
            <MapColumnsStep
              headers={headers}
              rows={rows}
              mapping={mapping}
              setMapping={setMapping}
              hasSku={hasSku}
              hasCost={hasCost}
            />
          )}

          {step === 'review' && (
            <ReviewStep
              stats={stats}
              reviewedRows={reviewedRows}
              issueFilter={issueFilter}
              setIssueFilter={setIssueFilter}
              coverage={coverage}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          {step === 'add' ? (
            <span className="text-[10px] text-gray-400">
              Paste from any spreadsheet. Only <span className="font-mono font-semibold">sku</span> and <span className="font-mono font-semibold">landed_cost</span> are required.
            </span>
          ) : step === 'map' ? (
            <span className="text-[10px] text-gray-400">
              {rows.length} rows detected. Columns named SKU, Cost, COGS, Landed Cost, etc. are auto-recognized.
            </span>
          ) : (
            <span className="text-[10px] text-gray-400">
              Apply valid rows now and resolve issues later. Applied costs aren't instant — they take a little while to process before they show in your figures.
            </span>
          )}
          <div className="flex items-center gap-2">
            {step === 'add' && (
              <>
                <button onClick={onClose} className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5">
                  Cancel
                </button>
                <button
                  onClick={handleContinueFromAdd}
                  disabled={!pasted.trim()}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 disabled:bg-gray-200 disabled:text-gray-400 px-3 py-1.5 rounded-md transition-colors"
                >
                  Continue <ArrowRight className="w-3 h-3" />
                </button>
              </>
            )}
            {step === 'map' && (
              <>
                <button onClick={() => setStep('add')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <button
                  onClick={handleContinueFromMap}
                  disabled={!canProceedToReview}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 disabled:bg-gray-200 disabled:text-gray-400 px-3 py-1.5 rounded-md transition-colors"
                >
                  Review import <ArrowRight className="w-3 h-3" />
                </button>
              </>
            )}
            {step === 'review' && (
              <>
                <button onClick={() => setStep('map')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <button onClick={onClose} className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5">
                  Cancel
                </button>
                <button
                  onClick={apply}
                  disabled={stats.applyable === 0}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 disabled:bg-gray-200 disabled:text-gray-400 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Check className="w-3 h-3" /> Apply {stats.applyable} valid rows
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Add Data ─────────────────────────────────────────────────────

function AddDataStep({
  pasted, setPasted, fileName, onFile, defaults, setDefaults,
}: {
  pasted: string;
  setPasted: (v: string) => void;
  fileName: string;
  onFile: (f: File) => void;
  defaults: { currency: CostCurrency; marketplace: CostMarketplace; effectiveFrom: string };
  setDefaults: (d: { currency: CostCurrency; marketplace: CostMarketplace; effectiveFrom: string }) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const downloadTemplate = () => {
    const csv = 'sku,landed_cost,currency,effective_from,marketplace\n'
      + 'SKU-001,4.20,USD,2026-01-01,ALL\n'
      + 'SKU-002,3.10,USD,,US\n'
      + 'SKU-003,2.10,GBP,2026-01-01,UK\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clarisix-cogs-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-gray-700 max-w-md">
          Paste from any spreadsheet, or upload a file. We detect columns automatically — common names like Seller SKU, COGS, or Landed Cost are recognized.
        </p>
        <button
          onClick={downloadTemplate}
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold text-cx-700 bg-cx-50 hover:bg-cx-100 border border-cx-200 px-3 py-1.5 rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <div className="text-left leading-tight">
            <div>Download CSV template</div>
            <div className="text-[9px] font-normal text-cx-600/80">Pre-filled headers + 3 example rows</div>
          </div>
        </button>
      </div>

      {/* Accepted columns reference */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2.5">
        <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1.5">Accepted columns</div>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-baseline gap-2">
            <span className="inline-flex items-center justify-center w-[64px] flex-shrink-0 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-1 py-0.5">REQUIRED</span>
            <span className="font-mono text-gray-800">sku · landed_cost</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="inline-flex items-center justify-center w-[64px] flex-shrink-0 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-1 py-0.5">COMMON</span>
            <span className="font-mono text-gray-700">currency · marketplace · effective_from</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="inline-flex items-center justify-center w-[64px] flex-shrink-0 rounded text-[9px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-1 py-0.5">ADVANCED</span>
            <span className="font-mono text-gray-500">effective_to · quantity · received_date · batch_id · freight · duties · other</span>
          </div>
        </div>
        <div className="text-[10px] text-blue-800/80 mt-1.5 italic">
          Only <span className="font-mono font-semibold not-italic">sku</span> and <span className="font-mono font-semibold not-italic">landed_cost</span> are required. Missing fields use the defaults below.
        </div>
      </div>

      {/* Paste area */}
      <div>
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 inline-flex items-center gap-1">
          <ClipboardPaste className="w-3 h-3" /> Paste rows from a spreadsheet
        </label>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={6}
          placeholder={'sku, landed_cost, currency, marketplace\nSKU-001, 4.20, USD, ALL\nSKU-002, 3.10, USD, US\nSKU-003, 2.10, GBP, UK'}
          className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] text-gray-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Upload file */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          dragOver ? 'border-cx-400 bg-cx-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
        }`}
      >
        <Upload className={`w-5 h-5 mb-1.5 ${dragOver ? 'text-cx-500' : 'text-gray-400'}`} />
        <p className="text-xs font-medium text-gray-600">
          {fileName ? <span className="text-cx-700 font-semibold">{fileName}</span> : 'Drop CSV/XLSX or click to browse'}
        </p>
        <input
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          className="hidden"
        />
      </label>

      {/* Defaults */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Import defaults</div>
        <div className="text-[10px] text-gray-500 mb-2.5">Used when a row doesn't include these columns.</div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[9px] font-semibold text-gray-500 mb-1">Currency</label>
            <select
              value={defaults.currency}
              onChange={(e) => setDefaults({ ...defaults, currency: e.target.value as CostCurrency })}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none bg-white"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-semibold text-gray-500 mb-1">Marketplace</label>
            <select
              value={defaults.marketplace}
              onChange={(e) => setDefaults({ ...defaults, marketplace: e.target.value as CostMarketplace })}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none bg-white"
            >
              {MARKETPLACES.map((m) => <option key={m} value={m}>{m === 'all' ? 'All marketplaces' : m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-semibold text-gray-500 mb-1">Effective from</label>
            <input
              type="date"
              value={defaults.effectiveFrom}
              onChange={(e) => setDefaults({ ...defaults, effectiveFrom: e.target.value })}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none bg-white"
            />
            {!defaults.effectiveFrom && (
              <span className="text-[9px] text-gray-400 mt-0.5 block">Defaults to "all time"</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Map Columns ─────────────────────────────────────────────────

function MapColumnsStep({
  headers, rows, mapping, setMapping, hasSku, hasCost,
}: {
  headers: string[];
  rows: ParsedRow[];
  mapping: Record<number, TargetKey>;
  setMapping: (m: Record<number, TargetKey>) => void;
  hasSku: boolean;
  hasCost: boolean;
}) {
  const targetOptions: TargetKey[] = ['ignore', ...TARGET_COLUMNS.map((t) => t.key)];
  const targetLabel = (k: TargetKey): string => k === 'ignore' ? 'Ignore' : (TARGET_COLUMNS.find((t) => t.key === k)?.label || k);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-700">We detected {rows.length} row{rows.length !== 1 ? 's' : ''} and {headers.length} column{headers.length !== 1 ? 's' : ''}.</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Confirm how each column maps. Common synonyms (Seller SKU, MSKU, COGS, Landed Cost) auto-match.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasSku ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <Check className="w-2.5 h-2.5" /> SKU mapped
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              <AlertTriangle className="w-2.5 h-2.5" /> SKU column required
            </span>
          )}
          {hasCost ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <Check className="w-2.5 h-2.5" /> Cost mapped
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              <AlertTriangle className="w-2.5 h-2.5" /> Landed cost required
            </span>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Your column</th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Maps to</th>
              <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Sample values</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {headers.map((h, i) => {
              const samples = rows.slice(0, 3).map((r) => r.raw[i]).filter(Boolean);
              return (
                <tr key={i}>
                  <td className="px-3 py-2 text-xs font-mono font-semibold text-gray-700">{h}</td>
                  <td className="px-3 py-2">
                    <select
                      value={mapping[i] || 'ignore'}
                      onChange={(e) => setMapping({ ...mapping, [i]: e.target.value as TargetKey })}
                      className="px-2 py-1 text-xs border border-gray-200 rounded-md outline-none bg-white"
                    >
                      {targetOptions.map((opt) => (
                        <option key={opt} value={opt}>{targetLabel(opt)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-[10px] text-gray-500 font-mono">
                    {samples.length > 0 ? samples.join('  ·  ') : <span className="text-gray-300">empty</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Step 3: Review ──────────────────────────────────────────────────────

function ReviewStep({
  stats, reviewedRows, issueFilter, setIssueFilter, coverage,
}: {
  stats: { total: number; ready: number; warning: number; needsReview: number; applyable: number };
  reviewedRows: ReviewedRow[];
  issueFilter: 'all' | 'warning' | 'needs-review';
  setIssueFilter: (f: 'all' | 'warning' | 'needs-review') => void;
  coverage: ReturnType<typeof computeCoverage>;
}) {
  // Estimated coverage after applying — naive: covered + uncovered SKUs that get a cost
  const estimatedCoverage = useMemo(() => {
    const newSkus = new Set(reviewedRows.filter((r) => r.cost).map((r) => r.cost!.sku));
    return Math.min(100, coverage.revenueCoverage + Math.round((newSkus.size / Math.max(1, coverage.activeSkus - coverage.costedActiveSkus)) * (100 - coverage.revenueCoverage)));
  }, [reviewedRows, coverage]);

  const visibleRows = reviewedRows.filter((r) => issueFilter === 'all' || r.status === issueFilter);

  const downloadFailed = () => {
    const failed = reviewedRows.filter((r) => r.status === 'needs-review');
    if (failed.length === 0) return;
    const headers = ['row', 'sku', 'landed_cost', 'currency', 'marketplace', 'errors'];
    const lines = [headers.join(',')];
    for (const r of failed) {
      lines.push([
        r.rowNum,
        r.values.sku || '',
        r.values.landedCost || '',
        r.values.currency || '',
        r.values.marketplace || '',
        `"${r.errors.join('; ')}"`,
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clarisix-cogs-failed-rows.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-[9px] font-semibold text-gray-400 uppercase">Rows found</div>
          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <div className="text-[9px] font-semibold text-emerald-700 uppercase">Ready to apply</div>
          <div className="text-lg font-bold text-emerald-700">{stats.ready}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <div className="text-[9px] font-semibold text-amber-700 uppercase">Warnings</div>
          <div className="text-lg font-bold text-amber-700">{stats.warning}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <div className="text-[9px] font-semibold text-rose-700 uppercase">Needs review</div>
          <div className="text-lg font-bold text-rose-700">{stats.needsReview}</div>
        </div>
      </div>

      <div className="bg-cx-50 border border-cx-200 rounded-lg px-3 py-2 flex items-center justify-between">
        <div className="text-[11px] text-cx-800">
          Sales coverage after applying: <span className="font-semibold">{coverage.revenueCoverage}% → {estimatedCoverage}%</span>
        </div>
        {stats.needsReview > 0 && (
          <button
            onClick={downloadFailed}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-cx-700 hover:text-cx-800"
          >
            <Download className="w-3 h-3" /> Download {stats.needsReview} failed rows
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {([
          { k: 'all' as const,           label: `All (${stats.total})` },
          { k: 'warning' as const,       label: `Warnings (${stats.warning})` },
          { k: 'needs-review' as const,  label: `Needs review (${stats.needsReview})` },
        ]).map((t) => (
          <button
            key={t.k}
            onClick={() => setIssueFilter(t.k)}
            className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-colors ${
              issueFilter === t.k ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 w-[44px]">Row</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">SKU</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">Cost</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Cur</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Mkt</th>
              <th className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visibleRows.slice(0, 50).map((r) => (
              <tr
                key={r.rowNum}
                className={
                  r.status === 'ready' ? 'bg-emerald-50/30' :
                  r.status === 'warning' ? 'bg-amber-50/40' :
                  'bg-rose-50/40'
                }
              >
                <td className="px-3 py-1.5 text-[10px] font-mono text-gray-500">{r.rowNum}</td>
                <td className="px-3 py-1.5 text-[11px] font-mono font-semibold text-gray-700">{r.values.sku || <span className="text-gray-300 italic">missing</span>}</td>
                <td className="px-3 py-1.5 text-[11px] text-right text-gray-700">{r.values.landedCost || <span className="text-gray-300 italic">missing</span>}</td>
                <td className="px-3 py-1.5 text-[10px] text-gray-500">{r.values.currency || '—'}</td>
                <td className="px-3 py-1.5 text-[10px] text-gray-500">{r.values.marketplace || '—'}</td>
                <td className="px-3 py-1.5 text-[10px]">
                  {r.errors.length > 0 && (
                    <div className="text-rose-700 font-medium">{r.errors.join(', ')}</div>
                  )}
                  {r.warnings.length > 0 && (
                    <div className="text-amber-700">{r.warnings.join(', ')}</div>
                  )}
                  {r.errors.length === 0 && r.warnings.length === 0 && (
                    <span className="text-emerald-700 font-medium">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleRows.length > 50 && (
          <div className="px-3 py-2 text-[10px] text-gray-400 text-center bg-gray-50 border-t border-gray-100">
            Showing 50 of {visibleRows.length} rows.
          </div>
        )}
      </div>
    </div>
  );
}
