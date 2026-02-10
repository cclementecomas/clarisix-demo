import { categoryAdData } from '../../data/advertisingData';
import InfoTooltip from '../InfoTooltip';

const SPEND_COLOR = '#0F766E';
const SALES_COLOR = '#4B9DCC';

export default function PerformanceByCategory() {
  const maxSpend = Math.max(...categoryAdData.map((d) => d.adSpend));
  const maxSales = Math.max(...categoryAdData.map((d) => d.adSales));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Performance by Category</h3>
        <InfoTooltip />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-3 text-center">Ad Spend</p>
          <div className="space-y-1.5">
            {categoryAdData.map((item) => {
              const width = maxSpend > 0 ? (item.adSpend / maxSpend) * 100 : 0;
              return (
                <div key={`spend-${item.category}`} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-[100px] truncate text-right flex-shrink-0">
                    {item.category}
                  </span>
                  <div className="flex-1 h-4 bg-gray-50 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-700 ease-out"
                      style={{ width: `${width}%`, backgroundColor: SPEND_COLOR }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 w-[42px] text-right flex-shrink-0">
                    {item.adSpend.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-3 text-center">Ad Sales</p>
          <div className="space-y-1.5">
            {categoryAdData.map((item) => {
              const width = maxSales > 0 ? (item.adSales / maxSales) * 100 : 0;
              return (
                <div key={`sales-${item.category}`} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-[100px] truncate text-right flex-shrink-0">
                    {item.category}
                  </span>
                  <div className="flex-1 h-4 bg-gray-50 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-700 ease-out"
                      style={{ width: `${width}%`, backgroundColor: SALES_COLOR }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 w-[42px] text-right flex-shrink-0">
                    {item.adSales.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
