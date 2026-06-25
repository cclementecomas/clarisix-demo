// ─── Prime Day Recap ─────────────────────────────────────────────────────────
// Year-over-year recap built to the platform's best-page visual standard
// (Sales Overview / Home): executive hero with driver + watchout, recharts
// day-split, a contribution-to-growth view, bullet-bar top movers (this year vs
// last year), deal effectiveness and inventory. Principal views export as
// branded PNGs (ShareMenu), like the Home Period Snapshot.

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList,
} from 'recharts';
import {
  Zap, TrendingUp, AlertTriangle, Package, Clock, Coins, Users, Percent,
} from 'lucide-react';
import { useCurrency, type Currency } from '../contexts/CurrencyContext';
import { fc, tickFmt } from '../utils/currency';
import {
  primeDayMeta, primeDayMetrics, primeDayRevenue, primeDayMovers,
  primeDayDays, primeDayPeak,
  metricChange, fmtMetricValue, pctDelta,
  type YoYMetric, type MoverRow,
} from '../data/primeDayData';
import ShareMenu from './ShareMenu';
import { buildSummaryCanvas, buildMoversCanvas } from '../utils/primeDayShare';

const byKey = new Map(primeDayMetrics.map((m) => [m.key, m]));
const TY = '#0E5A8A';   // this year (brand)
const LY = '#CBD5E1';   // last year (slate)

// ── Small shared atoms ──────────────────────────────────────────────────────

function Card({ title, tooltip, action, children, className = '' }: {
  title?: string; tooltip?: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</h2>
            {tooltip && <span className="text-[10px] text-gray-300" title={tooltip}>ⓘ</span>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function DeltaText({ m }: { m: YoYMetric }) {
  const ch = metricChange(m);
  const cls = ch.positive === null ? 'text-gray-500' : ch.positive ? 'text-emerald-700' : 'text-rose-700';
  return <span className={`tabular-nums font-bold ${cls}`}>{ch.deltaText}</span>;
}

// ── Recharts day-split tooltip ───────────────────────────────────────────────

function dayTooltip(currency: Currency) {
  return function DayTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg text-xs shadow-xl min-w-[180px]">
        <p className="font-semibold mb-2 text-sm">{label}</p>
        {payload.map((e) => (
          <p key={e.name} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: e.color }} />{e.name}</span>
            <span className="font-medium">{fc(e.value, currency)}</span>
          </p>
        ))}
      </div>
    );
  };
}

// ── Bullet bar (this-year bar + last-year marker), the Breakdown pattern ──────

