import { useState } from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { ClarisixSpinner } from './ClarisixSpinner';
import { useOnboarding } from '../contexts/OnboardingContext';
import { onboardingContent, demoStatusOptions } from '../data/onboardingData';
import type { OnboardingStatus } from '../contexts/OnboardingContext';
import { connectionMeta } from '../data/connectionsData';
import SyncCenter from './onboarding/SyncCenter';
import PostSyncSetup from './onboarding/PostSyncSetup';
import LwaConsentModal from './onboarding/LwaConsentModal';

function PulsingDots() {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-3 h-3 rounded-full bg-cx-400" style={{ animation: 'gentlePulse 2s ease-in-out infinite', animationDelay: `${i * 400}ms` }} />
      ))}
    </div>
  );
}

function StatusBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600">
      <Clock className="w-4 h-4 text-gray-400" />
      <span>{text}</span>
    </div>
  );
}

/** Error state = a specific grant expired/declined. Reconnect resumes the sync. */
function ErrorRecovery() {
  const { setOnboardingStatus } = useOnboarding();
  const [consent, setConsent] = useState(false);
  const conn = connectionMeta('ads'); // demo: the Ads grant for Europe needs re-auth

  return (
    <div className="space-y-4 pt-2">
      <div className="max-w-[440px] mx-auto rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-left">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-rose-800">{conn.label} · Europe needs re-authorization</div>
            <div className="text-[12px] text-rose-700/80 mt-0.5">The token was declined or has expired. Everything else is still connected.</div>
            <button onClick={() => setConsent(true)} className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#232F3E] hover:bg-[#374151] text-white text-[12px] font-semibold">
              <RefreshCw className="w-3.5 h-3.5" /> Reconnect with Amazon
            </button>
          </div>
        </div>
      </div>
      {consent && (
        <LwaConsentModal
          connection={conn} region="EU" marketplaces={['UK', 'DE', 'FR']}
          onAllow={() => { setConsent(false); setOnboardingStatus('syncing'); }}
          onCancel={() => setConsent(false)}
        />
      )}
    </div>
  );
}

function DemoSwitcher() {
  const { onboardingState, setOnboardingStatus } = useOnboarding();
  if (!import.meta.env.DEV) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</span>
      <select value={onboardingState.status} onChange={(e) => setOnboardingStatus(e.target.value as OnboardingStatus)}
        className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-700 bg-white focus:outline-none focus:border-cx-300">
        {demoStatusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

export default function OnboardingGateway() {
  const { onboardingState, setOnboardingStatus } = useOnboarding();
  const { status } = onboardingState;
  const [phase, setPhase] = useState<'sync' | 'setup'>('sync');
  const content = status !== 'ready' ? onboardingContent[status] : null;
  if (!content) return null;

  // Live Sync Center → post-sync setup (plan + catalog mapping) → dashboard.
  if (status === 'syncing') {
    return (
      <>
        <div className="flex-1 flex items-start justify-center min-h-[60vh] py-10">
          <div className="w-full max-w-[760px] px-6">
            {phase === 'sync' ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">{content.headline}</h1>
                  <p className="text-gray-500 leading-relaxed text-base max-w-[480px] mx-auto mt-2">{content.subtext}</p>
                </div>
                <SyncCenter onDone={() => setPhase('setup')} />
              </>
            ) : (
              <PostSyncSetup onFinish={() => setOnboardingStatus('ready')} />
            )}
          </div>
        </div>
        <DemoSwitcher />
      </>
    );
  }

  return (
    <>
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-[600px] text-center px-6 space-y-6">
          <div className="flex justify-center mb-2">
            {status === 'connecting' ? <ClarisixSpinner size={80} />
              : status === 'error' ? <img src="/error.png" alt="Error" className="h-64" />
              : <img src="/Clarisix_Logo_HD.svg" alt="Clarisix" className="h-20" />}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">{content.headline}</h1>
            <p className="text-gray-500 leading-relaxed text-base max-w-[480px] mx-auto">{content.subtext}</p>
          </div>

          {status === 'pending_connection' && <div className="pt-2"><StatusBadge text={'estimatedTime' in content ? content.estimatedTime : ''} /></div>}
          {status === 'connecting' && <div className="space-y-4 pt-2"><PulsingDots /><StatusBadge text={'estimatedTime' in content ? content.estimatedTime : ''} /></div>}
          {status === 'error' && <ErrorRecovery />}

          <p className="text-sm text-gray-400 pt-8">
            Questions? Reach us at{' '}
            <a href="mailto:support@clarisix.com" className="text-cx-500 hover:text-cx-700 underline transition-colors">support@clarisix.com</a>
          </p>
        </div>
      </div>
      <DemoSwitcher />
    </>
  );
}
