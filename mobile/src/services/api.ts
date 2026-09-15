import { Platform } from 'react-native';
import {
  AIAnalysisResponse,
  Goal,
  PriceComparisonResult,
  PriceRecord,
  ReceiptExtractionResult,
  Transaction,
  UserBehaviorProfile,
  AdvisorChatPayload,
  AdvisorChatResult,
} from '../types';
import { callGeminiText, callGeminiVision } from './geminiDirectService';

export interface AnalyzeTransactionPayload {
  transaction: Transaction;
  lifestyle_budget_remaining?: number;
  active_goals?: Goal[];
  budgetSplit?: {
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
  };
}

/**
 * Análise de despesa não essencial com parecer de inteligência financeira proativa.
 * Executado diretamente com a API do Google Gemini a partir do telemóvel.
 */
export async function requestTransactionAnalysis(
  payload: AnalyzeTransactionPayload
): Promise<AIAnalysisResponse> {
  const { transaction, lifestyle_budget_remaining, active_goals, budgetSplit } = payload;

  const ruleText = budgetSplit
    ? `${budgetSplit.needsPercent.toFixed(0)}/${budgetSplit.wantsPercent.toFixed(0)}/${budgetSplit.savingsPercent.toFixed(0)}`
    : '50/30/20';

  let goalsSummary = 'O utilizador ainda não tem metas de poupança cadastradas.';
  if (active_goals && active_goals.length > 0) {
    goalsSummary = active_goals
      .map(
        (g) =>
          `- ${g.name}: Alvo = ${g.target_amount} MT, Guardado = ${g.current_amount} MT (Falta = ${Math.max(
            0,
            g.target_amount - g.current_amount
          )} MT)`
      )
      .join('\n');
  }

  const budgetInfo =
    lifestyle_budget_remaining !== undefined
      ? `\nSaldo restante no orçamento de Lazer/Estilo de Vida: ${lifestyle_budget_remaining.toFixed(2)} MT`
      : '';

  const prompt = `
És o consultor financeiro pessoal do aplicativo Carterinha em Moçambique (moeda: Meticais - MT).
Analisa a seguinte despesa NÃO ESSENCIAL que o utilizador acabou de registar dentro da regra ${ruleText}:

- Descrição: "${transaction.description}"
- Valor: ${transaction.amount.toFixed(2)} MT
- Estabelecimento: ${transaction.store_name || 'Geral'}
${budgetInfo}

Metas de vida ativas:
${goalsSummary}

Dá um parecer conciso em Português europeu (máximo 2 a 3 frases) com:
1. Impacto no orçamento e na principal meta (quantas semanas atrasa).
2. Recomendação prática em Meticais (MT) para compensar o gasto.
`;

  try {
    const aiText = await callGeminiText(prompt.trim(), false);
    if (aiText && aiText.length > 10) {
      return {
        transaction_id: transaction.id,
        advice: aiText,
        impact_level: transaction.amount > 3000 ? 'alto' : transaction.amount > 1000 ? 'moderado' : 'baixo',
      };
    }
  } catch (err) {
    console.warn('[Transaction Analysis] Falha na chamada direta Gemini, a usar motor local:', err);
  }

  // Fallback Local-First Heurístico
  const primaryGoal = active_goals && active_goals[0];
  const goalDelay = primaryGoal ? ` Atraso estimado de 1 a 2 semanas na meta "${primaryGoal.name}".` : '';
  return {
    transaction_id: transaction.id,
    advice: `Despesa de ${transaction.amount.toFixed(2)} MT em "${transaction.description}".${goalDelay} Sugere-se reduzir pequenos gastos de lazer nos próximos dias para equilibrar a regra ${ruleText}.`,
    impact_level: transaction.amount > 3000 ? 'alto' : 'moderado',
  };
}

/**
 * Extrai de forma inteligente os dados da fatura/recibo utilizando Gemini Vision diretamente no smartphone.
 */
