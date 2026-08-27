// ─── Sales Deepdive — issue-detection + troubleshooting layout ────────────
// Page structure:
//   1. Issues detected panel (top 5 cross-entity issues by severity)
//   2. Entity selector (Marketplace / Category / ASIN) + view tabs
//   3. Troubleshooting table (simplified diagnostic columns, severity-sorted)
//   4. Entity detail drawer (slides in from row / issue-card click)
//   5. Full metric table (collapsed, opens the existing dense DeepDiveTable
//      for power users / export)

import { useMemo, useState } from 'react';
import type { ColumnDef } from './deepdive/DeepDiveTable';
import DeepDiveTable, {
  percentCellStyle,
  costPercentCellStyle,
  percentFormatter,
  ppFormatter,
  currencyFormatter,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import IssuesPanel from './deepdive/IssuesPanel';
import TroubleshootingTable, { type ModeTabId, type EntityFilter } from './deepdive/TroubleshootingTable';
import EntityDetailDrawer from './deepdive/EntityDetailDrawer';
import {
  marketplaceData,
  categoryData,
  asinData,
  skuDataByAsin,
} from '../data/deepdiveData';
import {
  allDiagnostics,
  type Diagnostic,
  type RankKey,
} from '../data/deepdiveDiagnostics';
import { useCurrency } from '../contexts/CurrencyContext';
import { useProductId } from '../contexts/ProductIdContext';
import LastRefreshed from './LastRefreshed';
import ViewModeToggle, { type ViewMode } from './ViewModeToggle';

type Row = Record<string, unknown>;

const roasFormatter = (params: { value: unknown; row?: unknown }) => {
  const v = params.value as number | null | undefined;
  if (v == null || v === 0) return '';
  return `${v.toFixed(2)}x`;
};

const METRIC_AVG_KEYS = [
  'salesPoP', 'salesDiffLY',
  'salesSharePoP', 'salesShareDiffLY',
  'unitsPoP', 'unitsDiffLY',
  'ordersPoP', 'ordersDiffLY',
  'avgPrice', 'avgPricePoP', 'avgPriceDiffLY',
  'organicPct', 'organicPctPoP', 'organicPctDiffLY',
  'ssPct', 'ssPctPoP', 'ssPctDiffLY',
  'ssOrdersPoP', 'ssOrdersDiffLY',
  'ntbPct', 'ntbPctPoP', 'ntbPctDiffLY',
  'ntbOrdersPoP', 'ntbOrdersDiffLY',
  'discountsPoP', 'discountsDiffLY',
  'adSpendPoP', 'adSpendDiffLY',
  'adSalesPoP', 'adSalesDiffLY',
  'roas', 'roasPoP', 'roasDiffLY',
  'acos', 'acosPoP', 'acosDiffLY',
  'tacos', 'tacosPoP', 'tacosDiffLY',
  'totalCpa', 'totalCpaPoP', 'totalCpaDiffLY',
  'adCpc', 'adCpcPoP', 'adCpcDiffLY',
  'ctr', 'ctrPoP', 'ctrDiffLY',
  'adCvr', 'adCvrPoP', 'adCvrDiffLY',
  'bboxWinRate', 'bboxWinRatePoP', 'bboxWinRateDiffLY',
  'adReliance', 'adReliancePoP', 'adRelianceDiffLY',
  'cvr', 'cvrPoP', 'cvrDiffLY',
  'pageViewsPoP', 'pageViewsDiffLY',
  'sessionsPoP', 'sessionsDiffLY',
  'productMargin', 'productMarginPoP', 'productMarginDiffLY',
  'channelMargin', 'channelMarginPoP', 'channelMarginDiffLY',
  'growthMargin', 'growthMarginPoP', 'growthMarginDiffLY',
  'netProfitPerUnit', 'netProfitPerUnitPoP', 'netProfitPerUnitDiffLY',
];

const SHARE_KEYS = ['salesShare'];

function buildTotals(
  rows: Row[],
  labelKey: string,
  labelValue: string,
): Row {
  const total: Row = { [labelKey]: labelValue };
  const numericKeys = Object.keys(rows[0] || {}).filter(
    (k) => k !== labelKey && typeof rows[0][k] === 'number'
  );

  for (const key of numericKeys) {
    const values = rows.map((r) => r[key] as number);
    if (METRIC_AVG_KEYS.includes(key)) {
      total[key] = values.reduce((a, b) => a + b, 0) / values.length;
    } else if (SHARE_KEYS.includes(key)) {
      total[key] = values.reduce((a, b) => a + b, 0);
    } else {
      total[key] = values.reduce((a, b) => a + b, 0);
    }
  }
  return total;
}

function metricColumns(currency: Parameters<typeof currencyFormatter>[0]): ColumnDef[] {
  // Higher-is-better sub-fields: positive change reads green.
  const pctSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: percentFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: percentFormatter, cellStyle: percentCellStyle },
  ];
  const ppSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: ppFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: ppFormatter, cellStyle: percentCellStyle },
  ];

  // Lower-is-better sub-fields (cost / efficiency metrics): positive
  // change reads red, negative reads green. Use for ACOS, TACOS, Ad Spend,
  // Discounts, Ad CPC, Total CPA, Ad Reliance.
  const pctSubCost = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: percentFormatter, cellStyle: costPercentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: percentFormatter, cellStyle: costPercentCellStyle },
  ];
  const ppSubCost = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: ppFormatter, cellStyle: costPercentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: ppFormatter, cellStyle: costPercentCellStyle },
  ];

  const fmtCurrency = currencyFormatter(currency);

  // Bands rephrased as troubleshooting questions (Rule 7 in the spec).
  // The DeepDiveTable band header uses these as group labels.
  const VOL = 'What sold?';
  const MIX = 'Who bought?';
  const FUNNEL = 'Where is demand leaking?';
  const ADS = 'Is advertising efficient?';
  const MARGIN = 'Is margin healthy?';

  return [
    // What sold?
    { field: 'sales',       headerName: 'Sales',        valueFormatter: fmtCurrency,       width: 140, group: VOL, subFields: pctSub('sales') },
    { field: 'salesShare',  headerName: 'Sales Share',  valueFormatter: pctShareFormatter, width: 140, group: VOL, subFields: ppSub('salesShare') },
    { field: 'orders',      headerName: 'Orders',       valueFormatter: numberFormatter,   width: 120, group: VOL, subFields: pctSub('orders') },
    { field: 'units',       headerName: 'Units',        valueFormatter: numberFormatter,   width: 120, group: VOL, subFields: pctSub('units') },
    { field: 'avgPrice',    headerName: 'Avg Price',    valueFormatter: fmtCurrency,       width: 130, group: VOL, subFields: pctSub('avgPrice') },

    // Who bought?
    { field: 'ntbOrders',   headerName: 'NTB Orders',   valueFormatter: numberFormatter,   width: 130, group: MIX,             subFields: pctSub('ntbOrders') },
    { field: 'ntbPct',      headerName: 'NTB %',        valueFormatter: pctShareFormatter, width: 110, group: MIX, hide: true, subFields: ppSub('ntbPct') },
    { field: 'ssOrders',    headerName: 'S&S Orders',   valueFormatter: numberFormatter,   width: 130, group: MIX,             subFields: pctSub('ssOrders') },
    { field: 'ssPct',       headerName: 'S&S %',        valueFormatter: pctShareFormatter, width: 110, group: MIX, hide: true, subFields: ppSub('ssPct') },

    // Where is demand leaking?
    { field: 'pageViews',   headerName: 'Page Views',   valueFormatter: numberFormatter,   width: 130, group: FUNNEL,             subFields: pctSub('pageViews') },
    { field: 'sessions',    headerName: 'Sessions',     valueFormatter: numberFormatter,   width: 120, group: FUNNEL,             subFields: pctSub('sessions') },
    { field: 'cvr',         headerName: 'CVR',          valueFormatter: pctShareFormatter, width: 110, group: FUNNEL,             subFields: ppSub('cvr') },
    { field: 'bboxWinRate', headerName: 'BBox Win',     valueFormatter: pctShareFormatter, width: 120, group: FUNNEL, hide: true, subFields: ppSub('bboxWinRate') },
    { field: 'organicPct',  headerName: 'Organic %',    valueFormatter: pctShareFormatter, width: 120, group: FUNNEL, hide: true, subFields: ppSub('organicPct') },

    // Is advertising efficient?  (cost metrics use inverted colour polarity)
    { field: 'discounts',   headerName: 'Discounts',    valueFormatter: fmtCurrency,       width: 130, group: ADS, hide: true, heat: 'down', subFields: pctSubCost('discounts') },
    { field: 'adSpend',     headerName: 'Ad Spend',     valueFormatter: fmtCurrency,       width: 130, group: ADS,             heat: 'down', subFields: pctSubCost('adSpend') },
    { field: 'adSales',     headerName: 'Ad Sales',     valueFormatter: fmtCurrency,       width: 130, group: ADS, hide: true, subFields: pctSub('adSales') },
    { field: 'adCpc',       headerName: 'Ad CPC',       valueFormatter: fmtCurrency,       width: 110, group: ADS, hide: true, heat: 'down', subFields: pctSubCost('adCpc') },
    { field: 'ctr',         headerName: 'CTR',          valueFormatter: pctShareFormatter, width: 100, group: ADS, hide: true, subFields: ppSub('ctr') },
    { field: 'adCvr',       headerName: 'Ad CVR',       valueFormatter: pctShareFormatter, width: 110, group: ADS, hide: true, subFields: ppSub('adCvr') },
    { field: 'roas',        headerName: 'ROAS',         valueFormatter: roasFormatter,     width: 110, group: ADS,             subFields: pctSub('roas') },
    { field: 'acos',        headerName: 'ACOS',         valueFormatter: pctShareFormatter, width: 110, group: ADS,             heat: 'down', subFields: ppSubCost('acos') },
    { field: 'tacos',       headerName: 'TACOS',        valueFormatter: pctShareFormatter, width: 110, group: ADS,             heat: 'down', subFields: ppSubCost('tacos') },
    { field: 'totalCpa',    headerName: 'Total CPA',    valueFormatter: fmtCurrency,       width: 120, group: ADS, hide: true, heat: 'down', subFields: pctSubCost('totalCpa') },
    { field: 'adReliance',  headerName: 'Ad Reliance',  valueFormatter: pctShareFormatter, width: 130, group: ADS, hide: true, heat: 'down', subFields: ppSubCost('adReliance') },

    // Is margin healthy?
    { field: 'productMargin',    headerName: 'Product Margin',    valueFormatter: pctShareFormatter, width: 150, group: MARGIN,             subFields: ppSub('productMargin') },
    { field: 'channelMargin',    headerName: 'Channel Margin',    valueFormatter: pctShareFormatter, width: 150, group: MARGIN,             subFields: ppSub('channelMargin') },
    { field: 'growthMargin',     headerName: 'Growth Margin',     valueFormatter: pctShareFormatter, width: 150, group: MARGIN,             subFields: ppSub('growthMargin') },
    { field: 'netProfitPerUnit', headerName: 'Net Profit / Unit', valueFormatter: fmtCurrency,       width: 150, group: MARGIN,             subFields: pctSub('netProfitPerUnit') },
  ];
}

