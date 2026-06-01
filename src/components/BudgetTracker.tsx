import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import InfoTooltip from './InfoTooltip';
import { useCurrency, type Currency } from '../contexts/CurrencyContext';
import { fc, tickFmt } from '../utils/currency';
import {
  TARGET_SALES, LAST_MONTH_TOTAL,
  paceStatus, gapToTarget, requiredDailyToTarget, popChangePct,
} from '../data/salesOverviewInsights';

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

const daysRemaining = DAYS_IN_MONTH - CURRENT_DAY;

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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex-1 min-w-0 flex flex-col">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales Run Rate</h2>
            <InfoTooltip content="End-of-month sales projection based on the current daily run rate. Solid line = month-to-date actual; dashed = projection." />
          </div>
          <p className="text-3xl font-bold text-gray-800">{fc(projectedEom, currency, { compact: false })}</p>
          <p className="text-sm text-gray-400 mt-0.5">Projected end-of-month</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="w-3 h-1.5 rounded-full bg-cx-500" />
            <span className="text-gray-500">MTD actual: <span className="font-semibold text-gray-700">{fc(mtdTotal, currency, { compact: false })}</span></span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center text-xs">
          <p className="text-gray-400 font-medium mb-0.5">Avg Daily</p>
          <p className="text-base font-bold text-gray-900">{fc(avgDailySales, currency, { compact: false })}</p>
        </div>
      </div>
      <div className="relative flex-1 min-h-[222px]">
        <div className="absolute inset-0">
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

      {/* Stat strip — projection context.
          When a target exists, the first tile shows the gap to that target;
          the third tile swaps "vs Last month" pace for a required-daily metric. */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
        {TARGET_SALES ? (
          <div className="pr-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Gap to target</p>
            <p className={`text-base font-bold tabular-nums mt-0.5 ${gapToTarget >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {gapToTarget >= 0 ? '+' : '−'}{fc(Math.abs(gapToTarget), currency, { compact: true })}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">vs {fc(TARGET_SALES, currency, { compact: true })} target</p>
          </div>
        ) : (
          <div className="pr-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">vs Last month</p>
            <p className={`text-base font-bold tabular-nums mt-0.5 ${popChangePct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {popChangePct >= 0 ? '+' : ''}{popChangePct.toFixed(1)}%
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{fc(LAST_MONTH_TOTAL, currency, { compact: true })} last month</p>
          </div>
        )}
        <div className="px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Days remaining</p>
          <p className="text-base font-bold text-gray-900 tabular-nums mt-0.5">{daysRemaining}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">of {DAYS_IN_MONTH} days</p>
        </div>
        {TARGET_SALES ? (
          <div className="pl-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Required / day</p>
            <p className={`text-base font-bold tabular-nums mt-0.5 ${requiredDailyToTarget > avgDailySales ? 'text-rose-700' : 'text-emerald-700'}`}>
              {fc(requiredDailyToTarget, currency, { compact: true })}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {requiredDailyToTarget > avgDailySales
                ? `+${Math.round(((requiredDailyToTarget - avgDailySales) / avgDailySales) * 100)}% vs current`
                : 'within current pace'}
            </p>
          </div>
        ) : (
          <div className="pl-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pace</p>
            <p className={`text-base font-bold mt-0.5 ${paceStatus.tone === 'good' ? 'text-emerald-700' : paceStatus.tone === 'bad' ? 'text-rose-700' : 'text-gray-900'}`}>
              {paceStatus.label}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">vs last month run-rate</p>
          </div>
        )}
      </div>
    </div>
  );
}
