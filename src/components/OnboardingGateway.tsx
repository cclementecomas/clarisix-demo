import { CheckCircle2, Circle, Clock, Mail, Phone } from 'lucide-react';
import { ClarisixSpinner } from './ClarisixSpinner';
import { useOnboarding } from '../contexts/OnboardingContext';
import { onboardingContent, demoStatusOptions } from '../data/onboardingData';
import type { OnboardingStatus } from '../contexts/OnboardingContext';

function PulsingDots() {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full bg-cx-400"
          style={{
            animation: 'gentlePulse 2s ease-in-out infinite',
            animationDelay: `${i * 400}ms`,
          }}
        />
      ))}
    </div>
  );
}

function SyncChecklist() {
  const { onboardingState } = useOnboarding();

  return (
    <div className="text-left mx-auto max-w-[360px] space-y-3 py-4">
      {onboardingState.syncCategories.map((cat) => (
        <div key={cat.label} className="flex items-center gap-3">
          {cat.status === 'done' && (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
          {cat.status === 'syncing' && (
            <div
              className="w-5 h-5 rounded-full bg-cx-400 flex-shrink-0"
              style={{ animation: 'gentlePulse 2s ease-in-out infinite' }}
            />
          )}
          {cat.status === 'pending' && (
            <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
          )}
          <span
            className={`text-sm ${
              cat.status === 'done'
                ? 'text-gray-700'
                : cat.status === 'syncing'
                  ? 'text-gray-700 font-medium'
                  : 'text-gray-400'
            }`}
          >
            {cat.label}
          </span>
          {cat.status === 'syncing' && (
            <span className="text-xs text-cx-500 font-medium ml-auto">Syncing...</span>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ icon: Icon, text }: { icon: React.FC<{ className?: string }>; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600">
      <Icon className="w-4 h-4 text-gray-400" />
      <span>{text}</span>
    </div>
  );
}

function DemoSwitcher() {
  const { onboardingState, setOnboardingStatus } = useOnboarding();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</span>
      <select
        value={onboardingState.status}
        onChange={(e) => setOnboardingStatus(e.target.value as OnboardingStatus)}
        className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-700 bg-white focus:outline-none focus:border-cx-300"
      >
        {demoStatusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function OnboardingGateway() {
  const { onboardingState } = useOnboarding();
  const { status } = onboardingState;

  const content = status !== 'ready' ? onboardingContent[status] : null;
  if (!content) return null;

  return (
    <>
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-[600px] text-center px-6 space-y-6">
          <div className="flex justify-center mb-2">
            {(status === 'syncing' || status === 'connecting') ? (
              <ClarisixSpinner size={80} />
            ) : status === 'error' ? (
              <img
                src="/error.png"
                alt="Error"
                className="h-80"
              />
            ) : (
              <img
                src="/Clarisix_Logo_HD.svg"
                alt="Clarisix"
                className="h-20"
              />
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">{content.headline}</h1>
            <p className="text-gray-500 leading-relaxed text-base max-w-[480px] mx-auto">
              {content.subtext}
            </p>
          </div>

          {/* Status-specific sections */}
          {status === 'pending_connection' && (
            <div className="space-y-4 pt-2">
              <StatusBadge icon={Clock} text={content.estimatedTime} />
              <div>
                <a
                  href="mailto:support@clarisix.com"
                  className="inline-flex items-center gap-2 text-sm text-cx-500 hover:text-cx-700 font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  support@clarisix.com
                </a>
              </div>
            </div>
          )}

          {status === 'connecting' && (
            <div className="space-y-4 pt-2">
              <PulsingDots />
              <StatusBadge icon={Clock} text={content.estimatedTime} />
            </div>
          )}

          {status === 'syncing' && (
            <div className="pt-2">
              <SyncChecklist />
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-center gap-6">
                <a
                  href="mailto:support@clarisix.com"
                  className="inline-flex items-center gap-2 text-sm text-cx-500 hover:text-cx-700 font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email support
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-sm text-cx-500 hover:text-cx-700 font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Book a call
                </a>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400 pt-8">
            Questions? Reach us at{' '}
            <a
              href="mailto:support@clarisix.com"
              className="text-cx-500 hover:text-cx-700 underline transition-colors"
            >
              support@clarisix.com
            </a>
          </p>
        </div>
      </div>

      <DemoSwitcher />
    </>
  );
}
