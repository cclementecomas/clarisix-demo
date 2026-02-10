import AdvertisingKPICards from './advertising/AdvertisingKPICards';
import AdSpendRunRate from './advertising/AdSpendRunRate';
import PerformanceByAdType from './advertising/PerformanceByAdType';
import PerformanceByCategory from './advertising/PerformanceByCategory';
import AdvertisingTable from './advertising/AdvertisingTable';

export default function AdvertisingOverview() {
  return (
    <div className="space-y-6">
      <AdvertisingKPICards />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-6">
        <AdSpendRunRate />
        <PerformanceByAdType />
      </div>
      <PerformanceByCategory />
      <AdvertisingTable />
    </div>
  );
}
