import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Navigation from './components/Navigation';
import KPICards from './components/KPICards';
import BudgetTracker from './components/BudgetTracker';
import SalesOverview from './components/SalesOverview';
import BreakdownCharts from './components/BreakdownCharts';
import DeepDive from './components/DeepDive';
import AdvertisingOverview from './components/AdvertisingOverview';
import AdvertisingDeepDive from './components/AdvertisingDeepDive';
import Budgets from './components/Budgets';
import InventoryOverview from './components/InventoryOverview';
import InventoryPerformance from './components/InventoryPerformance';
import ContentTracker from './components/ContentTracker';
import Profitability from './components/Profitability';
import ProfitabilityDeepdive from './components/ProfitabilityDeepdive';
import Retention from './components/Retention';
import Subscriptions from './components/Subscriptions';
import Settings, { type SettingsTabId } from './components/settings/Settings';
import Trends from './components/Trends';
import SQP from './components/SQP';
import SalesHeatmap from './components/SalesHeatmap';
import ComingSoon from './components/ComingSoon';
import Footer from './components/Footer';
import { SectionLoader } from './components/ClarisixSpinner';
import HomeAlerts from './components/HomeAlerts';
import DataFoundationCard from './components/home/DataFoundationCard';
import PeriodSnapshot from './components/PeriodSnapshot';
import OnboardingGateway from './components/OnboardingGateway';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import CommandPalette from './components/CommandPalette';
import Greeting from './components/Greeting';
import Traffic from './components/Traffic';
import { useOnboarding } from './contexts/OnboardingContext';
import { OnboardingWizardProvider } from './contexts/OnboardingWizardContext';
import { menuItems } from './data/dashboardData';

function HomePage({
  onCardClick, onNavigateToSettings, isEmbed,
}: {
  onCardClick: (section: string, sub: string) => void;
  onNavigateToSettings: (tab: string) => void;
  isEmbed?: boolean;
}) {
  return (
    <>
      {!isEmbed && <Greeting />}
      <KPICards onCardClick={onCardClick} />
      <PeriodSnapshot onCardClick={onCardClick} />
      {isEmbed ? (
        <div className="hidden md:block">
          <HomeAlerts onAlertClick={onCardClick} />
        </div>
      ) : (
        <HomeAlerts onAlertClick={onCardClick} />
      )}
      <DataFoundationCard onNavigateToSettings={onNavigateToSettings} />
    </>
  );
}

function OverviewPage() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-6">
        <BudgetTracker />
        <SalesOverview />
      </div>
      <BreakdownCharts />
      <SalesHeatmap />
    </>
  );
}

