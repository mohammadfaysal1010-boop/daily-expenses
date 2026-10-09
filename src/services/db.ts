import {
  ExpenseTransaction,
  ExpenseCategory,
  CigaretteBrand,
  BudgetConfig,
  RecurringExpense,
  AppSettings,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CIGARETTE_BRANDS,
  DEFAULT_RECURRING_EXPENSES,
  DEFAULT_APP_SETTINGS,
} from '../data/defaults';
import { getTodayDate } from '../utils/formatters';

const DB_NAME = 'DailyKhataDB';
const DB_VERSION = 1;

interface DailyKhataDatabaseSchema {
  transactions: ExpenseTransaction[];
  categories: ExpenseCategory[];
  cigaretteBrands: CigaretteBrand[];
  budgets: BudgetConfig[];
  recurringExpenses: RecurringExpense[];
  settings: AppSettings;
}

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // Transactions Store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('date', 'date', { unique: false });
          txStore.createIndex('categoryId', 'categoryId', { unique: false });
          txStore.createIndex('expenseType', 'expenseType', { unique: false });
          txStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Categories Store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // Cigarette Brands Store
        if (!db.objectStoreNames.contains('cigaretteBrands')) {
          db.createObjectStore('cigaretteBrands', { keyPath: 'id' });
        }

        // Budgets Store (key is monthKey YYYY-MM)
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'monthKey' });
        }

        // Recurring Expenses Store
        if (!db.objectStoreNames.contains('recurringExpenses')) {
          db.createObjectStore('recurringExpenses', { keyPath: 'id' });
        }

        // Settings Store (key 'appSettings')
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        // Populate initial defaults if empty
        await this.bootstrapDefaults(db);
        resolve(db);
      };

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async bootstrapDefaults(db: IDBDatabase): Promise<void> {
    // Check categories
    const categoriesCount = await this.countStore(db, 'categories');
    if (categoriesCount === 0) {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      DEFAULT_CATEGORIES.forEach((cat) => store.put(cat));
      await this.awaitTx(tx);
    }

    // Check cigarette brands
    const brandsCount = await this.countStore(db, 'cigaretteBrands');
    if (brandsCount === 0) {
      const tx = db.transaction('cigaretteBrands', 'readwrite');
      const store = tx.objectStore('cigaretteBrands');
      DEFAULT_CIGARETTE_BRANDS.forEach((brand) => store.put(brand));
      await this.awaitTx(tx);
    }

    // Check recurring expenses
    const recCount = await this.countStore(db, 'recurringExpenses');
    if (recCount === 0) {
      const tx = db.transaction('recurringExpenses', 'readwrite');
      const store = tx.objectStore('recurringExpenses');
      DEFAULT_RECURRING_EXPENSES.forEach((rec) => store.put(rec));
      await this.awaitTx(tx);
    }

    // Check settings
    const settingsCount = await this.countStore(db, 'settings');
    if (settingsCount === 0) {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ id: 'current', ...DEFAULT_APP_SETTINGS });
      await this.awaitTx(tx);
    }
  }

  private countStore(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private awaitTx(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // --- Transactions API ---

  async getAllTransactions(): Promise<ExpenseTransaction[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const req = store.getAll();
      req.onsuccess = () => {
        // Sort descending by date, then createdAt
        const items: ExpenseTransaction[] = req.result || [];
        items.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt - a.createdAt;
        });
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async addTransaction(item: ExpenseTransaction): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('transactions', 'readwrite');
    tx.objectStore('transactions').put(item);
    await this.awaitTx(tx);
  }

  async updateTransaction(item: ExpenseTransaction): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('transactions', 'readwrite');
    tx.objectStore('transactions').put({
      ...item,
      updatedAt: Date.now(),
    });
    await this.awaitTx(tx);
  }

  async deleteTransaction(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('transactions', 'readwrite');
    tx.objectStore('transactions').delete(id);
    await this.awaitTx(tx);
  }

  // --- Categories API ---

  async getAllCategories(): Promise<ExpenseCategory[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveCategory(cat: ExpenseCategory): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('categories', 'readwrite');
    tx.objectStore('categories').put(cat);
    await this.awaitTx(tx);
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('categories', 'readwrite');
    tx.objectStore('categories').delete(id);
    await this.awaitTx(tx);
  }

  // --- Cigarette Brands API ---

  async getAllCigaretteBrands(): Promise<CigaretteBrand[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cigaretteBrands', 'readonly');
      const store = tx.objectStore('cigaretteBrands');
      const req = store.getAll();
      req.onsuccess = () => {
        const brands: CigaretteBrand[] = req.result || [];
        brands.sort((a, b) => a.sortOrder - b.sortOrder);
        resolve(brands);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveCigaretteBrand(brand: CigaretteBrand): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('cigaretteBrands', 'readwrite');
    tx.objectStore('cigaretteBrands').put(brand);
    await this.awaitTx(tx);
  }

  async deleteCigaretteBrand(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('cigaretteBrands', 'readwrite');
    tx.objectStore('cigaretteBrands').delete(id);
    await this.awaitTx(tx);
  }

  // --- Budgets API ---

  async getBudget(monthKey: string): Promise<BudgetConfig | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readonly');
      const store = tx.objectStore('budgets');
      const req = store.get(monthKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveBudget(budget: BudgetConfig): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('budgets', 'readwrite');
    tx.objectStore('budgets').put({
      ...budget,
      updatedAt: Date.now(),
    });
    await this.awaitTx(tx);
  }

  // --- Recurring Expenses API ---

  async getAllRecurringExpenses(): Promise<RecurringExpense[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recurringExpenses', 'readonly');
      const store = tx.objectStore('recurringExpenses');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveRecurringExpense(rec: RecurringExpense): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('recurringExpenses', 'readwrite');
    tx.objectStore('recurringExpenses').put(rec);
    await this.awaitTx(tx);
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('recurringExpenses', 'readwrite');
    tx.objectStore('recurringExpenses').delete(id);
    await this.awaitTx(tx);
  }

  // --- Settings API ---

  async getSettings(): Promise<AppSettings> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('current');
      req.onsuccess = () => {
        if (req.result) {
          const { id, ...settings } = req.result;
          resolve(settings as AppSettings);
        } else {
          resolve(DEFAULT_APP_SETTINGS);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ id: 'current', ...settings });
    await this.awaitTx(tx);
  }

  // --- Export and Import ---

  async exportAllDataJSON(): Promise<string> {
    const [transactions, categories, cigaretteBrands, recurringExpenses, settings] = await Promise.all([
      this.getAllTransactions(),
      this.getAllCategories(),
      this.getAllCigaretteBrands(),
      this.getAllRecurringExpenses(),
      this.getSettings(),
    ]);

    const backupPayload = {
      appName: 'DailyKhata',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        categories,
        cigaretteBrands,
        recurringExpenses,
        settings,
      },
    };

    return JSON.stringify(backupPayload, null, 2);
  }

  async importDataJSON(jsonString: string, mode: 'merge' | 'replace' = 'merge'): Promise<{ count: number }> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Invalid JSON format. Please provide a valid DailyKhata backup file.');
    }

    if (!parsed || (!parsed.data && !Array.isArray(parsed.transactions))) {
      throw new Error('Unrecognized backup file structure. Missing "data" or "transactions" payload.');
    }

    const payload = parsed.data || parsed;
    const txList: ExpenseTransaction[] = payload.transactions || [];

    // Basic schema validation
    for (const tx of txList) {
      if (!tx.id || typeof tx.amount !== 'number' || !tx.date || !tx.categoryId) {
        throw new Error('Corrupted transaction record found in backup: ' + JSON.stringify(tx));
      }
    }

    const db = await this.getDB();

    if (mode === 'replace') {
      const clearTx = db.transaction('transactions', 'readwrite');
      clearTx.objectStore('transactions').clear();
      await this.awaitTx(clearTx);
    }

    // Insert transactions
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    for (const item of txList) {
      store.put(item);
    }
    await this.awaitTx(tx);

    // Optionally restore categories / brands if present
    if (Array.isArray(payload.categories) && payload.categories.length > 0) {
      const catTx = db.transaction('categories', 'readwrite');
      const catStore = catTx.objectStore('categories');
      payload.categories.forEach((cat: ExpenseCategory) => catStore.put(cat));
      await this.awaitTx(catTx);
    }

    if (Array.isArray(payload.cigaretteBrands) && payload.cigaretteBrands.length > 0) {
      const brandTx = db.transaction('cigaretteBrands', 'readwrite');
      const brandStore = brandTx.objectStore('cigaretteBrands');
      payload.cigaretteBrands.forEach((b: CigaretteBrand) => brandStore.put(b));
      await this.awaitTx(brandTx);
    }

    return { count: txList.length };
  }

  exportTransactionsCSV(transactions: ExpenseTransaction[]): string {
    const headers = [
      'ID',
      'Date (Asia/Dhaka)',
      'Time',
      'Category ID',
      'Category Name',
      'Item Name',
      'Amount (BDT)',
      'Expense Type',
      'Cigarette Brand',
      'Quantity',
      'Unit Price (BDT)',
      'Payment Method',
      'Notes',
      'Created At',
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = transactions.map((t) => [
      escapeCSV(t.id),
      escapeCSV(t.date),
      escapeCSV(t.time || ''),
      escapeCSV(t.categoryId),
      escapeCSV(t.categoryNameSnapshot),
      escapeCSV(t.itemName),
      t.amount,
      escapeCSV(t.expenseType),
      escapeCSV(t.cigaretteBrand || ''),
      t.quantity ?? '',
      t.unitPrice ?? '',
      escapeCSV(t.paymentMethod),
      escapeCSV(t.notes || ''),
      new Date(t.createdAt).toISOString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async clearAllTransactions(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('transactions', 'readwrite');
    tx.objectStore('transactions').clear();
    await this.awaitTx(tx);
  }

  // Seed sample transactions for quick review and verification
  async seedDemoTransactions(): Promise<number> {
    const today = getTodayDate();
    const [y, m, d] = today.split('-').map(Number);

    const pad = (n: number) => String(n).padStart(2, '0');
    const dayStr = (offset: number) => {
      const dt = new Date(Date.UTC(y, m - 1, d + offset, 12, 0, 0));
      return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
    };

    const sampleTransactions: ExpenseTransaction[] = [
      // Test 1 scenario: 3 Camel cigarettes @ ৳10 each = ৳30
      {
        id: 'tx-seed-1',
        categoryId: 'cat-cigarettes',
        categoryNameSnapshot: 'Cigarettes',
        itemName: 'Camel (3 sticks)',
        amount: 30,
        quantity: 3,
        unitPrice: 10,
        expenseType: 'cigarette',
        cigaretteBrand: 'Camel',
        paymentMethod: 'cash',
        notes: 'Morning tea break (3 sticks @ ৳10)',
        date: today,
        time: '08:30',
        createdAt: Date.now() - 3600000 * 8,
        updatedAt: Date.now() - 3600000 * 8,
      },
      // Test 2 scenario: 2 Gold Leaf Switch cigarettes @ ৳18 each = ৳36
      {
        id: 'tx-seed-2',
        categoryId: 'cat-cigarettes',
        categoryNameSnapshot: 'Cigarettes',
        itemName: 'Gold Leaf Switch (2 sticks)',
        amount: 36,
        quantity: 2,
        unitPrice: 18,
        expenseType: 'cigarette',
        cigaretteBrand: 'Gold Leaf Switch',
        paymentMethod: 'cash',
        notes: 'After lunch (2 sticks @ ৳18)',
        date: today,
        time: '14:15',
        createdAt: Date.now() - 3600000 * 4,
        updatedAt: Date.now() - 3600000 * 4,
      },
      // Test 3 scenario: Breakfast ৳80 & Transportation ৳60 = combined ৳140
      {
        id: 'tx-seed-3',
        categoryId: 'cat-breakfast',
        categoryNameSnapshot: 'Breakfast',
        itemName: 'Roti, Dal & Omelet',
        amount: 80,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: 'cash',
        notes: 'Local restaurant breakfast',
        date: today,
        time: '09:00',
        createdAt: Date.now() - 3600000 * 7,
        updatedAt: Date.now() - 3600000 * 7,
      },
      {
        id: 'tx-seed-4',
        categoryId: 'cat-rickshaw',
        categoryNameSnapshot: 'Rickshaw',
        itemName: 'Rickshaw fare to office',
        amount: 60,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: 'cash',
        notes: 'Dhanmondi to Karwan Bazar',
        date: today,
        time: '09:30',
        createdAt: Date.now() - 3600000 * 6,
        updatedAt: Date.now() - 3600000 * 6,
      },
      // Lunch & Afternoon Snacks & Tea
      {
        id: 'tx-seed-5',
        categoryId: 'cat-lunch',
        categoryNameSnapshot: 'Lunch',
        itemName: 'Kacchi Biryani & Borhani',
        amount: 250,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: 'bkash',
        notes: 'Office lunch with team',
        date: today,
        time: '13:30',
        createdAt: Date.now() - 3600000 * 5,
        updatedAt: Date.now() - 3600000 * 5,
      },
      {
        id: 'tx-seed-6',
        categoryId: 'cat-tea',
        categoryNameSnapshot: 'Tea and Coffee',
        itemName: 'Malai Cha (Tong er cha)',
        amount: 30,
        quantity: 2,
        expenseType: 'general',
        paymentMethod: 'cash',
        notes: 'Tea stall with friend',
        date: today,
        time: '17:00',
        createdAt: Date.now() - 3600000 * 2,
        updatedAt: Date.now() - 3600000 * 2,
      },
      {
        id: 'tx-seed-7',
        categoryId: 'cat-snacks',
        categoryNameSnapshot: 'Afternoon Snacks',
        itemName: 'Singara & Somucha',
        amount: 40,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: 'cash',
        notes: 'Evening snacks',
        date: today,
        time: '17:30',
        createdAt: Date.now() - 3600000 * 1.5,
        updatedAt: Date.now() - 3600000 * 1.5,
      },
      // Yesterday transactions
      {
        id: 'tx-seed-8',
        categoryId: 'cat-groceries',
        categoryNameSnapshot: 'Groceries',
        itemName: 'Vegetables, Fish & Rice',
        amount: 850,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: 'nagad',
        notes: 'Weekly bazaar from Karwan Bazar',
        date: dayStr(-1),
        time: '18:45',
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'tx-seed-9',
        categoryId: 'cat-cigarettes',
        categoryNameSnapshot: 'Cigarettes',
        itemName: 'Navy Switch (4 sticks)',
        amount: 40,
        quantity: 4,
        unitPrice: 10,
        expenseType: 'cigarette',
        cigaretteBrand: 'Navy Switch',
        paymentMethod: 'cash',
        notes: 'During evening break',
        date: dayStr(-1),
        time: '20:10',
        createdAt: Date.now() - 86400000 + 3600000,
        updatedAt: Date.now() - 86400000 + 3600000,
      },
      // 3 days ago
      {
        id: 'tx-seed-10',
        categoryId: 'cat-mobile-recharge',
        categoryNameSnapshot: 'Mobile Recharge',
        itemName: 'Grameenphone Data Pack',
        amount: 299,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: 'bkash',
        notes: '30-day 15GB combo pack',
        date: dayStr(-3),
        time: '11:20',
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 3,
      },
      // 5 days ago - Cigarette Advance
      {
        id: 'tx-seed-11',
        categoryId: 'cat-cigarettes',
        categoryNameSnapshot: 'Cigarettes',
        itemName: 'Advance (2 sticks)',
        amount: 46,
        quantity: 2,
        unitPrice: 23,
        expenseType: 'cigarette',
        cigaretteBrand: 'Advance',
        paymentMethod: 'cash',
        notes: 'Advance 2 sticks @ ৳23',
        date: dayStr(-5),
        time: '16:00',
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 5,
      },
      // Start of month: House rent
      {
        id: 'tx-seed-12',
        categoryId: 'cat-rent',
        categoryNameSnapshot: 'House Rent',
        itemName: 'Apartment Monthly Rent',
        amount: 15000,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: 'bank',
        notes: 'Paid via Bank transfer for the month',
        date: `${y}-${pad(m)}-01`,
        time: '10:00',
        createdAt: Date.now() - 86400000 * 8,
        updatedAt: Date.now() - 86400000 * 8,
      },
      {
        id: 'tx-seed-13',
        categoryId: 'cat-internet',
        categoryNameSnapshot: 'Internet',
        itemName: 'Broadband Fiber Bill',
        amount: 1000,
        quantity: 1,
        expenseType: 'general',
        paymentMethod: 'bkash',
        notes: '50 Mbps unlimited',
        date: `${y}-${pad(m)}-03`,
        time: '12:00',
        createdAt: Date.now() - 86400000 * 6,
        updatedAt: Date.now() - 86400000 * 6,
      },
    ];

    const db = await this.getDB();
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    sampleTransactions.forEach((s) => store.put(s));
    await this.awaitTx(tx);

    // Also initialize a healthy monthly budget
    const monthKey = `${y}-${pad(m)}`;
    await this.saveBudget({
      id: `budget-${monthKey}`,
      monthKey,
      monthlyTotal: 30000,
      weeklyBudget: 7500,
      dailyBudget: 1000,
      categoryBudgets: {
        'cat-rent': 15000,
        'cat-groceries': 5000,
        'cat-lunch': 3000,
        'cat-cigarettes': 1500,
        'cat-rickshaw': 1200,
        'cat-breakfast': 1200,
      },
      updatedAt: Date.now(),
    });

    return sampleTransactions.length;
  }
}

export const dbService = new IndexedDBStorage();
