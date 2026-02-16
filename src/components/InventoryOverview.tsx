import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  inventoryKPIs,
  stockHealthDistribution,
  categoryDaysOfSupply,
  agingBuckets,
  inventoryAlerts,
  velocityTrend,
} from '../data/inventoryData';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import InfoTooltip from './InfoTooltip';
import LastRefreshed from './LastRefreshed';

const STATUS_COLORS: Record<string, string> = {
  green: 'bg-green-50 border-green-200/60 text-green-900',
  yellow: 'bg-yellow-50 border-yellow-200/60 text-yellow-900',
  orange: 'bg-orange-50 border-orange-200/60 text-orange-900',
  red: 'bg-red-50 border-red-200/60 text-red-900',
  blue: 'bg-blue-50 border-blue-200/60 text-blue-900',
  neutral: 'bg-white border-gray-200 text-gray-900',
};

const LABEL_COLORS: Record<string, string> = {
  green: 'text-green-700/70',
  yellow: 'text-yellow-700/70',
  orange: 'text-orange-700/70',
  red: 'text-red-700/70',
  blue: 'text-blue-700/70',
  neutral: 'text-gray-500',
};

const AGING_COLORS = ['#16A34A', '#84CC16', '#EAB308', '#EA580C', '#DC2626'];

export default function InventoryOverview() {
  const { currency } = useCurrency();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 xl:grid-cols-9 gap-3">
        {inventoryKPIs.map((kpi) => {
          let display: string;
          if (kpi.format === 'currency') display = fc(kpi.rawValue, currency);
          else if (kpi.format === 'days') display = `${kpi.rawValue}d`;
          else display = kpi.value || String(kpi.rawValue);

          return (
            <div
              key={kpi.label}
              className={`rounded-xl border shadow-sm p-4 flex flex-col items-center ${STATUS_COLORS[kpi.color]}`}
            >
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${LABEL_COLORS[kpi.color]}`}>
                {kpi.label}
              </p>
              <span className="text-lg font-extrabold">{display}</span>
            </div>
          );
        })}
      </div>

      {/* Stock Health (full width — data-dense) */}
      <StockHealthPanel currency={currency} />

      {/* Category DOS + Aging */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CategoryDOSChart />
        <AgingChart currency={currency} />
      </div>

      {/* Velocity Trend */}
      <VelocityChart />

      {/* Priority Alerts */}
      <AlertsTable currency={currency} />

      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={6} />
      </div>
    </div>
  );
}

// ─── Stock Health Panel (data-dense) ─────────────────────────────────────────

function StockHealthPanel({ currency }: { currency: import('../contexts/CurrencyContext').Currency }) {
  const totalUnits = stockHealthDistribution.reduce((s, seg) => s + seg.units, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Inventory Health Distribution</h3>
        <InfoTooltip />
      </div>

      {/* Compact stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-5">
        {stockHealthDistribution.map((seg) => (
          <div
            key={seg.status}
            className="h-full transition-all duration-700"
            style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
          />
        ))}
      </div>

      {/* Status detail cards */}
      <div className="grid grid-cols-5 gap-3">
        {stockHealthDistribution.map((seg) => {
          const unitsPct = totalUnits > 0 ? Math.round(seg.units / totalUnits * 1000) / 10 : 0;
          return (
            <div
              key={seg.status}
              className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors"
            >
              {/* Header: color dot + status + count */}
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[11px] font-semibold text-gray-800 truncate">{seg.status}</span>
                <span className="text-[11px] font-bold ml-auto" style={{ color: seg.color }}>
                  {seg.count}
                </span>
              </div>

              {/* SKU % bar */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">SKUs</span>
                  <span className="text-[9px] font-semibold text-gray-500">{seg.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                  />
                </div>
              </div>

              {/* Metrics grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">Units</span>
                  <span className="text-[10px] font-semibold text-gray-700">
                    {seg.units.toLocaleString()}
                    <span className="text-gray-400 ml-0.5">({unitsPct}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">Value</span>
                  <span className="text-[10px] font-semibold text-gray-700">
                    {fc(seg.inventoryValue, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">Avg DOS</span>
                  <span className="text-[10px] font-semibold text-gray-700">
                    {seg.avgDaysOfSupply > 0 ? `${seg.avgDaysOfSupply}d` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">Avg Vel.</span>
                  <span className="text-[10px] font-semibold text-gray-700">
                    {seg.avgDailySales > 0 ? `${seg.avgDailySales}/d` : '—'}
                  </span>
                </div>
                {seg.revenueAtRisk > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-red-400 uppercase font-bold">Rev. at Risk</span>
                    <span className="text-[10px] font-semibold text-red-600">
                      {fc(seg.revenueAtRisk, currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Category Days of Supply ─────────────────────────────────────────────────

function CategoryDOSChart() {
  const maxDOS = Math.max(...categoryDaysOfSupply.map((c) => c.avgDaysOfSupply));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Avg Days of Supply by Category</h3>
        <InfoTooltip />
      </div>
      <div className="space-y-3">
        {categoryDaysOfSupply.map((cat) => {
          const width = maxDOS > 0 ? (cat.avgDaysOfSupply / maxDOS) * 100 : 0;
          const color =
            cat.avgDaysOfSupply < 14
              ? '#DC2626'
              : cat.avgDaysOfSupply < 30
                ? '#EA580C'
                : cat.avgDaysOfSupply < 60
                  ? '#EAB308'
                  : '#16A34A';
          return (
            <div key={cat.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-600">{cat.category}</span>
                <span className="text-[11px] font-semibold text-gray-800">
                  {cat.avgDaysOfSupply}d
                  <span className="text-gray-400 ml-1">({cat.skuCount} SKUs)</span>
                </span>
              </div>
              <div className="h-5 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Velocity Trend Chart ────────────────────────────────────────────────────

function VelocityChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Inventory Velocity (12 Weeks)</h3>
        <InfoTooltip />
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={velocityTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="soldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#16A34A" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => {
            if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
            return String(v);
          }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-lg">
                  <p className="font-semibold mb-1">{label}</p>
                  {payload.map((p) => (
                    <div key={String(p.name)} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-gray-300">{p.name}</span>
                      <span className="font-semibold ml-auto">{Number(p.value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="unitsSold"
            name="Units Sold"
            stroke="#DC2626"
            strokeWidth={2}
            fill="url(#soldGrad)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="unitsReceived"
            name="Units Received"
            stroke="#16A34A"
            strokeWidth={2}
            fill="url(#receivedGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span className="text-[10px] text-gray-500">Units Sold</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
          <span className="text-[10px] text-gray-500">Units Received</span>
        </div>
      </div>
    </div>
  );
}

// ─── Aging Chart ─────────────────────────────────────────────────────────────

const FEE_LABELS: Record<string, string> = {
  '0-90': 'No fees',
  '91-180': 'No fees',
  '181-270': '$0.50/unit',
  '271-365': '$1.50/unit',
  '365+': '$6.90/unit',
};

function AgingChart({ currency }: { currency: import('../contexts/CurrencyContext').Currency }) {
  const totalUnits = agingBuckets.reduce((s, b) => s + b.units, 0);
  const totalValue = agingBuckets.reduce((s, b) => s + b.value, 0);
  const totalFeeRisk = agingBuckets.reduce((s, b) => s + b.feeRisk, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-gray-900">Inventory Aging</h3>
          <InfoTooltip />
        </div>
        {totalFeeRisk > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-gray-400 uppercase font-bold">Total Fee Risk</span>
            <span className="text-xs font-bold text-red-600">{fc(totalFeeRisk, currency)}/mo</span>
          </div>
        )}
      </div>

      {/* Compact stacked bar */}
      <div className="h-2.5 rounded-full overflow-hidden flex mb-4">
        {agingBuckets.map((b, i) => {
          const w = totalUnits > 0 ? (b.units / totalUnits) * 100 : 0;
          return w > 0 ? (
            <div
              key={b.bucket}
              className="h-full transition-all duration-700"
              style={{ width: `${w}%`, backgroundColor: AGING_COLORS[i] }}
            />
          ) : null;
        })}
      </div>

      {/* Bucket rows */}
      <div className="space-y-0">
        {agingBuckets.map((b, i) => {
          const unitsPct = totalUnits > 0 ? Math.round(b.units / totalUnits * 1000) / 10 : 0;
          const valuePct = totalValue > 0 ? Math.round(b.value / totalValue * 1000) / 10 : 0;
          const hasFee = b.feeRisk > 0;

          return (
            <div
              key={b.bucket}
              className={`flex items-center gap-3 py-2.5 ${i < agingBuckets.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              {/* Color dot + bucket label */}
              <div className="flex items-center gap-1.5 w-[72px] shrink-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: AGING_COLORS[i] }} />
                <span className="text-[11px] font-semibold text-gray-700">{b.bucket}d</span>
              </div>

              {/* Units bar + number */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${unitsPct}%`, backgroundColor: AGING_COLORS[i] }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 w-[52px] text-right shrink-0">
                    {b.units.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* % of units */}
              <span className="text-[10px] text-gray-400 w-[38px] text-right shrink-0">{unitsPct}%</span>

              {/* Value */}
              <span className="text-[10px] font-medium text-gray-600 w-[70px] text-right shrink-0">
                {fc(b.value, currency)}
              </span>

              {/* Value % */}
              <span className="text-[10px] text-gray-400 w-[38px] text-right shrink-0">{valuePct}%</span>

              {/* SKUs */}
              <span className="text-[10px] text-gray-500 w-[36px] text-right shrink-0">
                {b.skuCount} <span className="text-gray-300">SKU</span>
              </span>

              {/* Fee risk */}
              <div className="w-[72px] text-right shrink-0">
                {hasFee ? (
                  <span className="text-[10px] font-semibold text-red-600">{fc(b.feeRisk, currency)}/mo</span>
                ) : (
                  <span className="text-[10px] text-gray-300">{FEE_LABELS[b.bucket]}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Column headers (subtle) */}
      <div className="flex items-center gap-3 mt-1 pt-2 border-t border-gray-100">
        <div className="w-[72px] shrink-0" />
        <div className="flex-1 text-[8px] text-gray-300 uppercase font-bold">Units</div>
        <span className="text-[8px] text-gray-300 uppercase font-bold w-[38px] text-right shrink-0">%</span>
        <span className="text-[8px] text-gray-300 uppercase font-bold w-[70px] text-right shrink-0">Value</span>
        <span className="text-[8px] text-gray-300 uppercase font-bold w-[38px] text-right shrink-0">%</span>
        <span className="text-[8px] text-gray-300 uppercase font-bold w-[36px] text-right shrink-0">Count</span>
        <span className="text-[8px] text-gray-300 uppercase font-bold w-[72px] text-right shrink-0">Fee Risk</span>
      </div>
    </div>
  );
}

// ─── Priority Alerts Table ───────────────────────────────────────────────────

const statusBadge: Record<string, string> = {
  'Out of Stock': 'bg-red-100 text-red-700',
  'Critical': 'bg-orange-100 text-orange-700',
  'Low Stock': 'bg-yellow-100 text-yellow-700',
};

function AlertsTable({ currency }: { currency: import('../contexts/CurrencyContext').Currency }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Priority Reorder Alerts</h3>
        <InfoTooltip />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              {['SKU', 'Product', 'Status', 'Days of Supply', 'Revenue at Risk', 'Suggested Action'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {inventoryAlerts.map((alert) => (
              <tr key={alert.sku} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-3 py-2.5 text-xs font-semibold text-gray-800 font-mono">
                  {alert.sku}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-700 max-w-[200px] truncate">
                  {alert.title}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      statusBadge[alert.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {alert.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-700">
                  {alert.daysOfSupply === 0 ? (
                    <span className="text-red-600 font-semibold">0d</span>
                  ) : (
                    `${alert.daysOfSupply}d`
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs font-semibold text-red-600">
                  {fc(alert.revenueAtRisk, currency)}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{alert.suggestedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
