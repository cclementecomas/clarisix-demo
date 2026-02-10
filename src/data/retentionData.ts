export interface LTVSegment {
  segment: string;
  customers: number;
  avgOrderValue: number;
  ordersPerYear: number;
  avgLifespan: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  revenueShare: number;
  trend: number;
}

export const ltvSegments: LTVSegment[] = [
  { segment: 'Champions', customers: 1240, avgOrderValue: 89.50, ordersPerYear: 8.2, avgLifespan: 4.1, ltv: 3012, cac: 42, ltvCacRatio: 71.7, revenueShare: 34.2, trend: 12.4 },
  { segment: 'Loyal Customers', customers: 3480, avgOrderValue: 64.20, ordersPerYear: 5.4, avgLifespan: 3.2, ltv: 1109, cac: 38, ltvCacRatio: 29.2, revenueShare: 28.6, trend: 8.1 },
  { segment: 'Potential Loyalists', customers: 2890, avgOrderValue: 52.80, ordersPerYear: 3.1, avgLifespan: 2.0, ltv: 327, cac: 35, ltvCacRatio: 9.3, revenueShare: 14.8, trend: 15.2 },
  { segment: 'New Customers', customers: 4120, avgOrderValue: 41.60, ordersPerYear: 1.4, avgLifespan: 0.8, ltv: 47, cac: 52, ltvCacRatio: 0.9, revenueShare: 8.4, trend: -3.2 },
  { segment: 'At Risk', customers: 1860, avgOrderValue: 58.40, ordersPerYear: 2.8, avgLifespan: 1.6, ltv: 262, cac: 44, ltvCacRatio: 6.0, revenueShare: 7.2, trend: -8.6 },
  { segment: 'Hibernating', customers: 2340, avgOrderValue: 38.90, ordersPerYear: 1.1, avgLifespan: 0.6, ltv: 26, cac: 48, ltvCacRatio: 0.5, revenueShare: 4.6, trend: -14.1 },
  { segment: 'Lost', customers: 1580, avgOrderValue: 32.10, ordersPerYear: 0.3, avgLifespan: 0.3, ltv: 3, cac: 56, ltvCacRatio: 0.1, revenueShare: 2.2, trend: -5.8 },
];

export const ltvSummaryKPIs = [
  { label: 'Avg. LTV', value: '684', rawValue: 684, change: 6.8, positive: true },
  { label: 'Avg. CAC', value: '45', rawValue: 45, change: -2.1, positive: true },
  { label: 'LTV:CAC Ratio', value: '15.2x', change: 9.4, positive: true },
  { label: 'Repeat Purchase Rate', value: '38.4%', change: 3.2, positive: true },
];

export interface CohortRow {
  cohort: string;
  customers: number;
  months: (number | null)[];
}

export const cohortData: CohortRow[] = [
  { cohort: 'Jan 2024', customers: 1420, months: [100, 42.3, 31.8, 26.4, 22.1, 19.8, 18.2, 16.9, 15.4, 14.2, 13.1, 12.4] },
  { cohort: 'Feb 2024', customers: 1380, months: [100, 44.1, 33.2, 27.8, 23.4, 20.6, 18.9, 17.3, 16.1, 14.8, 13.6, null] },
  { cohort: 'Mar 2024', customers: 1560, months: [100, 46.2, 34.1, 28.6, 24.2, 21.4, 19.6, 17.8, 16.4, 15.1, null, null] },
  { cohort: 'Apr 2024', customers: 1290, months: [100, 41.8, 30.6, 25.2, 21.8, 19.2, 17.4, 16.1, 14.8, null, null, null] },
  { cohort: 'May 2024', customers: 1640, months: [100, 45.6, 35.4, 29.2, 24.8, 21.9, 19.8, 18.2, null, null, null, null] },
  { cohort: 'Jun 2024', customers: 1510, months: [100, 43.2, 32.8, 27.4, 23.1, 20.4, 18.6, null, null, null, null, null] },
  { cohort: 'Jul 2024', customers: 1720, months: [100, 47.8, 36.2, 30.1, 25.6, 22.4, null, null, null, null, null, null] },
  { cohort: 'Aug 2024', customers: 1480, months: [100, 44.6, 33.4, 28.2, 23.8, null, null, null, null, null, null, null] },
  { cohort: 'Sep 2024', customers: 1680, months: [100, 48.2, 36.8, 30.6, null, null, null, null, null, null, null, null] },
  { cohort: 'Oct 2024', customers: 1540, months: [100, 45.4, 34.2, null, null, null, null, null, null, null, null, null] },
  { cohort: 'Nov 2024', customers: 1820, months: [100, 49.1, null, null, null, null, null, null, null, null, null, null] },
  { cohort: 'Dec 2024', customers: 1960, months: [100, null, null, null, null, null, null, null, null, null, null, null] },
];

export interface CohortEvolutionPoint {
  month: string;
  m1: number;
  m3: number;
  m6: number;
  m12: number;
}

export const cohortEvolutionData: CohortEvolutionPoint[] = [
  { month: 'Jan', m1: 42.3, m3: 26.4, m6: 18.2, m12: 12.4 },
  { month: 'Feb', m1: 44.1, m3: 27.8, m6: 18.9, m12: 12.8 },
  { month: 'Mar', m1: 46.2, m3: 28.6, m6: 19.6, m12: 13.2 },
  { month: 'Apr', m1: 41.8, m3: 25.2, m6: 17.4, m12: 11.8 },
  { month: 'May', m1: 45.6, m3: 29.2, m6: 19.8, m12: 13.4 },
  { month: 'Jun', m1: 43.2, m3: 27.4, m6: 18.6, m12: 12.6 },
  { month: 'Jul', m1: 47.8, m3: 30.1, m6: 20.2, m12: 13.8 },
  { month: 'Aug', m1: 44.6, m3: 28.2, m6: 19.2, m12: 13.0 },
  { month: 'Sep', m1: 48.2, m3: 30.6, m6: 20.8, m12: 14.1 },
  { month: 'Oct', m1: 45.4, m3: 29.4, m6: 19.8, m12: 13.6 },
  { month: 'Nov', m1: 49.1, m3: 31.2, m6: 21.4, m12: 14.4 },
  { month: 'Dec', m1: 50.2, m3: 32.4, m6: 22.1, m12: 14.8 },
];
