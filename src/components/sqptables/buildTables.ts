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
import { classifyShares, type SharePattern } from './sharePattern';

export type Dim = 'keyword' | 'child' | 'week';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtWeek = (iso: string): string => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]}, ${y}`; };

interface DimMeta { label: string; keyOf: (r: SqpRow) => string; labelOf: (key: string) => string; }
const DIMS: Record<Dim, DimMeta> = {
  keyword: { label: 'Keyword', keyOf: (r) => r.query, labelOf: (k) => k },
  child: { label: 'ASIN', keyOf: (r) => r.asin, labelOf: (k) => (ASIN_TITLE[k] ? `${k} · ${ASIN_TITLE[k]}` : k) },
  week: { label: 'Week', keyOf: (r) => r.week_ending, labelOf: (k) => fmtWeek(k) },
};
export const DIM_LABEL: Record<Dim, string> = { keyword: 'Keyword', child: 'ASIN', week: 'Week' };
export const DIM_ORDER: Dim[] = ['keyword', 'child', 'week'];

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

const pct = (v: number | null): number | null => (v == null ? null : +(v * 100).toFixed(2));
const gap = (mine: number | null, mkt: number | null): number | null =>
  mine == null || mkt == null ? null : +((mine - mkt) * 100).toFixed(2);

/** Every metric column for one node (a keyword, a parent ASIN, a week…). */
function metricsOf(rows: SqpRow[]): Record<string, number | null> {
  const a = aggregate(rows);
  const m = stageMetrics(a);
  const wp = weightedClickPrice(rows);
  return {
    searchVolume: a.market.vol,
    // Per-week counts: the SQP low-data floors (200 impr/wk, 20 clicks/wk) are weekly,
    // so a multi-week range must be divided back down before they are applied.
    impBrandWk: a.asin.I / a.nWeeks,
    clicksBrandWk: a.asin.C / a.nWeeks,
    purchMarket: a.market.Pm,
    purchBrand: a.asin.P,
    clicksBrand: a.asin.C,
    clicksMarket: a.market.Cm,
    impShare: m.impShare * 100,
    clickShare: m.clickShare * 100,
    atcShare: m.basketShare * 100,
    purchShare: m.purchShare * 100,
    // Funnel conversion rates, yours vs the market, plus the gap in pp (positive = ahead).
    ctr: pct(m.ctr), ctrM: pct(m.ctrM), ctrGap: gap(m.ctr, m.ctrM),
    atc: pct(m.atc), atcM: pct(m.atcM), atcGap: gap(m.atc, m.atcM),
    close: pct(m.close), closeM: pct(m.closeM), closeGap: gap(m.close, m.closeM),
    cvr: pct(m.cvr), cvrM: pct(m.cvrM), cvrGap: gap(m.cvr, m.cvrM),
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

/** One entry per group at `dim` grain, with the share patterns that group exhibits.
 *  Aggregation happens before classification, so switching Rows by → ASIN re-reads the
 *  patterns from each ASIN's own summed counts. */
export function classifyGroups(rows: SqpRow[], dim: Dim): { key: string; patterns: SharePattern[]; rows: SqpRow[] }[] {
  return groupRows(rows, DIMS[dim]).map((g) => {
    const m = metricsOf(g.rows);
    const patterns = classifyShares({
      impShare: m.impShare, clickShare: m.clickShare, purchShare: m.purchShare,
      impBrandWk: m.impBrandWk, clicksBrandWk: m.clicksBrandWk,
    });
    return { key: g.key, patterns, rows: g.rows };
  });
}

/** The subset of `rows` whose group (at `dim` grain) shows `pattern`. */
export function filterByPattern(rows: SqpRow[], dim: Dim, pattern: SharePattern): SqpRow[] {
  const keep = new Set(classifyGroups(rows, dim).filter((g) => g.patterns.includes(pattern)).map((g) => g.key));
  const keyOf = DIMS[dim].keyOf;
  return rows.filter((r) => keep.has(keyOf(r)));
}

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
