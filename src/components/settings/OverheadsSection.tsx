import { useMemo, useState } from 'react';
import { Plus, Pencil, Copy, Trash2, Pause, Play, Search, Info } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import OverheadModal from './OverheadModal';
import {
  SEED_OVERHEADS, OVERHEAD_CATEGORIES, catOf,
  monthlyRunRate, statusOf, isLive, nextId, FREQ_LABEL, ALLOCATION_LABEL,
  type OverheadEntry, type OverheadStatus,
} from '../../data/overheadsData';

const STATUS_PILL: Record<OverheadStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  scheduled: 'bg-sky-50 text-sky-700 ring-sky-200',
  expired: 'bg-gray-100 text-gray-400 ring-gray-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
};
type KindFilter = 'all' | 'fixed' | 'variable';

export default function OverheadsSection() {
  const { currency } = useCurrency();
  const [entries, setEntries] = useState<OverheadEntry[]>(SEED_OVERHEADS);
  const [kind, setKind] = useState<KindFilter>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<OverheadEntry | null>(null);
  const [creating, setCreating] = useState(false);

  const live = useMemo(() => entries.filter(isLive), [entries]);
  const runRate = useMemo(() => live.reduce((s, e) => s + monthlyRunRate(e), 0), [live]);
  const fixedMonthly = useMemo(() => live.filter((e) => e.kind === 'fixed').reduce((s, e) => s + monthlyRunRate(e), 0), [live]);
  const variableMonthly = runRate - fixedMonthly;
  const oneOffs = useMemo(() => entries.filter((e) => e.kind === 'fixed' && e.frequency === 'one_time' && statusOf(e) !== 'expired'), [entries]);
  const oneOffTotal = oneOffs.reduce((s, e) => s + (e.amount ?? 0), 0);

  const byCategory = useMemo(() => OVERHEAD_CATEGORIES.map((c) => ({
    ...c, value: live.filter((e) => e.categoryId === c.id).reduce((s, e) => s + monthlyRunRate(e), 0),
  })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value), [live]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => kind === 'all' || e.kind === kind)
      .filter((e) => !q || e.name.toLowerCase().includes(q) || catOf(e.categoryId).label.toLowerCase().includes(q))
      .sort((a, b) => monthlyRunRate(b) - monthlyRunRate(a));
  }, [entries, kind, search]);

  const save = (e: OverheadEntry) => {
    setEntries((prev) => prev.some((x) => x.id === e.id) ? prev.map((x) => (x.id === e.id ? e : x)) : [...prev, e]);
    setEditing(null); setCreating(false);
  };
  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const togglePause = (id: string) => setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, paused: !e.paused } : e)));
  const duplicate = (e: OverheadEntry) => setEntries((prev) => [...prev, { ...e, id: nextId(), name: `${e.name} (copy)` }]);

  return (
    <div className="space-y-4 min-w-0">
      {/* header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Overheads</h2>
          <p className="text-[12px] text-gray-500 mt-0.5 max-w-2xl">Your running business costs that aren't COGS, Amazon fees or ad spend — payroll, software, rent, agency fees, prep. These feed the P&L <span className="font-semibold text-gray-600">Allocated Overheads</span> line and each SKU's true net profit.</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cx-600 hover:bg-cx-700 text-white text-[13px] font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Add overhead
        </button>
      </div>

      {/* summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Monthly run-rate</div>
              <div className="text-3xl font-bold text-gray-900 tabular-nums mt-0.5">{fc(runRate, currency, { compact: false })}</div>
              <div className="text-[11px] text-gray-500 mt-1">{fc(runRate * 12, currency, { compact: false })} / year · {live.length} active</div>
            </div>
            <div className="flex gap-4">
              <Stat label="Recurring" value={fc(fixedMonthly, currency, { compact: true })} sub={`${live.filter((e) => e.kind === 'fixed').length} items`} />
              <Stat label="Variable" value={fc(variableMonthly, currency, { compact: true })} sub={`${live.filter((e) => e.kind === 'variable').length} items`} />
              {oneOffs.length > 0 && <Stat label="One-off ahead" value={fc(oneOffTotal, currency, { compact: true })} sub={`${oneOffs.length} planned`} />}
            </div>
          </div>
          {/* category breakdown bar */}
          <div className="mt-4">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
              {byCategory.map((c) => <div key={c.id} style={{ width: `${(c.value / runRate) * 100}%`, backgroundColor: c.color }} title={`${c.label}: ${fc(c.value, currency, { compact: false })}/mo`} />)}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {byCategory.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="font-mono text-gray-400">{c.code}</span> {c.label} · <span className="font-semibold text-gray-700 tabular-nums">{fc(c.value, currency, { compact: true })}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

      {/* toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white">
          {(['all', 'fixed', 'variable'] as KindFilter[]).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-colors ${kind === k ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {k === 'all' ? 'All' : k === 'fixed' ? 'Recurring' : 'Variable'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search overheads…" className="pl-8 pr-3 py-1.5 text-xs w-56 border border-gray-200 rounded-lg focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none" />
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-2.5 min-w-[220px]">Overhead</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">Monthly</th>
                <th className="px-3 py-2.5">Allocation</th>
                <th className="px-3 py-2.5">Effective</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => {
                const c = catOf(e.categoryId); const st = statusOf(e);
                const oneOff = e.kind === 'fixed' && e.frequency === 'one_time';
                const mo = monthlyRunRate(e);
                return (
                  <tr key={e.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${st === 'expired' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-gray-900">{e.name}</div>
                      {e.note && <div className="text-[10px] text-gray-400 mt-0.5">{e.note}</div>}
                    </td>
                    <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} /><span className="text-gray-700">{c.label}</span><span className="text-[9px] text-gray-400 font-mono">{c.code}</span></span></td>
                    <td className="px-3 py-2.5 text-gray-600">{rateText(e, currency)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-900">{oneOff ? <span className="text-gray-400 font-normal">one-off</span> : <span className={st === 'active' ? '' : 'text-gray-400 font-normal'}>{fc(mo, currency, { compact: false })}</span>}</td>
                    <td className="px-3 py-2.5"><span className="text-[11px] text-gray-500">{ALLOCATION_LABEL[e.allocation]}</span></td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(e.startDate)} → {e.endDate ? fmtDate(e.endDate) : 'Forever'}</td>
                    <td className="px-3 py-2.5"><span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ring-1 ring-inset ${STATUS_PILL[st]}`}>{st}</span></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-0.5 text-gray-400">
                        <IconBtn title="Edit" onClick={() => setEditing(e)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
                        <IconBtn title={e.paused ? 'Resume' : 'Pause'} onClick={() => togglePause(e.id)}>{e.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}</IconBtn>
                        <IconBtn title="Duplicate" onClick={() => duplicate(e)}><Copy className="w-3.5 h-3.5" /></IconBtn>
                        <IconBtn title="Delete" onClick={() => remove(e.id)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-[12px]">No overheads match.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400"><Info className="w-3 h-3" /> One-off costs are excluded from the monthly run-rate but still hit the P&L in the month they land.</div>
      </div>

      {(creating || editing) && <OverheadModal entry={editing} onClose={() => { setCreating(false); setEditing(null); }} onSave={save} />}
    </div>
  );
}

function rateText(e: OverheadEntry, currency: Parameters<typeof fc>[1]): string {
  if (e.kind === 'fixed') return `${fc(e.amount ?? 0, currency, { compact: false })} ${FREQ_LABEL[e.frequency ?? 'monthly']}`;
  if (e.basis === 'pct_sales') return `${e.rate ?? 0}% of sales`;
  if (e.basis === 'per_order') return `${fc(e.rate ?? 0, currency, { compact: false, decimals: 2 })} / order`;
  return `${fc(e.rate ?? 0, currency, { compact: false, decimals: 2 })} / unit`;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso: string): string { const [y, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1]} ${y.slice(2)}`; }

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div><div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div><div className="text-base font-bold text-gray-900 tabular-nums mt-0.5">{value}</div><div className="text-[10px] text-gray-400">{sub}</div></div>;
}
function IconBtn({ title, onClick, children, danger }: { title: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return <button title={title} onClick={onClick} className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${danger ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-gray-100 hover:text-gray-700'}`}>{children}</button>;
}
