import { Check } from 'lucide-react';
import { wizardStepsMeta } from '../../data/onboardingWizardData';

interface ProgressBarProps {
  currentStep: number;
  furthestStep: number;
}

export default function ProgressBar({ currentStep, furthestStep }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      {wizardStepsMeta.map((step, i) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isReachable = step.id <= furthestStep;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-cx-500 text-white ring-4 ring-cx-100'
                      : isReachable
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`mt-2 text-[11px] font-medium hidden sm:block ${
                  isCurrent ? 'text-cx-700' : isCompleted ? 'text-green-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {i < wizardStepsMeta.length - 1 && (
              <div className="flex-1 mx-2 mt-[-20px] sm:mt-[-20px]">
                <div className="h-0.5 rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-green-500 w-full' : 'w-0'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
