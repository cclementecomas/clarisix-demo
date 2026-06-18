import { useState, Fragment } from 'react';
import { CheckCircle2, AlertTriangle, ArrowDown } from 'lucide-react';
import { settlementRecons, TB_SECTION_ORDER, TBSection, TBLine } from '../data/settlementPostingData';
import { useCurrency } from '../contexts/CurrencyContext';
import { convert } from '../utils/currency';
import InfoTooltip from './InfoTooltip';

const SECTION_LABEL: Record<TBSection, string> = {
  Receivable: 'Control Account',
  Revenue: 'Revenue',
  Tax: 'Tax (VAT — pass-through)',
  Refunds: 'Returns & Refunds',
  Promotions: 'Promotions',
  Fees: 'Amazon Fees',
  Advertising: 'Advertising',
  Reimbursements: 'Reimbursements',
  Reserve: 'Reserve',
  Suspense: 'Suspense',
};

export default function SettlementPostingBridge() {
  const { currency } = useCurrency();
  const [selectedKey, setSelectedKey] = useState(settlementRecons[settlementRecons.length - 1].key);
  const recon = settlementRecons.find((r) => r.key === selectedKey) ?? settlementRecons[0];

  const money = (v: number, opts: { sign?: boolean } = {}) => {
    const c = convert(v, currency);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(Math.abs(c));
    if (opts.sign && c !== 0) return `${c < 0 ? '−' : '+'}${formatted}`;
    return c < 0 ? `(${formatted})` : formatted;
  };

  const { bridge, completeness } = recon;
  const allClean = completeness.balanced && completeness.tiesToPayout && completeness.suspenseRows === 0;

  // Group trial-balance lines by section in canonical order.
  const grouped: { section: TBSection; lines: TBLine[] }[] = TB_SECTION_ORDER
    .map((section) => ({ section, lines: recon.trialBalance.filter((l) => l.section === section) }))
    .filter((g) => g.lines.length > 0);

  return (
    <div className="px-5 py-3">
      {/* Settlement selector */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5 flex-wrap">
          {settlementRecons.map((r) => {
            const isActive = r.key === selectedKey;
            const hasFlag = r.completeness.suspenseRows > 0;
            return (
              <button
                key={r.key}
                onClick={() => setSelectedKey(r.key)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.label}
                {hasFlag && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span>Settlement closed {recon.closeDate}</span>
          <span className="text-gray-300">·</span>
          <span>Paid out {recon.payoutDate}</span>
        </div>
      </div>

      {/* ── Block 3 (top banner) · Posting completeness ──────────────────── */}
      <div className={`rounded-lg border px-4 py-2.5 mb-3 ${allClean ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          {allClean
            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
            : <AlertTriangle className="w-4 h-4 text-amber-600" />}
          <span className={`text-xs font-bold ${allClean ? 'text-green-800' : 'text-amber-800'}`}>
            {allClean ? 'Fully reconciled — every line posted and tied to the bank payout' : 'Reconciled to bank, but some lines are unclassified — posting rules incomplete'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Rows classified', value: `${completeness.classifiedRows.toLocaleString()} / ${completeness.totalRows.toLocaleString()}`, ok: completeness.suspenseRows === 0 },
            { label: 'Unclassified (suspense)', value: completeness.suspenseRows === 0 ? 'None' : `${completeness.suspenseRows} · ${money(completeness.suspenseAmount)}`, ok: completeness.suspenseRows === 0 },
            { label: 'Journal balanced (Dr = Cr)', value: money(Math.abs(recon.totalDebit - recon.totalCredit)) + ' diff', ok: completeness.balanced },
            { label: 'Ties to bank payout', value: money(Math.abs(bridge.variance)) + ' diff', ok: completeness.tiesToPayout },
          ].map((c) => (
            <div key={c.label} className="bg-white/70 rounded-md border border-gray-200 px-2.5 py-1.5">
              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{c.label}</div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold tabular-nums ${c.ok ? 'text-gray-900' : 'text-amber-700'}`}>{c.value}</span>
                {c.ok
                  ? <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                  : <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Block 1 · Settlement journal (trial balance) ─────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Settlement Journal — Trial Balance</h3>
            <InfoTooltip content={'Every settlement line posted as a double entry, grouped by account. Total Debits must equal Total Credits — this is the proof that nothing was dropped or double-counted.'} wide />
          </div>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-slate-700 text-white">
                <tr>
                  <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider">Account</th>
                  <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider">Debit</th>
                  <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider">Credit</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => (
                  <Fragment key={g.section}>
                    <tr className="bg-gray-100">
                      <td colSpan={3} className="px-3 py-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                        {SECTION_LABEL[g.section]}
                      </td>
                    </tr>
                    {g.lines.map((l) => (
                      <tr key={l.id} className={`bg-white border-t border-gray-100 ${l.section === 'Suspense' ? 'bg-amber-50' : ''}`}>
                        <td className="px-3 py-0.5 text-xs text-gray-700">
                          <span className="text-gray-400 tabular-nums mr-1.5">{l.id}</span>{l.name}
                        </td>
                        <td className="px-3 py-0.5 text-xs tabular-nums text-right text-gray-800">{l.debit ? money(l.debit) : ''}</td>
                        <td className="px-3 py-0.5 text-xs tabular-nums text-right text-gray-800">{l.credit ? money(l.credit) : ''}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-cx-50 border-t-2 border-cx-300">
                  <td className="px-3 py-1 text-xs font-bold text-gray-900">
                    Total
                    {completeness.balanced && <CheckCircle2 className="w-3 h-3 text-green-600 inline ml-1.5 -mt-0.5" />}
                  </td>
                  <td className="px-3 py-1 text-xs font-bold tabular-nums text-right text-gray-900">{money(recon.totalDebit)}</td>
                  <td className="px-3 py-1 text-xs font-bold tabular-nums text-right text-gray-900">{money(recon.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Block 2 · Amazon Receivable → payout bridge ──────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Amazon Receivable → Bank Payout</h3>
            <InfoTooltip content={'Reconstructs the bank deposit from the receivable control account: money in, less money out, less reserve withheld, plus reserve released. The result must equal the settlement payout to the cent.'} wide />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Money in */}
            <div className="px-3 py-1.5 bg-green-50/50 border-b border-gray-100">
              <div className="text-[9px] font-bold text-green-700 uppercase tracking-wider mb-0.5">Money in (Dr Receivable)</div>
              {bridge.inItems.map((i) => (
                <div key={i.label} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-gray-600">{i.label}</span>
                  <span className="tabular-nums text-gray-800">{money(i.amount, { sign: true })}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs font-semibold border-t border-green-200 mt-0.5 pt-0.5">
                <span className="text-gray-700">Total in</span>
                <span className="tabular-nums text-green-700">{money(bridge.moneyIn, { sign: true })}</span>
              </div>
            </div>
            {/* Money out */}
            <div className="px-3 py-1.5 bg-red-50/40 border-b border-gray-100">
              <div className="text-[9px] font-bold text-red-700 uppercase tracking-wider mb-0.5">Money out (Cr Receivable)</div>
              {bridge.outItems.map((i) => (
                <div key={i.label} className={`flex items-center justify-between text-[11px] py-0.5 ${i.label.includes('suspense') ? 'text-amber-700 font-medium' : ''}`}>
                  <span className={i.label.includes('suspense') ? 'text-amber-700' : 'text-gray-600'}>{i.label}</span>
                  <span className="tabular-nums">{money(-i.amount, { sign: true })}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs font-semibold border-t border-red-200 mt-0.5 pt-0.5">
                <span className="text-gray-700">Total out</span>
                <span className="tabular-nums text-red-700">{money(-bridge.moneyOut, { sign: true })}</span>
              </div>
            </div>
            {/* Net activity + reserves */}
            <div className="px-3 py-1.5 border-b border-gray-100">
              <div className="flex items-center justify-between text-xs font-semibold py-0.5">
                <span className="text-gray-700">= Net settlement activity</span>
                <span className="tabular-nums text-gray-900">{money(bridge.netActivity, { sign: true })}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5">
                <span className="text-gray-600">(−) Reserve withheld this period</span>
                <span className="tabular-nums">{money(-bridge.reserveWithheld, { sign: true })}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5">
                <span className="text-gray-600">(+) Reserve released from prior</span>
                <span className="tabular-nums">{money(bridge.reserveReleased, { sign: true })}</span>
              </div>
            </div>
            {/* Net disbursement */}
            <div className="px-3 py-2 bg-slate-800 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">= Net Disbursement (to bank)</span>
                <span className="text-sm font-bold tabular-nums">{money(bridge.netDisbursement)}</span>
              </div>
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-600">
                <span className="text-[10px] text-slate-300 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3" /> Settlement Report payout
                </span>
                <span className="text-[11px] tabular-nums text-slate-200">{money(bridge.settlementPayout)}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-slate-300">Variance</span>
                <span className={`text-[11px] font-bold tabular-nums flex items-center gap-1 ${Math.abs(bridge.variance) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                  {money(bridge.variance)}
                  {Math.abs(bridge.variance) < 0.01 && <CheckCircle2 className="w-3 h-3" />}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
            The journal balances and the receivable nets to the exact bank deposit — so the settlement is fully accounted for.
            VAT appears here (collected then remitted by Amazon, netting to zero) because the settlement file contains it; the accrual P&amp;L excludes it instead.
            Any amount-type Amazon adds that we don&rsquo;t yet have a rule for lands in <span className="font-semibold text-amber-700">Suspense</span> and is flagged above — that is how we keep the posting rules complete.
          </p>
        </div>
      </div>
    </div>
  );
}
