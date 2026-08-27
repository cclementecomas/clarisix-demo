import { useMemo, useState } from 'react';
import type { SqpRow } from '../../lib/sqp/types';
import DeepDiveTable from '../deepdive/DeepDiveTable';
import { useCurrency } from '../../contexts/CurrencyContext';
import InfoTooltip from '../InfoTooltip';
import { sqpColumns, sqpRateColumns } from './columns';
import { buildPivot, classifyGroups, filterByPattern, DIM_LABEL, DIM_ORDER, type Dim } from './buildTables';
import { PATTERN_META, type SharePattern } from './sharePattern';

const COPY = {
  share: {
    title: 'Share deep dive',
    subtitle: 'Your share of the market at every stage — impressions, clicks, basket adds, purchases — with the volumes and prices behind it, at any grain.',
    tooltip: 'Share = your count ÷ the market count at that stage. Pick the row grain, then optionally add one nested breakdown. Collapsed rows are the group total; expand for the breakdown. Conversion rates live on the Search funnel page. PPC Spend & ACoS unlock with the Ads connection.',
  },
  rates: {
    title: 'Conversion deep dive',
    subtitle: 'CTR, add-to-cart, purchase rate and CVR — your rate vs the market rate, with the gap in percentage points.',
    tooltip: 'The four funnel conversion rates at any grain, each next to the market rate for the same keywords. A negative gap is a step where shoppers who saw you chose someone else. Rates are recomputed from summed counts, never averaged across rows.',
  },
};

/** SQP pivot — the "show me everything" counterpart to the insight-first pages.
 *  Pick the ROW grain, then optionally add one nested breakdown; sort / show-hide
 *  columns / drill / export all come from DeepDiveTable. `variant` swaps the column
 *  set: 'share' = the market-share level, 'rates' = the funnel-conversion level. */
export default function SqpDeepDive({ rows, variant = 'share' }: { rows: SqpRow[]; variant?: 'share' | 'rates' }) {
  const { currency } = useCurrency();
  const [primary, setPrimary] = useState<Dim>('keyword');
  const [secondary, setSecondary] = useState<Dim | 'none'>('none');
  const [pattern, setPattern] = useState<SharePattern | 'all'>('all');
  const showPatterns = variant === 'share';

  // Counts are per grain: switching Rows by re-classifies from that grain's own sums.
  const patternCounts = useMemo(() => {
    if (!showPatterns) return null;
    const groups = classifyGroups(rows, primary);
    const counts = { all: groups.length, ad_supported: 0, ctr_gap: 0, cvr_gap: 0 };
    for (const g of groups) for (const p of g.patterns) counts[p] += 1;
    return counts;
  }, [showPatterns, rows, primary]);

  const scopedRows = useMemo(
    () => (showPatterns && pattern !== 'all' ? filterByPattern(rows, primary, pattern) : rows),
    [showPatterns, pattern, rows, primary],
  );

  const pickPrimary = (d: Dim) => { setPrimary(d); if (secondary === d) setSecondary('none'); };

  const t = useMemo(() => buildPivot(scopedRows, primary, secondary), [scopedRows, primary, secondary]);
  const columnDefs = useMemo(
    () => (variant === 'rates' ? sqpRateColumns(t.primaryLabel) : sqpColumns(currency, t.primaryLabel)),
    [variant, currency, t.primaryLabel],
  );
  const hasChildren = secondary !== 'none' && secondary !== primary;

  const Seg = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
        active ? 'bg-cx-500 text-white' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-14">Rows by</span>
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white">
            {DIM_ORDER.map((d) => (
              <Seg key={d} active={primary === d} onClick={() => pickPrimary(d)}>{DIM_LABEL[d]}</Seg>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-14">then by</span>
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white">
            <Seg active={secondary === 'none'} onClick={() => setSecondary('none')}>None</Seg>
            {DIM_ORDER.filter((d) => d !== primary).map((d) => (
              <Seg key={d} active={secondary === d} onClick={() => setSecondary(d)}>{DIM_LABEL[d]}</Seg>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">optional nested breakdown · Compare &amp; Funnel Score views coming next.</span>
        </div>
        {showPatterns && patternCounts && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-14 leading-tight">Pattern</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white">
              <Seg active={pattern === 'all'} onClick={() => setPattern('all')}>
                All <span className="opacity-60">{patternCounts.all}</span>
              </Seg>
              {(Object.keys(PATTERN_META) as SharePattern[]).map((p) => (
                <Seg key={p} active={pattern === p} onClick={() => setPattern(pattern === p ? 'all' : p)}>
                  {PATTERN_META[p].label} <span className="opacity-60">{patternCounts[p]}</span>
                </Seg>
              ))}
            </div>
            <InfoTooltip
              content={`How your share moves between stages, judged on each ${DIM_LABEL[primary].toLowerCase()}'s own totals. ${(Object.keys(PATTERN_META) as SharePattern[]).map((p) => `${PATTERN_META[p].label} (${PATTERN_META[p].short}): ${PATTERN_META[p].hint}`).join('\n\n')}\n\nA stage "keeps pace" when its share is within ±10% of the upstream share; beyond that it is a problem. Low-data rows are excluded by the same floors the leak model uses (200 impr/wk for the click test, 20 clicks/wk for the purchase test) and shares under 1% are skipped. Patterns overlap — a keyword can be ad-carried and still lose the purchase.`}
              wide
            />
            {pattern !== 'all' && (
              <span className="text-[10px] text-gray-500">
                {PATTERN_META[pattern].short} · <span className="font-semibold">{patternCounts[pattern]}</span> of {patternCounts.all} {DIM_LABEL[primary].toLowerCase()}s · totals below reflect the filter
              </span>
            )}
          </div>
        )}
      </div>

      <DeepDiveTable
        title={COPY[variant].title}
        subtitle={COPY[variant].subtitle}
        tooltip={COPY[variant].tooltip}
        rowData={t.rowData}
        columnDefs={columnDefs}
        childRowsMap={t.childRowsMap}
        rowKeyField={hasChildren ? 'rowLabel' : undefined}
        childLabelField={hasChildren ? 'childLabel' : undefined}
        groupNoun={t.primaryLabel}
        childNoun={t.childNoun}
        pinnedBottomRowData={t.footer}
        copyablePinnedCell
        autoExpand={hasChildren}
        hideViewControl
        maxHeight={840}
      />
    </div>
  );
}
