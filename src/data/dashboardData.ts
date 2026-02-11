export const kpiData = [
  {
    label: 'Sales',
    value: '122.1k',
    rawValue: 122100,
    positive: true,
    popChange: 3.20,
    popPositive: true,
    lyChange: 14.56,
    lyPositive: true,
    sparkline: [68, 72, 65, 78, 82, 74, 88, 91, 85, 95, 102, 110],
    navSection: 'Sales',
    navSub: 'Overview',
  },
  {
    label: 'TACOS',
    value: '18.4%',
    positive: true,
    popChange: -1.70,
    popPositive: true,
    lyChange: -8.32,
    lyPositive: true,
    sparkline: [24, 22, 25, 21, 20, 23, 19, 21, 18, 19, 18, 18],
    navSection: 'Advertising',
    navSub: 'Overview',
  },
  {
    label: 'Profitability',
    value: '31.2k',
    rawValue: 31200,
    positive: true,
    popChange: 5.10,
    popPositive: true,
    lyChange: 22.41,
    lyPositive: true,
    sparkline: [18, 20, 17, 22, 24, 21, 26, 28, 25, 29, 30, 31],
    navSection: 'Profitability',
    navSub: 'Overview',
  },
  {
    label: 'Out of Stock',
    value: '4.2%',
    positive: false,
    popChange: 1.30,
    popPositive: false,
    lyChange: 12.80,
    lyPositive: false,
    sparkline: [2.8, 3.1, 2.5, 3.4, 3.0, 3.6, 3.2, 3.8, 3.5, 4.0, 3.9, 4.2],
    navSection: 'Inventory',
    navSub: 'Overview',
  },
  {
    label: 'Content Score',
    value: '87/100',
    positive: true,
    popChange: 2.80,
    popPositive: true,
    lyChange: 6.10,
    lyPositive: true,
    sparkline: [72, 74, 76, 75, 78, 80, 79, 82, 84, 83, 86, 87],
    navSection: 'Content',
    navSub: 'Content App Tracking',
  },
  {
    label: 'Customer Experience',
    value: '4.6/5',
    positive: true,
    popChange: 0.40,
    popPositive: true,
    lyChange: 4.55,
    lyPositive: true,
    sparkline: [4.1, 4.0, 4.2, 4.1, 4.3, 4.2, 4.4, 4.3, 4.5, 4.4, 4.5, 4.6],
    navSection: 'Customer Experience',
    navSub: 'Ratings and Reviews',
  },
];

export const budgetData = [
  { day: 1, actual: 0, forecast: 0 },
  { day: 3, actual: 320, forecast: 310 },
  { day: 6, actual: 780, forecast: 720 },
  { day: 9, actual: 1120, forecast: 1080 },
  { day: 11, actual: 1540, forecast: 1440 },
  { day: 14, actual: 1980, forecast: 1800 },
  { day: 16, actual: 2340, forecast: 2160 },
  { day: 19, actual: 2780, forecast: 2520 },
  { day: 21, actual: 3204, forecast: 2880 },
  { day: 23, actual: null, forecast: 3240 },
  { day: 25, actual: null, forecast: 3600 },
  { day: 28, actual: null, forecast: 3960 },
  { day: 30, actual: null, forecast: 4507 },
];

export type Granularity = 'day' | 'week' | 'month' | 'quarter';

export interface SalesDataPoint {
  label: string;
  adSales: number;
  organicSales: number;
}

export const salesOverviewByGranularity: Record<Granularity, SalesDataPoint[]> = {
  day: [
    { label: 'Nov 12', adSales: 1420, organicSales: 2180 },
    { label: 'Nov 14', adSales: 1580, organicSales: 2340 },
    { label: 'Nov 16', adSales: 1350, organicSales: 2060 },
    { label: 'Nov 18', adSales: 1680, organicSales: 2520 },
    { label: 'Nov 20', adSales: 1920, organicSales: 2880 },
    { label: 'Nov 22', adSales: 2100, organicSales: 3150 },
    { label: 'Nov 24', adSales: 1760, organicSales: 2640 },
    { label: 'Nov 26', adSales: 1540, organicSales: 2310 },
    { label: 'Nov 28', adSales: 1890, organicSales: 2840 },
    { label: 'Nov 30', adSales: 2050, organicSales: 3080 },
    { label: 'Dec 2', adSales: 2240, organicSales: 3360 },
    { label: 'Dec 4', adSales: 1980, organicSales: 2970 },
    { label: 'Dec 6', adSales: 2310, organicSales: 3470 },
    { label: 'Dec 8', adSales: 2480, organicSales: 3720 },
    { label: 'Dec 10', adSales: 2150, organicSales: 3230 },
  ],
  week: [
    { label: 'W46', adSales: 9800, organicSales: 14700 },
    { label: 'W47', adSales: 10600, organicSales: 15900 },
    { label: 'W48', adSales: 11200, organicSales: 16800 },
    { label: 'W49', adSales: 12400, organicSales: 18600 },
    { label: 'W50', adSales: 13100, organicSales: 19650 },
  ],
  month: [
    { label: 'Jan', adSales: 34000, organicSales: 51000 },
    { label: 'Feb', adSales: 36000, organicSales: 53000 },
    { label: 'Mar', adSales: 42000, organicSales: 64000 },
    { label: 'Apr', adSales: 40000, organicSales: 68000 },
    { label: 'May', adSales: 45000, organicSales: 70000 },
    { label: 'Jun', adSales: 48000, organicSales: 68000 },
    { label: 'Jul', adSales: 46000, organicSales: 76000 },
    { label: 'Aug', adSales: 44000, organicSales: 73000 },
    { label: 'Sep', adSales: 50000, organicSales: 79000 },
    { label: 'Oct', adSales: 52000, organicSales: 84000 },
    { label: 'Nov', adSales: 58000, organicSales: 95000 },
    { label: 'Dec', adSales: 64000, organicSales: 106000 },
  ],
  quarter: [
    { label: 'Q1', adSales: 112000, organicSales: 168000 },
    { label: 'Q2', adSales: 133000, organicSales: 206000 },
    { label: 'Q3', adSales: 140000, organicSales: 228000 },
    { label: 'Q4', adSales: 174000, organicSales: 285000 },
  ],
};

