export interface MetricFields {
  sales: number;
  salesPoP: number;
  salesDiffLY: number;
  salesShare: number;
  salesSharePoP: number;
  salesShareDiffLY: number;
  units: number;
  unitsPoP: number;
  unitsDiffLY: number;
  adSpend: number;
  adSpendPoP: number;
  adSpendDiffLY: number;
  adSales: number;
  adSalesPoP: number;
  adSalesDiffLY: number;
  roas: number;
  roasPoP: number;
  roasDiffLY: number;
  acos: number;
  acosPoP: number;
  acosDiffLY: number;
  tacos: number;
  tacosPoP: number;
  tacosDiffLY: number;
  bboxWinRate: number;
  bboxWinRatePoP: number;
  bboxWinRateDiffLY: number;
  adReliance: number;
  adReliancePoP: number;
  adRelianceDiffLY: number;
  cvr: number;
  cvrPoP: number;
  cvrDiffLY: number;
  pageViews: number;
  pageViewsPoP: number;
  pageViewsDiffLY: number;
  sessions: number;
  sessionsPoP: number;
  sessionsDiffLY: number;
}

export interface MarketplaceRow extends MetricFields {
  marketplace: string;
}

export interface CategoryRow extends MetricFields {
  category: string;
}

export interface AsinRow extends MetricFields {
  asin: string;
  title: string;
}

export interface SkuRow extends MetricFields {
  sku: string;
  title: string;
}

