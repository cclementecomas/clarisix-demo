// ─── Advertising Overview — Compact Performance Scorecard ────────────────
// One row per group: Status (with the reason on the chip) · Main readout
// · Main driver · Watchout. "Show all metrics" expands the rich KPI grid.

import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react';
import AdvertisingKPIGroups from './AdvertisingKPIGroups';
import { advertisingKpiData, type AdvertisingKPI } from '../../data/advertisingData';

type Polarity = 'higher' | 'lower' | 'neutral';
type Status = 'good' | 'watch' | 'risk' | 'neutral';

const KPI_POLARITY: Record<string, Polarity> = {
  'Ad Sales': 'higher', 'Orders': 'higher', 'Clicks': 'higher', 'Impressions': 'higher',
  'ACOS': 'lower', 'TACOS': 'lower', 'CPA': 'lower', 'TCPA': 'lower',
  'CTR': 'higher', 'CPC': 'lower', 'Ads Conversion Rate': 'higher',
  'Ad Spend': 'neutral',
};

interface GroupDef {
  id: string;
  label: string;
  description: string;
  mainKpi: string;
  driverKpi: string | null;
  /** KPIs to scan when looking for a "watchout" — typically a member
   *  of the group whose direction conflicts with the main read. */
  watchKpis: string[];
}

const GROUPS: GroupDef[] = [
  {
    id: 'growth', label: 'Growth', description: 'Top-of-funnel volume',
    mainKpi: 'Ad Sales',
    driverKpi: 'Orders',
    watchKpis: ['Impressions', 'Clicks'],
  },
  {
    id: 'spend', label: 'Spend', description: 'How much we\'re putting to work',
    mainKpi: 'Ad Spend',
    driverKpi: null,
    watchKpis: [],
  },
  {
    id: 'efficiency', label: 'Efficiency', description: 'Cost-to-sales ratios',
    mainKpi: 'ACOS',
    driverKpi: 'CPA',
    watchKpis: ['TACOS', 'TCPA'],
  },
  {
    id: 'quality', label: 'Traffic quality', description: 'Click-through and conversion',
    mainKpi: 'Ads Conversion Rate',
    driverKpi: 'CTR',
    watchKpis: ['CPC'],
  },
];

function isGood(kpi: AdvertisingKPI): boolean | null {
  const p = KPI_POLARITY[kpi.label] ?? 'higher';
  if (p === 'neutral') return null;
  return p === 'higher' ? kpi.popChange > 0 : kpi.popChange < 0;
}

function kpiStatus(kpi: AdvertisingKPI): Status {
  const good = isGood(kpi);
  if (good === null) return 'neutral';
  const mag = Math.abs(kpi.popChange);
  if (mag < 1) return 'neutral';
  if (good) return 'good';
  return mag >= 5 ? 'risk' : 'watch';
}

/** Per-group status = the worst status among its main KPI and watch KPIs. */
function groupStatusFor(main: AdvertisingKPI, watches: AdvertisingKPI[]): Status {
  const list = [main, ...watches].map(kpiStatus);
  if (list.includes('risk')) return 'risk';
  if (list.includes('watch')) return 'watch';
  if (list.some((s) => s === 'good')) return 'good';
  return 'neutral';
}

/** Returns the worst-direction KPI in `watches`, or null if all are healthy. */
function findWatchout(watches: AdvertisingKPI[]): AdvertisingKPI | null {
  const candidates = watches
    .map((k) => ({ k, status: kpiStatus(k) }))
    .filter((x) => x.status === 'risk' || x.status === 'watch')
    .sort((a, b) => Math.abs(b.k.popChange) - Math.abs(a.k.popChange));
  return candidates[0]?.k ?? null;
}

/** Build the "Watch: X declined Y% PoP" line that sits next to the status chip. */
function statusReason(status: Status, main: AdvertisingKPI, watchKpi: AdvertisingKPI | null): string {
  if (status === 'good') return `${main.label} ${formatPct(main.popChange)} PoP`;
  if (status === 'neutral') return `${main.label} stable`;
  const k = watchKpi ?? main;
  const direction = isGood(k) ? 'improved' : 'declined';
  return `${k.label} ${direction} ${formatPct(k.popChange)} PoP`;
}

