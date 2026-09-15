import { useJobQueueStore } from '../stores/jobQueueStore';
import { subscribeConnectivity } from './networkStatus';
import { requestTransactionAnalysis } from './api';
import { useFinanceStore } from '../stores/financeStore';
import { updateTransactionAIFeedback } from '../database/queries';

let isProcessing = false;

export function startSyncQueueService() {
  console.log('[SyncQueueService] Serviço de sincronização iniciado.');

  // Subscreve mudanças na rede para processar a fila quando voltar online
  subscribeConnectivity((status) => {
    if (status.isInternetReachable) {
      processQueue();
    }
  });

  // Tenta processar no arranque também
  processQueue();
}

async function processQueue() {
  if (isProcessing) return;

  const store = useJobQueueStore.getState();
  const pendingJobs = store.getPendingJobs();

  if (pendingJobs.length === 0) return;

  isProcessing = true;
  console.log(`[SyncQueueService] Processando ${pendingJobs.length} trabalhos pendentes...`);

  for (const job of pendingJobs) {
    try {
      if (job.type === 'ANALYZE_TRANSACTION') {
        const financeStore = useFinanceStore.getState();
        const { transaction } = job.payload;

        const lifestyleBudget = financeStore.budgets.find((b) => b.category === 'lifestyle');
        const remainingLifestyle = lifestyleBudget
          ? lifestyleBudget.allocated_amount - lifestyleBudget.spent_amount
          : undefined;

        const aiResponse = await requestTransactionAnalysis({
          transaction,
          lifestyle_budget_remaining: remainingLifestyle,
          active_goals: financeStore.goals,
          budgetSplit: financeStore.budgetSplit,
        });

        await updateTransactionAIFeedback(transaction.id, aiResponse.advice);

        // Atualizar estado em memória se a transação ainda lá estiver
        const txs = useFinanceStore.getState().transactions;
        if (txs.some((t) => t.id === transaction.id)) {
          // Atualiza via setState do zustand de forma segura
          useFinanceStore.setState((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === transaction.id ? { ...tx, ai_feedback: aiResponse.advice } : tx
            ),
          }));
        }

        store.removeJob(job.id);
        console.log(`[SyncQueueService] Trabalho ${job.id} concluído com sucesso.`);
      }
    } catch (error) {
      console.error(`[SyncQueueService] Erro ao processar trabalho ${job.id}:`, error);
      store.markJobFailed(job.id);
    }
  }

  isProcessing = false;
}
