import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Lock, Loader2 } from 'lucide-react';
import type { ConnectionMeta, ApiRegion } from '../../data/connectionsData';
import { API_REGION_LABEL } from '../../data/connectionsData';
import { marketplaceOptions } from '../../data/onboardingWizardData';

/** Simulated Login-with-Amazon consent handoff — mimics the real OAuth grant screen. */
export default function LwaConsentModal({ connection, region, marketplaces, onAllow, onCancel }: {
  connection: ConnectionMeta;
  region: ApiRegion;
  marketplaces: string[];
  onAllow: () => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<'consent' | 'authorizing'>('consent');
  const allow = () => { setPhase('authorizing'); setTimeout(onAllow, 1300); };
  const flags = marketplaces.map((c) => marketplaceOptions.find((m) => m.code === c)).filter(Boolean);

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={phase === 'consent' ? onCancel : undefined} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Amazon-style header */}
        <div className="bg-[#232F3E] px-5 py-4 flex items-center gap-2">
          <span className="text-white text-lg font-bold tracking-tight lowercase">amazon</span>
          <span className="text-[#FF9900] text-lg leading-none">◡</span>
          <span className="ml-auto text-white/60 text-[11px] font-medium">Login with Amazon</span>
        </div>

        {phase === 'authorizing' ? (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            <Loader2 className="w-8 h-8 text-[#FF9900] animate-spin" />
            <p className="mt-4 text-sm font-semibold text-gray-800">Authorizing {connection.short}…</p>
            <p className="mt-1 text-xs text-gray-500">Securing a read-only token for {API_REGION_LABEL[region]}.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-800">
                <span className="font-bold">Clarisix</span> is requesting access to your{' '}
                <span className="font-semibold">{connection.provider}</span> data for:
              </p>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{API_REGION_LABEL[region]}</span>
                {flags.map((m) => (
                  <span key={m!.code} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[11px] text-gray-600">{m!.flag} {m!.code}</span>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 divide-y divide-gray-100">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50">Clarisix will be able to view (read-only)</div>
                {connection.scopes.map((s) => (
                  <div key={s} className="px-3 py-2 flex items-center gap-2 text-[13px] text-gray-700">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {s}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-start gap-1.5 text-[11px] text-gray-400">
                <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                Read-only. Clarisix can never place orders, change prices or spend. Revoke anytime in Seller Central / Amazon Ads.
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
              <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 rounded-lg border border-gray-300 hover:bg-white">Cancel</button>
              <button onClick={allow} className="flex-1 px-4 py-2.5 text-sm font-bold text-[#0F1111] rounded-lg bg-[#FFD814] hover:bg-[#F7CA00] shadow-sm">Allow</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
