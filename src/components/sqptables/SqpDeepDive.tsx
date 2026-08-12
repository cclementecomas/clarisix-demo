import { useMemo, useState } from 'react';
import type { SqpRow } from '../../lib/sqp/types';
import DeepDiveTable from '../deepdive/DeepDiveTable';
import { useCurrency } from '../../contexts/CurrencyContext';
import { sqpColumns } from './columns';
import { buildPivot, DIM_LABEL, DIM_ORDER, type Dim } from './buildTables';

/** SQP full-metric pivot — the "show me everything" counterpart to the insight-first
 *  Keyword portfolio. Pick the ROW grain, then optionally add one nested breakdown;
 *  sort / show-hide columns / drill / export all come from DeepDiveTable. */
export default function SqpDeepDive({ rows }: { rows: SqpRow[] }) {
  const { currency } = useCurrency();
  const [primary, setPrimary] = useState<Dim>('keyword');
  const [secondary, setSecondary] = useState<Dim | 'none'>('none');

  const pickPrimary = (d: Dim) => { setPrimary(d); if (secondary === d) setSecondary('none'); };

  const t = useMemo(() => buildPivot(rows, primary, secondary), [rows, primary, secondary]);
  const columnDefs = useMemo(() => sqpColumns(currency, t.primaryLabel), [currency, t.primaryLabel]);
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
      </div>

      <DeepDiveTable
        title="SQP deep dive"
        subtitle="Amazon Search Query Performance — market vs your brand, at any grain. Sort any column, show/hide columns, drill and export."
        tooltip="Every SQP metric. Pick the row grain, then optionally add one nested breakdown. Collapsed rows are the group total; expand for the breakdown. PPC Spend & ACoS unlock with the Ads connection."
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
      />
    </div>
  );
}
