import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatBDT, getTodayDate, getWeekStartAndEnd, addDays, getDayName } from '../utils/formatters';
import { SimpleBarChart } from '../components/Charts';
import { CigaretteBrand } from '../types';
import {
  Cigarette,
  Plus,
  Flame,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Edit2,
  Trash2,
  Check,
  X,
  Settings,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

export const CigaretteTrackerView: React.FC = () => {
  const {
    transactions,
    cigaretteBrands,
    saveCigaretteBrand,
    deleteCigaretteBrand,
    setIsCigaretteModalOpen,
    setEditingTransaction,
    setDeletingTransaction,
    settings,
  } = useApp();

  const today = getTodayDate();
  const currentMonthKey = today.substring(0, 7);
  const { dates: thisWeekDates } = getWeekStartAndEnd(today, settings.weekStartDay);
  const weekSet = new Set(thisWeekDates);

  // Period filter: 'today' | 'week' | 'month' | 'last30' | 'all'
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'last30' | 'all'>('month');

  // Brand management state
  const [editingBrand, setEditingBrand] = useState<CigaretteBrand | null>(null);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandPrice, setNewBrandPrice] = useState('15');

  // Filtered cigarette transactions
  const cigaretteTransactions = useMemo(() => {
    return transactions.filter((t) => t.expenseType === 'cigarette');
  }, [transactions]);

  // Total overall expenses for percentage calculation
  const totalAllExpensesThisMonth = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(currentMonthKey))
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, currentMonthKey]);

  // Overall metrics
  const summaryMetrics = useMemo(() => {
    let todaySticks = 0;
    let todaySpend = 0;
    let weekSticks = 0;
    let weekSpend = 0;
    let monthSticks = 0;
    let monthSpend = 0;

    cigaretteTransactions.forEach((tx) => {
      const sticks = tx.quantity || 1;
      if (tx.date === today) {
        todaySticks += sticks;
        todaySpend += tx.amount;
      }
      if (weekSet.has(tx.date)) {
        weekSticks += sticks;
        weekSpend += tx.amount;
      }
      if (tx.date.startsWith(currentMonthKey)) {
        monthSticks += sticks;
        monthSpend += tx.amount;
      }
    });

    const avgDailySpending = Math.round(monthSpend / 30);
    const avgMonthlySpending = monthSpend;
    const cigarettePercentOfTotal =
      totalAllExpensesThisMonth > 0 ? Math.round((monthSpend / totalAllExpensesThisMonth) * 100) : 0;

    return {
      todaySticks,
      todaySpend,
      weekSticks,
      weekSpend,
      monthSticks,
      monthSpend,
      avgDailySpending,
      avgMonthlySpending,
      cigarettePercentOfTotal,
    };
  }, [cigaretteTransactions, today, weekSet, currentMonthKey, totalAllExpensesThisMonth]);

  // Filtered transactions according to selected period
  const filteredCigaretteTx = useMemo(() => {
    return cigaretteTransactions.filter((tx) => {
      if (periodFilter === 'today') return tx.date === today;
      if (periodFilter === 'week') return weekSet.has(tx.date);
      if (periodFilter === 'month') return tx.date.startsWith(currentMonthKey);
      if (periodFilter === 'last30') {
        const thirtyDaysAgo = addDays(today, -30);
        return tx.date >= thirtyDaysAgo && tx.date <= today;
      }
      return true; // all
    });
  }, [cigaretteTransactions, periodFilter, today, weekSet, currentMonthKey]);

  // Brand-wise statistics for the selected period
  const brandStats = useMemo(() => {
    const map: Record<string, { brand: string; sticks: number; totalCost: number; txCount: number }> = {};

    filteredCigaretteTx.forEach((tx) => {
      const brand = tx.cigaretteBrand || 'Unknown';
      if (!map[brand]) {
        map[brand] = { brand, sticks: 0, totalCost: 0, txCount: 0 };
      }
      map[brand].sticks += tx.quantity || 1;
      map[brand].totalCost += tx.amount;
      map[brand].txCount += 1;
    });

    const list = Object.values(map).sort((a, b) => b.totalCost - a.totalCost);

    // Most frequently selected brand
    let mostFrequent = 'None';
    let maxCount = 0;
    list.forEach((b) => {
      if (b.txCount > maxCount) {
        maxCount = b.txCount;
        mostFrequent = b.brand;
      }
    });

    return { list, mostFrequent };
  }, [filteredCigaretteTx]);

  // Trend Chart data (Last 14 days sticks trend)
  const dailyConsumptionChartData = useMemo(() => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const dStr = addDays(today, -i);
      const sticks = cigaretteTransactions
        .filter((t) => t.date === dStr)
        .reduce((sum, t) => sum + (t.quantity || 1), 0);
      const cost = cigaretteTransactions
        .filter((t) => t.date === dStr)
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        label: i === 0 ? 'Today' : getDayName(dStr, true),
        sublabel: `${formatBDT(cost)} • ${dStr}`,
        value: sticks,
        color: sticks > 5 ? '#ef4444' : '#f59e0b',
      });
    }
    return data;
  }, [cigaretteTransactions, today]);

  // Brand Bar Chart
  const brandComparisonChartData = useMemo(() => {
    return brandStats.list.map((b) => ({
      label: b.brand,
      sublabel: `${b.sticks} sticks`,
      value: b.totalCost,
      color: '#f97316',
    }));
  }, [brandStats]);

  // Add Custom Brand handler
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    await saveCigaretteBrand({
      id: `brand-${Date.now()}`,
      name: newBrandName.trim(),
      defaultPricePerStick: Number(newBrandPrice) || 10,
      isCustom: true,
      sortOrder: cigaretteBrands.length + 1,
    });

    setNewBrandName('');
    setNewBrandPrice('15');
    setIsAddingBrand(false);
  };

  const handleUpdateBrand = async (brand: CigaretteBrand) => {
    await saveCigaretteBrand(brand);
    setEditingBrand(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 rounded-3xl shadow-lg shadow-orange-700/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Special Feature • Bangladesh
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
              Historical Unit Price Protected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-2.5">
            <Cigarette className="w-7 h-7 text-amber-200" /> Dedicated Cigarette Tracker
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl">
            Accurate brand & stick tracking with customizable rates. Formulas: Total = Price/Stick × Quantity. Changing a brand price does not alter historical records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCigaretteModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-white text-amber-950 font-black text-xs hover:bg-amber-50 active:scale-95 transition shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-amber-700" /> Log Cigarette Now
        </button>
      </div>

      {/* 6 Key Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Today Sticks */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Consumed Today
          </span>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2">
            {summaryMetrics.todaySticks} <span className="text-xs font-normal text-stone-400">sticks</span>
          </div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {formatBDT(summaryMetrics.todaySpend)}
          </div>
        </div>

        {/* This Week Sticks */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Consumed This Week
          </span>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2">
            {summaryMetrics.weekSticks} <span className="text-xs font-normal text-stone-400">sticks</span>
          </div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {formatBDT(summaryMetrics.weekSpend)}
          </div>
        </div>

        {/* This Month Sticks */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Consumed This Month
          </span>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2">
            {summaryMetrics.monthSticks} <span className="text-xs font-normal text-stone-400">sticks</span>
          </div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {formatBDT(summaryMetrics.monthSpend)}
          </div>
        </div>

        {/* Most Frequent Brand */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Top Brand
          </span>
          <div className="text-lg font-black text-stone-900 dark:text-stone-100 mt-2 truncate">
            {brandStats.mostFrequent}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Most chosen brand</div>
        </div>

        {/* Daily Average */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Daily Average
          </span>
          <div className="text-xl font-black text-stone-900 dark:text-stone-100 mt-2">
            {formatBDT(summaryMetrics.avgDailySpending)}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">per day in month</div>
        </div>

        {/* % of Total Expenses */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            % of Total Expenses
          </span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {summaryMetrics.cigarettePercentOfTotal}%
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">of this month's budget</div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
        <div className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-2">
          <span>Filter Analytics Period:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'last30', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriodFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                periodFilter === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand-Wise Table & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Brand-Wise Quantity & Spending Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Brand-Wise Quantity & Cost
              </h2>
              <p className="text-xs text-stone-400">Selected period: {periodFilter}</p>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {brandStats.list.length} brands recorded
            </span>
          </div>

          {brandStats.list.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-400">
              No cigarette transactions found for this period.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {brandStats.list.map((item) => (
                <div key={item.brand} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {item.brand}
                    </div>
                    <div className="text-stone-400 text-[11px] mt-0.5">
                      {item.txCount} sessions recorded
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-amber-700 dark:text-amber-300 text-sm">
                      {formatBDT(item.totalCost)}
                    </div>
                    <div className="text-stone-500 dark:text-stone-400 text-[11px] font-bold">
                      {item.sticks} sticks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brand Spending Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Brand Cost Comparison
            </h2>
            <p className="text-xs text-stone-400">Total BDT ৳ spent per brand</p>
          </div>

          <SimpleBarChart data={brandComparisonChartData} height={200} valuePrefix="৳" />
        </div>
      </div>

      {/* Daily Consumption Trend (Last 14 Days) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Daily Cigarette Consumption Trend (Last 14 Days)
            </h2>
            <p className="text-xs text-stone-400">Sticks consumed each day in Asia/Dhaka time</p>
          </div>
          <span className="text-xs text-stone-400 font-mono">Sticks / Day</span>
        </div>

        <SimpleBarChart data={dailyConsumptionChartData} height={200} valuePrefix="" valueSuffix=" sticks" />
      </div>

      {/* Manage Cigarette Brands & Pricing Panel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-600" /> Manage Cigarette Brands & Default Rates
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Customize default prices per stick. Updating a price will only affect new transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingBrand(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Brand
          </button>
        </div>

        {/* Add Brand Form */}
        {isAddingBrand && (
          <form
            onSubmit={handleAddBrand}
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex flex-wrap items-center gap-3 animate-in fade-in"
          >
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                placeholder="e.g. Marlboro Red"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="w-32">
              <label className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                Price / Stick (৳)
              </label>
              <input
                type="number"
                min="1"
                value={newBrandPrice}
                onChange={(e) => setNewBrandPrice(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Save Brand
              </button>
              <button
                type="button"
                onClick={() => setIsAddingBrand(false)}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Brands List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {cigaretteBrands.map((b) => {
            const isEditing = editingBrand?.id === b.id;

            return (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex flex-col justify-between"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingBrand.name}
                      onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                    />
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-stone-400">৳</span>
                      <input
                        type="number"
                        min="1"
                        value={editingBrand.defaultPricePerStick}
                        onChange={(e) =>
                          setEditingBrand({
                            ...editingBrand,
                            defaultPricePerStick: Number(e.target.value),
                          })
                        }
                        className="w-16 px-2 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateBrand(editingBrand)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBrand(null)}
                        className="p-1.5 rounded-lg border border-stone-300 text-stone-500 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        {b.name}
                      </span>
                      {b.isCustom && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-black text-amber-700 dark:text-amber-300">
                        {formatBDT(b.defaultPricePerStick)} / stick
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingBrand(b)}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                          title="Edit price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {b.isCustom && (
                          <button
                            type="button"
                            onClick={() => deleteCigaretteBrand(b.id)}
                            className="p-1 text-stone-400 hover:text-red-600 transition"
                            title="Delete brand"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* List of Filtered Cigarette Transactions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Cigarette Transaction Logs ({filteredCigaretteTx.length})
          </h2>
          <span className="text-xs text-stone-400">Includes historical unit prices</span>
        </div>

        {filteredCigaretteTx.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            No cigarette logs found for this filter.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-96 overflow-y-auto">
            {filteredCigaretteTx.map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-stone-50 dark:hover:bg-stone-800/40 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Cigarette className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {tx.itemName}
                    </div>
                    <div className="text-[11px] text-stone-400 flex items-center gap-2">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span>{tx.time || 'N/A'}</span>
                      <span>•</span>
                      <span>Rate: ৳{tx.unitPrice || 10}/stick</span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="italic">{tx.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                    {formatBDT(tx.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(tx)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingTransaction(tx)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-red-600 transition"
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
  );
};
