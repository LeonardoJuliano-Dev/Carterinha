import { Platform, Linking } from 'react-native';

export type NotificationListenerStatus = 'authorized' | 'denied' | 'unknown' | 'unsupported';

/**
 * Verifica se a plataforma e o módulo nativo suportam a escuta de notificações.
 */
export function isNotificationListenerSupported(): boolean {
  if (Platform.OS !== 'android') return false;
  try {
    const mod = require('react-native-android-notification-listener');
    const RNAndroidNotificationListener = mod.default || mod;
    return Boolean(RNAndroidNotificationListener && RNAndroidNotificationListener.getPermissionStatus);
  } catch {
    return false;
  }
}

/**
 * Obtém o estado atual da permissão de Acesso a Notificações no Android.
 */
export async function getNotificationPermissionStatus(): Promise<NotificationListenerStatus> {
  if (Platform.OS !== 'android') {
    return 'unsupported';
  }

  try {
    const mod = require('react-native-android-notification-listener');
    const RNAndroidNotificationListener = mod.default || mod;
    if (RNAndroidNotificationListener && typeof RNAndroidNotificationListener.getPermissionStatus === 'function') {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      if (status === 'authorized' || status === 'denied' || status === 'unknown') {
        return status;
      }
    }
    return 'unsupported';
  } catch (error) {
    console.log('[NotificationService] Módulo nativo não detetado (ambiente Expo Go ou emulador):', error);
    return 'unsupported';
  }
}

/**
 * Solicita a abertura do ecrã de Definições de Acesso a Notificações no Android
 * para que o utilizador conceda a permissão à Carterinha.
 */
export async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const mod = require('react-native-android-notification-listener');
    const RNAndroidNotificationListener = mod.default || mod;
    if (RNAndroidNotificationListener && typeof RNAndroidNotificationListener.requestPermission === 'function') {
      RNAndroidNotificationListener.requestPermission();
      return;
    }
  } catch (error) {
    console.warn('[NotificationService] Falha ao acionar permissão nativa, tentando intent do Android:', error);
  }

  // Fallback via Linking intent se o módulo nativo não estiver vinculado
  try {
    await Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
  } catch (intentErr) {
    console.warn('[NotificationService] Não foi possível abrir o ecrã de definições:', intentErr);
    try {
      await Linking.openSettings();
    } catch {}
  }
}
