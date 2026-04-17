import { useAccountSpecifics } from '../../contexts/AccountSpecificsContext';
import { Info } from 'lucide-react';

export default function AccountSection() {
  const {
    campaignNamingEnabled, setCampaignNamingEnabled,
    campaignNamingPattern, setCampaignNamingPattern,
    audienceLabelingEnabled, setAudienceLabelingEnabled,
  } = useAccountSpecifics();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Account Specifics</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure account-level features that unlock additional reporting views across advertising modules.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Campaign Naming Convention */}
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900">Campaign Naming Convention</h3>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      When enabled, Clarisix parses your campaign names to extract Brand and Category dimensions, powering the "Performance by Brand" and "Performance by Category" tables in Advertising Overview.
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enable if your campaigns follow a structured naming pattern that encodes brand and category.
                </p>

                {campaignNamingEnabled && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Naming Pattern</label>
                      <input
                        type="text"
                        value={campaignNamingPattern}
                        onChange={(e) => setCampaignNamingPattern(e.target.value)}
                        className="w-full max-w-sm px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">Example</p>
                      <code className="text-xs text-gray-700 font-mono">XXXXXX|ZeroWater-Filters</code>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Where <span className="font-semibold text-gray-700">ZeroWater</span> = Brand and <span className="font-semibold text-gray-700">Filters</span> = Category
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-amber-800">
                        <span className="font-semibold">Note:</span> Brand names are case-sensitive. "Zamst" is not equal to "ZAMST".
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={campaignNamingEnabled}
                onClick={() => setCampaignNamingEnabled(!campaignNamingEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cx-500 focus:ring-offset-2 ${
                  campaignNamingEnabled ? 'bg-cx-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    campaignNamingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Audience Labeling */}
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900">Audience Labeling</h3>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      When enabled, Clarisix maps your audience segments (retargeting, in-market, lifestyle, etc.) to campaign performance data, unlocking the "Performance by Audience" table in Advertising Deep Dive.
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enable if your account has audience segments configured for Sponsored Display and DSP campaigns.
                </p>

                {audienceLabelingEnabled && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-green-800">
                      <span className="font-semibold">Active.</span> The "Performance by Audience" table in Advertising Deep Dive is now unlocked.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={audienceLabelingEnabled}
                onClick={() => setAudienceLabelingEnabled(!audienceLabelingEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cx-500 focus:ring-offset-2 ${
                  audienceLabelingEnabled ? 'bg-cx-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    audienceLabelingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
