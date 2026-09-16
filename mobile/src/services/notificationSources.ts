import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSource {
  id: string;
  /** Nome visível ao utilizador, ex: "M-Pesa" */
  name: string;
  /**
   * Lista de termos (em minúsculas) que devem estar presentes no remetente da
   * notificação para que ela seja atribuída a esta fonte.
   * A verificação é: senderLower.includes(keyword)
   */
  keywords: string[];
  /** Se verdadeiro, este registo veio da lista padrão e não pode ser removido */
  isDefault: boolean;
  /** O utilizador pode desligar individualmente cada fonte */
  isEnabled: boolean;
}

const STORAGE_KEY = 'notificationSources_v1';

/** Fontes pré-definidas — ativas por default */
export const DEFAULT_NOTIFICATION_SOURCES: NotificationSource[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    keywords: ['m-pesa', 'mpesa', '8484', 'vodacom'],
    isDefault: true,
    isEnabled: true,
  },
  {
    id: 'emola',
    name: 'e-Mola',
    keywords: ['e-mola', 'emola', '8686', '8787', 'movitel'],
    isDefault: true,
    isEnabled: true,
  },
  {
    id: 'bim',
    name: 'Millennium BIM',
    keywords: ['+842424', '842424', 'mbim', 'millennium', 'izi', 'bim'],
    isDefault: true,
    isEnabled: true,
  },
  {
    id: 'accessbank',
    name: 'Access Bank',
    keywords: ['access', 'accessbank', 'accessbankmz'],
    isDefault: true,
    isEnabled: true,
  },
];

// Cache em memória para evitar leituras excessivas de AsyncStorage no headless listener
let _cachedSources: NotificationSource[] | null = null;

/**
 * Carrega a lista de fontes persistida (ou retorna as defaults se não existir).
 */
export async function loadNotificationSources(): Promise<NotificationSource[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      _cachedSources = DEFAULT_NOTIFICATION_SOURCES;
      return _cachedSources;
    }

    const parsed: NotificationSource[] = JSON.parse(raw);

    // Garante que eventuais novos defaults (de updates da app) aparecem
    const merged = [...DEFAULT_NOTIFICATION_SOURCES];
    for (const defaultSource of merged) {
      const saved = parsed.find((s) => s.id === defaultSource.id);
      if (saved !== undefined) {
        // Respeita a preferência de isEnabled que o utilizador escolheu
        defaultSource.isEnabled = saved.isEnabled;
      }
    }

    // Adiciona fontes personalizadas (não presentes nos defaults)
    const customSources = parsed.filter((s) => !s.isDefault);
    _cachedSources = [...merged, ...customSources];
    return _cachedSources;
  } catch (err) {
    console.warn('[NotificationSources] Erro ao carregar fontes:', err);
    _cachedSources = DEFAULT_NOTIFICATION_SOURCES;
    return _cachedSources;
  }
}

/**
 * Persiste a lista de fontes e atualiza o cache em memória.
 */
export async function saveNotificationSources(sources: NotificationSource[]): Promise<void> {
  try {
    _cachedSources = sources;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  } catch (err) {
    console.warn('[NotificationSources] Erro ao guardar fontes:', err);
  }
}

/**
 * Verifica se um dado remetente pertence a alguma fonte ativa.
 * Usado pelo headless listener para filtrar notificações não financeiras (ex: WhatsApp).
 *
 * Analisa múltiplas fontes de informação para maximizar a deteção:
 * - sender (title/subText da notificação Android)
 * - appPackage (nome do pacote da app que originou, ex: com.vodacom.mpesa)
 * - messageBody (conteúdo textual da mensagem)
 *
 * @param sender      - O campo title/subText da notificação Android (case-insensitive)
 * @param appPackage  - O package name da app de origem (ex: "com.vodacom.mpesa")
 * @param messageBody - O conteúdo de texto/bigText da notificação
 */
export function isSourceAllowed(sender: string, appPackage?: string, messageBody?: string): boolean {
  // Construir um único texto de contexto combinado para pesquisa
  const parts: string[] = [];
  if (sender) parts.push(sender);
  if (appPackage) parts.push(appPackage);
  if (messageBody) parts.push(messageBody);

  if (parts.length === 0) return false;

  const combinedLower = parts.join(' ').toLowerCase();

  const sources = _cachedSources ?? DEFAULT_NOTIFICATION_SOURCES;

  return sources.some(
    (source) =>
      source.isEnabled &&
      source.keywords.some((kw) => combinedLower.includes(kw))
  );
}

/**
 * Força recarga do cache (útil após alterações nas definições).
 */
export async function refreshSourcesCache(): Promise<void> {
  _cachedSources = null;
  await loadNotificationSources();
}
