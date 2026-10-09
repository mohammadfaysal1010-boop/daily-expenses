import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  CalendarDays,
  CalendarRange,
  BarChart3,
  Cigarette,
  Calendar,
  PiggyBank,
  History,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  labelBn: string;
  icon: React.ElementType;
  badge?: string;
  isSpecial?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, metrics, setIsQuickAddOpen } = useApp();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      labelBn: 'মূল ড্যাশবোর্ড',
      icon: LayoutDashboard,
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      labelBn: 'খরচ যোগ করুন',
      icon: PlusCircle,
    },
    {
      id: 'daily-reports',
      label: 'Daily Reports',
      labelBn: 'দৈনিক রিপোর্ট',
      icon: CalendarDays,
    },
    {
      id: 'weekly-reports',
      label: 'Weekly Reports',
      labelBn: 'সাপ্তাহিক রিপোর্ট',
      icon: CalendarRange,
    },
    {
      id: 'monthly-reports',
      label: 'Monthly Reports',
      labelBn: 'মাসিক রিপোর্ট',
      icon: BarChart3,
    },
    {
      id: 'cigarette-tracker',
      label: 'Cigarette Tracker',
      labelBn: 'সিগারেট হিসাব',
      icon: Cigarette,
      badge: metrics.todayCigaretteSticks > 0 ? `${metrics.todayCigaretteSticks} today` : undefined,
      isSpecial: true,
    },
    {
      id: 'calendar',
      label: 'Calendar View',
      labelBn: 'ক্যালেন্ডার ভিউ',
      icon: Calendar,
    },
    {
      id: 'budgets',
      label: 'Budgets',
      labelBn: 'বাজেট ব্যবস্থাপনা',
      icon: PiggyBank,
    },
    {
      id: 'transactions',
      label: 'Transaction History',
      labelBn: 'লেনদেন তালিকা',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Categories & Settings',
      labelBn: 'ক্যাটাগরি ও সেটিংস',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    if (tabId === 'add-expense') {
      setIsQuickAddOpen(true);
    } else {
      setActiveTab(tabId);
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-stone-900 border-r border-stone-200/80 dark:border-stone-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Links */}
        <div className="p-3.5 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : item.isSpecial
                    ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive
                        ? 'text-white'
                        : item.isSpecial
                        ? 'text-amber-500'
                        : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-200'
                    }`}
                  />
                  <div className="text-left">
                    <div className="leading-tight">{item.label}</div>
                    <div
                      className={`text-[10px] ${
                        isActive ? 'text-emerald-100' : 'text-stone-400 dark:text-stone-500'
                      }`}
                    >
                      {item.labelBn}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Card in Sidebar */}
        <div className="p-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              DailyKhata v1.0
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Designed for Bangladesh • BDT ৳ Currency • Asia/Dhaka Timezone
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