export const marketplaceData: MarketplaceRow[] = [
  {
    marketplace: 'Germany',
    sales: 115086, salesPoP: -28.28, salesDiffLY: -31.74,
    salesShare: 22.95, salesSharePoP: -1.20, salesShareDiffLY: -3.45,
    units: 3575, unitsPoP: -35.50, unitsDiffLY: -7.29,
    adSpend: 19206, adSpendPoP: -30.55, adSpendDiffLY: -18.42,
    adSales: 71547, adSalesPoP: -22.14, adSalesDiffLY: -26.81,
    roas: 3.73, roasPoP: 12.10, roasDiffLY: -10.28,
    acos: 26.84, acosPoP: -10.80, acosDiffLY: 11.47,
    tacos: 16.69, tacosPoP: -3.18, tacosDiffLY: 19.50,
    bboxWinRate: 87.4, bboxWinRatePoP: -1.80, bboxWinRateDiffLY: -3.20,
    adReliance: 62.17, adReliancePoP: 8.55, adRelianceDiffLY: 7.22,
    cvr: 12.4, cvrPoP: -2.10, cvrDiffLY: -1.85,
    pageViews: 42800, pageViewsPoP: -18.30, pageViewsDiffLY: -12.60,
    sessions: 28820, sessionsPoP: -20.40, sessionsDiffLY: -14.30,
  },
  {
    marketplace: 'France',
    sales: 109489, salesPoP: -46.43, salesDiffLY: 29.31,
    salesShare: 21.83, salesSharePoP: -2.80, salesShareDiffLY: 5.14,
    units: 2569, unitsPoP: -26.66, unitsDiffLY: 3.88,
    adSpend: 9709, adSpendPoP: -34.23, adSpendDiffLY: -12.80,
    adSales: 40757, adSalesPoP: -38.10, adSalesDiffLY: 18.42,
    roas: 4.20, roasPoP: -5.90, roasDiffLY: 35.82,
    acos: 23.82, acosPoP: 6.28, acosDiffLY: -26.38,
    tacos: 8.87, tacosPoP: 23.09, tacosDiffLY: -32.57,
    bboxWinRate: 91.2, bboxWinRatePoP: 0.80, bboxWinRateDiffLY: 2.40,
    adReliance: 37.22, adReliancePoP: 14.28, adRelianceDiffLY: -8.42,
    cvr: 14.8, cvrPoP: -1.40, cvrDiffLY: 2.30,
    pageViews: 26400, pageViewsPoP: -30.20, pageViewsDiffLY: 15.80,
    sessions: 17360, sessionsPoP: -28.50, sessionsDiffLY: 12.40,
  },
  {
    marketplace: 'UK',
    sales: 99170, salesPoP: -14.46, salesDiffLY: 18.20,
    salesShare: 19.78, salesSharePoP: 1.20, salesShareDiffLY: 3.82,
    units: 3530, unitsPoP: -19.39, unitsDiffLY: 44.08,
    adSpend: 11660, adSpendPoP: -24.51, adSpendDiffLY: -8.30,
    adSales: 42234, adSalesPoP: -18.60, adSalesDiffLY: 22.15,
    roas: 3.62, roasPoP: 7.80, roasDiffLY: 33.23,
    acos: 27.61, acosPoP: -7.24, acosDiffLY: -24.92,
    tacos: 11.75, tacosPoP: -11.82, tacosDiffLY: -22.42,
    bboxWinRate: 89.6, bboxWinRatePoP: -0.40, bboxWinRateDiffLY: 1.80,
    adReliance: 42.59, adReliancePoP: -5.10, adRelianceDiffLY: 3.34,
    cvr: 11.2, cvrPoP: 1.80, cvrDiffLY: 5.40,
    pageViews: 46200, pageViewsPoP: -8.40, pageViewsDiffLY: 28.60,
    sessions: 31520, sessionsPoP: -10.20, sessionsDiffLY: 24.80,
  },
  {
    marketplace: 'United States',
    sales: 83103, salesPoP: -9.82, salesDiffLY: -2.26,
    salesShare: 16.57, salesSharePoP: 1.80, salesShareDiffLY: 0.42,
    units: 3993, unitsPoP: -12.61, unitsDiffLY: -13.80,
    adSpend: 14456, adSpendPoP: -7.26, adSpendDiffLY: 4.50,
    adSales: 40288, adSalesPoP: -10.40, adSalesDiffLY: -5.12,
    roas: 2.79, roasPoP: -3.40, roasDiffLY: -9.20,
    acos: 35.89, acosPoP: 3.52, acosDiffLY: 10.12,
    tacos: 17.39, tacosPoP: 2.82, tacosDiffLY: 6.91,
    bboxWinRate: 82.3, bboxWinRatePoP: -2.10, bboxWinRateDiffLY: -4.80,
    adReliance: 48.48, adReliancePoP: -0.64, adRelianceDiffLY: -2.93,
    cvr: 9.8, cvrPoP: -0.60, cvrDiffLY: -2.40,
    pageViews: 58400, pageViewsPoP: -4.20, pageViewsDiffLY: 2.80,
    sessions: 40750, sessionsPoP: -6.30, sessionsDiffLY: 1.20,
  },
  {
    marketplace: 'Italy',
    sales: 49596, salesPoP: -28.05, salesDiffLY: 0.09,
    salesShare: 9.89, salesSharePoP: -0.60, salesShareDiffLY: 0.82,
    units: 1648, unitsPoP: -36.00, unitsDiffLY: 7.29,
    adSpend: 7366, adSpendPoP: -38.97, adSpendDiffLY: -14.20,
    adSales: 18603, adSalesPoP: -32.40, adSalesDiffLY: -2.80,
    roas: 2.53, roasPoP: 10.80, roasDiffLY: 13.30,
    acos: 39.59, acosPoP: -9.74, acosDiffLY: -11.74,
    tacos: 14.85, tacosPoP: -15.22, tacosDiffLY: -14.28,
    bboxWinRate: 85.1, bboxWinRatePoP: -1.40, bboxWinRateDiffLY: 0.60,
    adReliance: 37.51, adReliancePoP: -6.30, adRelianceDiffLY: -2.88,
    cvr: 10.6, cvrPoP: -0.80, cvrDiffLY: 1.20,
    pageViews: 22400, pageViewsPoP: -22.60, pageViewsDiffLY: 4.20,
    sessions: 15550, sessionsPoP: -24.80, sessionsDiffLY: 2.80,
  },
  {
    marketplace: 'Spain',
    sales: 38770, salesPoP: -15.07, salesDiffLY: 88.13,
    salesShare: 7.73, salesSharePoP: 0.40, salesShareDiffLY: 3.60,
    units: 937, unitsPoP: -32.74, unitsDiffLY: 35.60,
    adSpend: 3895, adSpendPoP: -20.46, adSpendDiffLY: 42.30,
    adSales: 11379, adSalesPoP: -24.80, adSalesDiffLY: 64.20,
    roas: 2.92, roasPoP: -5.46, roasDiffLY: 15.38,
    acos: 34.23, acosPoP: 5.78, acosDiffLY: -13.32,
    tacos: 10.05, tacosPoP: -6.36, tacosDiffLY: -24.36,
    bboxWinRate: 88.7, bboxWinRatePoP: 1.20, bboxWinRateDiffLY: 4.30,
    adReliance: 29.35, adReliancePoP: -11.52, adRelianceDiffLY: -12.72,
    cvr: 13.2, cvrPoP: 2.40, cvrDiffLY: 6.80,
    pageViews: 10800, pageViewsPoP: -10.40, pageViewsDiffLY: 52.40,
    sessions: 7098, sessionsPoP: -12.60, sessionsDiffLY: 48.20,
  },
  {
    marketplace: 'Netherlands',
    sales: 3437, salesPoP: -50.89, salesDiffLY: -29.34,
    salesShare: 0.69, salesSharePoP: -0.30, salesShareDiffLY: -0.24,
    units: 118, unitsPoP: -41.58, unitsDiffLY: -36.22,
    adSpend: 148, adSpendPoP: -14.62, adSpendDiffLY: -22.80,
    adSales: 789, adSalesPoP: -28.40, adSalesDiffLY: -34.60,
    roas: 5.33, roasPoP: -16.14, roasDiffLY: -15.30,
    acos: 18.76, acosPoP: 19.24, acosDiffLY: 18.06,
    tacos: 4.31, tacosPoP: 73.80, tacosDiffLY: 9.26,
    bboxWinRate: 78.4, bboxWinRatePoP: -3.60, bboxWinRateDiffLY: -6.80,
    adReliance: 22.96, adReliancePoP: 45.80, adRelianceDiffLY: -7.44,
    cvr: 8.2, cvrPoP: -3.40, cvrDiffLY: -4.60,
    pageViews: 2100, pageViewsPoP: -38.20, pageViewsDiffLY: -18.40,
    sessions: 1439, sessionsPoP: -36.80, sessionsDiffLY: -20.60,
  },
  {
    marketplace: 'Belgium',
    sales: 1500, salesPoP: -45.94, salesDiffLY: -27.89,
    salesShare: 0.30, salesSharePoP: -0.12, salesShareDiffLY: -0.08,
    units: 63, unitsPoP: -7.35, unitsDiffLY: -47.93,
    adSpend: 5, adSpendPoP: 55.03, adSpendDiffLY: -82.14,
    adSales: 0, adSalesPoP: 0, adSalesDiffLY: 0,
    roas: 0, roasPoP: 0, roasDiffLY: 0,
    acos: 0, acosPoP: 0, acosDiffLY: 0,
    tacos: 0.33, tacosPoP: 120.00, tacosDiffLY: -74.80,
    bboxWinRate: 72.6, bboxWinRatePoP: -4.20, bboxWinRateDiffLY: -8.40,
    adReliance: 0, adReliancePoP: 0, adRelianceDiffLY: 0,
    cvr: 6.8, cvrPoP: -1.80, cvrDiffLY: -5.20,
    pageViews: 1340, pageViewsPoP: -32.40, pageViewsDiffLY: -22.80,
    sessions: 926, sessionsPoP: -30.80, sessionsDiffLY: -24.60,
  },
  {
    marketplace: 'Canada',
    sales: 833, salesPoP: -15.02, salesDiffLY: 27.80,
    salesShare: 0.17, salesSharePoP: 0.02, salesShareDiffLY: 0.06,
    units: 46, unitsPoP: -20.69, unitsDiffLY: 70.37,
    adSpend: 0, adSpendPoP: 0, adSpendDiffLY: 0,
    adSales: 0, adSalesPoP: 0, adSalesDiffLY: 0,
    roas: 0, roasPoP: 0, roasDiffLY: 0,
    acos: 0, acosPoP: 0, acosDiffLY: 0,
    tacos: 0, tacosPoP: 0, tacosDiffLY: 0,
    bboxWinRate: 94.2, bboxWinRatePoP: 0.60, bboxWinRateDiffLY: 1.40,
    adReliance: 0, adReliancePoP: 0, adRelianceDiffLY: 0,
    cvr: 7.4, cvrPoP: 0.40, cvrDiffLY: 3.20,
    pageViews: 920, pageViewsPoP: -8.60, pageViewsDiffLY: 34.80,
    sessions: 622, sessionsPoP: -10.40, sessionsDiffLY: 30.20,
  },
];

