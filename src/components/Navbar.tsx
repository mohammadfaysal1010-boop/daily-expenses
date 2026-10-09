import React from 'react';
import { useApp } from '../context/AppContext';
import { formatBDT } from '../utils/formatters';
import {
  Plus,
  Cigarette,
  Sun,
  Moon,
  Database,
  Menu,
  Wallet,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const {
    metrics,
    setIsQuickAddOpen,
    setIsCigaretteModalOpen,
    setIsDbStatusModalOpen,
    settings,
    saveSettings,
  } = useApp();

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings({ ...settings, theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Simple text-based Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-lg font-black tracking-tight text-stone-900 dark:text-stone-50">
                  Daily<span className="text-emerald-600 dark:text-emerald-400">Khata</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  BDT ৳
                </span>
              </div>
              <div className="text-[10px] font-medium text-stone-400 dark:text-stone-500 font-sans">
                দৈনিক খাতা • Personal Expense Tracker
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Today quick total pill */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-xs">
          <span className="text-stone-500 dark:text-stone-400 font-medium">Today's Spend:</span>
          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
            {formatBDT(metrics.todayTotal, { bengaliDigits: settings.showBengaliNumbers })}
          </span>
          {metrics.todayCigaretteSticks > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold border-l border-stone-300 dark:border-stone-700 pl-2">
              <Cigarette className="w-3 h-3" />
              {metrics.todayCigaretteSticks} sticks ({formatBDT(metrics.todayCigaretteSpending)})
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* DB Status Badge */}
          <button
            type="button"
            onClick={() => setIsDbStatusModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
            title="IndexedDB Storage active"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">Local IndexedDB</span>
          </button>

          {/* Quick Cigarettes Button */}
          <button
            type="button"
            onClick={() => setIsCigaretteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300/60 dark:border-amber-800/60 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 transition active:scale-95 shadow-sm"
          >
            <Cigarette className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xs:inline">Cigarettes</span>
          </button>

          {/* Quick Add Expense button */}
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition active:scale-95 shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="Toggle dark mode"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
