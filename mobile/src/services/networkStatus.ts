import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getEffectiveGeminiKey } from './geminiDirectService';

export type ConnectivityStatus = {
  isInternetReachable: boolean;
  isBackendReachable: boolean; // IA Google Gemini disponível no telemóvel
};

type ConnectivityListener = (status: ConnectivityStatus) => void;

let currentStatus: ConnectivityStatus = {
  isInternetReachable: true,
  isBackendReachable: false,
};

const listeners: Set<ConnectivityListener> = new Set();
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Verifica se a API do Google Gemini está acessível diretamente pelo telemóvel.
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    const key = await getEffectiveGeminiKey();
    if (!key) return false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentStatus }));
}

/**
 * Força uma verificação imediata do backend e notifica todos os listeners (ex: store / banner).
 */
export async function checkBackendHealthNow(): Promise<boolean> {
  const reachable = await checkBackendHealth();
  currentStatus.isBackendReachable = reachable;
  notifyListeners();
  return reachable;
}

/**
 * Retorna o estado actual de conectividade.
 */
export function getConnectivityStatus(): ConnectivityStatus {
  return { ...currentStatus };
}

/**
 * Regista um listener para alterações de conectividade.
 * Retorna uma função unsubscribe.
 */
export function subscribeConnectivity(listener: ConnectivityListener): () => void {
  listeners.add(listener);
  // Notificar imediatamente com o estado actual
  listener({ ...currentStatus });
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Inicia a monitorização de conectividade:
 * 1. Subscreve ao NetInfo para mudanças de rede
 * 2. Faz health check periódico ao backend (cada 30s)
 */
export function startConnectivityMonitor(): () => void {
  // 1. Subscrever ao NetInfo
  const unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
    const wasOnline = currentStatus.isInternetReachable;
    currentStatus.isInternetReachable = state.isInternetReachable ?? state.isConnected ?? false;

    // Se voltou online, verificar backend imediatamente
    if (!wasOnline && currentStatus.isInternetReachable) {
      checkBackendHealth().then((reachable) => {
        currentStatus.isBackendReachable = reachable;
        notifyListeners();
      });
    }

    // Se ficou offline, backend também fica inacessível
    if (!currentStatus.isInternetReachable) {
      currentStatus.isBackendReachable = false;
    }

    notifyListeners();
  });

  // 2. Health check periódico ao backend (cada 30s)
  const runHealthCheck = async () => {
    if (currentStatus.isInternetReachable) {
      const reachable = await checkBackendHealth();
      if (reachable !== currentStatus.isBackendReachable) {
        currentStatus.isBackendReachable = reachable;
        notifyListeners();
      }
    }
  };

  // Check inicial
  runHealthCheck();

  healthCheckInterval = setInterval(runHealthCheck, 30000);

  // Retorna cleanup
  return () => {
    unsubscribeNetInfo();
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
    listeners.clear();
  };
}