export default function DeepDive() {
  const { currency } = useCurrency();
  const { productId } = useProductId();
  const bySku = productId === 'sku';
  const metrics = useMemo(() => metricColumns(currency), [currency]);

  // Defaults per the spec:
  //   - All entities together (Marketplace + Category + ASIN)
  //   - Decision mode: Profit risks
  //   - Rank by: Profit impact
  const [mode, setMode] = useState<ModeTabId>('profit-risk');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [rank, setRank] = useState<RankKey>('profit');
  const [selected, setSelected] = useState<Diagnostic | null>(null);
  const [view, setView] = useState<ViewMode>('decision');

  // ── Full-metrics column / data wiring (existing DeepDiveTable) ─────────
  const marketplaceCols = useMemo<ColumnDef[]>(
    () => [{ field: 'marketplace', headerName: 'Marketplace', pinned: 'left', width: 150 }, ...metrics],
    [metrics],
  );
  const categoryCols = useMemo<ColumnDef[]>(
    () => [{ field: 'category', headerName: 'Category', pinned: 'left', width: 160 }, ...metrics],
    [metrics],
  );
  const asinCols = useMemo<ColumnDef[]>(
    () => [
      { field: 'asin', headerName: bySku ? 'SKU' : 'ASIN', pinned: 'left', width: 130 },
      { field: 'title', headerName: 'Title', width: 280 },
      ...metrics,
    ],
    [metrics, bySku],
  );

  const marketplaceTotals = useMemo(() => [buildTotals(marketplaceData as unknown as Row[], 'marketplace', 'Total')], []);
  const categoryTotals    = useMemo(() => [buildTotals(categoryData    as unknown as Row[], 'category',    'Total')], []);
  const asinTotals        = useMemo(() => [buildTotals(asinData        as unknown as Row[], 'asin',        'Total')], []);

  return (
    <div className="space-y-4 min-w-0">
      {/* Header — page title + Decision/Analyst toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Diagnostics</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {view === 'decision'
              ? 'What’s hurting sales, and what should I do about it?'
              : 'Every metric across marketplaces, categories and products — for analysis and export.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LastRefreshed offsetMinutes={9} />
          <ViewModeToggle mode={view} onChange={setView} />
        </div>
      </div>

      {view === 'decision' ? (
        <>
          {/* Issues detected (cross-entity, severity-ranked) */}
          <IssuesPanel onIssueClick={setSelected} />

          {/* Troubleshooting table with decision-mode tabs + Rank-by + entity filter */}
          <TroubleshootingTable
            diagnostics={allDiagnostics}
            mode={mode}
            onModeChange={setMode}
            entityFilter={entityFilter}
            onEntityFilterChange={setEntityFilter}
            rank={rank}
            onRankChange={setRank}
            onRowClick={setSelected}
          />
        </>
      ) : (
        /* Analyst — full metric tables (Marketplace · Category · ASIN), every metric, no diagnostic filter */
        <div className="space-y-6">
          <DeepDiveTable
            title="Best Selling Marketplaces"
            tooltip="Sales and advertising metrics aggregated by Amazon marketplace. PoP = period-over-period; LY = vs. last year."
            subtitle="Columns read left to right: what I sold → who bought it → how they got there → what I paid → what's left."
            rowData={marketplaceData}
            columnDefs={marketplaceCols}
            pinnedBottomRowData={marketplaceTotals}
          />
          <DeepDiveTable
            title="Best Selling Categories"
            tooltip="Sales and advertising metrics aggregated by product category. PoP = period-over-period; LY = vs. last year."
            subtitle="Columns read left to right: what I sold → who bought it → how they got there → what I paid → what's left."
            rowData={categoryData}
            columnDefs={categoryCols}
            pinnedBottomRowData={categoryTotals}
          />
          <DeepDiveTable
            title={bySku ? 'Best Selling SKUs' : 'Best Selling ASINs'}
            tooltip={`Sales and advertising metrics per ${bySku ? 'SKU' : 'ASIN'}. ${bySku ? 'Grouped up to the ASIN when expanded' : 'Expand a row to see SKU-level breakdown'}. PoP = period-over-period; LY = vs. last year.`}
            subtitle="Columns read left to right: what I sold → who bought it → how they got there → what I paid → what's left."
            rowData={asinData}
            columnDefs={asinCols}
            pinnedBottomRowData={asinTotals}
            childRowsMap={skuDataByAsin}
            rowKeyField="asin"
            childLabelField="sku"
            initialFlat={bySku}
            copyablePinnedCell
          />
        </div>
      )}

      {/* Detail drawer (opened from Decision issues / rows) */}
      <EntityDetailDrawer
        d={selected}
        onClose={() => setSelected(null)}
        onCta={(_route) => {
          // Hook into App-level navigation when this lifts up.
        }}
      />
    </div>
  );
}