export const categoryData: CategoryRow[] = [
  {
    category: 'Soft Picks',
    sales: 142300, salesPoP: -8.31, salesDiffLY: 10.74,
    salesShare: 28.37, salesSharePoP: 1.40, salesShareDiffLY: 2.80,
    units: 4820, unitsPoP: -6.20, unitsDiffLY: 10.80,
    adSpend: 12400, adSpendPoP: -12.40, adSpendDiffLY: -4.20,
    adSales: 48200, adSalesPoP: -10.80, adSalesDiffLY: 8.60,
    roas: 3.89, roasPoP: 1.82, roasDiffLY: 13.37,
    acos: 25.73, acosPoP: -1.78, acosDiffLY: -11.80,
    tacos: 8.71, tacosPoP: -4.44, tacosDiffLY: -13.52,
    bboxWinRate: 92.4, bboxWinRatePoP: 0.80, bboxWinRateDiffLY: 1.60,
    adReliance: 33.87, adReliancePoP: -2.72, adRelianceDiffLY: -1.93,
    cvr: 14.2, cvrPoP: -0.60, cvrDiffLY: 2.90,
    pageViews: 48600, pageViewsPoP: -4.80, pageViewsDiffLY: 14.20,
    sessions: 33940, sessionsPoP: -6.40, sessionsDiffLY: 12.60,
  },
  {
    category: 'Lunch Boxes',
    sales: 108700, salesPoP: -9.72, salesDiffLY: -6.13,
    salesShare: 21.68, salesSharePoP: -0.80, salesShareDiffLY: -1.42,
    units: 3640, unitsPoP: -8.40, unitsDiffLY: -6.91,
    adSpend: 9800, adSpendPoP: -6.80, adSpendDiffLY: 2.40,
    adSales: 35400, adSalesPoP: -12.20, adSalesDiffLY: -8.80,
    roas: 3.61, roasPoP: -5.80, roasDiffLY: -10.93,
    acos: 27.68, acosPoP: 6.16, acosDiffLY: 12.26,
    tacos: 9.02, tacosPoP: 3.18, tacosDiffLY: 9.10,
    bboxWinRate: 86.8, bboxWinRatePoP: -1.40, bboxWinRateDiffLY: -2.80,
    adReliance: 32.57, adReliancePoP: -2.74, adRelianceDiffLY: -2.86,
    cvr: 11.8, cvrPoP: -0.40, cvrDiffLY: -3.23,
    pageViews: 44200, pageViewsPoP: -6.20, pageViewsDiffLY: -2.40,
    sessions: 30850, sessionsPoP: -8.40, sessionsDiffLY: -4.20,
  },
  {
    category: 'Compact Camera',
    sales: 89200, salesPoP: -7.18, salesDiffLY: 8.25,
    salesShare: 17.79, salesSharePoP: 0.60, salesShareDiffLY: 1.24,
    units: 1240, unitsPoP: -5.34, unitsDiffLY: 5.08,
    adSpend: 8200, adSpendPoP: -4.60, adSpendDiffLY: 6.80,
    adSales: 32600, adSalesPoP: -8.40, adSalesDiffLY: 12.40,
    roas: 3.98, roasPoP: -3.98, roasDiffLY: 5.25,
    acos: 25.15, acosPoP: 4.16, acosDiffLY: -4.98,
    tacos: 9.19, tacosPoP: 2.78, tacosDiffLY: -1.34,
    bboxWinRate: 84.2, bboxWinRatePoP: -0.80, bboxWinRateDiffLY: 0.40,
    adReliance: 36.55, adReliancePoP: -1.32, adRelianceDiffLY: 3.84,
    cvr: 8.6, cvrPoP: 0.20, cvrDiffLY: 4.88,
    pageViews: 21400, pageViewsPoP: -3.80, pageViewsDiffLY: 10.40,
    sessions: 14420, sessionsPoP: -5.20, sessionsDiffLY: 8.60,
  },
  {
    category: 'Bridge Camera',
    sales: 64800, salesPoP: -5.95, salesDiffLY: -8.99,
    salesShare: 12.92, salesSharePoP: 0.20, salesShareDiffLY: -0.86,
    units: 520, unitsPoP: -4.80, unitsDiffLY: -10.34,
    adSpend: 6400, adSpendPoP: -2.20, adSpendDiffLY: 8.40,
    adSales: 24200, adSalesPoP: -6.80, adSalesDiffLY: -4.20,
    roas: 3.78, roasPoP: -4.70, roasDiffLY: -11.64,
    acos: 26.45, acosPoP: 4.94, acosDiffLY: 13.10,
    tacos: 9.88, tacosPoP: 3.98, tacosDiffLY: 19.12,
    bboxWinRate: 80.6, bboxWinRatePoP: -2.40, bboxWinRateDiffLY: -3.80,
    adReliance: 37.35, adReliancePoP: -0.90, adRelianceDiffLY: 5.24,
    cvr: 6.4, cvrPoP: -0.40, cvrDiffLY: -7.25,
    pageViews: 12000, pageViewsPoP: -2.60, pageViewsDiffLY: -6.80,
    sessions: 8125, sessionsPoP: -4.20, sessionsDiffLY: -8.40,
  },
  {
    category: 'Crossbody Bags',
    sales: 48900, salesPoP: -4.49, salesDiffLY: 16.15,
    salesShare: 9.75, salesSharePoP: 0.40, salesShareDiffLY: 1.62,
    units: 1630, unitsPoP: -3.80, unitsDiffLY: 18.12,
    adSpend: 4200, adSpendPoP: -8.60, adSpendDiffLY: -2.40,
    adSales: 16800, adSalesPoP: -6.40, adSalesDiffLY: 14.80,
    roas: 4.00, roasPoP: 2.38, roasDiffLY: 17.65,
    acos: 25.00, acosPoP: -2.32, acosDiffLY: -15.00,
    tacos: 8.59, tacosPoP: -4.31, tacosDiffLY: -15.97,
    bboxWinRate: 90.4, bboxWinRatePoP: 0.60, bboxWinRateDiffLY: 2.20,
    adReliance: 34.36, adReliancePoP: -2.00, adRelianceDiffLY: -1.16,
    cvr: 12.1, cvrPoP: 0.80, cvrDiffLY: 6.14,
    pageViews: 19800, pageViewsPoP: -2.40, pageViewsDiffLY: 18.40,
    sessions: 13470, sessionsPoP: -4.60, sessionsDiffLY: 16.20,
  },
  {
    category: 'Supplements',
    sales: 28400, salesPoP: -14.20, salesDiffLY: -10.13,
    salesShare: 5.66, salesSharePoP: -0.60, salesShareDiffLY: -0.82,
    units: 890, unitsPoP: -12.40, unitsDiffLY: -11.88,
    adSpend: 4800, adSpendPoP: -4.20, adSpendDiffLY: 12.60,
    adSales: 10200, adSalesPoP: -16.40, adSalesDiffLY: -6.80,
    roas: 2.13, roasPoP: -12.74, roasDiffLY: -17.25,
    acos: 47.06, acosPoP: 14.60, acosDiffLY: 20.82,
    tacos: 16.90, tacosPoP: 11.56, tacosDiffLY: 25.32,
    bboxWinRate: 78.2, bboxWinRatePoP: -3.20, bboxWinRateDiffLY: -5.60,
    adReliance: 35.92, adReliancePoP: -2.56, adRelianceDiffLY: 3.72,
    cvr: 9.3, cvrPoP: -1.20, cvrDiffLY: -5.10,
    pageViews: 14200, pageViewsPoP: -10.80, pageViewsDiffLY: -4.60,
    sessions: 9570, sessionsPoP: -12.40, sessionsDiffLY: -6.80,
  },
  {
    category: 'Phone Cases',
    sales: 12400, salesPoP: -6.06, salesDiffLY: 14.81,
    salesShare: 2.47, salesSharePoP: 0.12, salesShareDiffLY: 0.38,
    units: 1240, unitsPoP: -4.60, unitsDiffLY: 14.81,
    adSpend: 1400, adSpendPoP: -10.20, adSpendDiffLY: -6.40,
    adSales: 4800, adSalesPoP: -8.80, adSalesDiffLY: 10.40,
    roas: 3.43, roasPoP: 1.58, roasDiffLY: 17.98,
    acos: 29.17, acosPoP: -1.56, acosDiffLY: -15.24,
    tacos: 11.29, tacosPoP: -4.40, tacosDiffLY: -18.48,
    bboxWinRate: 93.8, bboxWinRatePoP: 0.40, bboxWinRateDiffLY: 1.20,
    adReliance: 38.71, adReliancePoP: -2.92, adRelianceDiffLY: -3.84,
    cvr: 18.4, cvrPoP: 1.40, cvrDiffLY: 6.98,
    pageViews: 9800, pageViewsPoP: -4.20, pageViewsDiffLY: 12.80,
    sessions: 6740, sessionsPoP: -6.40, sessionsDiffLY: 10.60,
  },
  {
    category: 'Travel Kits',
    sales: 6800, salesPoP: -12.82, salesDiffLY: -5.56,
    salesShare: 1.36, salesSharePoP: -0.14, salesShareDiffLY: -0.06,
    units: 340, unitsPoP: -10.80, unitsDiffLY: -5.56,
    adSpend: 1200, adSpendPoP: -6.40, adSpendDiffLY: 8.60,
    adSales: 2400, adSalesPoP: -14.20, adSalesDiffLY: -8.40,
    roas: 2.00, roasPoP: -8.34, roasDiffLY: -15.68,
    acos: 50.00, acosPoP: 9.12, acosDiffLY: 18.62,
    tacos: 17.65, tacosPoP: 7.38, tacosDiffLY: 15.02,
    bboxWinRate: 76.4, bboxWinRatePoP: -2.80, bboxWinRateDiffLY: -4.20,
    adReliance: 35.29, adReliancePoP: -1.56, adRelianceDiffLY: -3.02,
    cvr: 7.8, cvrPoP: -0.80, cvrDiffLY: -3.85,
    pageViews: 6400, pageViewsPoP: -8.40, pageViewsDiffLY: -2.80,
    sessions: 4360, sessionsPoP: -10.20, sessionsDiffLY: -4.60,
  },
];

