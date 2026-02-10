import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { adSpendRunrateConfig } from '../../data/advertisingData';
import InfoTooltip from '../InfoTooltip';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc, tickFmt } from '../../utils/currency';

const { daysInMonth, currentDay, dailySpend } = adSpendRunrateConfig;

const mtdTotal = dailySpend.reduce((sum, d) => sum + d.spend, 0);
const avgDaily = Math.round(mtdTotal / currentDay);
const projectedEom = Math.round(avgDaily * daysInMonth);

function buildChartData() {
  const data: Array<{ day: number; actual: number | null; projected: number | null }> = [];
  let cumulative = 0;

  for (const d of dailySpend) {
    cumulative += d.spend;
    data.push({ day: d.day, actual: cumulative, projected: null });
  }

  const lastActualCum = cumulative;

  for (let day = currentDay + 1; day <= daysInMonth; day++) {
    data.push({
      day,
      actual: null,
      projected: lastActualCum + avgDaily * (day - currentDay),
    });
  }

  const pivot = data.find((d) => d.day === currentDay);
  if (pivot) pivot.projected = pivot.actual;

  return data;
}

const chartData = buildChartData();

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number | null; dataKey: string }>;
  label?: number;
  currency?: import('../../contexts/CurrencyContext').Currency;
}) {
  if (!active || !payload?.length) return null;

  const actualEntry = payload.find((p) => p.dataKey === 'actual' && p.value !== null);
  const projEntry = payload.find((p) => p.dataKey === 'projected' && p.value !== null);
  const value = actualEntry?.value ?? projEntry?.value;
  const isProjected = !actualEntry?.value && !!projEntry?.value;

  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl">
      <p className="font-medium mb-1">Day {label}</p>
      {value !== null && value !== undefined && (
        <p className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isProjected ? 'bg-gray-400' : 'bg-cx-500'}`} />
          <span>
            {isProjected ? 'Projected' : 'Actual'}: {fc(value, currency ?? 'EUR', { compact: false })}
          </span>
        </p>
      )}
    </div>
  );
}

export default function AdSpendRunRate() {
  const { currency } = useCurrency();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex-1 min-w-0">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">AdSpend Run Rate</h2>
            <InfoTooltip />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {fc(mtdTotal, currency)}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">Month-to-date ad spend</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
            <p className="text-gray-400 font-medium mb-0.5">Avg Daily</p>
            <p className="text-base font-bold text-gray-900">
              {fc(avgDaily, currency)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-cx-500" />
              <span className="text-gray-500">
                Actual:{' '}
                <span className="font-semibold text-gray-700">
                  {fc(mtdTotal, currency)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-gray-300" />
              <span className="text-gray-500">
                EOM Proj:{' '}
                <span className="font-semibold text-gray-700">
                  {fc(projectedEom, currency)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[222px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="adRunrateActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0E5A8A" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0E5A8A" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="adRunrateProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93A4B8" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#93A4B8" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#93A4B8', fontSize: 11 }}
              ticks={[1, 5, 10, 15, 20, 25, 31]}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#93A4B8', fontSize: 11 }}
              tickFormatter={tickFmt(currency)}
              width={50}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <ReferenceLine
              x={currentDay}
              stroke="#C7D0DA"
              strokeDasharray="4 4"
              label={{ value: 'Today', position: 'top', fill: '#93A4B8', fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#93A4B8"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="url(#adRunrateProjected)"
              dot={false}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#0E5A8A"
              strokeWidth={2.5}
              fill="url(#adRunrateActual)"
              dot={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
