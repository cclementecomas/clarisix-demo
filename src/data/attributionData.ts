// ─── Advertising → Attribution & Halo — synthetic demo data ─────────────────
// Every variable below maps to a REAL Amazon Ads API (reporting v3) column. Source map
// (also in knowledge/knowledge_base.md):
//   Sponsored Products  reportTypeId spPurchasedProduct
//     dimensions: campaignId/campaignName, adGroupId/adGroupName, advertisedAsin, advertisedSku,
//                 purchasedAsin, keyword, keywordType, matchType, date
//     metrics (attribution windows 1d / 7d / 14d / 30d):
//       purchases{1d,7d,14d,30d}          → conversions (orders) attributed to ad clicks
//       sales{1d,7d,14d,30d}              → attributed sales
//       unitsSoldClicks{1d,7d,14d,30d}    → attributed units
//       purchasesSameSku*/salesSameSku*/unitsSoldSameSku*   → PROMOTED (same SKU as advertised)
//       purchasesOtherSku*/salesOtherSku*/unitsSoldOtherSku* → HALO (a different SKU was bought)
//   Sponsored Brands    reportTypeId sbPurchasedProduct
//     purchasedAsin, productName, attributionType (PROMOTED | BRAND_HALO), sales14d, orders14d,
//     units (14-day window ONLY; the advertised ASIN is NOT exposed — inferred from attributionType)
//   Sponsored Display   reportTypeId sdPurchasedProduct
//     purchasedAsin, asinBrandHalo, sales/purchases/units (14-day window ONLY)
// Consequences we surface honestly in the UI:
//   • the halo matrix uses the 14-day window for all three ad types (the only window all share);
//   • the attribution-window split (1d / 2–7d / 8–14d / 15–30d) is SPONSORED PRODUCTS ONLY, derived
//     from the cumulative windows: 1d, 7d−1d, 14d−7d, 30d−14d. Amazon attributes nothing past 30d.

export type AdType = 'SP' | 'SB' | 'SD';
export const AD_TYPE_LABEL: Record<AdType, string> = { SP: 'Sponsored Products', SB: 'Sponsored Brands', SD: 'Sponsored Display' };

export const ASIN_TITLE: Record<string, string> = {
  B0DEMO001X: 'Everyday Essentials Pack 120ct', B0DEMO006X: 'Everyday Essentials Pack 60ct',
  B0DEMO003X: 'Smart Device Pro 20X', B0DEMO004X: 'Smart Device Lite', B0DEMO005X: 'Smart Device Lite 40X',
  B0DEMO008X: 'Fast Charger 30W', B0DEMO009X: 'Clear Shield 2-Pack', B0DEMO010X: 'Compact Travel Pouch',
  B0DEMO007X: 'Daily Wellness Capsules 180ct', B0DEMO002X: 'Premium Container Set',
};
export const PARENT_OF: Record<string, string> = {
  B0DEMO001X: 'P-ESS-01', B0DEMO006X: 'P-ESS-01',
  B0DEMO003X: 'P-DEV-01', B0DEMO004X: 'P-DEV-01', B0DEMO005X: 'P-DEV-01',
  B0DEMO008X: 'P-ACC-01', B0DEMO009X: 'P-ACC-01', B0DEMO010X: 'P-ACC-01',
  B0DEMO007X: 'P-WELL-01', B0DEMO002X: 'P-HOME-01',
};

/** One advertised→purchased pair inside a campaign, 14-day window. */
export interface HaloRow {
  adType: AdType;
  campaign: string;
  /** SP: spPurchasedProduct.advertisedAsin. SB/SD: not exposed by Amazon → null. */
  advertisedAsin: string | null;
  /** spPurchasedProduct.purchasedAsin / sbPurchasedProduct.purchasedAsin / sdPurchasedProduct.purchasedAsin */
  purchasedAsin: string;
  /** SP: purchasedAsin === advertisedAsin ⇒ promoted (purchasesSameSku*) else halo (purchasesOtherSku*).
   *  SB: attributionType PROMOTED | BRAND_HALO.  SD: asinBrandHalo. */
  attribution: 'promoted' | 'halo';
  /** unitsSoldClicks14d (SP) · units 14d (SB/SD) */
  units14d: number;
  /** sales14d */
  sales14d: number;
}