function formatPct(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

const STATUS_CHIP: Record<Status, { label: string; cls: string; dot: string }> = {
  good:    { label: 'Healthy',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  watch:   { label: 'Watch',    cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  risk:    { label: 'At risk',  cls: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500'    },
  neutral: { label: 'Stable',   cls: 'bg-slate-50 text-slate-700 border-slate-200',       dot: 'bg-slate-400'   },
};

export default function AdvertisingScorecard() {
  const [showAll, setShowAll] = useState(false);
  const byLabel = new Map(advertisingKpiData.map((k) => [k.label, k]));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Performance scorecard</h3>
          <span className="text-[10px] text-gray-400">Status · main readout · driver · watchout — all PoP</span>
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-cx-700 bg-cx-50 hover:bg-cx-100 transition-colors"
        >
          {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showAll ? 'Hide all metrics' : 'Show all metrics'}
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {GROUPS.map((g) => {
          const main = byLabel.get(g.mainKpi);
          if (!main) return null;
          const driver = g.driverKpi ? byLabel.get(g.driverKpi) ?? null : null;
          const watches = g.watchKpis.map((l) => byLabel.get(l)).filter((k): k is AdvertisingKPI => !!k);
          const status = groupStatusFor(main, watches);
          const watchKpi = findWatchout(watches);
          const chip = STATUS_CHIP[status];
          const reasonText = statusReason(status, main, watchKpi);
          return (
            <ScorecardRow
              key={g.id}
              groupLabel={g.label}
              groupDescription={g.description}
              statusLabel={chip.label}
              statusReason={reasonText}
              statusClass={chip.cls}
              statusDot={chip.dot}
              main={main}
              driver={driver}
              watchKpi={status === 'good' || status === 'neutral' ? null : watchKpi}
            />
          );
        })}
      </div>

      {showAll && (
        <div className="border-t border-gray-100 p-4">
          <AdvertisingKPIGroups />
        </div>
      )}
    </div>
  );
}

function ScorecardRow({
  groupLabel, groupDescription, statusLabel, statusReason, statusClass, statusDot,
  main, driver, watchKpi,
}: {
  groupLabel: string;
  groupDescription: string;
  statusLabel: string;
  statusReason: string;
  statusClass: string;
  statusDot: string;
  main: AdvertisingKPI;
  driver: AdvertisingKPI | null;
  watchKpi: AdvertisingKPI | null;
}) {
  return (
    <div className="px-5 py-3 flex items-start gap-4 flex-wrap lg:flex-nowrap">
      {/* Group label + status chip */}
      <div className="min-w-[180px] flex-shrink-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700">{groupLabel}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{groupDescription}</div>
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[10px] font-bold border ${statusClass}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>
          <span className="text-[10px] text-gray-500">{statusReason}</span>
        </div>
      </div>

      {/* Main readout */}
      <Readout label="Main" kpi={main} />

      {/* Driver */}
      {driver
        ? <Readout label="Driver" kpi={driver} muted />
        : <div className="min-w-[160px] flex-shrink-0" />}

      {/* Watchout — only render when meaningful */}
      {watchKpi
        ? <Readout label="Watchout" kpi={watchKpi} watch />
        : <div className="hidden lg:block min-w-[160px] flex-shrink-0" />}
    </div>
  );
}

function Readout({ label, kpi, muted, watch }: {
  label: string;
  kpi: AdvertisingKPI;
  muted?: boolean;
  watch?: boolean;
}) {
  const polarity = KPI_POLARITY[kpi.label] ?? 'higher';
  const good = polarity === 'neutral' ? null : polarity === 'higher' ? kpi.popChange > 0 : kpi.popChange < 0;
  const popColor = kpi.popChange === 0 || polarity === 'neutral'
    ? 'text-gray-500'
    : good ? 'text-emerald-700' : 'text-rose-700';
  const labelClass = watch ? 'text-amber-700' : muted ? 'text-gray-500' : 'text-gray-500';
  const Arrow = kpi.popChange >= 0 ? TrendingUp : TrendingDown;
  return (
    <div className="min-w-[160px] flex-shrink-0">
      <div className={`text-[9px] font-bold uppercase tracking-wider ${labelClass}`}>{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-[11px] font-semibold text-gray-700">{kpi.label}</span>
        <span className="text-[13px] font-bold text-gray-900 tabular-nums">{kpi.value}</span>
      </div>
      <div className={`text-[10px] font-semibold tabular-nums inline-flex items-center gap-0.5 mt-0.5 ${popColor}`}>
        <Arrow className="w-2.5 h-2.5" />
        {kpi.popChange > 0 ? '+' : ''}{kpi.popChange.toFixed(1)}% PoP
      </div>
    </div>
  );
}
