export interface AdvertisingKPI {
  label: string;
  value: string;
  rawValue?: number;
  popChange: number;
  popPositive: boolean;
  lyChange: number;
  lyPositive: boolean;
  sparkline: number[];
  cardPositive: boolean;
}

export const advertisingKpiData: AdvertisingKPI[] = [
  {
    label: 'Ad Sales',
    value: '3.3M',
    rawValue: 3300000,
    popChange: 3.17,
    popPositive: true,
    lyChange: 116.90,
    lyPositive: true,
    sparkline: [2.1, 2.3, 2.0, 2.5, 2.7, 2.4, 2.9, 3.0, 2.8, 3.1, 3.2, 3.3],
    cardPositive: true,
  },
  {
    label: 'Ad Spend',
    value: '826.2K',
    rawValue: 826200,
    popChange: -6.10,
    popPositive: false,
    lyChange: 114.03,
    lyPositive: true,
    sparkline: [680, 720, 760, 810, 880, 920, 860, 840, 890, 850, 830, 826],
    cardPositive: true,
  },
  {
    label: 'ACOS/ROAS',
    value: '25.38%',
    popChange: -8.99,
    popPositive: false,
    lyChange: -1.32,
    lyPositive: false,
    sparkline: [28, 27, 29, 26, 27, 25, 26, 24, 26, 25, 25, 25],
    cardPositive: false,
  },
  {
    label: 'TACOS/TROAS',
    value: '11.54%',
    popChange: 11.47,
    popPositive: true,
    lyChange: 109.56,
    lyPositive: true,
    sparkline: [14, 13.5, 14.2, 13, 12.8, 13.4, 12.5, 12.1, 12.4, 11.8, 11.6, 11.5],
    cardPositive: true,
  },
  {
    label: 'CPC',
    value: '0.7',
    rawValue: 0.7,
    popChange: -9.52,
    popPositive: false,
    lyChange: 16.15,
    lyPositive: false,
    sparkline: [0.82, 0.78, 0.85, 0.76, 0.74, 0.79, 0.73, 0.71, 0.75, 0.72, 0.71, 0.70],
    cardPositive: false,
  },
  {
    label: 'CPA',
    value: '7.1',
    rawValue: 7.1,
    popChange: 0.06,
    popPositive: true,
    lyChange: 22.58,
    lyPositive: false,
    sparkline: [6.2, 6.5, 6.1, 6.8, 7.0, 6.6, 7.2, 7.3, 6.9, 7.1, 7.0, 7.1],
    cardPositive: false,
  },
  {
    label: 'TCPA',
    value: '2.23',
    rawValue: 2.23,
    popChange: 7.89,
    popPositive: true,
    lyChange: 72.91,
    lyPositive: false,
    sparkline: [1.6, 1.7, 1.5, 1.8, 1.9, 1.7, 2.0, 2.1, 1.9, 2.1, 2.2, 2.2],
    cardPositive: false,
  },
  {
    label: 'Conversion Rate',
    value: '9.49%',
    popChange: -9.57,
    popPositive: false,
    lyChange: -5.24,
    lyPositive: false,
    sparkline: [10.8, 10.5, 11.0, 10.2, 10.0, 10.6, 9.8, 9.6, 10.1, 9.7, 9.5, 9.5],
    cardPositive: false,
  },
  {
    label: 'Impressions',
    value: '257.0M',
    popChange: -18.44,
    popPositive: false,
    lyChange: 18.48,
    lyPositive: true,
    sparkline: [310, 295, 320, 285, 275, 300, 268, 260, 280, 265, 258, 257],
    cardPositive: false,
  },
  {
    label: 'Clicks',
    value: '1.22M',
    popChange: 3.77,
    popPositive: true,
    lyChange: 84.27,
    lyPositive: true,
    sparkline: [0.9, 0.95, 0.88, 1.0, 1.05, 0.98, 1.08, 1.12, 1.06, 1.15, 1.18, 1.22],
    cardPositive: true,
  },
  {
    label: 'CTR',
    value: '0.5%',
    popChange: 27.23,
    popPositive: true,
    lyChange: 55.53,
    lyPositive: true,
    sparkline: [0.32, 0.34, 0.31, 0.36, 0.38, 0.35, 0.40, 0.42, 0.39, 0.44, 0.47, 0.50],
    cardPositive: true,
  },
];

export const adSpendRunrateConfig = {
  daysInMonth: 31,
  currentDay: 21,
  dailySpend: [
    { day: 1, spend: 24800 },
    { day: 2, spend: 27100 },
    { day: 3, spend: 25400 },
    { day: 4, spend: 29300 },
    { day: 5, spend: 26800 },
    { day: 6, spend: 23600 },
    { day: 7, spend: 18200 },
    { day: 8, spend: 26400 },
    { day: 9, spend: 28900 },
    { day: 10, spend: 27600 },
    { day: 11, spend: 30100 },
    { day: 12, spend: 25800 },
    { day: 13, spend: 24200 },
    { day: 14, spend: 19500 },
    { day: 15, spend: 28700 },
    { day: 16, spend: 31200 },
    { day: 17, spend: 27400 },
    { day: 18, spend: 26100 },
    { day: 19, spend: 29800 },
    { day: 20, spend: 25600 },
    { day: 21, spend: 32300 },
  ],
};

