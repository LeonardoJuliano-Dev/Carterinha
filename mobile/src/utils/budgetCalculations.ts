import { Budget, BudgetSplit, IncomeAllocation } from '../types';

/**
 * Calcula a divisão de rendimento com base numa divisão personalizada (ex: 40/30/30).
 * Se nenhum split for fornecido, usa a regra clássica 50/30/20.
 */
export function calculateBudgetSplit(
  totalIncome: number,
  split?: BudgetSplit
): IncomeAllocation {
  const safeIncome = Math.max(0, totalIncome);
  const needsPct = split?.needsPercent ?? 50;
  const wantsPct = split?.wantsPercent ?? 30;
  const savingsPct = split?.savingsPercent ?? 20;

  const needs_50 = Number(((safeIncome * needsPct) / 100).toFixed(2));
  const wants_30 = Number(((safeIncome * wantsPct) / 100).toFixed(2));
  const savings_20 = Number(((safeIncome * savingsPct) / 100).toFixed(2));

  return {
    total_income: safeIncome,
    needs_50,
    wants_30,
    savings_20,
    breakdown: {
      essential: needs_50,
      lifestyle: wants_30,
      savings_goals: savings_20,
    },
  };
}

/**
 * Atalho retrocompatível — calcula com a regra clássica 50/30/20.
 * @deprecated Preferir `calculateBudgetSplit(totalIncome, split)`.
 */
export function calculate50_30_20(totalIncome: number): IncomeAllocation {
  return calculateBudgetSplit(totalIncome);
}

/**
 * Gera as entidades de orçamento para persistência na base de dados local para o mês indicado.
 */
export function generateMonthlyBudgets(salary: number, monthYear: string): Budget[] {
  const allocation = calculate50_30_20(salary);
  const now = new Date().toISOString();

  return [
    {
      id: `budget-needs-${monthYear}`,
      category: 'essential',
      name: 'Despesas Fixas & Essenciais (50%)',
      allocated_amount: allocation.needs_50,
      spent_amount: 0.0,
      month_year: monthYear,
      created_at: now,
    },
    {
      id: `budget-wants-${monthYear}`,
      category: 'lifestyle',
      name: 'Lazer & Estilo de Vida (30%)',
      allocated_amount: allocation.wants_30,
      spent_amount: 0.0,
      month_year: monthYear,
      created_at: now,
    },
    {
      id: `budget-savings-${monthYear}`,
      category: 'savings_goals',
      name: 'Poupança & Metas de Vida (20%)',
      allocated_amount: allocation.savings_20,
      spent_amount: 0.0,
      month_year: monthYear,
      created_at: now,
    },
  ];
}
