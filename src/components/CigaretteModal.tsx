import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatBDT, getTodayDate, getCurrentTime } from '../utils/formatters';
import { Cigarette, Plus, Minus, X, Check, Clock, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { PaymentMethod } from '../types';

export const CigaretteModal: React.FC = () => {
  const { isCigaretteModalOpen, setIsCigaretteModalOpen, cigaretteBrands, addTransaction, settings } = useApp();

  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState<string>(getTodayDate());
  const [time, setTime] = useState<string>(getCurrentTime());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Set default selected brand when modal opens
  useEffect(() => {
    if (isCigaretteModalOpen && cigaretteBrands.length > 0 && !selectedBrandId) {
      // Pick Camel or first brand
      const camel = cigaretteBrands.find((b) => b.name.toLowerCase().includes('camel')) || cigaretteBrands[0];
      setSelectedBrandId(camel.id);
      setQuantity(1);
      setDate(getTodayDate());
      setTime(getCurrentTime());
      setNotes('');
      setJustSaved(false);
    }
  }, [isCigaretteModalOpen, cigaretteBrands, selectedBrandId]);

  if (!isCigaretteModalOpen) return null;

  const currentBrand = cigaretteBrands.find((b) => b.id === selectedBrandId) || cigaretteBrands[0];
  const unitPrice = currentBrand ? currentBrand.defaultPricePerStick : 10;
  const totalCost = unitPrice * quantity;

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBrand) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        categoryId: 'cat-cigarettes',
        categoryNameSnapshot: 'Cigarettes',
        itemName: `${currentBrand.name} (${quantity} ${quantity === 1 ? 'stick' : 'sticks'})`,
        amount: totalCost,
        quantity,
        unitPrice,
        expenseType: 'cigarette',
        cigaretteBrand: currentBrand.name,
        paymentMethod,
        notes: notes.trim() || undefined,
        date,
        time,
      });

      setJustSaved(true);
      setTimeout(() => {
        setIsCigaretteModalOpen(false);
        setJustSaved(false);
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Cigarette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Log Cigarette Expense
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                সিগারেট খরচ এন্ট্রি — Brand, Sticks & Total Calculation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCigaretteModalOpen(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Brand Selection Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              Select Cigarette Brand
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              {cigaretteBrands.map((brand) => {
                const isSelected = brand.id === currentBrand?.id;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => setSelectedBrandId(brand.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{brand.name}</span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1 text-xs text-stone-500 dark:text-stone-400">
                      <span>Per stick:</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {formatBDT(brand.defaultPricePerStick, {
                          bengaliDigits: settings.showBengaliNumbers,
                        })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector Card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Quantity (Sticks / শলাকা)
              </span>
              <span className="text-xs text-stone-400">
                {currentBrand?.name} @ {formatBDT(unitPrice)}/stick
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition shadow-sm"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex-1 flex flex-col items-center">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center text-3xl font-extrabold text-stone-900 dark:text-stone-100 bg-transparent border-b-2 border-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                  {quantity === 1 ? '1 stick' : `${quantity} sticks`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stick Presets */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-stone-200/50 dark:border-stone-800/60">
              {[1, 2, 3, 5, 10, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    quantity === preset
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200/60 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Automatic Calculation Highlight */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Total Cost = {quantity} × ৳{unitPrice}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Preserved historical unit price: ৳{unitPrice}
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {formatBDT(totalCost, { bengaliDigits: settings.showBengaliNumbers })}
            </div>
          </div>

          {/* Date, Time, Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date (Asia/Dhaka)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Payment Method
              </label>
              <div className="flex flex-wrap gap-2">
                {(['cash', 'bkash', 'nagad', 'rocket', 'card', 'other'] as PaymentMethod[]).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                      paymentMethod === pm
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                Optional Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Afternoon break with colleagues"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || justSaved}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-white transition flex items-center justify-center gap-2 shadow-lg ${
                justSaved
                  ? 'bg-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] shadow-emerald-600/20'
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-5 h-5 animate-bounce" /> Saved Successfully!
                </>
              ) : (
                <>
                  <Cigarette className="w-5 h-5" /> Save Cigarette Expense ({formatBDT(totalCost)})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
