import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Customized, LabelList } from 'recharts';
import { salesOverviewByGranularity, type Granularity, type SalesDataPoint } from '../data/dashboardData';
import InfoTooltip from './InfoTooltip';
import { useCurrency, type Currency } from '../contexts/CurrencyContext';
import { fc, tickFmt } from '../utils/currency';

const granularityOptions: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

function createCustomTooltip(currency: Currency) {
  return function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      return (
        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg text-xs shadow-xl min-w-[160px]">
          <p className="font-semibold mb-2 text-sm">{label}</p>
          {payload.reverse().map((entry) => {
            const percentage = ((entry.value / total) * 100).toFixed(0);
            return (
              <p key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-medium">{fc(entry.value, currency)} ({percentage}%)</span>
              </p>
            );
          })}
          <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-bold">{fc(total, currency)}</span>
          </div>
        </div>
      );
    }
    return null;
  };
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-5 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
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

function GrowthTrendOverlay({ data, growth, ...chartProps }: { data: SalesDataPoint[]; growth: number } & Record<string, any>) {
  const xAxis = chartProps.xAxisMap && (Object.values(chartProps.xAxisMap)[0] as any);
  const yAxis = chartProps.yAxisMap && (Object.values(chartProps.yAxisMap)[0] as any);

  if (!xAxis?.scale || !yAxis?.scale || !data || data.length < 2) return null;

  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  const bandwidth = xScale.bandwidth?.() || 0;
  const halfBand = bandwidth / 2;

  const firstTotal = data[0].adSales + data[0].organicSales;
  const lastTotal = data[data.length - 1].adSales + data[data.length - 1].organicSales;

  const offset = 16;
  const x1 = xScale(data[0].label) + halfBand;
  const y1 = yScale(firstTotal) - offset;
  const x2 = xScale(data[data.length - 1].label) + halfBand;
  const y2 = yScale(lastTotal) - offset;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;

  const sx = x1 - (dx / len) * 20;
  const sy = y1 - (dy / len) * 20;
  const ex = x2 + (dx / len) * 30;
  const ey = y2 + (dy / len) * 30;

  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  const isPositive = growth >= 0;
  const color = isPositive ? '#166534' : '#991B1B';
  const bubbleR = 24;

  const angle = Math.atan2(ey - sy, ex - sx);
  const arrowLen = 10;
  const arrowSpread = Math.PI / 6;

  return (
    <g>
      <line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={color} strokeWidth={2} strokeDasharray="6 4"
      />
      <polygon
        points={`
          ${ex},${ey}
          ${ex - arrowLen * Math.cos(angle - arrowSpread)},${ey - arrowLen * Math.sin(angle - arrowSpread)}
          ${ex - arrowLen * Math.cos(angle + arrowSpread)},${ey - arrowLen * Math.sin(angle + arrowSpread)}
        `}
        fill={color}
      />
      <circle cx={mx} cy={my} r={bubbleR} fill={color} />
      <text
        x={mx} y={my + 4}
        textAnchor="middle"
        fill="white"
        fontSize={11}
        fontWeight="bold"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {isPositive ? '+' : ''}{growth.toFixed(1)}%
      </text>
    </g>
  );
}

export default function SalesOverview() {
  const { currency } = useCurrency();
  const [granularity, setGranularity] = useState<Granularity>('month');
  const data = salesOverviewByGranularity[granularity];

  const calculateGrowth = () => {
    if (data.length < 2) return 0;
    const firstTotal = data[0].adSales + data[0].organicSales;
    const lastTotal = data[data.length - 1].adSales + data[data.length - 1].organicSales;
    return ((lastTotal - firstTotal) / firstTotal) * 100;
  };

  const growth = calculateGrowth();
  const CustomTooltip = createCustomTooltip(currency);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex-1 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales Overview</h2>
          <InfoTooltip />
        </div>
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
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 40, right: 10, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#93A4B8', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#93A4B8', fontSize: 11 }}
              tickFormatter={tickFmt(currency)}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 90, 138, 0.04)' }} />
            <Legend content={<CustomLegend />} />
            <Bar
              dataKey="organicSales"
              name="Organic Sales"
              stackId="sales"
              fill="#0E5A8A"
              radius={[0, 0, 0, 0]}
            >
              <LabelList
                content={(props: any) => <CustomBarLabel {...props} currency={currency} />}
              />
            </Bar>
            <Bar
              dataKey="adSales"
              name="Ad Sales"
              stackId="sales"
              fill="#4B9DCC"
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                content={(props: any) => <CustomBarLabel {...props} currency={currency} />}
              />
            </Bar>
            <Customized
              component={(props: any) => (
                <GrowthTrendOverlay {...props} data={data} growth={growth} />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
