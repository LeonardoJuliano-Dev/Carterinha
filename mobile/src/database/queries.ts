import { getDatabase } from './db';
import {
  Budget,
  BudgetSplit,
  FinancialNotificationRecord,
  FixedExpense,
  Goal,
  MonthlySpending,
  PriceRecord,
  TrackedProduct,
  Transaction,
  UserProfile,
  WeeklySpending,
} from '../types';

/**
 * Insere ou atualiza os orçamentos do mês (ex: gerados pela regra 50/30/20).
 */
export async function saveBudgets(budgets: Budget[]): Promise<void> {
  const db = await getDatabase();

  for (const budget of budgets) {
    await db.runAsync(
      `INSERT INTO budgets (id, category, name, allocated_amount, spent_amount, month_year, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         allocated_amount = excluded.allocated_amount,
         spent_amount = excluded.spent_amount,
         name = excluded.name;`,
      [
        budget.id,
        budget.category,
        budget.name,
        budget.allocated_amount,
        budget.spent_amount,
        budget.month_year,
        budget.created_at,
      ]
    );
  }
}

/**
 * Procura os orçamentos de um determinado mês ('YYYY-MM').
 */
export async function getBudgetsByMonth(monthYear: string): Promise<Budget[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Budget>(
    `SELECT * FROM budgets WHERE month_year = ? ORDER BY category ASC`,
    [monthYear]
  );
  return rows;
}

/**
 * Cria uma nova meta de vida.
 */
export async function insertGoal(goal: Goal): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO goals (id, name, target_amount, current_amount, deadline, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      goal.id,
      goal.name,
      goal.target_amount,
      goal.current_amount,
      goal.deadline || null,
      goal.created_at,
    ]
  );
}

/**
 * Atualiza o montante acumulado numa meta de vida.
 */
export async function updateGoalAmount(goalId: string, currentAmount: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE goals SET current_amount = ? WHERE id = ?`,
    [currentAmount, goalId]
  );
}

/**
 * Retorna todas as metas de vida registadas.
 */
export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Goal>(`SELECT * FROM goals ORDER BY created_at DESC`);
}

/**
 * Elimina uma meta de vida pelo seu ID e desvincula as transações associadas.
 */
export async function deleteGoalById(goalId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE transactions SET goal_id = NULL WHERE goal_id = ?`, [goalId]);
  await db.runAsync(`DELETE FROM goals WHERE id = ?`, [goalId]);
}

/**
 * Insere uma despesa fixa previsível.
 */
export async function insertFixedExpense(expense: FixedExpense): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO fixed_expenses (id, name, amount, category, due_day, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      expense.id,
      expense.name,
      expense.amount,
      expense.category,
      expense.due_day || 1,
      expense.is_active ? 1 : 0,
      expense.created_at,
    ]
  );
}

/**
 * Atualiza o estado de ativação de uma despesa fixa.
 */
export async function toggleFixedExpenseStatus(id: string, isActive: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE fixed_expenses SET is_active = ? WHERE id = ?`,
    [isActive ? 1 : 0, id]
  );
}

/**
 * Remove uma despesa fixa.
 */
export async function deleteFixedExpense(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM fixed_expenses WHERE id = ?`, [id]);
}

/**
 * Obtém todas as despesas fixas.
 */
export async function getAllFixedExpenses(): Promise<FixedExpense[]> {
  const db = await getDatabase();
  interface FixedRow {
    id: string;
    name: string;
    amount: number;
    category: string;
    due_day: number;
    is_active: number;
    created_at: string;
  }
  const rows = await db.getAllAsync<FixedRow>(`SELECT * FROM fixed_expenses ORDER BY due_day ASC`);
  return rows.map((r) => ({
    ...r,
    is_active: r.is_active === 1,
  }));
}

/**
 * Insere uma transação na base de dados SQLite local.
 */
export async function insertTransaction(tx: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO transactions (id, description, amount, category, is_essential, store_name, items_summary, ai_feedback, goal_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id,
      tx.description,
      tx.amount,
      tx.category,
      tx.is_essential ? 1 : 0,
      tx.store_name || null,
      tx.items_summary || null,
      tx.ai_feedback || null,
      tx.goal_id || null,
      tx.created_at,
    ]
  );
}

/**
 * Atualiza o parecer de IA de uma transação.
 */
