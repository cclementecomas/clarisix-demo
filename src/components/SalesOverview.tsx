import { useMemo, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Customized, LabelList, ReferenceArea, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { salesOverviewByGranularity, type Granularity, type SalesDataPoint } from '../data/dashboardData';
import { organicAdInsight, organicGrowthPct, adGrowthPct, adDependencyPct } from '../data/salesOverviewInsights';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';
import { useCurrency, type Currency } from '../contexts/CurrencyContext';
import { fc, tickFmt } from '../utils/currency';

// Plausible PoP / LY deltas per granularity for demo. Real implementation
// would fetch the prior comparable period and YoY-aligned period from the
// same source as the data already shown.
const COMPARISON_BY_GRANULARITY: Record<Granularity, { popPct: number; lyPct: number }> = {
  day:     { popPct:  4.2, lyPct: 18.7 },
  week:    { popPct:  5.1, lyPct: 21.3 },
  month:   { popPct:  7.3, lyPct: 24.1 },
  quarter: { popPct: 12.4, lyPct: 28.6 },
};

function ChangeChip({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  const color = positive ? 'text-green-800' : 'text-red-800';
  const Icon = positive ? TrendingUp : TrendingDown;
  const prefix = value > 0 ? '+' : '';
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-medium text-gray-500 uppercase">{label}</span>
      <Icon className={`w-3 h-3 ${color}`} />
      <span className={`text-[11px] font-semibold ${color}`}>
        {prefix}{value.toFixed(2)}%
      </span>
    </div>
  );
}

const granularityOptions: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

function createCustomTooltip(currency: Currency, overlays: OverlayDef[], eventFor: (label: string) => string | undefined) {
  return function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    const bars = payload.filter((e) => e.dataKey === 'organicSales' || e.dataKey === 'adSales');
    const lines = payload.filter((e) => overlays.some((o) => o.key === e.dataKey));
    const total = bars.reduce((sum, e) => sum + e.value, 0);
    const ev = label ? eventFor(label) : undefined;
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg text-xs shadow-xl min-w-[180px]">
        <p className="font-semibold mb-2 text-sm flex items-center gap-2">{label}{ev && <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">{ev}</span>}</p>
        {[...bars].reverse().map((entry) => (
          <p key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />{entry.name}</span>
            <span className="font-medium">{fc(entry.value, currency)} ({total ? ((entry.value / total) * 100).toFixed(0) : 0}%)</span>
          </p>
        ))}
        <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between"><span className="font-medium">Total</span><span className="font-bold">{fc(total, currency)}</span></div>
        {lines.length > 0 && (
          <div className="border-t border-gray-700 mt-2 pt-2 space-y-0.5">
            {lines.map((entry) => { const o = overlays.find((x) => x.key === entry.dataKey)!; return (
              <p key={entry.dataKey} className="flex items-center justify-between gap-4"><span className="flex items-center gap-1.5"><span className="w-3 h-[2px] rounded" style={{ backgroundColor: o.color }} />{o.label}</span><span className="font-medium">{o.fmt(entry.value, currency)}</span></p>); })}
          </div>
        )}
      </div>
    );
  };
}

function CustomBarLabel({ x, y, width, height, value, currency }: { x?: number; y?: number; width?: number; height?: number; value: number; currency: Currency }) {
  if (!x || !y || !width || !height) return null;

  const formattedValue = fc(value, currency);
  const labelY = y + height / 2 + 4;

  if (height < 25) return null;

  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fill="white"
      fontSize={10}
      fontWeight="600"
    >
      {formattedValue}
    </text>
  );
}

function BarTotalLabels({ data, currency, ...chartProps }: { data: SalesDataPoint[]; currency: Currency } & Record<string, any>) {
  const xAxis = chartProps.xAxisMap && (Object.values(chartProps.xAxisMap)[0] as any);
  const yAxis = chartProps.yAxisMap && (Object.values(chartProps.yAxisMap)[0] as any);

  if (!xAxis?.scale || !yAxis?.scale || !data) return null;

  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  const bandwidth = xScale.bandwidth?.() || 0;
  const dense = data.length > 12;

  return (
    <g>
      {data.map((d) => {
        const total = d.adSales + d.organicSales;
        const cx = xScale(d.label) + bandwidth / 2;
        const cy = yScale(total) - 6;
        return (
          <text
            key={d.label}
            x={cx}
            y={cy}
            textAnchor="middle"
            fill="#1e293b"
            fontSize={dense ? 10 : 11}
            fontWeight="700"
          >
            {fc(total, currency, { compact: true })}
          </text>
        );
      })}
    </g>
  );
}

