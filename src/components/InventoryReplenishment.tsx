import { useMemo } from 'react';
import { inventoryData, type InventorySKU, type StockStatus } from '../data/inventoryData';
import DeepDiveTable, {
  type ColumnDef,
  percentCellStyle,
  percentFormatter,
  ppFormatter,
  currencyFormatter,
  numberFormatter,
} from './deepdive/DeepDiveTable';
import { useCurrency } from '../contexts/CurrencyContext';
import LastRefreshed from './LastRefreshed';

type Row = Record<string, unknown>;

const STATUS_ORDER: StockStatus[] = ['Out of Stock', 'Critical', 'Low Stock', 'In Stock', 'Overstock'];

// Status badge renderer
function statusCell(params: { value: unknown }) {
  const status = params.value as string;
  const colors: Record<string, string> = {
    'In Stock': 'color: #16A34A',
    'Low Stock': 'color: #CA8A04',
    'Critical': 'color: #EA580C',
    'Out of Stock': 'color: #DC2626',
    'Overstock': 'color: #3B82F6',
  };
  return { fontWeight: '600', ...(colors[status] ? { color: colors[status].split(': ')[1] } : {}) };
}

// Days formatter
const daysFormatter = (params: { value: unknown }) => {
  const v = params.value as number;
  if (v >= 900) return '∞';
  return `${v}d`;
};

