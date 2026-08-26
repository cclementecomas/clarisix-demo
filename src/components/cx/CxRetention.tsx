import { useCx } from '../../contexts/CxContext';
import { CxHeader } from './ui';
import RetentionDecision from './retention/RetentionDecision';
import RetentionAnalyst from './retention/RetentionAnalyst';

export default function CxRetention() {
  const { mode } = useCx();
  return (
    <div className="space-y-4 min-w-0">
      <CxHeader title="Retention & Value" question="How quickly does customer value compound, and what can we safely spend to acquire it?" />
      {mode === 'decision' ? <RetentionDecision /> : <RetentionAnalyst />}
    </div>
  );
}
