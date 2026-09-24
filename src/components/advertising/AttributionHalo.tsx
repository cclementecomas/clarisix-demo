// Advertising › Attribution & Halo — two decisions, then the evidence.
//   1. WHERE ad-attributed sales land (the ASIN advertised, or another one — halo).
//   2. WHEN they land (days from click to purchase — how provisional a fresh ACOS is).
// Decision view: two reads + one scannable campaign table (expand for pairs) + timing bars.
// Analyst view: advertised→purchased table and per-ASIN window counts.
// Only Amazon-exposed columns are used — see src/data/attributionData.ts for the source map.
import { Fragment, useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import InfoTooltip from '../InfoTooltip';
import LastRefreshed from '../LastRefreshed';
import ProductThumb from '../ProductThumb';
import ViewModeToggle, { type ViewMode } from '../ViewModeToggle';
import DeepDiveTable, { type ColumnDef, currencyFormatter, numberFormatter, pctShareFormatter } from '../deepdive/DeepDiveTable';
import { haloRows, windowRows, windowBuckets, WINDOW_LABELS, ASIN_TITLE, PARENT_OF, PARENT_NAME, AD_TYPE_LABEL, type AdType, type HaloRow } from '../../data/attributionData';

/* eslint-disable @typescript-eslint/no-explicit-any */
// One colour meaning each, page-wide: promoted = Clarisix blue, halo = Clarisix orange,
// timing buckets = a single blue ramp (dark = soonest).
const C = { promoted: '#0E5A8A', halo: '#D55E00', win: ['#0E5A8A', '#4B9DCC', '#9CC7E3', '#D6E6F2'] };
const CHIP = { promoted: 'bg-cx-50 text-cx-700 ring-cx-200', halo: 'bg-orange-50 text-orange-800 ring-orange-200' } as const;
const attrLabel = (r: HaloRow) => (r.attribution === 'promoted' ? 'Promoted' : r.adType === 'SP' ? 'Halo' : 'Brand halo');

function SplitBar({ a, b, h = 8 }: { a: number; b: number; h?: number }) {
  const t = a + b || 1;
  return <div className="flex w-full rounded-full overflow-hidden bg-gray-100" style={{ height: h }}><div style={{ width: `${(a / t) * 100}%`, background: C.promoted }} /><div style={{ width: `${(b / t) * 100}%`, background: C.halo }} /></div>;
}
function WindowBar({ pct, counts, h = 14, labels = true, title }: { pct: number[]; counts?: number[]; h?: number; labels?: boolean; title?: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = () => { if (timer.current) clearTimeout(timer.current); const r = ref.current?.getBoundingClientRect(); if (r) setPos({ top: r.bottom + 8, left: r.left + r.width / 2 }); };
  const hide = () => { timer.current = setTimeout(() => setPos(null), 80); };
  const W = 230;
  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide} className="flex w-full rounded-md overflow-hidden bg-gray-100 cursor-help" style={{ height: h }}>
      {pct.map((v, i) => <div key={i} className="flex items-center justify-center" style={{ width: `${v}%`, background: C.win[i] }}>{labels && v >= 9 && <span className="text-[10px] font-bold" style={{ color: i < 2 ? '#fff' : '#1E3A5F' }}>{v.toFixed(0)}%</span>}</div>)}
      {pos && createPortal(
        <div className="fixed pointer-events-none" style={{ top: pos.top, left: Math.min(Math.max(pos.left - W / 2, 8), window.innerWidth - W - 8), zIndex: 99999 }}>
          <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2.5 text-[11px]" style={{ width: W }}>
            {title && <div className="font-semibold mb-1.5 text-gray-200">{title}</div>}
            {WINDOW_LABELS.map((l, i) => (
              <div key={l} className="flex items-center gap-2 py-0.5">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: C.win[i] }} />
                <span className="flex-1 text-gray-300">{l}</span>
                <span className="font-bold tabular-nums">{pct[i].toFixed(1)}%</span>
                {counts && <span className="w-12 text-right tabular-nums text-gray-400">{counts[i].toLocaleString('en-US')}</span>}
              </div>))}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-900" />
          </div>
        </div>, document.body)}
    </div>
  );
}

