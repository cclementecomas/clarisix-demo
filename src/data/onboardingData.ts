import type { OnboardingStatus, SyncCategory } from '../contexts/OnboardingContext';

export const accountOnboardingStatus: Record<string, OnboardingStatus> = {
  'All Accounts': 'ready',
  'Onboarded Account': 'ready',
  'Connected Account': 'syncing',
  'New Account': 'wizard',
};

export const defaultSyncCategories: SyncCategory[] = [
  { label: 'Account connected', status: 'done' },
  { label: 'Sales data', status: 'done' },
  { label: 'Advertising data', status: 'syncing' },
  { label: 'Historical data', status: 'syncing' },
  { label: 'Inventory data', status: 'pending' },
];

export const onboardingContent = {
  pending_connection: {
    headline: "We're getting everything ready for you",
    subtext:
      'Our team will connect your Amazon account within the next 24 hours. We\u2019ll email you as soon as your data starts loading.',
    estimatedTime: 'Typically under 24 hours',
  },
  connecting: {
    headline: 'Connecting your Amazon account',
    subtext:
      "We're setting up your data pipeline now. This usually takes 1\u20132 hours.",
    estimatedTime: '1\u20132 hours',
  },
  syncing: {
    headline: 'Your data is loading',
    subtext:
      'Core sales and advertising data is almost ready. Full historical data may take up to 48 hours.',
  },
  error: {
    headline: 'We need a little more info',
    subtext:
      "There's an issue with your account setup. Our team has been notified and will reach out shortly.",
  },
};

export const demoStatusOptions: { value: OnboardingStatus; label: string }[] = [
  { value: 'wizard', label: 'Wizard (onboarding)' },
  { value: 'ready', label: 'Ready (dashboard)' },
  { value: 'pending_connection', label: 'Pending Connection' },
  { value: 'connecting', label: 'Connecting' },
  { value: 'syncing', label: 'Syncing' },
  { value: 'error', label: 'Error' },
];
