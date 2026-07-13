import { useEffect, useState } from 'react';
import {
  User,
  Users,
  Shield,
  CreditCard,
  FileText,
  AlertTriangle,
  Settings2,
  Boxes,
  DollarSign,
  Cable,
  Tag,
  Receipt,
} from 'lucide-react';
import PreferencesSection from './PreferencesSection';
import TeamSection from './TeamSection';
import SecuritySection from './SecuritySection';
import SubscriptionSection from './SubscriptionSection';
import InvoicesSection from './InvoicesSection';
import DangerZoneSection from './DangerZoneSection';
import AccountSection from './AccountSection';
import ProductsSection from './ProductsSection';
import KeywordRulesSection from './KeywordRulesSection';
import OverheadsSection from './OverheadsSection';
import COGSManager from '../COGSManager';
import Connectors from '../Connectors';

type TabId =
  | 'products' | 'costs' | 'overheads' | 'keywordRules' | 'account' | 'connections'
  | 'preferences' | 'team' | 'security' | 'subscription' | 'invoices' | 'danger';

type SettingsMode = 'data' | 'account' | 'all';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabGroup {
  label: string;
  mode: 'data' | 'account';
  tabs: TabDef[];
}

const groups: TabGroup[] = [
  {
    label: 'Data Setup',
    mode: 'data',
    tabs: [
      { id: 'products',     label: 'Products',          icon: Boxes },
      { id: 'costs',        label: 'Costs',             icon: DollarSign },
      { id: 'overheads',    label: 'Overheads',         icon: Receipt },
      { id: 'keywordRules', label: 'Keyword rules',     icon: Tag },
      { id: 'account',      label: 'Account specifics', icon: Settings2 },
      { id: 'connections',  label: 'Connections',       icon: Cable },
    ],
  },
  {
    label: 'Account',
    mode: 'account',
    tabs: [
      { id: 'preferences',  label: 'Preferences',  icon: User },
      { id: 'team',         label: 'Team',         icon: Users },
      { id: 'security',     label: 'Security',     icon: Shield },
      { id: 'subscription', label: 'Subscription', icon: CreditCard },
      { id: 'invoices',     label: 'Invoices',     icon: FileText },
      { id: 'danger',       label: 'Danger Zone',  icon: AlertTriangle },
    ],
  },
];

const MODE_TITLES: Record<SettingsMode, { title: string; subtitle: string }> = {
  data:    { title: 'Data',     subtitle: 'Map products, set costs, and manage data sources' },
  account: { title: 'Settings', subtitle: 'Manage account-level preferences and access' },
  all:     { title: 'Settings', subtitle: 'Manage data foundations and account-level preferences' },
};

export default function Settings({
  initialTab,
  mode = 'all',
}: {
  initialTab?: TabId;
  mode?: SettingsMode;
} = {}) {
  const visibleGroups = mode === 'all' ? groups : groups.filter((g) => g.mode === mode);
  const defaultTab = visibleGroups[0]?.tabs[0]?.id ?? 'preferences';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? defaultTab);

  // If parent supplies a new initialTab (e.g. user deep-linked from Profitability banner)
  // honor it on mount/change.
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const renderSection = () => {
    switch (activeTab) {
      case 'products':     return <ProductsSection />;
      case 'costs':        return <COGSManager />;
      case 'overheads':    return <OverheadsSection />;
      case 'keywordRules': return <KeywordRulesSection />;
      case 'account':      return <AccountSection />;
      case 'connections':  return <Connectors />;
      case 'preferences':  return <PreferencesSection />;
      case 'team':         return <TeamSection />;
      case 'security':     return <SecuritySection />;
      case 'subscription': return <SubscriptionSection />;
      case 'invoices':     return <InvoicesSection />;
      case 'danger':       return <DangerZoneSection />;
    }
  };

  const titles = MODE_TITLES[mode];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{titles.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{titles.subtitle}</p>
      </div>

      {mode === 'data' ? (
        // In-page nav is redundant: the left sidebar's Admin → Data already
        // exposes the same tabs.
        <div className="min-w-0">{renderSection()}</div>
      ) : (
        <div className="flex gap-6">
          <nav className="w-52 flex-shrink-0 space-y-3">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                {visibleGroups.length > 1 && (
                  <div className="px-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {group.label}
                    </span>
                  </div>
                )}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {group.tabs.map((tab, i) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isDanger = tab.id === 'danger';

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-150 relative ${
                          i > 0 ? 'border-t border-gray-100' : ''
                        } ${
                          isActive
                            ? isDanger
                              ? 'bg-red-50 text-red-700'
                              : 'bg-cx-50 text-cx-700'
                            : isDanger
                              ? 'text-gray-500 hover:bg-red-50/50 hover:text-red-600'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {isActive && (
                          <span
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full ${
                              isDanger ? 'bg-red-500' : 'bg-cx-500'
                            }`}
                          />
                        )}
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive
                              ? isDanger
                                ? 'text-red-500'
                                : 'text-cx-500'
                              : 'text-gray-400'
                          }`}
                        />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1 min-w-0">{renderSection()}</div>
        </div>
      )}
    </div>
  );
}

export type { TabId as SettingsTabId };
