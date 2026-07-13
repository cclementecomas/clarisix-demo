import { useEffect, useMemo, useState } from 'react';
import { X, Repeat, Percent } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import {
  OVERHEAD_CATEGORIES, ALLOCATION_LABEL, ALLOCATION_HINT, monthlyRunRate, nextId,
  type OverheadEntry, type OverheadKind, type FixedFrequency, type VariableBasis, type AllocationBasis,
} from '../../data/overheadsData';

const FREQS: { v: FixedFrequency; label: string }[] = [
  { v: 'monthly', label: 'Monthly' }, { v: 'quarterly', label: 'Quarterly' }, { v: 'yearly', label: 'Yearly' }, { v: 'one_time', label: 'One-off' },
];
const BASES: { v: VariableBasis; label: string; hint: string }[] = [
  { v: 'pct_sales', label: '% of sales', hint: 'Percent of net revenue' },
  { v: 'per_order', label: 'Per placed order', hint: '€ per order' },
  { v: 'per_unit', label: 'Per unit sold', hint: '€ per unit' },
];

export default function OverheadModal({ entry, onClose, onSave }: {
  entry: OverheadEntry | null; onClose: () => void; onSave: (e: OverheadEntry) => void;
}) {
  const { currency } = useCurrency();
  const editing = !!entry;
  const [d, setD] = useState<OverheadEntry>(() => entry ?? {
    id: nextId(), name: '', kind: 'fixed', categoryId: 'payroll',
    amount: undefined, frequency: 'monthly', basis: 'pct_sales', rate: undefined,
    startDate: '2026-07-13', endDate: null, allocation: 'revenue',
  });
  const set = <K extends keyof OverheadEntry>(k: K, v: OverheadEntry[K]) => setD((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const monthly = useMemo(() => monthlyRunRate({ ...d, paused: false }), [d]);
  const oneOff = d.kind === 'fixed' && d.frequency === 'one_time';
  const hasAmount = d.kind === 'fixed' ? (d.amount ?? 0) > 0 : (d.rate ?? 0) > 0;
  const valid = d.name.trim().length > 0 && hasAmount;

  const forever = d.endDate == null;
  const rateUnit = d.basis === 'pct_sales' ? '%' : '€ / ' + (d.basis === 'per_order' ? 'order' : 'unit');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="sticky top-0 z-10 bg-cx-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-base font-bold">{editing ? 'Edit overhead' : 'New overhead'}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-white/15 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px]">
          {/* form */}
          <div className="px-6 py-5 space-y-5 border-r border-gray-100">
            {/* kind toggle */}
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              {(['fixed', 'variable'] as OverheadKind[]).map((k) => (
                <button key={k} onClick={() => set('kind', k)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${d.kind === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {k === 'fixed' ? <Repeat className="w-3.5 h-3.5" /> : <Percent className="w-3.5 h-3.5" />}
                  {k === 'fixed' ? 'Recurring' : 'Variable'}
                </button>
              ))}
            </div>
            <p className="-mt-3 text-[11px] text-gray-400">{d.kind === 'fixed' ? 'A set amount every period — salaries, rent, software, insurance.' : 'Scales with your business — a % of sales, or a fee per order/unit.'}</p>

            <Field label="Name">
              <input autoFocus value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Amazon team salaries"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-cx-500/30 focus:border-cx-400 outline-none" />
            </Field>

            <Field label="Category" hint="Maps to a P&L overhead account">
              <div className="grid grid-cols-2 gap-1.5">
                {OVERHEAD_CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => set('categoryId', c.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors ${d.categoryId === c.id ? 'border-cx-400 bg-cx-50/60 ring-1 ring-cx-400/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="min-w-0"><span className="block text-[11px] font-semibold text-gray-800 truncate">{c.label}</span><span className="block text-[9px] text-gray-400 font-mono">{c.code}</span></span>
                  </button>
                ))}
              </div>
            </Field>

            {/* amount / rate */}
            {d.kind === 'fixed' ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input type="number" min={0} value={d.amount ?? ''} onChange={(e) => set('amount', e.target.value === '' ? undefined : +e.target.value)} placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-cx-500/30 focus:border-cx-400 outline-none tabular-nums" />
                  </div>
                </Field>
                <Field label="Frequency">
                  <select value={d.frequency} onChange={(e) => set('frequency', e.target.value as FixedFrequency)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white">
                    {FREQS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
                  </select>
                </Field>
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Calculate as">
                  <div className="grid grid-cols-3 gap-1.5">
                    {BASES.map((b) => (
                      <button key={b.v} onClick={() => set('basis', b.v)}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${d.basis === b.v ? 'border-cx-400 bg-cx-50/60 text-cx-700 ring-1 ring-cx-400/30' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Rate">
                  <div className="relative">
                    <input type="number" min={0} step="0.01" value={d.rate ?? ''} onChange={(e) => set('rate', e.target.value === '' ? undefined : +e.target.value)} placeholder="0"
                      className="w-full pl-3 pr-16 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-cx-500/30 focus:border-cx-400 outline-none tabular-nums" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">{rateUnit}</span>
                  </div>
                </Field>
              </div>
            )}

            <Field label="Allocation to SKUs" hint="How this cost is spread onto per-product profit">
              <select value={d.allocation} onChange={(e) => set('allocation', e.target.value as AllocationBasis)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-cx-500/30 focus:border-cx-400 outline-none bg-white">
                {(Object.keys(ALLOCATION_LABEL) as AllocationBasis[]).map((a) => <option key={a} value={a}>{ALLOCATION_LABEL[a]}</option>)}
              </select>
              <p className="mt-1 text-[10px] text-gray-400 leading-snug">{ALLOCATION_HINT[d.allocation]}</p>
            </Field>

            {/* effective dates */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starting from">
                <input type="date" value={d.startDate} onChange={(e) => set('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-cx-500/30 focus:border-cx-400 outline-none" />
              </Field>
              <Field label="Ends">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => set('endDate', null)} className={`px-2.5 py-2 rounded-lg border text-[11px] font-semibold ${forever ? 'border-cx-400 bg-cx-50/60 text-cx-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Forever</button>
                  <input type="date" value={d.endDate ?? ''} min={d.startDate} onChange={(e) => set('endDate', e.target.value || null)}
                    className={`flex-1 min-w-0 px-2 py-2 text-sm border rounded-lg outline-none ${forever ? 'border-gray-200 text-gray-400' : 'border-cx-400 ring-1 ring-cx-400/20'}`} />
                </div>
              </Field>
            </div>

            <Field label="Note (optional)">
              <input value={d.note ?? ''} onChange={(e) => set('note', e.target.value)} placeholder="Anything worth remembering"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-cx-500/30 focus:border-cx-400 outline-none" />
            </Field>
          </div>

          {/* live preview rail */}
          <div className="px-5 py-5 bg-gray-50/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Impact preview</div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              {oneOff ? (
                <>
                  <div className="text-[11px] text-gray-500">One-off cost</div>
                  <div className="text-2xl font-bold text-gray-900 tabular-nums mt-0.5">{fc(d.amount ?? 0, currency, { compact: false })}</div>
                  <div className="text-[10px] text-gray-400 mt-1">Lands on {d.startDate} · excluded from the monthly run-rate</div>
                </>
              ) : (
                <>
                  <div className="text-[11px] text-gray-500">Monthly run-rate</div>
                  <div className="text-2xl font-bold text-gray-900 tabular-nums mt-0.5">{fc(monthly, currency, { compact: false })}</div>
                  <div className="text-[11px] text-gray-500 mt-2">Annualised</div>
                  <div className="text-base font-bold text-gray-700 tabular-nums">{fc(monthly * 12, currency, { compact: false })}</div>
                </>
              )}
              {d.kind === 'variable' && !oneOff && (
                <p className="mt-3 text-[10px] text-gray-400 leading-snug border-t border-gray-100 pt-2">At the current run-rate ({fc(385000, currency, { compact: true })} sales · 14.2k units / mo). Recalculates as your sales move.</p>
              )}
            </div>
            <div className="mt-3 text-[10px] text-gray-500 leading-snug">
              Allocated to SKUs <span className="font-semibold text-gray-700">{ALLOCATION_LABEL[d.allocation].toLowerCase()}</span>, posted to <span className="font-semibold text-gray-700">{OVERHEAD_CATEGORIES.find((c) => c.id === d.categoryId)?.code}</span> on the P&L.
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-end gap-2 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
          <button onClick={() => valid && onSave(d)} disabled={!valid}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-cx-600 hover:bg-cx-700 disabled:bg-gray-300 disabled:cursor-not-allowed">{editing ? 'Save changes' : 'Add overhead'}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-[11px] font-semibold text-gray-600">{label}</label>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