export async function extractReceiptFromImage(payload: {
  imageBase64?: string;
  fileName?: string;
  rawText?: string;
}): Promise<ReceiptExtractionResult> {
  const promptText = `
Analise com precisão esta imagem de fatura/talão/recibo de compras de Moçambique e extraia os dados estritamente em JSON:
{
  "store_name": "Nome do Estabelecimento comercial (ex: Shoprite, VIP Spar, Galp, etc.)",
  "total_amount": 0.0,
  "category": "essential ou lifestyle",
  "date": "YYYY-MM-DD",
  "items": [
    {"name": "Nome do Produto", "price": 0.0, "quantity": 1.0}
  ]
}
Regras:
1. "total_amount": valor total final pago em número decimal positivo (ex: 1250.00 MT).
2. "category": "essential" para alimentação, saúde, farmácia, combustíveis, água, energia; "lifestyle" para restaurantes, eletrónica, lazer, vestuário.
3. Responda estritamente em JSON válido sem texto adicional.
`;

  if (payload.imageBase64) {
    try {
      const jsonStr = await callGeminiVision(promptText.trim(), payload.imageBase64, true);
      if (jsonStr) {
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const total = parseFloat(parsed.total_amount) || 0;
          const items = Array.isArray(parsed.items)
            ? parsed.items.map((it: any) => ({
                name: String(it.name || 'Item'),
                price: parseFloat(it.price) || 0,
                quantity: parseFloat(it.quantity) || 1,
              }))
            : [];

          return {
            store_name: parsed.store_name || 'Estabelecimento',
            total_amount: total,
            category: parsed.category === 'lifestyle' ? 'lifestyle' : 'essential',
            items: items.length > 0 ? items : [{ name: 'Compras', price: total, quantity: 1 }],
            is_essential: parsed.category !== 'lifestyle',
          };
        }
      }
    } catch (err) {
      console.warn('[Receipt Scanner] Falha na leitura Vision direta:', err);
    }
  }

  // Fallback Local Heurístico
  const name = payload.fileName ? payload.fileName.replace(/\.[^/.]+$/, '') : 'Estabelecimento';
  return {
    store_name: name,
    total_amount: 0,
    category: 'essential',
    items: [{ name: 'Introduza os itens da fatura', price: 0, quantity: 1 }],
    is_essential: true,
  };
}

/**
 * Consulta o histórico de compras locais para comparar preços do mesmo item em Meticais (MT).
 */
export async function comparePriceWithAI(payload: {
  itemDescription: string;
  currentPrice: number;
  currentStore?: string;
  historicalRecords: PriceRecord[];
}): Promise<PriceComparisonResult> {
  const history = payload.historicalRecords;
  if (!history || history.length === 0) {
    return {
      is_cheaper: false,
      is_more_expensive: false,
      difference_amount: 0,
      message: `Primeiro registo para "${payload.itemDescription}". Este valor servirá de referência para futuras compras.`,
    };
  }

  const best = history.reduce((min, cur) => (cur.price < min.price ? cur : min), history[0]);

  if (payload.currentPrice > best.price + 0.5) {
    const diff = payload.currentPrice - best.price;
    return {
      is_cheaper: false,
      is_more_expensive: true,
      difference_amount: diff,
      previous_best_store: best.store_name,
      previous_best_price: best.price,
      message: `Atenção: Já compraste mais barato em "${best.store_name}" por ${best.price.toFixed(2)} MT (+${diff.toFixed(2)} MT de diferença).`,
    };
  } else if (payload.currentPrice < best.price - 0.5) {
    const saved = best.price - payload.currentPrice;
    return {
      is_cheaper: true,
      is_more_expensive: false,
      difference_amount: saved,
      previous_best_store: best.store_name,
      previous_best_price: best.price,
      message: `Excelente negócio! Conseguiste poupar ${saved.toFixed(2)} MT em relação ao melhor preço em "${best.store_name}".`,
    };
  }

  return {
    is_cheaper: false,
    is_more_expensive: false,
    difference_amount: 0,
    previous_best_store: best.store_name,
    previous_best_price: best.price,
    message: `Preço alinhado com o teu histórico (${payload.currentPrice.toFixed(2)} MT).`,
  };
}