export const asinData: AsinRow[] = [
  {
    asin: 'B08K3XTRY7', title: 'Oral Care Soft Picks 120ct',
    sales: 68400, salesPoP: -5.13, salesDiffLY: 11.76,
    salesShare: 13.64, salesSharePoP: 0.80, salesShareDiffLY: 1.42,
    units: 2340, unitsPoP: -4.20, unitsDiffLY: 11.43,
    adSpend: 4820, adSpendPoP: -8.40, adSpendDiffLY: -2.60,
    adSales: 18400, adSalesPoP: -6.80, adSalesDiffLY: 8.20,
    roas: 3.82, roasPoP: 1.74, roasDiffLY: 11.10,
    acos: 26.20, acosPoP: -1.70, acosDiffLY: -9.98,
    tacos: 7.05, tacosPoP: -3.42, tacosDiffLY: -12.80,
    bboxWinRate: 94.2, bboxWinRatePoP: 0.40, bboxWinRateDiffLY: 1.20,
    adReliance: 26.90, adReliancePoP: -1.78, adRelianceDiffLY: -3.18,
    cvr: 12.72, cvrPoP: -0.40, cvrDiffLY: 2.80,
    pageViews: 26400, pageViewsPoP: -3.20, pageViewsDiffLY: 12.40,
    sessions: 18400, sessionsPoP: -4.80, sessionsDiffLY: 10.20,
  },
  {
    asin: 'B09MLNHK7P', title: 'Premium Lunch Box Set',
    sales: 52100, salesPoP: -10.79, salesDiffLY: -8.27,
    salesShare: 10.39, salesSharePoP: -0.60, salesShareDiffLY: -0.82,
    units: 1740, unitsPoP: -9.40, unitsDiffLY: -9.38,
    adSpend: 3960, adSpendPoP: -4.20, adSpendDiffLY: 4.80,
    adSales: 16800, adSalesPoP: -12.60, adSalesDiffLY: -10.20,
    roas: 4.24, roasPoP: -8.78, roasDiffLY: -14.32,
    acos: 23.57, acosPoP: 9.62, acosDiffLY: 16.72,
    tacos: 7.60, tacosPoP: 7.38, tacosDiffLY: 14.24,
    bboxWinRate: 88.4, bboxWinRatePoP: -1.20, bboxWinRateDiffLY: -2.40,
    adReliance: 32.25, adReliancePoP: -1.96, adRelianceDiffLY: -2.10,
    cvr: 11.45, cvrPoP: -0.60, cvrDiffLY: -3.80,
    pageViews: 22000, pageViewsPoP: -6.80, pageViewsDiffLY: -4.20,
    sessions: 15200, sessionsPoP: -8.40, sessionsDiffLY: -6.40,
  },
  {
    asin: 'B07XQPNHZ2', title: 'Compact Digital Camera 20MP',
    sales: 48900, salesPoP: -5.60, salesDiffLY: 10.88,
    salesShare: 9.75, salesSharePoP: 0.40, salesShareDiffLY: 0.96,
    units: 680, unitsPoP: -4.20, unitsDiffLY: 9.68,
    adSpend: 5640, adSpendPoP: -2.80, adSpendDiffLY: 8.40,
    adSales: 19200, adSalesPoP: -6.40, adSalesDiffLY: 14.60,
    roas: 3.40, roasPoP: -3.70, roasDiffLY: 5.72,
    acos: 29.38, acosPoP: 3.84, acosDiffLY: -5.40,
    tacos: 11.53, tacosPoP: 2.98, tacosDiffLY: -2.24,
    bboxWinRate: 82.8, bboxWinRatePoP: -1.40, bboxWinRateDiffLY: 0.80,
    adReliance: 39.26, adReliancePoP: -0.84, adRelianceDiffLY: 3.34,
    cvr: 8.29, cvrPoP: 0.20, cvrDiffLY: 4.20,
    pageViews: 12200, pageViewsPoP: -2.40, pageViewsDiffLY: 8.80,
    sessions: 8200, sessionsPoP: -4.60, sessionsDiffLY: 6.40,
  },
  {
    asin: 'B08FJ2KXCN', title: 'Leather Crossbody Bag',
    sales: 38200, salesPoP: -4.74, salesDiffLY: 16.46,
    salesShare: 7.62, salesSharePoP: 0.30, salesShareDiffLY: 1.18,
    units: 1270, unitsPoP: -3.60, unitsDiffLY: 17.59,
    adSpend: 2890, adSpendPoP: -6.80, adSpendDiffLY: -4.20,
    adSales: 12400, adSalesPoP: -4.80, adSalesDiffLY: 18.40,
    roas: 4.29, roasPoP: 2.14, roasDiffLY: 23.60,
    acos: 23.31, acosPoP: -2.10, acosDiffLY: -19.10,
    tacos: 7.57, tacosPoP: -2.16, tacosDiffLY: -17.74,
    bboxWinRate: 91.6, bboxWinRatePoP: 0.80, bboxWinRateDiffLY: 2.40,
    adReliance: 32.46, adReliancePoP: -0.06, adRelianceDiffLY: 1.68,
    cvr: 10.95, cvrPoP: 0.60, cvrDiffLY: 5.82,
    pageViews: 16800, pageViewsPoP: -2.20, pageViewsDiffLY: 14.60,
    sessions: 11600, sessionsPoP: -4.40, sessionsDiffLY: 12.40,
  },
  {
    asin: 'B09GKP4HLM', title: 'Bridge Camera 40x Zoom',
    sales: 35600, salesPoP: -5.82, salesDiffLY: -9.18,
    salesShare: 7.10, salesSharePoP: 0.10, salesShareDiffLY: -0.64,
    units: 285, unitsPoP: -4.40, unitsDiffLY: -10.94,
    adSpend: 4120, adSpendPoP: -1.80, adSpendDiffLY: 10.20,
    adSales: 14800, adSalesPoP: -6.20, adSalesDiffLY: -4.80,
    roas: 3.59, roasPoP: -4.48, roasDiffLY: -13.62,
    acos: 27.84, acosPoP: 4.70, acosDiffLY: 15.82,
    tacos: 11.57, tacosPoP: 4.26, tacosDiffLY: 21.34,
    bboxWinRate: 79.4, bboxWinRatePoP: -2.60, bboxWinRateDiffLY: -4.20,
    adReliance: 41.57, adReliancePoP: -0.40, adRelianceDiffLY: 4.82,
    cvr: 5.94, cvrPoP: -0.60, cvrDiffLY: -8.46,
    pageViews: 7200, pageViewsPoP: -2.40, pageViewsDiffLY: -6.20,
    sessions: 4800, sessionsPoP: -4.20, sessionsDiffLY: -8.40,
  },
  {
    asin: 'B08NWDV37K', title: 'Oral Care Soft Picks 60ct',
    sales: 34200, salesPoP: -5.52, salesDiffLY: 11.04,
    salesShare: 6.82, salesSharePoP: 0.20, salesShareDiffLY: 0.74,
    units: 1860, unitsPoP: -4.80, unitsDiffLY: 10.71,
    adSpend: 2640, adSpendPoP: -6.40, adSpendDiffLY: -1.80,
    adSales: 10800, adSalesPoP: -8.20, adSalesDiffLY: 6.40,
    roas: 4.09, roasPoP: -1.92, roasDiffLY: 8.36,
    acos: 24.44, acosPoP: 1.96, acosDiffLY: -7.72,
    tacos: 7.72, tacosPoP: -0.92, tacosDiffLY: -11.54,
    bboxWinRate: 93.4, bboxWinRatePoP: 0.60, bboxWinRateDiffLY: 1.40,
    adReliance: 31.58, adReliancePoP: -2.82, adRelianceDiffLY: -4.14,
    cvr: 15.0, cvrPoP: 0.80, cvrDiffLY: 4.16,
    pageViews: 17800, pageViewsPoP: -3.40, pageViewsDiffLY: 10.80,
    sessions: 12400, sessionsPoP: -5.20, sessionsDiffLY: 8.60,
  },
  {
    asin: 'B07YHNHT1C', title: 'Vitamin D3 5000IU 180ct',
    sales: 22800, salesPoP: -14.29, salesDiffLY: -10.24,
    salesShare: 4.55, salesSharePoP: -0.40, salesShareDiffLY: -0.48,
    units: 720, unitsPoP: -12.80, unitsDiffLY: -11.11,
    adSpend: 3180, adSpendPoP: -2.60, adSpendDiffLY: 14.80,
    adSales: 8200, adSalesPoP: -16.80, adSalesDiffLY: -8.40,
    roas: 2.58, roasPoP: -14.62, roasDiffLY: -20.22,
    acos: 38.78, acosPoP: 17.14, acosDiffLY: 25.34,
    tacos: 13.95, tacosPoP: 13.72, tacosDiffLY: 27.84,
    bboxWinRate: 76.8, bboxWinRatePoP: -3.40, bboxWinRateDiffLY: -6.20,
    adReliance: 35.96, adReliancePoP: -2.94, adRelianceDiffLY: 2.04,
    cvr: 8.89, cvrPoP: -1.40, cvrDiffLY: -5.82,
    pageViews: 12000, pageViewsPoP: -8.60, pageViewsDiffLY: -4.20,
    sessions: 8100, sessionsPoP: -10.40, sessionsDiffLY: -6.80,
  },
  {
    asin: 'B09TPLX2NQ', title: 'Kids Lunch Box Insulated',
    sales: 21400, salesPoP: -13.71, salesDiffLY: -9.32,
    salesShare: 4.27, salesSharePoP: -0.30, salesShareDiffLY: -0.38,
    units: 1070, unitsPoP: -11.60, unitsDiffLY: -9.32,
    adSpend: 1840, adSpendPoP: -4.80, adSpendDiffLY: 6.20,
    adSales: 6800, adSalesPoP: -14.40, adSalesDiffLY: -10.60,
    roas: 3.70, roasPoP: -10.10, roasDiffLY: -15.82,
    acos: 27.06, acosPoP: 11.24, acosDiffLY: 18.80,
    tacos: 8.60, tacosPoP: 10.36, tacosDiffLY: 17.12,
    bboxWinRate: 87.2, bboxWinRatePoP: -1.60, bboxWinRateDiffLY: -3.20,
    adReliance: 31.78, adReliancePoP: -0.80, adRelianceDiffLY: -1.40,
    cvr: 11.38, cvrPoP: -0.80, cvrDiffLY: -4.42,
    pageViews: 13600, pageViewsPoP: -8.20, pageViewsDiffLY: -4.80,
    sessions: 9400, sessionsPoP: -10.60, sessionsDiffLY: -6.40,
  },
  {
    asin: 'B08LMWKP4J', title: 'Phone Case Ultra Slim',
    sales: 12400, salesPoP: -6.06, salesDiffLY: 14.81,
    salesShare: 2.47, salesSharePoP: 0.12, salesShareDiffLY: 0.38,
    units: 1240, unitsPoP: -4.60, unitsDiffLY: 14.81,
    adSpend: 980, adSpendPoP: -8.20, adSpendDiffLY: -4.60,
    adSales: 4200, adSalesPoP: -6.40, adSalesDiffLY: 12.80,
    roas: 4.29, roasPoP: 1.96, roasDiffLY: 18.24,
    acos: 23.33, acosPoP: -1.92, acosDiffLY: -15.42,
    tacos: 7.90, tacosPoP: -2.30, tacosDiffLY: -16.88,
    bboxWinRate: 95.4, bboxWinRatePoP: 0.60, bboxWinRateDiffLY: 1.80,
    adReliance: 33.87, adReliancePoP: -0.36, adRelianceDiffLY: -1.74,
    cvr: 17.22, cvrPoP: 1.20, cvrDiffLY: 6.42,
    pageViews: 10400, pageViewsPoP: -3.80, pageViewsDiffLY: 10.60,
    sessions: 7200, sessionsPoP: -5.60, sessionsDiffLY: 8.40,
  },
  {
    asin: 'B09HJQRN6V', title: 'Travel Organizer Kit',
    sales: 6800, salesPoP: -12.82, salesDiffLY: -5.56,
    salesShare: 1.36, salesSharePoP: -0.14, salesShareDiffLY: -0.06,
    units: 340, unitsPoP: -10.80, unitsDiffLY: -5.56,
    adSpend: 1420, adSpendPoP: -4.60, adSpendDiffLY: 10.40,
    adSales: 2800, adSalesPoP: -12.80, adSalesDiffLY: -6.20,
    roas: 1.97, roasPoP: -8.58, roasDiffLY: -15.06,
    acos: 50.71, acosPoP: 9.38, acosDiffLY: 17.74,
    tacos: 20.88, tacosPoP: 9.42, tacosDiffLY: 16.88,
    bboxWinRate: 74.6, bboxWinRatePoP: -3.20, bboxWinRateDiffLY: -5.40,
    adReliance: 41.18, adReliancePoP: 0, adRelianceDiffLY: -0.68,
    cvr: 7.39, cvrPoP: -1.00, cvrDiffLY: -4.62,
    pageViews: 6800, pageViewsPoP: -6.20, pageViewsDiffLY: -2.40,
    sessions: 4600, sessionsPoP: -8.40, sessionsDiffLY: -4.80,
  },
];