export interface AdTypePerformance {
  type: string;
  adSpend: number;
  adSales: number;
  roas: number;
}

export const adTypeData: AdTypePerformance[] = [
  { type: 'Sponsored Products', adSpend: 89.12, adSales: 94.22, roas: 4.2 },
  { type: 'Sponsored Display', adSpend: 1.25, adSales: 0.59, roas: 1.9 },
  { type: 'Sponsored Brands', adSpend: 9.63, adSales: 5.20, roas: 2.1 },
];

export interface CategoryAdPerformance {
  category: string;
  adSpend: number;
  adSales: number;
}

export const categoryAdData: CategoryAdPerformance[] = [
  { category: 'LUNCH', adSpend: 15.88, adSales: 11.00 },
  { category: 'SOFT-PICKS', adSpend: 9.81, adSales: 9.92 },
  { category: 'NA', adSpend: 8.63, adSales: 8.82 },
  { category: 'Potties', adSpend: 6.11, adSales: 8.62 },
  { category: 'INTERDENTAL BRUSH', adSpend: 5.89, adSales: 5.20 },
  { category: 'HYDRATION', adSpend: 5.04, adSales: 3.99 },
  { category: 'TODDLER - DRINKING', adSpend: 4.46, adSales: 3.84 },
  { category: 'Original', adSpend: 3.70, adSales: 3.58 },
  { category: 'FPA', adSpend: 3.09, adSales: 3.46 },
  { category: 'FLOSSERS', adSpend: 2.88, adSales: 2.27 },
  { category: 'SONIC TB', adSpend: 2.78, adSales: 2.20 },
  { category: 'ELECTRIC TB', adSpend: 2.20, adSales: 2.17 },
];

export interface AdvertisingBrandRow {
  brand: string;
  impressions: number;
  impressionsPP: number;
  impressionsChangePP: number;
  clicks: number;
  clicksPP: number;
  clicksChangePP: number;
  adSpend: number;
  adSpendPP: number;
  adSpendChangePP: number;
  adSales: number;
  adSalesPP: number;
}

export const advertisingBrandData: AdvertisingBrandRow[] = [
  { brand: 'GUM', impressions: 84773819, impressionsPP: 108046590, impressionsChangePP: -21.54, clicks: 349636, clicksPP: 325401, clicksChangePP: 7.45, adSpend: 301300, adSpendPP: 285437, adSpendChangePP: 5.56, adSales: 915475, adSalesPP: 830000 },
  { brand: 'BBox', impressions: 94091643, impressionsPP: 138874800, impressionsChangePP: -32.25, clicks: 404825, clicksPP: 504271, clicksChangePP: -19.72, adSpend: 225957, adSpendPP: 321790, adSpendChangePP: -29.78, adSales: 597913, adSalesPP: 936000 },
  { brand: 'Baby Brezza', impressions: 6895975, impressionsPP: 8751323, impressionsChangePP: -21.20, clicks: 50536, clicksPP: 60733, clicksChangePP: -16.79, adSpend: 43772, adSpendPP: 54539, adSpendChangePP: -19.74, adSales: 480112, adSalesPP: 542000 },
  { brand: 'My Carry Potty', impressions: 7397598, impressionsPP: 482692, impressionsChangePP: 1432.57, clicks: 79256, clicksPP: 5307, clicksChangePP: 1393.42, adSpend: 665680, adSpendPP: 3043, adSpendChangePP: 2058.40, adSales: 323193, adSalesPP: 13000 },
  { brand: 'Snuggle Puppy', impressions: 8684452, impressionsPP: 3781095, impressionsChangePP: 129.68, clicks: 42988, clicksPP: 23534, clicksChangePP: 82.66, adSpend: 43996, adSpendPP: 25781, adSpendChangePP: 70.65, adSales: 168576, adSalesPP: 122000 },
  { brand: 'Krampouz', impressions: 1347783, impressionsPP: 0, impressionsChangePP: 0, clicks: 10694, clicksPP: 0, clicksChangePP: 0, adSpend: 5471, adSpendPP: 0, adSpendChangePP: 0, adSales: 123459, adSalesPP: 0 },
];

export const advertisingBrandTotals: AdvertisingBrandRow = {
  brand: 'Total',
  impressions: 256992389,
  impressionsPP: 315081397,
  impressionsChangePP: -18.44,
  clicks: 1223665,
  clicksPP: 1179186,
  clicksChangePP: 3.77,
  adSpend: 826214,
  adSpendPP: 879913,
  adSpendChangePP: -6.10,
  adSales: 3254837,
  adSalesPP: 3154000,
};