export async function updateTransactionAIFeedback(txId: string, aiFeedback: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE transactions SET ai_feedback = ? WHERE id = ?`,
    [aiFeedback, txId]
  );
}

/**
 * Atualiza os dados de uma transação existente.
 */
export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE transactions 
     SET description = ?, amount = ?, category = ?, is_essential = ?, store_name = ?, items_summary = ?, goal_id = ?
     WHERE id = ?`,
    [
      tx.description,
      tx.amount,
      tx.category,
      tx.is_essential ? 1 : 0,
      tx.store_name || null,
      tx.items_summary || null,
      tx.goal_id || null,
      tx.id,
    ]
  );
}

/**
 * Remove uma transação da base de dados.
 */
export async function deleteTransaction(txId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [txId]);
}

/**
 * Obtém as transações mais recentes.
 */
export async function getRecentTransactions(limit: number = 20): Promise<Transaction[]> {
  const db = await getDatabase();
  interface TxRow {
    id: string;
    description: string;
    amount: number;
    category: string;
    is_essential: number;
    store_name: string | null;
    items_summary: string | null;
    ai_feedback: string | null;
    goal_id: string | null;
    created_at: string;
  }
  const rows = await db.getAllAsync<TxRow>(
    `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map((r) => ({
    ...r,
    is_essential: r.is_essential === 1,
  }));
}

/**
 * Procura o histórico de compras de um determinado item por descrição aproximada ou resumo de itens de fatura.
 */
export async function getPriceHistoryForItem(itemDescription: string): Promise<PriceRecord[]> {
  const db = await getDatabase();
  const trimmed = itemDescription.trim();
  if (!trimmed) return [];

  const pattern = `%${trimmed}%`;
  interface HistoryRow {
    store_name: string | null;
    amount: number;
    items_summary: string | null;
    description: string;
    created_at: string;
  }
  const rows = await db.getAllAsync<HistoryRow>(
    `SELECT store_name, amount, items_summary, description, created_at 
     FROM transactions 
     WHERE description LIKE ? OR items_summary LIKE ?
     ORDER BY created_at DESC LIMIT 30`,
    [pattern, pattern]
  );

  const records: PriceRecord[] = [];

  for (const r of rows) {
    const store = r.store_name?.trim() || 'Estabelecimento';
    const date = r.created_at ? r.created_at.split('T')[0] : '';
    let price = r.amount;

    // Se o item estiver detalhado com preço próprio dentro de items_summary da fatura
    if (r.items_summary && r.items_summary.toLowerCase().includes(trimmed.toLowerCase())) {
      const parts = r.items_summary.split(',');
      for (const part of parts) {
        if (part.toLowerCase().includes(trimmed.toLowerCase())) {
          const [, rawPrice] = part.split(':');
          if (rawPrice) {
            const parsed = parseFloat(rawPrice.replace(/[^\d\.,]/g, '').replace(',', '.'));
            if (!isNaN(parsed) && parsed > 0) {
              price = parsed;
              break;
            }
          }
        }
      }
    }

    records.push({
      store_name: store,
      price,
      date,
    });
  }

  return records;
}

/**
 * Obtém todos os produtos distintos rastreados nas transações e faturas do utilizador.
 */
export async function getAllTrackedProducts(): Promise<TrackedProduct[]> {
  const db = await getDatabase();
  interface TxRow {
    description: string;
    amount: number;
    store_name: string | null;
    items_summary: string | null;
    created_at: string;
  }
  const rows = await db.getAllAsync<TxRow>(
    `SELECT description, amount, store_name, items_summary, created_at
     FROM transactions
     ORDER BY created_at DESC`
  );

  const productMap = new Map<
    string,
    {
      displayName: string;
      prices: number[];
      stores: string[];
      lastStore: string;
      lastDate: string;
    }
  >();

  for (const row of rows) {
    const store = row.store_name?.trim() || 'Estabelecimento';
    const date = row.created_at ? row.created_at.split('T')[0] : '';

    // 1. Extrair itens detalhados de faturas (ex: "Arroz 5kg: 420 MT, Pão: 20 MT")
    if (row.items_summary && row.items_summary.includes(':')) {
      const parts = row.items_summary.split(',');
      for (const part of parts) {
        const [rawName, rawPrice] = part.split(':');
        if (rawName && rawPrice) {
          const cleanName = rawName.trim();
          const cleanPrice = parseFloat(rawPrice.replace(/[^\d\.,]/g, '').replace(',', '.'));
          if (cleanName.length >= 2 && !isNaN(cleanPrice) && cleanPrice > 0) {
            const key = cleanName.toLowerCase();
            const existing = productMap.get(key) || {
              displayName: cleanName,
              prices: [],
              stores: [],
              lastStore: store,
              lastDate: date,
            };
            existing.prices.push(cleanPrice);
            if (!existing.stores.includes(store)) existing.stores.push(store);
            if (!existing.lastDate || date > existing.lastDate) {
              existing.lastDate = date;
              existing.lastStore = store;
            }
            productMap.set(key, existing);
          }
        }
      }
    }

    // 2. Considerar a descrição direta da despesa
    const desc = row.description.trim();
    if (desc.length >= 2 && row.amount > 0 && !desc.toLowerCase().startsWith('compras gerais')) {
      const key = desc.toLowerCase();
      const existing = productMap.get(key) || {
        displayName: desc,
        prices: [],
        stores: [],
        lastStore: store,
        lastDate: date,
      };
      existing.prices.push(row.amount);
      if (!existing.stores.includes(store)) existing.stores.push(store);
      if (!existing.lastDate || date > existing.lastDate) {
        existing.lastDate = date;
        existing.lastStore = store;
      }
      productMap.set(key, existing);
    }
  }

  const result: TrackedProduct[] = [];
  for (const [, data] of productMap.entries()) {
    if (data.prices.length > 0) {
      const minPrice = Math.min(...data.prices);
      const maxPrice = Math.max(...data.prices);
      const sum = data.prices.reduce((a, b) => a + b, 0);
      const avgPrice = Math.round((sum / data.prices.length) * 100) / 100;
      result.push({
        name: data.displayName,
        count: data.prices.length,
        minPrice,
        maxPrice,
        avgPrice,
        lastStore: data.lastStore,
        lastDate: data.lastDate,
      });
    }
  }

  return result.sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate));
}

/**
 * Calcula os gastos semanais agrupados do mês corrente ('YYYY-MM').
 */
export async function getWeeklySpendingData(monthYear: string): Promise<WeeklySpending[]> {
  const db = await getDatabase();
  const pattern = `${monthYear}-%`;

  interface TxAmountRow {
    created_at: string;
    amount: number;
    is_essential: number;
  }

  const rows = await db.getAllAsync<TxAmountRow>(
    `SELECT created_at, amount, is_essential FROM transactions WHERE created_at LIKE ?`,
    [pattern]
  );

  const weeks: WeeklySpending[] = [
    { weekLabel: 'Sem 1 (1-7)', weekNumber: 1, amount: 0, essentialAmount: 0, lifestyleAmount: 0 },
    { weekLabel: 'Sem 2 (8-14)', weekNumber: 2, amount: 0, essentialAmount: 0, lifestyleAmount: 0 },
    { weekLabel: 'Sem 3 (15-21)', weekNumber: 3, amount: 0, essentialAmount: 0, lifestyleAmount: 0 },
    { weekLabel: 'Sem 4 (22+)', weekNumber: 4, amount: 0, essentialAmount: 0, lifestyleAmount: 0 },
  ];

  for (const row of rows) {
    const day = parseInt(row.created_at.split('T')[0].split('-')[2] || '1', 10);
    let weekIndex = 0;
    if (day >= 1 && day <= 7) weekIndex = 0;
    else if (day >= 8 && day <= 14) weekIndex = 1;
    else if (day >= 15 && day <= 21) weekIndex = 2;
    else weekIndex = 3;

    weeks[weekIndex].amount += row.amount;
    if (row.is_essential === 1) {
      weeks[weekIndex].essentialAmount += row.amount;
    } else {
      weeks[weekIndex].lifestyleAmount += row.amount;
    }
  }

  return weeks;
}

/**
 * Calcula os gastos agregados mensais do ano ('YYYY').
 */
export async function getMonthlySpendingData(year: number): Promise<MonthlySpending[]> {
  const db = await getDatabase();
  const pattern = `${year}-%`;

  interface MonthRow {
    created_at: string;
    amount: number;
    is_essential: number;
  }

  const rows = await db.getAllAsync<MonthRow>(
    `SELECT created_at, amount, is_essential FROM transactions WHERE created_at LIKE ?`,
    [pattern]
  );

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const months: MonthlySpending[] = monthNames.map((label, i) => {
    const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
    return {
      monthLabel: label,
      monthKey,
      amount: 0,
      essentialAmount: 0,
      lifestyleAmount: 0,
    };
  });

  for (const row of rows) {
    const monthNum = parseInt(row.created_at.split('-')[1] || '1', 10) - 1;
    if (monthNum >= 0 && monthNum < 12) {
      months[monthNum].amount += row.amount;
      if (row.is_essential === 1) {
        months[monthNum].essentialAmount += row.amount;
      } else {
        months[monthNum].lifestyleAmount += row.amount;
      }
    }
  }

  return months;
}

// ----------------------------------------------------
// Novas Consultas para Perfil, Segurança e Notificações
// ----------------------------------------------------

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  interface ProfileRow {
    id: string;
    name: string;
    email: string;
    pin_code: string | null;
    biometrics_enabled: number;
    is_setup_completed: number;
    initial_balance: number;
    primary_color: string;
    language: string;
    currency: string;
    start_month_year: string | null;
    salary_pay_day: number | null;
    salary_frequency: string | null;
    salary_account_source: string | null;
    salary_confirmed_months_count: number | null;
  }

  const row = await db.getFirstAsync<ProfileRow>(`SELECT * FROM user_profile WHERE id = 'main_user'`);
  if (!row) return null;

  return {
    name: row.name,
    email: row.email,
    pinCode: row.pin_code || undefined,
    biometricsEnabled: row.biometrics_enabled === 1,
    isSetupCompleted: row.is_setup_completed === 1,
    initialBalance: row.initial_balance,
    primaryColor: row.primary_color,
    language: row.language,
    currency: row.currency,
    startMonthYear: row.start_month_year || undefined,
    salaryPayDay: row.salary_pay_day ?? 25,
    salaryFrequency: (row.salary_frequency as any) || 'monthly',
    salaryAccountSource: row.salary_account_source || 'Millennium BIM',
    salaryConfirmedMonthsCount: row.salary_confirmed_months_count ?? 0,
  };
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO user_profile (id, name, email, pin_code, biometrics_enabled, is_setup_completed, initial_balance, primary_color, language, currency, start_month_year, salary_pay_day, salary_frequency, salary_account_source, salary_confirmed_months_count)
     VALUES ('main_user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       email = excluded.email,
       pin_code = excluded.pin_code,
       biometrics_enabled = excluded.biometrics_enabled,
       is_setup_completed = excluded.is_setup_completed,
       initial_balance = excluded.initial_balance,
       primary_color = excluded.primary_color,
       language = excluded.language,
       currency = excluded.currency,
       start_month_year = excluded.start_month_year,
       salary_pay_day = excluded.salary_pay_day,
       salary_frequency = excluded.salary_frequency,
       salary_account_source = excluded.salary_account_source,
       salary_confirmed_months_count = excluded.salary_confirmed_months_count;`,
    [
      profile.name,
      profile.email,
      profile.pinCode || null,
      profile.biometricsEnabled ? 1 : 0,
      profile.isSetupCompleted ? 1 : 0,
      profile.initialBalance,
      profile.primaryColor,
      profile.language,
      profile.currency,
      profile.startMonthYear || null,
      profile.salaryPayDay ?? 25,
      profile.salaryFrequency || 'monthly',
      profile.salaryAccountSource || 'Millennium BIM',
      profile.salaryConfirmedMonthsCount ?? 0,
    ]
  );
}

