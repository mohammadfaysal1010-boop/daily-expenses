import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatBDT,
  getTodayDate,
  formatReadableMonth,
  splitMonthIntoCalendarWeeks,
  MonthWeekSegment,
  addDays,
} from '../utils/formatters';
import { SimpleBarChart, CategoryProgressList } from '../components/Charts';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Cigarette,
  PiggyBank,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

export const MonthlyReportView: React.FC = () => {
  const { transactions, categories, currentBudget, settings } = useApp();

  const today = getTodayDate();
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(today.substring(0, 7)); // YYYY-MM

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    const prevDate = new Date(Date.UTC(y, m - 2, 1));
    const newKey = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;
    setSelectedMonthKey(newKey);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    const nextDate = new Date(Date.UTC(y, m, 1));
    const newKey = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}`;
    setSelectedMonthKey(newKey);
  };

  // Previous month key for comparison
  const prevMonthKey = useMemo(() => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    const prevDate = new Date(Date.UTC(y, m - 2, 1));
    return `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonthKey]);

  // Filter transactions for this month and previous month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonthKey));
  }, [transactions, selectedMonthKey]);

  const prevMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(prevMonthKey));
  }, [transactions, prevMonthKey]);

  // Total monthly spending
  const totalMonthlySpending = useMemo(() => {
    return monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const prevMonthTotal = useMemo(() => {
    return prevMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [prevMonthTransactions]);

  // Days in month
  const [yearNum, monthNum] = selectedMonthKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(yearNum, monthNum, 0)).getUTCDate();
  const dailyAverage = Math.round(totalMonthlySpending / daysInMonth);

  // Month diff & percentage
  const monthDiff = totalMonthlySpending - prevMonthTotal;
  const monthPercentageChange =
    prevMonthTotal > 0
      ? Math.round((monthDiff / prevMonthTotal) * 100)
      : totalMonthlySpending > 0
      ? 100
      : 0;

  // Highest spending day
  const highestDay = useMemo(() => {
    const dayMap: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      dayMap[t.date] = (dayMap[t.date] || 0) + t.amount;
    });
    let topDate = 'None';
    let topAmount = 0;
    Object.entries(dayMap).forEach(([d, amt]) => {
      if (amt > topAmount) {
        topAmount = amt;
        topDate = d;
      }
    });
    return { date: topDate, amount: topAmount };
  }, [monthTransactions]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; count: number }> = {};
    monthTransactions.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const name = tx.categoryNameSnapshot || (cat ? cat.name : 'Unknown');
      const color = cat?.color || '#10b981';

      if (!map[tx.categoryId]) {
        map[tx.categoryId] = { name, amount: 0, color, count: 0 };
      }
      map[tx.categoryId].amount += tx.amount;
      map[tx.categoryId].count += 1;
    });

    const list = Object.values(map)
      .map((item) => ({
        ...item,
        percentage: totalMonthlySpending > 0 ? Math.round((item.amount / totalMonthlySpending) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const highestCat = list[0] || null;

    return { list, highestCat };
  }, [monthTransactions, categories, totalMonthlySpending]);

  // Budget vs Actual
  const monthlyBudgetLimit = currentBudget?.monthlyTotal || 0;
  const budgetVariance = monthlyBudgetLimit > 0 ? monthlyBudgetLimit - totalMonthlySpending : null;

  // --- MANDATORY MONTHLY WEEK BREAKDOWN ---
  // Chronological non-overlapping calendar-week segments
  const weekSegments = useMemo(() => {
    return splitMonthIntoCalendarWeeks(selectedMonthKey, settings.weekStartDay);
  }, [selectedMonthKey, settings.weekStartDay]);

  interface SegmentSummary {
    segment: MonthWeekSegment;
    totalSpending: number;
    foodSpending: number;
    cigaretteSpending: number;
    transportSpending: number;
    rentAndBills: number;
    shoppingAndPersonal: number;
    otherSpending: number;
    txCount: number;
  }

  const segmentSummaries: SegmentSummary[] = useMemo(() => {
    return weekSegments.map((segment) => {
      const segmentDateSet = new Set(segment.dates);
      const segmentTxs = monthTransactions.filter((t) => segmentDateSet.has(t.date));

      let totalSpending = 0;
      let foodSpending = 0;
      let cigaretteSpending = 0;
      let transportSpending = 0;
      let rentAndBills = 0;
      let shoppingAndPersonal = 0;
      let otherSpending = 0;

      segmentTxs.forEach((tx) => {
        totalSpending += tx.amount;
        const cat = categories.find((c) => c.id === tx.categoryId);
        const group = cat?.group;

        if (tx.expenseType === 'cigarette' || tx.categoryId === 'cat-cigarettes') {
          cigaretteSpending += tx.amount;
        } else if (group === 'Food & Drinks') {
          foodSpending += tx.amount;
        } else if (group === 'Transportation') {
          transportSpending += tx.amount;
        } else if (group === 'Housing' || tx.categoryId === 'cat-rent') {
          rentAndBills += tx.amount;
        } else if (group === 'Personal' || group === 'Lifestyle') {
          shoppingAndPersonal += tx.amount;
        } else {
          otherSpending += tx.amount;
        }
      });

      return {
        segment,
        totalSpending,
        foodSpending,
        cigaretteSpending,
        transportSpending,
        rentAndBills,
        shoppingAndPersonal,
        otherSpending,
        txCount: segmentTxs.length,
      };
    });
  }, [weekSegments, monthTransactions, categories]);

  // Verify that sum of segments strictly equals total monthly spending
  const sumOfSegments = segmentSummaries.reduce((sum, s) => sum + s.totalSpending, 0);

  // Brand-wise cigarette report for the month
  const brandCigaretteReport = useMemo(() => {
    const cigs = monthTransactions.filter((t) => t.expenseType === 'cigarette');
    const brandMap: Record<string, { brand: string; sticks: number; totalCost: number }> = {};

    cigs.forEach((tx) => {
      const brand = tx.cigaretteBrand || 'Unknown';
      if (!brandMap[brand]) {
        brandMap[brand] = { brand, sticks: 0, totalCost: 0 };
      }
      brandMap[brand].sticks += tx.quantity || 1;
      brandMap[brand].totalCost += tx.amount;
    });

    return Object.values(brandMap).sort((a, b) => b.totalCost - a.totalCost);
  }, [monthTransactions]);

  // Export Monthly CSV
  const exportMonthlyCSV = () => {
    const headers = ['Segment', 'Date Range', 'Total (BDT)', 'Food', 'Cigarettes', 'Transport', 'Rent/Bills', 'Shopping/Personal', 'Other', 'Transactions'];
    const rows = segmentSummaries.map((s) => [
      `"${s.segment.label}"`,
      `"${s.segment.startDate} to ${s.segment.endDate}"`,
      s.totalSpending,
      s.foodSpending,
      s.cigaretteSpending,
      s.transportSpending,
      s.rentAndBills,
      s.shoppingAndPersonal,
      s.otherSpending,
      s.txCount,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DailyKhata-Monthly-${selectedMonthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Month Picker Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="month"
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="text-sm font-bold bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <h1 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {formatReadableMonth(selectedMonthKey)}
            </h1>
            <p className="text-xs text-stone-400 font-medium">Asia/Dhaka Calendar Month</p>
          </div>

          <button
            type="button"
            onClick={exportMonthlyCSV}
            disabled={monthTransactions.length === 0}
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Total Monthly Expenses
          </span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50 mt-2">
            {formatBDT(totalMonthlySpending, { bengaliDigits: settings.showBengaliNumbers })}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {monthTransactions.length} transactions across {daysInMonth} days
          </div>
        </div>

        {/* Comparison with Previous Month */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Vs Previous Month
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                monthDiff > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {monthDiff >= 0 ? `+${formatBDT(monthDiff)}` : `-${formatBDT(Math.abs(monthDiff))}`}
            </span>
            {monthDiff > 0 ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {monthPercentageChange >= 0 ? `+${monthPercentageChange}%` : `${monthPercentageChange}%`} compared to {prevMonthKey} ({formatBDT(prevMonthTotal)})
          </div>
        </div>

        {/* Daily Average Spending */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Daily Average
          </span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50 mt-2">
            {formatBDT(dailyAverage)}
          </div>
          <div className="text-xs text-stone-400 mt-1">across {daysInMonth} calendar days</div>
        </div>

        {/* Budget vs Actual */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Budget vs Actual
          </span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-50 mt-2">
            {monthlyBudgetLimit > 0 ? formatBDT(monthlyBudgetLimit) : 'No Budget Set'}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {budgetVariance !== null
              ? budgetVariance >= 0
                ? `${formatBDT(budgetVariance)} under budget`
                : `${formatBDT(Math.abs(budgetVariance))} OVER budget!`
              : 'Set a limit in Budgets'}
          </div>
        </div>
      </div>

      {/* Highest Day & Highest Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-stone-400">Highest Spending Day</span>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
              {highestDay.date !== 'None' ? highestDay.date : 'N/A'}
            </div>
          </div>
          <div className="text-lg font-black text-red-600 dark:text-red-400">
            {formatBDT(highestDay.amount)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-stone-400">Top Category This Month</span>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
              {categoryStats.highestCat ? categoryStats.highestCat.name : 'N/A'}
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {categoryStats.highestCat ? formatBDT(categoryStats.highestCat.amount) : '৳0'}
          </div>
        </div>
      </div>

      {/* MANDATORY MONTHLY WEEK BREAKDOWN TABLE & CHART */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                Mandatory Breakdown
              </span>
              <span className="text-xs font-semibold text-stone-400">
                Week segments sum: {formatBDT(sumOfSegments)} (Matches Month Total: {formatBDT(totalMonthlySpending)})
              </span>
            </div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Chronological Calendar-Week Breakdown
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Split into non-overlapping week blocks. Week starts on {settings.weekStartDay}.
            </p>
          </div>
        </div>

        {/* Weekly Segment Comparison Chart */}
        <div className="pt-2">
          <SimpleBarChart
            data={segmentSummaries.map((s) => ({
              label: `W${s.segment.segmentIndex}`,
              sublabel: `${s.segment.startDate.substring(5)} to ${s.segment.endDate.substring(5)}`,
              value: s.totalSpending,
              color: '#10b981',
            }))}
            height={180}
          />
        </div>

        {/* Granular Segment Breakdown Cards */}
        <div className="space-y-3 pt-2">
          {segmentSummaries.map((s) => (
            <div
              key={s.segment.segmentIndex}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 hover:border-emerald-500/40 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-stone-200/60 dark:border-stone-800">
                <div>
                  <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                    {s.segment.label}
                  </span>
                  <span className="text-[11px] text-stone-400 ml-2">
                    ({s.txCount} transactions)
                  </span>
                </div>
                <div className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {formatBDT(s.totalSpending)}
                </div>
              </div>

              {/* Sub-category columns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                  <div className="text-[10px] text-stone-400">Food</div>
                  <div className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                    {formatBDT(s.foodSpending)}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">Cigarettes</div>
                  <div className="font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                    {formatBDT(s.cigaretteSpending)}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                  <div className="text-[10px] text-stone-400">Transport</div>
                  <div className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                    {formatBDT(s.transportSpending)}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                  <div className="text-[10px] text-stone-400">Rent & Bills</div>
                  <div className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                    {formatBDT(s.rentAndBills)}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                  <div className="text-[10px] text-stone-400">Shopping/Personal</div>
                  <div className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                    {formatBDT(s.shoppingAndPersonal)}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                  <div className="text-[10px] text-stone-400">Other</div>
                  <div className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                    {formatBDT(s.otherSpending)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category-Wise Totals & Brand-Wise Cigarette Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-Wise Totals */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Category-Wise Totals
            </h2>
            <span className="text-xs text-stone-400">{categoryStats.list.length} categories</span>
          </div>

          <CategoryProgressList items={categoryStats.list} />
        </div>

        {/* Detailed Brand-Wise Cigarette Report */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Cigarette className="w-4 h-4 text-amber-500" /> Monthly Cigarette Consumption
              </h2>
              <p className="text-xs text-stone-400">Brand-wise quantity and cost for {selectedMonthKey}</p>
            </div>
          </div>

          {brandCigaretteReport.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No cigarette expenses logged for this month.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {brandCigaretteReport.map((item) => (
                <div key={item.brand} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {item.brand}
                    </div>
                    <div className="text-stone-400 text-[11px]">
                      {item.sticks} sticks consumed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-amber-700 dark:text-amber-300 text-sm font-mono">
                      {formatBDT(item.totalCost)}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      avg {formatBDT(Math.round(item.totalCost / item.sticks))}/stick
                    </div>
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
