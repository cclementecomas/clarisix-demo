import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccountSpecificsContextType {
  campaignNamingEnabled: boolean;
  setCampaignNamingEnabled: (v: boolean) => void;
  campaignNamingPattern: string;
  setCampaignNamingPattern: (v: string) => void;
  audienceLabelingEnabled: boolean;
  setAudienceLabelingEnabled: (v: boolean) => void;
}

const AccountSpecificsContext = createContext<AccountSpecificsContextType | undefined>(undefined);

export function AccountSpecificsProvider({ children }: { children: ReactNode }) {
  const [campaignNamingEnabled, setCampaignNamingEnabled] = useState(() =>
    localStorage.getItem('cx_campaignNaming') === 'true'
  );
  const [campaignNamingPattern, setCampaignNamingPattern] = useState(() =>
    localStorage.getItem('cx_campaignNamingPattern') || 'XXXXXX|Brand-Category'
  );
  const [audienceLabelingEnabled, setAudienceLabelingEnabled] = useState(() =>
    localStorage.getItem('cx_audienceLabeling') === 'true'
  );

  useEffect(() => { localStorage.setItem('cx_campaignNaming', String(campaignNamingEnabled)); }, [campaignNamingEnabled]);
  useEffect(() => { localStorage.setItem('cx_campaignNamingPattern', campaignNamingPattern); }, [campaignNamingPattern]);
  useEffect(() => { localStorage.setItem('cx_audienceLabeling', String(audienceLabelingEnabled)); }, [audienceLabelingEnabled]);

  return (
    <AccountSpecificsContext.Provider value={{
      campaignNamingEnabled, setCampaignNamingEnabled,
      campaignNamingPattern, setCampaignNamingPattern,
      audienceLabelingEnabled, setAudienceLabelingEnabled,
    }}>
      {children}
    </AccountSpecificsContext.Provider>
  );
}

export function useAccountSpecifics() {
  const ctx = useContext(AccountSpecificsContext);
  if (!ctx) throw new Error('useAccountSpecifics must be used within AccountSpecificsProvider');
  return ctx;
}
