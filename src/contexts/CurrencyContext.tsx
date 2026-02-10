import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'EUR' | 'USD' | 'GBP';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '\u20AC',
  USD: '$',
  GBP: '\u00A3',
};

export const CONVERSION_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem('currency');
    return (stored as Currency) || 'EUR';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: setCurrencyState }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
