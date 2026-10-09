import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatBDT, getTodayDate, addDays, getWeekStartAndEnd } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { PaymentMethod } from '../types';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  Plus,
  Cigarette,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    categories,
    cigaretteBrands,
    setEditingTransaction,
    setDeletingTransaction,
    setIsQuickAddOpen,
    settings,
  } = useApp();

  const today = getTodayDate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Quick Date Presets
  const applyDatePreset = (preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'all') => {
    if (preset === 'today') {
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === 'yesterday') {
      const yDate = addDays(today, -1);
      setDateFrom(yDate);
      setDateTo(yDate);
    } else if (preset === 'thisWeek') {
      const { start, end } = getWeekStartAndEnd(today, settings.weekStartDay);
      setDateFrom(start);
      setDateTo(end);
    } else if (preset === 'thisMonth') {
      const monthPrefix = today.substring(0, 7);
      setDateFrom(`${monthPrefix}-01`);
      setDateTo(today);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedPayment('all');
    setMinAmount('');
    setMaxAmount('');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  // Filtered and Sorted list
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search query (item name or notes)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesItem = t.itemName.toLowerCase().includes(q);
          const matchesNotes = t.notes ? t.notes.toLowerCase().includes(q) : false;
          const matchesCat = t.categoryNameSnapshot.toLowerCase().includes(q);
          if (!matchesItem && !matchesNotes && !matchesCat) return false;
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'cigarette-only') {
            if (t.expenseType !== 'cigarette') return false;
          } else if (t.categoryId !== selectedCategory) {
            return false;
          }
        }

        // Cigarette Brand filter
        if (selectedBrand !== 'all') {
          if (t.cigaretteBrand !== selectedBrand) return false;
        }

        // Payment Method filter
        if (selectedPayment !== 'all') {
          if (t.paymentMethod !== selectedPayment) return false;
        }

        // Min & Max Amount
        if (minAmount && t.amount < Number(minAmount)) return false;
        if (maxAmount && t.amount > Number(maxAmount)) return false;

        // Date range
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt - a.createdAt;
        }
        if (sortBy === 'oldest') {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.createdAt - b.createdAt;
        }
        if (sortBy === 'highest') {
          return b.amount - a.amount;
        }
        if (sortBy === 'lowest') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [
    transactions,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedPayment,
    minAmount,
    maxAmount,
    dateFrom,
    dateTo,
    sortBy,
  ]);

  // Total filtered amount
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Export filtered list to CSV
  const exportFilteredCSV = () => {
    const headers = [
      'ID',
      'Date',
      'Time',
      'Category',
      'Item',
      'Amount (BDT)',
      'Expense Type',
      'Cigarette Brand',
      'Quantity',
      'Unit Price',
      'Payment Method',
      'Notes',
    ];
    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.time || ''}"`,
      `"${t.categoryNameSnapshot}"`,
      `"${t.itemName}"`,
      t.amount,
      `"${t.expenseType}"`,
      `"${t.cigaretteBrand || ''}"`,
      t.quantity ?? 1,
      t.unitPrice ?? '',
      `"${t.paymentMethod}"`,
      `"${t.notes || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DailyKhata-Transactions-Export-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick stats */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            Transaction History
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Full record of all daily expenses with search, multi-criteria filtering, and CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportFilteredCSV}
            disabled={filteredTransactions.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>

          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search expenses by item, note, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                showAdvancedFilters
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Quick Date Presets Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-400 font-semibold shrink-0">Quick Dates:</span>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'thisWeek', label: 'This Week' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'all', label: 'All Dates' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyDatePreset(p.id)}
              className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-medium shrink-0 transition"
            >
              {p.label}
            </button>
          ))}

          {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || dateFrom || minAmount) && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-1 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold shrink-0 transition"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Advanced Filters Expandable Grid */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 animate-in fade-in text-xs">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <option value="all">All Categories</option>
                <option value="cigarette-only">Cigarettes Only</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cigarette Brand */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                Cigarette Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <option value="all">All Brands</option>
                {cigaretteBrands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                Payment Method
              </label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 capitalize"
              >
                <option value="all">All Methods</option>
                {(['cash', 'bkash', 'nagad', 'rocket', 'card', 'bank', 'other'] as PaymentMethod[]).map(
                  (pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                Min ৳
              </label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                Max ৳
              </label>
              <input
                type="number"
                placeholder="Any"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                Date Range
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2 py-1 text-[11px] rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 mb-1"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2 py-1 text-[11px] rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
        )}

        {/* Filter Summary Results Bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500 pt-1">
          <span>
            Found <strong>{filteredTransactions.length}</strong> transactions
          </span>
          <span>
            Total Amount:{' '}
            <strong className="text-emerald-700 dark:text-emerald-300 font-mono text-sm">
              {formatBDT(filteredTotal)}
            </strong>
          </span>
        </div>
      </div>

      {/* Transactions Table / Card List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400 space-y-3">
            <p>No transactions match the current criteria.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-stone-50/70 dark:hover:bg-stone-800/30 px-3 rounded-2xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
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
                    <div className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span>{tx.itemName}</span>
                      {tx.expenseType === 'cigarette' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {tx.cigaretteBrand} • {tx.quantity} sticks @ ৳{tx.unitPrice}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-stone-600 dark:text-stone-300">{tx.date}</span>
                      <span>•</span>
                      <span>{tx.time || 'N/A'}</span>
                      <span>•</span>
                      <span>{tx.categoryNameSnapshot}</span>
                      <span>•</span>
                      <span className="capitalize">{tx.paymentMethod}</span>
                      {tx.notes && <span className="italic">"{tx.notes}"</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-base font-black text-stone-900 dark:text-stone-100 font-mono">
                      {formatBDT(tx.amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => setEditingTransaction(tx)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTransaction(tx)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
