import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatBDT, getTodayDate } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { BudgetConfig } from '../types';
import {
  PiggyBank,
  Check,
  AlertTriangle,
  AlertCircle,
  Save,
  Plus,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const { currentBudget, saveBudget, categories, transactions, settings } = useApp();

  const today = getTodayDate();
  const currentMonthKey = today.substring(0, 7);

  // Form states
  const [monthlyTotal, setMonthlyTotal] = useState<string>('30000');
  const [weeklyBudget, setWeeklyBudget] = useState<string>('7500');
  const [dailyBudget, setDailyBudget] = useState<string>('1000');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  useEffect(() => {
    if (currentBudget) {
      setMonthlyTotal(String(currentBudget.monthlyTotal || ''));
      setWeeklyBudget(String(currentBudget.weeklyBudget || ''));
      setDailyBudget(String(currentBudget.dailyBudget || ''));
      setCategoryBudgets(currentBudget.categoryBudgets || {});
    }
  }, [currentBudget]);

  // Actual monthly spending overall
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(currentMonthKey));
  }, [transactions, currentMonthKey]);

  const totalSpentMonth = useMemo(() => {
    return monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  // Category actual spending this month
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return map;
  }, [monthTransactions]);

  // Budget calculations
  const parsedMonthly = Number(monthlyTotal) || 0;
  const overallUsedPercentage =
    parsedMonthly > 0 ? Math.round((totalSpentMonth / parsedMonthly) * 100) : 0;
  const overallRemaining = Math.max(0, parsedMonthly - totalSpentMonth);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetConfig: BudgetConfig = {
      id: `budget-${currentMonthKey}`,
      monthKey: currentMonthKey,
      monthlyTotal: Number(monthlyTotal) || 0,
      weeklyBudget: Number(weeklyBudget) || undefined,
      dailyBudget: Number(dailyBudget) || undefined,
      categoryBudgets,
      updatedAt: Date.now(),
    };

    await saveBudget(budgetConfig);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  const handleCategoryBudgetChange = (catId: string, val: number) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [catId]: val,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-6 rounded-3xl shadow-lg shadow-teal-700/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
            Financial Discipline
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-2">
            <PiggyBank className="w-7 h-7 text-teal-200" /> Budget Management
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-xl">
            Configure monthly targets, category caps, and weekly thresholds. Budgets are stored separately from actual expenses.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-teal-200">Current Month</span>
          <div className="text-lg font-black">{currentMonthKey}</div>
        </div>
      </div>

      {/* Main Budget Progress Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Total Monthly Spending vs Target
            </span>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1 flex items-baseline gap-2">
              <span>{formatBDT(totalSpentMonth)}</span>
              <span className="text-sm font-semibold text-stone-400">
                of {formatBDT(parsedMonthly)} budget
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
                overallUsedPercentage > 100
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                  : overallUsedPercentage >= 80
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {overallUsedPercentage > 100 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Exceeded by {formatBDT(totalSpentMonth - parsedMonthly)}
                </>
              ) : overallUsedPercentage >= 80 ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" /> 80% Warning Limit
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> On Track
                </>
              )}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallUsedPercentage > 100
                ? 'bg-red-500'
                : overallUsedPercentage >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(1, overallUsedPercentage))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
          <span>Remaining budget: <strong className="text-stone-800 dark:text-stone-200 font-mono">{formatBDT(overallRemaining)}</strong></span>
          <span>Spent: <strong className="text-stone-800 dark:text-stone-200">{overallUsedPercentage}%</strong></span>
        </div>
      </div>

      {/* Budget Configuration Form */}
      <form onSubmit={handleSaveBudget} className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Set Budget Limits for {currentMonthKey}
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Define your overall spending limits and category-level ceilings.
          </p>
        </div>

        {/* Global Limits: Monthly, Weekly, Daily */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              Monthly Total Budget (BDT ৳) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">৳</span>
              <input
                type="number"
                min="0"
                step="100"
                value={monthlyTotal}
                onChange={(e) => setMonthlyTotal(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              Weekly Budget (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">৳</span>
              <input
                type="number"
                min="0"
                step="100"
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              Daily Budget (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">৳</span>
              <input
                type="number"
                min="0"
                step="10"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Category-Specific Monthly Budgets */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Category-Specific Budgets
              </h3>
              <p className="text-xs text-stone-400">
                Set individual expenditure caps for key categories
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.slice(0, 10).map((cat) => {
              const cap = categoryBudgets[cat.id] || 0;
              const spent = categorySpentMap[cat.id] || 0;
              const catPercent = cap > 0 ? Math.round((spent / cap) * 100) : 0;

              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 w-32">
                      <span className="text-xs text-stone-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Limit"
                        value={cap || ''}
                        onChange={(e) =>
                          handleCategoryBudgetChange(cat.id, Number(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                      />
                    </div>
                  </div>

                  {cap > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Spent: {formatBDT(spent)}</span>
                        <span
                          className={`font-bold ${
                            catPercent > 100
                              ? 'text-red-600'
                              : catPercent >= 80
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {catPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            catPercent > 100
                              ? 'bg-red-500'
                              : catPercent >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, catPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between">
          {isSavedAlert ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Budget configuration saved!
            </span>
          ) : (
            <span className="text-xs text-stone-400">Saved to DailyKhata database</span>
          )}

          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Save className="w-4 h-4" /> Save Budget Settings
          </button>
        </div>
      </form>
    </div>
  );
};
