import { useMemo } from 'react';
import { inventoryData, type InventorySKU } from '../data/inventoryData';
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
import LastRefreshed from './LastRefreshed';

type Row = Record<string, unknown>;

export default function InventoryPerformance() {
  const { currency } = useCurrency();
  const fmtCurrency = useMemo(() => currencyFormatter(currency), [currency]);

  const rows = useMemo<Row[]>(
    () =>
      [...inventoryData]
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .map((d) => ({
          sku: d.sku,
          title: d.title,
          category: d.category,
          unitsSold: d.unitsSold,
          unitsSoldPoP: d.unitsSoldPoP,
          unitsSoldDiffLY: d.unitsSoldDiffLY,
          unitsReceived: d.unitsReceived,
          sellThroughRate: d.sellThroughRate,
          sellThroughRatePoP: d.sellThroughRatePoP,
          sellThroughRateDiffLY: d.sellThroughRateDiffLY,
          inventoryTurnover: d.inventoryTurnover,
          inventoryTurnoverPoP: d.inventoryTurnoverPoP,
          inventoryTurnoverDiffLY: d.inventoryTurnoverDiffLY,
          daysOnHand: d.daysOnHand,
          cogs: d.cogs,
          inventoryValue: d.inventoryValue,
          storageCostMonthly: d.storageCostMonthly,
          storageCostMonthlyPoP: d.storageCostMonthlyPoP,
          storageCostMonthlyDiffLY: d.storageCostMonthlyDiffLY,
          roi: d.roi,
          roiPoP: d.roiPoP,
          roiDiffLY: d.roiDiffLY,
        })),
    []
  );

  // Totals
  const totals = useMemo<Row[]>(() => {
    const n = inventoryData.length;
    const sum = (key: keyof InventorySKU) =>
      inventoryData.reduce((s, d) => s + (d[key] as number), 0);
    const avg = (key: keyof InventorySKU) =>
      Math.round(sum(key) / n * 100) / 100;

    return [{
      sku: 'Total',
      title: '',
      category: '',
      unitsSold: sum('unitsSold'),
      unitsSoldPoP: avg('unitsSoldPoP'),
      unitsSoldDiffLY: avg('unitsSoldDiffLY'),
      unitsReceived: sum('unitsReceived'),
      sellThroughRate: avg('sellThroughRate'),
      sellThroughRatePoP: avg('sellThroughRatePoP'),
      sellThroughRateDiffLY: avg('sellThroughRateDiffLY'),
      inventoryTurnover: avg('inventoryTurnover'),
      inventoryTurnoverPoP: avg('inventoryTurnoverPoP'),
      inventoryTurnoverDiffLY: avg('inventoryTurnoverDiffLY'),
      daysOnHand: Math.round(avg('daysOnHand')),
      cogs: Math.round(sum('cogs') * 100) / 100,
      inventoryValue: Math.round(sum('inventoryValue') * 100) / 100,
      storageCostMonthly: Math.round(sum('storageCostMonthly') * 100) / 100,
      storageCostMonthlyPoP: avg('storageCostMonthlyPoP'),
      storageCostMonthlyDiffLY: avg('storageCostMonthlyDiffLY'),
      roi: avg('roi'),
      roiPoP: avg('roiPoP'),
      roiDiffLY: avg('roiDiffLY'),
    }];
  }, []);

  const pctSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: percentFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: percentFormatter, cellStyle: percentCellStyle },
  ];
  const ppSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: ppFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: ppFormatter, cellStyle: percentCellStyle },
  ];

  const turnoverFormatter = (params: { value: unknown }) => {
    const v = params.value as number;
    return v > 0 ? `${v.toFixed(2)}x` : '—';
  };

  const daysFormatter = (params: { value: unknown }) => {
    const v = params.value as number;
    if (v >= 900) return '∞';
    return `${v}d`;
  };

  const columns = useMemo<ColumnDef[]>(
    () => [
      { field: 'sku', headerName: 'SKU', pinned: 'left', width: 100 },
      { field: 'title', headerName: 'Product', width: 220 },
      { field: 'category', headerName: 'Category', width: 130 },
      { field: 'unitsSold', headerName: 'Units Sold', valueFormatter: numberFormatter, width: 110, subFields: pctSub('unitsSold') },
      { field: 'unitsReceived', headerName: 'Units Received', valueFormatter: numberFormatter, width: 130 },
      { field: 'sellThroughRate', headerName: 'Sell-Through %', valueFormatter: pctShareFormatter, width: 130, subFields: ppSub('sellThroughRate') },
      {
        field: 'inventoryTurnover', headerName: 'Turnover', valueFormatter: turnoverFormatter, width: 110,
        cellStyle: (p) => {
          const v = p.value as number;
          if (v >= 8) return { color: '#16A34A', fontWeight: '600' };
          if (v >= 4) return { color: '#CA8A04' };
          if (v > 0) return { color: '#DC2626' };
          return {};
        },
        subFields: pctSub('inventoryTurnover'),
      },
      {
        field: 'daysOnHand', headerName: 'Days on Hand', valueFormatter: daysFormatter, width: 120,
        cellStyle: (p) => {
          const v = p.value as number;
          if (v > 180) return { color: '#DC2626' };
          if (v > 90) return { color: '#CA8A04' };
          return {};
        },
      },
      { field: 'cogs', headerName: 'COGS', valueFormatter: fmtCurrency, width: 110 },
      { field: 'inventoryValue', headerName: 'Inv. Value', valueFormatter: fmtCurrency, width: 120 },
      {
        field: 'storageCostMonthly', headerName: 'Storage Cost/mo', valueFormatter: fmtCurrency, width: 140,
        subFields: pctSub('storageCostMonthly'),
      },
      {
        field: 'roi', headerName: 'ROI', valueFormatter: pctShareFormatter, width: 100,
        cellStyle: (p) => {
          const v = p.value as number;
          if (v >= 100) return { color: '#16A34A', fontWeight: '600' };
          if (v >= 50) return { color: '#CA8A04' };
          if (v > 0) return { color: '#EA580C' };
          return { color: '#DC2626' };
        },
        subFields: pctSub('roi'),
      },
    ],
    [fmtCurrency]
  );

  return (
    <div className="space-y-6">
      <DeepDiveTable
        title="Inventory Performance"
        rowData={rows}
        columnDefs={columns}
        pinnedBottomRowData={totals}
      />
      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={6} />
      </div>
    </div>
  );
}
