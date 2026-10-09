import { CigaretteBrand, ExpenseCategory, RecurringExpense, AppSettings } from '../types';

export const DEFAULT_CIGARETTE_BRANDS: CigaretteBrand[] = [
  { id: 'brand-camel', name: 'Camel', defaultPricePerStick: 10, sortOrder: 1 },
  { id: 'brand-navy-switch', name: 'Navy Switch', defaultPricePerStick: 10, sortOrder: 2 },
  { id: 'brand-gold-leaf-switch', name: 'Gold Leaf Switch', defaultPricePerStick: 18, sortOrder: 3 },
  { id: 'brand-advance', name: 'Advance', defaultPricePerStick: 23, sortOrder: 4 },
  { id: 'brand-benson', name: 'Benson & Hedges', defaultPricePerStick: 18, sortOrder: 5 },
  { id: 'brand-marlboro', name: 'Marlboro', defaultPricePerStick: 18, sortOrder: 6 },
  { id: 'brand-derby', name: 'Derby Style', defaultPricePerStick: 7, sortOrder: 7 },
  { id: 'brand-sheikh', name: 'Sheikh', defaultPricePerStick: 6, sortOrder: 8 },
];

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  // Housing
  { id: 'cat-rent', name: 'House Rent', nameBn: 'বাড়ি ভাড়া', group: 'Housing', icon: 'Home', color: '#3b82f6' },
  { id: 'cat-elec', name: 'Electricity', nameBn: 'বিদ্যুৎ বিল', group: 'Housing', icon: 'Zap', color: '#eab308' },
  { id: 'cat-water', name: 'Water', nameBn: 'পানি বিল', group: 'Housing', icon: 'Droplets', color: '#06b6d4' },
  { id: 'cat-gas', name: 'Gas', nameBn: 'গ্যাস বিল', group: 'Housing', icon: 'Flame', color: '#f97316' },
  { id: 'cat-internet', name: 'Internet', nameBn: 'ইন্টারনেট বিল', group: 'Housing', icon: 'Wifi', color: '#8b5cf6' },

  // Food and Drinks
  { id: 'cat-breakfast', name: 'Breakfast', nameBn: 'সকালের নাস্তা', group: 'Food & Drinks', icon: 'Coffee', color: '#f59e0b' },
  { id: 'cat-lunch', name: 'Lunch', nameBn: 'দুপুরের খাবার', group: 'Food & Drinks', icon: 'Utensils', color: '#10b981' },
  { id: 'cat-dinner', name: 'Dinner', nameBn: 'রাতের খাবার', group: 'Food & Drinks', icon: 'Moon', color: '#6366f1' },
  { id: 'cat-snacks', name: 'Afternoon Snacks', nameBn: 'বিকেলের নাস্তা', group: 'Food & Drinks', icon: 'Cookie', color: '#d97706' },
  { id: 'cat-tea', name: 'Tea and Coffee', nameBn: 'চা ও কফি', group: 'Food & Drinks', icon: 'CupSoda', color: '#b45309' },
  { id: 'cat-restaurant', name: 'Restaurant', nameBn: 'রেস্টুরেন্ট', group: 'Food & Drinks', icon: 'Store', color: '#ec4899' },
  { id: 'cat-fastfood', name: 'Fast Food', nameBn: 'ফাস্ট ফুড', group: 'Food & Drinks', icon: 'Sandwich', color: '#f43f5e' },
  { id: 'cat-groceries', name: 'Groceries', nameBn: 'কাঁচাবাজার/মুদি', group: 'Food & Drinks', icon: 'ShoppingBag', color: '#059669' },
  { id: 'cat-drinks', name: 'Drinks', nameBn: 'পানীয়', group: 'Food & Drinks', icon: 'Wine', color: '#0284c7' },

  // Transportation
  { id: 'cat-bus', name: 'Bus', nameBn: 'বাস ভাড়া', group: 'Transportation', icon: 'Bus', color: '#2563eb' },
  { id: 'cat-rickshaw', name: 'Rickshaw', nameBn: 'রিকশা ভাড়া', group: 'Transportation', icon: 'Bike', color: '#16a34a' },
  { id: 'cat-cng', name: 'CNG Auto', nameBn: 'সিএনজি অটো', group: 'Transportation', icon: 'Car', color: '#65a30d' },
  { id: 'cat-rideshare', name: 'Ride Sharing', nameBn: 'উবার/পাঠাও', group: 'Transportation', icon: 'Navigation', color: '#7c3aed' },
  { id: 'cat-fuel', name: 'Fuel', nameBn: 'জ্বালানি/পেট্রোল', group: 'Transportation', icon: 'Fuel', color: '#dc2626' },
  { id: 'cat-othertrans', name: 'Other Transport', nameBn: 'অন্যান্য যাতায়াত', group: 'Transportation', icon: 'Compass', color: '#4b5563' },

  // Personal
  { id: 'cat-cigarettes', name: 'Cigarettes', nameBn: 'সিগারেট', group: 'Personal', icon: 'Cigarette', color: '#ef4444' },
  { id: 'cat-toiletries', name: 'Toiletries', nameBn: 'টয়লেট্রিজ', group: 'Personal', icon: 'Sparkles', color: '#0891b2' },
  { id: 'cat-clothing', name: 'Clothing', nameBn: 'পোশাক', group: 'Personal', icon: 'Shirt', color: '#db2777' },
  { id: 'cat-haircut', name: 'Haircut & Salon', nameBn: 'সেলুন/হেয়ারকাট', group: 'Personal', icon: 'Scissors', color: '#475569' },
  { id: 'cat-personalcare', name: 'Personal Care', nameBn: 'ব্যক্তিগত যত্ন', group: 'Personal', icon: 'Heart', color: '#e11d48' },

  // Communication
  { id: 'cat-mobile-recharge', name: 'Mobile Recharge', nameBn: 'মোবাইল রিচার্জ', group: 'Communication', icon: 'Smartphone', color: '#0284c7' },
  { id: 'cat-mobile-net', name: 'Mobile Internet', nameBn: 'মোবাইল ডাটা', group: 'Communication', icon: 'Globe', color: '#2563eb' },
  { id: 'cat-comm-other', name: 'Other Communication', nameBn: 'যোগাযোগ খরচ', group: 'Communication', icon: 'PhoneCall', color: '#64748b' },

  // Lifestyle
  { id: 'cat-entertainment', name: 'Entertainment', nameBn: 'বিনোদন', group: 'Lifestyle', icon: 'Film', color: '#9333ea' },
  { id: 'cat-shopping', name: 'Shopping', nameBn: 'কেনাকাটা', group: 'Lifestyle', icon: 'ShoppingBag', color: '#ea580c' },
  { id: 'cat-social', name: 'Social Activities', nameBn: 'সামাজিক আড্ডা/অনুষ্ঠান', group: 'Lifestyle', icon: 'Users', color: '#ca8a04' },
  { id: 'cat-subscriptions', name: 'Subscriptions', nameBn: 'সাবস্ক্রিপশন', group: 'Lifestyle', icon: 'Tv', color: '#4f46e5' },

  // Health and Education
  { id: 'cat-medicine', name: 'Medicine', nameBn: 'ওষুধ', group: 'Health & Education', icon: 'Pill', color: '#dc2626' },
  { id: 'cat-doctor', name: 'Doctor Visit', nameBn: 'ডাক্তার ফি', group: 'Health & Education', icon: 'Stethoscope', color: '#0d9488' },
  { id: 'cat-education', name: 'Education', nameBn: 'শিক্ষা খরচ', group: 'Health & Education', icon: 'GraduationCap', color: '#1d4ed8' },
  { id: 'cat-books', name: 'Books', nameBn: 'বই-পুস্তক', group: 'Health & Education', icon: 'BookOpen', color: '#b45309' },
  { id: 'cat-courses', name: 'Courses', nameBn: 'অনলাইন কোর্স', group: 'Health & Education', icon: 'Award', color: '#7e22ce' },

  // Other
  { id: 'cat-misc', name: 'Miscellaneous', nameBn: 'বিবিধ খরচ', group: 'Other', icon: 'HelpCircle', color: '#6b7280' },
  { id: 'cat-custom', name: 'Custom Category', nameBn: 'কাস্টম ক্যাটাগরি', group: 'Other', icon: 'PlusCircle', color: '#475569' },
];