export const haloRows: HaloRow[] = [
  // SP — Everyday Essentials exact-match campaign
  { adType: 'SP', campaign: 'SP | Essentials | Exact | KW', advertisedAsin: 'B0DEMO001X', purchasedAsin: 'B0DEMO001X', attribution: 'promoted', units14d: 412, sales14d: 12_038 },
  { adType: 'SP', campaign: 'SP | Essentials | Exact | KW', advertisedAsin: 'B0DEMO001X', purchasedAsin: 'B0DEMO006X', attribution: 'halo', units14d: 63, sales14d: 1_159 },
  { adType: 'SP', campaign: 'SP | Essentials | Exact | KW', advertisedAsin: 'B0DEMO001X', purchasedAsin: 'B0DEMO007X', attribution: 'halo', units14d: 21, sales14d: 665 },
  { adType: 'SP', campaign: 'SP | Essentials | Exact | KW', advertisedAsin: 'B0DEMO006X', purchasedAsin: 'B0DEMO006X', attribution: 'promoted', units14d: 148, sales14d: 2_723 },
  { adType: 'SP', campaign: 'SP | Essentials | Exact | KW', advertisedAsin: 'B0DEMO006X', purchasedAsin: 'B0DEMO001X', attribution: 'halo', units14d: 39, sales14d: 1_140 },
  // SP — Smart Device auto campaign (strong upsell halo to the Pro)
  { adType: 'SP', campaign: 'SP | Smart Device | Auto', advertisedAsin: 'B0DEMO004X', purchasedAsin: 'B0DEMO004X', attribution: 'promoted', units14d: 187, sales14d: 5_610 },
  { adType: 'SP', campaign: 'SP | Smart Device | Auto', advertisedAsin: 'B0DEMO004X', purchasedAsin: 'B0DEMO003X', attribution: 'halo', units14d: 58, sales14d: 4_171 },
  { adType: 'SP', campaign: 'SP | Smart Device | Auto', advertisedAsin: 'B0DEMO004X', purchasedAsin: 'B0DEMO005X', attribution: 'halo', units14d: 24, sales14d: 2_998 },
  { adType: 'SP', campaign: 'SP | Smart Device | Auto', advertisedAsin: 'B0DEMO005X', purchasedAsin: 'B0DEMO005X', attribution: 'promoted', units14d: 96, sales14d: 11_990 },
  { adType: 'SP', campaign: 'SP | Smart Device | Auto', advertisedAsin: 'B0DEMO005X', purchasedAsin: 'B0DEMO008X', attribution: 'halo', units14d: 31, sales14d: 588 },
  // SP — Accessories product-targeting (cross-sell heavy)
  { adType: 'SP', campaign: 'SP | Accessories | PT | Competitors', advertisedAsin: 'B0DEMO008X', purchasedAsin: 'B0DEMO008X', attribution: 'promoted', units14d: 221, sales14d: 4_199 },
  { adType: 'SP', campaign: 'SP | Accessories | PT | Competitors', advertisedAsin: 'B0DEMO008X', purchasedAsin: 'B0DEMO009X', attribution: 'halo', units14d: 74, sales14d: 1_036 },
  { adType: 'SP', campaign: 'SP | Accessories | PT | Competitors', advertisedAsin: 'B0DEMO009X', purchasedAsin: 'B0DEMO009X', attribution: 'promoted', units14d: 160, sales14d: 2_240 },
  { adType: 'SP', campaign: 'SP | Accessories | PT | Competitors', advertisedAsin: 'B0DEMO009X', purchasedAsin: 'B0DEMO010X', attribution: 'halo', units14d: 44, sales14d: 704 },
  // SB — brand campaign (advertised ASIN not exposed by Amazon; attributionType only)
  { adType: 'SB', campaign: 'SB | Brand | Video | Essentials', advertisedAsin: null, purchasedAsin: 'B0DEMO001X', attribution: 'promoted', units14d: 133, sales14d: 3_886 },
  { adType: 'SB', campaign: 'SB | Brand | Video | Essentials', advertisedAsin: null, purchasedAsin: 'B0DEMO006X', attribution: 'promoted', units14d: 52, sales14d: 957 },
  { adType: 'SB', campaign: 'SB | Brand | Video | Essentials', advertisedAsin: null, purchasedAsin: 'B0DEMO007X', attribution: 'halo', units14d: 61, sales14d: 1_931 },
  { adType: 'SB', campaign: 'SB | Brand | Video | Essentials', advertisedAsin: null, purchasedAsin: 'B0DEMO002X', attribution: 'halo', units14d: 27, sales14d: 809 },
  // SD — retargeting (asinBrandHalo)
  { adType: 'SD', campaign: 'SD | Retarget | Views | Devices', advertisedAsin: null, purchasedAsin: 'B0DEMO003X', attribution: 'promoted', units14d: 41, sales14d: 2_948 },
  { adType: 'SD', campaign: 'SD | Retarget | Views | Devices', advertisedAsin: null, purchasedAsin: 'B0DEMO008X', attribution: 'halo', units14d: 38, sales14d: 722 },
  { adType: 'SD', campaign: 'SD | Retarget | Views | Devices', advertisedAsin: null, purchasedAsin: 'B0DEMO009X', attribution: 'halo', units14d: 19, sales14d: 266 },
];

