import { useState } from 'react';
import { Database, HelpCircle } from 'lucide-react';
import { TOP_QUERIES_CAP } from '../../lib/sqp/constants';
import { weekLabel } from '../searchfunnel/format';
import HowCalculatedModal from './HowCalculatedModal';

export default function TrustBar({ throughWeek, nAsins, nQueries }: { throughWeek: string; nAsins: number; nQueries?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 flex-wrap">
        <Database className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <span>Source: Amazon Search Query Performance · Weekly per ASIN · top {TOP_QUERIES_CAP} queries/ASIN · Amazon search traffic only ·</span>
        <span className="font-semibold text-gray-700">Data through week ending {weekLabel(throughWeek)}</span>
        <span>· {nAsins} ASINs{nQueries != null ? ` · ${nQueries} queries` : ''}</span>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-cx-600 hover:text-cx-700 font-semibold ml-auto"><HelpCircle className="w-3 h-3" /> How this is calculated</button>
      </div>
      <HowCalculatedModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
