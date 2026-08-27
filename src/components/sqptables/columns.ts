// Column catalog for the SQP deep dive. Band `group`s render the slate header rows.
// Heatmap polarity is 'up' (higher = green) unless a column says otherwise.
// PPC Spend & ACoS are Ads-gated — shown as a muted "—" until the Ads API is wired.
import type { ColumnDef, Currency } from '../deepdive/DeepDiveTable';
import { numberFormatter, pctShareFormatter, currencyFormatter } from '../deepdive/DeepDiveTable';

const gated = { color: '#9CA3AF' };
const dash = () => '—';

const ppFormatter = ({ value }: { value: unknown }) => {
  const v = value as number | null;
  if (v == null) return '';
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}pp`;
};
const gapCellStyle = ({ value }: { value: unknown }): Record<string, string> => {
  const v = value as number | null;
  if (v == null) return {};
  return v > 0 ? { color: '#166534' } : v < 0 ? { color: '#991B1B' } : {};
};
// Market rates are context, not your performance — keep them out of the heatmap.
const mkt = { heat: 'none' as const, valueFormatter: pctShareFormatter };

/** Conversion-rate view: each funnel step as your rate vs the market rate and the gap.
 *  Same pivot, different question — "where does my conversion lag the market?" */
export function sqpRateColumns(rowLabel = 'Search Query'): ColumnDef[] {
  return [
    { field: 'rowLabel', headerName: rowLabel, pinned: 'left', width: 240 },
    { field: 'searchVolume', headerName: 'Search Volume', width: 130, valueFormatter: numberFormatter, group: 'Volume', tooltip: 'Market-wide searches for this keyword in the selected weeks — the size of the prize behind the rates.' },
    { field: 'ctr', headerName: 'CTR', width: 100, valueFormatter: pctShareFormatter, group: 'Click-through', tooltip: 'Your clicks ÷ your impressions. Weak CTR means the listing is not winning the click it was shown for.' },
    { field: 'ctrM', headerName: 'Market', width: 100, group: 'Click-through', ...mkt },
    { field: 'ctrGap', headerName: 'Gap', width: 100, valueFormatter: ppFormatter, cellStyle: gapCellStyle, group: 'Click-through' },
    { field: 'atc', headerName: 'ATC rate', width: 110, valueFormatter: pctShareFormatter, group: 'Add to cart', tooltip: 'Your basket adds ÷ your clicks. Weak ATC points at price, images, reviews or the A+ content.' },
    { field: 'atcM', headerName: 'Market', width: 100, group: 'Add to cart', ...mkt },
    { field: 'atcGap', headerName: 'Gap', width: 100, valueFormatter: ppFormatter, cellStyle: gapCellStyle, group: 'Add to cart' },
    { field: 'close', headerName: 'Purchase rate', width: 130, valueFormatter: pctShareFormatter, group: 'Basket → purchase', tooltip: 'Your purchases ÷ your basket adds. Weak closure points at price, shipping speed or Buy Box loss.' },
    { field: 'closeM', headerName: 'Market', width: 100, group: 'Basket → purchase', ...mkt },
    { field: 'closeGap', headerName: 'Gap', width: 100, valueFormatter: ppFormatter, cellStyle: gapCellStyle, group: 'Basket → purchase' },
    { field: 'cvr', headerName: 'CVR', width: 100, valueFormatter: pctShareFormatter, group: 'Click → purchase', tooltip: 'Your purchases ÷ your clicks — the whole post-click funnel in one number (ATC rate × purchase rate).' },
    { field: 'cvrM', headerName: 'Market', width: 100, group: 'Click → purchase', ...mkt },
    { field: 'cvrGap', headerName: 'Gap', width: 100, valueFormatter: ppFormatter, cellStyle: gapCellStyle, group: 'Click → purchase' },
    { field: 'clicksBrand', headerName: 'Clicks (Brand)', width: 130, valueFormatter: numberFormatter, group: 'Volume behind the rates', hide: true },
    { field: 'purchBrand', headerName: 'Purchases (Brand)', width: 150, valueFormatter: numberFormatter, group: 'Volume behind the rates', hide: true },
  ];
}

export function sqpColumns(currency: Currency, rowLabel = 'Search Query'): ColumnDef[] {
  const cur = currencyFormatter(currency);
  return [
    { field: 'rowLabel', headerName: rowLabel, pinned: 'left', width: 240 },
    { field: 'searchVolume', headerName: 'Search Volume', width: 130, valueFormatter: numberFormatter, group: 'Volume' },
    { field: 'impShare', headerName: 'Impr. Share %', width: 125, valueFormatter: pctShareFormatter, group: 'Share of market', tooltip: 'Your share of the market at this stage: your impressions ÷ market impressions.' },
    { field: 'clickShare', headerName: 'Clicks Share %', width: 125, valueFormatter: pctShareFormatter, group: 'Share of market' },
    { field: 'atcShare', headerName: 'ATC Share %', width: 120, valueFormatter: pctShareFormatter, group: 'Share of market' },
    { field: 'purchShare', headerName: 'Purchases Share %', width: 145, valueFormatter: pctShareFormatter, group: 'Share of market' },
    { field: 'purchMarket', headerName: 'Purchases (Market)', width: 150, valueFormatter: numberFormatter, group: 'Purchases' },
    { field: 'purchBrand', headerName: 'Purchases (Brand)', width: 150, valueFormatter: numberFormatter, group: 'Purchases' },
    { field: 'clicksMarket', headerName: 'Clicks (Market)', width: 130, valueFormatter: numberFormatter, group: 'Clicks' },
    { field: 'clicksBrand', headerName: 'Clicks (Brand)', width: 130, valueFormatter: numberFormatter, group: 'Clicks' },
    { field: 'ppcSpend', headerName: 'PPC Spend', width: 120, valueFormatter: dash, cellStyle: gated, tooltip: 'Unlocks with the Ads connection.', group: 'Advertising' },
    { field: 'acos', headerName: 'ACoS', width: 100, heat: 'down', valueFormatter: dash, cellStyle: gated, tooltip: 'Unlocks with the Ads connection.', group: 'Advertising' },
    { field: 'avgPriceMarket', headerName: 'Avg Price (Market)', width: 145, valueFormatter: cur, group: 'Price' },
    { field: 'avgPriceBrand', headerName: 'Avg Price (Brand)', width: 145, valueFormatter: cur, group: 'Price' },
  ];
}
