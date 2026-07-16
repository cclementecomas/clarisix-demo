import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOnboarding } from './OnboardingContext';
import { requiredGrants, authKey } from '../data/connectionsData';

export interface WizardFormData {
  companyName: string;
  selectedMarketplaces: string[];
  primaryCurrency: string;
  selectedTools: string[];
  selectedPlan: string;
  billingCycle: 'annual' | 'monthly';
  /** Authorized (connection × region) grants, keyed by authKey('sp_api'|'ads', region). */
  authorized: Record<string, boolean>;
  emailNotifications: boolean;
  teamInvites: { name: string; email: string; role: string }[];
  acceptedTerms: boolean;
  newsletter: boolean;
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
  primaryCurrency: 'EUR',
  selectedTools: [],
  selectedPlan: '',
  billingCycle: 'annual',
  authorized: {},
  emailNotifications: true,
  teamInvites: [],
  acceptedTerms: false,
  newsletter: true, // pre-checked
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
    setOnboardingStatus('syncing'); // OAuth already done in-wizard — data loads immediately
  };

  // Step order: 1 Welcome · 2 Business · 3 Connect · 4 Preferences · 5 Confirm
  // (Plan & catalog mapping moved to a post-sync flow — we only know products/pricing after sync.)
  const canProceed = (step: number): boolean => {
    const { formData } = state;
    switch (step) {
      case 2:
        return formData.companyName.trim().length > 0 && formData.selectedMarketplaces.length > 0;
      case 3: {
        const grants = requiredGrants(formData.selectedMarketplaces);
        return grants.length > 0 && grants.every((g) => formData.authorized[authKey(g.id, g.region)]);
      }
      case 4:
        return formData.acceptedTerms;
      default:
        return true;
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
