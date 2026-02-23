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
import InventoryOverview from './components/InventoryOverview';
import InventoryReplenishment from './components/InventoryReplenishment';
import InventoryPerformance from './components/InventoryPerformance';
import ContentTracker from './components/ContentTracker';
import Profitability from './components/Profitability';
import ProfitabilityDeepdive from './components/ProfitabilityDeepdive';
import Connectors from './components/Connectors';
import Retention from './components/Retention';
import Subscriptions from './components/Subscriptions';
import Settings from './components/settings/Settings';
import Trends from './components/Trends';
import ComingSoon from './components/ComingSoon';
import Footer from './components/Footer';
import { SectionLoader } from './components/ClarisixSpinner';
import HomeAlerts from './components/HomeAlerts';
import PeriodSnapshot from './components/PeriodSnapshot';
import OnboardingGateway from './components/OnboardingGateway';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import { useOnboarding } from './contexts/OnboardingContext';
import { OnboardingWizardProvider } from './contexts/OnboardingWizardContext';
import { menuItems } from './data/dashboardData';

function HomePage({ onCardClick }: { onCardClick: (section: string, sub: string) => void }) {
  return (
    <>
      <KPICards onCardClick={onCardClick} />
      <PeriodSnapshot onCardClick={onCardClick} />
      <HomeAlerts onAlertClick={onCardClick} />
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

  const renderContent = () => {
    if (sectionLoading) {
      return <SectionLoader message="Loading data..." />;
    }

    if (currentPage === 'home') {
      return <HomePage onCardClick={handleKPIClick} />;
    }
    if (currentPage === 'settings') {
      return <Settings />;
    }
    if (currentPage === 'connectors') {
      return <Connectors />;
    }
    if (activeSection === 'Sales' && activeSub === 'Overview') {
      return <OverviewPage />;
    }
    if (activeSection === 'Sales' && activeSub === 'Deepdive') {
      return <DeepDive />;
    }
    if (activeSection === 'Sales' && activeSub === 'Trends') {
      return <Trends />;
    }
    if (activeSection === 'Advertising' && activeSub === 'Overview') {
      return <AdvertisingOverview />;
    }
    if (activeSection === 'Advertising' && activeSub === 'Deepdive') {
      return <AdvertisingDeepDive />;
    }
    if (activeSection === 'Inventory' && activeSub === 'Overview') {
      return <InventoryOverview />;
    }
    if (activeSection === 'Inventory' && activeSub === 'Replenishment') {
      return <InventoryReplenishment />;
    }
    if (activeSection === 'Inventory' && activeSub === 'Performance') {
      return <InventoryPerformance />;
    }
    if (activeSection === 'Content' && activeSub === 'Tracker') {
      return <ContentTracker />;
    }
    if (activeSection === 'Profitability' && activeSub === 'Overview') {
      return <Profitability />;
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
    <div className="min-h-screen bg-gray-50/80 flex">
      {!isOnboarding && !isEmbed && (
        <Sidebar
          activeSection={activeSection}
          activeSub={activeSub}
          collapsed={collapsed}
          onSectionChange={handleSectionChange}
          onSubChange={setActiveSub}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
        />
      )}

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isEmbed || isOnboarding || collapsed ? 'ml-0' : 'ml-[240px]'
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
        />

        <main className="flex-1 px-3 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6">
          {isEmbed ? (
            <HomePage onCardClick={handleKPIClick} />
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
    </div>
  );
}
