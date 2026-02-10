import { useMemo } from 'react';
import DeepDiveTable, {
  type ColumnDef,
  percentCellStyle,
  percentFormatter,
  currencyFormatter,
  numberFormatter,
} from '../deepdive/DeepDiveTable';
import { advertisingBrandData, advertisingBrandTotals } from '../../data/advertisingData';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function AdvertisingTable() {
  const { currency } = useCurrency();

  const fmtCurrency = useMemo(() => currencyFormatter(currency), [currency]);

  const columnDefs: ColumnDef[] = useMemo(
    () => [
      { field: 'brand', headerName: 'Brand', pinned: 'left' },
      {
        field: 'impressions',
        headerName: 'Impressions',
        valueFormatter: numberFormatter,
        subFields: [
          {
            field: 'impressionsChangePP',
            label: 'PoP',
            formatter: percentFormatter,
            cellStyle: percentCellStyle,
          }
        ]
      },
      {
        field: 'clicks',
        headerName: 'Clicks',
        valueFormatter: numberFormatter,
        subFields: [
          {
            field: 'clicksChangePP',
            label: 'PoP',
            formatter: percentFormatter,
            cellStyle: percentCellStyle,
          }
        ]
      },
      {
        field: 'adSpend',
        headerName: 'AdSpend',
        valueFormatter: fmtCurrency,
        subFields: [
          {
            field: 'adSpendChangePP',
            label: 'PoP',
            formatter: percentFormatter,
            cellStyle: percentCellStyle,
          }
        ]
      },
      {
        field: 'adSales',
        headerName: 'AdSales',
        valueFormatter: fmtCurrency,
        subFields: [
          {
            field: 'adSalesPP',
            formatter: fmtCurrency,
          }
        ]
      },
    ],
    [fmtCurrency]
  );

  return (
    <DeepDiveTable
      title="Best Selling Brands"
      rowData={advertisingBrandData}
      columnDefs={columnDefs}
      pinnedBottomRowData={[advertisingBrandTotals]}
    />
  );
}
