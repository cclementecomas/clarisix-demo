import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWizard } from '../../contexts/OnboardingWizardContext';
import ProgressBar from './ProgressBar';
import WelcomeStep from './steps/WelcomeStep';
import CompanyInfoStep from './steps/CompanyInfoStep';
import ConnectAmazonStep from './steps/ConnectAmazonStep';
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
      case 3: return <ConnectAmazonStep />;
      case 4: return <PreferencesStep />;
      case 5: return <ConfirmationStep />;
      default: return null;
    }
  };

  const showNavButtons = currentStep >= 2 && currentStep <= 4;

  return (
    <div className="flex-1 flex flex-col items-center min-h-[60vh] py-8">
      <div className={`w-full px-6 max-w-[640px]`}>
        <ProgressBar currentStep={currentStep} furthestStep={state.furthestStep} />

        <div
          key={currentStep}
          className={direction === 'forward' ? 'wizard-slide-left' : 'wizard-slide-right'}
        >
          {renderStep()}
        </div>

        <WizardSupportFooter />
      </div>

      {showNavButtons && (
        <div className="sticky bottom-0 w-full bg-white/90 backdrop-blur-sm border-t border-gray-100 py-3 px-6 z-20">
          <div className={`flex items-center justify-between mx-auto max-w-[640px]`}>
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
        </div>
      )}
    </div>
  );
}
