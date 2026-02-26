import { createContext, useContext, useState, ReactNode } from 'react';
import { resolveQuickPreset, type DateFilterResult } from '../utils/dateRanges';

const defaultRange = resolveQuickPreset('Last month');

interface DateFilterContextType {
  dateResult: DateFilterResult;
  setDateResult: (result: DateFilterResult) => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [dateResult, setDateResult] = useState<DateFilterResult>(defaultRange);

  return (
    <DateFilterContext.Provider value={{ dateResult, setDateResult }}>
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const context = useContext(DateFilterContext);
  if (context === undefined) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
}