/** SP attribution-window split per child ASIN — cumulative purchases{1d,7d,14d,30d} from spPurchasedProduct. */
export interface WindowRow { childAsin: string; purchases1d: number; purchases7d: number; purchases14d: number; purchases30d: number }
export const windowRows: WindowRow[] = [
  { childAsin: 'B0DEMO001X', purchases1d: 402, purchases7d: 447, purchases14d: 460, purchases30d: 466 },
  { childAsin: 'B0DEMO006X', purchases1d: 168, purchases7d: 189, purchases14d: 196, purchases30d: 199 },
  { childAsin: 'B0DEMO003X', purchases1d: 39,  purchases7d: 52,  purchases14d: 58,  purchases30d: 61 },
  { childAsin: 'B0DEMO004X', purchases1d: 151, purchases7d: 177, purchases14d: 187, purchases30d: 191 },
  { childAsin: 'B0DEMO005X', purchases1d: 71,  purchases7d: 104, purchases14d: 120, purchases30d: 128 },
  { childAsin: 'B0DEMO008X', purchases1d: 236, purchases7d: 264, purchases14d: 271, purchases30d: 273 },
  { childAsin: 'B0DEMO009X', purchases1d: 182, purchases7d: 199, purchases14d: 204, purchases30d: 206 },
  { childAsin: 'B0DEMO010X', purchases1d: 36,  purchases7d: 41,  purchases14d: 44,  purchases30d: 45 },
  { childAsin: 'B0DEMO007X', purchases1d: 14,  purchases7d: 19,  purchases14d: 21,  purchases30d: 23 },
];
/** Cumulative windows → exclusive buckets. */
export const windowBuckets = (r: WindowRow) => ({
  d1: r.purchases1d, d2_7: r.purchases7d - r.purchases1d, d8_14: r.purchases14d - r.purchases7d, d15_30: r.purchases30d - r.purchases14d,
});
export const WINDOW_LABELS = ['1 day', '2–7 days', '8–14 days', '15–30 days'] as const;

/** Parent display names — from the catalog (SP-API Listings), not the Ads reports. */
export const PARENT_NAME: Record<string, string> = {
  'P-ESS-01': 'Everyday Essentials', 'P-DEV-01': 'Smart Device', 'P-ACC-01': 'Accessories', 'P-WELL-01': 'Daily Wellness', 'P-HOME-01': 'Premium Containers',
};
