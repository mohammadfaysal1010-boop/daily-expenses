import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatBDT,
  getTodayDate,
  addDays,
  formatReadableDate,
  getDayName,
} from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { CategoryProgressList } from '../components/Charts';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Download,
  Edit2,
  Trash2,
  Cigarette,
  DollarSign,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const {
    transactions,
    categories,
    setEditingTransaction,
    setDeletingTransaction,
    settings,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  // Date navigation
  const handlePrevDay = () => setSelectedDate((d) => addDays(d, -1));
  const handleNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const handleToday = () => setSelectedDate(getTodayDate());

  // Transactions on selected date
  const dayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDate);
  }, [transactions, selectedDate]);

  // Aggregate metrics
  const dayTotal = useMemo(() => {
    return dayTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [dayTransactions]);

  const transactionCount = dayTransactions.length;

  // Highest single expense
  const highestExpense = useMemo(() => {
    if (dayTransactions.length === 0) return null;
    return [...dayTransactions].sort((a, b) => b.amount - a.amount)[0];
  }, [dayTransactions]);

  // Category-wise spending
  const categoryStats = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; count: number }> = {};
    dayTransactions.forEach((tx) => {
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
        percentage: dayTotal > 0 ? Math.round((item.amount / dayTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Most frequently used category
    let mostFrequentCat = 'None';
    let maxCount = 0;
    list.forEach((item) => {
      if (item.count > maxCount) {
        maxCount = item.count;
        mostFrequentCat = item.name;
      }
    });

    return { list, mostFrequentCat };
  }, [dayTransactions, categories, dayTotal]);

  // Cigarettes on this day
  const cigaretteSummary = useMemo(() => {
    const cigs = dayTransactions.filter((t) => t.expenseType === 'cigarette');
    const sticks = cigs.reduce((sum, t) => sum + (t.quantity || 1), 0);
    const cost = cigs.reduce((sum, t) => sum + t.amount, 0);
    return { sticks, cost };
  }, [dayTransactions]);

  // Export Daily Report to CSV
  const exportDailyCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'Category', 'Item', 'Amount (BDT)', 'Quantity', 'Payment Method', 'Notes'];
    const rows = dayTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.time || ''}"`,
      `"${t.categoryNameSnapshot}"`,
      `"${t.itemName}"`,
      t.amount,
      t.quantity ?? 1,
      `"${t.paymentMethod}"`,
      `"${t.notes || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DailyKhata-Report-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-bold bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {selectedDate !== getTodayDate() && (
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <h1 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {formatReadableDate(selectedDate)}
            </h1>
            <p className="text-xs text-stone-400 font-medium">{getDayName(selectedDate)} (Asia/Dhaka)</p>
          </div>

          <button
            type="button"
            onClick={exportDailyCSV}
            disabled={dayTransactions.length === 0}
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Money Spent */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Total Money Spent
          </span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50 mt-2">
            {formatBDT(dayTotal, { bengaliDigits: settings.showBengaliNumbers })}
          </div>
          <div className="text-xs text-stone-400 mt-1">on {selectedDate}</div>
        </div>

        {/* Transactions Count */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Transactions
          </span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50 mt-2">
            {transactionCount}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {categoryStats.list.length} different categories
          </div>
        </div>

        {/* Highest Single Expense */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Highest Single Expense
          </span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-50 mt-2 truncate">
            {highestExpense ? formatBDT(highestExpense.amount) : '৳0'}
          </div>
          <div className="text-xs text-stone-400 mt-1 truncate">
            {highestExpense ? highestExpense.itemName : 'None'}
          </div>
        </div>

        {/* Most Frequent Category / Cigarettes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Top Category
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {categoryStats.mostFrequentCat}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {cigaretteSummary.sticks > 0
              ? `Cigarettes: ${cigaretteSummary.sticks} sticks (${formatBDT(cigaretteSummary.cost)})`
              : 'No cigarettes on this day'}
          </div>
        </div>
      </div>

      {/* Two Column Section: Category-wise spending breakdown and Transactions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Category-Wise Spending Breakdown
            </h2>
            <span className="text-xs text-stone-400">{categoryStats.list.length} categories</span>
          </div>

          <CategoryProgressList items={categoryStats.list} />
        </div>

        {/* Full Transaction History for Selected Date */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Transaction Details ({dayTransactions.length})
            </h2>
            <span className="text-xs text-stone-400">Click to edit or remove</span>
          </div>

          {dayTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No transactions recorded for {selectedDate}.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-96 overflow-y-auto">
              {dayTransactions.map((tx) => (
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
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {tx.itemName}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-2">
                        <span>{tx.time || 'N/A'}</span>
                        <span>•</span>
                        <span>{tx.categoryNameSnapshot}</span>
                        <span>•</span>
                        <span className="capitalize">{tx.paymentMethod}</span>
                        {tx.notes && <span className="italic">"{tx.notes}"</span>}
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
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTransaction(tx)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-red-600 transition"
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
