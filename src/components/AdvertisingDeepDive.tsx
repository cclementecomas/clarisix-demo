import { useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import {
  campaignData,
  deepDiveKpis,
  placementSummaries,
  audienceSegments,
} from '../data/advertisingDeepdiveData';
import DeepDiveTable, {
  type ColumnDef,
  percentCellStyle,
  percentFormatter,
  ppFormatter,
  currencyFormatter,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import LastRefreshed from './LastRefreshed';
import InfoTooltip from './InfoTooltip';

const PLACEMENT_COLORS = ['#0F766E', '#4B9DCC', '#A8D4EC'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

function fmtPct(v: number): string {
  return `${v.toFixed(2)}%`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

export default function AdvertisingDeepDive() {
  const { currency } = useCurrency();

  const fmtCurrency = useMemo(() => currencyFormatter(currency), [currency]);

  // Flatten campaign data for DeepDiveTable (strip placements array, include PoP/LY)
  const campaignRows = useMemo<Row[]>(
    () =>
      campaignData.map((c) => ({
        campaign: c.campaign,
        impressions: c.impressions,
        impressionsPoP: c.impressionsPoP,
        impressionsDiffLY: c.impressionsDiffLY,
        clicks: c.clicks,
        clicksPoP: c.clicksPoP,
        clicksDiffLY: c.clicksDiffLY,
        ctr: c.ctr,
        ctrPoP: c.ctrPoP,
        ctrDiffLY: c.ctrDiffLY,
        spend: c.spend,
        spendPoP: c.spendPoP,
        spendDiffLY: c.spendDiffLY,
        pctTotal: c.pctTotal,
        sales: c.sales,
        salesPoP: c.salesPoP,
        salesDiffLY: c.salesDiffLY,
        orders: c.orders,
        ordersPoP: c.ordersPoP,
        ordersDiffLY: c.ordersDiffLY,
        acos: c.acos,
        acosPoP: c.acosPoP,
        acosDiffLY: c.acosDiffLY,
        cvr: c.cvr,
        cvrPoP: c.cvrPoP,
        cvrDiffLY: c.cvrDiffLY,
      })),
    []
  );

  // Child rows: placement breakdowns keyed by campaign name (include PoP/LY)
  const placementChildMap = useMemo<Record<string, Row[]>>(
    () =>
      Object.fromEntries(
        campaignData.map((c) => [
          c.campaign,
          c.placements.map((p) => ({
            placement: p.placement,
            impressions: p.impressions,
            impressionsPoP: p.impressionsPoP,
            impressionsDiffLY: p.impressionsDiffLY,
            clicks: p.clicks,
            clicksPoP: p.clicksPoP,
            clicksDiffLY: p.clicksDiffLY,
            ctr: p.ctr,
            ctrPoP: p.ctrPoP,
            ctrDiffLY: p.ctrDiffLY,
            spend: p.spend,
            spendPoP: p.spendPoP,
            spendDiffLY: p.spendDiffLY,
            pctTotal: 0,
            sales: p.sales,
            salesPoP: p.salesPoP,
            salesDiffLY: p.salesDiffLY,
            orders: p.orders,
            ordersPoP: p.ordersPoP,
            ordersDiffLY: p.ordersDiffLY,
            acos: p.acos,
            acosPoP: p.acosPoP,
            acosDiffLY: p.acosDiffLY,
            cvr: p.cvr,
            cvrPoP: p.cvrPoP,
            cvrDiffLY: p.cvrDiffLY,
          })),
        ])
      ),
    []
  );

  // Totals row (averages for PoP/LY)
  const campaignTotals = useMemo<Row[]>(() => {
    const n = campaignData.length;
    const totalSpend = campaignData.reduce((s, c) => s + c.spend, 0);
    const totalSales = campaignData.reduce((s, c) => s + c.sales, 0);
    const totalClicks = campaignData.reduce((s, c) => s + c.clicks, 0);
    const totalImpressions = campaignData.reduce((s, c) => s + c.impressions, 0);
    const totalOrders = campaignData.reduce((s, c) => s + c.orders, 0);
    const avg = (key: keyof typeof campaignData[0]) =>
      Math.round(campaignData.reduce((s, c) => s + (c[key] as number), 0) / n * 100) / 100;
    return [
      {
        campaign: 'Total',
        impressions: totalImpressions,
        impressionsPoP: avg('impressionsPoP'),
        impressionsDiffLY: avg('impressionsDiffLY'),
        clicks: totalClicks,
        clicksPoP: avg('clicksPoP'),
        clicksDiffLY: avg('clicksDiffLY'),
        ctr: totalImpressions > 0 ? Math.round(totalClicks / totalImpressions * 10000) / 100 : 0,
        ctrPoP: avg('ctrPoP'),
        ctrDiffLY: avg('ctrDiffLY'),
        spend: totalSpend,
        spendPoP: avg('spendPoP'),
        spendDiffLY: avg('spendDiffLY'),
        pctTotal: 100,
        sales: totalSales,
        salesPoP: avg('salesPoP'),
        salesDiffLY: avg('salesDiffLY'),
        orders: totalOrders,
        ordersPoP: avg('ordersPoP'),
        ordersDiffLY: avg('ordersDiffLY'),
        acos: totalSales > 0 ? Math.round(totalSpend / totalSales * 10000) / 100 : 0,
        acosPoP: avg('acosPoP'),
        acosDiffLY: avg('acosDiffLY'),
        cvr: totalClicks > 0 ? Math.round(totalOrders / totalClicks * 10000) / 100 : 0,
        cvrPoP: avg('cvrPoP'),
        cvrDiffLY: avg('cvrDiffLY'),
      },
    ];
  }, []);

  // SubField helpers
  const pctSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: percentFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: percentFormatter, cellStyle: percentCellStyle },
  ];
  const ppSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: ppFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: ppFormatter, cellStyle: percentCellStyle },
  ];

  const campaignCols = useMemo<ColumnDef[]>(
    () => [
      { field: 'campaign', headerName: 'Campaign', pinned: 'left', width: 320 },
      { field: 'impressions', headerName: 'Impressions', valueFormatter: numberFormatter, width: 130, subFields: pctSub('impressions') },
      { field: 'clicks', headerName: 'Clicks', valueFormatter: numberFormatter, width: 110, subFields: pctSub('clicks') },
      { field: 'ctr', headerName: 'CTR', valueFormatter: pctShareFormatter, width: 100, subFields: ppSub('ctr') },
      { field: 'spend', headerName: 'Spend', valueFormatter: fmtCurrency, width: 120, subFields: pctSub('spend') },
      { field: 'pctTotal', headerName: '% Total', valueFormatter: pctShareFormatter, width: 100 },
      { field: 'sales', headerName: 'Sales', valueFormatter: fmtCurrency, width: 120, subFields: pctSub('sales') },
      { field: 'orders', headerName: 'Orders', valueFormatter: numberFormatter, width: 100, subFields: pctSub('orders') },
      { field: 'acos', headerName: 'ACOS', valueFormatter: pctShareFormatter, width: 100, subFields: ppSub('acos') },
      { field: 'cvr', headerName: 'CVR', valueFormatter: pctShareFormatter, width: 100, subFields: ppSub('cvr') },
    ],
    [fmtCurrency]
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KPIRow currency={currency} />

      {/* Performance by Placement */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PlacementSpendChart currency={currency} />
        <PlacementACOSChart />
      </div>

      {/* Placement Metrics Table */}
      <PlacementMetricsTable currency={currency} />

      {/* Audience Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <AudienceCards currency={currency} />
        <AudienceRadar />
      </div>

      {/* Campaign Breakdown Table — uses DeepDiveTable for cell selection + export */}
      <DeepDiveTable
        title="Campaign Breakdown"
        rowData={campaignRows}
        columnDefs={campaignCols}
        pinnedBottomRowData={campaignTotals}
        childRowsMap={placementChildMap}
        rowKeyField="campaign"
        childLabelField="placement"
      />

      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={14} />
      </div>
    </div>
  );
}

// ─── KPI Row ─────────────────────────────────────────────────────────────────

function KPIRow({ currency }: { currency: import('../contexts/CurrencyContext').Currency }) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {deepDiveKpis.map((kpi) => {
        let displayValue: string;
        if (kpi.format === 'currency') {
          displayValue = fc(kpi.rawValue, currency);
        } else if (kpi.format === 'number') {
          displayValue = fmtNum(kpi.rawValue);
        } else if (kpi.format === 'percent') {
          displayValue = fmtPct(kpi.rawValue);
        } else {
          displayValue = kpi.rawValue.toFixed(2);
        }
        return (
          <div
            key={kpi.label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              {kpi.label}
            </p>
            <span className="text-lg font-extrabold text-gray-900">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Placement Spend Chart ───────────────────────────────────────────────────

function PlacementSpendChart({ currency }: { currency: import('../contexts/CurrencyContext').Currency }) {
  const maxSpend = Math.max(...placementSummaries.map((p) => p.spend));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Spend Distribution by Placement</h3>
        <InfoTooltip />
      </div>
      <div className="space-y-4">
        {placementSummaries.map((p, idx) => {
          const width = maxSpend > 0 ? (p.spend / maxSpend) * 100 : 0;
          return (
            <div key={p.placement}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-600">{p.placement}</span>
                <span className="text-[11px] font-semibold text-gray-800">
                  {fc(p.spend, currency)} ({fmtPct(p.pctOfSpend)})
                </span>
              </div>
              <div className="h-6 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{
                    width: `${width}%`,
                    backgroundColor: PLACEMENT_COLORS[idx % PLACEMENT_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Placement ACOS Chart ────────────────────────────────────────────────────

function PlacementACOSChart() {
  const maxAcos = Math.max(...placementSummaries.map((p) => p.acos));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">ACOS by Placement</h3>
        <InfoTooltip />
      </div>
      <div className="space-y-4">
        {placementSummaries.map((p, idx) => {
          const width = maxAcos > 0 ? (p.acos / maxAcos) * 100 : 0;
          return (
            <div key={p.placement}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-600">{p.placement}</span>
                <span className="text-[11px] font-semibold text-gray-800">{fmtPct(p.acos)}</span>
              </div>
              <div className="h-6 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{
                    width: `${width}%`,
                    backgroundColor: PLACEMENT_COLORS[idx % PLACEMENT_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Placement Metrics Table ─────────────────────────────────────────────────

function PlacementMetricsTable({ currency }: { currency: import('../contexts/CurrencyContext').Currency }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Placement Metrics</h3>
        <InfoTooltip />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              {['Placement', 'Spend', '% of Spend', 'Sales', 'ACOS', 'Impressions', 'CTR', 'CVR'].map(
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
            {placementSummaries.map((p, idx) => (
              <tr key={p.placement} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-3 py-2.5 text-xs font-semibold text-gray-800">{p.placement}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{fc(p.spend, currency)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.pctOfSpend}%`,
                          backgroundColor: PLACEMENT_COLORS[idx % PLACEMENT_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{fmtPct(p.pctOfSpend)}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{fc(p.sales, currency)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{fmtPct(p.acos)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{fmtNum(p.impressions)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{fmtPct(p.ctr)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{fmtPct(p.cvr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Audience Cards ──────────────────────────────────────────────────────────

function AudienceCards({ currency }: { currency: import('../contexts/CurrencyContext').Currency }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Audience Performance</h3>
        <InfoTooltip />
      </div>
      <div className="space-y-3">
        {audienceSegments.map((seg) => (
          <div
            key={seg.segment}
            className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors"
          >
            <p className="text-xs font-semibold text-gray-800 mb-2">{seg.segment}</p>
            <div className="grid grid-cols-4 gap-3">
              <MetricCell label="Spend" value={fc(seg.spend, currency)} />
              <MetricCell label="Sales" value={fc(seg.sales, currency)} />
              <MetricCell label="ACOS" value={fmtPct(seg.acos)} />
              <MetricCell label="ROAS" value={`${seg.roas.toFixed(2)}x`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-xs font-semibold text-gray-800">{value}</p>
    </div>
  );
}

// ─── Audience Radar ──────────────────────────────────────────────────────────

const RADAR_COLORS = ['#0F766E', '#4B9DCC', '#D97706', '#E84818', '#7C3AED'];

function AudienceRadar() {
  const radarData = useMemo(() => {
    const maxCtr = Math.max(...audienceSegments.map((s) => s.ctr));
    const maxCvr = Math.max(...audienceSegments.map((s) => s.cvr));
    const maxRoas = Math.max(...audienceSegments.map((s) => s.roas));
    const maxSpend = Math.max(...audienceSegments.map((s) => s.spend));
    const maxSales = Math.max(...audienceSegments.map((s) => s.sales));

    const metrics = ['CTR', 'CVR', 'ROAS', 'Spend Share', 'Sales Share'];
    return metrics.map((metric) => {
      const point: Record<string, string | number> = { metric };
      for (const seg of audienceSegments) {
        let normalized: number;
        switch (metric) {
          case 'CTR': normalized = seg.ctr / maxCtr * 100; break;
          case 'CVR': normalized = seg.cvr / maxCvr * 100; break;
          case 'ROAS': normalized = seg.roas / maxRoas * 100; break;
          case 'Spend Share': normalized = seg.spend / maxSpend * 100; break;
          case 'Sales Share': normalized = seg.sales / maxSales * 100; break;
          default: normalized = 0;
        }
        point[seg.segment] = Math.round(normalized);
      }
      return point;
    });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Efficiency Comparison</h3>
        <InfoTooltip />
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={radarData} outerRadius="70%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 10, fill: '#6b7280' }}
          />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
          {audienceSegments.map((seg, i) => (
            <Radar
              key={seg.segment}
              name={seg.segment}
              dataKey={seg.segment}
              stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
              fill={RADAR_COLORS[i % RADAR_COLORS.length]}
              fillOpacity={0.08}
              strokeWidth={2}
            />
          ))}
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-lg">
                  <p className="font-semibold mb-1">{label}</p>
                  {payload.map((p) => (
                    <div key={String(p.name)} className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-gray-300">{p.name}</span>
                      <span className="font-semibold ml-auto">{p.value}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            iconType="circle"
            iconSize={6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

