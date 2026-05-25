import { useMemo } from 'react';
import type { ColumnDef } from './deepdive/DeepDiveTable';
import DeepDiveTable, {
  percentCellStyle,
  percentFormatter,
  ppFormatter,
  currencyFormatter,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import {
  marketplaceData,
  categoryData,
  asinData,
  skuDataByAsin,
} from '../data/deepdiveData';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import LastRefreshed from './LastRefreshed';

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
  const pctSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: percentFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: percentFormatter, cellStyle: percentCellStyle },
  ];

  const ppSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: ppFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: ppFormatter, cellStyle: percentCellStyle },
  ];

  const fmtCurrency = currencyFormatter(currency);

  // Column order follows business narrative:
  //   1) Volume & revenue
  //   2) Customer mix (NTB / S&S)
  //   3) Demand funnel (traffic & conversion)
  //   4) Ads activity (spend → efficiency)
  //   5) Margin cascade (Product → Channel → Growth → Net Profit/Unit)
  // `hide: true` keeps the column in the ColumnToggle but off by default.
  // `group` drives the visual band header above the column row.
  const VOL = 'Volume & revenue';
  const MIX = 'Customer mix';
  const FUNNEL = 'Demand funnel';
  const ADS = 'Ads activity';
  const MARGIN = 'Margin cascade';

  return [
    // ─── 1) Volume & revenue ─────────────────────────────────────────
    { field: 'sales',       headerName: 'Sales',        valueFormatter: fmtCurrency,      width: 140, group: VOL, subFields: pctSub('sales') },
    { field: 'salesShare',  headerName: 'Sales Share',  valueFormatter: pctShareFormatter, width: 140, group: VOL, subFields: ppSub('salesShare') },
    { field: 'orders',      headerName: 'Orders',       valueFormatter: numberFormatter,   width: 120, group: VOL, subFields: pctSub('orders') },
    { field: 'units',       headerName: 'Units',        valueFormatter: numberFormatter,   width: 120, group: VOL, subFields: pctSub('units') },
    { field: 'avgPrice',    headerName: 'Avg Price',    valueFormatter: fmtCurrency,       width: 130, group: VOL, subFields: pctSub('avgPrice') },
    { field: 'discounts',   headerName: 'Discounts',    valueFormatter: fmtCurrency,       width: 130, group: VOL, hide: true, subFields: pctSub('discounts') },

    // ─── 2) Customer mix (S&S, NTB) ──────────────────────────────────
    { field: 'ntbOrders',   headerName: 'NTB Orders',   valueFormatter: numberFormatter,   width: 130, group: MIX,             subFields: pctSub('ntbOrders') },
    { field: 'ntbPct',      headerName: 'NTB %',        valueFormatter: pctShareFormatter, width: 110, group: MIX, hide: true, subFields: ppSub('ntbPct') },
    { field: 'ssOrders',    headerName: 'S&S Orders',   valueFormatter: numberFormatter,   width: 130, group: MIX,             subFields: pctSub('ssOrders') },
    { field: 'ssPct',       headerName: 'S&S %',        valueFormatter: pctShareFormatter, width: 110, group: MIX, hide: true, subFields: ppSub('ssPct') },

    // ─── 3) Demand funnel (traffic & conversion) ─────────────────────
    { field: 'pageViews',   headerName: 'Page Views',   valueFormatter: numberFormatter,   width: 130, group: FUNNEL,             subFields: pctSub('pageViews') },
    { field: 'sessions',    headerName: 'Sessions',     valueFormatter: numberFormatter,   width: 120, group: FUNNEL,             subFields: pctSub('sessions') },
    { field: 'cvr',         headerName: 'CVR',          valueFormatter: pctShareFormatter, width: 110, group: FUNNEL,             subFields: ppSub('cvr') },
    { field: 'bboxWinRate', headerName: 'BBox Win',     valueFormatter: pctShareFormatter, width: 120, group: FUNNEL, hide: true, subFields: ppSub('bboxWinRate') },
    { field: 'organicPct',  headerName: 'Organic %',    valueFormatter: pctShareFormatter, width: 120, group: FUNNEL, hide: true, subFields: ppSub('organicPct') },

    // ─── 4) Ads activity ─────────────────────────────────────────────
    { field: 'adSpend',     headerName: 'Ad Spend',     valueFormatter: fmtCurrency,       width: 130, group: ADS,             subFields: pctSub('adSpend') },
    { field: 'adSales',     headerName: 'Ad Sales',     valueFormatter: fmtCurrency,       width: 130, group: ADS, hide: true, subFields: pctSub('adSales') },
    { field: 'adCpc',       headerName: 'Ad CPC',       valueFormatter: fmtCurrency,       width: 110, group: ADS, hide: true, subFields: pctSub('adCpc') },
    { field: 'ctr',         headerName: 'CTR',          valueFormatter: pctShareFormatter, width: 100, group: ADS, hide: true, subFields: ppSub('ctr') },
    { field: 'adCvr',       headerName: 'Ad CVR',       valueFormatter: pctShareFormatter, width: 110, group: ADS, hide: true, subFields: ppSub('adCvr') },
    { field: 'roas',        headerName: 'ROAS',         valueFormatter: roasFormatter,     width: 110, group: ADS,             subFields: pctSub('roas') },
    { field: 'acos',        headerName: 'ACOS',         valueFormatter: pctShareFormatter, width: 110, group: ADS,             subFields: ppSub('acos') },
    { field: 'tacos',       headerName: 'TACOS',        valueFormatter: pctShareFormatter, width: 110, group: ADS,             subFields: ppSub('tacos') },
    { field: 'totalCpa',    headerName: 'Total CPA',    valueFormatter: fmtCurrency,       width: 120, group: ADS, hide: true, subFields: pctSub('totalCpa') },
    { field: 'adReliance',  headerName: 'Ad Reliance',  valueFormatter: pctShareFormatter, width: 130, group: ADS, hide: true, subFields: ppSub('adReliance') },

    // ─── 5) Margin cascade ───────────────────────────────────────────
    { field: 'productMargin',    headerName: 'Product Margin',    valueFormatter: pctShareFormatter, width: 150, group: MARGIN,             subFields: ppSub('productMargin') },
    { field: 'channelMargin',    headerName: 'Channel Margin',    valueFormatter: pctShareFormatter, width: 150, group: MARGIN,             subFields: ppSub('channelMargin') },
    { field: 'growthMargin',     headerName: 'Growth Margin',     valueFormatter: pctShareFormatter, width: 150, group: MARGIN,             subFields: ppSub('growthMargin') },
    { field: 'netProfitPerUnit', headerName: 'Net Profit / Unit', valueFormatter: fmtCurrency,       width: 150, group: MARGIN,             subFields: pctSub('netProfitPerUnit') },
  ];
}

