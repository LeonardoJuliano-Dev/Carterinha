import { create } from 'zustand';
import {
  Budget,
  BudgetSplit,
  FinancialNotificationRecord,
  FixedExpense,
  Goal,
  IncomeAllocation,
  MonthlySpending,
  PriceComparisonResult,
  PriceRecord,
  ReceiptExtractionResult,
  TrackedProduct,
  Transaction,
  UserProfile,
  WeeklySpending,
} from '../types';
import { initDatabase } from '../database/db';
import {
  clearAllDatabaseData,
  restoreAllDatabaseData,
  deleteFixedExpense as dbDeleteFixedExpense,
  getAllFixedExpenses,
  getAllGoals,
  getAllNotifications,
  getAllTrackedProducts,
  getBudgetsByMonth,
  getBudgetSplit as dbGetBudgetSplit,
  getMonthlySpendingData,
  getPriceHistoryForItem,
  getRecentTransactions,
  getUserProfile as dbGetUserProfile,
  getWeeklySpendingData,
  insertFixedExpense as dbInsertFixedExpense,
  insertGoal,
  deleteGoalById,
  insertNotification as dbInsertNotification,
  insertTransaction,
  saveBudgets,
  saveBudgetSplit as dbSaveBudgetSplit,
  saveUserProfile as dbSaveUserProfile,
  toggleFixedExpenseStatus as dbToggleFixedExpense,
  updateGoalAmount,
  updateTransactionAIFeedback,
  deleteTransaction as dbDeleteTransaction,
  updateTransaction as dbUpdateTransaction,
  convertAllDatabaseAmounts,
} from '../database/queries';
import { getLiveExchangeRates, calculateExchangeRatio, getCurrencyCode } from '../services/exchangeService';
import { calculate50_30_20, calculateBudgetSplit } from '../utils/budgetCalculations';
import { comparePriceWithAI, extractReceiptFromImage, requestTransactionAnalysis } from '../services/api';
import { parseFinancialNotification, ParsedFinancialMessage } from '../services/smsNotificationParser';
import { startConnectivityMonitor, subscribeConnectivity, ConnectivityStatus, getConnectivityStatus } from '../services/networkStatus';
import { NotificationSource, loadNotificationSources, saveNotificationSources } from '../services/notificationSources';
import { useJobQueueStore } from './jobQueueStore';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';

// Security & persistence imports
import * as SecureStore from 'expo-secure-store'; // for PIN hashing storage
import AsyncStorage from '@react-native-async-storage/async-storage'; // for theme persistence
import * as Crypto from 'expo-crypto'; // hashing library (RN-compatible)

// Hash a PIN using SHA-256 (pure, RN-safe — no Node.js crypto needed)
const hashPin = async (pin: string): Promise<string> => {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
};

interface FinanceState {
  isInitialized: boolean;
  theme: 'light' | 'dark';
  currentMonthYear: string;
  userProfile: UserProfile;
  budgetSplit: BudgetSplit;
  isAppLocked: boolean;
  isSetupCompleted: boolean;

  allocation: IncomeAllocation | null;
  budgets: Budget[];
  goals: Goal[];
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  notifications: FinancialNotificationRecord[];
  weeklySpending: WeeklySpending[];
  monthlySpending: MonthlySpending[];
  isAnalyzingAI: boolean;
  isScanningReceipt: boolean;
  smsListenerEnabled: boolean;
  notificationSources: NotificationSource[];
  isOnline: boolean;
  isBackendReachable: boolean;
  pendingSalaryConfirmation: {
    amount: number;
    institution: string;
    date: string;
    referenceId?: string;
  } | null;

  // Ações de Onboarding & Segurança
  completeOnboarding: (data: {
    name: string;
    email: string;
    pinCode?: string;
    biometricsEnabled: boolean;
    salary: number;
    initialBalance: number;
    split: BudgetSplit;
    salaryPayDay?: number;
    salaryFrequency?: 'monthly' | 'biweekly' | 'bimonthly';
    salaryAccountSource?: string;
    language?: string;
    currency?: string;
  }) => Promise<void>;
  unlockApp: (enteredPin: string) => Promise<boolean>;
  unlockWithBiometrics: () => void;
  lockApp: () => void;
  updateProfile: (profile: Partial<UserProfile> & { salary?: number }) => Promise<void>;
  updateBudgetSplit: (split: BudgetSplit) => Promise<void>;
  exportDataAsJson: () => Promise<string>;
  importDatabaseFromJson: (jsonString: string) => Promise<{ success: boolean; message: string }>;
  resetDatabaseToZero: () => Promise<void>;

  // Ações de Tema & Notificações
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setPrimaryColor: (color: string) => Promise<void>;
  setSmsListenerEnabled: (enabled: boolean) => void;
  setNotificationSources: (sources: NotificationSource[]) => Promise<void>;
  processIncomingSms: (messageText: string, senderHeader?: string) => Promise<ParsedFinancialMessage | null>;
  confirmSalaryIncome: (shouldUpdateSalaryBase: boolean) => Promise<void>;
  dismissSalaryConfirmation: () => void;
  checkFixedExpenseReminders: () => Promise<void>;
  checkGoalsReminders: () => Promise<void>;
  updateConnectivity: (status: ConnectivityStatus) => void;

  // Ações de Finanças
  initialize: () => Promise<void>;
  registerSalary: (salary: number, monthYear?: string) => Promise<void>;
  createGoal: (name: string, targetAmount: number, deadline?: string) => Promise<void>;
  depositToGoal: (goalId: string, amount: number, note?: string) => Promise<void>;
  deleteGoal: (goalId: string, reason?: string) => Promise<void>;
  getAvailableBalance: () => number;
  
