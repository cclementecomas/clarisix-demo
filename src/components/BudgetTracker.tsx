import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import InfoTooltip from './InfoTooltip';
import { useCurrency, type Currency } from '../contexts/CurrencyContext';
import { fc, tickFmt } from '../utils/currency';

const DAYS_IN_MONTH = 31;
const CURRENT_DAY = 21;

const dailySales = [
  { day: 1, sales: 3820 },
  { day: 2, sales: 4100 },
  { day: 3, sales: 3540 },
  { day: 4, sales: 5210 },
  { day: 5, sales: 4680 },
  { day: 6, sales: 3920 },
  { day: 7, sales: 2140 },
  { day: 8, sales: 4350 },
  { day: 9, sales: 5100 },
  { day: 10, sales: 4870 },
  { day: 11, sales: 5320 },
  { day: 12, sales: 4190 },
  { day: 13, sales: 3780 },
  { day: 14, sales: 2890 },
  { day: 15, sales: 5640 },
  { day: 16, sales: 6210 },
  { day: 17, sales: 5480 },
  { day: 18, sales: 4920 },
  { day: 19, sales: 5780 },
  { day: 20, sales: 4310 },
  { day: 21, sales: 5870 },
];

const mtdTotal = dailySales.reduce((sum, d) => sum + d.sales, 0);
const avgDailySales = Math.round(mtdTotal / CURRENT_DAY);
const projectedEom = Math.round(avgDailySales * DAYS_IN_MONTH);

function buildChartData() {
  const data: Array<{ day: number; actual: number | null; projected: number | null }> = [];
  let cumulative = 0;

  for (const d of dailySales) {
    cumulative += d.sales;
    data.push({ day: d.day, actual: cumulative, projected: null });
  }

  const lastActualCum = cumulative;

  for (let day = CURRENT_DAY + 1; day <= DAYS_IN_MONTH; day++) {
    const projectedCum = lastActualCum + avgDailySales * (day - CURRENT_DAY);
    data.push({ day, actual: null, projected: projectedCum });
  }

  const lastActualEntry = data.find((d) => d.day === CURRENT_DAY);
  if (lastActualEntry) {
    lastActualEntry.projected = lastActualEntry.actual;
  }

  return data;
}

const chartData = buildChartData();

function createCustomTooltip(currency: Currency) {
  return function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number | null; dataKey: string }>; label?: number }) {
    if (active && payload && payload.length) {
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
              <span>{isProjected ? 'Projected' : 'Actual'}: {fc(value, currency, { compact: false })}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };
}

export default function BudgetTracker() {
  const { currency } = useCurrency();
  const CustomTooltip = createCustomTooltip(currency);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex-1 min-w-0">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales Run Rate</h2>
            <InfoTooltip />
          </div>
          <p className="text-3xl font-bold text-gray-900">{fc(mtdTotal, currency, { compact: false })}</p>
          <p className="text-sm text-gray-400 mt-0.5">Month-to-date sales</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
            <p className="text-gray-400 font-medium mb-0.5">Avg Daily</p>
            <p className="text-base font-bold text-gray-900">{fc(avgDailySales, currency, { compact: false })}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-cx-500" />
              <span className="text-gray-500">Actual: <span className="font-semibold text-gray-700">{fc(mtdTotal, currency, { compact: false })}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-gray-300" />
              <span className="text-gray-500">EOM Proj: <span className="font-semibold text-gray-700">{fc(projectedEom, currency, { compact: false })}</span></span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[222px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="runrateActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0E5A8A" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0E5A8A" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="runrateProjected" x1="0" y1="0" x2="0" y2="1">
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
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x={CURRENT_DAY}
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
              fill="url(#runrateProjected)"
              dot={false}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#0E5A8A"
              strokeWidth={2.5}
              fill="url(#runrateActual)"
              dot={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
