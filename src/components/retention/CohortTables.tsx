import { cohortData } from '../../data/retentionData';
import InfoTooltip from '../InfoTooltip';

function getCellColor(value: number | null): string {
  if (value === null) return '';
  if (value >= 80) return 'bg-cx-700 text-white';
  if (value >= 40) return 'bg-cx-500 text-white';
  if (value >= 30) return 'bg-cx-500 text-white';
  if (value >= 20) return 'bg-cx-300 text-white';
  if (value >= 15) return 'bg-cx-300 text-cx-900';
  if (value >= 10) return 'bg-cx-200 text-cx-900';
  return 'bg-cx-100 text-cx-800';
}

export default function CohortTables() {
  const monthHeaders = Array.from({ length: 12 }, (_, i) => `M${i}`);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cohort Retention Table</h3>
              <InfoTooltip />
            </div>
            <p className="text-xs text-gray-400 mt-1">Percentage of customers returning each month after first purchase</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-4 h-3 rounded bg-cx-100" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-4 h-3 rounded bg-cx-300" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-4 h-3 rounded bg-cx-700" />
              <span>High</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 z-10 bg-gray-50 px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">Cohort</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[90px]">Customers</th>
                {monthHeaders.map((m) => (
                  <th key={m} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[60px]">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cohortData.map((row) => (
                <tr key={row.cohort} className="hover:bg-gray-50/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {row.cohort}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right text-gray-700 tabular-nums">
                    {row.customers.toLocaleString()}
                  </td>
                  {row.months.map((val, i) => (
                    <td key={i} className="px-1 py-1.5">
                      {val !== null ? (
                        <div className={`mx-auto w-14 py-1.5 rounded text-center text-xs font-semibold tabular-nums transition-colors ${getCellColor(val)}`}>
                          {val.toFixed(1)}%
                        </div>
                      ) : (
                        <div className="mx-auto w-14 py-1.5 rounded text-center text-xs text-gray-300">&mdash;</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Avg. M1 Retention"
          value={`${(cohortData.reduce((s, r) => s + (r.months[1] ?? 0), 0) / cohortData.filter(r => r.months[1] !== null).length).toFixed(1)}%`}
          description="Average retention at 1 month across all cohorts"
          trend={3.2}
        />
        <SummaryCard
          title="Avg. M3 Retention"
          value={`${(cohortData.reduce((s, r) => s + (r.months[3] ?? 0), 0) / cohortData.filter(r => r.months[3] !== null).length).toFixed(1)}%`}
          description="Average retention at 3 months across all cohorts"
          trend={1.8}
        />
        <SummaryCard
          title="Best Performing Cohort"
          value="Dec 2024"
          description="Highest M0 acquisition with 1,960 new customers"
          trend={7.7}
        />
      </div>
    </div>
  );
}

function SummaryCard({ title, value, description, trend }: {
  title: string; value: string; description: string; trend: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <InfoTooltip />
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className={`text-xs font-semibold ${trend >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs. prior
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">{description}</p>
    </div>
  );
}
