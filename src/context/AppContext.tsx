import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ExpenseTransaction,
  ExpenseCategory,
  CigaretteBrand,
  BudgetConfig,
  RecurringExpense,
  AppSettings,
  ActiveTab,
} from '../types';
import { dbService } from '../services/db';
import { DEFAULT_APP_SETTINGS } from '../data/defaults';
import { getTodayDate, getCurrentTime, getWeekStartAndEnd } from '../utils/formatters';

interface AppContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Modals
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  isCigaretteModalOpen: boolean;
  setIsCigaretteModalOpen: (open: boolean) => void;
  editingTransaction: ExpenseTransaction | null;
  setEditingTransaction: (tx: ExpenseTransaction | null) => void;
  deletingTransaction: ExpenseTransaction | null;
  setDeletingTransaction: (tx: ExpenseTransaction | null) => void;
  isDbStatusModalOpen: boolean;
  setIsDbStatusModalOpen: (open: boolean) => void;

  // Data
  transactions: ExpenseTransaction[];
  categories: ExpenseCategory[];
  cigaretteBrands: CigaretteBrand[];
  recurringExpenses: RecurringExpense[];
  settings: AppSettings;
  currentBudget: BudgetConfig | null;
  isLoading: boolean;

  // Actions
  addTransaction: (tx: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ExpenseTransaction>;
  updateTransaction: (tx: ExpenseTransaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveCategory: (category: ExpenseCategory) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveCigaretteBrand: (brand: CigaretteBrand) => Promise<void>;
  deleteCigaretteBrand: (id: string) => Promise<void>;
  saveBudget: (budget: BudgetConfig) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  saveRecurringExpense: (rec: RecurringExpense) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  logRecurringExpense: (rec: RecurringExpense) => Promise<void>;
  refreshData: () => Promise<void>;
  seedDemoData: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;

  // Dashboard Metrics
  metrics: {
    todayTotal: number;
    thisWeekTotal: number;
    thisMonthTotal: number;
    todayRemainingBudget: number;
    mostExpensiveCategoryThisMonth: { name: string; amount: number; percentage: number } | null;
    totalCigaretteSpendingThisMonth: number;
    totalCigaretteSticksThisMonth: number;
    todayCigaretteSpending: number;
    todayCigaretteSticks: number;
  };

  // Helper
  getCategoryById: (id: string) => ExpenseCategory | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCigaretteModalOpen, setIsCigaretteModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ExpenseTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<ExpenseTransaction | null>(null);
  const [isDbStatusModalOpen, setIsDbStatusModalOpen] = useState(false);

  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [cigaretteBrands, setCigaretteBrands] = useState<CigaretteBrand[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [currentBudget, setCurrentBudget] = useState<BudgetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = getTodayDate();
  const currentMonthKey = today.substring(0, 7); // YYYY-MM

  // Load everything from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [txList, catList, brandList, recList, setObj, budgetObj] = await Promise.all([
        dbService.getAllTransactions(),
        dbService.getAllCategories(),
        dbService.getAllCigaretteBrands(),
        dbService.getAllRecurringExpenses(),
        dbService.getSettings(),
        dbService.getBudget(currentMonthKey),
      ]);

      setTransactions(txList);
      setCategories(catList);
      setCigaretteBrands(brandList);
      setRecurringExpenses(recList);
      setSettings(setObj);
      setCurrentBudget(budgetObj);
    } catch (error) {
      console.error('Failed to load data from IndexedDB:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonthKey]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Apply dark/light theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  // Add Transaction
  const addTransaction = useCallback(
    async (txData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = Date.now();
      const newTx: ExpenseTransaction = {
        ...txData,
        id: `tx-${now}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };

      await dbService.addTransaction(newTx);
      setTransactions((prev) => [newTx, ...prev]);
      return newTx;
    },
    []
  );

  // Update Transaction
  const updateTransaction = useCallback(async (tx: ExpenseTransaction) => {
    await dbService.updateTransaction(tx);
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
  }, []);

  // Delete Transaction
  const deleteTransaction = useCallback(async (id: string) => {
    await dbService.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Category Actions
  const saveCategory = useCallback(async (category: ExpenseCategory) => {
    await dbService.saveCategory(category);
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id);
      if (exists) {
        return prev.map((c) => (c.id === category.id ? category : c));
      }
      return [...prev, category];
    });
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await dbService.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Cigarette Brand Actions
  const saveCigaretteBrand = useCallback(async (brand: CigaretteBrand) => {
    await dbService.saveCigaretteBrand(brand);
    setCigaretteBrands((prev) => {
      const exists = prev.some((b) => b.id === brand.id);
      const updated = exists ? prev.map((b) => (b.id === brand.id ? brand : b)) : [...prev, brand];
      return updated.sort((a, b) => a.sortOrder - b.sortOrder);
    });
  }, []);

  const deleteCigaretteBrand = useCallback(async (id: string) => {
    await dbService.deleteCigaretteBrand(id);
    setCigaretteBrands((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Budget Actions
  const saveBudget = useCallback(async (budget: BudgetConfig) => {
    await dbService.saveBudget(budget);
    setCurrentBudget(budget);
  }, []);

  // Settings Actions
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    await dbService.saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  // Recurring Expenses
  const saveRecurringExpense = useCallback(async (rec: RecurringExpense) => {
    await dbService.saveRecurringExpense(rec);
    setRecurringExpenses((prev) => {
      const exists = prev.some((r) => r.id === rec.id);
      return exists ? prev.map((r) => (r.id === rec.id ? rec : r)) : [...prev, rec];
    });
  }, []);

  const deleteRecurringExpense = useCallback(async (id: string) => {
    await dbService.deleteRecurringExpense(id);
    setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const logRecurringExpense = useCallback(
    async (rec: RecurringExpense) => {
      const cat = getCategoryById(rec.categoryId);
      const catName = cat ? cat.name : 'Recurring Expense';
      await addTransaction({
        categoryId: rec.categoryId,
        categoryNameSnapshot: catName,
        itemName: rec.title,
        amount: rec.amount,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: rec.paymentMethod,
        notes: rec.notes ? `[Recurring: ${rec.notes}]` : '[Recurring Expense]',
        date: getTodayDate(),
        time: getCurrentTime(),
      });

      const updatedRec: RecurringExpense = {
        ...rec,
        lastLoggedDate: getTodayDate(),
      };
      await saveRecurringExpense(updatedRec);
    },
    [addTransaction, getCategoryById, saveRecurringExpense]
  );

  // Demo Seeding
  const seedDemoData = useCallback(async () => {
    await dbService.seedDemoTransactions();
    await refreshData();
  }, [refreshData]);

  const clearAllTransactions = useCallback(async () => {
    await dbService.clearAllTransactions();
    setTransactions([]);
  }, []);

  // Dashboard Metrics Computations
  const metrics = useMemo(() => {
    const todayStr = getTodayDate();
    const monthPrefix = todayStr.substring(0, 7);
    const { dates: weekDates } = getWeekStartAndEnd(todayStr, settings.weekStartDay);
    const weekDateSet = new Set(weekDates);

    let todayTotal = 0;
    let thisWeekTotal = 0;
    let thisMonthTotal = 0;
    let totalCigaretteSpendingThisMonth = 0;
    let totalCigaretteSticksThisMonth = 0;
    let todayCigaretteSpending = 0;
    let todayCigaretteSticks = 0;

    const monthCatMap: Record<string, { name: string; amount: number }> = {};

    transactions.forEach((tx) => {
      const isToday = tx.date === todayStr;
      const isInWeek = weekDateSet.has(tx.date);
      const isInMonth = tx.date.startsWith(monthPrefix);

      if (isToday) {
        todayTotal += tx.amount;
        if (tx.expenseType === 'cigarette') {
          todayCigaretteSpending += tx.amount;
          todayCigaretteSticks += tx.quantity || 1;
        }
      }

      if (isInWeek) {
        thisWeekTotal += tx.amount;
      }

      if (isInMonth) {
        thisMonthTotal += tx.amount;

        if (tx.expenseType === 'cigarette') {
          totalCigaretteSpendingThisMonth += tx.amount;
          totalCigaretteSticksThisMonth += tx.quantity || 1;
        }

        // Category breakdown for the month
        const catKey = tx.categoryId;
        if (!monthCatMap[catKey]) {
          monthCatMap[catKey] = {
            name: tx.categoryNameSnapshot || 'Unknown',
            amount: 0,
          };
        }
        monthCatMap[catKey].amount += tx.amount;
      }
    });

    // Most Expensive Category this month
    let mostExpensiveCategoryThisMonth: { name: string; amount: number; percentage: number } | null = null;
    let maxCatAmount = 0;
    Object.values(monthCatMap).forEach((item) => {
      if (item.amount > maxCatAmount) {
        maxCatAmount = item.amount;
        mostExpensiveCategoryThisMonth = {
          name: item.name,
          amount: item.amount,
          percentage: thisMonthTotal > 0 ? Math.round((item.amount / thisMonthTotal) * 100) : 0,
        };
      }
    });

    // Today's remaining budget:
    // If daily budget is explicitly defined, use that; else derive from monthly budget / days in month
    let todayBudgetCap = currentBudget?.dailyBudget || 0;
    if (!todayBudgetCap && currentBudget?.monthlyTotal) {
      todayBudgetCap = Math.round(currentBudget.monthlyTotal / 30);
    }
    const todayRemainingBudget = Math.max(0, todayBudgetCap - todayTotal);

    return {
      todayTotal,
      thisWeekTotal,
      thisMonthTotal,
      todayRemainingBudget,
      mostExpensiveCategoryThisMonth,
      totalCigaretteSpendingThisMonth,
      totalCigaretteSticksThisMonth,
      todayCigaretteSpending,
      todayCigaretteSticks,
    };
  }, [transactions, settings.weekStartDay, currentBudget]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isQuickAddOpen,
        setIsQuickAddOpen,
        isCigaretteModalOpen,
        setIsCigaretteModalOpen,
        editingTransaction,
        setEditingTransaction,
        deletingTransaction,
        setDeletingTransaction,
        isDbStatusModalOpen,
        setIsDbStatusModalOpen,
        transactions,
        categories,
        cigaretteBrands,
        recurringExpenses,
        settings,
        currentBudget,
        isLoading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        saveCategory,
        deleteCategory,
        saveCigaretteBrand,
        deleteCigaretteBrand,
        saveBudget,
        saveSettings,
        saveRecurringExpense,
        deleteRecurringExpense,
        logRecurringExpense,
        refreshData,
        seedDemoData,
        clearAllTransactions,
        metrics,
        getCategoryById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