  // Despesas Fixas
  addFixedExpense: (name: string, amount: number, category: string, dueDay?: number) => Promise<void>;
  toggleFixedExpense: (id: string, isActive: boolean) => Promise<void>;
  removeFixedExpense: (id: string) => Promise<void>;

  // Transações & Preços
  selectMonthYear: (monthYear: string) => Promise<void>;
  addTransaction: (
    description: string,
    amount: number,
    isEssential: boolean,
    category?: string,
    goalId?: string,
    storeName?: string,
    itemsSummary?: string
  ) => Promise<Transaction>;
  editTransaction: (
    id: string,
    updates: {
      description: string;
      amount: number;
      isEssential: boolean;
      category?: string;
      storeName?: string;
      itemsSummary?: string;
    }
  ) => Promise<void>;
  scanReceipt: (payload: { imageBase64?: string; fileName?: string; rawText?: string }) => Promise<ReceiptExtractionResult>;
  deleteTransaction: (id: string) => Promise<void>;
  checkPriceComparison: (itemDescription: string, currentPrice: number, currentStore?: string) => Promise<PriceComparisonResult>;
  getTrackedProducts: () => Promise<TrackedProduct[]>;
  getPriceHistory: (itemDescription: string) => Promise<PriceRecord[]>;
  refreshData: () => Promise<void>;
  changeCurrencyWithExchange: (newCurrency: string) => Promise<{
    success: boolean;
    ratio: number;
    fromCode: string;
    toCode: string;
    message?: string;
  }>;
}

const getCurrentMonthKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  email: '',
  pinCode: undefined,
  biometricsEnabled: false,
  isSetupCompleted: false,
  initialBalance: 0.0,
  primaryColor: '#0284C7',
  language: 'Português (MZ)',
  currency: 'Metical (MT)',
  startMonthYear: getCurrentMonthKey(),
  salaryPayDay: 25,
  salaryFrequency: 'monthly',
  salaryAccountSource: 'Millennium BIM',
  salaryConfirmedMonthsCount: 0,
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isInitialized: false,
  theme: 'light',
  currentMonthYear: getCurrentMonthKey(),
  userProfile: DEFAULT_USER_PROFILE,
  budgetSplit: { needsPercent: 50, wantsPercent: 30, savingsPercent: 20 },
  isAppLocked: false,
  isSetupCompleted: false,
  pendingSalaryConfirmation: null,

  allocation: null,
  budgets: [],
  goals: [],
  transactions: [],
  fixedExpenses: [],
  notifications: [],
  weeklySpending: [],
  monthlySpending: [],
  isAnalyzingAI: false,
  isScanningReceipt: false,
  smsListenerEnabled: true,
  notificationSources: [],
  isOnline: true,
  isBackendReachable: false,

  toggleTheme: async () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      // Persist theme
      AsyncStorage.setItem('appTheme', newTheme).catch(console.error);
      return { theme: newTheme };
    });
  },

  setTheme: async (t: 'light' | 'dark') => {
    set({ theme: t });
    await AsyncStorage.setItem('appTheme', t).catch(console.error);
  },

  setPrimaryColor: async (color: string) => {
    const updated = { ...get().userProfile, primaryColor: color };
    await dbSaveUserProfile(updated);
    await AsyncStorage.setItem('primaryColor', color).catch(console.error);
    set({ userProfile: updated });
  },

  setSmsListenerEnabled: async (enabled: boolean) => {
    set({ smsListenerEnabled: enabled });
    await AsyncStorage.setItem('smsListenerEnabled', enabled ? 'true' : 'false').catch(console.error);
  },

  setNotificationSources: async (sources: NotificationSource[]) => {
    set({ notificationSources: sources });
    await saveNotificationSources(sources);
  },

  updateConnectivity: (status: ConnectivityStatus) => {
    set({
      isOnline: status.isInternetReachable,
      isBackendReachable: status.isBackendReachable,
    });
  },

  unlockApp: async (enteredPin: string) => {
    const storedHash = await SecureStore.getItemAsync('userPinHash');
    if (!storedHash) {
      // No PIN set, allow access
      set({ isAppLocked: false });
      return true;
    }
    const enteredHash = await hashPin(enteredPin);
    if (enteredHash === storedHash) {
      set({ isAppLocked: false });
      return true;
    }
    return false;
  },

  unlockWithBiometrics: () => {
    set({ isAppLocked: false });
  },

  lockApp: () => {
    if (get().userProfile.pinCode) {
      set({ isAppLocked: true });
    }
  },

  updateProfile: async (partial: Partial<UserProfile> & { salary?: number }) => {
    const { salary, ...profileFields } = partial;
    const updated = { ...get().userProfile, ...profileFields };
    await dbSaveUserProfile(updated);
    set({ userProfile: updated });
    if (salary !== undefined && salary > 0) {
      await get().registerSalary(salary);
    }
  },

  changeCurrencyWithExchange: async (newCurrency: string) => {
    try {
      const currentProfile = get().userProfile;
      const oldCurrency = currentProfile.currency || 'Metical (MT)';
      const { rates } = await getLiveExchangeRates();
      const { ratio, fromCode, toCode } = calculateExchangeRatio(oldCurrency, newCurrency, rates);

      if (fromCode === toCode) {
        await get().updateProfile({ currency: newCurrency });
        return { success: true, ratio: 1.0, fromCode, toCode };
      }

      // Converte todos os montantes na base de dados SQLite
      await convertAllDatabaseAmounts(ratio, newCurrency);

      // Converte allocation em memória se existir
      if (get().allocation) {
        const oldAlloc = get().allocation!;
        set({
          allocation: {
            ...oldAlloc,
            total_income: Math.round(oldAlloc.total_income * ratio * 100) / 100,
            needs_50: Math.round(oldAlloc.needs_50 * ratio * 100) / 100,
            wants_30: Math.round(oldAlloc.wants_30 * ratio * 100) / 100,
            savings_20: Math.round(oldAlloc.savings_20 * ratio * 100) / 100,
            breakdown: {
              essential: Math.round(oldAlloc.breakdown.essential * ratio * 100) / 100,
              lifestyle: Math.round(oldAlloc.breakdown.lifestyle * ratio * 100) / 100,
              savings_goals: Math.round(oldAlloc.breakdown.savings_goals * ratio * 100) / 100,
            },
          },
        });
      }

      // Atualiza perfil em memória
      set((state) => ({
        userProfile: {
          ...state.userProfile,
          currency: newCurrency,
          initialBalance: Math.round(state.userProfile.initialBalance * ratio * 100) / 100,
        },
      }));

      // Recarrega todos os orçamentos, metas, despesas e transações
      await get().refreshData();

      return {
        success: true,
        ratio,
        fromCode,
        toCode,
        message: `Câmbio efetuado: 1 ${fromCode} = ${ratio.toFixed(4)} ${toCode}`,
      };
    } catch (err: any) {
      console.error('[FinanceStore] Erro ao efetuar câmbio de moeda:', err);
      return {
        success: false,
        ratio: 1.0,
        fromCode: 'MZN',
        toCode: 'MZN',
        message: err?.message || 'Falha ao efetuar câmbio de moeda.',
      };
    }
  },

  updateBudgetSplit: async (split: BudgetSplit) => {
    await dbSaveBudgetSplit(split);
    set({ budgetSplit: split });
    if (get().allocation) {
      await get().registerSalary(get().allocation!.total_income);
    }
  },

  resetDatabaseToZero: async () => {
    await clearAllDatabaseData();
    // Clear secure PIN hash and persisted preferences
    await SecureStore.deleteItemAsync('userPinHash').catch(() => {});
    await AsyncStorage.multiRemove(['appTheme', 'primaryColor']).catch(() => {});
    set({
      userProfile: DEFAULT_USER_PROFILE,
      budgetSplit: { needsPercent: 50, wantsPercent: 30, savingsPercent: 20 },
      isSetupCompleted: false,
      isAppLocked: false,
      allocation: null,
      budgets: [],
      goals: [],
      transactions: [],
      fixedExpenses: [],
      notifications: [],
      weeklySpending: [],
      monthlySpending: [],
    });
  },

  completeOnboarding: async (data) => {
    // Hash PIN securely before storing
    const pinHash = data.pinCode ? await hashPin(data.pinCode) : undefined;
    if (pinHash) {
      await SecureStore.setItemAsync('userPinHash', pinHash);
    }

    const newProfile: UserProfile = {
      name: data.name.trim(),
      email: data.email.trim(),
      pinCode: data.pinCode, // kept for legacy UI, not used for auth
      biometricsEnabled: data.biometricsEnabled,
      isSetupCompleted: true,
      initialBalance: data.initialBalance,
      primaryColor: '#0284C7',
      language: data.language || 'Português',
      currency: data.currency || 'Metical (MT)',
      startMonthYear: getCurrentMonthKey(),
      salaryPayDay: data.salaryPayDay || 25,
      salaryFrequency: data.salaryFrequency || 'monthly',
      salaryAccountSource: data.salaryAccountSource || 'Millennium BIM',
      salaryConfirmedMonthsCount: 0,
    };

    await dbSaveUserProfile(newProfile);
    await dbSaveBudgetSplit(data.split);

    // Persist theme selection (default light) and primary color
    await AsyncStorage.setItem('appTheme', 'light');
    await AsyncStorage.setItem('primaryColor', newProfile.primaryColor);

    set({
      userProfile: newProfile,
      budgetSplit: data.split,
      isSetupCompleted: true,
      isAppLocked: false,
      theme: 'light',
    });

    if (data.salary > 0) {
      await get().registerSalary(data.salary);
    }
  },

  exportDataAsJson: async () => {
    const data = {
      user: get().userProfile,
      budgetSplit: get().budgetSplit,
      budgets: get().budgets,
      goals: get().goals,
      transactions: get().transactions,
      fixedExpenses: get().fixedExpenses,
      notifications: get().notifications,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabaseFromJson: async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Ficheiro JSON inválido ou corrompido.' };
      }

      await restoreAllDatabaseData({
        user: parsed.user,
        budgetSplit: parsed.budgetSplit,
        budgets: parsed.budgets,
        goals: parsed.goals,
        transactions: parsed.transactions,
        fixedExpenses: parsed.fixedExpenses,
        notifications: parsed.notifications,
      });

      // Se existir PIN no perfil importado, guarda o hash de segurança
      if (parsed.user?.pinCode) {
        const hashed = await hashPin(parsed.user.pinCode);
        await SecureStore.setItemAsync('userPinHash', hashed);
      }

      // Se o backup tiver cor primária ou tema, persistir
      if (parsed.user?.primaryColor) {
        await AsyncStorage.setItem('primaryColor', parsed.user.primaryColor);
      }

      // Recarrega todos os dados locais
      await get().initialize();

      // Bloqueia a app para pedir o PIN da base importada
      set({ isAppLocked: true });

      return { success: true, message: 'Dados restaurados com sucesso!' };
    } catch (err: any) {
      console.error('[FinanceStore] Erro ao importar dados:', err);
      return { success: false, message: err?.message || 'Falha ao processar ficheiro de dados.' };
    }
  },

  processIncomingSms: async (messageText: string, senderHeader?: string) => {
    const parsed = parseFinancialNotification(messageText, senderHeader);
    if (!parsed) return null;

    // Prevenção de registos duplicados (mesma mensagem ou mesmo identificador de transação)
    const existing = get().notifications;
    const isDuplicate = existing.some((n) => {
      if (n.message.trim() === parsed.rawMessage.trim()) return true;
      if (parsed.referenceId && n.message.includes(parsed.referenceId)) return true;
      return false;
    });

    if (isDuplicate) {
      console.log('[FinanceStore] Mensagem financeira duplicada ignorada:', parsed.referenceId || parsed.rawMessage.substring(0, 30));
      return parsed;
    }

    const currencySymbol = getCurrencySymbol(get().userProfile.currency);

    if (parsed.type === 'expense' || parsed.type === 'transfer') {
      const newNotif: FinancialNotificationRecord = {
        id: `notif_${Date.now()}`,
        institution: parsed.institution,
        title: `${parsed.institution}: ${parsed.storeOrRecipient}`,
        message: parsed.rawMessage,
        amount: parsed.amount,
        type: parsed.type,
        tag: parsed.isEssential ? 'Serviços' : 'Lazer',
        dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      await dbInsertNotification(newNotif);

      await get().addTransaction(
        parsed.description,
        parsed.amount,
        parsed.isEssential,
        parsed.category,
        undefined,
        parsed.storeOrRecipient,
        `Origem: SMS ${parsed.institution}`
      );

      set((state) => ({
        notifications: [newNotif, ...state.notifications],
      }));
    } else if (parsed.type === 'income') {
      const day = new Date().getDate();
      const isSalaryWindow = day >= 25 || day <= 5;
      const userSalaryAccount = (get().userProfile.salaryAccountSource || 'Millennium BIM').trim().toLowerCase();
      const instName = parsed.institution.trim().toLowerCase();
      const isSalaryAccount =
        instName.includes(userSalaryAccount) ||
        userSalaryAccount.includes(instName) ||
        (userSalaryAccount.includes('bim') && instName.includes('bim')) ||
        (userSalaryAccount.includes('pesa') && instName.includes('pesa')) ||
        (userSalaryAccount.includes('mola') && instName.includes('mola')) ||
        (userSalaryAccount.includes('access') && instName.includes('access'));

      if (isSalaryWindow && isSalaryAccount) {
        const confirmedCount = get().userProfile.salaryConfirmedMonthsCount || 0;

        if (confirmedCount < 2) {
          // Primeiros 2 meses: Pergunta ao utilizador se era o salário e se deve atualizar o valor
          set({
            pendingSalaryConfirmation: {
              amount: parsed.amount,
              institution: parsed.institution,
              date: parsed.date,
              referenceId: parsed.referenceId,
            },
          });

          const newNotif: FinancialNotificationRecord = {
            id: `notif_sal_${Date.now()}`,
            institution: parsed.institution,
            title: `💰 Salário Detetado (${parsed.institution})`,
            message: `Recebeste ${formatCurrency(parsed.amount, currencySymbol)} na tua conta salário. Confirma se este valor é o teu salário deste mês para atualizar o teu orçamento (${confirmedCount}/2 confirmações).`,
            amount: parsed.amount,
            type: 'income',
            tag: 'Salário',
            dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            isRead: false,
          };

          await dbInsertNotification(newNotif);
          set((state) => ({
            notifications: [newNotif, ...state.notifications],
          }));
        } else {
          // A partir do 3º mês: Atualiza automaticamente sem intervenção manual
          await get().registerSalary(parsed.amount);

          const newNotif: FinancialNotificationRecord = {
            id: `notif_sal_auto_${Date.now()}`,
            institution: parsed.institution,
            title: `⚡ Salário Atualizado Automaticamente`,
            message: `Salário de ${formatCurrency(parsed.amount, currencySymbol)} detetado na conta ${parsed.institution} e atualizado automaticamente no orçamento 50/30/20!`,
            amount: parsed.amount,
            type: 'income',
            tag: 'Salário',
            dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            isRead: false,
          };

          await dbInsertNotification(newNotif);
          set((state) => ({
            notifications: [newNotif, ...state.notifications],
          }));
        }
      } else {
        // Entrada normal fora do intervalo de salário ou de outra instituição
        const newNotif: FinancialNotificationRecord = {
          id: `notif_${Date.now()}`,
          institution: parsed.institution,
          title: `${parsed.institution}: Entrada Recebida`,
          message: parsed.rawMessage,
          amount: parsed.amount,
          type: 'income',
          tag: 'Entrada',
          dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        await dbInsertNotification(newNotif);
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));
      }
    }

    await get().refreshData();
    return parsed;
  },

  confirmSalaryIncome: async (shouldUpdateSalaryBase: boolean) => {
    const pending = get().pendingSalaryConfirmation;
    if (!pending) return;

    if (shouldUpdateSalaryBase) {
      await get().registerSalary(pending.amount);
      const currentCount = get().userProfile.salaryConfirmedMonthsCount || 0;
      const updatedProfile: UserProfile = {
        ...get().userProfile,
        salaryConfirmedMonthsCount: currentCount + 1,
      };
      await dbSaveUserProfile(updatedProfile);
      set({ userProfile: updatedProfile });
    }

    set({ pendingSalaryConfirmation: null });
    await get().refreshData();
  },

  dismissSalaryConfirmation: () => {
    set({ pendingSalaryConfirmation: null });
  },

  checkFixedExpenseReminders: async () => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const activeExpenses = get().fixedExpenses.filter((f) => f.is_active && f.due_day);
    const notifications = get().notifications;
    const currencySymbol = getCurrencySymbol(get().userProfile.currency);

    for (const expense of activeExpenses) {
      const dueDay = expense.due_day!;
      let daysUntilDue = dueDay - currentDay;
      if (daysUntilDue < 0) {
        daysUntilDue = (daysInCurrentMonth - currentDay) + dueDay;
      }

      if (daysUntilDue === 3) {
        const monthTag = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const alreadyNotified = notifications.some(
          (n) =>
            n.tag === 'Lembrete' &&
            n.title.toLowerCase().includes(expense.name.toLowerCase()) &&
            n.timestamp.startsWith(monthTag)
        );

        if (!alreadyNotified) {
          const notif: FinancialNotificationRecord = {
            id: `notif_due_${expense.id}_${Date.now()}`,
            institution: 'Outro',
            title: `⏰ Lembrete: ${expense.name} vence em 3 dias`,
            message: `A tua despesa fixa "${expense.name}" no valor de ${formatCurrency(expense.amount, currencySymbol)} vence no dia ${dueDay}. Lembra-te de efetuar o pagamento!`,
            amount: expense.amount,
            type: 'expense',
            tag: 'Lembrete',
            dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            isRead: false,
            actionType: 'navigate_fixed_expenses',
            actionPayload: expense.id,
          };
          await dbInsertNotification(notif);
          set((state) => ({
            notifications: [notif, ...state.notifications],
          }));
        }
      }
    }
  },

  checkGoalsReminders: async () => {
    const goals = get().goals;
    const notifications = get().notifications;
    const currencySymbol = getCurrencySymbol(get().userProfile.currency);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthTag = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    for (const goal of goals) {
      const remaining = Math.max(0, goal.target_amount - goal.current_amount);
      if (remaining <= 0) continue; // Meta já concluída

      // 1. Meta a chegar ao final (prazo nos próximos 15 dias ou progresso >= 80%)
      let isNearEnd = false;
      let daysRemainingText = '';
      if (goal.deadline) {
        const deadlineDate = new Date(goal.deadline);
        const diffMs = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 15) {
          isNearEnd = true;
          daysRemainingText = ` (faltam ${diffDays} dias)`;
        }
      } else if (goal.current_amount >= goal.target_amount * 0.8) {
        isNearEnd = true;
      }

      if (isNearEnd) {
        const alreadyNotifiedEnd = notifications.some(
          (n) =>
            n.tag === 'Metas' &&
            n.title.toLowerCase().includes(goal.name.toLowerCase()) &&
            n.message.toLowerCase().includes('consultor') &&
            n.timestamp.startsWith(monthTag)
        );

        if (!alreadyNotifiedEnd) {
          const prompt = `A minha meta "${goal.name}" está quase no fim${daysRemainingText}. O meu saldo atual nela é de ${formatCurrency(goal.current_amount, currencySymbol)} de ${formatCurrency(goal.target_amount, currencySymbol)}, restando apenas ${formatCurrency(remaining, currencySymbol)}. Como posso otimizar o meu orçamento ou cortar gastos supérfluos para alcançar essa meta com o consultor?`;

          const notif: FinancialNotificationRecord = {
            id: `notif_goal_end_${goal.id}_${Date.now()}`,
            institution: 'Outro',
            title: `🚀 Quase lá: ${goal.name}`,
            message: `A tua meta "${goal.name}" está a chegar ao final${daysRemainingText}. Consulta como alcançar essa meta com o consultor!`,
            amount: remaining,
            type: 'transfer',
            tag: 'Metas',
            dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            isRead: false,
            actionType: 'navigate_advisor',
            actionPayload: prompt,
          };

          await dbInsertNotification(notif);
          set((state) => ({
            notifications: [notif, ...state.notifications],
          }));
        }
      }

      // 2. Meta parada há muito tempo (criada há mais de 14 dias sem atingir 40% do alvo)
      const createdDate = new Date(goal.created_at);
      const daysSinceCreation = Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceCreation >= 14 && goal.current_amount < goal.target_amount * 0.4) {
        const alreadyNotifiedStalled = notifications.some(
          (n) =>
            n.tag === 'Metas' &&
            n.title.toLowerCase().includes(goal.name.toLowerCase()) &&
            n.message.toLowerCase().includes('parada') &&
            n.timestamp.startsWith(monthTag)
        );

        if (!alreadyNotifiedStalled) {
          const notif: FinancialNotificationRecord = {
            id: `notif_goal_stalled_${goal.id}_${Date.now()}`,
            institution: 'Outro',
            title: `🎯 Meta Parada: ${goal.name}`,
            message: `A tua meta "${goal.name}" está parada há algum tempo. Reserva um valor hoje para manter o teu objetivo vivo!`,
            amount: remaining,
            type: 'transfer',
            tag: 'Metas',
            dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            isRead: false,
            actionType: 'navigate_goals',
            actionPayload: goal.id,
          };

          await dbInsertNotification(notif);
          set((state) => ({
            notifications: [notif, ...state.notifications],
          }));
        }
      }
    }
  },

  initialize: async () => {
    try {
      await initDatabase();
      const monthYear = get().currentMonthYear;
      const currentYear = new Date().getFullYear();

      const [
        savedProfile,
        savedSplit,
        budgets,
        goals,
        transactions,
        fixedExpenses,
        notifications,
        weeklySpending,
        monthlySpending,
      ] = await Promise.all([
        dbGetUserProfile(),
        dbGetBudgetSplit(),
        getBudgetsByMonth(monthYear),
        getAllGoals(),
        getRecentTransactions(),
        getAllFixedExpenses(),
        getAllNotifications(),
        getWeeklySpendingData(monthYear),
        getMonthlySpendingData(currentYear),
      ]);

      // Load persisted theme, primary color, SMS listener preference, and notification sources
      const [persistedTheme, persistedColor, persistedSmsListener, notificationSources] = await Promise.all([
        AsyncStorage.getItem('appTheme'),
        AsyncStorage.getItem('primaryColor'),
        AsyncStorage.getItem('smsListenerEnabled'),
        loadNotificationSources(),
      ]);
      if (persistedTheme) {
        set({ theme: persistedTheme as 'light' | 'dark' });
      }
      if (persistedColor) {
        set((state) => ({
          userProfile: { ...state.userProfile, primaryColor: persistedColor },
        }));
      }
      if (persistedSmsListener !== null) {
        set({ smsListenerEnabled: persistedSmsListener !== 'false' });
      }
      set({ notificationSources });

      const isSetup = savedProfile ? savedProfile.isSetupCompleted : false;
      const isLocked = Boolean(savedProfile && savedProfile.pinCode);

      let profileToUse = savedProfile || DEFAULT_USER_PROFILE;
      if (profileToUse && (!profileToUse.startMonthYear || !profileToUse.salaryPayDay || !profileToUse.salaryAccountSource)) {
        profileToUse = {
          ...profileToUse,
          startMonthYear: profileToUse.startMonthYear || monthYear,
          salaryPayDay: profileToUse.salaryPayDay ?? 25,
          salaryFrequency: profileToUse.salaryFrequency || 'monthly',
          salaryAccountSource: profileToUse.salaryAccountSource || 'Millennium BIM',
          salaryConfirmedMonthsCount: profileToUse.salaryConfirmedMonthsCount ?? 0,
        };
        await dbSaveUserProfile(profileToUse);
      }

      const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated_amount, 0);
      const allocation = totalAllocated > 0 ? calculateBudgetSplit(totalAllocated, savedSplit) : null;

      set({
        isInitialized: true,
        userProfile: profileToUse,
        budgetSplit: savedSplit,
        isSetupCompleted: isSetup,
        isAppLocked: isLocked,
        budgets,
        goals,
        transactions,
        fixedExpenses,
        notifications,
        weeklySpending,
        monthlySpending,
        allocation,
      });

      // Executa verificação diária de lembretes de despesas fixas (3 dias antes)
      await get().checkFixedExpenseReminders();

      // Executa verificação de metas (estagnadas ou próximas do fim)
      await get().checkGoalsReminders();

      // Iniciar monitorização de conectividade (rede + backend)
      startConnectivityMonitor();
      subscribeConnectivity((status) => {
        get().updateConnectivity(status);
      });
    } catch (error) {
      console.error('[FinanceStore] Erro ao inicializar:', error);
      set({ isInitialized: true });
    }
  },

  registerSalary: async (salary: number, customMonthYear?: string) => {
    const monthYear = customMonthYear || get().currentMonthYear;
    const split = get().budgetSplit;

    const needsAmount = (salary * split.needsPercent) / 100;
    const wantsAmount = (salary * split.wantsPercent) / 100;
    const savingsAmount = (salary * split.savingsPercent) / 100;

    const allocation: IncomeAllocation = {
      total_income: salary,
      needs_50: needsAmount,
      wants_30: wantsAmount,
      savings_20: savingsAmount,
      breakdown: {
        essential: needsAmount,
        lifestyle: wantsAmount,
        savings_goals: savingsAmount,
      },
    };

    const currentBudgets = get().budgets;
    const newBudgets: Budget[] = [
      {
        id: `budget_essential_${monthYear}`,
        category: 'essential',
        name: `${split.needsPercent}% Fixas`,
        allocated_amount: needsAmount,
        spent_amount: currentBudgets.find((b) => b.category === 'essential')?.spent_amount || 0,
        month_year: monthYear,
        created_at: new Date().toISOString(),
      },
      {
        id: `budget_lifestyle_${monthYear}`,
        category: 'lifestyle',
        name: `${split.wantsPercent}% Estilo de vida`,
        allocated_amount: wantsAmount,
        spent_amount: currentBudgets.find((b) => b.category === 'lifestyle')?.spent_amount || 0,
        month_year: monthYear,
        created_at: new Date().toISOString(),
      },
      {
        id: `budget_savings_${monthYear}`,
        category: 'savings_goals',
        name: `${split.savingsPercent}% Poupança`,
        allocated_amount: savingsAmount,
        spent_amount: currentBudgets.find((b) => b.category === 'savings_goals')?.spent_amount || 0,
        month_year: monthYear,
        created_at: new Date().toISOString(),
      },
    ];

    await saveBudgets(newBudgets);

    set({
      allocation,
      budgets: newBudgets,
    });
  },

  createGoal: async (name: string, targetAmount: number, deadline?: string) => {
    const newGoal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      target_amount: targetAmount,
      current_amount: 0.0,
      deadline,
      created_at: new Date().toISOString(),
    };

    await insertGoal(newGoal);

    set((state) => ({
      goals: [newGoal, ...state.goals],
    }));
  },

  getAvailableBalance: () => {
    const totalIncome = get().allocation?.total_income || 0;
    const baseFunds = totalIncome > 0 ? totalIncome : (get().userProfile.initialBalance || 0);
    const totalSpent = get().budgets.reduce((acc, b) => acc + b.spent_amount, 0);
    return Math.max(0, baseFunds - totalSpent);
  },

  depositToGoal: async (goalId: string, amount: number, note?: string) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) {
      throw new Error('Meta de poupança não encontrada.');
    }

    if (amount <= 0 || isNaN(amount)) {
      throw new Error('O valor do depósito deve ser um número positivo.');
    }

    // 1. Bloquear se a meta já estiver 100% atingida
    if (goal.current_amount >= goal.target_amount) {
      throw new Error(`A meta "${goal.name}" já se encontra 100% concluída!`);
    }

    // 2. Bloquear se o valor a depositar ultrapassar o que falta para completar a meta
    const remainingToTarget = Math.max(0, goal.target_amount - goal.current_amount);
    if (amount > remainingToTarget) {
      throw new Error(
        `O valor de ${formatCurrency(amount)} excede o que falta para concluir a meta (faltam apenas ${formatCurrency(remainingToTarget)}).`
      );
    }

    // 3. Bloquear se o saldo disponível for insuficiente
    const totalIncome = get().allocation?.total_income || 0;
    const baseFunds = totalIncome > 0 ? totalIncome : (get().userProfile.initialBalance || 0);
    const totalSpent = get().budgets.reduce((acc, b) => acc + b.spent_amount, 0);
    const availableBalance = Math.max(0, baseFunds - totalSpent);

    if (baseFunds > 0 && availableBalance < amount) {
      throw new Error(
        `Saldo insuficiente. Dispõe apenas de ${formatCurrency(availableBalance)} de saldo disponível para efetuar este depósito de ${formatCurrency(amount)}.`
      );
    }

    const updatedAmount = goal.current_amount + amount;
    await updateGoalAmount(goalId, updatedAmount);

    const transactionId = `tx_goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txDescription = note?.trim() || `Depósito: ${goal.name}`;
    const transaction: Transaction = {
      id: transactionId,
      description: txDescription,
      amount,
      category: 'savings_goals',
      is_essential: false,
      store_name: 'Metas & Poupança',
      goal_id: goalId,
      created_at: new Date().toISOString(),
    };

    await insertTransaction(transaction);

    // Atualizar valor acumulado no orçamento de poupança
    const currentBudgets = get().budgets;
    const updatedBudgets = currentBudgets.map((b) => {
      if (b.category === 'savings_goals') {
        return { ...b, spent_amount: b.spent_amount + amount };
      }
      return b;
    });
    await saveBudgets(updatedBudgets);

    set((state) => ({
      goals: state.goals.map((g) => (g.id === goalId ? { ...g, current_amount: updatedAmount } : g)),
      transactions: [transaction, ...state.transactions],
      budgets: updatedBudgets,
    }));

    await get().refreshData();
  },

  deleteGoal: async (goalId: string, reason?: string) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;

    await deleteGoalById(goalId);

    if (goal.current_amount > 0) {
      console.log(
        `[Metas] Meta "${goal.name}" eliminada com ${goal.current_amount} MT acumulados. Motivo: ${
          reason || 'Não especificado'
        }`
      );
    }

    set((state) => ({
      goals: state.goals.filter((g) => g.id !== goalId),
    }));

    await get().refreshData();
  },

  addFixedExpense: async (name: string, amount: number, category: string, dueDay: number = 1) => {
    const newExpense: FixedExpense = {
      id: `fixed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      amount,
      category,
      due_day: dueDay,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    await dbInsertFixedExpense(newExpense);

    set((state) => ({
      fixedExpenses: [newExpense, ...state.fixedExpenses],
    }));
  },

  toggleFixedExpense: async (id: string, isActive: boolean) => {
    await dbToggleFixedExpense(id, isActive);

    set((state) => ({
      fixedExpenses: state.fixedExpenses.map((fe) => (fe.id === id ? { ...fe, is_active: isActive } : fe)),
    }));
  },

  removeFixedExpense: async (id: string) => {
    await dbDeleteFixedExpense(id);

    set((state) => ({
      fixedExpenses: state.fixedExpenses.filter((fe) => fe.id !== id),
    }));
  },

  selectMonthYear: async (monthYear: string) => {
    const budgets = await getBudgetsByMonth(monthYear);
    const weeklySpending = await getWeeklySpendingData(monthYear);
    const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated_amount, 0);
    const allocation = totalAllocated > 0 ? calculateBudgetSplit(totalAllocated, get().budgetSplit) : null;

    set({
      currentMonthYear: monthYear,
      budgets,
      weeklySpending,
      allocation,
    });
  },

  addTransaction: async (
    description: string,
    amount: number,
    isEssential: boolean,
    category?: string,
    goalId?: string,
    storeName?: string,
    itemsSummary?: string
  ) => {
    const monthYear = get().currentMonthYear;
    const currentYear = new Date().getFullYear();
    const assignedCategory = category || (isEssential ? 'essential' : 'lifestyle');
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const transaction: Transaction = {
      id: transactionId,
      description,
      amount,
      category: assignedCategory,
      is_essential: isEssential,
      store_name: storeName,
      items_summary: itemsSummary,
      goal_id: goalId,
      created_at: new Date().toISOString(),
    };

    await insertTransaction(transaction);

    const currentBudgets = get().budgets;
    const updatedBudgets = currentBudgets.map((b) => {
      if (b.category === assignedCategory) {
        return { ...b, spent_amount: b.spent_amount + amount };
      }
      return b;
    });

    await saveBudgets(updatedBudgets);

    const [updatedWeekly, updatedMonthly] = await Promise.all([
      getWeeklySpendingData(monthYear),
      getMonthlySpendingData(currentYear),
    ]);

    set((state) => ({
      transactions: [transaction, ...state.transactions],
      budgets: updatedBudgets,
      weeklySpending: updatedWeekly,
      monthlySpending: updatedMonthly,
    }));

    // Parecer de IA para não essencial com a regra personalizada (ex: 40/30/30)
    if (!isEssential) {
      const isOnline = getConnectivityStatus().isInternetReachable;

      if (isOnline) {
        set({ isAnalyzingAI: true });
        (async () => {
          try {
            const lifestyleBudget = get().budgets.find((b) => b.category === 'lifestyle');
            const remainingLifestyle = lifestyleBudget
              ? lifestyleBudget.allocated_amount - lifestyleBudget.spent_amount
              : undefined;

            const aiResponse = await requestTransactionAnalysis({
              transaction,
              lifestyle_budget_remaining: remainingLifestyle,
              active_goals: get().goals,
              budgetSplit: get().budgetSplit,
            });

            await updateTransactionAIFeedback(transactionId, aiResponse.advice);

            set((state) => ({
              transactions: state.transactions.map((tx) =>
                tx.id === transactionId ? { ...tx, ai_feedback: aiResponse.advice } : tx
              ),
              isAnalyzingAI: false,
            }));
          } catch (err) {
            console.error('[FinanceStore] Erro no parecer de IA:', err);
            set({ isAnalyzingAI: false });
          }
        })();
      } else {
        // Sem internet: adiciona o trabalho à fila para ser processado mais tarde
        console.log(`[FinanceStore] Sem internet, a adicionar análise da transação ${transaction.id} à fila...`);
        useJobQueueStore.getState().addJob('ANALYZE_TRANSACTION', { transaction });
      }
    }

    return transaction;
  },

  scanReceipt: async (payload) => {
    set({ isScanningReceipt: true });
    try {
      const result = await extractReceiptFromImage(payload);
      set({ isScanningReceipt: false });
      return result;
    } catch (err) {
      set({ isScanningReceipt: false });
      throw err;
    }
  },

  editTransaction: async (id, updates) => {
    const existing = get().transactions.find((tx) => tx.id === id);
    if (!existing) return;

    const assignedCategory = updates.category || (updates.isEssential ? 'essential' : 'lifestyle');
    const updatedTx: Transaction = {
      ...existing,
      description: updates.description,
      amount: updates.amount,
      is_essential: updates.isEssential,
      category: assignedCategory,
      store_name: updates.storeName,
      items_summary: updates.itemsSummary,
    };

    await dbUpdateTransaction(updatedTx);

    // Ajustar orçamentos
    const currentBudgets = get().budgets;
    const diff = updates.amount - existing.amount;
    const updatedBudgets = currentBudgets.map((b) => {
      if (existing.category === assignedCategory) {
        if (b.category === assignedCategory) {
          return { ...b, spent_amount: Math.max(0, b.spent_amount + diff) };
        }
      } else {
        if (b.category === existing.category) {
          return { ...b, spent_amount: Math.max(0, b.spent_amount - existing.amount) };
        }
        if (b.category === assignedCategory) {
          return { ...b, spent_amount: b.spent_amount + updates.amount };
        }
      }
      return b;
    });

    await saveBudgets(updatedBudgets);
    await get().refreshData();
  },

  deleteTransaction: async (id: string) => {
    await dbDeleteTransaction(id);
    set((state) => ({
      transactions: state.transactions.filter((tx) => tx.id !== id),
    }));
    await get().refreshData();
  },

  checkPriceComparison: async (itemDescription: string, currentPrice: number, currentStore?: string) => {
    const historicalRecords = await getPriceHistoryForItem(itemDescription);
    return await comparePriceWithAI({
      itemDescription,
      currentPrice,
      currentStore,
      historicalRecords,
    });
  },

  getTrackedProducts: async () => {
    return await getAllTrackedProducts();
  },

  getPriceHistory: async (itemDescription: string) => {
    return await getPriceHistoryForItem(itemDescription);
  },

  refreshData: async () => {
    const monthYear = get().currentMonthYear;
    const currentYear = new Date().getFullYear();
    const [budgets, goals, transactions, fixedExpenses, notifications, weeklySpending, monthlySpending] =
      await Promise.all([
        getBudgetsByMonth(monthYear),
        getAllGoals(),
        getRecentTransactions(),
        getAllFixedExpenses(),
        getAllNotifications(),
        getWeeklySpendingData(monthYear),
        getMonthlySpendingData(currentYear),
      ]);

    set({
      budgets,
      goals,
      transactions,
      fixedExpenses,
      notifications,
      weeklySpending,
      monthlySpending,
    });
  },
}));
