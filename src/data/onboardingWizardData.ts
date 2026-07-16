export interface MarketplaceOption {
  code: string;
  label: string;
  flag: string;
  region: 'Americas' | 'Europe' | 'Asia Pacific' | 'Middle East';
  defaultCurrency: string;
}

export const marketplaceOptions: MarketplaceOption[] = [
  { code: 'US', label: 'United States', flag: '\u{1F1FA}\u{1F1F8}', region: 'Americas', defaultCurrency: 'USD' },
  { code: 'CA', label: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', region: 'Americas', defaultCurrency: 'CAD' },
  { code: 'MX', label: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}', region: 'Americas', defaultCurrency: 'MXN' },
  { code: 'BR', label: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}', region: 'Americas', defaultCurrency: 'BRL' },
  { code: 'UK', label: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', region: 'Europe', defaultCurrency: 'GBP' },
  { code: 'DE', label: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', region: 'Europe', defaultCurrency: 'EUR' },
  { code: 'FR', label: 'France', flag: '\u{1F1EB}\u{1F1F7}', region: 'Europe', defaultCurrency: 'EUR' },
  { code: 'IT', label: 'Italy', flag: '\u{1F1EE}\u{1F1F9}', region: 'Europe', defaultCurrency: 'EUR' },
  { code: 'ES', label: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', region: 'Europe', defaultCurrency: 'EUR' },
  { code: 'NL', label: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}', region: 'Europe', defaultCurrency: 'EUR' },
  { code: 'SE', label: 'Sweden', flag: '\u{1F1F8}\u{1F1EA}', region: 'Europe', defaultCurrency: 'SEK' },
  { code: 'PL', label: 'Poland', flag: '\u{1F1F5}\u{1F1F1}', region: 'Europe', defaultCurrency: 'PLN' },
  { code: 'JP', label: 'Japan', flag: '\u{1F1EF}\u{1F1F5}', region: 'Asia Pacific', defaultCurrency: 'JPY' },
  { code: 'AU', label: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', region: 'Asia Pacific', defaultCurrency: 'AUD' },
  { code: 'IN', label: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'Asia Pacific', defaultCurrency: 'INR' },
  { code: 'SG', label: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}', region: 'Asia Pacific', defaultCurrency: 'SGD' },
  { code: 'AE', label: 'UAE', flag: '\u{1F1E6}\u{1F1EA}', region: 'Middle East', defaultCurrency: 'AED' },
  { code: 'SA', label: 'Saudi Arabia', flag: '\u{1F1F8}\u{1F1E6}', region: 'Middle East', defaultCurrency: 'SAR' },
];

export const orderVolumeOptions = [
  { value: 'under_1k', label: 'Under 1,000 / month' },
  { value: '1k_10k', label: '1,000 \u2013 10,000 / month' },
  { value: '10k_50k', label: '10,000 \u2013 50,000 / month' },
  { value: '50k_plus', label: '50,000+ / month' },
];

export const currencyOptions = [
  { value: 'EUR', label: 'Euro', symbol: '\u20AC' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'GBP', label: 'British Pound', symbol: '\u00A3' },
];

export const fiscalYearMonths = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const adTypeOptions = [
  { id: 'sp', label: 'Sponsored Products' },
  { id: 'sb', label: 'Sponsored Brands' },
  { id: 'sd', label: 'Sponsored Display' },
  { id: 'dsp', label: 'DSP' },
];

export const toolOptions = [
  { id: 'helium10', label: 'Helium 10' },
  { id: 'sellerboard', label: 'Sellerboard' },
  { id: 'myrealprofit', label: 'MyRealProfit' },
  { id: 'keepa', label: 'Keepa' },
  { id: 'kapoq', label: 'Kapoq' },
  { id: 'perpetua', label: 'Perpetua' },
  { id: 'pacvue', label: 'Pacvue' },
  { id: 'custom', label: 'Custom' },
  { id: 'none', label: 'None' },
];

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  description: string;
  valueProp?: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  joke?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    annualPrice: 79,
    monthlyPrice: 99,
    description: 'For brands getting started with data-driven decisions',
    valueProp: 'Unmatched value',
    features: [
      'Up to 5,000 orders/month',
      '1 region (Americas or Europe, UK included)',
      '1 seller account',
      '100 ASINs',
      '3 users',
      'All 6 pillar overview dashboards',
      'Period-over-period & YoY comparisons',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    annualPrice: 199,
    monthlyPrice: 249,
    description: 'Full platform access for growing brands',
    valueProp: 'Replaces a \u20AC600+/mo tool stack',
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Up to 25,000 orders/month',
      'All regions (Americas + Europe)',
      '2 seller accounts',
      '500 ASINs',
      '10 users',
      'Full platform — all 6 pillars with full depth',
      'DeepDive drill-downs with Excel export',
      'Content Tracker with case assistant',
      'Smart alerts',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    annualPrice: 499,
    monthlyPrice: null,
    description: 'For large sellers and agencies',
    valueProp: 'Replaces a \u20AC1,500+/mo tool stack',
    features: [
      'Up to 100,000 orders/month',
      'Up to 5 seller accounts (custom above)',
      '1,000 ASINs',
      'Unlimited users',
      'Everything in Growth',
      'White-label exports',
      'API access',
      'Dedicated onboarding',
      'Priority support',
    ],
  },
  {
    id: 'analog',
    name: 'Analog',
    annualPrice: 0,
    monthlyPrice: 0,
    description: 'For the truly old school',
    joke: true,
    features: [
      'Paper-based analytics platform',
      'Carrier pigeon alerts',
      'Abacus-powered calculations',
      'Zero server costs',
    ],
  },
];

export const sellerCentralSteps = [
  {
    title: 'Log in to Amazon Seller Central',
    description: 'Go to sellercentral.amazon.com and sign in with your main admin account.',
  },
  {
    title: 'Open User Permissions',
    description: 'Click the \u2699\uFE0F Settings gear icon in the top right, then select "User Permissions".',
  },
  {
    title: 'Add Clarisix as a new user',
    description: 'Under "Add a New User", enter this email address:',
    copyableText: 'connect@clarisix.com',
  },
  {
    title: 'Set the right permissions',
    description: 'When prompted, grant view access to these categories:',
  },
  {
    title: 'Send the invitation',
    description: 'Click "Send Invite" \u2014 we\u2019ll accept it on our side and start connecting your data.',
  },
];

export const permissionItems = [
  'Orders and reports',
  'Advertising',
  'Inventory',
  'Financial data / payments',
];

export const faqItems = [
  {
    question: 'Is my data secure?',
    answer: 'Your data is encrypted in transit and at rest. We use read-only access and never store your Amazon credentials.',
  },
  {
    question: 'Can I revoke access later?',
    answer: 'Yes, anytime. Just remove connect@clarisix.com from your Seller Central User Permissions.',
  },
  {
    question: 'What if I have multiple accounts?',
    answer: 'Repeat the invite for each account. We\u2019ll merge all marketplace data automatically in your dashboard.',
  },
  {
    question: 'I need help with this step',
    answer: 'Email us at support@clarisix.com or book a 15-minute onboarding call with our team.',
  },
];

export const timelinePhases = [
  {
    label: 'Sign in with Amazon \u2014 Selling Partner & Advertising',
    duration: '~2 min \u00b7 read-only',
    icon: 'Key',
  },
  {
    label: 'We pull your orders, ads, inventory & catalog automatically',
    duration: 'Starts instantly',
    icon: 'Database',
  },
  {
    label: 'Your dashboard goes live',
    duration: 'Typically within 24–48 hours',
    icon: 'Rocket',
  },
];

export const wizardStepsMeta = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Business' },
  { id: 3, label: 'Connect' },
  { id: 4, label: 'Preferences' },
  { id: 5, label: 'Done' },
];
