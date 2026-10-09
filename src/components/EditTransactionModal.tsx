import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseTransaction, PaymentMethod } from '../types';
import { formatBDT } from '../utils/formatters';
import { X, Check, Trash2, Edit } from 'lucide-react';

export const EditTransactionModal: React.FC = () => {
  const {
    editingTransaction,
    setEditingTransaction,
    updateTransaction,
    setDeletingTransaction,
    categories,
    cigaretteBrands,
  } = useApp();

  const [formData, setFormData] = useState<ExpenseTransaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setFormData({ ...editingTransaction });
    } else {
      setFormData(null);
    }
  }, [editingTransaction]);

  if (!formData || !editingTransaction) return null;

  const isCigarette = formData.expenseType === 'cigarette';

  const handleBrandChange = (brandName: string) => {
    const brand = cigaretteBrands.find((b) => b.name === brandName);
    const unitPrice = brand ? brand.defaultPricePerStick : formData.unitPrice || 10;
    const qty = formData.quantity || 1;
    setFormData({
      ...formData,
      cigaretteBrand: brandName,
      unitPrice,
      amount: unitPrice * qty,
      itemName: `${brandName} (${qty} ${qty === 1 ? 'stick' : 'sticks'})`,
    });
  };

  const handleQuantityChange = (newQty: number) => {
    const safeQty = Math.max(1, newQty);
    if (isCigarette) {
      const unit = formData.unitPrice || 10;
      setFormData({
        ...formData,
        quantity: safeQty,
        amount: unit * safeQty,
        itemName: `${formData.cigaretteBrand || 'Cigarette'} (${safeQty} ${safeQty === 1 ? 'stick' : 'sticks'})`,
      });
    } else {
      setFormData({
        ...formData,
        quantity: safeQty,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    try {
      const selectedCat = categories.find((c) => c.id === formData.categoryId);
      const updatedTx: ExpenseTransaction = {
        ...formData,
        categoryNameSnapshot: selectedCat ? selectedCat.name : formData.categoryNameSnapshot,
        amount: Number(formData.amount) || 0,
      };

      await updateTransaction(updatedTx);
      setEditingTransaction(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Edit Transaction
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Update amounts, dates, or correction of items
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingTransaction(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Cigarette specific brand selection if cigarette */}
          {isCigarette && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Cigarette Brand
              </label>
              <select
                value={formData.cigaretteBrand || ''}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                {cigaretteBrands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} (৳{b.defaultPricePerStick}/stick)
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <span>Preserved Unit Price: ৳{formData.unitPrice || 10}</span>
                <span>Sticks: {formData.quantity || 1}</span>
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.nameBn})
                </option>
              ))}
            </select>
          </div>

          {/* Item Name & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                Amount (BDT ৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                  ৳
                </span>
                <input
                  type="number"
                  step="any"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Quantity, Date, Time */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                {isCigarette ? 'Sticks' : 'Quantity'}
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity || 1}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Time</label>
              <input
                type="time"
                value={formData.time || ''}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-2">
              {(['cash', 'bkash', 'nagad', 'rocket', 'card', 'bank', 'other'] as PaymentMethod[]).map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: pm })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                    formData.paymentMethod === pm
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
              Notes
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                const target = editingTransaction;
                setEditingTransaction(null);
                setDeletingTransaction(target);
              }}
              className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Transaction
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
