export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'bank' | 'other';

export type CategoryGroup =
  | 'Housing'
  | 'Food & Drinks'
  | 'Transportation'
  | 'Personal'
  | 'Communication'
  | 'Lifestyle'
  | 'Health & Education'
  | 'Other';

export interface ExpenseCategory {
  id: string;
  name: string;
  nameBn: string;
  group: CategoryGroup;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface CigaretteBrand {
  id: string;
  name: string;
  defaultPricePerStick: number;
  isCustom?: boolean;
  sortOrder: number;
}

export interface ExpenseTransaction {
  id: string;
  userId?: string;
  categoryId: string;
  categoryNameSnapshot: string;
  itemName: string;
  amount: number; // in BDT (৳)
  quantity?: number; // count of items/cigarettes
  unitPrice?: number; // historical unit price (e.g. ৳10, ৳18)
  expenseType: 'general' | 'cigarette';
  cigaretteBrand?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  date: string; // YYYY-MM-DD in Asia/Dhaka
  time?: string; // HH:mm
  createdAt: number;
  updatedAt: number;
}

export interface BudgetConfig {
  id: string;
  monthKey: string; // YYYY-MM
  monthlyTotal: number;
  weeklyBudget?: number;
  dailyBudget?: number;
  categoryBudgets: Record<string, number>; // categoryId -> amount
  updatedAt: number;
}

export interface RecurringExpense {
  id: string;
  title: string;
  categoryId: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'daily';
  dayOfMonth?: number; // 1-31
  paymentMethod: PaymentMethod;
  notes?: string;
  lastLoggedDate?: string;
}

export interface AppSettings {
  currencySymbol: string;
  weekStartDay: 'monday' | 'sunday' | 'saturday';
  languageMode: 'bilingual' | 'en' | 'bn';
  theme: 'light' | 'dark' | 'system';
  showBengaliNumbers: boolean;
}

export type ActiveTab =
  | 'dashboard'
  | 'add-expense'
  | 'daily-reports'
  | 'weekly-reports'
  | 'monthly-reports'
  | 'cigarette-tracker'
  | 'calendar'
  | 'budgets'
  | 'transactions'
  | 'settings';
