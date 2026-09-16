import { Platform } from 'react-native';

/**
 * Serviço de Notificações Locais Android.
 * Dispara notificações visíveis na barra de estado do telemóvel (som, vibração, ícone).
 *
 * Usa expo-notifications para agendar e exibir notificações locais imediatas,
 * sem necessidade de servidor push externo (100% local-first).
 */

let Notifications: typeof import('expo-notifications') | null = null;

// Carregamento lazy para evitar crash se o módulo não estiver disponível
function getNotificationsModule() {
  if (!Notifications) {
    try {
      Notifications = require('expo-notifications');
    } catch {
      console.warn('[LocalNotifications] expo-notifications não disponível neste ambiente.');
    }
  }
  return Notifications;
}

/**
 * Inicializa o canal de notificações Android (obrigatório para Android 8+).
 * Deve ser chamado uma vez ao arrancar a app.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const mod = getNotificationsModule();
  if (!mod) return;

  await mod.setNotificationChannelAsync('carterinha_alerts', {
    name: 'Alertas Carterinha',
    importance: mod.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#00E5FF',
    sound: 'default',
    lockscreenVisibility: mod.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    description: 'Lembretes de despesas, metas, salário e transações financeiras.',
  });
}

/**
 * Solicita permissão de notificações ao utilizador (Android 13+).
 * Retorna true se a permissão foi concedida.
 */
export async function requestLocalNotificationPermission(): Promise<boolean> {
  const mod = getNotificationsModule();
  if (!mod) return false;

  const { status: existingStatus } = await mod.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await mod.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Agenda e exibe uma notificação local imediata na barra de estado do Android.
 *
 * @param title     Título da notificação (ex: "⏰ Lembrete: EDM vence em 3 dias")
 * @param body      Corpo da notificação (ex: "A tua despesa fixa 'EDM' de 2,500 MT vence dia 18.")
 * @param data      Dados opcionais para tratar a ação ao tocar (actionType, actionPayload)
 */
export async function fireLocalNotification(
  title: string,
  body: string,
  data?: { actionType?: string; actionPayload?: string }
): Promise<void> {
  const mod = getNotificationsModule();
  if (!mod) return;

  try {
    await mod.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: mod.AndroidNotificationPriority.HIGH,
        data: data || {},
        ...(Platform.OS === 'android' ? { channelId: 'carterinha_alerts' } : {}),
      },
      trigger: null, // Disparo imediato
    });
  } catch (err) {
    console.warn('[LocalNotifications] Erro ao disparar notificação local:', err);
  }
}

/**
 * Regista os listeners para quando o utilizador toca numa notificação.
 * Retorna uma função de cleanup para remover os listeners.
 *
 * @param onTap Callback chamado com (actionType, actionPayload) extraídos dos dados da notificação.
 */
export function registerNotificationResponseListener(
  onTap: (actionType?: string, actionPayload?: string) => void
): () => void {
  const mod = getNotificationsModule();
  if (!mod) return () => {};

  const subscription = mod.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    const actionType = data.actionType as string | undefined;
    const actionPayload = data.actionPayload as string | undefined;
    onTap(actionType, actionPayload);
  });

  return () => subscription.remove();
}
