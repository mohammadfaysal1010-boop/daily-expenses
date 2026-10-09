import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { QUICK_ADD_PRESETS } from '../data/defaults';
import { CategoryIcon } from './CategoryIcon';
import { formatBDT, getTodayDate, getCurrentTime } from '../utils/formatters';
import { X, Check, Zap, Edit3, Calendar, Clock, CreditCard, ChevronRight, Cigarette } from 'lucide-react';
import { PaymentMethod } from '../types';

export const QuickExpenseModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    categories,
    addTransaction,
    setIsCigaretteModalOpen,
    settings,
  } = useApp();

  const [activeMode, setActiveMode] = useState<'quick' | 'custom'>('quick');

  // Custom Form state
  const [categoryId, setCategoryId] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState<string>(getTodayDate());
  const [time, setTime] = useState<string>(getCurrentTime());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Quick Preset fast-edit amount modal/state
  const [editingPreset, setEditingPreset] = useState<{
    name: string;
    categoryId: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    if (isQuickAddOpen) {
      if (categories.length > 0 && !categoryId) {
        setCategoryId(categories[0].id);
      }
      setDate(getTodayDate());
      setTime(getCurrentTime());
      setJustSaved(false);
      setEditingPreset(null);
    }
  }, [isQuickAddOpen, categories, categoryId]);

  if (!isQuickAddOpen) return null;

  // Handle 1-click Quick Add preset
  const handleQuickPresetClick = async (preset: typeof QUICK_ADD_PRESETS[0]) => {
    if (preset.isCigarette) {
      setIsQuickAddOpen(false);
      setIsCigaretteModalOpen(true);
      return;
    }

    setEditingPreset({
      name: preset.name,
      categoryId: preset.categoryId,
      amount: preset.defaultAmount,
    });
  };

  const handleConfirmPreset = async () => {
    if (!editingPreset) return;
    setIsSubmitting(true);
    try {
      const cat = categories.find((c) => c.id === editingPreset.categoryId);
      await addTransaction({
        categoryId: editingPreset.categoryId,
        categoryNameSnapshot: cat ? cat.name : editingPreset.name,
        itemName: editingPreset.name,
        amount: Number(editingPreset.amount) || 0,
        quantity: 1,
        expenseType: 'general',
        paymentMethod,
        notes: notes.trim() || undefined,
        date,
        time,
      });

      setJustSaved(true);
      setTimeout(() => {
        setIsQuickAddOpen(false);
        setJustSaved(false);
        setEditingPreset(null);
      }, 600);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    const cat = categories.find((c) => c.id === categoryId);
    const selectedItemName = itemName.trim() || (cat ? cat.name : 'Expense');

    setIsSubmitting(true);
    try {
      await addTransaction({
        categoryId: categoryId || 'cat-misc',
        categoryNameSnapshot: cat ? cat.name : 'Miscellaneous',
        itemName: selectedItemName,
        amount: numAmount,
        quantity: parseInt(quantity) || 1,
        expenseType: categoryId === 'cat-cigarettes' ? 'cigarette' : 'general',
        paymentMethod,
        notes: notes.trim() || undefined,
        date,
        time,
      });

      setJustSaved(true);
      setTimeout(() => {
        setIsQuickAddOpen(false);
        setJustSaved(false);
      }, 600);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Mode Tabs */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveMode('quick');
                setEditingPreset(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeMode === 'quick'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Method A: Quick Add
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('custom')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeMode === 'custom'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-500" /> Method B: Custom Entry
            </button>
          </div>

          <button
            onClick={() => setIsQuickAddOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeMode === 'quick' ? (
            <div>
              {editingPreset ? (
                /* Quick Preset confirmation / amount adjustment view */
                <div className="space-y-4 p-2 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider">
                        Logging Predefined Expense
                      </div>
                      <div className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                        {editingPreset.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPreset(null)}
                      className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 underline"
                    >
                      Change item
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                      Amount (BDT ৳)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-stone-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={editingPreset.amount}
                        onChange={(e) =>
                          setEditingPreset({
                            ...editingPreset,
                            amount: Number(e.target.value),
                          })
                        }
                        className="w-full pl-11 pr-4 py-3.5 text-2xl font-black rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                      Payment Method
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['cash', 'bkash', 'nagad', 'rocket', 'card', 'bank'] as PaymentMethod[]).map((pm) => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setPaymentMethod(pm)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                            paymentMethod === pm
                              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & Note */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1">Optional Note</label>
                      <input
                        type="text"
                        placeholder="e.g. at Dhanmondi"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmPreset}
                      disabled={isSubmitting || justSaved}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                    >
                      {justSaved ? (
                        <>
                          <Check className="w-5 h-5 animate-bounce" /> Recorded!
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" /> Confirm {formatBDT(editingPreset.amount)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Preset Buttons Grid */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Tap any preset to record instantly
                    </p>
                    <span className="text-[11px] text-stone-400">Minimal clicks</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {QUICK_ADD_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleQuickPresetClick(preset)}
                        className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition group active:scale-[0.98] flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition group-hover:scale-110"
                            style={{ backgroundColor: `${preset.color}15`, color: preset.color }}
                          >
                            <CategoryIcon name={preset.icon} className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-700/60 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
                            {preset.isCigarette ? 'Tracker' : formatBDT(preset.defaultAmount)}
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="font-bold text-sm text-stone-800 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {preset.name}
                          </div>
                          <div className="text-[11px] text-stone-400">{preset.nameBn}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Cigarette quick banner */}
                  <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <Cigarette className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          Special Cigarette Tracker
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          Brand selection, stick counts, and historical unit price preservation
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickAddOpen(false);
                        setIsCigaretteModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Custom Expense Form */
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.nameBn}) — {c.group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                    Expense Item / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lunch at Khanas"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                    Amount (BDT ৳) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Date, Time, Quantity */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Payment Method
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['cash', 'bkash', 'nagad', 'rocket', 'card', 'bank', 'other'] as PaymentMethod[]).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                        paymentMethod === pm
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || justSaved}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                >
                  {justSaved ? (
                    <>
                      <Check className="w-5 h-5 animate-bounce" /> Recorded Successfully!
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" /> Save Expense Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
