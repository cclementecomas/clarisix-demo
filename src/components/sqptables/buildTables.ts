// ─── SQP deep-dive pivot builder ─────────────────────────────────────────────
// A real pivot: pick the ROW grain (primary dimension), then optionally add ONE
// nested breakdown (secondary). Any dimension can be the row — keyword, parent ASIN,
// child ASIN or week — so "Rows by Parent ASIN" shows parent rows, NOT keywords with
// a parent buried underneath. The collapsed primary row carries the group aggregates
// (it doubles as that group's Total); expanding shows the secondary breakdown.
// One nesting level maps cleanly onto DeepDiveTable's parent/child model. Every
// number reuses the SQP lib (aggregate + stageMetrics) so it matches Traffic & Keyword.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SqpRow } from '../../lib/sqp/types';
import { aggregate, stageMetrics } from '../../lib/sqp/metrics';
import { ASIN_TITLE } from '../searchfunnel/selectors';
import { parentOf } from './parentMap';

export type Dim = 'keyword' | 'parent' | 'child' | 'week';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtWeek = (iso: string): string => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]}, ${y}`; };

interface DimMeta { label: string; keyOf: (r: SqpRow) => string; labelOf: (key: string) => string; }
const DIMS: Record<Dim, DimMeta> = {
  keyword: { label: 'Keyword', keyOf: (r) => r.query, labelOf: (k) => k },
  parent: { label: 'Parent ASIN', keyOf: (r) => parentOf(r.asin), labelOf: (k) => k },
  child: { label: 'Child ASIN', keyOf: (r) => r.asin, labelOf: (k) => (ASIN_TITLE[k] ? `${k} · ${ASIN_TITLE[k]}` : k) },
  week: { label: 'Week', keyOf: (r) => r.week_ending, labelOf: (k) => fmtWeek(k) },
};
export const DIM_LABEL: Record<Dim, string> = { keyword: 'Keyword', parent: 'Parent ASIN', child: 'Child ASIN', week: 'Week' };
export const DIM_ORDER: Dim[] = ['keyword', 'parent', 'child', 'week'];

export interface SqpTable {
  rowData: any[];
  footer: any[];
  primaryLabel: string;
  childRowsMap?: Record<string, any[]>;
  childNoun?: string;
}

/** Clicks-weighted average click price for your brand and the market. */
function weightedClickPrice(rows: SqpRow[]): { your: number | null; mkt: number | null } {
  let wY = 0, sY = 0, wM = 0, sM = 0;
  for (const r of rows) {
    if (r.clicks_asin > 0 && r.price_click_asin != null) { wY += r.clicks_asin; sY += r.clicks_asin * r.price_click_asin; }
    if (r.clicks_total > 0 && r.price_click_mkt != null) { wM += r.clicks_total; sM += r.clicks_total * r.price_click_mkt; }
  }
  return { your: wY > 0 ? +(sY / wY).toFixed(2) : null, mkt: wM > 0 ? +(sM / wM).toFixed(2) : null };
}

/** Every metric column for one node (a keyword, a parent ASIN, a week…). */
function metricsOf(rows: SqpRow[]): Record<string, number | null> {
  const a = aggregate(rows);
  const m = stageMetrics(a);
  const wp = weightedClickPrice(rows);
  return {
    searchVolume: a.market.vol,
    purchMarket: a.market.Pm,
    purchBrand: a.asin.P,
    clicksBrand: a.asin.C,
    clicksMarket: a.market.Cm,
    impShare: m.impShare * 100,
    clickShare: m.clickShare * 100,
    atcShare: m.basketShare * 100,
    purchShare: m.purchShare * 100,
    avgPriceMarket: wp.mkt,
    avgPriceBrand: wp.your,
    ppcSpend: null, // Ads-gated (flags.ads = false)
    acos: null,     // Ads-gated
  };
}

interface Group { key: string; label: string; rows: SqpRow[] }
function groupRows(rows: SqpRow[], dim: DimMeta): Group[] {
  const map = new Map<string, SqpRow[]>();
  for (const r of rows) {
    const k = dim.keyOf(r);
    let arr = map.get(k);
    if (!arr) { arr = []; map.set(k, arr); }
    arr.push(r);
  }
  return [...map.entries()].map(([key, rs]) => ({ key, label: dim.labelOf(key), rows: rs }));
}

const byClicksDesc = (a: any, b: any) => b.clicksBrand - a.clicksBrand;
const byKeyDesc = (a: any, b: any) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0); // weeks: newest first

export function buildPivot(rows: SqpRow[], primary: Dim, secondary: Dim | 'none'): SqpTable {
  const groups = groupRows(rows, DIMS[primary]);
  const rowData = groups.map((g) => ({ key: g.key, rowLabel: g.label, ...metricsOf(g.rows) }));
  rowData.sort(primary === 'week' ? byKeyDesc : byClicksDesc);
  const footer = [{ rowLabel: 'Total', ...metricsOf(rows) }];
  const primaryLabel = DIMS[primary].label;

  if (secondary === 'none' || secondary === primary) return { rowData, footer, primaryLabel };

  const sdim = DIMS[secondary];
  const childRowsMap: Record<string, any[]> = {};
  for (const g of groups) {
    const kids = groupRows(g.rows, sdim).map((s) => ({ key: s.key, childLabel: s.label, ...metricsOf(s.rows) }));
    kids.sort(secondary === 'week' ? byKeyDesc : byClicksDesc);
    childRowsMap[g.label] = kids;
  }
  return { rowData, footer, primaryLabel, childRowsMap, childNoun: sdim.label };
}
