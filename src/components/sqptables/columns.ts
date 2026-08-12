// Column catalog for the SQP deep dive. Band `group`s render the slate header rows.
// PPC Spend & ACoS are Ads-gated — shown as a muted "—" until the Ads API is wired.
import type { ColumnDef, Currency } from '../deepdive/DeepDiveTable';
import { numberFormatter, pctShareFormatter, currencyFormatter } from '../deepdive/DeepDiveTable';

const gated = { color: '#9CA3AF' };
const dash = () => '—';

export function sqpColumns(currency: Currency, rowLabel = 'Search Query'): ColumnDef[] {
  const cur = currencyFormatter(currency);
  return [
    { field: 'rowLabel', headerName: rowLabel, pinned: 'left', width: 240 },
    { field: 'searchVolume', headerName: 'Search Volume', width: 130, valueFormatter: numberFormatter, group: 'Volume' },
    { field: 'purchMarket', headerName: 'Purchases (Market)', width: 150, valueFormatter: numberFormatter, group: 'Purchases' },
    { field: 'purchBrand', headerName: 'Purchases (Brand)', width: 150, valueFormatter: numberFormatter, group: 'Purchases' },
    { field: 'clicksBrand', headerName: 'Clicks (Brand)', width: 130, valueFormatter: numberFormatter, group: 'Clicks' },
    { field: 'clicksMarket', headerName: 'Clicks (Market)', width: 130, valueFormatter: numberFormatter, group: 'Clicks', hide: true },
    { field: 'impShare', headerName: 'Impr. Share %', width: 125, valueFormatter: pctShareFormatter, group: 'Share of market', tooltip: 'Your share of the market at this stage: your impressions ÷ market impressions.' },
    { field: 'clickShare', headerName: 'Clicks Share %', width: 125, valueFormatter: pctShareFormatter, group: 'Share of market' },
    { field: 'atcShare', headerName: 'ATC Share %', width: 120, valueFormatter: pctShareFormatter, group: 'Share of market' },
    { field: 'purchShare', headerName: 'Purchases Share %', width: 145, valueFormatter: pctShareFormatter, group: 'Share of market' },
    { field: 'ppcSpend', headerName: 'PPC Spend', width: 120, valueFormatter: dash, cellStyle: gated, tooltip: 'Unlocks with the Ads connection.', group: 'Advertising' },
    { field: 'acos', headerName: 'ACoS', width: 100, valueFormatter: dash, cellStyle: gated, tooltip: 'Unlocks with the Ads connection.', group: 'Advertising' },
    { field: 'avgPriceMarket', headerName: 'Avg Price (Market)', width: 145, valueFormatter: cur, group: 'Price' },
    { field: 'avgPriceBrand', headerName: 'Avg Price (Brand)', width: 145, valueFormatter: cur, group: 'Price' },
  ];
}
