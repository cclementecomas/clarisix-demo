import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { connectors, categories, type ConnectorCategory } from '../data/connectorsData';
import ConnectorCard from './connectors/ConnectorCard';
import LastRefreshed from './LastRefreshed';

type FilterTab = 'All' | ConnectorCategory;

const tabs: FilterTab[] = ['All', ...categories];

export default function Connectors() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let items = connectors;
    if (activeTab !== 'All') {
      items = items.filter((c) => c.category === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeTab, search]);

  const grouped = useMemo(() => {
    const map = new Map<ConnectorCategory, typeof filtered>();
    for (const cat of categories) {
      const items = filtered.filter((c) => c.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Connectors</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect your data sources to unlock unified analytics
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-cx-500 text-white hover:bg-cx-500 transition-colors shadow-sm self-start">
          <Plus className="w-4 h-4" />
          Request New
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 pt-4 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
          <div className="flex items-center gap-1 overflow-x-auto pb-0 -mb-px scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative whitespace-nowrap px-3 py-2.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'text-cx-500 bg-cx-50/60'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-cx-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="relative pb-3 sm:pb-0 sm:mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connectors..."
              className="w-full sm:w-56 pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50/50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cx-500/20 focus:border-cx-300 transition-colors"
            />
          </div>
        </div>

        <div className="p-5 space-y-8">
          {grouped.size === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              No connectors match your search.
            </div>
          )}

          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">{category}</h2>
                <span className="text-[11px] text-gray-400">
                  {items.filter((c) => c.available).length} of {items.length} available
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((connector) => (
                  <ConnectorCard key={connector.id} connector={connector} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-4 flex justify-end border-t border-gray-100 pt-3">
          <LastRefreshed offsetMinutes={5} />
        </div>
      </div>
    </div>
  );
}
