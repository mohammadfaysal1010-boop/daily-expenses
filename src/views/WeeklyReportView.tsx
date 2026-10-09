import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatBDT,
  getTodayDate,
  getWeekStartAndEnd,
  addDays,
  getDayName,
  formatReadableDate,
} from '../utils/formatters';
import { SimpleBarChart, CategoryProgressList } from '../components/Charts';
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  TrendingUp,
  TrendingDown,
  Cigarette,
  ArrowRight,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

export const WeeklyReportView: React.FC = () => {
  const { transactions, categories, settings, saveSettings } = useApp();

  const [anchorDate, setAnchorDate] = useState<string>(getTodayDate());

  // Week start and end based on user preference
  const { start: weekStart, end: weekEnd, dates: weekDates } = useMemo(() => {
    return getWeekStartAndEnd(anchorDate, settings.weekStartDay);
  }, [anchorDate, settings.weekStartDay]);

  // Previous week start and end for comparison
  const prevWeekAnchor = useMemo(() => addDays(weekStart, -3), [weekStart]);
  const { start: prevWeekStart, end: prevWeekEnd, dates: prevWeekDates } = useMemo(() => {
    return getWeekStartAndEnd(prevWeekAnchor, settings.weekStartDay);
  }, [prevWeekAnchor, settings.weekStartDay]);

  const weekDateSet = useMemo(() => new Set(weekDates), [weekDates]);
  const prevWeekDateSet = useMemo(() => new Set(prevWeekDates), [prevWeekDates]);

  // Filter transactions for this week and previous week
  const thisWeekTransactions = useMemo(() => {
    return transactions.filter((t) => weekDateSet.has(t.date));
  }, [transactions, weekDateSet]);

  const prevWeekTransactions = useMemo(() => {
    return transactions.filter((t) => prevWeekDateSet.has(t.date));
  }, [transactions, prevWeekDateSet]);

  // Aggregates
  const totalWeeklySpending = useMemo(() => {
    return thisWeekTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [thisWeekTransactions]);

  const prevWeekTotal = useMemo(() => {
    return prevWeekTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [prevWeekTransactions]);

  // Daily Spending Breakdown for Bar Chart
  const dailyBreakdown = useMemo(() => {
    return weekDates.map((dStr) => {
      const dayTotal = thisWeekTransactions
        .filter((t) => t.date === dStr)
        .reduce((sum, t) => sum + t.amount, 0);
      const isToday = dStr === getTodayDate();
      return {
        date: dStr,
        dayName: getDayName(dStr, true),
        fullDayName: getDayName(dStr),
        total: dayTotal,
        isToday,
      };
    });
  }, [weekDates, thisWeekTransactions]);

  // Highest and Lowest spending day
  const { highestDay, lowestDay } = useMemo(() => {
    const daysWithSpending = dailyBreakdown.filter((d) => d.total > 0);
    if (daysWithSpending.length === 0) {
      return { highestDay: null, lowestDay: null };
    }
    const sorted = [...dailyBreakdown].sort((a, b) => b.total - a.total);
    const sortedAsc = [...daysWithSpending].sort((a, b) => a.total - b.total);
    return {
      highestDay: sorted[0],
      lowestDay: sortedAsc[0],
    };
  }, [dailyBreakdown]);

  // Average daily spending
  const avgDailySpending = Math.round(totalWeeklySpending / 7);

  // Comparison with previous week
  const weekDiff = totalWeeklySpending - prevWeekTotal;
  const percentageChange =
    prevWeekTotal > 0 ? Math.round((weekDiff / prevWeekTotal) * 100) : totalWeeklySpending > 0 ? 100 : 0;

  // Cigarette quantity and cost
  const cigaretteSummary = useMemo(() => {
    const cigs = thisWeekTransactions.filter((t) => t.expenseType === 'cigarette');
    const sticks = cigs.reduce((sum, t) => sum + (t.quantity || 1), 0);
    const cost = cigs.reduce((sum, t) => sum + t.amount, 0);
    return { sticks, cost };
  }, [thisWeekTransactions]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; count: number }> = {};
    thisWeekTransactions.forEach((tx) => {
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
        percentage: totalWeeklySpending > 0 ? Math.round((item.amount / totalWeeklySpending) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [thisWeekTransactions, categories, totalWeeklySpending]);

  // Export Weekly Report CSV
  const exportWeeklyCSV = () => {
    const headers = ['Date', 'Day', 'Category', 'Item', 'Amount (BDT)', 'Quantity', 'Expense Type'];
    const rows = thisWeekTransactions.map((t) => [
      `"${t.date}"`,
      `"${getDayName(t.date)}"`,
      `"${t.categoryNameSnapshot}"`,
      `"${t.itemName}"`,
      t.amount,
      t.quantity ?? 1,
      `"${t.expenseType}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DailyKhata-Weekly-${weekStart}-to-${weekEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation & Preference Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchorDate(addDays(anchorDate, -7))}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="px-4 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center">
            <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
              {formatReadableDate(weekStart)} – {formatReadableDate(weekEnd)}
            </div>
            <div className="text-[10px] text-stone-400">7 calendar days</div>
          </div>

          <button
            type="button"
            onClick={() => setAnchorDate(addDays(anchorDate, 7))}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right side: Preference & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>Week Starts:</span>
            <select
              value={settings.weekStartDay}
              onChange={(e) =>
                saveSettings({
                  ...settings,
                  weekStartDay: e.target.value as any,
                })
              }
              className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold capitalize text-stone-800 dark:text-stone-200"
            >
              <option value="monday">Monday (Default)</option>
              <option value="sunday">Sunday</option>
              <option value="saturday">Saturday</option>
            </select>
          </div>

          <button
            type="button"
            onClick={exportWeeklyCSV}
            disabled={thisWeekTransactions.length === 0}
            className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
        </div>
      </div>

      {/* Primary Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Weekly Spending */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Total Weekly Spending
          </span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50 mt-2">
            {formatBDT(totalWeeklySpending, { bengaliDigits: settings.showBengaliNumbers })}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {thisWeekTransactions.length} transactions recorded
          </div>
        </div>

        {/* Comparison with Previous Week */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Vs Previous Week
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                weekDiff > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {weekDiff >= 0 ? `+${formatBDT(weekDiff)}` : `-${formatBDT(Math.abs(weekDiff))}`}
            </span>
            {weekDiff > 0 ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {percentageChange >= 0 ? `+${percentageChange}%` : `${percentageChange}%`} compared to last week ({formatBDT(prevWeekTotal)})
          </div>
        </div>

        {/* Average Daily Spending */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Daily Average
          </span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50 mt-2">
            {formatBDT(avgDailySpending)}
          </div>
          <div className="text-xs text-stone-400 mt-1">across 7 calendar days</div>
        </div>

        {/* Weekly Cigarettes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Cigarette className="w-3.5 h-3.5" /> Cigarettes This Week
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200 mt-2">
            {cigaretteSummary.sticks} <span className="text-xs font-normal text-stone-400">sticks</span>
          </div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatBDT(cigaretteSummary.cost)} spent
          </div>
        </div>
      </div>

      {/* Highest & Lowest Day Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-stone-400">Highest Spending Day</span>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
              {highestDay ? `${highestDay.fullDayName} (${highestDay.date})` : 'N/A'}
            </div>
          </div>
          <div className="text-lg font-black text-red-600 dark:text-red-400">
            {highestDay ? formatBDT(highestDay.total) : '৳0'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-stone-400">Lowest Spending Day</span>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
              {lowestDay ? `${lowestDay.fullDayName} (${lowestDay.date})` : 'N/A'}
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {lowestDay ? formatBDT(lowestDay.total) : '৳0'}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Chart & Category Weekly Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spending Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Daily Spending Breakdown
            </h2>
            <p className="text-xs text-stone-400">Expenses for each day of the selected week</p>
          </div>

          <SimpleBarChart
            data={dailyBreakdown.map((d) => ({
              label: d.dayName,
              sublabel: d.date,
              value: d.total,
              color: d.isToday ? '#10b981' : '#3b82f6',
            }))}
            height={200}
          />
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Category-Wise Weekly Expenses
            </h2>
            <span className="text-xs text-stone-400">{categoryBreakdown.length} categories</span>
          </div>

          <CategoryProgressList items={categoryBreakdown} />
        </div>
      </div>
    </div>
  );
};
