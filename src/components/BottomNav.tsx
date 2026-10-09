import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, CalendarDays, Plus, Cigarette, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  onToggleMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onToggleMobileMenu }) => {
  const { activeTab, setActiveTab, setIsQuickAddOpen, setIsCigaretteModalOpen } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 px-3 py-2 flex items-center justify-around">
      {/* Dashboard */}
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition ${
          activeTab === 'dashboard'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-stone-400 dark:text-stone-500'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      {/* Daily Reports */}
      <button
        type="button"
        onClick={() => setActiveTab('daily-reports')}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition ${
          activeTab === 'daily-reports'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-stone-400 dark:text-stone-500'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span>Reports</span>
      </button>

      {/* Primary Add Button (Floats slightly) */}
      <button
        type="button"
        onClick={() => setIsQuickAddOpen(true)}
        className="w-12 h-12 -mt-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition"
        aria-label="Add new expense"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Cigarette Tracker */}
      <button
        type="button"
        onClick={() => setIsCigaretteModalOpen(true)}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition ${
          activeTab === 'cigarette-tracker'
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-amber-500/80 hover:text-amber-600'
        }`}
      >
        <Cigarette className="w-5 h-5" />
        <span>Cigarette</span>
      </button>

      {/* Menu / All features */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span>More</span>
      </button>
    </nav>
  );
};
