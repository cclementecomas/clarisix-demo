import { useState } from 'react';
import {
  BarChart3,
  Megaphone,
  Package,
  TrendingUp,
  FileText,
  Star,
  ChevronRight,
  ChevronDown,
  Settings,
  HelpCircle,
  PanelLeftClose,
  Building2,
  House,
  Clock,
  Database,
  Zap,
  FlaskConical,
} from 'lucide-react';
import { menuItems, adminItems, filterOptions } from '../data/dashboardData';
import { useOnboarding } from '../contexts/OnboardingContext';
import type { OnboardingStatus } from '../contexts/OnboardingContext';
import { demoStatusOptions } from '../data/onboardingData';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  BarChart3,
  Megaphone,
  Package,
  TrendingUp,
  FileText,
  Star,
  Database,
  Zap,
};

interface SidebarProps {
  activeSection: string;
  activeSub: string;
  collapsed: boolean;
  onSectionChange: (section: string) => void;
  onSubChange: (sub: string) => void;
  onToggleCollapse: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  /** Active sub label inside the Admin section (e.g. "Products"). */
  activeAdminSub?: string;
  /** Open a sub-item under Admin (e.g. ('Data', 'Products')). */
  onAdminNavigate?: (section: string, sub: string) => void;
}

function AccountSelector() {
  const { setSelectedAccount } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(filterOptions.accounts[0]);

  return (
    <div className="px-3 py-3 border-b border-white/[0.06]">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] transition-colors text-sm"
        >
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1 text-left text-gray-200 font-medium truncate">
            {selected === filterOptions.accounts[0] ? 'All Accounts' : selected}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-navy-800 border border-white/[0.08] rounded-lg shadow-xl py-1">
              {filterOptions.accounts.map((account) => (
                <button
                  key={account}
                  onClick={() => { setSelected(account); setSelectedAccount(account); setOpen(false); }}
                  className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                    selected === account
                      ? 'text-cx-300 bg-white/[0.06] font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {account}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Demo-only: preview any onboarding state without leaving the tenant. Lives in the
 *  footer so the account dropdown stays purely about tenants. Menu opens upward. */
function OnboardingDemoSwitcher() {
  const { onboardingState, setOnboardingStatus } = useOnboarding();
  const [open, setOpen] = useState(false);
  const current = demoStatusOptions.find((o) => o.value === onboardingState.status) ?? demoStatusOptions[1];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-colors"
        title="Demo: preview an onboarding state"
      >
        <FlaskConical className="w-[18px] h-[18px] flex-shrink-0" />
        <span className="flex-1 text-left">Demo onboarding</span>
        <span className="text-[11px] text-gray-600 truncate max-w-[70px]">{current.label.split(' (')[0]}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 text-gray-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-navy-800 border border-white/[0.08] rounded-lg shadow-xl py-1">
            <p className="px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-gray-600">Preview state</p>
            {demoStatusOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => { setOnboardingStatus(o.value as OnboardingStatus); setOpen(false); }}
                className={`block w-full text-left px-3 py-2 text-[13px] transition-colors ${
                  onboardingState.status === o.value
                    ? 'text-cx-300 bg-white/[0.06] font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Sidebar({
  activeSection,
  activeSub,
  collapsed,
  onSectionChange,
  onSubChange,
  onToggleCollapse,
  onNavigate,
  currentPage,
  activeAdminSub,
  onAdminNavigate,
}: SidebarProps) {
  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onToggleCollapse}
        />
      )}
      <aside
        className={`bg-[#0B1220] text-white flex flex-col fixed left-0 top-0 bottom-0 z-40 w-[240px] transition-transform duration-300 ease-in-out ${
          collapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="px-4 py-5 flex items-center gap-2.5 border-b border-white/[0.06]">
          <img src="/clarisix-logo-white-tm-transparent.png" alt="Clarisix" className="h-9 flex-1 object-contain object-left" />
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <AccountSelector />

        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          <button
            onClick={() => onNavigate('home')}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all duration-200 group relative ${
              currentPage === 'home'
                ? 'text-white bg-white/[0.08]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
            }`}
          >
            {currentPage === 'home' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cx-300 rounded-r-full" />
            )}
            <House
              className={`w-[18px] h-[18px] flex-shrink-0 ${
                currentPage === 'home' ? 'text-cx-300' : 'text-gray-500 group-hover:text-gray-400'
              }`}
            />
            <span className="flex-1 text-left">Home</span>
          </button>

          <div className="px-3 mt-3 mb-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2">
              Modules
            </span>
          </div>
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = currentPage === 'dashboard' && activeSection === item.label;
            const hasSubItems = item.subItems.length > 1;
            const { blink, badge } = item as { blink?: boolean; badge?: string };

            return (
              <div key={item.label}>
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    onSectionChange(item.label);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'text-white bg-white/[0.08]'
                      : blink && !isActive
                        ? 'text-cx-200 hover:text-white animate-menu-attention'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {(isActive || (blink && !isActive)) && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cx-300 rounded-r-full ${blink && !isActive ? 'animate-gentle-pulse' : ''}`} />
                  )}
                  {Icon && (
                    <Icon
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-cx-300' : blink ? 'text-cx-300' : 'text-gray-500 group-hover:text-gray-400'
                      }`}
                    />
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge && !hasSubItems && (() => {
                    // Color the pill by badge keyword. 'Live' = pulsing rose
                    // (urgent live event); anything else (e.g. 'New', 'Beta')
                    // = static amber (announcement / freshness).
                    const isLive = badge.toLowerCase() === 'live';
                    const pill = isLive
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      : 'bg-amber-500/20 text-amber-200 border-amber-400/30';
                    const dot = isLive
                      ? 'bg-rose-400 animate-gentle-pulse'
                      : 'bg-amber-300';
                    return (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        {badge}
                      </span>
                    );
                  })()}
                  {hasSubItems && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isActive ? 'rotate-90 text-gray-400' : 'text-gray-600'
                      }`}
                    />
                  )}
                </button>
                {isActive && hasSubItems && (
                  <div className="ml-10 mr-3 py-1 space-y-0.5">
                    {item.subItems.map((sub) => {
                      const isSoon = item.comingSoonSubs?.includes(sub);
                      return (
                        <button
                          key={sub}
                          onClick={() => onSubChange(sub)}
                          className={`flex items-center gap-1.5 w-full text-left text-[13px] px-3 py-1.5 rounded-md transition-colors ${
                            activeSub === sub
                              ? 'text-cx-300 bg-cx-500/10 font-medium'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="flex-1">{sub}</span>
                          {isSoon && (
                            <Clock className="w-3 h-3 text-gray-600 flex-shrink-0" title="Coming soon" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="px-3 mt-4 mb-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2">
              Admin
            </span>
          </div>
          {adminItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = currentPage === 'data' && activeSection === item.label;
            const hasSubItems = item.subItems.length > 1;

            return (
              <div key={item.label}>
                <button
                  onClick={() => {
                    onAdminNavigate?.(item.label, item.defaultSub);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'text-white bg-white/[0.08]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cx-300 rounded-r-full" />
                  )}
                  {Icon && (
                    <Icon
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-cx-300' : 'text-gray-500 group-hover:text-gray-400'
                      }`}
                    />
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasSubItems && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isActive ? 'rotate-90 text-gray-400' : 'text-gray-600'
                      }`}
                    />
                  )}
                </button>
                {isActive && hasSubItems && (
                  <div className="ml-10 mr-3 py-1 space-y-0.5">
                    {item.subItems.map((sub) => {
                      const isSoon = item.comingSoonSubs?.includes(sub);
                      return (
                        <button
                          key={sub}
                          onClick={() => onAdminNavigate?.(item.label, sub)}
                          className={`flex items-center gap-1.5 w-full text-left text-[13px] px-3 py-1.5 rounded-md transition-colors ${
                            activeAdminSub === sub
                              ? 'text-cx-300 bg-cx-500/10 font-medium'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="flex-1">{sub}</span>
                          {isSoon && (
                            <span title="Coming soon">
                              <Clock className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] py-2 px-3 space-y-0.5">
          <OnboardingDemoSwitcher />
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors relative ${
              currentPage === 'settings'
                ? 'text-white bg-white/[0.08]'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
            }`}
          >
            {currentPage === 'settings' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cx-300 rounded-r-full" />
            )}
            <Settings
              className={`w-[18px] h-[18px] flex-shrink-0 ${
                currentPage === 'settings' ? 'text-cx-300' : ''
              }`}
            />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-500 hover:text-gray-300 rounded-md hover:bg-white/[0.04] transition-colors">
            <HelpCircle className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Help</span>
          </button>
        </div>
      </aside>
    </>
  );
}
