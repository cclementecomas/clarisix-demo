// ─── Advertising Overview — Decision Rollup Table ────────────────────────
// Compact summary table per Marketplace / Brand showing the entity's
// decision label, issue, next step, and headline efficiency metrics.
// Sorted by severity, highest first.

import { ArrowRight } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import {
  DECISION_STYLE, ISSUE_STYLE, ISSUE_CTA,
  type MarketplaceBrandDiagnostic,
} from '../../data/advertisingDiagnostics';

export default function DecisionRollupTable({
  title, subtitle, rows, embedded = false,
}: {
  title?: string;
  subtitle?: string;
  rows: MarketplaceBrandDiagnostic[];
  /** When true, drop the outer card chrome — for use inside a tabbed container. */
  embedded?: boolean;
}) {
  const { currency } = useCurrency();
  const body = (
    <>
      {title && !embedded && (
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <Th>Entity</Th>
              <Th>Decision</Th>
              <Th>Evidence</Th>
              <Th align="right">Spend</Th>
              <Th align="right">Ad sales</Th>
              <Th align="right">ACOS</Th>
              <Th align="right">Sales Δ PoP</Th>
              <Th>Next step</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dec = DECISION_STYLE[r.decision];
              const issueCls = ISSUE_STYLE[r.issue];
              const cta = ISSUE_CTA[r.issue];
              return (
                <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-2.5 align-top">
                    <span className="text-[12px] font-semibold text-gray-900">{r.name}</span>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${dec.chip}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dec.dot}`} />
                      {r.decision}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top max-w-[260px]">
                    <span className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-bold border ${issueCls} mb-1`}>{r.issue}</span>
                    {r.evidence.length > 0 && (
                      <div className="text-[10.5px] text-gray-600 leading-snug">
                        {r.evidence.slice(0, 2).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top text-right tabular-nums">{fc(r.spend, currency, { compact: true })}</td>
                  <td className="px-3 py-2.5 align-top text-right tabular-nums">{fc(r.sales, currency, { compact: true })}</td>
                  <td className={`px-3 py-2.5 align-top text-right font-semibold tabular-nums ${r.acos > 30 ? 'text-rose-700' : r.acos < 20 ? 'text-emerald-700' : 'text-gray-900'}`}>{r.acos.toFixed(1)}%</td>
                  <td className={`px-3 py-2.5 align-top text-right font-semibold tabular-nums ${r.salesPoP > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {r.salesPoP > 0 ? '+' : ''}{r.salesPoP.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 align-top max-w-[240px]">
                    {cta.ctaLabel ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-900">
                        {cta.ctaLabel}
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">{r.nextStep || '—'}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
  if (embedded) return body;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {body}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}
