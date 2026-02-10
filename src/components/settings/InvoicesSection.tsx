import { Download, FileText, Search } from 'lucide-react';
import { useState } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';

const invoices = [
  { id: 'INV-2026-007', date: 'Feb 1, 2026', amount: 79, status: 'Upcoming', plan: 'Pro' },
  { id: 'INV-2026-006', date: 'Jan 1, 2026', amount: 79, status: 'Paid', plan: 'Pro' },
  { id: 'INV-2025-005', date: 'Dec 1, 2025', amount: 79, status: 'Paid', plan: 'Pro' },
  { id: 'INV-2025-004', date: 'Nov 1, 2025', amount: 79, status: 'Paid', plan: 'Pro' },
  { id: 'INV-2025-003', date: 'Oct 1, 2025', amount: 79, status: 'Paid', plan: 'Pro' },
  { id: 'INV-2025-002', date: 'Sep 1, 2025', amount: 29, status: 'Paid', plan: 'Starter' },
  { id: 'INV-2025-001', date: 'Aug 1, 2025', amount: 29, status: 'Paid', plan: 'Starter' },
];

export default function InvoicesSection() {
  const { currency } = useCurrency();
  const [search, setSearch] = useState('');

  const filtered = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.date.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Billing History</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              View and download your past invoices
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all w-56"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-2.5">
                Invoice
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">
                Date
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">
                Plan
              </th>
              <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">
                Amount
              </th>
              <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">
                Status
              </th>
              <th className="px-6 py-2.5 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{inv.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.date}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                    {inv.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                  {fc(inv.amount, currency, { decimals: 2 })}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      inv.status === 'Paid'
                        ? 'text-green-700 bg-green-50 border border-green-200'
                        : 'text-amber-700 bg-amber-50 border border-amber-200'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {inv.status === 'Paid' && (
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-cx-600 hover:bg-cx-50 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
}