function splitMetrics(parent: MetricFields, ratio1: number): [MetricFields, MetricFields] {
  const r2 = 1 - ratio1;
  const jitter = (base: number, spread = 2) => base + (Math.random() - 0.5) * spread;
  const split = (v: number) => Math.round(v * ratio1);
  const m1: MetricFields = {
    sales: split(parent.sales), salesPoP: jitter(parent.salesPoP), salesDiffLY: jitter(parent.salesDiffLY),
    salesShare: +(parent.salesShare * ratio1).toFixed(2), salesSharePoP: jitter(parent.salesSharePoP, 1), salesShareDiffLY: jitter(parent.salesShareDiffLY, 1),
    units: split(parent.units), unitsPoP: jitter(parent.unitsPoP), unitsDiffLY: jitter(parent.unitsDiffLY),
    adSpend: split(parent.adSpend), adSpendPoP: jitter(parent.adSpendPoP), adSpendDiffLY: jitter(parent.adSpendDiffLY),
    adSales: split(parent.adSales), adSalesPoP: jitter(parent.adSalesPoP), adSalesDiffLY: jitter(parent.adSalesDiffLY),
    roas: +jitter(parent.roas, 0.4).toFixed(2), roasPoP: jitter(parent.roasPoP), roasDiffLY: jitter(parent.roasDiffLY),
    acos: +jitter(parent.acos, 2).toFixed(2), acosPoP: jitter(parent.acosPoP), acosDiffLY: jitter(parent.acosDiffLY),
    tacos: +jitter(parent.tacos, 1).toFixed(2), tacosPoP: jitter(parent.tacosPoP), tacosDiffLY: jitter(parent.tacosDiffLY),
    bboxWinRate: +jitter(parent.bboxWinRate, 2).toFixed(1), bboxWinRatePoP: jitter(parent.bboxWinRatePoP, 0.8), bboxWinRateDiffLY: jitter(parent.bboxWinRateDiffLY, 0.8),
    adReliance: +jitter(parent.adReliance, 3).toFixed(2), adReliancePoP: jitter(parent.adReliancePoP), adRelianceDiffLY: jitter(parent.adRelianceDiffLY),
    cvr: +jitter(parent.cvr, 1).toFixed(2), cvrPoP: jitter(parent.cvrPoP, 0.5), cvrDiffLY: jitter(parent.cvrDiffLY, 0.5),
    pageViews: split(parent.pageViews), pageViewsPoP: jitter(parent.pageViewsPoP), pageViewsDiffLY: jitter(parent.pageViewsDiffLY),
    sessions: split(parent.sessions), sessionsPoP: jitter(parent.sessionsPoP), sessionsDiffLY: jitter(parent.sessionsDiffLY),
  };
  const m2: MetricFields = {
    sales: parent.sales - m1.sales, salesPoP: jitter(parent.salesPoP), salesDiffLY: jitter(parent.salesDiffLY),
    salesShare: +(parent.salesShare * r2).toFixed(2), salesSharePoP: jitter(parent.salesSharePoP, 1), salesShareDiffLY: jitter(parent.salesShareDiffLY, 1),
    units: parent.units - m1.units, unitsPoP: jitter(parent.unitsPoP), unitsDiffLY: jitter(parent.unitsDiffLY),
    adSpend: parent.adSpend - m1.adSpend, adSpendPoP: jitter(parent.adSpendPoP), adSpendDiffLY: jitter(parent.adSpendDiffLY),
    adSales: parent.adSales - m1.adSales, adSalesPoP: jitter(parent.adSalesPoP), adSalesDiffLY: jitter(parent.adSalesDiffLY),
    roas: +jitter(parent.roas, 0.4).toFixed(2), roasPoP: jitter(parent.roasPoP), roasDiffLY: jitter(parent.roasDiffLY),
    acos: +jitter(parent.acos, 2).toFixed(2), acosPoP: jitter(parent.acosPoP), acosDiffLY: jitter(parent.acosDiffLY),
    tacos: +jitter(parent.tacos, 1).toFixed(2), tacosPoP: jitter(parent.tacosPoP), tacosDiffLY: jitter(parent.tacosDiffLY),
    bboxWinRate: +jitter(parent.bboxWinRate, 2).toFixed(1), bboxWinRatePoP: jitter(parent.bboxWinRatePoP, 0.8), bboxWinRateDiffLY: jitter(parent.bboxWinRateDiffLY, 0.8),
    adReliance: +jitter(parent.adReliance, 3).toFixed(2), adReliancePoP: jitter(parent.adReliancePoP), adRelianceDiffLY: jitter(parent.adRelianceDiffLY),
    cvr: +jitter(parent.cvr, 1).toFixed(2), cvrPoP: jitter(parent.cvrPoP, 0.5), cvrDiffLY: jitter(parent.cvrDiffLY, 0.5),
    pageViews: parent.pageViews - m1.pageViews, pageViewsPoP: jitter(parent.pageViewsPoP), pageViewsDiffLY: jitter(parent.pageViewsDiffLY),
    sessions: parent.sessions - m1.sessions, sessionsPoP: jitter(parent.sessionsPoP), sessionsDiffLY: jitter(parent.sessionsDiffLY),
  };
  return [m1, m2];
}