export const salesByMarketplace = [
  { name: 'Germany', value: 38420, previous: 35200 },
  { name: 'France', value: 24310, previous: 26100 },
  { name: 'United Kingdom', value: 21890, previous: 20400 },
  { name: 'United States', value: 18740, previous: 19800 },
  { name: 'Italy', value: 12560, previous: 11200 },
  { name: 'Spain', value: 9870, previous: 10500 },
  { name: 'Netherlands', value: 7430, previous: 6800 },
  { name: 'Belgium', value: 4210, previous: 4600 },
  { name: 'Canada', value: 3890, previous: 3200 },
  { name: 'Poland', value: 2760, previous: 2900 },
  { name: 'Ireland', value: 1540, previous: 1380 },
  { name: 'Sweden', value: 1120, previous: 1250 },
];

export const salesByCategory = [
  { name: 'Soft Picks', value: 28940, previous: 26500 },
  { name: 'Lunch Boxes', value: 22180, previous: 23800 },
  { name: 'Compact Camera', value: 18670, previous: 17200 },
  { name: 'Bridge Camera', value: 15320, previous: 16100 },
  { name: 'Crossbody Bags', value: 12890, previous: 11400 },
  { name: 'Supplements', value: 11540, previous: 12200 },
  { name: 'Phone Cases', value: 9870, previous: 9100 },
  { name: 'Chargers', value: 7650, previous: 8200 },
  { name: 'Screen Protectors', value: 5420, previous: 4900 },
  { name: 'Travel Kits', value: 4310, previous: 4700 },
];

export const salesByASIN = [
  { name: 'B08K3XTRY7', value: 14520, previous: 13200 },
  { name: 'B09MLNHK7P', value: 12340, previous: 13100 },
  { name: 'B07XQPNHZ2', value: 11890, previous: 10800 },
  { name: 'B08FJ2KXCN', value: 9760, previous: 10400 },
  { name: 'B09GKP4HLM', value: 8430, previous: 7600 },
  { name: 'B08NWDV37K', value: 7290, previous: 7800 },
  { name: 'B07YHNHT1C', value: 6180, previous: 5700 },
  { name: 'B09TPLX2NQ', value: 5540, previous: 5900 },
  { name: 'B08LMWKP4J', value: 4870, previous: 4500 },
  { name: 'B09HJQRN6V', value: 3920, previous: 4100 },
];

export const filterOptions = {
  accounts: ['All Accounts', 'Account 1', 'Account 2'],
  marketplace: ['All Marketplaces', 'Amazon DE', 'Amazon FR', 'Amazon UK', 'Amazon US'],
  brand: ['All Brands', 'Brand A', 'Brand B', 'Brand C'],
  category: ['All Categories', 'Electronics', 'Supplements', 'Accessories'],
  subcategory: ['All Subcategories', 'Compact', 'Bridge', 'DSLR'],
  tag: ['All Tags', 'Bestseller', 'New', 'Seasonal'],
  asin: ['All ASINs', 'B08K3XTRY7', 'B09MLNHK7P', 'B07XQPNHZ2'],
};

export const menuItems = [
  {
    label: 'Sales',
    icon: 'BarChart3',
    subItems: ['Overview', 'Deepdive', 'Targets', 'Trends'],
    defaultSub: 'Overview',
  },
  {
    label: 'Advertising',
    icon: 'Megaphone',
    subItems: ['Overview', 'Deepdive', 'DSP', 'AMC', 'SQP', 'Promotions'],
    defaultSub: 'Overview',
  },
  {
    label: 'Inventory',
    icon: 'Package',
    subItems: ['Overview'],
    defaultSub: 'Overview',
  },
  {
    label: 'Profitability',
    icon: 'TrendingUp',
    subItems: ['Overview'],
    defaultSub: 'Overview',
  },
  {
    label: 'Content',
    icon: 'FileText',
    subItems: ['Content App Tracking'],
    defaultSub: 'Content App Tracking',
  },
  {
    label: 'Customer Experience',
    icon: 'Star',
    subItems: ['Ratings and Reviews', 'Retention', 'Subscriptions'],
    defaultSub: 'Ratings and Reviews',
  },
];
