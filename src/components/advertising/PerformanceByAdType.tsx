import { adTypeData } from '../../data/advertisingData';
import InfoTooltip from '../InfoTooltip';

const BAR_COLORS = ['#0F766E', '#4B9DCC', '#A8D4EC'];

export default function PerformanceByAdType() {
  const maxSpend = Math.max(...adTypeData.map((d) => d.adSpend));
  const maxSales = Math.max(...adTypeData.map((d) => d.adSales));
  const maxRoas = Math.max(...adTypeData.map((d) => d.roas));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Performance by Ad Type</h3>
        <InfoTooltip />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <BarGroup
          title="Ad Spend"
          items={adTypeData.map((d) => ({
            label: d.type,
            value: d.adSpend,
            display: `${d.adSpend.toFixed(2)}%`,
          }))}
          maxValue={maxSpend}
        />
        <BarGroup
          title="Ad Sales"
          items={adTypeData.map((d) => ({
            label: d.type,
            value: d.adSales,
            display: `${d.adSales.toFixed(2)}%`,
          }))}
          maxValue={maxSales}
        />
        <BarGroup
          title="ROAS"
          items={adTypeData.map((d) => ({
            label: d.type,
            value: d.roas,
            display: d.roas.toFixed(1),
          }))}
          maxValue={maxRoas}
        />
      </div>
    </div>
  );
}

interface BarItem {
  label: string;
  value: number;
  display: string;
}

function BarGroup({
  title,
  items,
  maxValue,
}: {
  title: string;
  items: BarItem[];
  maxValue: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-3 text-center">{title}</p>
      <div className="space-y-3">
        {items.map((item, idx) => {
          const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-600 truncate max-w-[120px]">
                  {item.label}
                </span>
                <span className="text-[11px] font-semibold text-gray-800">{item.display}</span>
              </div>
              <div className="h-5 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{
                    width: `${width}%`,
                    backgroundColor: BAR_COLORS[idx % BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
