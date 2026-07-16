import { useEffect, useState } from 'react';
import { Check, Loader2, Circle } from 'lucide-react';
import { SYNC_DOMAINS, type ConnectionId } from '../../data/connectionsData';

// Display-only targets for the live counters (rows backfilled + history reach).
const META: Record<string, { rows: number; backfill?: string }> = {
  orders:      { rows: 48210, backfill: 'Jan 2024' },
  finances:    { rows: 12480, backfill: 'Jan 2024' },
  catalog:     { rows: 342 },
  inventory:   { rows: 342 },
  business:    { rows: 9120,  backfill: 'Jan 2024' },
  sqp:         { rows: 26540, backfill: 'Jan 2024' },
  advertising: { rows: 18730, backfill: 'Jan 2024' },
};

const SOURCE_TAG: Record<ConnectionId, { label: string; cls: string }> = {
  sp_api: { label: 'Selling Partner', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  ads:    { label: 'Amazon Ads',      cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
};

export default function SyncCenter({ onDone }: { onDone: () => void }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 150);
    return () => clearInterval(t);
  }, []);

  const rows = SYNC_DOMAINS.map((d, i) => {
    const start = i * 3;                       // stagger each source's start
    const speed = d.historical ? 2.4 : 5.5;    // history backfills slower
    const pct = Math.max(0, Math.min(100, (tick - start) * speed));
    return { d, pct };
  });
  const overall = Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length);
  const doneCount = rows.filter((r) => r.pct >= 100).length;
  const allDone = doneCount === rows.length;

  return (
    <div className="w-full max-w-[640px] mx-auto text-left">
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{overall}%</div>
          <div className="text-[12px] text-gray-500 mt-1">{doneCount} of {rows.length} data sources ready</div>
        </div>
        {!allDone && <div className="text-[11px] text-gray-400 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Updating live…</div>}
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
        <div className="h-full bg-cx-500 transition-all duration-200" style={{ width: `${overall}%` }} />
      </div>
      <p className="text-[11px] text-gray-400 mb-1">Full history typically takes 24–48 hours — you can safely close this tab and we'll email you when it's ready.</p>
      <p className="text-[11px] text-gray-400 mb-5">You won't be charged until every source is fully fetched and validated.</p>

      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white">
        {rows.map(({ d, pct }) => {
          const tag = SOURCE_TAG[d.source];
          const meta = META[d.id];
          const done = pct >= 100;
          const syncing = pct > 0 && pct < 100;
          const loaded = Math.floor((pct / 100) * meta.rows);
          return (
            <div key={d.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-6 flex-shrink-0 flex justify-center">
                {done ? <Check className="w-5 h-5 text-emerald-500" /> : syncing ? <Loader2 className="w-4 h-4 text-cx-500 animate-spin" /> : <Circle className="w-4 h-4 text-gray-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">{d.label}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ring-1 ring-inset ${tag.cls}`}>{tag.label}</span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono truncate">{d.report}</div>
                {!done && (
                  <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden max-w-[280px]">
                    <div className="h-full bg-cx-400 transition-all duration-200" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0 w-32">
                {done ? <div className="text-[11px] font-semibold text-emerald-700">Ready</div>
                  : syncing ? <div className="text-[11px] font-semibold text-cx-600 tabular-nums">{Math.round(pct)}%</div>
                  : <div className="text-[11px] text-gray-400">Queued</div>}
                <div className="text-[9px] text-gray-400 tabular-nums truncate">
                  {done ? `${meta.rows.toLocaleString()} rows`
                    : syncing ? `${loaded.toLocaleString()} rows${d.historical && meta.backfill ? ` · to ${meta.backfill}` : ''}`
                    : (d.historical && meta.backfill ? `history to ${meta.backfill}` : ' ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-5 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 animate-fade-slide-in">
          <div className="flex items-center gap-2 text-emerald-800 min-w-0"><Check className="w-5 h-5 flex-shrink-0" /><span className="text-sm font-semibold">All data loaded &amp; validated — one last step.</span></div>
          <button onClick={onDone} className="flex-shrink-0 px-4 py-2 rounded-lg bg-cx-600 hover:bg-cx-700 text-white text-sm font-semibold">Review your plan →</button>
        </div>
      )}
    </div>
  );
}
