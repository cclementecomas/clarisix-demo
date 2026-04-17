import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOnboarding } from './OnboardingContext';

export interface WizardFormData {
  companyName: string;
  selectedMarketplaces: string[];
  orderVolume: string;
  primaryCurrency: string;
  selectedAdTypes: string[];
  selectedTools: string[];
  selectedPlan: string;
  billingCycle: 'annual' | 'monthly';
  accessConfirmed: boolean;
  marketplaceChecklist: Record<string, boolean>;
  fiscalYearStart: number;
  emailNotifications: boolean;
  teamInvites: { name: string; email: string; role: string }[];
}

export interface WizardState {
  currentStep: number;
  formData: WizardFormData;
  wizardComplete: boolean;
  furthestStep: number;
}

interface WizardContextType {
  state: WizardState;
  setStep: (step: number) => void;
  updateFormData: (partial: Partial<WizardFormData>) => void;
  completeWizard: () => void;
  canProceed: (step: number) => boolean;
}

const DEFAULT_FORM_DATA: WizardFormData = {
  companyName: '',
  selectedMarketplaces: [],
  orderVolume: '',
  primaryCurrency: 'EUR',
  selectedAdTypes: [],
  selectedTools: [],
  selectedPlan: '',
  billingCycle: 'annual',
  accessConfirmed: false,
  marketplaceChecklist: {},
  fiscalYearStart: 1,
  emailNotifications: true,
  teamInvites: [],
};

const DEFAULT_STATE: WizardState = {
  currentStep: 1,
  formData: DEFAULT_FORM_DATA,
  wizardComplete: false,
  furthestStep: 1,
};

const STORAGE_KEY = 'clarisix_wizard_state';

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function OnboardingWizardProvider({ children }: { children: ReactNode }) {
  const { setOnboardingStatus } = useOnboarding();

  const [state, setState] = useState<WizardState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WizardState;
        if (parsed.wizardComplete) return DEFAULT_STATE;
        return { ...DEFAULT_STATE, ...parsed, formData: { ...DEFAULT_FORM_DATA, ...parsed.formData } };
      }
    } catch { /* ignore */ }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setStep = (step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
      furthestStep: Math.max(prev.furthestStep, step),
    }));
  };

  const updateFormData = (partial: Partial<WizardFormData>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...partial },
    }));
  };

  const completeWizard = () => {
    setState((prev) => ({ ...prev, wizardComplete: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, wizardComplete: true }));
    setOnboardingStatus('pending_connection');
  };

  const canProceed = (step: number): boolean => {
    const { formData } = state;
    switch (step) {
      case 1:
        return true;
      case 2:
        return formData.companyName.trim().length > 0 && formData.selectedMarketplaces.length > 0 && formData.selectedAdTypes.length > 0;
      case 3:
        return formData.selectedPlan.length > 0;
      case 4:
        return formData.accessConfirmed;
      case 5:
        return true;
      case 6:
        return true;
      case 7:
        return true;
      default:
        return false;
    }
  };

  return (
    <WizardContext.Provider value={{ state, setStep, updateFormData, completeWizard, canProceed }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within an OnboardingWizardProvider');
  }
  return context;
}
