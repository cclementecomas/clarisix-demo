import { useCx } from '../../contexts/CxContext';
import { CxHeader } from './ui';
import OverviewDecision from './overview/OverviewDecision';
import OverviewAnalyst from './overview/OverviewAnalyst';

export default function CxOverview() {
  const { mode } = useCx();
  return (
    <div className="space-y-4 min-w-0">
      <CxHeader title="Customer Experience" question="Are customers becoming more loyal and more valuable?" />
      {mode === 'decision' ? <OverviewDecision /> : <OverviewAnalyst />}
    </div>
  );
}
