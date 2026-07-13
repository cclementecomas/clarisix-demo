import { useState, useEffect, useRef, useCallback } from 'react';
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
import PrimeDayRecap from './components/PrimeDayRecap';
import Retention from './components/Retention';
import Subscriptions from './components/Subscriptions';
import Settings, { type SettingsTabId } from './components/settings/Settings';
import Trends from './components/Trends';
import SQP from './components/SQP';
import ExecutiveInsightCard from './components/sales/ExecutiveInsightCard';
import NeedsAttentionPanel from './components/sales/NeedsAttentionPanel';
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
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import HomeCelebration from './components/HomeCelebration';
import Greeting from './components/Greeting';
import Traffic from './components/Traffic';
import { useOnboarding } from './contexts/OnboardingContext';
import { OnboardingWizardProvider } from './contexts/OnboardingWizardContext';
import { menuItems } from './data/dashboardData';
import { useKeyboardShortcuts, type NavTarget } from './hooks/useKeyboardShortcuts';

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
      {!isEmbed && <HomeCelebration />}
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

/** Routes the executive-insight / attention-panel CTAs into either a scroll
 *  to the right anchor on this page, or a navigation to the Profitability
 *  module. Anchors are set as ids further down in the page. */
function handleSalesOverviewCta(route: string, onNavigate: (section: string, sub: string) => void) {
  if (route === 'profitability') {
    onNavigate('Profitability', 'Overview');
    return;
  }
  const anchorMap: Record<string, string> = {
    'breakdown-marketplace': 'sales-breakdown',
    'breakdown-category':    'sales-breakdown',
    'breakdown-asin':        'sales-breakdown',
    'run-rate':              'sales-run-rate',
    'sales-trend':           'sales-trend',
  };
  const anchor = anchorMap[route];
  if (!anchor) return;
  const el = document.getElementById(anchor);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function OverviewPage({ onNavigate }: { onNavigate: (section: string, sub: string) => void }) {
  const cta = (route: string) => handleSalesOverviewCta(route, onNavigate);
  return (
    <>
      <ExecutiveInsightCard onCta={cta} />
      <NeedsAttentionPanel onCta={cta} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-6 items-stretch">
        <div id="sales-run-rate" className="flex"><BudgetTracker /></div>
        <div id="sales-trend" className="flex"><SalesOverview /></div>
      </div>
      <div id="sales-breakdown"><BreakdownCharts /></div>
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sqpFocus, setSqpFocus] = useState<{ query: string; branded: boolean } | null>(null);
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

  // Keyboard-shortcut navigation ("g then <key>"): jump to Home or a section.
  const handleShortcutNav = useCallback((target: NavTarget) => {
    if (isEmbed) return;
    if (target === 'home') { setCurrentPage('home'); return; }
    setCurrentPage('dashboard');
    setActiveSection(target);
    const menu = menuItems.find((m) => m.label === target);
    setActiveSub(menu?.defaultSub ?? menu?.subItems[0] ?? '');
  }, [isEmbed]);

  const handleHelp = useCallback(() => setShowShortcuts(true), []);
  const handleToggleSidebar = useCallback(() => setCollapsed((c) => !c), []);

  useKeyboardShortcuts({
    onHelp: handleHelp,
    onToggleSidebar: handleToggleSidebar,
    onNavigate: handleShortcutNav,
    enabled: !isEmbed && !isOnboarding && !isWizard,
  });

  const handleKPIClick = (section: string, sub: string) => {
    if (isEmbed) return;
    setCurrentPage('dashboard');
    setActiveSection(section);
    setActiveSub(sub);
  };

  // Traffic ASIN drawer → open this query in the Keyword Portfolio (SQP), landing on its drawer.
  const openKeyword = useCallback((query: string, branded: boolean) => {
    if (isEmbed) return;
    setSqpFocus({ query, branded });
    setCurrentPage('dashboard');
    setActiveSection('Sales');
    setActiveSub('Keyword portfolio');
  }, [isEmbed]);
  const clearSqpFocus = useCallback(() => setSqpFocus(null), []);

  const DATA_TABS: SettingsTabId[] = ['products', 'costs', 'overheads', 'keywordRules', 'account', 'connections'];
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
      'Overheads':         'overheads',
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
      overheads: 'Overheads',
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
    if (activeSection === 'Prime Day Recap') {
      return <PrimeDayRecap />;
    }
    if (activeSection === 'Sales' && activeSub === 'Overview') {
      return <OverviewPage onNavigate={(section, sub) => { setActiveSection(section); setActiveSub(sub); }} />;
    }
    if (activeSection === 'Sales' && activeSub === 'Diagnostics') {
      return <DeepDive />;
    }
    if (activeSection === 'Sales' && activeSub === 'Traffic funnel') {
      return <Traffic onOpenKeyword={openKeyword} />;
    }
    if (activeSection === 'Sales' && activeSub === 'Trends') {
      return <Trends />;
    }
    if (activeSection === 'Sales' && activeSub === 'Keyword portfolio') {
      return <SQP focusQuery={sqpFocus} onFocusConsumed={clearSqpFocus} />;
    }
    if (activeSection === 'Advertising' && activeSub === 'Overview') {
      return <AdvertisingOverview />;
    }
    if (activeSection === 'Advertising' && activeSub === 'Diagnostics') {
      return <AdvertisingDeepDive />;
    }
    if (activeSection === 'Advertising' && activeSub === 'Budget & Pacing') {
      return <Budgets />;
    }
    // Batch 1 stubs — real pages land in subsequent batches.
    if (activeSection === 'Advertising' && activeSub === 'Keywords & Search Terms') {
      return (
        <ComingSoon
          title="Keywords & Search Terms"
          description="A dedicated workspace to scale, reduce, exact-match or negate managed keywords and customer search terms — with waste-spend detection and scale candidates."
        />
      );
    }
    if (activeSection === 'Advertising' && activeSub === 'Attribution & Halo') {
      return (
        <ComingSoon
          title="Attribution & Halo"
          description="Advertised-ASIN to purchased-ASIN matrix, halo ratios, and an honest read on whether campaigns are profitable once cross-catalog sales are counted."
        />
      );
    }
    if (activeSection === 'Advertising' && activeSub === 'Dayparting / Intraday') {
      return (
        <ComingSoon
          title="Dayparting / Intraday"
          description="Hour-of-day and day-of-week efficiency, budget depletion timing, and bid recommendations for the hours and days that actually convert."
        />
      );
    }
    if (activeSection === 'Advertising' && activeSub === 'Experiments & Change Log') {
      return (
        <ComingSoon
          title="Experiments & Change Log"
          description="Track bid, budget, placement-multiplier, creative and PDP changes, with a before/after read on whether each change actually improved performance."
        />
      );
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

      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
