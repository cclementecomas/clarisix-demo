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
    headline: 'Preparing your workspace',
    subtext: 'Setting things up \u2014 your data starts loading in a few seconds.',
    estimatedTime: 'A few seconds',
  },
  connecting: {
    headline: 'Finishing your authorization',
    subtext: 'Securing your read-only tokens with Amazon. This only takes a moment.',
    estimatedTime: 'Under a minute',
  },
  syncing: {
    headline: 'Loading your Amazon data',
    subtext:
      "Your Selling Partner and Advertising accounts are authorized \u2014 we're pulling every report now. Full history typically lands within 24\u201348 hours, and we'll email you when it's ready.",
  },
  error: {
    headline: 'A connection needs your attention',
    subtext:
      "One of your Amazon authorizations expired or was declined. Reconnect it and we'll resume loading right away.",
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
