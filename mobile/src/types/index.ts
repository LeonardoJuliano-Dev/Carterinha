export type BudgetCategory = 'essential' | 'lifestyle' | 'savings_goals';

export interface Budget {
  id: string;
  category: BudgetCategory;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  month_year: string; // 'YYYY-MM'
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string; // 'YYYY-MM-DD'
  created_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  is_essential: boolean;
  store_name?: string | null;
  items_summary?: string | null;
  ai_feedback?: string | null;
  goal_id?: string | null;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  due_day?: number;
  is_active: boolean;
  created_at: string;
}

export interface BudgetSplit {
  needsPercent: number;    // Ex: 50%
  wantsPercent: number;    // Ex: 30%
  savingsPercent: number;  // Ex: 20%
}

export interface IncomeAllocation {
  total_income: number;
  needs_50: number;       // Fixas / Essenciais
  wants_30: number;       // Lazer / Estilo de Vida
  savings_20: number;     // Metas & Poupança
  breakdown: {
    essential: number;
    lifestyle: number;
    savings_goals: number;
  };
}

export interface UserProfile {
  name: string;
  email: string;
  pinCode?: string;
  biometricsEnabled: boolean;
  isSetupCompleted: boolean;
  initialBalance: number;
  primaryColor: string;
  language: string;
  currency: string;
  startMonthYear?: string;
  salaryPayDay?: number;
  salaryFrequency?: 'monthly' | 'biweekly' | 'bimonthly';
  salaryAccountSource?: string;
  salaryConfirmedMonthsCount?: number;
}

export interface FinancialNotificationRecord {
  id: string;
  institution: 'M-Pesa' | 'e-Mola' | 'Millennium BIM' | 'Access Bank' | 'Outro';
  title: string;
  message: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  tag: string;
  dateStr: string;
  timestamp: string;
  isRead: boolean;
  actionType?: 'navigate_advisor' | 'navigate_goals' | 'navigate_fixed_expenses' | 'none';
  actionPayload?: string;
}

export interface AIAnalysisResponse {
  transaction_id?: string;
  advice: string;
  impact_level: 'baixo' | 'moderado' | 'alto';
  opportunity_cost?: string;
  suggested_action?: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ReceiptExtractionResult {
  store_name: string;
  total_amount: number;
  category: string;
  date?: string;
  items: ReceiptItem[];
  confidence?: number;
  is_essential: boolean;
}

export interface PriceRecord {
  store_name: string;
  price: number;
  date: string;
}

export interface PriceComparisonResult {
  is_cheaper: boolean;
  is_more_expensive: boolean;
  difference_amount: number;
  previous_best_store?: string;
  previous_best_price?: number;
  message: string;
  saving_tip?: string;
}

export interface TrackedProduct {
  name: string;
  count: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  lastStore: string;
  lastDate: string;
}

export interface WeeklySpending {
  weekLabel: string;
  weekNumber: number;
  amount: number;
  essentialAmount: number;
  lifestyleAmount: number;
}

export interface MonthlySpending {
  monthLabel: string;
  monthKey: string;
  amount: number;
  essentialAmount: number;
  lifestyleAmount: number;
}

export interface UserBehaviorProfile {
  archetype: string;
  archetype_badge: string;
  impulse_risk_score: number;
  daily_burn_rate: number;
  days_until_depleted: number;
  weekend_concentration_pct: number;
  top_leaking_category: string;
  ml_insights: string[];
  personalized_action_plan: string;
}

export interface AdvisorChatPayload {
  message: string;
  userName?: string;
  activeGoals?: Goal[];
  budgetSplit?: {
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
  };
  monthlyIncome?: number;
  currentBalance?: number;
  recentSpendingByCategory?: Record<string, number>;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  justCreatedGoal?: {
    name: string;
    target_amount: number;
    deadline?: string;
  };
}

export interface AdvisorChatResult {
  reply: string;
  suggest_goal_creation: boolean;
  suggested_goal_name?: string | null;
  suggested_goal_target?: number | null;
  identified_goal_id?: string | null;
  action_plan?: string[];
  expenses_to_cut?: string[];
}