export async function getBudgetSplit(): Promise<BudgetSplit> {
  const db = await getDatabase();
  interface SplitRow {
    needs_percent: number;
    wants_percent: number;
    savings_percent: number;
  }
  const row = await db.getFirstAsync<SplitRow>(`SELECT * FROM budget_settings WHERE id = 'main_split'`);
  if (!row) {
    return { needsPercent: 50, wantsPercent: 30, savingsPercent: 20 };
  }
  return {
    needsPercent: row.needs_percent,
    wantsPercent: row.wants_percent,
    savingsPercent: row.savings_percent,
  };
}

export async function saveBudgetSplit(split: BudgetSplit): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO budget_settings (id, needs_percent, wants_percent, savings_percent)
     VALUES ('main_split', ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       needs_percent = excluded.needs_percent,
       wants_percent = excluded.wants_percent,
       savings_percent = excluded.savings_percent;`,
    [split.needsPercent, split.wantsPercent, split.savingsPercent]
  );
}

export async function getAllNotifications(): Promise<FinancialNotificationRecord[]> {
  const db = await getDatabase();
  interface NotifRow {
    id: string;
    institution: string;
    title: string;
    message: string;
    amount: number;
    type: string;
    tag: string;
    date_str: string;
    timestamp: string;
    is_read: number;
    action_type: string | null;
    action_payload: string | null;
  }

  const rows = await db.getAllAsync<NotifRow>(`SELECT * FROM notifications_history ORDER BY timestamp DESC`);
  return rows.map((r) => ({
    id: r.id,
    institution: r.institution as any,
    title: r.title,
    message: r.message,
    amount: r.amount,
    type: r.type as any,
    tag: r.tag,
    dateStr: r.date_str,
    timestamp: r.timestamp,
    isRead: r.is_read === 1,
    actionType: (r.action_type as any) || undefined,
    actionPayload: r.action_payload || undefined,
  }));
}

export async function insertNotification(notif: FinancialNotificationRecord): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO notifications_history (id, institution, title, message, amount, type, tag, date_str, timestamp, is_read, action_type, action_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       is_read = excluded.is_read,
       action_type = excluded.action_type,
       action_payload = excluded.action_payload;`,
    [
      notif.id,
      notif.institution,
      notif.title,
      notif.message,
      notif.amount,
      notif.type,
      notif.tag,
      notif.dateStr,
      notif.timestamp,
      notif.isRead ? 1 : 0,
      notif.actionType || null,
      notif.actionPayload || null,
    ]
  );
}

