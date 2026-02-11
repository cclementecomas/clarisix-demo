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
  'adSpendPoP', 'adSpendDiffLY',
  'adSalesPoP', 'adSalesDiffLY',
  'roas', 'roasPoP', 'roasDiffLY',
  'acos', 'acosPoP', 'acosDiffLY',
  'tacos', 'tacosPoP', 'tacosDiffLY',
  'bboxWinRate', 'bboxWinRatePoP', 'bboxWinRateDiffLY',
  'adReliance', 'adReliancePoP', 'adRelianceDiffLY',
  'cvr', 'cvrPoP', 'cvrDiffLY',
  'pageViewsPoP', 'pageViewsDiffLY',
  'sessionsPoP', 'sessionsDiffLY',
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

  return [
    { field: 'sales', headerName: 'Sales', valueFormatter: fmtCurrency, width: 140, subFields: pctSub('sales') },
    { field: 'salesShare', headerName: 'Sales Share', valueFormatter: pctShareFormatter, width: 140, subFields: ppSub('salesShare') },
    { field: 'units', headerName: 'Units', valueFormatter: numberFormatter, width: 130, subFields: pctSub('units') },
    { field: 'adSpend', headerName: 'Ad Spend', valueFormatter: fmtCurrency, width: 140, subFields: pctSub('adSpend') },
    { field: 'adSales', headerName: 'Ad Sales', valueFormatter: fmtCurrency, width: 140, subFields: pctSub('adSales') },
    { field: 'roas', headerName: 'ROAS', valueFormatter: roasFormatter, width: 130, subFields: pctSub('roas') },
    { field: 'acos', headerName: 'ACOS', valueFormatter: pctShareFormatter, width: 140, subFields: ppSub('acos') },
    { field: 'tacos', headerName: 'TACOS', valueFormatter: pctShareFormatter, width: 140, subFields: ppSub('tacos') },
    { field: 'bboxWinRate', headerName: 'BBox Win Rate', valueFormatter: pctShareFormatter, width: 150, subFields: ppSub('bboxWinRate') },
    { field: 'adReliance', headerName: 'Ad Reliance', valueFormatter: pctShareFormatter, width: 140, subFields: ppSub('adReliance') },
    { field: 'cvr', headerName: 'CVR', valueFormatter: pctShareFormatter, width: 130, subFields: ppSub('cvr') },
    { field: 'pageViews', headerName: 'Page Views', valueFormatter: numberFormatter, width: 140, subFields: pctSub('pageViews') },
    { field: 'sessions', headerName: 'Sessions', valueFormatter: numberFormatter, width: 130, subFields: pctSub('sessions') },
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
        rowData={marketplaceData}
        columnDefs={marketplaceCols}
        pinnedBottomRowData={marketplaceTotals}
      />
      <DeepDiveTable
        title="Best Selling Categories"
        rowData={categoryData}
        columnDefs={categoryCols}
        pinnedBottomRowData={categoryTotals}
      />
      <DeepDiveTable
        title="Best Selling ASINs"
        rowData={asinData}
        columnDefs={asinCols}
        pinnedBottomRowData={asinTotals}
        childRowsMap={skuDataByAsin}
        rowKeyField="asin"
        childLabelField="sku"
      />
      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={9} />
      </div>
    </div>
  );
}
