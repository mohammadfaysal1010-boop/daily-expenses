import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, ShieldCheck, CloudOff, RefreshCw, X, Sparkles, CheckCircle2, FileText } from 'lucide-react';

export const DatabaseStatusModal: React.FC = () => {
  const {
    isDbStatusModalOpen,
    setIsDbStatusModalOpen,
    seedDemoData,
    clearAllTransactions,
    transactions,
    refreshData,
  } = useApp();

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  if (!isDbStatusModalOpen) return null;

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Database Architecture & Status
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                DailyKhata Storage Engine (IndexedDB + Cloud Sync Architecture)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDbStatusModalOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Active Mode Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Active Backend: Local IndexedDB (ACID Compliant)
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              DailyKhata operates on a structured, durable client-side <strong>IndexedDB database (`DailyKhataDB` v1)</strong> with asynchronous transaction isolation. It persists all transactions, categories, budgets, and historical stick prices across browser reloads, browser closures, and offline sessions.
            </p>
            <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
              Current records in store: {transactions.length} transactions
            </div>
          </div>

          {/* Development Mode Notice & Limitations */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
              <CloudOff className="w-4 h-4 text-amber-600" />
              Development Mode Limitations
            </div>
            <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1 list-disc list-inside">
              <li>Data is saved permanently in your current browser profile.</li>
              <li>Clearing your browser site data will reset the local database.</li>
              <li>To prevent data loss, use the <strong>JSON Backup & CSV Export</strong> tools in the Settings tab.</li>
              <li>Multi-device cloud synchronization requires connecting to Firebase Cloud Firestore.</li>
            </ul>
          </div>

          {/* Firebase Setup Guide */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-50/50 dark:bg-stone-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Cloud Firestore Setup Instructions
              </h4>
              <span className="text-[10px] bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-full font-mono">
                Optional Upgrade
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              When ready for multi-device sync, follow these exact steps:
            </p>
            <ol className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-decimal list-inside font-mono bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
              <li>1. Enable Google Firestore in Google AI Studio or Firebase Console.</li>
              <li>2. Provision web app credentials in `firebase-applet-config.json`.</li>
              <li>3. Configure Google Authentication in Firebase Console (popup sign-in).</li>
              <li>4. Deploy security rules from `firestore.rules`.</li>
            </ol>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
            >
              {seedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Seeded Test Scenarios!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Seed Realistic Test Data
                </>
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Reset all transactions? Categories and brands will remain intact.')) {
                  await clearAllTransactions();
                }
              }}
              className="py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition"
            >
              Clear Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