export default function AttributionHalo() {
  const { currency } = useCurrency();
  const [view, setView] = useState<ViewMode>('decision');
  const [adTypes, setAdTypes] = useState<Set<AdType>>(() => new Set<AdType>(['SP', 'SB', 'SD']));
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggleType = (t: AdType) => setAdTypes((p) => { const n = new Set(p); if (n.has(t)) { if (n.size > 1) n.delete(t); } else n.add(t); return n; });
  const toggleOpen = (c: string) => setOpen((p) => { const n = new Set(p); if (n.has(c)) n.delete(c); else n.add(c); return n; });

  const rows = useMemo(() => haloRows.filter((r) => adTypes.has(r.adType)), [adTypes]);
  const k = useMemo(() => {
    const sales = rows.reduce((s, r) => s + r.sales14d, 0);
    const halo = rows.filter((r) => r.attribution === 'halo').reduce((s, r) => s + r.sales14d, 0);
    const top = [...rows.filter((r) => r.attribution === 'halo' && r.advertisedAsin)].sort((a, b) => b.sales14d - a.sales14d)[0];
    const w = windowRows.reduce((a, r) => { const b = windowBuckets(r); return { d1: a.d1 + b.d1, d2_7: a.d2_7 + b.d2_7, d8_14: a.d8_14 + b.d8_14, d15_30: a.d15_30 + b.d15_30 }; }, { d1: 0, d2_7: 0, d8_14: 0, d15_30: 0 });
    const conv = w.d1 + w.d2_7 + w.d8_14 + w.d15_30 || 1;
    const pct = [w.d1, w.d2_7, w.d8_14, w.d15_30].map((v) => (v / conv) * 100);
    return { sales, halo, promoted: sales - halo, haloPct: sales ? (halo / sales) * 100 : 0, top, pct, counts: [w.d1, w.d2_7, w.d8_14, w.d15_30], conv, after7: pct[2] + pct[3] };
  }, [rows]);

  // campaigns: one row each; pairs grouped by advertised ASIN when expanded
  const campaigns = useMemo(() => { const m = new Map<string, HaloRow[]>(); rows.forEach((r) => m.set(r.campaign, [...(m.get(r.campaign) ?? []), r])); return [...m.entries()].map(([campaign, rs]) => {
    const sales = rs.reduce((s, r) => s + r.sales14d, 0), halo = rs.filter((r) => r.attribution === 'halo').reduce((s, r) => s + r.sales14d, 0);
    const topHalo = [...rs.filter((r) => r.attribution === 'halo')].sort((a, b) => b.sales14d - a.sales14d)[0];
    const g = new Map<string, HaloRow[]>(); rs.forEach((r) => { const key = r.advertisedAsin ?? '—'; g.set(key, [...(g.get(key) ?? []), r]); });
    const groups = [...g.entries()].map(([adv, prs]) => ({ adv: adv === '—' ? null : adv, rows: [...prs].sort((a, b) => b.sales14d - a.sales14d), sales: prs.reduce((s, r) => s + r.sales14d, 0) })).sort((a, b) => b.sales - a.sales);
    return { campaign, adType: rs[0].adType, sales, halo, haloPct: sales ? (halo / sales) * 100 : 0, units: rs.reduce((s, r) => s + r.units14d, 0), topHalo, groups };
  }).sort((a, b) => b.sales - a.sales); }, [rows]);

  const parents = useMemo(() => { const m = new Map<string, number[]>(); windowRows.forEach((r) => { const p = PARENT_OF[r.childAsin] ?? '—'; const b = windowBuckets(r); const a = m.get(p) ?? [0, 0, 0, 0]; m.set(p, [a[0] + b.d1, a[1] + b.d2_7, a[2] + b.d8_14, a[3] + b.d15_30]); }); return [...m.entries()].map(([id, b]) => { const t = b.reduce((s, v) => s + v, 0) || 1; return { id, name: PARENT_NAME[id] ?? id, children: windowRows.filter((r) => PARENT_OF[r.childAsin] === id).length, total: t, counts: b, pct: b.map((v) => (v / t) * 100) }; }).sort((a, b) => (b.pct[2] + b.pct[3]) - (a.pct[2] + a.pct[3])); }, []);

  // analyst: advertised → purchased (SP only)
  const advParents = useMemo(() => { const m = new Map<string, HaloRow[]>(); rows.filter((r) => r.advertisedAsin).forEach((r) => m.set(r.advertisedAsin!, [...(m.get(r.advertisedAsin!) ?? []), r])); return [...m.entries()].map(([asin, rs]) => { const sales = rs.reduce((s, r) => s + r.sales14d, 0); return { asin, title: ASIN_TITLE[asin], units: rs.reduce((s, r) => s + r.units14d, 0), sales, share: null as number | null, haloPct: sales ? (rs.filter((r) => r.attribution === 'halo').reduce((s, r) => s + r.sales14d, 0) / sales) * 100 : 0, attribution: null as string | null, purchased: new Set(rs.map((r) => r.purchasedAsin)).size }; }).sort((a, b) => b.sales - a.sales); }, [rows]);
  const advChildren = useMemo(() => Object.fromEntries(advParents.map((p) => { const by = new Map<string, { units: number; sales: number; attribution: string }>(); rows.filter((r) => r.advertisedAsin === p.asin).forEach((r) => { const b = by.get(r.purchasedAsin) ?? { units: 0, sales: 0, attribution: r.attribution }; b.units += r.units14d; b.sales += r.sales14d; by.set(r.purchasedAsin, b); }); return [p.asin, [...by.entries()].map(([asin, b]) => ({ asin, title: ASIN_TITLE[asin], units: b.units, sales: b.sales, share: p.sales ? (b.sales / p.sales) * 100 : 0, haloPct: null, attribution: b.attribution, purchased: null })).sort((a, b) => b.sales - a.sales)]; })), [advParents, rows]);
  const cf = currencyFormatter(currency);
  const blankIfNull = (f: (p: any) => React.ReactNode) => (p: any) => (p.value == null ? '' : f(p));
  const advCols: ColumnDef[] = [
    { field: 'asin', headerName: 'Advertised ASIN → purchased', pinned: 'left', width: 260, valueFormatter: ({ value, row }: any) => <span className="inline-flex items-center gap-2 min-w-0"><ProductThumb asin={String(value).trim()} title={row.title} size={24} /><span className="min-w-0"><span className="block truncate font-semibold text-gray-800">{String(value).trim()}</span><span className="block text-[10px] text-gray-400 truncate">{row.title}</span></span></span> },
    { field: 'attribution', headerName: 'Attribution', width: 110, group: 'Pair', heat: 'none', valueFormatter: blankIfNull(({ value }) => <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${CHIP[value as 'promoted' | 'halo']}`}>{value === 'promoted' ? 'Promoted' : 'Halo'}</span>) },
    { field: 'share', headerName: 'Share of advertised', width: 140, group: 'Pair', heat: 'none', valueFormatter: blankIfNull(pctShareFormatter), tooltip: 'This purchased ASIN’s share of the advertised ASIN’s attributed sales.' },
    { field: 'units', headerName: 'PPC units', width: 100, group: '14-day attribution', valueFormatter: numberFormatter },
    { field: 'sales', headerName: 'PPC sales', width: 116, group: '14-day attribution', valueFormatter: cf },
    { field: 'haloPct', headerName: 'Halo %', width: 92, group: 'Advertised ASIN', heat: 'none', valueFormatter: blankIfNull(pctShareFormatter), tooltip: 'Share of this ASIN’s attributed sales that landed on a different ASIN (salesOtherSku ÷ sales).' },
    { field: 'purchased', headerName: 'ASINs bought', width: 108, group: 'Advertised ASIN', heat: 'none', valueFormatter: blankIfNull(({ value }) => String(value)) },
  ];

  const chips = <div className="inline-flex items-center gap-1">{(['SP', 'SB', 'SD'] as AdType[]).map((t) => <button key={t} onClick={() => toggleType(t)} title={AD_TYPE_LABEL[t]} className={`px-2 py-1 text-[10px] font-bold rounded-md ring-1 transition-colors ${adTypes.has(t) ? 'bg-cx-500 text-white ring-cx-500' : 'bg-white text-gray-500 ring-gray-200 hover:text-gray-700'}`}>{t}</button>)}</div>;

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div><h1 className="text-lg font-bold text-gray-900">Attribution &amp; Halo</h1><p className="text-[12px] text-gray-500 mt-0.5">{view === 'decision' ? 'Which ASIN do your ads actually sell — and how long after the click?' : 'Every advertised → purchased pair and per-ASIN conversion timing.'}</p></div>
        <div className="flex items-center gap-3">{chips}<LastRefreshed offsetMinutes={14} /><ViewModeToggle mode={view} onChange={setView} /></div>
      </div>

      {view === 'decision' ? (<>
        {/* ── The two reads ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Where ad sales land</p>
            <div className="flex items-baseline gap-2 mt-1"><span className="text-3xl font-extrabold tracking-tight" style={{ color: C.halo }}>{k.haloPct.toFixed(0)}%</span><span className="text-[13px] text-gray-700">of ad-attributed sales were a <span className="font-semibold">different ASIN</span> than the one advertised</span></div>
            <div className="mt-3"><SplitBar a={k.promoted} b={k.halo} h={10} /></div>
            <div className="flex justify-between mt-1.5 text-[11px]"><span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.promoted }} />Promoted · <b className="text-gray-800">{fc(k.promoted, currency)}</b></span><span className="inline-flex items-center gap-1.5"><b className="text-gray-800">{fc(k.halo, currency)}</b> · Halo<span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.halo }} /></span></div>
            {k.top && <p className="text-[11px] text-gray-600 mt-3 leading-snug">Biggest halo: ads for <span className="font-semibold text-gray-800">{ASIN_TITLE[k.top.advertisedAsin!]}</span> sold <span className="font-semibold text-gray-800">{fc(k.top.sales14d, currency)}</span> of <span className="font-semibold text-gray-800">{ASIN_TITLE[k.top.purchasedAsin]}</span>. Amazon’s ACOS already counts this — judge the campaign on total attributed sales, not the advertised ASIN alone.</p>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">When they land</p>
            <div className="flex items-baseline gap-2 mt-1"><span className="text-3xl font-extrabold tracking-tight text-gray-900">{k.pct[0].toFixed(0)}%</span><span className="text-[13px] text-gray-700">of conversions happen <span className="font-semibold">within a day</span> of the click</span></div>
            <div className="mt-3"><WindowBar pct={k.pct} counts={k.counts} title="All Sponsored Products conversions" /></div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-gray-600">{WINDOW_LABELS.map((l, i) => <span key={l} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.win[i] }} />{l} <b className="text-gray-800">{k.pct[i].toFixed(1)}%</b></span>)}</div>
            <p className="text-[11px] text-gray-600 mt-3 leading-snug"><span className="font-semibold text-gray-800">{k.after7.toFixed(1)}%</span> arrive after day 7 — an ACOS read within a week of the spend is about that much too good. Judge on the 14-day figure; treat the last 7 days as provisional.</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 flex items-start gap-1.5"><InfoTooltip content="Sponsored Products reports the advertised ASIN and 1 / 7 / 14 / 30-day windows, so pairs and timing are complete for SP. Sponsored Brands and Display report only a 14-day window and do not expose the advertised ASIN — for them we show Promoted vs Brand-halo per purchased ASIN. Amazon attributes nothing after day 30." wide /><span>All figures use Amazon’s 14-day attribution window. Advertised → purchased pairs and timing are available for Sponsored Products; Brands and Display report Promoted vs Brand-halo only.</span></p>

        {/* ── Campaigns: one row each, expand for pairs ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-w-0">
          <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Halo by campaign</h3><p className="text-[11px] text-gray-500">How much of each campaign’s attributed sales landed on other ASINs. Click a campaign to see which.</p></div>
          <table className="w-full text-[12px]">
            <thead><tr className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100"><th className="text-left px-4 py-2">Campaign</th><th className="text-right px-3 py-2">PPC sales</th><th className="text-left px-3 py-2 w-[260px]">Promoted vs halo</th><th className="text-right px-3 py-2">Halo</th><th className="text-left px-4 py-2">Biggest halo destination</th></tr></thead>
            <tbody>
              {campaigns.map((c) => { const isOpen = open.has(c.campaign); return (
                <Fragment key={c.campaign}>
                  <tr onClick={() => toggleOpen(c.campaign)} className={`border-b border-gray-50 cursor-pointer transition-colors ${isOpen ? 'bg-cx-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-2.5"><span className="inline-flex items-center gap-2">{isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}<span className="inline-flex px-1.5 py-0.5 rounded bg-gray-100 text-[9px] font-bold text-gray-600">{c.adType}</span><span className="font-semibold text-gray-800">{c.campaign}</span></span></td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{fc(c.sales, currency)}</td>
                    <td className="px-3 py-2.5"><SplitBar a={c.sales - c.halo} b={c.halo} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold" style={{ color: c.haloPct >= 25 ? C.halo : '#374151' }}>{c.haloPct.toFixed(0)}%</td>
                    <td className="px-4 py-2.5">{c.topHalo ? <span className="inline-flex items-center gap-2 min-w-0"><ProductThumb asin={c.topHalo.purchasedAsin} title={ASIN_TITLE[c.topHalo.purchasedAsin]} size={22} /><span className="truncate text-gray-700">{ASIN_TITLE[c.topHalo.purchasedAsin]}</span><span className="text-gray-400 tabular-nums">{fc(c.topHalo.sales14d, currency)}</span></span> : <span className="text-gray-300">—</span>}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-gray-100 bg-gray-50/40"><td colSpan={5} className="px-4 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {c.groups.map((g) => (
                          <div key={g.adv ?? 'na'} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
                              {g.adv ? <span className="inline-flex items-center gap-2 min-w-0"><ProductThumb asin={g.adv} title={ASIN_TITLE[g.adv]} size={24} /><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Advertised</span><span className="block font-semibold text-gray-800 truncate">{ASIN_TITLE[g.adv]} <span className="text-gray-400 font-mono font-normal text-[10px]">{g.adv}</span></span></span></span>
                                     : <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Purchased after clicking this {AD_TYPE_LABEL[c.adType]} campaign</span><span className="block text-[10px] text-gray-400">Amazon doesn’t report the advertised ASIN for this ad type</span></span>}
                              <span className="text-[11px] font-semibold text-gray-700 tabular-nums flex-shrink-0">{fc(g.sales, currency)}</span>
                            </div>
                            <div className="divide-y divide-gray-50">{g.rows.map((r) => (
                              <div key={r.purchasedAsin} className="px-3 py-1.5 flex items-center gap-2 text-[11px]">
                                <ProductThumb asin={r.purchasedAsin} title={ASIN_TITLE[r.purchasedAsin]} size={20} /><span className="flex-1 truncate text-gray-700">{ASIN_TITLE[r.purchasedAsin]}</span>
                                <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold ring-1 ${CHIP[r.attribution]}`}>{attrLabel(r)}</span>
                                <span className="w-12 text-right tabular-nums text-gray-500">{r.units14d}</span><span className="w-16 text-right tabular-nums font-semibold text-gray-800">{fc(r.sales14d, currency)}</span><span className="w-10 text-right tabular-nums text-gray-400">{g.sales ? ((r.sales14d / g.sales) * 100).toFixed(0) : 0}%</span>
                              </div>))}</div>
                          </div>))}
                      </div>
                    </td></tr>)}
                </Fragment>); })}
            </tbody>
          </table>
        </div>

        {/* ── Timing by parent ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap"><div><h3 className="text-sm font-semibold text-gray-900">Conversion timing by product family</h3><p className="text-[11px] text-gray-500">Sponsored Products · share of conversions by days from click to purchase · slowest families first.</p></div><div className="flex items-center gap-3 text-[10px] text-gray-500">{WINDOW_LABELS.map((l, i) => <span key={l} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.win[i] }} />{l}</span>)}</div></div>
          <div className="divide-y divide-gray-50">{parents.map((p) => (
            <div key={p.id} className="px-4 py-2.5 grid grid-cols-[200px_1fr_120px] items-center gap-3">
              <div className="min-w-0"><div className="font-semibold text-gray-800 truncate">{p.name}</div><div className="text-[10px] text-gray-400">{p.children} ASIN{p.children > 1 ? 's' : ''} · {p.total.toLocaleString('en-US')} conversions</div></div>
              <WindowBar pct={p.pct} counts={p.counts} h={18} title={p.name} />
              <div className="text-right tabular-nums text-[11px]"><span className="text-gray-400">after day 7 </span><span className="font-bold" style={{ color: p.pct[2] + p.pct[3] >= 10 ? C.halo : '#374151' }}>{(p.pct[2] + p.pct[3]).toFixed(1)}%</span></div>
            </div>))}</div>
        </div>
      </>) : (<>
        <DeepDiveTable title="Advertised → purchased" subtitle="Sponsored Products — expand an advertised ASIN to see every ASIN bought after its ad was clicked." tooltip="Parent rows = advertised ASIN; child rows = purchased ASINs with attribution and share. 14-day window." rowData={advParents} columnDefs={advCols} childRowsMap={advChildren} rowKeyField="asin" childLabelField="asin" groupNoun="Advertised ASIN" childNoun="Purchased ASIN" copyablePinnedCell />
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Conversion timing by ASIN</h3><p className="text-[11px] text-gray-500">Sponsored Products conversions per window, from Amazon’s cumulative 1 / 7 / 14 / 30-day columns.</p></div>
          <table className="w-full text-[12px]"><thead><tr className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100"><th className="text-left px-4 py-2">ASIN</th><th className="text-left px-3 py-2">Family</th>{WINDOW_LABELS.map((w) => <th key={w} className="text-right px-3 py-2">{w}</th>)}<th className="text-right px-3 py-2">Total</th><th className="text-left px-4 py-2 w-[220px]">Timing</th></tr></thead>
            <tbody>{[...windowRows].sort((a, b) => b.purchases30d - a.purchases30d).map((r) => { const b = windowBuckets(r); const vals = [b.d1, b.d2_7, b.d8_14, b.d15_30]; const t = r.purchases30d || 1; return (
              <tr key={r.childAsin} className="border-b border-gray-50 hover:bg-gray-50/60"><td className="px-4 py-2"><span className="inline-flex items-center gap-2 min-w-0"><ProductThumb asin={r.childAsin} title={ASIN_TITLE[r.childAsin]} size={24} /><span className="min-w-0"><span className="block font-semibold text-gray-800 font-mono text-[11px]">{r.childAsin}</span><span className="block text-[10px] text-gray-400 truncate">{ASIN_TITLE[r.childAsin]}</span></span></span></td><td className="px-3 py-2 text-gray-600">{PARENT_NAME[PARENT_OF[r.childAsin]] ?? '—'}</td>{vals.map((v, i) => <td key={i} className="px-3 py-2 text-right tabular-nums">{v}</td>)}<td className="px-3 py-2 text-right tabular-nums font-semibold">{r.purchases30d}</td><td className="px-4 py-2"><WindowBar pct={vals.map((v) => (v / t) * 100)} counts={vals} h={10} labels={false} title={`${r.childAsin} · ${ASIN_TITLE[r.childAsin]}`} /></td></tr>); })}</tbody></table>
        </div>
      </>)}
    </div>
  );
}
