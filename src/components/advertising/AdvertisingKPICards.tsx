import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { advertisingKpiData } from '../../data/advertisingData';
import InfoTooltip from '../InfoTooltip';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdvertisingKPICards() {
  const { currency } = useCurrency();
  return (
    <div className="grid grid-cols-4 gap-3">
      {advertisingKpiData.map((kpi, idx) => (
        <KPICard key={kpi.label} kpi={kpi} idx={idx} currency={currency} />
      ))}
    </div>
  );
}

interface KPICardProps {
  kpi: (typeof advertisingKpiData)[number];
  idx: number;
  currency: import('../../contexts/CurrencyContext').Currency;
}

function KPICard({ kpi, idx, currency }: KPICardProps) {
  const isPositive = kpi.popPositive;
  const sparkData = kpi.sparkline.map((v, i) => ({
    v,
    label: MONTHS[MONTHS.length - kpi.sparkline.length + i] ?? `P${i + 1}`,
  }));
  const sparkFillId = `adSparkFill-${idx}`;

  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
  const strokeColor = isPositive ? '#166534' : '#991B1B';
  const fillColorStart = isPositive ? '#166534' : '#991B1B';
  const labelColor = isPositive ? 'text-green-700/70' : 'text-red-700/70';
  const valueColor = isPositive ? 'text-green-900' : 'text-red-900';
  const borderColor = isPositive
    ? 'border-green-200/60 hover:border-green-300'
    : 'border-red-200/60 hover:border-red-300';

  const minVal = Math.min(...kpi.sparkline);
  const maxVal = Math.max(...kpi.sparkline);
  const padding = (maxVal - minVal) * 0.1;

  return (
    <div
      className={`${bgColor} rounded-xl border ${borderColor} p-4 pb-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${labelColor}`}>
          {kpi.label}
        </p>
        <InfoTooltip />
      </div>

      <div className="flex items-center justify-center my-1">
        <span className={`text-xl font-extrabold tracking-tight ${valueColor}`}>{kpi.rawValue != null ? fc(kpi.rawValue, currency) : kpi.value}</span>
      </div>

      <div className="flex-1 min-h-[48px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={sparkFillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColorStart} stopOpacity={0.2} />
                <stop offset="100%" stopColor={fillColorStart} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={[minVal - padding, maxVal + padding]} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
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
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-black/5">
        <ChangeRow label="PoP" value={kpi.popChange} positive={kpi.popPositive} />
        <ChangeRow label="Diff. LY" value={kpi.lyChange} positive={kpi.lyPositive} />
      </div>
    </div>
  );
}

function ChangeRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: number;
  positive: boolean;
}) {
  const color = positive ? 'text-green-800' : 'text-red-800';
  const Icon = positive ? TrendingUp : TrendingDown;
  const prefix = value > 0 ? '+' : '';

  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-medium text-gray-500 uppercase">{label}</span>
      <Icon className={`w-3 h-3 ${color}`} />
      <span className={`text-[11px] font-semibold ${color}`}>
        {prefix}
        {value.toFixed(2)}%
      </span>
    </div>
  );
}
