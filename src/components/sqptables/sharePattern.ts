// ─── Share-pattern diagnostics (Search share → Analyst) ──────────────────────
// SQP share metrics span BOTH paid and organic placements, so the way your share
// moves between stages tells you which lever is at fault:
//
//   click share ≈ impression share → clicks track visibility 1:1. On a query you
//     don't rank for organically that parity is bought — ads are carrying it.
//     (Contrast the existing ORGANIC_HEAVY flag: click share ≥ 2× impression share
//     is earned relevance, punching above your visibility.)
//   impression share > click share → shoppers see you and skip you: main image,
//     title, price-on-SERP, review count. Spending more only widens the gap.
//   click share > purchase share → they click but buy elsewhere: PDP, price,
//     shipping speed, Buy Box. Again not a bid problem.
//
// The test is RELATIVE: a stage keeps pace if its share is within ±10% of the upstream
// share (ratio 0.9–1.1). An absolute pp floor was tried first and rejected — it reads
// a 9.4% → 8.5% drop as "parity" while calling the same 10% decline on a 30% share a
// problem, i.e. it hides exactly the small-share keywords worth fixing. Noise control
// comes from share and count floors instead: the same ones the leak model uses.
import { MIN_IMP_FOR_CTR_GAP, MIN_CLICKS_FOR_ATC } from '../../lib/sqp/constants';

export type SharePattern = 'ad_supported' | 'ctr_gap' | 'cvr_gap';

export const PARITY_BAND = 0.10;   // within ±10% of the upstream share = "tracking it"
export const MIN_IMP_SHARE_PP = 1; // below this your share is too small to read anything into

export const PATTERN_META: Record<SharePattern, { label: string; short: string; hint: string }> = {
  ad_supported: {
    label: 'Ad-supported',
    short: 'impr ≈ click',
    hint: 'Click share is within ±10% of impression share. Your clicks rise and fall with your visibility rather than beating it — on queries you don’t own organically, that visibility is being bought. Check what these keywords cost before scaling them.',
  },
  ctr_gap: {
    label: 'CTR problem',
    short: 'impr > click',
    hint: 'Click share is more than 10% below impression share: shoppers see you and click someone else. Main image, title, price shown on the results page, review count. Bidding harder widens the gap instead of closing it.',
  },
  cvr_gap: {
    label: 'CVR problem',
    short: 'click > purchase',
    hint: 'Purchase share is more than 10% below click share: they click you and buy elsewhere. Product page, price, shipping speed, Buy Box. A listing problem, not a bid problem.',
  },
};

export interface ShareMetrics {
  impShare: number | null; clickShare: number | null; purchShare: number | null;
  /** Weekly counts — the floors below are per week, so pass per-week values. */
  impBrandWk?: number | null; clicksBrandWk?: number | null;
}

/** Every pattern a row exhibits — they are not mutually exclusive (a keyword can be
 *  ad-carried at the top of the funnel AND lose the purchase at the bottom). */
export function classifyShares(m: ShareMetrics): SharePattern[] {
  const imp = m.impShare, click = m.clickShare, purch = m.purchShare;
  const out: SharePattern[] = [];
  if (imp == null || click == null || imp <= 0) return out;
  if (imp < MIN_IMP_SHARE_PP) return out;

  const clickRatio = click / imp;
  if (Math.abs(clickRatio - 1) <= PARITY_BAND) out.push('ad_supported');
  else if (clickRatio < 1 - PARITY_BAND && (m.impBrandWk ?? Infinity) >= MIN_IMP_FOR_CTR_GAP) out.push('ctr_gap');

  if (purch != null && click > 0 && purch / click < 1 - PARITY_BAND && (m.clicksBrandWk ?? Infinity) >= MIN_CLICKS_FOR_ATC) {
    out.push('cvr_gap');
  }
  return out;
}
