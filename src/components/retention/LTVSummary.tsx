import { TrendingUp, TrendingDown, Users, DollarSign, Repeat, Target } from 'lucide-react';
import { ltvSegments, ltvSummaryKPIs } from '../../data/retentionData';
import InfoTooltip from '../InfoTooltip';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';

const kpiIcons = [DollarSign, Target, Repeat, Users];

function KPICard({ label, value, change, positive, icon: Icon, rawValue, currency }: {
  label: string; value: string; change: number; positive: boolean; icon: React.FC<{ className?: string }>; rawValue?: number; currency: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-cx-50 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-cx-500" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          positive ? 'text-green-800 bg-green-50' : 'text-red-700 bg-red-50'
        }`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{rawValue !== undefined ? fc(rawValue, currency) : value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <p className="text-xs text-gray-500">{label}</p>
        <InfoTooltip />
      </div>
    </div>
  );
}

function getRetentionColor(ratio: number): string {
  if (ratio >= 20) return 'text-green-800 bg-green-50';
  if (ratio >= 5) return 'text-cx-700 bg-cx-50';
  if (ratio >= 1) return 'text-amber-800 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

export default function LTVSummary() {
  const { currency } = useCurrency();
  const totalCustomers = ltvSegments.reduce((s, seg) => s + seg.customers, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ltvSummaryKPIs.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} icon={kpiIcons[i]} currency={currency} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">LTV by Customer Segment</h3>
            <InfoTooltip />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Segment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Customers</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Order</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders/Yr</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Lifespan</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">LTV</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">CAC</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">LTV:CAC</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Rev. Share</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ltvSegments.map((seg) => (
                <tr key={seg.segment} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full" style={{
                        backgroundColor: seg.trend > 10 ? '#0F766E' : seg.trend > 0 ? '#4B9DCC' : seg.trend > -5 ? '#C68900' : '#991B1B'
                      }} />
                      <span className="text-sm font-medium text-gray-900">{seg.segment}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">
                    {seg.customers.toLocaleString()}
                    <span className="text-gray-400 text-xs ml-1">({((seg.customers / totalCustomers) * 100).toFixed(1)}%)</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{fc(seg.avgOrderValue, currency, { decimals: 2 })}</td>
                  <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{seg.ordersPerYear.toFixed(1)}</td>
                  <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{seg.avgLifespan.toFixed(1)} yr</td>
                  <td className="px-4 py-3.5 text-sm text-right font-semibold text-gray-900 tabular-nums">{fc(seg.ltv, currency)}</td>
                  <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{fc(seg.cac, currency)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${getRetentionColor(seg.ltvCacRatio)}`}>
                      {seg.ltvCacRatio.toFixed(1)}x
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{seg.revenueShare.toFixed(1)}%</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      seg.trend >= 0 ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {seg.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(seg.trend).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
