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

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'inventory' | 'advertising' | 'customer' | 'content';

export interface HomeAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  timestamp: string;
  navSection: string;
  navSub: string;
}

export const homeAlerts: HomeAlert[] = [
  {
    id: 'a1',
    severity: 'critical',
    category: 'inventory',
    title: '3 ASINs at risk of stockout',
    description: 'B0DEMO001X, B0DEMO002X, and B0DEMO003X will run out within 7 days based on current velocity.',
    timestamp: '2 hours ago',
    navSection: 'Inventory',
    navSub: 'Overview',
  },
  {
    id: 'a2',
    severity: 'critical',
    category: 'customer',
    title: 'Negative review spike on B0DEMO001X',
    description: '5 one-star reviews in the last 48 hours — average rating dropped from 4.6 to 4.3.',
    timestamp: '5 hours ago',
    navSection: 'Customer Experience',
    navSub: 'Ratings and Reviews',
  },
  {
    id: 'a3',
    severity: 'warning',
    category: 'advertising',
    title: 'Ad budget overspend',
    description: 'Advertising spend is at 112% of the planned budget for this period ($3,204 of $2,880).',
    timestamp: '1 day ago',
    navSection: 'Advertising',
    navSub: 'Overview',
  },
  {
    id: 'a4',
    severity: 'warning',
    category: 'content',
    title: '2 ASINs below content threshold',
    description: 'B0DEMO008X (58/100) and B0DEMO009X (64/100) dropped below the 70-point content score target.',
    timestamp: '1 day ago',
    navSection: 'Content',
    navSub: 'Content App Tracking',
  },
  {
    id: 'a5',
    severity: 'info',
    category: 'advertising',
    title: 'TACOS improved by 1.7pp',
    description: 'Total advertising cost of sales decreased from 20.1% to 18.4% compared to the previous period.',
    timestamp: '3 days ago',
    navSection: 'Advertising',
    navSub: 'Overview',
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
  { name: 'Personal Care', value: 28940, previous: 26500 },
  { name: 'Home & Kitchen', value: 22180, previous: 23800 },
  { name: 'Electronics Pro', value: 18670, previous: 17200 },
  { name: 'Electronics Lite', value: 15320, previous: 16100 },
  { name: 'Fashion Bags', value: 12890, previous: 11400 },
  { name: 'Wellness', value: 11540, previous: 12200 },
  { name: 'Phone Accessories', value: 9870, previous: 9100 },
  { name: 'Chargers', value: 7650, previous: 8200 },
  { name: 'Screen Protectors', value: 5420, previous: 4900 },
  { name: 'Travel Kits', value: 4310, previous: 4700 },
];

export interface ASINDataItem {
  name: string;
  productName: string;
  value: number;
  previous: number;
  skus: { name: string; value: number; previous: number }[];
}

export const salesByASIN: ASINDataItem[] = [
  { name: 'B0DEMO001X', productName: 'Everyday Essentials Pack M/L', value: 14520, previous: 13200, skus: [
    { name: 'SKU-01A', value: 8710, previous: 7900 },
    { name: 'SKU-01B', value: 5810, previous: 5300 },
  ]},
  { name: 'B0DEMO002X', productName: 'Premium Container Set Blue', value: 12340, previous: 13100, skus: [
    { name: 'SKU-02A', value: 7400, previous: 7800 },
    { name: 'SKU-02B', value: 4940, previous: 5300 },
  ]},
  { name: 'B0DEMO003X', productName: 'Smart Device Pro 740 Black', value: 11890, previous: 10800, skus: [
    { name: 'SKU-03A', value: 7130, previous: 6500 },
    { name: 'SKU-03B', value: 4760, previous: 4300 },
  ]},
  { name: 'B0DEMO004X', productName: 'Smart Device Lite X3', value: 9760, previous: 10400, skus: [
    { name: 'SKU-04A', value: 5860, previous: 6200 },
    { name: 'SKU-04B', value: 3900, previous: 4200 },
  ]},
  { name: 'B0DEMO005X', productName: 'Classic Carry Bag Small', value: 8430, previous: 7600, skus: [
    { name: 'SKU-05A', value: 5060, previous: 4560 },
    { name: 'SKU-05B', value: 3370, previous: 3040 },
  ]},
  { name: 'B0DEMO006X', productName: 'Daily Wellness Drops 50ml', value: 7290, previous: 7800, skus: [
    { name: 'SKU-06A', value: 4370, previous: 4680 },
    { name: 'SKU-06B', value: 2920, previous: 3120 },
  ]},
  { name: 'B0DEMO007X', productName: 'Protective Cover Ultra', value: 6180, previous: 5700, skus: [
    { name: 'SKU-07A', value: 3710, previous: 3420 },
    { name: 'SKU-07B', value: 2470, previous: 2280 },
  ]},
  { name: 'B0DEMO008X', productName: 'Fast Charger 30W Compact', value: 5540, previous: 5900, skus: [
    { name: 'SKU-08A', value: 3320, previous: 3540 },
    { name: 'SKU-08B', value: 2220, previous: 2360 },
  ]},
  { name: 'B0DEMO009X', productName: 'Clear Shield 2-Pack', value: 4870, previous: 4500, skus: [
    { name: 'SKU-09A', value: 2920, previous: 2700 },
    { name: 'SKU-09B', value: 1950, previous: 1800 },
  ]},
  { name: 'B0DEMO010X', productName: 'Compact Travel Pouch', value: 3920, previous: 4100, skus: [
    { name: 'SKU-10A', value: 2350, previous: 2460 },
    { name: 'SKU-10B', value: 1570, previous: 1640 },
  ]},
];

export const filterOptions = {
  accounts: ['All Accounts', 'Account 1', 'Account 2'],
  marketplace: ['All Marketplaces', 'Amazon DE', 'Amazon FR', 'Amazon UK', 'Amazon US'],
  brand: ['All Brands', 'Brand A', 'Brand B', 'Brand C'],
  category: ['All Categories', 'Electronics', 'Wellness', 'Accessories'],
  subcategory: ['All Subcategories', 'Pro', 'Lite', 'Standard'],
  tag: ['All Tags', 'Bestseller', 'New', 'Seasonal'],
  asin: ['All ASINs', 'B0DEMO001X', 'B0DEMO002X', 'B0DEMO003X'],
  sku: ['All SKUs', 'SKU-01A', 'SKU-01B', 'SKU-02A', 'SKU-03A', 'SKU-04A'],

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
