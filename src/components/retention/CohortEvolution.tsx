import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { cohortEvolutionData, cohortData } from '../../data/retentionData';
import InfoTooltip from '../InfoTooltip';

function EvolutionTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string;
}) {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg text-xs shadow-xl min-w-[160px]">
        <p className="font-semibold mb-2 text-sm">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium">{entry.value.toFixed(1)}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function CohortEvolution() {
  const avgRetentionByMonth = Array.from({ length: 12 }, (_, monthIdx) => {
    const values = cohortData
      .map(row => row.months[monthIdx])
      .filter((v): v is number => v !== null);
    return {
      month: `M${monthIdx}`,
      retention: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      cohorts: values.length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Retention Trend by Milestone</h3>
            <InfoTooltip />
          </div>
          <p className="text-xs text-gray-400 mb-5">How M1, M3, M6, M12 retention evolves over time</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cohortEvolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#93A4B8', fontSize: 11 }} />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#93A4B8', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  width={45}
                  domain={[0, 60]}
                />
                <Tooltip content={<EvolutionTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-500">{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
                <Line type="monotone" dataKey="m1" name="Month 1" stroke="#0E5A8A" strokeWidth={2.5} dot={{ r: 3.5, fill: '#0E5A8A' }} />
                <Line type="monotone" dataKey="m3" name="Month 3" stroke="#4B9DCC" strokeWidth={2} dot={{ r: 3, fill: '#4B9DCC' }} />
                <Line type="monotone" dataKey="m6" name="Month 6" stroke="#93A4B8" strokeWidth={2} dot={{ r: 3, fill: '#93A4B8' }} />
                <Line type="monotone" dataKey="m12" name="Month 12" stroke="#C7D0DA" strokeWidth={2} dot={{ r: 3, fill: '#C7D0DA' }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Average Retention Curve</h3>
            <InfoTooltip />
          </div>
          <p className="text-xs text-gray-400 mb-5">Average retention % across all cohorts at each month</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={avgRetentionByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E5A8A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0E5A8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#93A4B8', fontSize: 11 }} />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#93A4B8', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  width={45}
                  domain={[0, 110]}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retention']}
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: 'white', fontSize: 12 }}
                  itemStyle={{ color: 'white' }}
                  labelStyle={{ color: '#93A4B8', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="retention"
                  stroke="#0E5A8A"
                  strokeWidth={2.5}
                  fill="url(#retentionGradient)"
                  dot={{ r: 4, fill: '#0E5A8A', strokeWidth: 2, stroke: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-1.5 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Retention Drop-off Analysis</h3>
          <InfoTooltip />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {avgRetentionByMonth.slice(0, 6).map((item, i) => {
            const prevValue = i > 0 ? avgRetentionByMonth[i - 1].retention : 100;
            const dropoff = prevValue - item.retention;
            return (
              <div key={item.month} className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-2">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EEF2F6" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.915" fill="none"
                      stroke={item.retention > 30 ? '#0E5A8A' : item.retention > 15 ? '#C68900' : '#991B1B'}
                      strokeWidth="3"
                      strokeDasharray={`${item.retention} ${100 - item.retention}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                    {item.retention.toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.month}</p>
                {i > 0 && (
                  <p className="text-xs text-red-500 mt-0.5">-{dropoff.toFixed(1)}pp</p>
                )}
                <p className="text-xs text-gray-400">{item.cohorts} cohorts</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
