import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatBDT,
  getTodayDate,
  formatReadableMonth,
  formatReadableDate,
  getDayName,
} from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  Plus,
  Cigarette,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const {
    transactions,
    categories,
    settings,
    setEditingTransaction,
    setDeletingTransaction,
    setIsQuickAddOpen,
  } = useApp();

  const today = getTodayDate();
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(today.substring(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = currentMonthKey.split('-').map(Number);
    const prevDate = new Date(Date.UTC(y, m - 2, 1));
    const newKey = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;
    setCurrentMonthKey(newKey);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonthKey.split('-').map(Number);
    const nextDate = new Date(Date.UTC(y, m, 1));
    const newKey = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}`;
    setCurrentMonthKey(newKey);
  };

  // Build Calendar Matrix for selectedMonthKey
  const [yearNum, monthNum] = currentMonthKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(yearNum, monthNum, 0)).getUTCDate();
  const firstDayOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1)).getUTCDay();

  // Offset based on settings.weekStartDay
  let startOffset = firstDayOfMonth; // default Sunday
  if (settings.weekStartDay === 'monday') {
    startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  } else if (settings.weekStartDay === 'saturday') {
    startOffset = (firstDayOfMonth + 1) % 7;
  }

  // Map of daily totals for current month
  const dailyTotals = useMemo(() => {
    const map: Record<string, { total: number; count: number; cigSticks: number }> = {};
    transactions
      .filter((t) => t.date.startsWith(currentMonthKey))
      .forEach((t) => {
        if (!map[t.date]) {
          map[t.date] = { total: 0, count: 0, cigSticks: 0 };
        }
        map[t.date].total += t.amount;
        map[t.date].count += 1;
        if (t.expenseType === 'cigarette') {
          map[t.date].cigSticks += t.quantity || 1;
        }
      });
    return map;
  }, [transactions, currentMonthKey]);

  // Determine intensity thresholds for this month
  const maxDaySpend = useMemo(() => {
    const vals = Object.values(dailyTotals).map((d) => d.total);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }, [dailyTotals]);

  // Selected date's transactions
  const selectedDateTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return transactions.filter((t) => t.date === selectedDate);
  }, [transactions, selectedDate]);

  const selectedDateTotal = useMemo(() => {
    return selectedDateTransactions.reduce((s, t) => s + t.amount, 0);
  }, [selectedDateTransactions]);

  // Week header labels
  const weekDaysHeader = useMemo(() => {
    if (settings.weekStartDay === 'monday') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
    if (settings.weekStartDay === 'saturday') {
      return ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    }
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [settings.weekStartDay]);

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {formatReadableMonth(currentMonthKey)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-stone-500">
          <span className="font-semibold text-stone-400">Intensity:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700" />
            <span>None</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/60" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-950/60" />
            <span>Med</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/60" />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Main Grid & Selected Day Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols on desktop) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-stone-400 pb-2 border-b border-stone-100 dark:border-stone-800">
            {weekDaysHeader.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty padding cells for start offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-2xl bg-stone-50/30 dark:bg-stone-950/20" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonthKey}-${String(day).padStart(2, '0')}`;
              const dayData = dailyTotals[dateStr];
              const dayTotal = dayData ? dayData.total : 0;
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === today;

              // Intensity style
              let intensityClass = 'bg-stone-50/50 dark:bg-stone-800/20 text-stone-700 dark:text-stone-300';
              if (dayTotal > 0) {
                const ratio = dayTotal / maxDaySpend;
                if (ratio > 0.6) {
                  intensityClass = 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200';
                } else if (ratio > 0.25) {
                  intensityClass = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200';
                } else {
                  intensityClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200';
                }
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-20 sm:h-24 p-2 rounded-2xl border text-left transition flex flex-col justify-between relative group ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md z-10'
                      : 'border-stone-200/60 dark:border-stone-800/80 hover:border-emerald-400'
                  } ${intensityClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {day}
                    </span>

                    {dayData && dayData.cigSticks > 0 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center" title={`${dayData.cigSticks} cigarettes`}>
                        <Cigarette className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    {dayTotal > 0 ? (
                      <div>
                        <div className="text-[11px] sm:text-xs font-black truncate">
                          {formatBDT(dayTotal)}
                        </div>
                        <div className="text-[9px] text-stone-400 hidden sm:block">
                          {dayData?.count} tx
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-300 dark:text-stone-600 font-light">—</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Drawer / Panel */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Selected Date
              </span>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                {selectedDate ? formatReadableDate(selectedDate) : 'Select a date'}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total</span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatBDT(selectedDateTotal)}
              </div>
            </div>
          </div>

          {selectedDateTransactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400 space-y-3">
              <p>No expenses recorded on this day.</p>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add expense
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {selectedDateTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center shrink-0">
                      <CategoryIcon
                        name={
                          tx.expenseType === 'cigarette'
                            ? 'Cigarette'
                            : categories.find((c) => c.id === tx.categoryId)?.icon || 'Tag'
                        }
                        className="w-3.5 h-3.5"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {tx.itemName}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {tx.time || 'N/A'} • {tx.categoryNameSnapshot}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                      {formatBDT(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingTransaction(tx)}
                      className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTransaction(tx)}
                      className="p-1 text-stone-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
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
