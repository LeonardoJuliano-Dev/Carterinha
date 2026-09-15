import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import {
  parseFinancialNotification,
  SAMPLE_MOZAMBICAN_MESSAGES,
} from '../services/smsNotificationParser';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  NotificationListenerStatus,
} from '../services/notificationListenerService';
import {
  NotificationSource,
  DEFAULT_NOTIFICATION_SOURCES,
  refreshSourcesCache,
} from '../services/notificationSources';
import { SalaryConfirmationModal } from '../components/SalaryConfirmationModal';

interface NotificationsScreenProps {
  onBack?: () => void;
  onActionClick?: (actionType?: string, actionPayload?: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, onActionClick }) => {
  const {
    notifications,
    smsListenerEnabled,
    setSmsListenerEnabled,
    processIncomingSms,
    theme,
    userProfile,
    refreshData,
    notificationSources,
    setNotificationSources,
  } = useFinanceStore();

  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [activeTab, setActiveTab] = useState<'messages' | 'simulator' | 'sources'>('messages');
  const [inputText, setInputText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationListenerStatus>('unknown');

  // Sources tab state
  const [newSourceName, setNewSourceName] = useState('');
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [editKeywordInput, setEditKeywordInput] = useState('');

  // Use store sources, falling back to defaults if not yet loaded
  const sources: NotificationSource[] =
    notificationSources.length > 0 ? notificationSources : DEFAULT_NOTIFICATION_SOURCES;

  const defaultSources = sources.filter((s) => s.isDefault);
  const customSources = sources.filter((s) => !s.isDefault);

  const checkPermission = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionStatus(status);
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshData(), checkPermission()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData, checkPermission]);

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
    setTimeout(() => checkPermission(), 2000);
  };

  const handleSimulate = async () => {
    if (!inputText.trim()) return;
    const result = await processIncomingSms(inputText.trim());
    if (result) {
      setInputText('');
      setActiveTab('messages');
    } else {
      Alert.alert(
        'Mensagem Não Reconhecida',
        'Não foi possível extrair os dados da mensagem. Verifique se contém valor em MT e o estabelecimento.'
      );
    }
  };

  // ── Sources Handlers ───────────────────────────────────────────────────────

  const handleToggleSource = async (sourceId: string, value: boolean) => {
    const updated = sources.map((s) => (s.id === sourceId ? { ...s, isEnabled: value } : s));
    await setNotificationSources(updated);
    await refreshSourcesCache();
  };

  const handleAddCustomSource = async () => {
    const name = newSourceName.trim();
    if (!name) return;
    const alreadyExists = sources.some((s) => s.name.toLowerCase() === name.toLowerCase());
    if (alreadyExists) {
      Alert.alert('Fonte já existe', `"${name}" já está na lista de fontes.`);
      return;
    }
    const newSource: NotificationSource = {
      id: `custom_${Date.now()}`,
      name,
      keywords: [name.toLowerCase()],
      isDefault: false,
      isEnabled: true,
    };
    const updated = [...sources, newSource];
    await setNotificationSources(updated);
    await refreshSourcesCache();
    setNewSourceName('');
  };

  const handleRemoveSource = (source: NotificationSource) => {
    const isDefault = source.isDefault;
    Alert.alert(
      isDefault ? '⚠️ Remover Banco Padrão' : 'Remover Fonte',
      isDefault
        ? `Tens a certeza que queres remover "${source.name}" da lista? Podes readicioná-lo como fonte personalizada.`
        : `Tens a certeza que queres remover "${source.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (editingSourceId === source.id) setEditingSourceId(null);
            const updated = sources.filter((s) => s.id !== source.id);
            await setNotificationSources(updated);
            await refreshSourcesCache();
          },
        },
      ]
    );
  };

  const handleStartEdit = (source: NotificationSource) => {
    setEditingSourceId(source.id);
    setEditName(source.name);
    setEditKeywords([...source.keywords]);
    setEditKeywordInput('');
  };

  const handleCancelEdit = () => {
    setEditingSourceId(null);
    setEditName('');
    setEditKeywords([]);
    setEditKeywordInput('');
  };

  const handleSaveEdit = async (source: NotificationSource) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Nome obrigatório', 'O nome da fonte não pode estar vazio.');
      return;
    }
    if (editKeywords.length === 0) {
      Alert.alert('Palavras-chave obrigatórias', 'Adiciona pelo menos uma palavra-chave/identificador.');
      return;
    }
    // Check for duplicate name (excluding self)
    const duplicate = sources.find(
      (s) => s.id !== source.id && s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      Alert.alert('Nome duplicado', `Já existe uma fonte chamada "${trimmedName}".`);
      return;
    }
    const updated = sources.map((s) =>
      s.id === source.id ? { ...s, name: trimmedName, keywords: editKeywords } : s
    );
    await setNotificationSources(updated);
    await refreshSourcesCache();
    setEditingSourceId(null);
  };

  const handleAddEditKeyword = () => {
    const kw = editKeywordInput.trim().toLowerCase();
    if (!kw) return;
    if (editKeywords.includes(kw)) return;
    setEditKeywords([...editKeywords, kw]);
    setEditKeywordInput('');
  };

  const handleRemoveEditKeyword = (kw: string) => {
    setEditKeywords(editKeywords.filter((k) => k !== kw));
  };

  // ─────────────────────────────────────────────────────────────────────────

  const getInstitutionIcon = (inst: string) => {
    switch (inst) {
      case 'M-Pesa':
        return { color: '#E11D48', bg: 'rgba(225, 29, 72, 0.12)', label: 'V' };
      case 'e-Mola':
        return { color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', label: 'M' };
      case 'Millennium BIM':
        return { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', label: 'BIM' };
      case 'Access Bank':
        return { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', label: 'AB' };
      default:
        return { color: colors.primaryCyan, bg: colors.primaryCyanLight, label: 'N' };
    }
  };

  const getSourceStyle = (sourceId: string) => {
    switch (sourceId) {
      case 'mpesa':
        return { color: '#E11D48', bg: 'rgba(225,29,72,0.1)', label: 'V' };
      case 'emola':
        return { color: '#F97316', bg: 'rgba(249,115,22,0.1)', label: 'M' };
      case 'bim':
        return { color: '#059669', bg: 'rgba(5,150,105,0.1)', label: 'BIM' };
      case 'accessbank':
        return { color: '#2563EB', bg: 'rgba(37,99,235,0.1)', label: 'AB' };
      default:
        return { color: colors.primaryCyan, bg: colors.primaryCyanLight, label: '?' };
    }
  };

  // Renders the inline edit panel shared by default and custom sources
  const renderEditPanel = (source: NotificationSource) => (
    <View style={[styles.editPanel, { backgroundColor: colors.surfaceElevated, borderColor: colors.primaryCyan + '50' }]}>
      {/* Name field — locked for default sources */}
      <Text style={[styles.editFieldLabel, { color: colors.textSecondary }]}>NOME DA FONTE</Text>
      {source.isDefault ? (
        <View style={[styles.editLockedField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.editLockedText, { color: colors.textMuted }]}>{source.name}</Text>
        </View>
      ) : (
        <TextInput
          style={[styles.editInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
          value={editName}
          onChangeText={setEditName}
          placeholder="Nome da fonte"
          placeholderTextColor={colors.textMuted}
        />
      )}

      {/* Keywords */}
      <Text style={[styles.editFieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>
        IDENTIFICADORES (PALAVRAS-CHAVE)
      </Text>
      <Text style={[styles.editFieldHint, { color: colors.textMuted }]}>
        A notificação é aceite se o remetente contiver qualquer um destes termos.
      </Text>

      <View style={styles.keywordsList}>
        {editKeywords.map((kw) => (
          <View
            key={kw}
            style={[styles.keywordChip, { backgroundColor: colors.primaryCyanLight, borderColor: colors.primaryCyan + '40' }]}
          >
            <Text style={[styles.keywordChipText, { color: colors.primaryCyan }]}>{kw}</Text>
            <TouchableOpacity onPress={() => handleRemoveEditKeyword(kw)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close-circle" size={14} color={colors.primaryCyan} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Add keyword input */}
      <View style={[styles.addKwRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.addKwInput, { color: colors.textPrimary }]}
          value={editKeywordInput}
          onChangeText={setEditKeywordInput}
          placeholder="Novo identificador (ex: +842424)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleAddEditKeyword}
        />
        <TouchableOpacity
          style={[styles.addKwBtn, { backgroundColor: editKeywordInput.trim() ? colors.primaryCyan : colors.surfaceElevated }]}
          onPress={handleAddEditKeyword}
          disabled={!editKeywordInput.trim()}
        >
          <Ionicons name="add" size={16} color={editKeywordInput.trim() ? '#fff' : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.editActions}>
        <TouchableOpacity
          style={[styles.editCancelBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={handleCancelEdit}
        >
          <Text style={[styles.editCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editSaveBtn, { backgroundColor: colors.primaryCyan }]}
          onPress={() => handleSaveEdit(source)}
        >
          <Ionicons name="checkmark" size={15} color="#fff" />
          <Text style={styles.editSaveText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renders a single source row (used for both default and custom)
  const renderSourceRow = (source: NotificationSource, isLast: boolean) => {
    const style = getSourceStyle(source.id);
    const isEditing = editingSourceId === source.id;

    return (
      <View key={source.id}>
        <View style={styles.sourceRow}>
          {/* Icon/Badge */}
          <View style={[styles.sourceIconWrap, { backgroundColor: style.bg }]}>
            {source.isDefault ? (
              <Text style={[styles.sourceIconLabel, { color: style.color }]}>{style.label}</Text>
            ) : (
              <Ionicons name="person-outline" size={16} color={colors.primaryCyan} />
            )}
          </View>

          {/* Info */}
          <View style={styles.sourceInfo}>
            <Text style={[styles.sourceName, { color: colors.textPrimary }]}>{source.name}</Text>
            <Text style={[styles.sourceKeywords, { color: colors.textMuted }]} numberOfLines={1}>
              {source.keywords.slice(0, 4).join(' • ')}{source.keywords.length > 4 ? ' …' : ''}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.sourceControls}>
            <Switch
              value={source.isEnabled}
              onValueChange={(v) => handleToggleSource(source.id, v)}
              trackColor={{ false: '#94A3B8', true: colors.primaryCyan }}
              thumbColor="#FFFFFF"
              style={styles.sourceSwitch}
            />
            {/* Edit button */}
            <TouchableOpacity
              onPress={() => isEditing ? handleCancelEdit() : handleStartEdit(source)}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isEditing
                    ? colors.primaryCyan + '20'
                    : colors.surfaceElevated,
                  borderColor: isEditing ? colors.primaryCyan + '60' : colors.border,
                },
              ]}
              accessibilityLabel={`Editar ${source.name}`}
            >
              <Ionicons
                name={isEditing ? 'close-outline' : 'pencil-outline'}
                size={14}
                color={isEditing ? colors.primaryCyan : colors.textSecondary}
              />
            </TouchableOpacity>
            {/* Delete button */}
            <TouchableOpacity
              onPress={() => handleRemoveSource(source)}
              style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}
              accessibilityLabel={`Remover ${source.name}`}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline edit panel */}
        {isEditing && renderEditPanel(source)}

        {!isLast && !isEditing && (
          <View style={[styles.sourceDivider, { backgroundColor: colors.border }]} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao ecrã anterior"
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
          {t.notificationsTitle}
        </Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      {/* Segmented Control — 3 tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        {[
          { id: 'messages', icon: 'list-outline', label: `${t.tabMessages} (${notifications.length})` },
          { id: 'simulator', icon: 'flask-outline', label: t.tabSimulator },
          { id: 'sources', icon: 'options-outline', label: t.tabSources },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && { backgroundColor: colors.primaryCyan }]}
              onPress={() => setActiveTab(tab.id as typeof activeTab)}
              accessibilityRole="button"
            >
              <Ionicons name={tab.icon as any} size={12} color={isActive ? '#fff' : colors.textSecondary} />
              <Text style={[styles.tabText, { color: isActive ? '#fff' : colors.textSecondary }, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Permission banner */}
        {activeTab !== 'sources' && permissionStatus !== 'authorized' && (
          <View style={[styles.statusBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[styles.statusIconWrap, { backgroundColor: colors.primaryCyanLight }]}>
              <Ionicons name="notifications-outline" size={24} color={colors.primaryCyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>{t.autoSmsDetection}</Text>
              <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>{t.autoSmsDesc}</Text>
              <TouchableOpacity style={[styles.grantBtn, { backgroundColor: colors.primaryCyan }]} onPress={handleRequestPermission} activeOpacity={0.8}>
                <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.grantBtnText}>{t.enableAutoReadingBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── TAB: Mensagens ─────────────────────────────────────────────── */}
        {activeTab === 'messages' && (
          <View style={styles.messagesList}>
            {notifications.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nenhuma notificação capturada</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  As notificações e SMS financeiros que entrarem no telemóvel surgirão aqui automaticamente.
                </Text>
              </View>
            ) : (
              notifications.map((notif) => {
                const iconInfo = getInstitutionIcon(notif.institution);
                const isPositive = notif.type === 'income';
                return (
                  <View key={notif.id} style={[styles.notifCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
                    <View style={styles.notifTopRow}>
                      <View style={styles.instRow}>
                        <View style={[styles.instBadgeCircle, { backgroundColor: iconInfo.bg }]}>
                          <Text style={[styles.instBadgeLetter, { color: iconInfo.color }]}>{iconInfo.label}</Text>
                        </View>
                        <View>
                          <Text style={[styles.instTitle, { color: colors.textPrimary }]}>{notif.title}</Text>
                          <Text style={[styles.notifTime, { color: colors.textMuted }]}>{notif.dateStr}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>{notif.message}</Text>
                    {notif.actionType && notif.actionType !== 'none' && (
                      <TouchableOpacity
                        style={{
                          marginTop: 8,
                          marginBottom: 10,
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}
                        onPress={() => onActionClick?.(notif.actionType, notif.actionPayload)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 9,
                            paddingHorizontal: 12,
                            backgroundColor:
                              notif.actionType === 'navigate_advisor'
                                ? 'rgba(147, 51, 234, 0.12)'
                                : notif.actionType === 'navigate_goals'
                                ? 'rgba(2, 132, 199, 0.12)'
                                : 'rgba(245, 158, 11, 0.12)',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor:
                              notif.actionType === 'navigate_advisor'
                                ? 'rgba(147, 51, 234, 0.3)'
                                : notif.actionType === 'navigate_goals'
                                ? 'rgba(2, 132, 199, 0.3)'
                                : 'rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          <Ionicons
                            name={
                              notif.actionType === 'navigate_advisor'
                                ? 'sparkles'
                                : notif.actionType === 'navigate_goals'
                                ? 'flag'
                                : 'card'
                            }
                            size={14}
                            color={
                              notif.actionType === 'navigate_advisor'
                                ? colors.accentPurple
                                : notif.actionType === 'navigate_goals'
                                ? colors.primaryCyan
                                : '#D97706'
                            }
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '800',
                              color:
                                notif.actionType === 'navigate_advisor'
                                ? colors.accentPurple
                                : notif.actionType === 'navigate_goals'
                                ? colors.primaryCyan
                                : '#D97706',
                            }}
                          >
                            {notif.actionType === 'navigate_advisor'
                              ? 'Consultar como alcançar com a IA →'
                              : notif.actionType === 'navigate_goals'
                              ? 'Ver Minhas Metas →'
                              : 'Ver Despesas Fixas →'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    <View style={styles.notifBottomRow}>
                      <View style={[styles.tagPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Text style={[styles.tagText, { color: colors.textSecondary }]}>{notif.tag}</Text>
                      </View>
                      <Text style={[styles.amountText, { color: isPositive ? colors.accentGreen : colors.accentRed }]}>
                        {isPositive ? '+' : '-'}{formatCurrency(notif.amount, currencySymbol, true)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── TAB: Simulador ─────────────────────────────────────────────── */}
        {activeTab === 'simulator' && (
          <View style={styles.simulatorContainer}>
            <View style={[styles.permBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permTitle, { color: colors.textPrimary }]}>Deteção Automática Ativa</Text>
                <Text style={[styles.permDesc, { color: colors.textSecondary }]}>Processar e categorizar em tempo real no telemóvel</Text>
              </View>
              <Switch value={smsListenerEnabled} onValueChange={setSmsListenerEnabled} trackColor={{ false: '#94A3B8', true: colors.primaryCyan }} thumbColor="#FFFFFF" />
            </View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TESTAR COM TEXTO MANUAL</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              multiline numberOfLines={4}
              placeholder={t.placeholderSmsPaste}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={[styles.simBtn, { backgroundColor: colors.primaryCyan }]} onPress={handleSimulate} activeOpacity={0.8}>
              <Text style={styles.simBtnText}>Processar e Registar Despesa</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>EXEMPLOS REAIS DE MOÇAMBIQUE</Text>
            <View style={styles.samplesGrid}>
              {SAMPLE_MOZAMBICAN_MESSAGES.map((sample, sIdx) => (
                <TouchableOpacity key={sIdx} style={[styles.sampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setInputText(sample.text)}>
                  <Text style={[styles.sampleTitle, { color: colors.primaryCyan }]}>{sample.label}</Text>
                  <Text style={[styles.sampleSnippet, { color: colors.textSecondary }]} numberOfLines={2}>{sample.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── TAB: Fontes ────────────────────────────────────────────────── */}
        {activeTab === 'sources' && (
          <View style={styles.sourcesContainer}>
            {/* Info card */}
            <View style={[styles.sourcesDescCard, { backgroundColor: colors.primaryCyanLight, borderColor: colors.primaryCyan + '40' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primaryCyan} />
              <Text style={[styles.sourcesDescText, { color: colors.primaryCyan }]}>{t.sourcesDesc}</Text>
            </View>

            {/* Default sources */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.defaultSourcesLabel}</Text>
            <View style={[styles.sourcesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {defaultSources.map((source, idx) =>
                renderSourceRow(source, idx === defaultSources.length - 1)
              )}
            </View>

            {/* Add custom source */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 8 }]}>{t.addCustomSourceLabel}</Text>
            <View style={[styles.addSourceRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addSourceInput, { color: colors.textPrimary }]}
                placeholder={t.addSourcePlaceholder}
                placeholderTextColor={colors.textMuted}
                value={newSourceName}
                onChangeText={setNewSourceName}
                returnKeyType="done"
                onSubmitEditing={handleAddCustomSource}
              />
              <TouchableOpacity
                style={[styles.addSourceBtn, { backgroundColor: newSourceName.trim() ? colors.primaryCyan : colors.surfaceElevated }]}
                onPress={handleAddCustomSource}
                activeOpacity={0.8}
                disabled={!newSourceName.trim()}
              >
                <Ionicons name="add" size={18} color={newSourceName.trim() ? '#fff' : colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Custom sources */}
            {customSources.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 4 }]}>{t.customSourcesLabel}</Text>
                <View style={[styles.sourcesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {customSources.map((source, idx) =>
                    renderSourceRow(source, idx === customSources.length - 1)
                  )}
                </View>
              </>
            )}

            {customSources.length === 0 && (
              <View style={[styles.emptySourcesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="add-circle-outline" size={28} color={colors.textMuted} />
                <Text style={[styles.emptySourcesText, { color: colors.textSecondary }]}>{t.sourceEmptyCustom}</Text>
              </View>
            )}

            {/* Info note */}
            <View style={[styles.infoNote, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.infoNoteText, { color: colors.textMuted }]}>
                As fontes são identificadas pelo nome do remetente na notificação Android. Usa o lápis para editar o nome ou os identificadores de qualquer fonte.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <SalaryConfirmationModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  screenTitle: { fontSize: 17, fontWeight: '800' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 18, borderRadius: 16, padding: 3, borderWidth: 1, marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabText: { fontSize: 11, fontWeight: '700' },
  tabTextActive: { fontWeight: '800' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 160 },
  // Permission banner
  statusBanner: { borderRadius: 22, padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  statusIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statusTitle: { fontSize: 14, fontWeight: '800' },
  statusDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  grantBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, marginTop: 10, alignSelf: 'flex-start' },
  grantBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  // Messages tab
  messagesList: { gap: 12 },
  notifCard: { borderRadius: 24, padding: 18, borderWidth: 1, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  instRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  instBadgeCircle: { width: 38, height: 38, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  instBadgeLetter: { fontSize: 13, fontWeight: '900' },
  instTitle: { fontSize: 14, fontWeight: '800' },
  notifTime: { fontSize: 11, marginTop: 2 },
  notifMessage: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  notifBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '700' },
  amountText: { fontSize: 16, fontWeight: '900' },
  emptyCard: { borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, marginTop: 20 },
  emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 10 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  // Simulator tab
  simulatorContainer: { gap: 12 },
  permBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 22, borderWidth: 1, marginBottom: 10 },
  permTitle: { fontSize: 14, fontWeight: '800' },
  permDesc: { fontSize: 11, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  textArea: { borderRadius: 20, padding: 16, fontSize: 13, borderWidth: 1, minHeight: 90, textAlignVertical: 'top' },
  simBtn: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  simBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  samplesGrid: { gap: 8 },
  sampleCard: { padding: 14, borderRadius: 18, borderWidth: 1 },
  sampleTitle: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  sampleSnippet: { fontSize: 11, lineHeight: 15 },
  // Sources tab
  sourcesContainer: { gap: 10 },
  sourcesDescCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 6 },
  sourcesDescText: { fontSize: 12, lineHeight: 17, flex: 1, fontWeight: '600' },
  sourcesCard: { borderRadius: 22, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  sourceIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sourceIconLabel: { fontSize: 11, fontWeight: '900' },
  sourceInfo: { flex: 1, minWidth: 0 },
  sourceName: { fontSize: 13, fontWeight: '800' },
  sourceKeywords: { fontSize: 10, marginTop: 1 },
  sourceControls: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  sourceSwitch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  iconBtn: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  sourceDivider: { height: 1, marginLeft: 60, marginRight: 14 },
  addSourceRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, gap: 8, marginBottom: 4 },
  addSourceInput: { flex: 1, fontSize: 13, paddingVertical: 8 },
  addSourceBtn: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptySourcesCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  emptySourcesText: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  infoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  infoNoteText: { fontSize: 11, lineHeight: 16, flex: 1 },
  // Edit panel
  editPanel: { marginHorizontal: 12, marginBottom: 10, borderRadius: 18, borderWidth: 1.5, padding: 14, gap: 4 },
  editFieldLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  editFieldHint: { fontSize: 10, lineHeight: 14, marginBottom: 8 },
  editLockedField: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  editLockedText: { fontSize: 13 },
  editInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  keywordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  keywordChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  keywordChipText: { fontSize: 11, fontWeight: '700' },
  addKwRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, gap: 6, marginBottom: 10 },
  addKwInput: { flex: 1, fontSize: 12, paddingVertical: 6 },
  addKwBtn: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  editActions: { flexDirection: 'row', gap: 8 },
  editCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  editCancelText: { fontSize: 13, fontWeight: '700' },
  editSaveBtn: { flex: 2, paddingVertical: 10, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  editSaveText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