// ── Overlay lines: metrics the user can draw over the bars, each on its own scale ──
type OverlayKey = 'cr' | 'tacos' | 'acos' | 'adSpend' | 'orders' | 'aov' | 'sessions';
interface OverlayDef { key: OverlayKey; label: string; color: string; fmt: (v: number, c: Currency) => string }
const OVERLAYS: OverlayDef[] = [
  { key: 'cr',       label: 'Conversion rate', color: '#0F766E', fmt: (v) => `${v.toFixed(2)}%` },
  { key: 'tacos',    label: 'TACOS',           color: '#D55E00', fmt: (v) => `${v.toFixed(1)}%` },
  { key: 'acos',     label: 'ACOS',            color: '#C68900', fmt: (v) => `${v.toFixed(1)}%` },
  { key: 'adSpend',  label: 'Ad spend',        color: '#64748B', fmt: (v, c) => fc(v, c) },
  { key: 'orders',   label: 'Orders',          color: '#166534', fmt: (v) => Math.round(v).toLocaleString('en-US') },
  { key: 'aov',      label: 'AOV',             color: '#BE123C', fmt: (v, c) => fc(v, c, { compact: false, decimals: 2 }) },
  { key: 'sessions', label: 'Sessions',        color: '#334155', fmt: (v) => Math.round(v).toLocaleString('en-US') },
];

// ── Events, anchored to the x labels of each granularity (a pair = a band, a single = a marker) ──
const SALES_EVENTS: { name: string; anchors: Partial<Record<Granularity, [string, string]>> }[] = [
  { name: 'Black Friday → Cyber Monday', anchors: { day: ['Nov 28', 'Dec 2'], week: ['W48', 'W48'], month: ['Nov', 'Nov'], quarter: ['Q4', 'Q4'] } },
  { name: 'Prime Day', anchors: { month: ['Jul', 'Jul'], quarter: ['Q3', 'Q3'] } },
];
function eventSpans(gran: Granularity, labels: string[]) {
  return SALES_EVENTS.flatMap((e) => { const a = e.anchors[gran]; if (!a) return []; const i1 = labels.indexOf(a[0]), i2 = labels.indexOf(a[1]); return i1 < 0 || i2 < 0 ? [] : [{ name: e.name, x1: a[0], x2: a[1], i1, i2 }]; });
}

// Demo derivation of the overlay metrics from each point (deterministic; a real build reads them from the marts).
function enrich(p: SalesDataPoint, i: number, inEvent: boolean) {
  const total = p.adSales + p.organicSales;
  const roas = 3.1 + 0.35 * Math.sin(i * 0.9);
  const adSpend = p.adSales / roas;
  const cr = 2.9 + 0.5 * Math.sin(i * 0.7) + (inEvent ? 0.9 : 0);
  const aov = 44 + 3 * Math.sin(i * 0.5) - (inEvent ? 3 : 0);
  const orders = total / aov;
  return { ...p, adSpend, tacos: (adSpend / total) * 100, acos: (adSpend / p.adSales) * 100, cr, aov, orders, sessions: orders / (cr / 100) };
}

