import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatBDT, getTodayDate, getWeekStartAndEnd, addDays, getDayName } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { SimpleBarChart, DonutChart, CategoryProgressList } from '../components/Charts';
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  PiggyBank,
  TrendingUp,
  Cigarette,
  Plus,
  ArrowUpRight,
  Clock,
  Sparkles,
  AlertCircle,
  Edit2,
  Trash2,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    metrics,
    transactions,
    categories,
    currentBudget,
    setIsQuickAddOpen,
    setIsCigaretteModalOpen,
    setEditingTransaction,
    setDeletingTransaction,
    settings,
    setActiveTab,
  } = useApp();

  const today = getTodayDate();
  const currentMonthKey = today.substring(0, 7);

  // Today's list of transactions
  const todayTransactions = useMemo(
    () => transactions.filter((t) => t.date === today),
    [transactions, today]
  );

  // Recent 8 transactions
  const recentTransactions = useMemo(() => transactions.slice(0, 8), [transactions]);

  // Last 7 days trend data for Bar Chart
  const last7DaysChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = addDays(today, -i);
      const dayTotal = transactions
        .filter((t) => t.date === dStr)
        .reduce((sum, t) => sum + t.amount, 0);
      const isToday = dStr === today;
      const dayLabel = isToday ? 'Today' : getDayName(dStr, true);

      data.push({
        label: dayLabel,
        sublabel: dStr,
        value: dayTotal,
        color: isToday ? '#10b981' : '#3b82f6',
      });
    }
    return data;
  }, [transactions, today]);

  // Category breakdown for this month
  const categoryBreakdownThisMonth = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; count: number }> = {};
    let monthTotal = 0;

    transactions
      .filter((t) => t.date.startsWith(currentMonthKey))
      .forEach((tx) => {
        monthTotal += tx.amount;
        const cat = categories.find((c) => c.id === tx.categoryId);
        const name = tx.categoryNameSnapshot || (cat ? cat.name : 'Unknown');
        const color = cat?.color || '#10b981';

        if (!map[tx.categoryId]) {
          map[tx.categoryId] = { name, amount: 0, color, count: 0 };
        }
        map[tx.categoryId].amount += tx.amount;
        map[tx.categoryId].count += 1;
      });

    return Object.values(map)
      .map((item) => ({
        ...item,
        percentage: monthTotal > 0 ? Math.round((item.amount / monthTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, currentMonthKey, categories]);

  // Budget calculations
  const monthlyBudgetLimit = currentBudget?.monthlyTotal || 0;
  const budgetPercentage =
    monthlyBudgetLimit > 0 ? Math.round((metrics.thisMonthTotal / monthlyBudgetLimit) * 100) : 0;
  const budgetRemaining = Math.max(0, monthlyBudgetLimit - metrics.thisMonthTotal);

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-lg shadow-emerald-700/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Smart Personal Finance • Bangladesh
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            DailyKhata Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            Track daily expenses, cigarette sticks, monthly budgets, and multi-week reports in Bangladeshi Taka (BDT ৳).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCigaretteModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5"
          >
            <Cigarette className="w-4 h-4 text-amber-300" /> Log Cigarette
          </button>
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-extrabold transition shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* 6 Required Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Today's Total Expenses */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Today's Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50">
              {formatBDT(metrics.todayTotal, { bengaliDigits: settings.showBengaliNumbers })}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {todayTransactions.length} {todayTransactions.length === 1 ? 'expense' : 'expenses'} recorded today
            </div>
          </div>
        </div>

        {/* Card 2: This Week's Total Expenses */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              This Week's Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarRange className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50">
              {formatBDT(metrics.thisWeekTotal, { bengaliDigits: settings.showBengaliNumbers })}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Week starts on {settings.weekStartDay}
            </div>
          </div>
        </div>

        {/* Card 3: This Month's Total Expenses */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              This Month's Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50">
              {formatBDT(metrics.thisMonthTotal, { bengaliDigits: settings.showBengaliNumbers })}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Month of {currentMonthKey}
            </div>
          </div>
        </div>

        {/* Card 4: Today's Remaining Budget */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Today's Remaining Budget
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-300">
              {formatBDT(metrics.todayRemainingBudget, { bengaliDigits: settings.showBengaliNumbers })}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {monthlyBudgetLimit > 0
                ? `Daily pace cap: ৳${Math.round(monthlyBudgetLimit / 30)}`
                : 'Set budget in Budgets tab'}
            </div>
          </div>
        </div>

        {/* Card 5: Most Expensive Category This Month */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Top Category (Month)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-50 truncate">
              {metrics.mostExpensiveCategoryThisMonth
                ? metrics.mostExpensiveCategoryThisMonth.name
                : 'None yet'}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1 font-mono">
              {metrics.mostExpensiveCategoryThisMonth && (
                <>
                  <span className="font-bold text-stone-700 dark:text-stone-300">
                    {formatBDT(metrics.mostExpensiveCategoryThisMonth.amount)}
                  </span>
                  <span>({metrics.mostExpensiveCategoryThisMonth.percentage}% of month)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 6: Total Cigarette Spending This Month */}
        <div
          onClick={() => setActiveTab('cigarette-tracker')}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/70 dark:border-amber-800/40 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <Cigarette className="w-3.5 h-3.5" /> Cigarette Spending
            </span>
            <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
              {formatBDT(metrics.totalCigaretteSpendingThisMonth, {
                bengaliDigits: settings.showBengaliNumbers,
              })}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 font-medium">
              {metrics.totalCigaretteSticksThisMonth} sticks consumed this month
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Budget Progress Bar */}
      {monthlyBudgetLimit > 0 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-stone-900 dark:text-stone-100">
                Monthly Budget Progress ({currentMonthKey})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700 dark:text-stone-300">
                {formatBDT(metrics.thisMonthTotal)} of {formatBDT(monthlyBudgetLimit)}
              </span>
              <span
                className={`font-black px-2 py-0.5 rounded-lg text-[10px] ${
                  budgetPercentage > 100
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                    : budgetPercentage >= 80
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {budgetPercentage}% Spent
              </span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPercentage > 100
                  ? 'bg-red-500'
                  : budgetPercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            />
          </div>

          {budgetPercentage >= 80 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {budgetPercentage > 100
                ? `Budget exceeded by ${formatBDT(metrics.thisMonthTotal - monthlyBudgetLimit)}!`
                : `Warning: You have reached ${budgetPercentage}% of your monthly budget limit!`}
            </div>
          )}
        </div>
      )}

      {/* Charts Section: Daily Spending (Last 7 Days) & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Spending Trend */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Daily Spending (Last 7 Days)
              </h2>
              <span className="text-[11px] text-stone-400">BDT ৳ per day</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Comparison across recent days in Asia/Dhaka time
            </p>
          </div>

          <SimpleBarChart data={last7DaysChartData} height={190} />
        </div>

        {/* Category Breakdown (Donut + Top Categories) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Category Spending (This Month)
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('monthly-reports')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                Full report <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Highest expenditure categories in {currentMonthKey}
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            <DonutChart
              data={categoryBreakdownThisMonth.slice(0, 5).map((c) => ({
                label: c.name,
                value: c.amount,
                color: c.color,
              }))}
              size={150}
            />

            <div className="flex-1 w-full">
              <CategoryProgressList items={categoryBreakdownThisMonth.slice(0, 4)} />
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Today's Expense List & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Expense List */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Today's Expenses</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  {todayTransactions.length}
                </span>
              </h2>
              <span className="text-xs text-stone-400">{today}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {todayTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-400 space-y-2">
              <p>No expenses recorded yet today.</p>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-semibold"
              >
                Log first expense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/80 max-h-80 overflow-y-auto">
              {todayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-stone-50 dark:hover:bg-stone-800/40 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                      <CategoryIcon
                        name={
                          tx.expenseType === 'cigarette'
                            ? 'Cigarette'
                            : categories.find((c) => c.id === tx.categoryId)?.icon || 'Tag'
                        }
                        className="w-4 h-4 text-stone-600 dark:text-stone-300"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {tx.itemName}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                        <span>{tx.time || 'Today'}</span>
                        <span>•</span>
                        <span className="capitalize">{tx.paymentMethod}</span>
                        {tx.expenseType === 'cigarette' && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            ({tx.quantity} sticks)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-stone-900 dark:text-stone-100">
                      {formatBDT(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingTransaction(tx)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTransaction(tx)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions Across Days */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Recent Transactions
              </h2>
              <span className="text-xs text-stone-400">All recent activities</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              View history <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-400">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/80 max-h-80 overflow-y-auto">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-stone-50 dark:hover:bg-stone-800/40 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                      <CategoryIcon
                        name={
                          tx.expenseType === 'cigarette'
                            ? 'Cigarette'
                            : categories.find((c) => c.id === tx.categoryId)?.icon || 'Tag'
                        }
                        className="w-4 h-4 text-stone-600 dark:text-stone-300"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {tx.itemName}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{tx.categoryNameSnapshot}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-stone-900 dark:text-stone-100">
                      {formatBDT(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingTransaction(tx)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTransaction(tx)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