export const DEFAULT_RECURRING_EXPENSES: RecurringExpense[] = [
  {
    id: 'rec-rent',
    title: 'Monthly House Rent',
    categoryId: 'cat-rent',
    amount: 15000,
    frequency: 'monthly',
    dayOfMonth: 1,
    paymentMethod: 'bank',
    notes: 'To Landlord'
  },
  {
    id: 'rec-internet',
    title: 'Broadband Internet',
    categoryId: 'cat-internet',
    amount: 1000,
    frequency: 'monthly',
    dayOfMonth: 5,
    paymentMethod: 'bkash',
    notes: 'Fiber net monthly bill'
  }
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  currencySymbol: '৳',
  weekStartDay: 'monday',
  languageMode: 'bilingual',
  theme: 'light',
  showBengaliNumbers: false,
};

export interface QuickAddPreset {
  id: string;
  name: string;
  nameBn: string;
  categoryId: string;
  defaultAmount: number;
  icon: string;
  color: string;
  isCigarette?: boolean;
}

export const QUICK_ADD_PRESETS: QuickAddPreset[] = [
  { id: 'preset-breakfast', name: 'Breakfast', nameBn: 'সকালের নাস্তা', categoryId: 'cat-breakfast', defaultAmount: 80, icon: 'Coffee', color: '#f59e0b' },
  { id: 'preset-lunch', name: 'Lunch', nameBn: 'দুপুরের খাবার', categoryId: 'cat-lunch', defaultAmount: 150, icon: 'Utensils', color: '#10b981' },
  { id: 'preset-dinner', name: 'Dinner', nameBn: 'রাতের খাবার', categoryId: 'cat-dinner', defaultAmount: 120, icon: 'Moon', color: '#6366f1' },
  { id: 'preset-snacks', name: 'Afternoon Snacks', nameBn: 'বিকেলের নাস্তা', categoryId: 'cat-snacks', defaultAmount: 40, icon: 'Cookie', color: '#d97706' },
  { id: 'preset-tea', name: 'Tea & Coffee', nameBn: 'চা', categoryId: 'cat-tea', defaultAmount: 10, icon: 'CupSoda', color: '#b45309' },
  { id: 'preset-rickshaw', name: 'Rickshaw', nameBn: 'রিকশা', categoryId: 'cat-rickshaw', defaultAmount: 40, icon: 'Bike', color: '#16a34a' },
  { id: 'preset-bus', name: 'Bus Fare', nameBn: 'বাস', categoryId: 'cat-bus', defaultAmount: 30, icon: 'Bus', color: '#2563eb' },
  { id: 'preset-cng', name: 'CNG', nameBn: 'সিএনজি', categoryId: 'cat-cng', defaultAmount: 120, icon: 'Car', color: '#65a30d' },
  { id: 'preset-cig', name: 'Cigarettes', nameBn: 'সিগারেট', categoryId: 'cat-cigarettes', defaultAmount: 10, icon: 'Cigarette', color: '#ef4444', isCigarette: true },
  { id: 'preset-restaurant', name: 'Restaurant', nameBn: 'রেস্টুরেন্ট', categoryId: 'cat-restaurant', defaultAmount: 350, icon: 'Store', color: '#ec4899' },
  { id: 'preset-groceries', name: 'Groceries', nameBn: 'কাঁচাবাজার', categoryId: 'cat-groceries', defaultAmount: 300, icon: 'ShoppingBag', color: '#059669' },
  { id: 'preset-recharge', name: 'Recharge', nameBn: 'মোবাইল রিচার্জ', categoryId: 'cat-mobile-recharge', defaultAmount: 50, icon: 'Smartphone', color: '#0284c7' },
];
