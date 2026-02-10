export const subscriptionKPIs = [
  { label: 'Active Subscribers', value: '4,821', change: 12.4, positive: true },
  { label: 'MRR', value: '86.4k', rawValue: 86400, change: 8.6, positive: true },
  { label: 'Churn Rate', value: '3.2%', change: -0.8, positive: true },
  { label: 'ARPU', value: '17.92', rawValue: 17.92, change: 2.4, positive: true },
];

export interface SubscriptionPlan {
  plan: string;
  subscribers: number;
  mrr: number;
  churnRate: number;
  avgLifespan: number;
  growthRate: number;
  arpu: number;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  { plan: 'Essential Monthly', subscribers: 1840, mrr: 18400, churnRate: 5.2, avgLifespan: 8.4, growthRate: 6.2, arpu: 10.00 },
  { plan: 'Essential Annual', subscribers: 920, mrr: 6900, churnRate: 1.8, avgLifespan: 24.6, growthRate: 14.8, arpu: 7.50 },
  { plan: 'Premium Monthly', subscribers: 1120, mrr: 27440, churnRate: 3.4, avgLifespan: 12.2, growthRate: 9.6, arpu: 24.50 },
  { plan: 'Premium Annual', subscribers: 640, mrr: 12160, churnRate: 1.2, avgLifespan: 30.4, growthRate: 18.2, arpu: 19.00 },
  { plan: 'Enterprise', subscribers: 301, mrr: 21672, churnRate: 0.6, avgLifespan: 42.8, growthRate: 22.4, arpu: 72.00 },
];

export interface MRRMovement {
  month: string;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnMRR: number;
  netMRR: number;
}

export const mrrMovements: MRRMovement[] = [
  { month: 'Jan', newMRR: 8200, expansionMRR: 3100, contractionMRR: -1200, churnMRR: -2800, netMRR: 7300 },
  { month: 'Feb', newMRR: 7800, expansionMRR: 3400, contractionMRR: -1100, churnMRR: -2600, netMRR: 7500 },
  { month: 'Mar', newMRR: 9400, expansionMRR: 3800, contractionMRR: -1400, churnMRR: -2900, netMRR: 8900 },
  { month: 'Apr', newMRR: 8600, expansionMRR: 3200, contractionMRR: -1300, churnMRR: -2700, netMRR: 7800 },
  { month: 'May', newMRR: 10200, expansionMRR: 4100, contractionMRR: -1500, churnMRR: -3100, netMRR: 9700 },
  { month: 'Jun', newMRR: 9800, expansionMRR: 3900, contractionMRR: -1400, churnMRR: -2800, netMRR: 9500 },
  { month: 'Jul', newMRR: 11400, expansionMRR: 4600, contractionMRR: -1600, churnMRR: -3200, netMRR: 11200 },
  { month: 'Aug', newMRR: 10600, expansionMRR: 4200, contractionMRR: -1500, churnMRR: -3000, netMRR: 10300 },
  { month: 'Sep', newMRR: 12200, expansionMRR: 4800, contractionMRR: -1700, churnMRR: -3400, netMRR: 11900 },
  { month: 'Oct', newMRR: 11800, expansionMRR: 4400, contractionMRR: -1600, churnMRR: -3100, netMRR: 11500 },
  { month: 'Nov', newMRR: 13400, expansionMRR: 5200, contractionMRR: -1800, churnMRR: -3600, netMRR: 13200 },
  { month: 'Dec', newMRR: 14200, expansionMRR: 5600, contractionMRR: -1900, churnMRR: -3800, netMRR: 14100 },
];

export interface ChurnDetail {
  reason: string;
  count: number;
  percentage: number;
  mrrloss: number;
  trend: number;
}

export const churnReasons: ChurnDetail[] = [
  { reason: 'Price sensitivity', count: 42, percentage: 28.4, mrrloss: 1240, trend: -2.1 },
  { reason: 'Product not meeting needs', count: 34, percentage: 23.0, mrrloss: 980, trend: 1.4 },
  { reason: 'Switched to competitor', count: 28, percentage: 18.9, mrrloss: 1420, trend: 3.8 },
  { reason: 'Delivery issues', count: 18, percentage: 12.2, mrrloss: 540, trend: -4.2 },
  { reason: 'No longer needed', count: 14, percentage: 9.5, mrrloss: 320, trend: -1.6 },
  { reason: 'Other', count: 12, percentage: 8.1, mrrloss: 280, trend: 0.2 },
];
