import { Lock } from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import DeepDiveTable, {
  ColumnDef,
  currencyFormatter,
  percentCellStyle,
  numberFormatter,
  pctShareFormatter,
} from './deepdive/DeepDiveTable';
import AdvertisingKPICards from './advertising/AdvertisingKPICards';
import LastRefreshed from './LastRefreshed';
import {
  adByMarketplace,
  adByCategory,
  adByBrand,
  adByASIN,
  adPerfTotals,
} from '../data/advertisingData';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAccountSpecifics } from '../contexts/AccountSpecificsContext';

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
      field: 'roas',
      headerName: 'ROAS',
      hide: true,
      valueFormatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v.toFixed(2)}×`; },
      cellStyle: ({ value }) => { const v = value as number; return v >= 5 ? { color: '#166534' } : v < 3 ? { color: '#991B1B' } : {}; },
      subFields: [{ field: 'roasPoP', label: 'PoP', formatter: ({ value }) => { const v = value as number; return v == null ? '' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`; }, cellStyle: ({ value }) => { const v = value as number; return v > 0 ? { color: '#166534' } : v < 0 ? { color: '#991B1B' } : {}; } }],
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

function LockedTablePlaceholder({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <InfoTooltip content={tooltip} />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          <Lock className="w-3 h-3" />
          Not configured
        </div>
      </div>
      <div className="relative">
        <div className="pointer-events-none select-none opacity-30 blur-[1.5px]">
          <div className="px-5 py-6">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-md text-center bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 mb-3">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Campaign naming convention not enabled</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              This view requires the campaign naming convention to be configured in your account settings.
              Go to <span className="font-semibold text-gray-800">Settings → Account</span> to enable it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdvertisingOverview() {
  const cols = useAdPerfCols();
  const totalsRow = [adPerfTotals];
  const { campaignNamingEnabled } = useAccountSpecifics();

  return (
    <div className="space-y-4">
      <AdvertisingKPICards />

      <DeepDiveTable
        title="Performance by Marketplace"
        tooltip="Ad metrics aggregated by Amazon marketplace. PoP = period-over-period."
        rowData={adByMarketplace}
        columnDefs={cols}
        pinnedBottomRowData={totalsRow}
      />

      {campaignNamingEnabled ? (
        <DeepDiveTable
          title="Performance by Brand"
          tooltip="Ad metrics aggregated by brand, extracted from your campaign naming convention. PoP = period-over-period."
          rowData={adByBrand}
          columnDefs={cols}
          pinnedBottomRowData={totalsRow}
        />
      ) : (
        <LockedTablePlaceholder
          title="Performance by Brand"
          tooltip="Ad metrics aggregated by brand. Requires campaign naming convention to be configured."
        />
      )}

      {campaignNamingEnabled ? (
        <DeepDiveTable
          title="Performance by Category"
          tooltip="Ad metrics aggregated by product category, extracted from your campaign naming convention. PoP = period-over-period."
          rowData={adByCategory}
          columnDefs={cols}
          pinnedBottomRowData={totalsRow}
        />
      ) : (
        <LockedTablePlaceholder
          title="Performance by Category"
          tooltip="Ad metrics aggregated by product category. Requires campaign naming convention to be configured."
        />
      )}

      <DeepDiveTable
        title="Performance by ASIN"
        tooltip="Ad metrics per ASIN. PoP = period-over-period."
        rowData={adByASIN}
        columnDefs={cols}
        pinnedBottomRowData={totalsRow}
        copyablePinnedCell
      />

      <LastRefreshed offsetMinutes={8} />
    </div>
  );
}