export default function DeepDive() {
  const { currency } = useCurrency();
  const metrics = useMemo(() => metricColumns(currency), [currency]);

  const marketplaceCols = useMemo<ColumnDef[]>(
    () => [
      { field: 'marketplace', headerName: 'Marketplace', pinned: 'left', width: 150 },
      ...metrics,
    ],
    [metrics]
  );

  const marketplaceTotals = useMemo(
    () => [buildTotals(marketplaceData as unknown as Row[], 'marketplace', 'Total')],
    []
  );

  const categoryCols = useMemo<ColumnDef[]>(
    () => [
      { field: 'category', headerName: 'Category', pinned: 'left', width: 160 },
      ...metrics,
    ],
    [metrics]
  );

  const categoryTotals = useMemo(
    () => [buildTotals(categoryData as unknown as Row[], 'category', 'Total')],
    []
  );

  const asinCols = useMemo<ColumnDef[]>(
    () => [
      { field: 'asin', headerName: 'ASIN', pinned: 'left', width: 130 },
      { field: 'title', headerName: 'Title', width: 280 },
      ...metrics,
    ],
    [metrics]
  );

  const asinTotals = useMemo(
    () => [buildTotals(asinData as unknown as Row[], 'asin', 'Total')],
    []
  );

  return (
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
        title="Best Selling ASINs"
        tooltip="Sales and advertising metrics per ASIN. Expand a row to see SKU-level breakdown. PoP = period-over-period; LY = vs. last year."
        subtitle="Columns read left to right: what I sold → who bought it → how they got there → what I paid → what's left."
        rowData={asinData}
        columnDefs={asinCols}
        pinnedBottomRowData={asinTotals}
        childRowsMap={skuDataByAsin}
        rowKeyField="asin"
        childLabelField="sku"
        copyablePinnedCell
      />
      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={9} />
      </div>
    </div>
  );
}
