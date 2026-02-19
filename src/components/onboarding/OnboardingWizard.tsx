import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWizard } from '../../contexts/OnboardingWizardContext';
import ProgressBar from './ProgressBar';
import WelcomeStep from './steps/WelcomeStep';
import CompanyInfoStep from './steps/CompanyInfoStep';
import AmazonAccessStep from './steps/AmazonAccessStep';
import PreferencesStep from './steps/PreferencesStep';
import ConfirmationStep from './steps/ConfirmationStep';

function WizardSupportFooter() {
  return (
    <p className="text-center text-sm text-gray-400 mt-10 pb-6">
      Questions? Reach us at{' '}
      <a
        href="mailto:support@clarisix.com"
        className="text-cx-500 hover:text-cx-700 underline transition-colors"
      >
        support@clarisix.com
      </a>
    </p>
  );
}

export default function OnboardingWizard() {
  const { state, setStep, canProceed } = useWizard();
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { currentStep } = state;

  const handleNext = () => {
    if (currentStep < 5) {
      setDirection('forward');
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <WelcomeStep onNext={handleNext} />;
      case 2: return <CompanyInfoStep />;
      case 3: return <AmazonAccessStep />;
      case 4: return <PreferencesStep />;
      case 5: return <ConfirmationStep />;
      default: return null;
    }
  };

  const showNavButtons = currentStep >= 2 && currentStep <= 4;

  return (
    <div className="flex-1 flex flex-col items-center min-h-[60vh] py-8">
      <div className="w-full max-w-[640px] px-6">
        <ProgressBar currentStep={currentStep} furthestStep={state.furthestStep} />

        <div
          key={currentStep}
          className={direction === 'forward' ? 'wizard-slide-left' : 'wizard-slide-right'}
        >
          {renderStep()}
        </div>

        {showNavButtons && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed(currentStep)}
              className={`flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                canProceed(currentStep)
                  ? 'bg-cx-500 text-white hover:bg-cx-600 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <WizardSupportFooter />
      </div>
    </div>
  );
}
