// ─── SQP Keyword Portfolio Table ────────────────────────────────────────
// Prioritized columns for decision-making. Row click opens the keyword
// detail drawer (overlay panel) — no inline expansion.
//
// Columns:
//   Keyword · Portfolio position · Market volume · Click share · Purchase
//   share · Main gap · Opportunity · Top ASIN · ACOS / PPC · Action

import { useMemo } from 'react';
import type { KeywordRow, KeywordIntent } from '../../data/sqpData';
import {
  QUADRANT_LABEL, QUADRANT_STYLE,
  keywordQuadrant, keywordMainGap,
  sqpSummary,
} from '../../data/sqpData';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

const INTENT_LABEL: Record<KeywordIntent, string> = {
  branded: 'Branded',
  generic: 'Generic',
  competitor: 'Competitor',
  longTail: 'Long-tail',
  category: 'Category',
};

export default function KeywordTable({
  rows, selectedKeyword, onSelect, portfolioAvgClickShare, portfolioAvgPurchaseShare,
}: {
  rows: KeywordRow[];
  selectedKeyword: string | null;
  onSelect: (k: KeywordRow | null) => void;
  portfolioAvgClickShare: number;
  portfolioAvgPurchaseShare: number;
}) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.opportunityEur - a.opportunityEur),
    [rows]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Prioritized keywords</h3>
        <span className="text-[10px] text-gray-400">
          {sorted.length} keywords · sorted by opportunity · click a row for detail
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 min-w-[260px]">Keyword</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Position</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Market Vol</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Click Share</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Purch Share</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Main gap</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Opportunity</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Top ASIN</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">ACOS / PPC</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const quadrant = keywordQuadrant(r, sqpSummary.volumeMedian, portfolioAvgClickShare);
              const quadStyle = QUADRANT_STYLE[quadrant];
              const mainGap = keywordMainGap(r);
              const isSelected = selectedKeyword === r.query;
              return (
                <tr
                  key={r.query}
                  onClick={() => onSelect(isSelected ? null : r)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-cx-50/40' : 'hover:bg-gray-50/40'}`}
                >
                  <td className="px-3 py-2 align-top">
                    <div className="text-[12px] font-semibold text-gray-900">{r.query}</div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">{INTENT_LABEL[r.intent]} · QSS {r.qss.toFixed(1)}</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ring-1 ring-inset ${quadStyle.bg} ${quadStyle.text} ${quadStyle.ring}`}>
                      {QUADRANT_LABEL[quadrant]}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="text-[12px] font-semibold text-gray-900 tabular-nums">{r.marketVolume.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-400">/wk</div>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="text-[12px] font-semibold text-gray-900 tabular-nums">{r.clicks.share.toFixed(1)}%</div>
                    <DeltaVsAvg value={r.clicks.share - portfolioAvgClickShare} />
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="text-[12px] font-semibold text-gray-900 tabular-nums">{r.purchases.share.toFixed(1)}%</div>
                    <DeltaVsAvg value={r.purchases.share - portfolioAvgPurchaseShare} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    {mainGap.gapPp > 0 ? (
                      <>
                        <div className="text-[11px] font-semibold text-gray-800">{mainGap.stageLabel}</div>
                        <div className="text-[10px] font-bold tabular-nums text-rose-700">−{mainGap.gapPp.toFixed(1)}pp</div>
                      </>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-medium inline-flex items-center gap-0.5">
                        <Minus className="w-2.5 h-2.5" /> Beats market
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="text-[12px] font-bold text-emerald-700 tabular-nums">€{r.opportunityEur.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-400">/wk if closed half</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="text-[10px] font-mono text-gray-600">{r.topAsin.asin}</div>
                    <div className="text-[10px] text-gray-500 max-w-[140px] truncate" title={r.topAsin.title}>{r.topAsin.title}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">Brand share {r.topAsin.brandShare.toFixed(1)}%</div>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className={`text-[12px] font-semibold tabular-nums ${r.ppc.acos > 35 ? 'text-rose-700' : r.ppc.acos > 25 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {r.ppc.acos.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-gray-500 tabular-nums">€{r.ppc.spend}/wk</div>
                  </td>
                  <td className="px-3 py-2 align-top max-w-[200px]">
                    <span className="text-[11px] font-medium text-gray-700">{r.action}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeltaVsAvg({ value }: { value: number }) {
  if (Math.abs(value) < 0.1) return <div className="text-[9px] text-gray-400">on avg</div>;
  const up = value > 0;
  return (
    <div className={`text-[9px] font-semibold inline-flex items-center gap-0.5 ${up ? 'text-emerald-700' : 'text-rose-700'}`}>
      {up ? <ArrowUp className="w-2 h-2" /> : <ArrowDown className="w-2 h-2" />}
      {Math.abs(value).toFixed(1)}pp vs avg
    </div>
  );
}
