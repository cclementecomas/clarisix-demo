import { useState } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import InfoTooltip from './InfoTooltip';
import {
  subscriptionKPIs, subscriptionPlans, mrrMovements, churnReasons,
} from '../data/subscriptionsData';
import { fc, tickFmt } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';

const kpiIcons = [Users, DollarSign, Activity, BarChart3];

function KPICard({ label, value, change, positive, icon: Icon, rawValue, currency }: {
  label: string; value: string; change: number; positive: boolean; icon: React.FC<{ className?: string }>; rawValue?: number; currency?: string;
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
      <p className="text-2xl font-bold text-gray-900">{rawValue !== undefined && currency ? fc(rawValue, currency) : value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <p className="text-xs text-gray-500">{label}</p>
        <InfoTooltip />
      </div>
    </div>
  );
}

function createMRRTooltip(currency: string) {
  return function MRRTooltip({ active, payload, label }: {
    active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string;
  }) {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg text-xs shadow-xl min-w-[180px]">
          <p className="font-semibold mb-2 text-sm">{label}</p>
          {payload.map((entry) => (
            <p key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-medium">{fc(Math.abs(entry.value), currency, { compact: false })}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
}

export default function Subscriptions() {
  const [view, setView] = useState<'overview' | 'churn'>('overview');
  const { currency } = useCurrency();
  const MRRTooltip = createMRRTooltip(currency);

  const totalSubscribers = subscriptionPlans.reduce((s, p) => s + p.subscribers, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscriptions</h2>
          <p className="text-sm text-gray-500 mt-1">Subscribe & Save performance and churn analytics</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              view === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('churn')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              view === 'churn' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Churn Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {subscriptionKPIs.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} icon={kpiIcons[i]} currency={currency} />
        ))}
      </div>

      {view === 'overview' ? (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Subscription Plans</h3>
                <InfoTooltip />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Subscribers</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">MRR</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">ARPU</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Churn</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Lifespan</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Growth</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptionPlans.map((plan) => (
                    <tr key={plan.plan} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{plan.plan}</td>
                      <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{plan.subscribers.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-sm text-right font-semibold text-gray-900 tabular-nums">{fc(plan.mrr, currency, { compact: false })}</td>
                      <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{fc(plan.arpu, currency, { decimals: 2 })}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                          plan.churnRate <= 1.5 ? 'text-green-800 bg-green-50' :
                          plan.churnRate <= 3 ? 'text-amber-800 bg-amber-50' :
                          'text-red-700 bg-red-50'
                        }`}>
                          {plan.churnRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{plan.avgLifespan.toFixed(1)} mo</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                          <TrendingUp className="w-3 h-3" />
                          {plan.growthRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cx-500 rounded-full"
                              style={{ width: `${(plan.subscribers / totalSubscribers) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 tabular-nums w-10 text-right">
                            {((plan.subscribers / totalSubscribers) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">MRR Movements</h3>
              <InfoTooltip />
            </div>
            <p className="text-xs text-gray-400 mb-5">Monthly recurring revenue changes by category</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mrrMovements} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#93A4B8', fontSize: 11 }} />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#93A4B8', fontSize: 11 }}
                    tickFormatter={tickFmt(currency)}
                    width={55}
                  />
                  <Tooltip content={<MRRTooltip />} cursor={{ fill: 'rgba(14, 90, 138, 0.04)' }} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-gray-500">{value}</span>}
                    iconType="square"
                    iconSize={10}
                  />
                  <Bar dataKey="newMRR" name="New MRR" stackId="positive" fill="#0E5A8A" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="expansionMRR" name="Expansion" stackId="positive" fill="#4B9DCC" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="contractionMRR" name="Contraction" stackId="negative" fill="#C68900" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="churnMRR" name="Churn" stackId="negative" fill="#D55E00" radius={[0, 0, 3, 3]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Churn Reasons</h3>
                <InfoTooltip />
              </div>
              <p className="text-xs text-gray-400 mt-1">Breakdown of subscription cancellation reasons this period</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Count</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">% of Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">MRR Loss</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {churnReasons.map((reason) => (
                    <tr key={reason.reason} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{reason.reason}</td>
                      <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{reason.count}</td>
                      <td className="px-4 py-3.5 text-sm text-right text-gray-700 tabular-nums">{reason.percentage.toFixed(1)}%</td>
                      <td className="px-4 py-3.5 text-sm text-right font-semibold text-red-700 tabular-nums">{fc(reason.mrrloss, currency, { compact: false })}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          reason.trend <= 0 ? 'text-green-700' : 'text-red-600'
                        }`}>
                          {reason.trend <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {Math.abs(reason.trend).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-red-400"
                              style={{ width: `${reason.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Churn MRR Loss by Month</h3>
              <InfoTooltip />
            </div>
            <p className="text-xs text-gray-400 mb-5">Monthly revenue impact from subscriber churn</p>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mrrMovements} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#93A4B8', fontSize: 11 }} />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#93A4B8', fontSize: 11 }}
                    tickFormatter={tickFmt(currency)}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value: number) => [fc(Math.abs(value), currency, { compact: false }), 'Churn MRR']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: 'white', fontSize: 12 }}
                    itemStyle={{ color: 'white' }}
                    labelStyle={{ color: '#93A4B8', fontWeight: 600 }}
                  />
                  <Bar dataKey="churnMRR" name="Churn MRR" radius={[4, 4, 0, 0]}>
                    {mrrMovements.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={Math.abs(entry.churnMRR) > 3200 ? '#991B1B' : Math.abs(entry.churnMRR) > 2900 ? '#C68900' : '#0F766E'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
