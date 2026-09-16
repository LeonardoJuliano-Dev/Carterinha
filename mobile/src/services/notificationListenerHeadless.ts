import { AppRegistry, Platform } from 'react-native';
import { useFinanceStore } from '../stores/financeStore';

// Cache em memória para prevenção de duplicados num intervalo de 10 minutos
const processedCache = new Map<string, number>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function cleanOldCache() {
  const now = Date.now();
  for (const [key, timestamp] of processedCache.entries()) {
    if (now - timestamp > CACHE_TTL_MS) {
      processedCache.delete(key);
    }
  }
}

function isRecentlyProcessed(key: string): boolean {
  cleanOldCache();
  return processedCache.has(key);
}

function markAsProcessed(key: string) {
  cleanOldCache();
  processedCache.set(key, Date.now());
}

interface RawNotificationPayload {
  time?: string;
  app?: string;
  title?: string;
  titleBig?: string;
  text?: string;
  subText?: string;
  summaryText?: string;
  bigText?: string;
  groupedMessages?: Array<{ title?: string; text?: string }>;
}

/**
 * Tarefa em segundo plano (Headless JS) acionada pelo Android NotificationListenerService
 * sempre que uma nova notificação chega à barra de estado do telemóvel.
 */
export async function headlessNotificationListener(data?: { notification: string }) {
  if (!data || !data.notification) return;

  try {
    const raw: RawNotificationPayload =
      typeof data.notification === 'string' ? JSON.parse(data.notification) : data.notification;

    const sender = (raw.title || raw.subText || '').trim();
    const appPackage = (raw.app || '').trim();
    let messageText = (raw.bigText || raw.text || '').trim();

    // Se o texto principal estiver vazio mas existirem mensagens agrupadas (típico em SMS/WhatsApp)
    if (!messageText && Array.isArray(raw.groupedMessages) && raw.groupedMessages.length > 0) {
      const lastMessage = raw.groupedMessages[raw.groupedMessages.length - 1];
      messageText = (lastMessage.text || lastMessage.title || '').trim();
    }

    if (!messageText) return;

    // ── FILTRO DE FONTE ──────────────────────────────────────────────────────────
    // Passa sender, appPackage e messageText para maximizar a deteção.
    // Agora o filtro procura keywords no título, no package name da app de origem,
    // e no conteúdo da mensagem — capturando notificações onde o banco só aparece
    // no corpo (ex: "BIM: Crédito de 45,000.00MT...") ou no package name
    // (ex: "com.vodacom.mpesa").
    const { isSourceAllowed } = require('./notificationSources');
    if (!isSourceAllowed(sender, appPackage, messageText)) {
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────────

    // Chave única para validação de duplicação temporal
    const deduplicationKey = `${sender}:::${messageText}`;
    if (isRecentlyProcessed(deduplicationKey)) {
      return;
    }

    // Processamento financeiro no store do Carterinha
    const store = useFinanceStore.getState();
    const result = await store.processIncomingSms(messageText, sender);

    if (result) {
      markAsProcessed(deduplicationKey);
      console.log(
        `[HeadlessListener] Capturada transação ${result.institution}: ${result.amount} MT (${result.storeOrRecipient})`
      );
    }
  } catch (error) {
    console.error('[HeadlessListener] Erro ao analisar notificação:', error);
  }
}

// Registo apenas no Android
if (Platform.OS === 'android') {
  try {
    const { RNAndroidNotificationListenerHeadlessJsName } = require('react-native-android-notification-listener');
    if (RNAndroidNotificationListenerHeadlessJsName) {
      AppRegistry.registerHeadlessTask(
        RNAndroidNotificationListenerHeadlessJsName,
        () => headlessNotificationListener
      );
      console.log('[HeadlessListener] Tarefa de notificações Android registada com sucesso.');
    }
  } catch (regError) {
    console.warn('[HeadlessListener] Módulo nativo indisponível neste ambiente (Expo Go / Web):', regError);
  }
}
