// ─── Per-Product Traffic Table ───────────────────────────────────────────
// Ranks ASINs by ESTIMATED LOST REVENUE from the brand's main funnel leak.
//
// Lost revenue = (marketConvRate − productConvRate) × sessions × downstream
//                × ASP, computed against whichever stage is the brand's
//                biggest leak. For the demo brand that's Click → Cart Add.

import { useMemo, useState } from 'react';
import { ChevronsUpDown, ArrowUp, ArrowDown, Copy, Check } from 'lucide-react';
import type { ProductTrafficRow } from '../../data/trafficData';
import { brandFunnelDiagnostic } from '../../data/funnelDiagnosticData';
import { ACCOUNT_ASP } from '../../data/accountMetrics';
import { productImageUrl, leakAllocation } from './trafficCalc';
import InfoTooltip from '../InfoTooltip';

const AVG_SELLING_PRICE = ACCOUNT_ASP;

function AsinCopyChip({ asin }: { asin: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(asin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 hover:text-gray-800 transition-colors"
      title={`Copy ${asin}`}
    >
      <span>{asin}</span>
      {copied
        ? <Check className="w-3 h-3 text-emerald-600" />
        : <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />}
    </button>
  );
}

type SortKey =
  | 'lostRevenue' | 'sessions' | 'pageViews' | 'pvPerSession' | 'cvr'
  | 'addToCartRate' | 'buyBoxPct' | 'orders' | 'organicPct';

const PORTFOLIO_CVR_BENCHMARK = 12.5;

export default function ProductTrafficTable() {
  const d = brandFunnelDiagnostic;
  const leakConv = d.conversions[d.biggestOpportunityIdx - 1];
  const leakStageLabel = leakConv.shortLabel;
  const marketATCRate  = leakConv.marketRate;

  const [sortKey, setSortKey] = useState<SortKey>('lostRevenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  // Per-ASIN rows are a decomposition of the brand leak opportunity, so the
  // table total reconciles with the hero + opportunity widget + driver cards.
  const { opp, enriched } = useMemo(() => {
    const { opp, rows } = leakAllocation(d);
    return { opp, enriched: rows };
  }, [d]);

  const totalLost = opp.revenue;

  const sorted = useMemo(() => {
    let rows = enriched;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.asin.toLowerCase().includes(q) || r.product.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      const cmp = (typeof av === 'number' && typeof bv === 'number') ? av - bv : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [enriched, search, sortKey, sortDir]);

  const setSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir(k === 'cvr' || k === 'addToCartRate' ? 'asc' : 'desc'); }
  };

  // "So what" insight — the top 3 ASINs explain the bulk of lost revenue.
  const top3Lost = useMemo(() => {
    return [...enriched].sort((a, b) => b.lostRevenue - a.lostRevenue).slice(0, 3);
  }, [enriched]);
  const top3Sum = top3Lost.reduce((s, r) => s + r.lostRevenue, 0);
  const top3Share = totalLost > 0 ? Math.round((top3Sum / totalLost) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" id="leaking-asins-table">
      <div className="px-5 py-3 border-b border-gray-100 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Top ASINs causing the leak</h3>
          <p className="text-[12px] text-gray-700 leading-relaxed mt-1 max-w-3xl">
            <span className="font-semibold">So what:</span>{' '}
            <span className="text-gray-600">
              Top {top3Lost.length} ASINs account for ~{top3Share}% of the lost sales at {leakStageLabel}.
              Fixing these moves the brand-level number more than anything else.
            </span>
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ASIN or product…"
          className="px-3 py-1.5 text-xs w-64 border border-gray-200 rounded-md focus:ring-1 focus:ring-cx-500/30 focus:border-cx-400 outline-none"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <Th label="Product" align="left" />
              <Th
                label="Lost sales / wk"
                sortKey="lostRevenue"
                currentKey={sortKey}
                dir={sortDir}
                onClick={setSort}
                align="right"
                tooltip={
                  `Estimated weekly € you'd recover if this ASIN closed half its gap to the market ${leakStageLabel} rate (${marketATCRate.toFixed(1)}%). ` +
                  `Calculated as: sessions × (marketRate − productRate) × 0.5 × downstream conversion × €${AVG_SELLING_PRICE} ASP. ` +
                  `ASINs already above the market rate score 0.`
                }
              />
              <Th label="Sessions"          sortKey="sessions"      currentKey={sortKey} dir={sortDir} onClick={setSort} align="right" />
              <Th label="Basket-Add Rate"  sortKey="addToCartRate" currentKey={sortKey} dir={sortDir} onClick={setSort} align="right" />
              <Th label="CVR"          sortKey="cvr"           currentKey={sortKey} dir={sortDir} onClick={setSort} align="right" />
              <Th label="BBox %"       sortKey="buyBoxPct"     currentKey={sortKey} dir={sortDir} onClick={setSort} align="right" />
              <Th label="Orders"      sortKey="orders"      currentKey={sortKey} dir={sortDir} onClick={setSort} align="right" />
              <Th label="Organic %"   sortKey="organicPct"  currentKey={sortKey} dir={sortDir} onClick={setSort} align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <Row key={r.asin} row={r} marketATCRate={marketATCRate} totalLost={totalLost} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between flex-wrap gap-2">
        <span>{sorted.length} products · sorted by lost sales at {leakStageLabel}</span>
        <span>Total estimated weekly leak: <span className="font-semibold text-gray-700 tabular-nums">€{totalLost.toLocaleString()}</span></span>
      </div>
    </div>
  );
}

function Th({
  label, sortKey, currentKey, dir, onClick, align = 'left', tooltip,
}: {
  label: string;
  sortKey?: SortKey;
  currentKey?: SortKey;
  dir?: 'asc' | 'desc';
  onClick?: (k: SortKey) => void;
  align?: 'left' | 'right' | 'center';
  tooltip?: string;
}) {
  const sortable = !!sortKey && !!onClick;
  const active = sortable && sortKey === currentKey;
  return (
    <th
      onClick={sortable ? () => onClick!(sortKey!) : undefined}
      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${
        sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
      } ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : align === 'center' ? 'justify-center' : ''}`}>
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
        {sortable && (active
          ? (dir === 'asc' ? <ArrowUp className="w-3 h-3 text-cx-500" /> : <ArrowDown className="w-3 h-3 text-cx-500" />)
          : <ChevronsUpDown className="w-3 h-3 text-gray-300" />
        )}
      </span>
    </th>
  );
}

function Row({ row: r, marketATCRate, totalLost }: {
  row: ProductTrafficRow & { lostRevenue: number };
  marketATCRate: number;
  totalLost: number;
}) {
  const lostShare = totalLost > 0 ? (r.lostRevenue / totalLost) * 100 : 0;
  const cvrHealthy = r.cvr >= PORTFOLIO_CVR_BENCHMARK;
  const atcHealthy = r.addToCartRate >= marketATCRate;
  const bboxHealthy = r.buyBoxPct >= 88;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-3 py-2 max-w-[300px]">
        <div className="flex items-start gap-2.5">
          <img
            src={productImageUrl(r.asin)}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="w-10 h-10 rounded-md object-cover bg-gray-100 flex-shrink-0 border border-gray-200"
          />
          <div className="min-w-0">
            <AsinCopyChip asin={r.asin} />
            <div className="text-[12px] font-semibold text-gray-900 truncate" title={r.product}>{r.product}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <div className={`text-[13px] font-bold tabular-nums ${r.lostRevenue > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
          {r.lostRevenue > 0 ? `€${r.lostRevenue.toLocaleString()}` : '—'}
        </div>
        {r.lostRevenue > 0 && (
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <div className="h-1 w-12 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-400" style={{ width: `${Math.min(100, lostShare * 3)}%` }} />
            </div>
            <span className="text-[9px] text-gray-400 tabular-nums">{lostShare.toFixed(0)}%</span>
          </div>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <div className="text-[12px] font-semibold text-gray-900 tabular-nums">{r.sessions.toLocaleString()}</div>
        <DeltaPct value={r.sessionsPoP} suffix="%" />
      </td>
      <td className="px-3 py-2 text-right">
        <span className={`text-[12px] font-semibold tabular-nums ${atcHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>{r.addToCartRate.toFixed(1)}%</span>
        <div className="text-[9px] text-gray-400">mkt {marketATCRate.toFixed(0)}%</div>
      </td>
      <td className="px-3 py-2 text-right">
        <div className={`text-[12px] font-semibold tabular-nums ${cvrHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>{r.cvr.toFixed(1)}%</div>
        <DeltaPct value={r.cvrPoP} suffix="pp" />
      </td>
      <td className="px-3 py-2 text-right">
        <div className={`text-[12px] font-semibold tabular-nums ${bboxHealthy ? 'text-gray-900' : 'text-orange-700'}`}>{r.buyBoxPct.toFixed(1)}%</div>
        <DeltaPct value={r.buyBoxPctPoP} suffix="pp" />
      </td>
      <td className="px-3 py-2 text-right">
        <span className="text-[12px] font-semibold text-gray-900 tabular-nums">{r.orders.toLocaleString()}</span>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="text-[11px] tabular-nums text-gray-700">{r.organicPct.toFixed(0)}%</div>
        <DeltaPct value={r.organicPctPoP} suffix="pp" />
      </td>
    </tr>
  );
}

function DeltaPct({ value, suffix }: { value: number; suffix: string }) {
  if (Math.abs(value) < 0.05) return <div className="text-[9px] text-gray-400">—</div>;
  const positive = value > 0;
  return (
    <div className={`text-[9px] font-medium ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>
      {positive ? '+' : ''}{value.toFixed(1)}{suffix} PoP
    </div>
  );
}