export default function InventoryReplenishment() {
  const { currency } = useCurrency();
  const fmtCurrency = useMemo(() => currencyFormatter(currency), [currency]);

  // Flatten data for DeepDiveTable — sorted by urgency
  const rows = useMemo<Row[]>(
    () =>
      [...inventoryData]
        .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
        .map((d) => ({
          sku: d.sku,
          title: d.title,
          category: d.category,
          supplier: d.supplier,
          status: d.status,
          currentStock: d.currentStock,
          reserved: d.reserved,
          available: d.available,
          inbound: d.inbound,
          avgDailySales: d.avgDailySales,
          avgDailySalesPoP: d.avgDailySalesPoP,
          avgDailySalesDiffLY: d.avgDailySalesDiffLY,
          daysOfSupply: d.daysOfSupply,
          daysOfSupplyPoP: d.daysOfSupplyPoP,
          daysOfSupplyDiffLY: d.daysOfSupplyDiffLY,
          reorderPoint: d.reorderPoint,
          safetyStock: d.safetyStock,
          suggestedQty: d.suggestedQty,
          leadTimeDays: d.leadTimeDays,
          estStockoutDate: d.estStockoutDate,
          revenueAtRisk: d.revenueAtRisk,
        })),
    []
  );

  // Child rows: warehouse breakdown per SKU
  const warehouseMap = useMemo<Record<string, Row[]>>(
    () =>
      Object.fromEntries(
        inventoryData.map((d) => [
          d.sku,
          d.warehouses.map((w) => ({
            warehouse: w.warehouse,
            title: '',
            category: '',
            supplier: '',
            status: '',
            currentStock: w.currentStock,
            reserved: w.reserved,
            available: w.available,
            inbound: w.inbound,
            avgDailySales: 0,
            avgDailySalesPoP: 0,
            avgDailySalesDiffLY: 0,
            daysOfSupply: 0,
            daysOfSupplyPoP: 0,
            daysOfSupplyDiffLY: 0,
            reorderPoint: 0,
            safetyStock: 0,
            suggestedQty: 0,
            leadTimeDays: 0,
            estStockoutDate: '',
            revenueAtRisk: 0,
          })),
        ])
      ),
    []
  );

  // Totals
  const totals = useMemo<Row[]>(() => {
    const n = inventoryData.length;
    const sum = (key: keyof InventorySKU) =>
      inventoryData.reduce((s, d) => s + (d[key] as number), 0);
    const avg = (key: keyof InventorySKU) =>
      Math.round(sum(key) / n * 100) / 100;

    const totalAvgDaily = avg('avgDailySales');
    const totalAvail = sum('available');
    return [{
      sku: 'Total',
      title: '',
      category: '',
      supplier: '',
      status: '',
      currentStock: sum('currentStock'),
      reserved: sum('reserved'),
      available: totalAvail,
      inbound: sum('inbound'),
      avgDailySales: Math.round(inventoryData.reduce((s, d) => s + d.avgDailySales, 0) * 10) / 10,
      avgDailySalesPoP: avg('avgDailySalesPoP'),
      avgDailySalesDiffLY: avg('avgDailySalesDiffLY'),
      daysOfSupply: totalAvgDaily > 0 ? Math.round(totalAvail / (totalAvgDaily * n)) : 0,
      daysOfSupplyPoP: avg('daysOfSupplyPoP'),
      daysOfSupplyDiffLY: avg('daysOfSupplyDiffLY'),
      reorderPoint: sum('reorderPoint'),
      safetyStock: sum('safetyStock'),
      suggestedQty: sum('suggestedQty'),
      leadTimeDays: Math.round(avg('leadTimeDays')),
      estStockoutDate: '',
      revenueAtRisk: Math.round(sum('revenueAtRisk') * 100) / 100,
    }];
  }, []);

  // SubField helpers
  const pctSub = (field: string) => [
    { field: `${field}PoP`, label: 'PoP', formatter: percentFormatter, cellStyle: percentCellStyle },
    { field: `${field}DiffLY`, label: 'LY', formatter: percentFormatter, cellStyle: percentCellStyle },
  ];

  const columns = useMemo<ColumnDef[]>(
    () => [
      { field: 'sku', headerName: 'SKU', pinned: 'left', width: 100 },
      { field: 'title', headerName: 'Product', width: 220 },
      { field: 'category', headerName: 'Category', width: 130 },
      { field: 'status', headerName: 'Status', width: 110, cellStyle: statusCell },
      { field: 'currentStock', headerName: 'Stock', valueFormatter: numberFormatter, width: 90 },
      { field: 'reserved', headerName: 'Reserved', valueFormatter: numberFormatter, width: 90 },
      { field: 'available', headerName: 'Available', valueFormatter: numberFormatter, width: 100 },
      { field: 'inbound', headerName: 'Inbound', valueFormatter: numberFormatter, width: 90 },
      {
        field: 'avgDailySales', headerName: 'Avg Daily Sales', width: 130,
        valueFormatter: (p) => {
          const v = p.value as number;
          return v > 0 ? v.toFixed(1) : '—';
        },
        subFields: pctSub('avgDailySales'),
      },
      {
        field: 'daysOfSupply', headerName: 'Days of Supply', width: 130,
        valueFormatter: daysFormatter,
        cellStyle: (p) => {
          const v = p.value as number;
          if (v === 0) return { color: '#DC2626', fontWeight: '700' };
          if (v < 7) return { color: '#EA580C', fontWeight: '600' };
          if (v < 21) return { color: '#CA8A04' };
          if (v > 120) return { color: '#3B82F6' };
          return {};
        },
        subFields: pctSub('daysOfSupply'),
      },
      { field: 'reorderPoint', headerName: 'Reorder Point', valueFormatter: numberFormatter, width: 120 },
      { field: 'safetyStock', headerName: 'Safety Stock', valueFormatter: numberFormatter, width: 110 },
      {
        field: 'suggestedQty', headerName: 'Suggested Qty', width: 120,
        valueFormatter: (p) => {
          const v = p.value as number;
          return v > 0 ? v.toLocaleString() : '—';
        },
        cellStyle: (p) => {
          const v = p.value as number;
          return v > 0 ? { color: '#0F766E', fontWeight: '600' } : {};
        },
      },
      {
        field: 'leadTimeDays', headerName: 'Lead Time', width: 100,
        valueFormatter: (p) => {
          const v = p.value as number;
          return v > 0 ? `${v}d` : '—';
        },
      },
      { field: 'supplier', headerName: 'Supplier', width: 160 },
      {
        field: 'estStockoutDate', headerName: 'Est. Stockout', width: 120,
        cellStyle: (p) => {
          const v = p.value as string;
          if (v === 'Now') return { color: '#DC2626', fontWeight: '700' };
          if (v && v !== '—') return { color: '#EA580C' };
          return {};
        },
      },
      {
        field: 'revenueAtRisk', headerName: 'Revenue at Risk', valueFormatter: fmtCurrency, width: 140,
        cellStyle: (p) => {
          const v = p.value as number;
          return v > 0 ? { color: '#DC2626', fontWeight: '600' } : {};
        },
      },
    ],
    [fmtCurrency]
  );

  return (
    <div className="space-y-6">
      <DeepDiveTable
        title="Inventory Replenishment Planner"
        rowData={rows}
        columnDefs={columns}
        pinnedBottomRowData={totals}
        childRowsMap={warehouseMap}
        rowKeyField="sku"
        childLabelField="warehouse"
      />
      <div className="flex justify-end">
        <LastRefreshed offsetMinutes={6} />
      </div>
    </div>
  );
}
