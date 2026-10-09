import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { ExpenseCategory, RecurringExpense, CategoryGroup } from '../types';
import { formatBDT } from '../utils/formatters';
import { dbService } from '../services/db';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Download,
  Upload,
  Settings as SettingsIcon,
  Database,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calendar,
  Save,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export const CategoriesSettingsView: React.FC = () => {
  const {
    categories,
    saveCategory,
    deleteCategory,
    recurringExpenses,
    saveRecurringExpense,
    deleteRecurringExpense,
    logRecurringExpense,
    settings,
    saveSettings,
    seedDemoData,
    clearAllTransactions,
    refreshData,
    transactions,
    setIsDbStatusModalOpen,
  } = useApp();

  // Active sub-tab
  const [subTab, setSubTab] = useState<'categories' | 'recurring' | 'backup' | 'preferences'>('categories');

  // Category editing/adding state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [newCatGroup, setNewCatGroup] = useState<CategoryGroup>('Food & Drinks');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Recurring expense adding state
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recCatId, setRecCatId] = useState(categories[0]?.id || 'cat-rent');
  const [recAmount, setRecAmount] = useState('15000');
  const [recFrequency, setRecFrequency] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [recDay, setRecDay] = useState('1');

  // Backup & Import states
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Category save handler
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const cat: ExpenseCategory = {
      id: editingCategory ? editingCategory.id : `cat-custom-${Date.now()}`,
      name: newCatName.trim(),
      nameBn: newCatNameBn.trim() || newCatName.trim(),
      group: newCatGroup,
      icon: newCatIcon,
      color: newCatColor,
      isCustom: true,
    };

    await saveCategory(cat);
    setIsAddingCategory(false);
    setEditingCategory(null);
    setNewCatName('');
    setNewCatNameBn('');
  };

  // Add Recurring Template
  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;

    await saveRecurringExpense({
      id: `rec-${Date.now()}`,
      title: recTitle.trim(),
      categoryId: recCatId,
      amount: Number(recAmount) || 0,
      frequency: recFrequency,
      dayOfMonth: parseInt(recDay) || 1,
      paymentMethod: 'bank',
      notes: 'Monthly recurring template',
    });

    setIsAddingRecurring(false);
    setRecTitle('');
  };

  // Export JSON
  const handleExportJSON = async () => {
    const jsonStr = await dbService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DailyKhata-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export All CSV
  const handleExportAllCSV = async () => {
    const allTxs = await dbService.getAllTransactions();
    const csvStr = dbService.exportTransactionsCSV(allTxs);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DailyKhata-All-Transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportError(null);
        setImportStatus(null);
        const content = event.target?.result as string;
        const result = await dbService.importDataJSON(content, 'merge');
        await refreshData();
        setImportStatus(`Successfully restored ${result.count} records into DailyKhata!`);
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-emerald-600" /> Categories & App Settings
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Manage spending categories, recurring bill templates, backup/restore, and language options.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl overflow-x-auto">
          {(
            [
              { id: 'categories', label: 'Categories' },
              { id: 'recurring', label: 'Recurring Bills' },
              { id: 'backup', label: 'Backup & Restore' },
              { id: 'preferences', label: 'Preferences' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                subTab === t.id
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab 1: Categories Management */}
      {subTab === 'categories' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Expense Categories ({categories.length})
              </h2>
              <p className="text-xs text-stone-400">
                Predefined housing, food, transportation, personal, and custom categories
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setNewCatName('');
                setNewCatNameBn('');
                setIsAddingCategory(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          {/* Add / Edit Category Modal / Drawer */}
          {isAddingCategory && (
            <form
              onSubmit={handleSaveCategory}
              className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-4 animate-in fade-in"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">English Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pet Care"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Bengali Name</label>
                  <input
                    type="text"
                    placeholder="e.g. পোষা প্রাণী"
                    value={newCatNameBn}
                    onChange={(e) => setNewCatNameBn(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Group</label>
                  <select
                    value={newCatGroup}
                    onChange={(e) => setNewCatGroup(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    {[
                      'Housing',
                      'Food & Drinks',
                      'Transportation',
                      'Personal',
                      'Communication',
                      'Lifestyle',
                      'Health & Education',
                      'Other',
                    ].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Color</label>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-full h-8 rounded-xl border border-stone-200 dark:border-stone-700 bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* Category Cards by Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {cat.nameBn} • <span className="font-medium text-stone-500">{cat.group}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {cat.isCustom && (
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Recurring Bills / Expenses */}
      {subTab === 'recurring' && (
        <div className="space-y-5">
          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Safety Guarantee: No Automatic Duplication
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              In accordance with financial best practices, DailyKhata stores recurring expense templates (like House Rent or Broadband) without automatically creating duplicate transactions. Click <strong>"Log Expense Now"</strong> when you actually make the payment.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Recurring Templates ({recurringExpenses.length})
            </h2>

            <button
              type="button"
              onClick={() => setIsAddingRecurring(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Template
            </button>
          </div>

          {/* Add Recurring Template Form */}
          {isAddingRecurring && (
            <form
              onSubmit={handleAddRecurring}
              className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                New Recurring Template
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly Flat Rent"
                    value={recTitle}
                    onChange={(e) => setRecTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Category</label>
                  <select
                    value={recCatId}
                    onChange={(e) => setRecCatId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    min="1"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Typical Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={recDay}
                    onChange={(e) => setRecDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRecurring(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Save Template
                </button>
              </div>
            </form>
          )}

          {/* List of Recurring Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recurringExpenses.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {rec.frequency === 'monthly'
                        ? `Usually on day ${rec.dayOfMonth} of month`
                        : rec.frequency}
                    </p>
                  </div>
                  <div className="text-lg font-black text-stone-900 dark:text-stone-100 font-mono">
                    {formatBDT(rec.amount)}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                  <span className="text-[11px] text-stone-400">
                    {rec.lastLoggedDate ? `Last logged: ${rec.lastLoggedDate}` : 'Not logged yet this month'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => deleteRecurringExpense(rec.id)}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 transition"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => logRecurringExpense(rec)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Log Expense Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 3: Backup & Restore */}
      {subTab === 'backup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Export Your Data
            </h2>
            <p className="text-xs text-stone-400">
              Download your complete financial records at any time. Exports include category snapshots, cigarette stick counts, and historical unit prices.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Complete JSON Backup
              </button>

              <button
                type="button"
                onClick={handleExportAllCSV}
                className="px-4 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center gap-2 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export All Transactions to CSV
              </button>
            </div>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Restore from Backup File
            </h2>
            <p className="text-xs text-stone-400">
              Select a valid DailyKhata JSON backup file to restore records. Data is validated before applying to prevent corrupted records.
            </p>

            <div className="p-6 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 text-center space-y-2">
              <Upload className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="text-xs font-medium text-stone-600 dark:text-stone-300">
                Click to choose a JSON backup file
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="text-xs text-stone-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            {importStatus && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {importStatus}
              </div>
            )}

            {importError && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                {importError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 4: Preferences & Database Engine Status */}
      {subTab === 'preferences' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              App Display & Currency Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Week Start Day
                </label>
                <select
                  value={settings.weekStartDay}
                  onChange={(e) => saveSettings({ ...settings, weekStartDay: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold capitalize"
                >
                  <option value="monday">Monday (Standard)</option>
                  <option value="sunday">Sunday</option>
                  <option value="saturday">Saturday (Bengali Week start)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Numeral Style
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bengaliNumbers"
                    checked={settings.showBengaliNumbers}
                    onChange={(e) =>
                      saveSettings({ ...settings, showBengaliNumbers: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="bengaliNumbers" className="text-xs font-semibold cursor-pointer">
                    Show Bengali Numerals (যেমন: ৳১,২৫০ পরিবর্তে ৳1,250)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Database Info & Testing Controls */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" /> Storage Architecture & Testing Tools
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Inspect persistent IndexedDB stores or seed scenario data for validation tests.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDbStatusModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-200"
              >
                Inspect DB
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await seedDemoData();
                  alert('Seeded realistic test scenarios (Camel 3 sticks, Gold Leaf Switch 2 sticks, Breakfast ৳80, Transport ৳60)!');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-4 h-4" /> Seed Test Scenarios
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (confirm('Clear all transactions? Categories and brands will be preserved.')) {
                    await clearAllTransactions();
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition"
              >
                Reset All Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
