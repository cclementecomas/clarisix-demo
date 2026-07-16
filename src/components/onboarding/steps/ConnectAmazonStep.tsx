import { useState } from 'react';
import { Check, ShieldCheck, ChevronDown, RefreshCw, PlugZap } from 'lucide-react';
import { useWizard } from '../../../contexts/OnboardingWizardContext';
import {
  CONNECTIONS, regionsFor, authKey, API_REGION_LABEL,
  type ConnectionMeta, type ConnectionId, type ApiRegion,
} from '../../../data/connectionsData';
import { marketplaceOptions } from '../../../data/onboardingWizardData';
import LwaConsentModal from '../LwaConsentModal';

const FAQ = [
  { q: 'Is this secure?', a: 'Yes. You authorize Clarisix directly on Amazon via Login with Amazon (OAuth). We receive a read-only token — we never see your Amazon password and can never modify your account.' },
  { q: 'What exactly can Clarisix do?', a: 'Read your reports only: orders, finances, inventory, catalog and advertising performance. No write access — we can’t place orders, change prices or spend on ads.' },
  { q: 'Can I revoke access later?', a: 'Anytime. Remove Clarisix from Seller Central → Apps & Services → Manage Your Apps, or from the Amazon Ads console. Access stops immediately.' },
  { q: 'Why two separate connections?', a: 'Amazon keeps seller data (SP-API) and advertising data (Ads API) behind separate authorizations. Connecting both gives you the full P&L — sales and ad spend in one place.' },
];

export default function ConnectAmazonStep() {
  const { state, updateFormData } = useWizard();
  const { formData } = state;
  const regions = regionsFor(formData.selectedMarketplaces);
  const [consent, setConsent] = useState<{ conn: ConnectionMeta; region: ApiRegion; marketplaces: string[] } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isConnected = (id: ConnectionId, r: ApiRegion) => !!formData.authorized[authKey(id, r)];

  const authorize = () => {
    if (!consent) return;
    updateFormData({ authorized: { ...formData.authorized, [authKey(consent.conn.id, consent.region)]: true } });
    setConsent(null);
  };

  const totalGrants = regions.length * CONNECTIONS.length;
  const doneGrants = regions.reduce((s, r) => s + CONNECTIONS.filter((c) => isConnected(c.id, r.region)).length, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect your Amazon account</h1>
      <p className="text-gray-500 text-sm mb-5 max-w-2xl">
        Based on your marketplaces, connect {regions.length === 1 ? 'this region' : `these ${regions.length} regions`}. Each needs one <span className="font-semibold text-gray-600">Selling Partner</span> sign-in and one <span className="font-semibold text-gray-600">Advertising</span> sign-in. Read-only, and revocable anytime.
      </p>

      <div className="space-y-4">
        {regions.map((r) => {
          const flags = r.marketplaces.map((c) => marketplaceOptions.find((m) => m.code === c)).filter(Boolean);
          const doneInRegion = CONNECTIONS.filter((c) => isConnected(c.id, r.region)).length;
          const allDone = doneInRegion === CONNECTIONS.length;
          return (
            <div key={r.region} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50/70 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="text-[13px] font-bold text-gray-900">{API_REGION_LABEL[r.region]}</span>
                  <span className="text-gray-300">·</span>
                  {flags.map((m) => <span key={m!.code} className="text-[11px] text-gray-500">{m!.flag} {m!.code}</span>)}
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-inset ${allDone ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : doneInRegion > 0 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                  {allDone && <Check className="w-3 h-3" />}{doneInRegion}/{CONNECTIONS.length} connected
                </span>
              </div>
              {CONNECTIONS.map((conn) => {
                const connected = isConnected(conn.id, r.region);
                return (
                  <div key={conn.id} className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 first:border-t-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#FF9900] flex items-center justify-center text-white flex-shrink-0"><PlugZap className="w-4 h-4" /></div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-gray-900">{conn.label}</div>
                        <div className="text-[11px] text-gray-500">{conn.provider} · {conn.blurb}</div>
                      </div>
                    </div>
                    {connected ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700"><Check className="w-4 h-4" /> Connected</span>
                        <button onClick={() => setConsent({ conn, region: r.region, marketplaces: r.marketplaces })} title="Reconnect" className="w-7 h-7 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center"><RefreshCw className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setConsent({ conn, region: r.region, marketplaces: r.marketplaces })}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#232F3E] hover:bg-[#374151] text-white text-[12px] font-semibold">
                        Connect with Amazon
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-cx-50 border border-cx-100">
        <ShieldCheck className="w-5 h-5 text-cx-600 flex-shrink-0" />
        <p className="text-[12px] text-gray-600">
          <span className="font-semibold text-gray-800">{doneGrants} of {totalGrants} connected.</span> Both connections are required per region so your P&L includes ad spend. Everything is read-only — Clarisix can never place orders, change prices or spend.
        </p>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Frequently asked questions</h3>
        <div className="space-y-1">
          {FAQ.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="font-medium">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && <div className="px-4 pb-3 text-sm text-gray-500 leading-relaxed animate-fade-slide-in">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>

      {consent && (
        <LwaConsentModal connection={consent.conn} region={consent.region} marketplaces={consent.marketplaces} onAllow={authorize} onCancel={() => setConsent(null)} />
      )}
    </div>
  );
}
