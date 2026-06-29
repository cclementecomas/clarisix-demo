// ─── Advertising Overview — KPI Groups by decision area ───────────────────
// Group headers (Growth / Efficiency / Traffic quality / Business dependency)
// rendered on top of the rich KPI card visual (colored background +
// sparkline + PoP/LY rows) shared with the Home page.
//
// Polarity override: for lower-is-better metrics (ACOS, TACOS, CPC, CPA,
// TCPA), the data's `popPositive` flag (which is sign-based) is recomputed
// so the card colors and arrows reflect *good vs bad* rather than *up vs
// down*.

import { TrendingDown, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import InfoTooltip from '../InfoTooltip';
import { advertisingKpiData, type AdvertisingKPI } from '../../data/advertisingData';
import { useCurrency, type Currency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Polarity = 'higher' | 'lower' | 'neutral';

const KPI_POLARITY: Record<string, Polarity> = {
  // Growth
  'Ad Sales':            'higher',
  'Orders':              'higher',
  'Clicks':              'higher',
  'Impressions':         'higher',
  // Efficiency (lower = better)
  'ACOS':                'lower',
  'TACOS':               'lower',
  'CPA':                 'lower',
  'TCPA':                'lower',
  // Traffic quality
  'CTR':                 'higher',
  'CPC':                 'lower',
  'Ads Conversion Rate': 'higher',
  // Spend is context-dependent
  'Ad Spend':            'neutral',
};

const KPI_TOOLTIPS: Record<string, string> = {
  'Ad Sales': 'Sales attributed to ad clicks within the attribution window.',
  'Ad Spend': 'Total spend across all ad campaigns (SP, SB, SD).',
  'ACOS': 'Ad spend ÷ ad-attributed sales. Lower is better.',
  'TACOS': 'Ad spend ÷ total sales (organic + paid). Lower is better.',
  'CPC': 'Cost per click. Lower is generally better.',
  'CPA': 'Cost per ad-attributed order. Lower is better.',
  'TCPA': 'Ad spend ÷ total orders (blended). Lower is better.',
  'Ads Conversion Rate': 'Ad clicks that converted to a purchase.',
  'Impressions': 'Total ad impressions.',
  'Clicks': 'Total ad clicks.',
  'CTR': 'Click-through rate — clicks ÷ impressions.',
  'Orders': 'Total ad-attributed orders.',
};

const GROUPS: { id: string; label: string; description: string; kpis: string[] }[] = [
  { id: 'growth',     label: 'Growth',             description: 'Top-of-funnel volume',                      kpis: ['Ad Sales', 'Orders', 'Clicks', 'Impressions'] },
  { id: 'efficiency', label: 'Efficiency',          description: 'Cost-to-sales ratios',                    kpis: ['ACOS', 'TACOS', 'CPA', 'TCPA'] },
  { id: 'quality',    label: 'Traffic quality',     description: 'Click-through and conversion',              kpis: ['CTR', 'CPC', 'Ads Conversion Rate'] },
  { id: 'dependency', label: 'Business dependency', description: 'Coming in a later batch',                    kpis: ['Ad Spend'] },
];

/** Polarity-aware re-computation of the "is this change good?" boolean.
 *  For neutral metrics (Ad Spend), defaults to whatever the data ships
 *  with so the home-page convention is preserved. */
function isGood(change: number, polarity: Polarity, fallback: boolean): boolean {
  if (polarity === 'neutral') return fallback;
  return polarity === 'higher' ? change > 0 : change < 0;
}

export default function AdvertisingKPIGroups() {
  const { currency } = useCurrency();
  return (
    <div className="space-y-3">
      {GROUPS.map((g) => {
        const cards = g.kpis
          .map((label) => advertisingKpiData.find((k) => k.label === label))
          .filter((k): k is AdvertisingKPI => !!k);
        if (cards.length === 0) return null;
        return (
          <div key={g.id}>
            <div className="flex items-baseline gap-2 mb-1.5 px-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700">{g.label}</h3>
              <span className="text-[10px] text-gray-400">{g.description}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cards.map((kpi, i) => <KPICard key={kpi.label} kpi={kpi} idx={i} currency={currency} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KPICardProps {
  kpi: AdvertisingKPI;
  idx: number;
  currency: Currency;
}

function KPICard({ kpi, idx, currency }: KPICardProps) {
  const polarity = KPI_POLARITY[kpi.label] ?? 'higher';
  // Override the data's sign-based positive flag with a polarity-aware one.
  const popGood = isGood(kpi.popChange, polarity, kpi.popPositive);
  const lyGood  = isGood(kpi.lyChange,  polarity, kpi.lyPositive);
  // Card-level tone follows the PoP read (recent direction matters more).
  const isPositive = polarity === 'neutral' ? kpi.cardPositive : popGood;

  const sparkData = kpi.sparkline.map((v, i) => ({
    v,
    label: MONTHS[MONTHS.length - kpi.sparkline.length + i] ?? `P${i + 1}`,
  }));
  const sparkFillId = `adGroupSparkFill-${idx}-${kpi.label.replace(/\s+/g, '')}`;

  const bgColor       = isPositive ? 'bg-green-50' : 'bg-red-50';
  const strokeColor   = isPositive ? '#166534' : '#991B1B';
  const fillStart     = isPositive ? '#166534' : '#991B1B';
  const labelColor    = isPositive ? 'text-green-700/70' : 'text-red-700/70';
  const valueColor    = isPositive ? 'text-green-900' : 'text-red-900';
  const borderColor   = isPositive ? 'border-green-200/60 hover:border-green-300' : 'border-red-200/60 hover:border-red-300';

  const minVal = Math.min(...kpi.sparkline);
  const maxVal = Math.max(...kpi.sparkline);
  const padding = (maxVal - minVal) * 0.1;

  return (
    <div className={`${bgColor} rounded-xl border ${borderColor} p-4 pb-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${labelColor}`}>{kpi.label}</p>
        {KPI_TOOLTIPS[kpi.label] && <InfoTooltip content={KPI_TOOLTIPS[kpi.label]} />}
      </div>

      <div className="flex items-center justify-center my-1">
        <span className={`text-xl font-extrabold tracking-tight ${valueColor}`}>
          {kpi.rawValue != null ? fc(kpi.rawValue, currency) : kpi.value}
        </span>
      </div>

      <div className="flex-1 min-h-[48px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={sparkFillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={fillStart} stopOpacity={0.2} />
                <stop offset="100%" stopColor={fillStart} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={[minVal - padding, maxVal + padding]} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { v: number; label: string };
                return (
                  <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                    <span className="font-medium">{d.label}</span>
                    <span className="ml-1.5 font-semibold">{d.v.toLocaleString()}</span>
                  </div>
                );
              }}
              cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${sparkFillId})`}
              dot={false}
              activeDot={{ r: 3, fill: strokeColor, stroke: '#fff', strokeWidth: 1.5 }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-black/5">
        <ChangeRow label="PoP"     value={kpi.popChange} good={popGood} />
        <ChangeRow label="Diff. LY" value={kpi.lyChange}  good={lyGood} />
      </div>
    </div>
  );
}

function ChangeRow({ label, value, good }: { label: string; value: number; good: boolean }) {
  const color = good ? 'text-green-800' : 'text-red-800';
  // Arrow follows the direction of the number, not polarity, so the user
  // can read direction at a glance and color tells them whether it's good.
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  const prefix = value > 0 ? '+' : '';
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-medium text-gray-500 uppercase">{label}</span>
      <Icon className={`w-3 h-3 ${color}`} />
      <span className={`text-[11px] font-semibold ${color}`}>{prefix}{value.toFixed(2)}%</span>
    </div>
  );
}
