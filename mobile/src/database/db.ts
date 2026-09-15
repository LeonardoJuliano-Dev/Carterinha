import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'finances.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Obtém ou inicializa a conexão com a base de dados SQLite local no dispositivo.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

/**
 * Inicializa o esquema de tabelas do finances.db de acordo com os requisitos Local-First.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      -- Tabela de Perfil do Utilizador e Segurança One UI
      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        pin_code TEXT,
        biometrics_enabled INTEGER DEFAULT 0,
        is_setup_completed INTEGER DEFAULT 0,
        initial_balance REAL DEFAULT 0.0,
        primary_color TEXT DEFAULT '#0284C7',
        language TEXT DEFAULT 'Português (MZ)',
        currency TEXT DEFAULT 'MT',
        start_month_year TEXT,
        salary_pay_day INTEGER DEFAULT 25,
        salary_frequency TEXT DEFAULT 'monthly',
        salary_account_source TEXT DEFAULT 'Millennium BIM',
        salary_confirmed_months_count INTEGER DEFAULT 0
      );

      -- Tabela de Divisão Orçamental Personalizada
      CREATE TABLE IF NOT EXISTS budget_settings (
        id TEXT PRIMARY KEY,
        needs_percent REAL DEFAULT 50.0,
        wants_percent REAL DEFAULT 30.0,
        savings_percent REAL DEFAULT 20.0
      );

      -- Tabela de Orçamentos Mensais (Alocação 50/30/20)
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        allocated_amount REAL NOT NULL,
        spent_amount REAL DEFAULT 0.0,
        month_year TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      -- Tabela de Metas de Vida
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0.0,
        deadline TEXT,
        created_at TEXT NOT NULL
      );

      -- Tabela de Despesas Fixas (50% Essenciais)
      CREATE TABLE IF NOT EXISTS fixed_expenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        due_day INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      );

      -- Tabela de Transações
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        is_essential INTEGER NOT NULL,
        store_name TEXT,
        items_summary TEXT,
        ai_feedback TEXT,
        goal_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
      );

      -- Tabela de Notificações / SMS Financeiros Registados
      CREATE TABLE IF NOT EXISTS notifications_history (
        id TEXT PRIMARY KEY,
        institution TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        tag TEXT NOT NULL,
        date_str TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        action_type TEXT,
        action_payload TEXT
      );

      -- Índices base para otimização de consultas locais
      CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month_year);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
      CREATE INDEX IF NOT EXISTS idx_fixed_active ON fixed_expenses(is_active);
      CREATE INDEX IF NOT EXISTS idx_notif_time ON notifications_history(timestamp);
    `);
  } catch (err) {
    console.warn('[initDatabase] Aviso ao criar esquema base:', err);
  }

  // Migrações dinâmicas seguras por inspeção de colunas
  try {
    interface ColInfo {
      name: string;
    }
    const cols = await db.getAllAsync<ColInfo>(`PRAGMA table_info(transactions);`);
    const colNames = cols.map((c) => c.name);

    if (!colNames.includes('store_name')) {
      await db.execAsync(`ALTER TABLE transactions ADD COLUMN store_name TEXT;`);
    }
    if (!colNames.includes('items_summary')) {
      await db.execAsync(`ALTER TABLE transactions ADD COLUMN items_summary TEXT;`);
    }
    if (!colNames.includes('ai_feedback')) {
      await db.execAsync(`ALTER TABLE transactions ADD COLUMN ai_feedback TEXT;`);
    }
    if (!colNames.includes('goal_id')) {
      await db.execAsync(`ALTER TABLE transactions ADD COLUMN goal_id TEXT;`);
    }

    // Migrações dinâmicas para user_profile
    const userCols = await db.getAllAsync<ColInfo>(`PRAGMA table_info(user_profile);`);
    const userColNames = userCols.map((c) => c.name);
    if (!userColNames.includes('start_month_year')) {
      await db.execAsync(`ALTER TABLE user_profile ADD COLUMN start_month_year TEXT;`);
    }
    if (!userColNames.includes('salary_pay_day')) {
      await db.execAsync(`ALTER TABLE user_profile ADD COLUMN salary_pay_day INTEGER DEFAULT 25;`);
    }
    if (!userColNames.includes('salary_frequency')) {
      await db.execAsync(`ALTER TABLE user_profile ADD COLUMN salary_frequency TEXT DEFAULT 'monthly';`);
    }
    if (!userColNames.includes('salary_account_source')) {
      await db.execAsync(`ALTER TABLE user_profile ADD COLUMN salary_account_source TEXT DEFAULT 'Millennium BIM';`);
    }
    if (!userColNames.includes('salary_confirmed_months_count')) {
      await db.execAsync(`ALTER TABLE user_profile ADD COLUMN salary_confirmed_months_count INTEGER DEFAULT 0;`);
    }

    // Migrações dinâmicas para notifications_history
    const notifCols = await db.getAllAsync<ColInfo>(`PRAGMA table_info(notifications_history);`);
    const notifColNames = notifCols.map((c) => c.name);
    if (!notifColNames.includes('action_type')) {
      await db.execAsync(`ALTER TABLE notifications_history ADD COLUMN action_type TEXT;`);
    }
    if (!notifColNames.includes('action_payload')) {
      await db.execAsync(`ALTER TABLE notifications_history ADD COLUMN action_payload TEXT;`);
    }
  } catch (migErr) {
    console.warn('[initDatabase] Aviso nas migrações dinâmicas:', migErr);
  }

  try {
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transactions_store ON transactions(store_name);`);
  } catch {}
}
