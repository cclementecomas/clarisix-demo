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
  Cable,
  Building2,
} from 'lucide-react';
import { menuItems, filterOptions } from '../data/dashboardData';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  BarChart3,
  Megaphone,
  Package,
  TrendingUp,
  FileText,
  Star,
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
}

function AccountSelector() {
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
                  onClick={() => { setSelected(account); setOpen(false); }}
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

export default function Sidebar({
  activeSection,
  activeSub,
  collapsed,
  onSectionChange,
  onSubChange,
  onToggleCollapse,
  onNavigate,
  currentPage,
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
          <img src="/clarisix_logo_white.png" alt="Clarisix" className="h-9 flex-1 object-contain object-left" />
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <AccountSelector />

        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2">
              Performance
            </span>
          </div>
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = currentPage === 'dashboard' && activeSection === item.label;
            const hasSubItems = item.subItems.length > 1;

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
                    {item.subItems.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => onSubChange(sub)}
                        className={`block w-full text-left text-[13px] px-3 py-1.5 rounded-md transition-colors ${
                          activeSub === sub
                            ? 'text-cx-300 bg-cx-500/10 font-medium'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] py-2 px-3 space-y-0.5">
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
          <button
            onClick={() => onNavigate('connectors')}
            className={`w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors relative ${
              currentPage === 'connectors'
                ? 'text-white bg-white/[0.08]'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
            }`}
          >
            {currentPage === 'connectors' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cx-300 rounded-r-full" />
            )}
            <Cable
              className={`w-[18px] h-[18px] flex-shrink-0 ${
                currentPage === 'connectors' ? 'text-cx-300' : ''
              }`}
            />
            <span>Connectors</span>
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
