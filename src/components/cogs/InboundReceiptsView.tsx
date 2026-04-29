import { useState } from 'react';
import { ArrowLeft, Inbox, Check, AlertCircle } from 'lucide-react';
import type { InboundCluster, CostCurrency } from '../../data/cogsData';
import { inventoryData } from '../../data/inventoryData';

const CURRENCIES: CostCurrency[] = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'CAD', 'AUD'];

export default function InboundReceiptsView({
  clusters, onClose, onAction,
}: {
  clusters: InboundCluster[];
  onClose: () => void;
  onAction: (
    sku: string,
    action: 'reuse' | 'new' | 'batch' | 'ignore',
    payload?: { cost: number; currency: CostCurrency; effectiveFrom: string; applyAs: 'cost-change' | 'batch' }
  ) => void;
}) {
  const unreviewed = clusters.filter((c) => !c.reviewed);
  const reviewed = clusters.filter((c) => c.reviewed);

  const titleFor = (sku: string) => inventoryData.find((s) => s.sku === sku)?.title || sku;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-3 h-3" /> Back to coverage
          </button>
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-amber-500" />
            <h1 className="text-lg font-bold text-gray-900">Inbound receipts needing cost review</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Recent Amazon inbound receipts that may need a COGS update. These are <span className="font-semibold">suggestions only</span> —
            we won't create batches until you confirm them. A receipt isn't always a purchase; you may have bought once and sent waves to FBA.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span className="text-[11px] text-amber-800">
          {unreviewed.length} active receipt{unreviewed.length !== 1 ? 's' : ''} pending review · {reviewed.length} resolved
        </span>
      </div>

      <div className="space-y-3">
        {unreviewed.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-12 text-center">
            <Check className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">All inbound receipts reviewed.</p>
            <p className="text-xs text-gray-500 mt-1">New shipments will appear here as Amazon receives them.</p>
          </div>
        ) : (
          unreviewed.map((cluster) => (
            <InboundClusterCard
              key={cluster.sku}
              cluster={cluster}
              title={titleFor(cluster.sku)}
              onAction={onAction}
            />
          ))
        )}

        {reviewed.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reviewed ({reviewed.length})</span>
            </div>
            <div className="divide-y divide-gray-50">
              {reviewed.map((c) => (
                <div key={c.sku} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-gray-700">{c.sku}</span>
                    <span className="text-[10px] text-gray-400 ml-2">{titleFor(c.sku)}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <Check className="w-3 h-3" /> Reviewed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cluster card ─────────────────────────────────────────────────────────

function InboundClusterCard({
  cluster, title, onAction,
}: {
  cluster: InboundCluster;
  title: string;
  onAction: (
    sku: string,
    action: 'reuse' | 'new' | 'batch' | 'ignore',
    payload?: { cost: number; currency: CostCurrency; effectiveFrom: string; applyAs: 'cost-change' | 'batch' }
  ) => void;
}) {
  const [mode, setMode] = useState<'idle' | 'reuse' | 'new'>('idle');
  const [draft, setDraft] = useState({
    cost: '',
    currency: (cluster.previousCurrency || 'USD') as CostCurrency,
    effectiveFrom: cluster.firstDate,
    applyAs: 'cost-change' as 'cost-change' | 'batch',
  });

  const isWave = cluster.events.length >= 2 && daysBetween(cluster.firstDate, cluster.lastDate) <= 14;
  const hasPrevious = cluster.previousCost !== null;

  const submitNew = () => {
    const num = parseFloat(draft.cost);
    if (isNaN(num) || num <= 0) return;
    onAction(cluster.sku, 'new', {
      cost: num,
      currency: draft.currency,
      effectiveFrom: draft.effectiveFrom,
      applyAs: draft.applyAs,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <span className="text-[11px] font-mono text-gray-500">{cluster.sku}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {cluster.events.length} shipment{cluster.events.length !== 1 ? 's' : ''} · {cluster.totalQty.toLocaleString()} units total
            {isWave && <span className="ml-1 text-amber-700 font-medium">· Looks like one replenishment wave</span>}
          </p>
        </div>
        <button
          onClick={() => onAction(cluster.sku, 'ignore')}
          className="text-[10px] font-semibold text-gray-400 hover:text-gray-600"
        >
          Ignore
        </button>
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-4">
        {/* Shipments */}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Amazon received</div>
          <div className="space-y-1">
            {cluster.events.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600">{e.date}</span>
                <span className="font-medium text-gray-700">{e.quantity.toLocaleString()} units</span>
                <span className="text-[9px] text-gray-400 font-mono">{e.shipmentId}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Previous cost */}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Previous cost</div>
          {hasPrevious ? (
            <div className="text-[11px] text-gray-700">
              <span className="font-semibold text-base">{cluster.previousCost!.toFixed(2)} {cluster.previousCurrency}</span>
              <div className="text-[10px] text-gray-400 mt-0.5">last applied cost for this SKU</div>
            </div>
          ) : (
            <div className="text-[11px] text-rose-700 font-medium">No previous cost on file</div>
          )}
        </div>
      </div>

      {/* Action area */}
      {mode === 'idle' && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
          {hasPrevious && (
            <button
              onClick={() => onAction(cluster.sku, 'reuse')}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 px-3 py-1.5 rounded-md"
            >
              Reuse {cluster.previousCost!.toFixed(2)} {cluster.previousCurrency}
            </button>
          )}
          <button
            onClick={() => setMode('new')}
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md ${
              hasPrevious ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50' : 'text-white bg-cx-500 hover:bg-cx-600'
            }`}
          >
            Enter new cost
          </button>
        </div>
      )}

      {mode === 'new' && (
        <div className="px-4 py-3 border-t border-gray-100 bg-cx-50/50 space-y-2.5">
          <div className="text-[10px] font-semibold text-cx-800">Enter cost for received inventory</div>
          <div className="flex items-end gap-2.5 flex-wrap">
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">Landed cost / unit *</label>
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
              <label className="block text-[9px] font-semibold text-gray-500 mb-1">Effective from</label>
              <input
                type="date"
                value={draft.effectiveFrom}
                onChange={(e) => setDraft({ ...draft, effectiveFrom: e.target.value })}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[10px] text-gray-700 font-medium">Apply as:</label>
            <label className="flex items-center gap-1 text-[10px] text-gray-700 cursor-pointer">
              <input
                type="radio"
                checked={draft.applyAs === 'cost-change'}
                onChange={() => setDraft({ ...draft, applyAs: 'cost-change' })}
                className="w-3 h-3"
              />
              Cost change from this date forward
              <span className="text-[9px] text-gray-400 ml-1">(default)</span>
            </label>
            <label className="flex items-center gap-1 text-[10px] text-gray-700 cursor-pointer">
              <input
                type="radio"
                checked={draft.applyAs === 'batch'}
                onChange={() => setDraft({ ...draft, applyAs: 'batch' })}
                className="w-3 h-3"
              />
              Batch for these {cluster.totalQty.toLocaleString()} units
            </label>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={submitNew}
              disabled={!draft.cost}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-cx-500 hover:bg-cx-600 disabled:bg-gray-200 disabled:text-gray-400 px-3 py-1.5 rounded-md"
            >
              Apply cost
            </button>
            <button
              onClick={() => setMode('idle')}
              className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 px-2 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
