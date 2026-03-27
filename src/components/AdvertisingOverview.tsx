import DeepDiveTable, {
  ColumnDef,
  currencyFormatter,
  percentCellStyle,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import AdvertisingKPICards from './advertising/AdvertisingKPICards';
import AdSpendRunRate from './advertising/AdSpendRunRate';
import LastRefreshed from './LastRefreshed';
import {
  adByMarketplace,
  adByCategory,
  adBySubcategory,
  adByASIN,
  adPerfTotals,
} from '../data/advertisingData';
import { useCurrency } from '../contexts/CurrencyContext';

// Suppress unused import warnings for formatters exported from DeepDiveTable
// that are available for column definitions but not all used inline
void percentCellStyle;
void pctShareFormatter;

function useAdPerfCols(): ColumnDef[] {
  const { currency } = useCurrency();
  const cf = currencyFormatter(currency);
  return [
    {
      field: 'name',
      headerName: 'Name',
      pinned: 'left',
      width: 180,
      valueFormatter: ({ value }) => String(value ?? ''),
    },
    {
      field: 'spend',
      headerName: 'Spend',
      valueFormatter: cf,
      subFields: [{ field: 'spendPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#166534' } : v < 0 ? { color: '#991B1B' } : {}; } }],
    },
    {
      field: 'sales',
      headerName: 'Sales',
      valueFormatter: cf,
      subFields: [{ field: 'salesPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#166534' } : v < 0 ? { color: '#991B1B' } : {}; } }],
    },
    {
      field: 'acos',
      headerName: 'ACOS',
      valueFormatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; },
      cellStyle: ({ value }) => { const v = value as number; return v > 35 ? { color: '#991B1B' } : v < 20 ? { color: '#166534' } : {}; },
      subFields: [{ field: 'acosPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#991B1B' } : v < 0 ? { color: '#166534' } : {}; } }],
    },
    {
      field: 'tacos',
      headerName: 'TACOS',
      valueFormatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; },
      subFields: [{ field: 'tacosPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#991B1B' } : v < 0 ? { color: '#166534' } : {}; } }],
    },
    {
      field: 'orders',
      headerName: 'Orders',
      valueFormatter: numberFormatter,
      subFields: [{ field: 'ordersPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#166534' } : v < 0 ? { color: '#991B1B' } : {}; } }],
    },
    {
      field: 'cpc',
      headerName: 'CPC',
      valueFormatter: cf,
      subFields: [{ field: 'cpcPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#991B1B' } : v < 0 ? { color: '#166534' } : {}; } }],
    },
    {
      field: 'cpa',
      headerName: 'CPA',
      valueFormatter: cf,
      subFields: [{ field: 'cpaPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#991B1B' } : v < 0 ? { color: '#166534' } : {}; } }],
    },
    {
      field: 'cvr',
      headerName: 'CVR',
      valueFormatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; },
      subFields: [{ field: 'cvrPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#166534' } : v < 0 ? { color: '#991B1B' } : {}; } }],
    },
    {
      field: 'ctr',
      headerName: 'CTR',
      valueFormatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v.toFixed(2)}%`; },
      subFields: [{ field: 'ctrPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#166534' } : v < 0 ? { color: '#991B1B' } : {}; } }],
    },
    {
      field: 'ntbPct',
      headerName: 'NTB%',
      valueFormatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v.toFixed(1)}%`; },
      subFields: [{ field: 'ntbPctPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#166534' } : v < 0 ? { color: '#991B1B' } : {}; } }],
    },
  ];
}

export default function AdvertisingOverview() {
  const cols = useAdPerfCols();
  const totalsRow = [adPerfTotals];

  return (
    <div className="space-y-4">
      <AdvertisingKPICards />

      <AdSpendRunRate />

      <DeepDiveTable
        title="Performance by Marketplace"
        rowData={adByMarketplace}
        columnDefs={cols}
        pinnedBottomRowData={totalsRow}
      />

      <DeepDiveTable
        title="Performance by Category"
        rowData={adByCategory}
        columnDefs={cols}
        pinnedBottomRowData={totalsRow}
      />

      <DeepDiveTable
        title="Performance by Subcategory"
        rowData={adBySubcategory}
        columnDefs={cols}
        pinnedBottomRowData={totalsRow}
      />

      <DeepDiveTable
        title="Performance by ASIN"
        rowData={adByASIN}
        columnDefs={cols}
        pinnedBottomRowData={totalsRow}
      />

      <LastRefreshed offsetMinutes={8} />
    </div>
  );
}
