export interface Connector {
  id: string;
  name: string;
  description: string;
  category: ConnectorCategory;
  available: boolean;
  configured: boolean;
  iconBg: string;
  iconText: string;
  letter: string;
}

export type ConnectorCategory =
  | 'Sales Channels'
  | 'Advertising'
  | 'Analytics & Attribution'
  | 'Marketing'
  | 'Other Datasources';

export const categories: ConnectorCategory[] = [
  'Sales Channels',
  'Advertising',
  'Analytics & Attribution',
  'Marketing',
  'Other Datasources',
];

export const connectors: Connector[] = [
  {
    id: 'amazon-sp-api',
    name: 'Amazon SP-API',
    description: 'Seller & vendor data from Amazon Marketplace',
    category: 'Sales Channels',
    available: true,
    configured: false,
    iconBg: 'bg-[#FF9900]',
    iconText: 'text-white',
    letter: 'a',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Multi-channel e-commerce platform',
    category: 'Sales Channels',
    available: false,
    configured: false,
    iconBg: 'bg-[#96BF48]',
    iconText: 'text-white',
    letter: 'S',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Open-source e-commerce for WordPress',
    category: 'Sales Channels',
    available: false,
    configured: false,
    iconBg: 'bg-[#7F54B3]',
    iconText: 'text-white',
    letter: 'W',
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    description: 'Enterprise e-commerce platform',
    category: 'Sales Channels',
    available: false,
    configured: false,
    iconBg: 'bg-[#34313F]',
    iconText: 'text-white',
    letter: 'B',
  },
  {
    id: 'amazon-ads',
    name: 'Amazon Ads',
    description: 'Advertising platform from Amazon',
    category: 'Advertising',
    available: true,
    configured: false,
    iconBg: 'bg-[#FF9900]',
    iconText: 'text-white',
    letter: 'a',
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Online advertising platform from Google',
    category: 'Advertising',
    available: false,
    configured: false,
    iconBg: 'bg-[#4285F4]',
    iconText: 'text-white',
    letter: 'G',
  },
  {
    id: 'facebook-ads',
    name: 'Facebook Ads',
    description: 'Online advertising platform from Meta',
    category: 'Advertising',
    available: false,
    configured: false,
    iconBg: 'bg-[#1877F2]',
    iconText: 'text-white',
    letter: 'f',
  },
  {
    id: 'tiktok-ads',
    name: 'TikTok Ads',
    description: 'Online advertising platform from TikTok',
    category: 'Advertising',
    available: false,
    configured: false,
    iconBg: 'bg-[#010101]',
    iconText: 'text-white',
    letter: 'T',
  },
  {
    id: 'google-analytics-4',
    name: 'Google Analytics 4',
    description: 'Tracking and analytics platform',
    category: 'Analytics & Attribution',
    available: false,
    configured: false,
    iconBg: 'bg-[#E37400]',
    iconText: 'text-white',
    letter: 'G',
  },
  {
    id: 'google-search-console',
    name: 'Google Search Console',
    description: 'Search performance and indexing insights',
    category: 'Analytics & Attribution',
    available: false,
    configured: false,
    iconBg: 'bg-[#4285F4]',
    iconText: 'text-white',
    letter: 'G',
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'Heatmaps, recordings, and feedback',
    category: 'Analytics & Attribution',
    available: false,
    configured: false,
    iconBg: 'bg-[#FD3A5C]',
    iconText: 'text-white',
    letter: 'H',
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Email & SMS marketing automation',
    category: 'Marketing',
    available: false,
    configured: false,
    iconBg: 'bg-[#24BE74]',
    iconText: 'text-white',
    letter: 'K',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and audience management',
    category: 'Marketing',
    available: false,
    configured: false,
    iconBg: 'bg-[#FFE01B]',
    iconText: 'text-gray-900',
    letter: 'M',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Import custom data from spreadsheets',
    category: 'Other Datasources',
    available: false,
    configured: false,
    iconBg: 'bg-[#0F9D58]',
    iconText: 'text-white',
    letter: 'G',
  },
  {
    id: 'csv-upload',
    name: 'CSV Upload',
    description: 'Bulk import data from CSV files',
    category: 'Other Datasources',
    available: false,
    configured: false,
    iconBg: 'bg-gray-500',
    iconText: 'text-white',
    letter: 'C',
  },
];
