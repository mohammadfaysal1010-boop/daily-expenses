import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatBDT } from '../utils/formatters';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export const DeleteConfirmModal: React.FC = () => {
  const { deletingTransaction, setDeletingTransaction, deleteTransaction } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!deletingTransaction) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={() => setDeletingTransaction(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Confirm Delete Transaction?
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Are you sure you want to remove this record? All related daily, weekly, and monthly reports will update immediately.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 text-xs space-y-1">
          <div className="font-bold text-stone-800 dark:text-stone-200 text-sm">
            {deletingTransaction.itemName}
          </div>
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span>Date: {deletingTransaction.date}</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
              {formatBDT(deletingTransaction.amount)}
            </span>
          </div>
          {deletingTransaction.expenseType === 'cigarette' && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400">
              Cigarette Brand: {deletingTransaction.cigaretteBrand} ({deletingTransaction.quantity} sticks)
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setDeletingTransaction(null)}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-red-600/30"
          >
            <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
