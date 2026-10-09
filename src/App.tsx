/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { QuickExpenseModal } from './components/QuickExpenseModal';
import { CigaretteModal } from './components/CigaretteModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';

// Views
import { DashboardView } from './views/DashboardView';
import { DailyReportView } from './views/DailyReportView';
import { WeeklyReportView } from './views/WeeklyReportView';
import { MonthlyReportView } from './views/MonthlyReportView';
import { CigaretteTrackerView } from './views/CigaretteTrackerView';
import { CalendarView } from './views/CalendarView';
import { BudgetsView } from './views/BudgetsView';
import { TransactionsView } from './views/TransactionsView';
import { CategoriesSettingsView } from './views/CategoriesSettingsView';

const MainLayout: React.FC = () => {
  const { activeTab, isLoading } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'daily-reports':
        return <DailyReportView />;
      case 'weekly-reports':
        return <WeeklyReportView />;
      case 'monthly-reports':
        return <MonthlyReportView />;
      case 'cigarette-tracker':
        return <CigaretteTrackerView />;
      case 'calendar':
        return <CalendarView />;
      case 'budgets':
        return <BudgetsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'settings':
        return <CategoriesSettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar & Mobile Slide-out */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 md:pl-64 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 max-w-full overflow-x-hidden">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center text-xs text-stone-400 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span>Loading DailyKhata database...</span>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* Global Modals */}
      <QuickExpenseModal />
      <CigaretteModal />
      <EditTransactionModal />
      <DeleteConfirmModal />
      <DatabaseStatusModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
