import { useState } from 'react';
import {
  User,
  Users,
  Shield,
  CreditCard,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import PreferencesSection from './PreferencesSection';
import TeamSection from './TeamSection';
import SecuritySection from './SecuritySection';
import SubscriptionSection from './SubscriptionSection';
import InvoicesSection from './InvoicesSection';
import DangerZoneSection from './DangerZoneSection';

const tabs = [
  { id: 'preferences', label: 'Preferences', icon: User },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('preferences');

  const renderSection = () => {
    switch (activeTab) {
      case 'preferences':
        return <PreferencesSection />;
      case 'team':
        return <TeamSection />;
      case 'security':
        return <SecuritySection />;
      case 'subscription':
        return <SubscriptionSection />;
      case 'invoices':
        return <InvoicesSection />;
      case 'danger':
        return <DangerZoneSection />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account preferences and configuration
        </p>
      </div>

      <div className="flex gap-6">
        <nav className="w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {tabs.map((tab, i) => {
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
                        : isDanger
                          ? 'text-gray-400'
                          : 'text-gray-400'
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">{renderSection()}</div>
      </div>
    </div>
  );
}
