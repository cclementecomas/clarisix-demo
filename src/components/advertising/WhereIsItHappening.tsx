// ─── Advertising Overview — Where is it happening? ───────────────────────
// Tabbed module that replaces the separate Marketplace + Brand rollup
// tables. Tabs: Marketplace (default) · Brand · Campaign type. Reuses
// DecisionRollupTable for the renderer so all three views feel identical.

import { useState } from 'react';
import { Lock } from 'lucide-react';
import InfoTooltip from '../InfoTooltip';
import {
  marketplaceDecisionRollup, brandDecisionRollup, campaignTypeDecisionRollup,
} from '../../data/advertisingDiagnostics';
import { useAccountSpecifics } from '../../contexts/AccountSpecificsContext';
import DecisionRollupTable from './DecisionRollupTable';

type Tab = 'marketplace' | 'brand' | 'campaignType';

const TABS: { id: Tab; label: string }[] = [
  { id: 'marketplace',  label: 'Marketplace' },
  { id: 'brand',        label: 'Brand' },
  { id: 'campaignType', label: 'Campaign type' },
];

export default function WhereIsItHappening() {
  const { campaignNamingEnabled } = useAccountSpecifics();
  const [tab, setTab] = useState<Tab>('marketplace');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-gray-900">Where is it happening?</h3>
        <span className="text-[10px] text-gray-400">Decision per slice — ranked by severity</span>
        <div className="ml-auto flex items-center gap-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  active ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'marketplace' && (
        <DecisionRollupTable embedded rows={marketplaceDecisionRollup} />
      )}
      {tab === 'brand' && (
        campaignNamingEnabled
          ? <DecisionRollupTable embedded rows={brandDecisionRollup} />
          : <LockedTabBody
              title="Brand decisions"
              tooltip="Decision classification per brand. Requires campaign naming convention to be configured."
            />
      )}
      {tab === 'campaignType' && (
        <DecisionRollupTable embedded rows={campaignTypeDecisionRollup} />
      )}
    </div>
  );
}

function LockedTabBody({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <div className="relative">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h4 className="text-[12px] font-semibold text-gray-900">{title}</h4>
          <InfoTooltip content={tooltip} />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          <Lock className="w-3 h-3" />
          Not configured
        </div>
      </div>
      <div className="px-5 py-8 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 mb-3">
          <Lock className="w-5 h-5 text-amber-600" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Campaign naming convention not enabled</h4>
        <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
          Brand-level reporting requires the campaign naming convention to be configured for this account.
          Go to <span className="font-semibold text-gray-800">Settings → Account specifics</span> to enable it.
        </p>
      </div>
    </div>
  );
}
