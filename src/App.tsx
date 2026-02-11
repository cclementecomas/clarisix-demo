import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Navigation from './components/Navigation';
import ClarisixScore from './components/ClarisixScore';
import KPICards from './components/KPICards';
import BudgetTracker from './components/BudgetTracker';
import SalesOverview from './components/SalesOverview';
import BreakdownCharts from './components/BreakdownCharts';
import DeepDive from './components/DeepDive';
import AdvertisingOverview from './components/AdvertisingOverview';
import Profitability from './components/Profitability';
import Connectors from './components/Connectors';
import Retention from './components/Retention';
import Subscriptions from './components/Subscriptions';
import Settings from './components/settings/Settings';
import Trends from './components/Trends';
import ComingSoon from './components/ComingSoon';
import Footer from './components/Footer';
import { SectionLoader } from './components/ClarisixSpinner';
import HomeAlerts from './components/HomeAlerts';
import { menuItems } from './data/dashboardData';

function HomePage({ onCardClick }: { onCardClick: (section: string, sub: string) => void }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <ClarisixScore />
        <KPICards onCardClick={onCardClick} />
      </div>
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
    if (activeSection === 'Profitability' && activeSub === 'Overview') {
      return <Profitability />;
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

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? 'ml-0' : 'ml-[240px]'
        }`}
      >
        <Navigation
          activeSection={activeSection}
          activeSub={activeSub}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />

        <main className="flex-1 px-6 py-6 space-y-6">
          {renderContent()}
        </main>

        <Footer />
      </div>
    </div>
  );
}