/**
 * Calcula o perfil comportamental de gastos localmente com estatísticas inteligentes.
 */
export async function fetchUserBehaviorMLProfile(payload: {
  userName: string;
  monthlyIncome: number;
  currentBalance: number;
  transactions: Transaction[];
  activeGoals: Goal[];
  budgetSplit?: {
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
  };
}): Promise<UserBehaviorProfile> {
  const txs = payload.transactions || [];
  const totalSpent = txs.reduce((acc, t) => acc + t.amount, 0);
  const lifestyleSpent = txs.filter((t) => !t.is_essential).reduce((acc, t) => acc + t.amount, 0);

  // 1. Queima diária real baseada nos dias distintos com gastos registados
  const daysWithTx = new Set(txs.map((t) => t.created_at.slice(0, 10))).size;
  const burnRate = totalSpent > 0 ? Math.round(totalSpent / Math.max(1, daysWithTx)) : 0;

  // 2. Autonomia real: quantos dias o saldo atual dura ao ritmo de queima atual
  const daysLeft = burnRate > 0 ? Math.round(payload.currentBalance / burnRate) : (payload.currentBalance > 0 ? 30 : 0);

  // 3. Proporção de estilo de vida / lazer vs essencial
  const lifestylePct = totalSpent > 0 ? Math.round((lifestyleSpent / totalSpent) * 100) : 0;

  // 4. Concentração real em fins de semana (Sexta, Sábado e Domingo) calculada das transações reais
  const weekendSpent = txs.filter((t) => {
    const d = new Date(t.created_at).getDay();
    return d === 0 || d === 5 || d === 6;
  }).reduce((acc, t) => acc + t.amount, 0);
  const weekendPct = totalSpent > 0 ? Math.round((weekendSpent / totalSpent) * 100) : 0;

  // 5. Categoria de maior despesa apurada dos registos
  const catSpending: Record<string, number> = {};
  txs.forEach((t) => {
    const key = t.category === 'essential' ? 'Fixas / Essenciais' : t.category === 'savings_goals' ? 'Metas & Poupança' : 'Lazer & Estilo de Vida';
    catSpending[key] = (catSpending[key] || 0) + t.amount;
  });
  const topCategory = Object.entries(catSpending).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sem dados de gastos';

  // 6. Arquétipo comportamental baseado nos dados reais
  let archetype = 'Equilibrado Consciente';
  let badge = 'Gestão Orçamental Estável';
  if (totalSpent === 0) {
    archetype = 'Início de Ciclo';
    badge = 'Sem despesas registadas';
  } else if (lifestylePct > 45) {
    archetype = 'Focado no Presente & Estilo de Vida';
    badge = 'Alerta de Consumo Discricionário';
  } else if (payload.activeGoals.length > 0 && payload.activeGoals.some((g) => g.current_amount > 0)) {
    archetype = 'Poupador Estratégico';
    badge = 'Foco Prioritário em Metas';
  } else if (lifestylePct < 25) {
    archetype = 'Disciplinado Frugal';
    badge = 'Consumo Essencial Rigoroso';
  }

  // 7. Risco de impulso apurado da percentagem de consumo discricionário
  const impulseRisk = totalSpent > 0 ? Math.min(95, Math.max(5, Math.round(lifestylePct * 0.9))) : 10;

  // 8. Insights dinâmicos 100% reais
  const insights: string[] = [];
  if (totalSpent > 0) {
    insights.push(`As despesas de estilo de vida representam ${lifestylePct}% do teu consumo total.`);
    insights.push(`O teu ritmo de queima diária apurado é de ${burnRate.toLocaleString('pt-PT')} MT/dia.`);
    if (weekendPct > 0) {
      insights.push(`${weekendPct}% de todo o dinheiro gasto ocorreu entre Sexta-feira e Domingo.`);
    }
    if (burnRate > 0) {
      insights.push(`Ao ritmo atual, o teu saldo disponível cobre cerca de ${daysLeft} dias.`);
    }
  } else {
    insights.push('Ainda não registaste despesas neste período para traçar o mapa de consumo.');
    insights.push('Regista as tuas primeiras transações ou digitaliza faturas para ver o teu perfil evoluir.');
  }

  // 9. Plano de ação personalizado
  let actionPlan = 'Mantém o registo diário para que o motor comportamental identifique oportunidades de otimização.';
  if (lifestylePct > 45) {
    actionPlan = `A tua maior área de consumo é "${topCategory}". Tenta reduzir 10% nesta categoria no próximo fim de semana para reforçar as tuas metas de poupança.`;
  } else if (payload.activeGoals.length > 0) {
    actionPlan = 'A tua disciplina com gastos essenciais está excelente! Considera adiantar um depósito para as tuas metas ativas.';
  }

  return {
    archetype,
    archetype_badge: badge,
    impulse_risk_score: impulseRisk,
    daily_burn_rate: burnRate,
    days_until_depleted: Math.max(0, daysLeft),
    weekend_concentration_pct: weekendPct,
    top_leaking_category: topCategory,
    ml_insights: insights,
    personalized_action_plan: actionPlan,
  };
}

