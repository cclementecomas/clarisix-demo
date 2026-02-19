import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { accountOnboardingStatus, defaultSyncCategories } from '../data/onboardingData';

export type OnboardingStatus = 'ready' | 'wizard' | 'pending_connection' | 'connecting' | 'syncing' | 'error';

export interface SyncCategory {
  label: string;
  status: 'done' | 'syncing' | 'pending';
}

export interface OnboardingState {
  status: OnboardingStatus;
  syncCategories: SyncCategory[];
}

interface OnboardingContextType {
  onboardingState: OnboardingState;
  setOnboardingStatus: (status: OnboardingStatus) => void;
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [selectedAccount, setSelectedAccount] = useState('All Accounts');
  const [statusOverride, setStatusOverride] = useState<OnboardingStatus | null>(null);

  const rawBase = accountOnboardingStatus[selectedAccount] ?? 'ready';
  const status = statusOverride ?? rawBase;

  // Reset override and clear wizard localStorage when switching accounts
  useEffect(() => {
    setStatusOverride(null);
    if (accountOnboardingStatus[selectedAccount] === 'wizard') {
      localStorage.removeItem('clarisix_wizard_state');
    }
  }, [selectedAccount]);

  const onboardingState: OnboardingState = {
    status,
    syncCategories: status === 'syncing' ? defaultSyncCategories : [],
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingState,
        setOnboardingStatus: setStatusOverride,
        selectedAccount,
        setSelectedAccount,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
