import { useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { ClarisixSpinner } from '../../ClarisixSpinner';
import { useWizard } from '../../../contexts/OnboardingWizardContext';

const handoffSteps = [
  { label: 'Access shared', status: 'done' as const },
  { label: 'Configuring your pipeline', status: 'active' as const },
  { label: 'Data loading', status: 'pending' as const },
  { label: 'Dashboard live', status: 'pending' as const },
];

export default function ConfirmationStep() {
  const { completeWizard } = useWizard();

  useEffect(() => {
    import('canvas-confetti').then(({ default: confetti }) => {
      // Celebration burst from center
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { x: 0.5, y: 0.45 },
        colors: ['#0E5A8A', '#4B9DCC', '#3889B8', '#10B981', '#FFD700'],
        disableForReducedMotion: true,
      });
    });
  }, []);

  return (
    <div className="text-center">
      <div className="confirmation-pop">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div
            className="absolute inset-0 rounded-full border-2 border-green-300/40"
            style={{ animation: 'logoRingPulse 2.5s ease-in-out infinite' }}
          />
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#10B981" />
              <path
                d="M8 12.5l2.5 2.5 5.5-5.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 48,
                  animation: 'checkDraw 0.6s ease-out 0.4s both',
                }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="confirmation-fade-up-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          You're all set! We'll take it from here.
        </h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-[480px] mx-auto mb-8">
          Our team will accept your Amazon invitation and start connecting your data. We'll email you when your dashboard is ready.
        </p>
      </div>

      <div className="confirmation-fade-up-2">
        <div className="max-w-[320px] mx-auto mb-8">
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-200" />
            <div className="space-y-5">
              {handoffSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  {step.status === 'done' && (
                    <CheckCircle2 className="w-10 h-10 text-green-500 flex-shrink-0 z-10 bg-white rounded-full" />
                  )}
                  {step.status === 'active' && (
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 z-10">
                      <ClarisixSpinner size={36} />
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <Circle className="w-10 h-10 text-gray-200 flex-shrink-0 z-10 bg-white rounded-full" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      step.status === 'done'
                        ? 'text-green-700'
                        : step.status === 'active'
                          ? 'text-cx-700'
                          : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="confirmation-fade-up-3">
        <p className="text-sm text-gray-500 mb-8">
          Estimated time: core data available within 24-48 hours
        </p>
      </div>

      <div className="confirmation-fade-up-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={completeWizard}
            className="px-6 py-2.5 bg-cx-500 text-white text-sm font-semibold rounded-lg hover:bg-cx-600 transition-all duration-200 shadow-sm"
          >
            Explore a demo dashboard
          </button>
          <button
            onClick={completeWizard}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            I'll come back later
          </button>
        </div>
      </div>
    </div>
  );
}
