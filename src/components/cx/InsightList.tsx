import { ArrowRight } from 'lucide-react';
import { useCx } from '../../contexts/CxContext';
import { PriorityChip } from './ui';
import type { Insight } from '../../data/cxData';

export function InsightCard({ insight }: { insight: Insight }) {
  const { viewEvidence } = useCx();
  const affected = insight.affectedAsins.length;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 flex flex-col gap-2">
      <PriorityChip priority={insight.priority} />
      <h4 className="text-[13px] font-bold text-gray-900 leading-snug">{insight.headline}</h4>
      <p className="text-[12px] text-gray-600 leading-snug">{insight.detail}</p>
      <div className="text-[10px] font-mono text-gray-400 bg-gray-50 rounded px-2 py-1 border border-gray-100">{insight.trigger}</div>
      <button onClick={() => viewEvidence(insight)}
        className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-cx-600 hover:text-cx-800 self-start">
        {affected ? `View ${affected} affected product${affected === 1 ? '' : 's'}` : 'View evidence'} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function InsightList({ insights, title = 'Prioritized insights' }: { insights: Insight[]; title?: string }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{title}</h3>
        <span className="text-[10px] text-gray-400">{insights.length} of max 3</span>
      </div>
      {insights.length === 0
        ? <div className="bg-white rounded-xl border border-gray-200 p-4 text-[12px] text-gray-400">No signals crossed a threshold this period.</div>
        : insights.map((i) => <InsightCard key={i.id} insight={i} />)}
    </div>
  );
}
