import { createContext, useContext, useState, ReactNode } from 'react';
import type { Insight } from '../data/cxData';

// Presentation mode (not a permission). Decision is the default; Analyst exposes full detail.
export type CxMode = 'decision' | 'analyst';

export interface CxEvidence {
  page: 'overview' | 'retention';
  tab: string;          // internal analyst tab to open (e.g. 'product', 'cohort', 'subeconomics')
  rule: string;         // the rule id to filter by
  filterLabel: string;  // human-readable banner text
  asins?: string[];     // rows to highlight/scope
}

interface CxContextType {
  mode: CxMode;
  setMode: (m: CxMode) => void;
  evidence: CxEvidence | null;
  clearEvidence: () => void;
  selectedAsin: string | null;
  setSelectedAsin: (a: string | null) => void;
  /** From an insight's "View evidence": jump to Analyst, open the right tab, apply the rule. */
  viewEvidence: (i: Insight) => void;
}

const Ctx = createContext<CxContextType | undefined>(undefined);

export function CxProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CxMode>('decision');
  const [evidence, setEvidence] = useState<CxEvidence | null>(null);
  const [selectedAsin, setSelectedAsin] = useState<string | null>(null);

  const viewEvidence = (i: Insight) => {
    setEvidence({ ...i.evidence, asins: i.affectedAsins });
    setMode('analyst');
  };

  return (
    <Ctx.Provider value={{ mode, setMode, evidence, clearEvidence: () => setEvidence(null), selectedAsin, setSelectedAsin, viewEvidence }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCx(): CxContextType {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCx must be used within a CxProvider');
  return c;
}
