import { useEffect } from 'react';
import { Key, Settings, Database, Rocket } from 'lucide-react';
import { timelinePhases } from '../../../data/onboardingWizardData';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Key,
  Settings,
  Database,
  Rocket,
};

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  useEffect(() => {
    const key = 'clarisix_confetti_played';
    if (sessionStorage.getItem(key)) return;

    import('canvas-confetti').then(({ default: confetti }) => {
      // Left burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.15, y: 0.9 },
        colors: ['#0E5A8A', '#4B9DCC', '#3889B8', '#E6F3FA', '#FFD700', '#FFFFFF'],
        disableForReducedMotion: true,
      });
      // Right burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.85, y: 0.9 },
        colors: ['#0E5A8A', '#4B9DCC', '#3889B8', '#E6F3FA', '#FFD700', '#FFFFFF'],
        disableForReducedMotion: true,
      });
      sessionStorage.setItem(key, 'true');
    });
  }, []);

  return (
    <div className="text-center">
      <div className="wizard-fade-in">
        <img
          src="/Clarisix_Logo_HD.svg"
          alt="Clarisix"
          className="h-24 mx-auto mb-6"
        />

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Clarisix</h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-[480px] mx-auto mb-10">
          Let's get your Amazon data connected. This takes about 5 minutes on your end — we handle the rest.
        </p>

        <div className="text-left max-w-[420px] mx-auto mb-10">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-200" />

            <div className="space-y-6">
              {timelinePhases.map((phase, i) => {
                const Icon = iconMap[phase.icon];
                return (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className="w-10 h-10 rounded-full bg-cx-50 border-2 border-cx-200 flex items-center justify-center flex-shrink-0 z-10">
                      {Icon && <Icon className="w-4.5 h-4.5 text-cx-600" />}
                    </div>
                    <div className="pt-1.5">
                      <p className="text-sm font-medium text-gray-900">{phase.label}</p>
                      {phase.duration && (
                        <p className="text-xs text-gray-400 mt-0.5">{phase.duration}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="px-8 py-3 bg-cx-500 text-white text-sm font-semibold rounded-lg hover:bg-cx-600 transition-all duration-200 shadow-sm"
        >
          Let's get started
        </button>
      </div>
    </div>
  );
}