/**
 * Envia uma mensagem para o Consultor Financeiro de IA com metas reais e histórico de gastos.
 * Comunica diretamente com o Google Gemini sem necessidade de backend intermediário.
 */
export async function sendAdvisorChatMessage(payload: AdvisorChatPayload): Promise<AdvisorChatResult> {
  const userName = payload.userName || 'Utilizador';
  const split = payload.budgetSplit;
  const ruleStr = split
    ? `${split.needsPercent}% Fixas / ${split.wantsPercent}% Lazer / ${split.savingsPercent}% Metas`
    : '50% Fixas / 30% Lazer / 20% Metas (flexível)';

  const incomeStr = payload.monthlyIncome ? `${payload.monthlyIncome.toLocaleString('pt-PT')} MT` : 'Não especificada';
  const balanceStr = payload.currentBalance ? `${payload.currentBalance.toLocaleString('pt-PT')} MT` : 'Não especificado';

  let goalsText = 'Nenhuma meta cadastrada ainda.';
  if (payload.activeGoals && payload.activeGoals.length > 0) {
    goalsText = payload.activeGoals
      .map((g) => {
        const rem = Math.max(0, g.target_amount - g.current_amount);
        return `- '${g.name}': Alvo = ${g.target_amount.toLocaleString('pt-PT')} MT | Guardado = ${g.current_amount.toLocaleString(
          'pt-PT'
        )} MT | Falta = ${rem.toLocaleString('pt-PT')} MT | Prazo = ${g.deadline || 'Flexível'}`;
      })
      .join('\n');
  }

  let spendingText = 'Nenhum histórico recente disponível.';
  if (payload.recentSpendingByCategory && Object.keys(payload.recentSpendingByCategory).length > 0) {
    spendingText = Object.entries(payload.recentSpendingByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `- ${cat}: ${amt.toLocaleString('pt-PT')} MT`)
      .join('\n');
  }

  let justCreatedText = '';
  if (payload.justCreatedGoal) {
    justCreatedText = `\nO utilizador ACABOU DE CADASTRAR a meta: '${payload.justCreatedGoal.name}' com alvo de ${payload.justCreatedGoal.target_amount.toLocaleString(
      'pt-PT'
    )} MT.`;
  }

  let historyText = '';
  if (payload.conversationHistory && payload.conversationHistory.length > 0) {
    historyText =
      '\nHistórico recente da conversa:\n' +
      payload.conversationHistory
        .slice(-6)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');
  }

  const prompt = `
És o Consultor Financeiro Pessoal de Inteligência Artificial da Carterinha em Moçambique (moeda oficial: Metical - MT).
És empático, motivador, altamente analítico e falas em Português europeu. Respondes a QUALQUER dúvida financeira sobre as contas do utilizador e orientas sobre metas.

DADOS REAIS DO UTILIZADOR:
- Nome: ${userName}
- Renda Mensal: ${incomeStr}
- Saldo Atual: ${balanceStr}
- Regra de Orçamento: ${ruleStr} (a regra 50/30/20 é flexível e serve como referência do sistema)
- Metas de Vida Cadastradas:
${goalsText}
- Gastos Recentes por Categoria:
${spendingText}${justCreatedText}
${historyText}

MENSAGEM DO UTILIZADOR:
"${payload.message}"

INSTRUÇÕES OBRIGATÓRIAS:
1. SE O UTILIZADOR ACABOU DE CADASTRAR A META:
   - Dá os parabéns pelo passo dado.
   - Explica quanto poupar por mês e o prazo estimado.
   - Aponta EXPLICITAMENTE QUAIS GASTOS CORTAR com base no histórico real.
   - Define "suggest_goal_creation": false.
2. SE O UTILIZADOR DISSE "NÃO" AO CADASTRO:
   - Respeita a decisão e monta o plano de aportes mesmo sem cadastro.
   - Indica QUAIS GASTOS CORTAR.
   - No final, sugere amigavelmente que pode cadastrar a meta mais tarde.
   - Define "suggest_goal_creation": false.
3. SE PERGUNTOU SOBRE UMA META CADASTRADA:
   - Lê os valores reais da meta e indica cortes para acelerar a conclusão.
   - Define "suggest_goal_creation": false, "identified_goal_id": id da meta.
4. SE PRETENDE COMPRAR / JUNTAR PARA NOVO BEM NÃO CADASTRADO:
   - Sugere o cadastro da meta e pergunta se gostaria de cadastrar agora (Sim / Não).
   - Define "suggest_goal_creation": true, "suggested_goal_name": nome, "suggested_goal_target": valor em float.
5. SE FOR UMA PERGUNTA FINANCEIRA GERAL:
   - Responde com precisão analisando os valores reais em MT.
   - Define "suggest_goal_creation": false.

Retorne ESTRITAMENTE um objeto JSON:
{
  "reply": "Texto da resposta ao utilizador...",
  "suggest_goal_creation": true/false,
  "suggested_goal_name": "Nome ou null",
  "suggested_goal_target": 1234.0 ou null,
  "identified_goal_id": "id ou null",
  "action_plan": ["Passo 1...", "Passo 2..."],
  "expenses_to_cut": ["Categoria 1...", "Categoria 2..."]
}
`;

  try {
    const rawJson = await callGeminiText(prompt.trim(), true);
    if (rawJson) {
      const match = rawJson.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          reply: parsed.reply || 'Estou aqui para apoiar a tua evolução financeira.',
          suggest_goal_creation: Boolean(parsed.suggest_goal_creation),
          suggested_goal_name: parsed.suggested_goal_name || undefined,
          suggested_goal_target: parsed.suggested_goal_target ? parseFloat(parsed.suggested_goal_target) : undefined,
          identified_goal_id: parsed.identified_goal_id || undefined,
          action_plan: Array.isArray(parsed.action_plan) ? parsed.action_plan : [],
          expenses_to_cut: Array.isArray(parsed.expenses_to_cut) ? parsed.expenses_to_cut : [],
        };
      }
    }
  } catch (err) {
    console.warn('[Advisor Gemini Direct Error]', err);
  }

  // Fallback Local-First Heurístico
  const msgLower = payload.message.toLowerCase();
  const goals = payload.activeGoals || [];
  const spending = payload.recentSpendingByCategory || {};
  const topSpending = Object.entries(spending).sort((a, b) => b[1] - a[1])[0];
  const cutNote = topSpending ? ` Cortando gastos em ${topSpending[0]} (${topSpending[1].toLocaleString('pt-PT')} MT).` : '';

  if (payload.justCreatedGoal) {
    const g = payload.justCreatedGoal;
    const monthly = Math.round(g.target_amount / 6);
    return {
      reply: `Parabéns pela criação da meta "${g.name}" de ${g.target_amount.toLocaleString('pt-PT')} MT! Guardando cerca de ${monthly.toLocaleString('pt-PT')} MT por mês alcanças o teu objetivo em 6 meses.${cutNote}`,
      suggest_goal_creation: false,
      action_plan: [`Poupar ${monthly.toLocaleString('pt-PT')} MT/mês`, 'Manter a disciplina'],
      expenses_to_cut: topSpending ? [topSpending[0]] : [],
    };
  }

  if (msgLower.includes('não') || msgLower.includes('nao')) {
    return {
      reply: `Compreendido! Podemos montar a tua estratégia mesmo sem cadastrar a meta.${cutNote} Quando quiseres acompanhar os gráficos no Carterinha, basta adicioná-la.`,
      suggest_goal_creation: false,
      action_plan: ['Reservar 20% para metas', 'Rever despesas supérfluas'],
      expenses_to_cut: topSpending ? [topSpending[0]] : [],
    };
  }

  const matched = goals.find((g) => msgLower.includes(g.name.toLowerCase()));
  if (matched) {
    const rem = Math.max(0, matched.target_amount - matched.current_amount);
    return {
      reply: `Na tua meta "${matched.name}", já acumulaste ${matched.current_amount.toLocaleString('pt-PT')} MT de ${matched.target_amount.toLocaleString('pt-PT')} MT (faltam ${rem.toLocaleString('pt-PT')} MT).${cutNote}`,
      suggest_goal_creation: false,
      identified_goal_id: matched.id,
      action_plan: [`Faltam ${rem.toLocaleString('pt-PT')} MT`, 'Manter depósitos frequentes'],
      expenses_to_cut: topSpending ? [topSpending[0]] : [],
    };
  }

  const isGeneralFinance = [
    'gasto', 'despesa', 'maior', 'orçamento', 'orcamento', '50/30/20', 'alimentação', 'lazer', 'transporte', 'poupar', 'economizar', 'saldo', 'resumo', 'cortar', 'dicas'
  ].some((kw) => msgLower.includes(kw));

  const isNewGoalIntent = [
    'quero comprar', 'comprar um', 'comprar uma', 'juntar para', 'guardar para', 'planeio comprar', 'quanto custa comprar'
  ].some((kw) => msgLower.includes(kw));

  if (isGeneralFinance && !isNewGoalIntent) {
    const totalSpending = Object.values(spending).reduce((acc, v) => acc + v, 0);
    const topCatStr = topSpending ? `${topSpending[0]} (${topSpending[1].toLocaleString('pt-PT')} MT)` : 'nenhuma despesa registada';
    return {
      reply: `Análise das tuas finanças:\n- Total gasto recentemente: ${totalSpending.toLocaleString('pt-PT')} MT\n- Maior categoria: ${topCatStr}.${cutNote}\nManter a regra orçamental e monitorizar as despesas protege a tua estabilidade financeira.`,
      suggest_goal_creation: false,
      action_plan: ['Rever despesas variáveis', 'Acompanhar o registo diário', 'Poupar 20% da renda mensal'],
      expenses_to_cut: topSpending ? [topSpending[0]] : [],
    };
  }

  let inferredName = 'Novo Objetivo';
  for (const kw of ['carro', 'mota', 'moto', 'casa', 'viagem', 'telemóvel', 'férias', 'curso', 'emergência', 'computador', 'terreno']) {
    if (msgLower.includes(kw)) {
      inferredName = kw.charAt(0).toUpperCase() + kw.slice(1);
      break;
    }
  }

  return {
    reply: `Esse é um excelente objetivo financeiro! Gostarias de cadastrar a meta "${inferredName}" no Carterinha agora? (Sim / Não)`,
    suggest_goal_creation: true,
    suggested_goal_name: inferredName,
    suggested_goal_target: 15000,
    action_plan: [],
    expenses_to_cut: topSpending ? [topSpending[0]] : [],
  };
}