export default function SalesOverview() {
  const { currency } = useCurrency();
  const [granularity, setGranularity] = useState<Granularity>('month');
  const data = salesOverviewByGranularity[granularity];

  const totalSales = useMemo(
    () => data.reduce((sum, d) => sum + d.adSales + d.organicSales, 0),
    [data]
  );
  const { popPct, lyPct } = COMPARISON_BY_GRANULARITY[granularity];
  // Overlay lines are wired but the picker is withheld for now — default to none.
  const [overlays] = useState<Set<OverlayKey>>(() => new Set<OverlayKey>());
  const spans = useMemo(() => eventSpans(granularity, data.map((d) => d.label)), [granularity, data]);
  const eventFor = (label: string) => { const i = data.findIndex((d) => d.label === label); return spans.find((sp) => i >= sp.i1 && i <= sp.i2)?.name; };
  const chartData = useMemo(() => data.map((p, i) => enrich(p, i, spans.some((sp) => i >= sp.i1 && i <= sp.i2))), [data, spans]);
  const activeOverlays = OVERLAYS.filter((o) => overlays.has(o.key));
  const CustomTooltip = createCustomTooltip(currency, OVERLAYS, eventFor);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex-1 min-w-0">
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales Overview</h2>
            <InfoTooltip content="Stacked bars of organic vs. ad-attributed sales. Use “Lines” to overlay metrics (each on its own scale); sales events are marked on the chart." />
          </div>
          <div className="flex items-baseline gap-4 flex-wrap">
            <p className="text-3xl font-bold text-gray-800 tabular-nums">
              {fc(totalSales, currency, { compact: false, decimals: 0 })}
            </p>
            <div className="flex items-center gap-4">
              <ChangeChip label="PoP" value={popPct} />
              <ChangeChip label="LY" value={lyPct} />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">Total sales</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {granularityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGranularity(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                granularity === opt.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Organic vs ad interpretation strip (Rule 5) */}
      <div className="mb-4 px-3 py-2 rounded-lg bg-slate-50/60 border border-slate-200 flex items-start gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-gray-800 leading-relaxed">
            <span className="font-semibold">So what:</span>{' '}
            <span className="text-gray-700">{organicAdInsight}</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Organic {organicGrowthPct >= 0 ? '+' : ''}{organicGrowthPct}% · Ad sales {adGrowthPct >= 0 ? '+' : ''}{adGrowthPct}% · Ad dependency {adDependencyPct.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 50, right: 10, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#93A4B8', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#93A4B8', fontSize: 11 }} tickFormatter={tickFmt(currency)} width={55} />
            {activeOverlays.map((o) => (
              <YAxis key={o.key} yAxisId={o.key} orientation="right" axisLine={false} tickLine={false} width={46} tickCount={4} domain={[0, 'auto']} tick={{ fill: o.color, fontSize: 10 }} tickFormatter={(v: number) => (['cr', 'tacos', 'acos'].includes(o.key) ? `${Math.round(v * 10) / 10}%` : o.fmt(v, currency))} />
            ))}
            {spans.map((sp) => sp.x1 === sp.x2
              ? <ReferenceLine key={sp.name} x={sp.x1} stroke="#F59E0B" strokeDasharray="4 3" label={{ value: sp.name, position: 'top', fill: '#92400E', fontSize: 10, fontWeight: 700 }} />
              : <ReferenceArea key={sp.name} x1={sp.x1} x2={sp.x2} fill="#FEF3C7" fillOpacity={0.9} label={{ value: sp.name, position: 'insideTop', fill: '#92400E', fontSize: 10, fontWeight: 700 }} />)}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 90, 138, 0.04)' }} />
            <Bar dataKey="organicSales" name="Organic Sales" stackId="sales" fill="#0E5A8A" radius={[0, 0, 0, 0]}>
              <LabelList content={(props: any) => <CustomBarLabel {...props} currency={currency} />} />
            </Bar>
            <Bar dataKey="adSales" name="Ad Sales" stackId="sales" fill="#4B9DCC" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="adSales" content={(props: any) => <CustomBarLabel {...props} currency={currency} />} />
            </Bar>
            <Customized component={(props: any) => <BarTotalLabels {...props} data={data} currency={currency} />} />
            {activeOverlays.map((o) => (
              <Line key={o.key} yAxisId={o.key} type="monotone" dataKey={o.key} name={o.label} stroke={o.color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-5 mt-2 flex-wrap text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#0E5A8A' }} />Organic Sales</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#4B9DCC' }} />Ad Sales</span>
        {activeOverlays.map((o) => <span key={o.key} className="flex items-center gap-1.5"><span className="w-3.5 h-[2px] rounded" style={{ backgroundColor: o.color }} />{o.label}</span>)}
        {spans.map((sp) => <span key={sp.name} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-300" />{sp.name}</span>)}
      </div>
      <div className="flex justify-end mt-3">
        <LastRefreshed offsetMinutes={12} />
      </div>
    </div>
  );
}