export default function App() {
  const isEmbed = new URLSearchParams(window.location.search).has('embed');

  const { onboardingState } = useOnboarding();
  const isWizard = !isEmbed && onboardingState.status === 'wizard';
  const isOnboarding = !isEmbed && onboardingState.status !== 'ready';

  const [activeSection, setActiveSection] = useState('Sales');
  const [activeSub, setActiveSub] = useState('Overview');
  const [collapsed, setCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [settingsTab, setSettingsTab] = useState<SettingsTabId | undefined>(undefined);
  const [sectionLoading, setSectionLoading] = useState(false);
  const prevKey = useRef('');

  const contentKey = `${currentPage}-${activeSection}-${activeSub}`;

  useEffect(() => {
    if (prevKey.current && prevKey.current !== contentKey) {
      setSectionLoading(true);
      const timer = setTimeout(() => setSectionLoading(false), 700);
      return () => clearTimeout(timer);
    }
    prevKey.current = contentKey;
  }, [contentKey]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    const menu = menuItems.find((m) => m.label === section);
    setActiveSub(menu?.defaultSub ?? menu?.subItems[0] ?? '');
  };

  const handleKPIClick = (section: string, sub: string) => {
    if (isEmbed) return;
    setCurrentPage('dashboard');
    setActiveSection(section);
    setActiveSub(sub);
  };

  const DATA_TABS: SettingsTabId[] = ['products', 'costs', 'keywordRules', 'account', 'connections'];
  const isDataTab = (tab: SettingsTabId): boolean => DATA_TABS.includes(tab);

  const handleNavigateToSettings = (tab: string) => {
    if (isEmbed) return;
    const t = tab as SettingsTabId;
    setSettingsTab(t);
    setCurrentPage(isDataTab(t) ? 'data' : 'settings');
  };

  const handleAdminNavigate = (_section: string, sub: string) => {
    if (isEmbed) return;
    const map: Record<string, SettingsTabId> = {
      'Products':          'products',
      'Costs':             'costs',
      'Keyword rules':     'keywordRules',
      'Account specifics': 'account',
      'Connections':       'connections',
    };
    const tab = map[sub] ?? 'products';
    setSettingsTab(tab);
    setCurrentPage('data');
  };

  // Reverse-map current settingsTab to the visible Admin sub-item label so the
  // sidebar highlights the right row.
  const adminSubLabel: string | undefined = (() => {
    const reverse: Record<string, string> = {
      products: 'Products',
      costs: 'Costs',
      keywordRules: 'Keyword rules',
      account: 'Account specifics',
      connections: 'Connections',
    };
    return settingsTab ? reverse[settingsTab] : undefined;
  })();

  const renderContent = () => {
    if (sectionLoading) {
      return <SectionLoader />;
    }

    if (currentPage === 'home') {
      return <HomePage onCardClick={handleKPIClick} onNavigateToSettings={handleNavigateToSettings} />;
    }
    if (currentPage === 'settings') {
      return <Settings initialTab={settingsTab} mode="account" />;
    }
    if (currentPage === 'data') {
      return <Settings initialTab={settingsTab ?? 'products'} mode="data" />;
    }
    if (currentPage === 'connectors') {
      // Legacy route — Connectors now lives inside Admin → Data → Connections.
      return <Settings initialTab="connections" mode="data" />;
    }
    if (activeSection === 'Sales' && activeSub === 'Overview') {
      return <OverviewPage />;
    }
    if (activeSection === 'Sales' && activeSub === 'Deepdive') {
      return <DeepDive />;
    }
    if (activeSection === 'Sales' && activeSub === 'Traffic') {
      return <Traffic />;
    }
    if (activeSection === 'Sales' && activeSub === 'Trends') {
      return <Trends />;
    }
    if (activeSection === 'Sales' && activeSub === 'SQP') {
      return <SQP />;
    }
    if (activeSection === 'Advertising' && activeSub === 'Overview') {
      return <AdvertisingOverview />;
    }
    if (activeSection === 'Advertising' && activeSub === 'Deepdive') {
      return <AdvertisingDeepDive />;
    }
    if (activeSection === 'Advertising' && activeSub === 'Budgets') {
      return <Budgets />;
    }
    if (activeSection === 'Inventory' && activeSub === 'Planner') {
      return <InventoryOverview />;
    }
    if (activeSection === 'Inventory' && activeSub === 'Performance') {
      return <InventoryPerformance />;
    }
    if (activeSection === 'Content' && activeSub === 'Tracker') {
      return <ContentTracker />;
    }
    if (activeSection === 'Profitability' && activeSub === 'Overview') {
      return <Profitability onNavigate={(section, sub) => {
        if (section === 'Settings') {
          handleNavigateToSettings(sub);
          return;
        }
        setActiveSection(section);
        setActiveSub(sub);
      }} />;
    }
    if (activeSection === 'Profitability' && activeSub === 'Deepdive') {
      return <ProfitabilityDeepdive />;
    }
    if (activeSection === 'Customer Experience' && activeSub === 'Retention') {
      return <Retention />;
    }
    if (activeSection === 'Customer Experience' && activeSub === 'Subscriptions') {
      return <Subscriptions />;
    }
    return (
      <ComingSoon
        title={`${activeSub} Coming Soon`}
        description={`The ${activeSection} ${activeSub} module is currently under development. Check back soon for powerful analytics and insights.`}
      />
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50/80 flex ${isEmbed ? 'overflow-hidden max-w-[100vw]' : ''}`}>
      {!isOnboarding && !isEmbed && (
        <Sidebar
          activeSection={currentPage === 'data' ? 'Data' : activeSection}
          activeSub={activeSub}
          collapsed={collapsed}
          onSectionChange={handleSectionChange}
          onSubChange={setActiveSub}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
          activeAdminSub={currentPage === 'data' ? adminSubLabel : undefined}
          onAdminNavigate={handleAdminNavigate}
        />
      )}

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isEmbed ? 'ml-0 w-full min-w-0' : isOnboarding || collapsed ? 'ml-0 min-w-0' : 'ml-[240px] min-w-0'
        }`}
      >
        <Navigation
          activeSection={activeSection}
          activeSub={activeSub}
          sidebarCollapsed={isEmbed || isOnboarding || collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isOnboarding={isOnboarding}
          isWizard={isWizard}
          isEmbed={isEmbed}
        />

        <main className={`flex-1 px-3 py-3 md:px-6 md:py-4 space-y-3 md:space-y-4 min-w-0 ${isEmbed ? 'max-w-full' : ''}`}>
          {isEmbed ? (
            <HomePage onCardClick={handleKPIClick} onNavigateToSettings={handleNavigateToSettings} isEmbed />
          ) : isWizard ? (
            <OnboardingWizardProvider>
              <OnboardingWizard />
            </OnboardingWizardProvider>
          ) : isOnboarding ? (
            <OnboardingGateway />
          ) : (
            renderContent()
          )}
        </main>

        {!isOnboarding && !isEmbed && <Footer />}
      </div>

      {!isEmbed && (
        <CommandPalette
          onPageNavigate={setCurrentPage}
          onSectionNavigate={(section, sub) => {
            setCurrentPage('dashboard');
            setActiveSection(section);
            setActiveSub(sub);
          }}
        />
      )}
    </div>
  );
}