const skuPairs: [string, string, string, number][] = [
  ['B08K3XTRY7', 'SKU-EP-ML-36', 'SKU-EP-ML-72', 0.6],
  ['B09MLNHK7P', 'SKU-MP-NB-L', 'SKU-MP-NB-M', 0.6],
  ['B07XQPNHZ2', 'SKU-CN-740-BK', 'SKU-CN-740-SV', 0.6],
  ['B08FJ2KXCN', 'SKU-CN-G7X-BK', 'SKU-CN-G7X-SV', 0.6],
  ['B09GKP4HLM', 'SKU-LK-ALOE-BK', 'SKU-LK-ALOE-TN', 0.6],
  ['B08NWDV37K', 'SKU-NL-D3K2-50', 'SKU-NL-D3K2-30', 0.6],
  ['B07YHNHT1C', 'SKU-SP-UH-15P', 'SKU-SP-UH-15', 0.6],
  ['B09TPLX2NQ', 'SKU-AK-N3-WH', 'SKU-AK-N3-BK', 0.6],
  ['B08LMWKP4J', 'SKU-AF-SP-15P', 'SKU-AF-SP-15', 0.6],
  ['B09HJQRN6V', 'SKU-OS-UTO-GY', 'SKU-OS-UTO-BK', 0.6],
];

export const skuDataByAsin: Record<string, SkuRow[]> = {};

for (const [asin, sku1, sku2, ratio] of skuPairs) {
  const parent = asinData.find((r) => r.asin === asin);
  if (!parent) continue;
  const [m1, m2] = splitMetrics(parent, ratio);
  skuDataByAsin[asin] = [
    { sku: sku1, title: `${parent.title} — Variant A`, ...m1 },
    { sku: sku2, title: `${parent.title} — Variant B`, ...m2 },
  ];
}