function MoverBullet({ row, maxValue, currency, rank }: { row: MoverRow; maxValue: number; currency: Currency; rank: number }) {
  const [hover, setHover] = useState(false);
  const change = row.thisYearRev - row.lastYearRev;
  const pct = pctDelta(row.thisYearRev, row.lastYearRev);
  const curPct = (row.thisYearRev / maxValue) * 100;
  const prevPct = (row.lastYearRev / maxValue) * 100;
  const up = change >= 0;
  return (
    <div className="group relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-gray-300 w-3 flex-shrink-0 text-right">{rank}</span>
        <div className="w-[120px] shrink-0">
          <div className="text-[11px] font-semibold text-gray-700 leading-tight truncate" title={row.name}>{row.name}</div>
          {row.sublabel && <div className="text-[9px] text-gray-400 leading-tight truncate">{row.sublabel}</div>}
        </div>
        <div className="relative flex-1 h-[18px] bg-gray-50 rounded-sm overflow-visible min-w-0">
          <div className="absolute inset-y-0 left-0 rounded-sm transition-all duration-300" style={{ width: `${curPct}%`, backgroundColor: `rgba(14,90,138,${1 - rank * 0.07})` }} />
          <div className="absolute top-[2px] bottom-[2px] w-[3px] rounded-full bg-gray-800/50" style={{ left: `calc(${prevPct}% - 1.5px)` }} />
        </div>
        <span className="text-[11px] text-gray-500 w-12 text-right shrink-0 tabular-nums font-medium">{fc(row.thisYearRev, currency)}</span>
        <span className={`text-[10px] font-semibold w-14 text-right shrink-0 tabular-nums ${up ? 'text-emerald-700' : 'text-rose-700'}`}>{up ? '+' : '−'}{fc(Math.abs(change), currency)}</span>
        <span className={`text-[10px] font-bold w-12 text-right shrink-0 tabular-nums ${up ? 'text-emerald-700' : 'text-rose-700'}`}>{up ? '+' : ''}{pct.toFixed(1)}%</span>
      </div>
      {hover && (
        <div className="absolute z-20 left-[140px] -top-[58px] bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl pointer-events-none whitespace-nowrap">
          <p className="font-medium mb-1">{row.name}</p>
          <div className="flex items-center gap-3">
            <span className="text-cx-300 font-semibold">{fc(row.thisYearRev, currency, { compact: false })}</span>
            <span className="text-gray-400">LY {fc(row.lastYearRev, currency, { compact: false })}</span>
            <span className={`font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>{up ? '+' : ''}{pct.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrimeDayRecap() {
  const { currency } = useCurrency();
  const [dimIdx, setDimIdx] = useState(0);
  const dim = primeDayMovers[dimIdx];

  const rev = primeDayRevenue;
  const revPct = pctDelta(rev.thisYear, rev.lastYear);
  const revAbs = rev.thisYear - rev.lastYear;

  const units = byKey.get('units')!;
  const ntb = byKey.get('ntb')!;
  const margin = byKey.get('margin')!;

  // Day split chart data + YoY total
  const dayData = useMemo(() => primeDayDays.map((d) => ({ label: d.label, [primeDayMeta.lastYearLabel]: d.lastYear, [primeDayMeta.thisYearLabel]: d.thisYear })), []);
  const DayTip = dayTooltip(currency);

  // Contribution-to-growth (by category, € delta)
  const categories = primeDayMovers.find((d) => d.key === 'category')!.rows;
  const contrib = useMemo(() => {
    const rows = categories.map((r) => ({ name: r.name, delta: r.thisYearRev - r.lastYearRev }))
      .filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta);
    const total = rows.reduce((s, r) => s + r.delta, 0) || 1;
    const max = Math.max(...rows.map((r) => r.delta), 1);
    return { rows, total, max };
  }, [categories]);

  // Movers — sorted by growth, with shared max for bar scaling
  const moverRows = useMemo(() => [...dim.rows].sort((a, b) => pctDelta(b.thisYearRev, b.lastYearRev) - pctDelta(a.thisYearRev, a.lastYearRev)), [dim]);
  const moverMax = Math.max(...dim.rows.map((r) => Math.max(r.thisYearRev, r.lastYearRev))) * 1.06;

  const shareFile = (v: string) => `clarisix-prime-day-${v}-${new Date().toISOString().slice(0, 10)}.png`;

  return (
    <div className="space-y-5">
      {/* ── Executive hero ── */}
      <div className="relative bg-gradient-to-br from-cx-50 via-white to-amber-50/40 rounded-2xl border-2 border-cx-200 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cx-500 via-amber-500 to-cx-500" />
        <div className="px-6 py-5">
          <div className="flex items-start gap-6 flex-wrap lg:flex-nowrap">
            {/* Headline */}
            <div className="flex items-start gap-3 min-w-[300px] flex-1">
              <div className="w-10 h-10 rounded-lg bg-cx-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-cx-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cx-700">Prime Day Recap</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> New
                  </span>
                  <span className="text-[11px] text-gray-400">{primeDayMeta.thisYearDates} vs {primeDayMeta.lastYearDates}</span>
                </div>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-[34px] font-extrabold text-gray-900 leading-none tabular-nums">{fmtMetricValue('currency', rev.thisYear, currency)}</span>
                  <span className="text-base font-bold text-emerald-700 inline-flex items-center gap-0.5"><TrendingUp className="w-4 h-4" />+{revPct.toFixed(1)}%</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1.5 tabular-nums">
                  +{fc(revAbs, currency, { compact: true })} YoY · {primeDayMeta.thisYearLabel} vs {primeDayMeta.lastYearLabel}
                </div>
              </div>
            </div>

            {/* Metric tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-shrink-0">
              <HeroTile label="Revenue" value={fmtMetricValue('currency', rev.thisYear, currency)} m={byKey.get('revenue')!} icon={<Coins className="w-3.5 h-3.5 text-amber-600" />} lastYear={fmtMetricValue('currency', rev.lastYear, currency)} />
              <HeroTile label="Units" value={fmtMetricValue('number', units.thisYear, currency)} m={units} icon={<Package className="w-3.5 h-3.5 text-cx-600" />} lastYear={fmtMetricValue('number', units.lastYear, currency)} />
              <HeroTile label="New-to-brand" value={`${ntb.thisYear}%`} m={ntb} icon={<Users className="w-3.5 h-3.5 text-emerald-600" />} lastYear={`${ntb.lastYear}%`} />
              <HeroTile label="Gross margin" value={`${margin.thisYear}%`} m={margin} icon={<Percent className="w-3.5 h-3.5 text-rose-600" />} lastYear={`${margin.lastYear}%`} />
            </div>

            <div className="flex-shrink-0 self-start">
              <ShareMenu build={() => buildSummaryCanvas(currency)} filename={shareFile('recap')} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Revenue by day + contribution to growth ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Revenue by event day" tooltip="Revenue per Prime Day, this year vs last year."
          action={<span className="text-[11px] font-semibold text-emerald-700 tabular-nums">+{revPct.toFixed(1)}% YoY · +{fc(revAbs, currency, { compact: true })}</span>}>
          <div className="px-6 pb-3">
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#93A4B8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#93A4B8', fontSize: 11 }} tickFormatter={tickFmt(currency)} width={52} />
                  <Tooltip content={<DayTip />} cursor={{ fill: 'rgba(14,90,138,0.04)' }} />
                  <Legend content={<MiniLegend />} />
                  <Bar dataKey={primeDayMeta.lastYearLabel} fill={LY} radius={[3, 3, 0, 0]} maxBarSize={48} />
                  <Bar dataKey={primeDayMeta.thisYearLabel} fill={TY} radius={[3, 3, 0, 0]} maxBarSize={48}>
                    <LabelList dataKey={primeDayMeta.thisYearLabel} position="top" formatter={(v: number) => fc(v, currency, { compact: true })} style={{ fill: '#1e293b', fontSize: 10, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />Peak <span className="font-semibold text-gray-700">{primeDayPeak.window}</span> · {fc(primeDayPeak.revenue, currency, { compact: true })}
            </div>
          </div>
        </Card>

        <Card title="Where the growth came from" tooltip="Each category's € contribution to the YoY revenue gain.">
          <div className="px-6 pb-5">
            <div className="space-y-2.5 mt-3">
              {contrib.rows.map((r) => {
                const share = (r.delta / contrib.total) * 100;
                return (
                  <div key={r.name} className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-600 w-[120px] truncate text-right shrink-0">{r.name}</span>
                    <div className="relative flex-1 h-[16px] bg-gray-50 rounded-sm min-w-0">
                      <div className="absolute inset-y-0 left-0 rounded-sm bg-emerald-500/85" style={{ width: `${(r.delta / contrib.max) * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 w-14 text-right shrink-0 tabular-nums">+{fc(r.delta, currency, { compact: true })}</span>
                    <span className="text-[10px] font-medium text-gray-400 w-10 text-right shrink-0 tabular-nums">{share.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* ── YoY KPI comparison ── */}
      <Card title="This year vs last year"
        action={<ShareMenu build={() => buildSummaryCanvas(currency)} filename={shareFile('kpis')} />}>
        <div className="px-6 pb-3 -mt-1 text-[11px] text-gray-400">{primeDayMeta.thisYearLabel} compared with {primeDayMeta.lastYearLabel}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-2">Metric</th>
                <th className="px-3 py-2 text-right">{primeDayMeta.thisYearLabel}</th>
                <th className="px-3 py-2 text-right">{primeDayMeta.lastYearLabel}</th>
                <th className="px-6 py-2 text-right">YoY</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => <GroupBlock key={g.id} group={g} currency={currency} />)}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Top movers ── */}
      <Card>
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Top movers · {dim.label}</h2>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {primeDayMovers.map((d, i) => (
                <button key={d.key} onClick={() => setDimIdx(i)} className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${dimIdx === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{d.label}</button>
              ))}
            </div>
          </div>
          <ShareMenu build={() => buildMoversCanvas(dim, currency)} filename={shareFile(`movers-${dim.key}`)} />
        </div>

        <div className="px-6 pb-5">
          {/* header labels */}
          <div className="flex items-center gap-2 mt-4 mb-2">
            <span className="w-3 shrink-0" /><span className="w-[120px] shrink-0" /><span className="flex-1" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 w-12 text-right shrink-0">Rev '26</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 w-14 text-right shrink-0">Δ €</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-cx-600 w-12 text-right shrink-0">Growth</span>
          </div>
          <div className="space-y-[10px]">
            {moverRows.map((r, i) => <MoverBullet key={r.name} row={r} maxValue={moverMax} currency={currency} rank={i + 1} />)}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-5">
            <div className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-cx-500 inline-block" /><span className="text-[10px] text-gray-400 font-medium">{primeDayMeta.thisYearLabel}</span></div>
            <div className="flex items-center gap-1.5"><span className="w-[3px] h-3 rounded-full bg-gray-800/50 inline-block" /><span className="text-[10px] text-gray-400 font-medium">{primeDayMeta.lastYearLabel}</span></div>
          </div>
        </div>
      </Card>

    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

const GROUPS: { id: string; label: string; keys: string[]; caveat?: boolean }[] = [
  { id: 'demand', label: 'Demand & volume', keys: ['units', 'orders', 'aov', 'glance', 'cvr'] },
  { id: 'ad', label: 'Advertising', keys: ['adSpend', 'adSales', 'acos', 'roas', 'tacos'], caveat: true },
  { id: 'profit', label: 'Customer & margin', keys: ['ntb', 'discount', 'margin'] },
];

function HeroTile({ label, value, m, icon, lastYear }: { label: string; value: string; m: YoYMetric; icon: React.ReactNode; lastYear: string }) {
  return (
    <div className="rounded-lg border border-cx-100 bg-white/80 px-3 py-2 min-w-[118px]">
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">{icon}{label}</div>
      <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight mt-1">{value}</div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <DeltaText m={m} />
        <span className="text-[10px] text-gray-400">LY {lastYear}</span>
      </div>
    </div>
  );
}

function GroupBlock({ group, currency }: { group: { id: string; label: string; keys: string[]; caveat?: boolean }; currency: Currency }) {
  return (
    <>
      <tr className="bg-gray-50/50">
        <td colSpan={4} className="px-6 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{group.label}</span>
            {group.caveat && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700"><Clock className="w-3 h-3" /> attribution still settling — provisional</span>}
          </div>
        </td>
      </tr>
      {group.caveat && (
        <tr><td colSpan={4} className="px-6 pb-2">
          <div className="flex items-start gap-2 rounded-md bg-amber-50/70 border border-amber-100 px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-snug">{primeDayMeta.attributionNote}</p>
          </div>
        </td></tr>
      )}
      {group.keys.map((k) => {
        const m = byKey.get(k);
        if (!m) return null;
        return (
          <tr key={k} className="border-b border-gray-50 hover:bg-gray-50/40">
            <td className="px-6 py-2 font-medium text-gray-800">{m.label}</td>
            <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-900">{fmtMetricValue(m.unit, m.thisYear, currency)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-gray-500">{fmtMetricValue(m.unit, m.lastYear, currency)}</td>
            <td className="px-6 py-2 text-right"><DeltaText m={m} /></td>
          </tr>
        );
      })}
    </>
  );
}

function MiniLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-5 mt-1">
      {payload.map((e) => (
        <div key={e.value} className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: e.color }} />{e.value}
        </div>
      ))}
    </div>
  );
}

