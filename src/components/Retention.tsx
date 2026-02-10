import { useState } from 'react';
import LTVSummary from './retention/LTVSummary';
import CohortTables from './retention/CohortTables';
import CohortEvolution from './retention/CohortEvolution';

type RetentionTab = 'ltv' | 'cohort-tables' | 'cohort-evolution';

const tabs: { value: RetentionTab; label: string }[] = [
  { value: 'ltv', label: 'LTV Summary' },
  { value: 'cohort-tables', label: 'Cohort Tables' },
  { value: 'cohort-evolution', label: 'Cohort Evolution' },
];

export default function Retention() {
  const [activeTab, setActiveTab] = useState<RetentionTab>('ltv');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Retention</h2>
          <p className="text-sm text-gray-500 mt-1">Customer lifetime value and cohort retention analysis</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.value
                  ? 'border-cx-500 text-cx-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'ltv' && <LTVSummary />}
      {activeTab === 'cohort-tables' && <CohortTables />}
      {activeTab === 'cohort-evolution' && <CohortEvolution />}
    </div>
  );
}