/**
 * Remove todos os registos da base de dados para um reset 100% limpo e zero dados mockados.
 */
export async function clearAllDatabaseData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM budgets;
    DELETE FROM goals;
    DELETE FROM fixed_expenses;
    DELETE FROM notifications_history;
    DELETE FROM user_profile;
    DELETE FROM budget_settings;
  `);
}

/**
 * Restaura todos os dados da aplicação a partir de um backup completo.
 */
export async function restoreAllDatabaseData(backup: {
  user?: UserProfile;
  budgetSplit?: BudgetSplit;
  budgets?: Budget[];
  goals?: Goal[];
  transactions?: Transaction[];
  fixedExpenses?: FixedExpense[];
  notifications?: FinancialNotificationRecord[];
}): Promise<void> {
  const db = await getDatabase();

  // Limpar tabelas existentes
  await clearAllDatabaseData();

  // 1. Restaurar Perfil
  if (backup.user) {
    await db.runAsync(
      `INSERT INTO user_profile (id, name, email, pin_code, biometrics_enabled, is_setup_completed, initial_balance, primary_color, language, currency, start_month_year, salary_pay_day, salary_frequency, salary_account_source, salary_confirmed_months_count)
       VALUES ('main_user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         email = excluded.email,
         pin_code = excluded.pin_code,
         biometrics_enabled = excluded.biometrics_enabled,
         is_setup_completed = excluded.is_setup_completed,
         initial_balance = excluded.initial_balance,
         primary_color = excluded.primary_color,
         language = excluded.language,
         currency = excluded.currency,
         start_month_year = excluded.start_month_year,
         salary_pay_day = excluded.salary_pay_day,
         salary_frequency = excluded.salary_frequency,
         salary_account_source = excluded.salary_account_source,
         salary_confirmed_months_count = excluded.salary_confirmed_months_count;`,
      [
        backup.user.name,
        backup.user.email,
        backup.user.pinCode || null,
        backup.user.biometricsEnabled ? 1 : 0,
        backup.user.isSetupCompleted ? 1 : 0,
        backup.user.initialBalance,
        backup.user.primaryColor || '#0284C7',
        backup.user.language || 'Português',
        backup.user.currency || 'Metical (MT)',
        backup.user.startMonthYear || '',
        backup.user.salaryPayDay || 25,
        backup.user.salaryFrequency || 'monthly',
        backup.user.salaryAccountSource || 'Millennium BIM',
        backup.user.salaryConfirmedMonthsCount || 0,
      ]
    );
  }

  // 2. Restaurar Divisão Orçamental
  if (backup.budgetSplit) {
    await db.runAsync(
      `INSERT INTO budget_settings (id, needs_percent, wants_percent, savings_percent)
       VALUES ('main_split', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         needs_percent = excluded.needs_percent,
         wants_percent = excluded.wants_percent,
         savings_percent = excluded.savings_percent;`,
      [
        backup.budgetSplit.needsPercent,
        backup.budgetSplit.wantsPercent,
        backup.budgetSplit.savingsPercent,
      ]
    );
  }

  // 3. Restaurar Orçamentos
  if (backup.budgets && backup.budgets.length > 0) {
    for (const b of backup.budgets) {
      await db.runAsync(
        `INSERT INTO budgets (id, category, name, allocated_amount, spent_amount, month_year, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           allocated_amount = excluded.allocated_amount,
           spent_amount = excluded.spent_amount,
           name = excluded.name;`,
        [b.id, b.category, b.name, b.allocated_amount, b.spent_amount, b.month_year, b.created_at]
      );
    }
  }

  // 4. Restaurar Metas
  if (backup.goals && backup.goals.length > 0) {
    for (const g of backup.goals) {
      await db.runAsync(
        `INSERT INTO goals (id, name, target_amount, current_amount, deadline, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           target_amount = excluded.target_amount,
           current_amount = excluded.current_amount,
           deadline = excluded.deadline;`,
        [g.id, g.name, g.target_amount, g.current_amount, g.deadline || null, g.created_at]
      );
    }
  }

  // 5. Restaurar Despesas Fixas
  if (backup.fixedExpenses && backup.fixedExpenses.length > 0) {
    for (const fe of backup.fixedExpenses) {
      await db.runAsync(
        `INSERT INTO fixed_expenses (id, name, amount, category, due_day, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           amount = excluded.amount,
           category = excluded.category,
           due_day = excluded.due_day,
           is_active = excluded.is_active;`,
        [fe.id, fe.name, fe.amount, fe.category, fe.due_day ?? null, fe.is_active ? 1 : 0, fe.created_at]
      );
    }
  }

  // 6. Restaurar Transações
  if (backup.transactions && backup.transactions.length > 0) {
    for (const t of backup.transactions) {
      await db.runAsync(
        `INSERT INTO transactions (id, description, amount, category, is_essential, store_name, items_summary, ai_feedback, goal_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           description = excluded.description,
           amount = excluded.amount,
           category = excluded.category,
           is_essential = excluded.is_essential,
           ai_feedback = excluded.ai_feedback;`,
        [
          t.id,
          t.description,
          t.amount,
          t.category,
          t.is_essential ? 1 : 0,
          t.store_name || null,
          t.items_summary || null,
          t.ai_feedback || null,
          t.goal_id || null,
          t.created_at,
        ]
      );
    }
  }

  // 7. Restaurar Notificações
  if (backup.notifications && backup.notifications.length > 0) {
    for (const n of backup.notifications) {
      await db.runAsync(
        `INSERT INTO notifications_history (id, institution, title, message, amount, type, tag, date_str, timestamp, is_read, action_type, action_payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           is_read = excluded.is_read,
           action_type = excluded.action_type,
           action_payload = excluded.action_payload;`,
        [
          n.id,
          n.institution,
          n.title,
          n.message,
          n.amount ?? 0,
          n.type,
          n.tag,
          n.dateStr,
          n.timestamp,
          n.isRead ? 1 : 0,
          n.actionType || null,
          n.actionPayload || null,
        ]
      );
    }
  }
}

/**
 * Converte todos os montantes armazenados na base de dados SQLite (orçamentos, metas,
 * despesas fixas, transações e perfil) aplicando a taxa de câmbio real calculada.
 */
export async function convertAllDatabaseAmounts(
  ratio: number,
  newCurrency: string
): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    UPDATE budgets
    SET allocated_amount = ROUND(allocated_amount * ${ratio}, 2),
        spent_amount = ROUND(spent_amount * ${ratio}, 2);

    UPDATE goals
    SET target_amount = ROUND(target_amount * ${ratio}, 2),
        current_amount = ROUND(current_amount * ${ratio}, 2);

    UPDATE fixed_expenses
    SET amount = ROUND(amount * ${ratio}, 2);

    UPDATE transactions
    SET amount = ROUND(amount * ${ratio}, 2);

    UPDATE notifications_history
    SET amount = ROUND(amount * ${ratio}, 2);

    UPDATE user_profile
    SET currency = '${newCurrency}',
        initial_balance = ROUND(initial_balance * ${ratio}, 2)
    WHERE id = 'main_user';
  `);
}


