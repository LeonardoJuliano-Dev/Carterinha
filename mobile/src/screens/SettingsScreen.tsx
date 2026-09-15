import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFinanceStore } from '../stores/financeStore';
import { lightTheme, darkTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';
import { getCurrencySymbol } from '../utils/formatters';
import {
  getEffectiveGeminiKey,
  setCustomGeminiKey,
  testGeminiConnection,
} from '../services/geminiDirectService';

interface SettingsScreenProps {
  onBack?: () => void;
  onNavigateAppearance?: () => void;
  onNavigateFixedExpenses?: () => void;
  onNavigateAdvisor?: () => void;
  onNavigateNotifications?: () => void;
  onNavigatePriceComparison?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onNavigateAppearance,
  onNavigateFixedExpenses,
  onNavigateAdvisor,
  onNavigateNotifications,
  onNavigatePriceComparison,
}) => {
  const {
    userProfile,
    budgetSplit,
    allocation,
    updateProfile,
    updateBudgetSplit,
    exportDataAsJson,
    importDatabaseFromJson,
    lockApp,
    theme,
  } = useFinanceStore();

  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importStep, setImportStep] = useState<'select' | 'loading' | 'done'>('select');
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusMsg, setImportStatusMsg] = useState('');

  // Estados de edição de perfil
  const [editName, setEditName] = useState(userProfile.name);
  const [editEmail, setEditEmail] = useState(userProfile.email);
  const [editSalary, setEditSalary] = useState(String(allocation?.total_income || ''));
  const [editInitialBalance, setEditInitialBalance] = useState(String(userProfile.initialBalance || ''));
  const [editPayDay, setEditPayDay] = useState(String(userProfile.salaryPayDay || 25));
  const [editFrequency, setEditFrequency] = useState<'monthly' | 'biweekly' | 'bimonthly'>(userProfile.salaryFrequency || 'monthly');
  const [editSalaryAccount, setEditSalaryAccount] = useState(userProfile.salaryAccountSource || 'Millennium BIM');

  // Estados de IA Gemini Direta
  const [geminiKey, setGeminiKey] = useState('');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // Estados de edição de orçamento
  const [editNeeds, setEditNeeds] = useState(String(budgetSplit.needsPercent));
  const [editWants, setEditWants] = useState(String(budgetSplit.wantsPercent));
  const [editSavings, setEditSavings] = useState(String(budgetSplit.savingsPercent));

  // Estados de segurança
  const [newPin, setNewPin] = useState(userProfile.pinCode || '');

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'AE';
  };

  const handleOpenProfileModal = () => {
    setEditName(userProfile.name);
    setEditEmail(userProfile.email);
    setEditSalary(allocation?.total_income ? String(allocation.total_income) : '');
    setEditInitialBalance(userProfile.initialBalance !== undefined ? String(userProfile.initialBalance) : '');
    setEditPayDay(String(userProfile.salaryPayDay || 25));
    setEditFrequency(userProfile.salaryFrequency || 'monthly');
    setEditSalaryAccount(userProfile.salaryAccountSource || 'Millennium BIM');
    setProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert(t.errIncompleteTitle, t.errIncompleteDesc);
      return;
    }
    const parsedSalary = parseFloat(editSalary.replace(',', '.')) || 0;
    const parsedInitBal = parseFloat(editInitialBalance.replace(',', '.')) || 0;
    const parsedPayDay = parseInt(editPayDay, 10) || 25;
    const clampedPayDay = Math.min(31, Math.max(1, parsedPayDay));

    await updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      initialBalance: parsedInitBal,
      salary: parsedSalary > 0 ? parsedSalary : undefined,
      salaryPayDay: clampedPayDay,
      salaryFrequency: editFrequency,
      salaryAccountSource: editSalaryAccount,
    });
    setProfileModalVisible(false);
    Alert.alert(t.confirm, t.profileSaveSuccess);
  };

  const handleSaveBudget = async () => {
    const n = parseFloat(editNeeds) || 50;
    const w = parseFloat(editWants) || 30;
    const s = parseFloat(editSavings) || 20;

    if (n + w + s !== 100) {
      Alert.alert(t.errSumPercentTitle, t.budgetSum100Alert);
      return;
    }

    await updateBudgetSplit({ needsPercent: n, wantsPercent: w, savingsPercent: s });
    setBudgetModalVisible(false);
    Alert.alert(t.confirm, t.budgetUpdatedSuccess);
  };

  const handleSaveSecurity = async () => {
    if (newPin && newPin.length !== 4) {
      Alert.alert(t.errInvalidPinTitle, t.pinInvalidLength);
      return;
    }
    await updateProfile({ pinCode: newPin || undefined });
    setSecurityModalVisible(false);
    Alert.alert(t.confirm, newPin ? t.pinConfigSuccess : t.pinRemovedSuccess);
  };

  const handleOpenAiModal = async () => {
    const key = await getEffectiveGeminiKey();
    setGeminiKey(key);
    setAiModalVisible(true);
  };

  const handleTestGeminiConnection = async () => {
    setIsTestingGemini(true);
    try {
      const res = await testGeminiConnection(geminiKey);
      if (res.success) {
        Alert.alert(
          t.aiDirectSuccessTitle,
          `${res.message}\n\n${t.aiDirectSuccessMsg}`
        );
      } else {
        Alert.alert('Falha de Comunicação', res.message);
      }
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    await setCustomGeminiKey(geminiKey.trim() || null);
    setAiModalVisible(false);
    Alert.alert(t.confirm, t.keySavedSuccess);
  };

  const handleResetGeminiKey = async () => {
    await setCustomGeminiKey(null);
    const def = await getEffectiveGeminiKey();
    setGeminiKey(def);
    Alert.alert(t.confirm, t.keyRestoredSuccess);
  };

  const handleExportData = async () => {
    try {
      const json = await exportDataAsJson();
      await Share.share({
        title: 'Exportação Carterinha Local-First',
        message: json,
      });
    } catch (err) {
      Alert.alert('Erro', t.cannotExportData);
    }
  };

  const handlePickFileAndImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const fileAsset = res.assets[0];
      setImportStep('loading');
      setImportProgress(25);

      let content = '';
      if (fileAsset.uri) {
        content = await FileSystem.readAsStringAsync(fileAsset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      setImportProgress(65);

      if (!content || !content.trim()) {
        throw new Error(t.fileEmptyOrUnreadable);
      }

      const result = await importDatabaseFromJson(content);
      setImportProgress(100);

      if (result.success) {
        setImportStatusMsg(result.message);
        setImportStep('done');
      } else {
        setImportStep('select');
        Alert.alert('Erro na Importação', result.message);
      }
    } catch (err: any) {
      setImportStep('select');
      Alert.alert(t.errorImportingFile, err?.message || t.fileEmptyOrUnreadable);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar One UI 8.5 */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t.back}
            style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
          {t.settingsAndProfile}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cartão de Perfil do Utilizador (Mockup Screen 10) */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.cardShadow,
            },
          ]}
          onPress={handleOpenProfileModal}
          accessibilityRole="button"
          accessibilityLabel={t.editProfileSettings}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryCyan }]}>
            <Text style={styles.avatarText}>{getInitials(userProfile.name)}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {userProfile.name}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {userProfile.email}
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Secção CONTA (Mockup Screen 10) */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.accountSection}</Text>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              setImportStep('select');
              setImportProgress(0);
              setImportModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.primaryCyan} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.importData}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={handleExportData}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="download-outline" size={20} color={colors.accentGreen} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.exportData}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setSecurityModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.accentPurple} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.securityMenuLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Secção PREFERÊNCIAS (Mockup Screen 10) */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>
          {t.preferencesSection}
        </Text>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => setBudgetModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="pie-chart-outline" size={20} color={colors.primaryCyan} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.budgetSplitMenuLabel} ({budgetSplit.needsPercent}/{budgetSplit.wantsPercent}/{budgetSplit.savingsPercent})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={handleOpenProfileModal}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="calendar-outline" size={20} color={colors.primaryCyan} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.salaryCycleMenuLabel} ({t.salaryPayDayOn} {userProfile.salaryPayDay || 25} • {userProfile.salaryFrequency === 'monthly' ? t.monthly : userProfile.salaryFrequency === 'biweekly' ? t.biweekly : t.bimonthly})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={onNavigateFixedExpenses}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="list-outline" size={20} color={colors.accentAmber} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.fixedExpensesAndCategories}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={onNavigateAdvisor}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="sparkles-outline" size={20} color={colors.accentPurple} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.aiAdvisorMenuLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={onNavigateNotifications}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.accentRed} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.smsBanksMenuLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={onNavigatePriceComparison}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="pricetags-outline" size={20} color={colors.accentGreen} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.priceComparisonMenuLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={onNavigateAppearance}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primaryCyan} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {t.appearanceMenuLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenAiModal}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="sparkles-outline" size={20} color={colors.accentPurple} />
              <View>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                  {t.aiGeminiMenuLabel}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                  {t.aiGeminiSubLabel}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Botão Bloquear App */}
        {userProfile.pinCode && (
          <TouchableOpacity
            style={[styles.lockNowBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={lockApp}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed" size={16} color={colors.accentRed} style={{ marginRight: 6 }} />
            <Text style={[styles.lockNowText, { color: colors.accentRed }]}>
              {t.lockAppNow}
            </Text>
          </TouchableOpacity>
        )}

        {/* Botão Reset / Limpar Base de Dados (Zero Mockados) */}
        <TouchableOpacity
          style={[styles.resetDbBtn, { backgroundColor: 'rgba(225, 29, 72, 0.08)', borderColor: 'rgba(225, 29, 72, 0.3)' }]}
          onPress={() => {
            Alert.alert(
              t.resetDatabaseTitle,
              t.resetDatabaseDesc,
              [
                { text: t.cancel, style: 'cancel' },
                {
                  text: t.yesClearAll,
                  style: 'destructive',
                  onPress: async () => {
                    await useFinanceStore.getState().resetDatabaseToZero();
                    Alert.alert(t.confirm, t.dbResetSuccess);
                  },
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={colors.accentRed} style={{ marginRight: 6 }} />
          <Text style={[styles.resetDbText, { color: colors.accentRed }]}>
            {t.resetDatabaseBtn}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Editar Perfil */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t.editProfileModalTitle}</Text>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.fullNameLabel}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border }]}
              value={editName}
              onChangeText={setEditName}
            />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.emailAddress}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border }]}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
            />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.salaryMonthlyBase} ({currencySymbol})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border }]}
              value={editSalary}
              onChangeText={setEditSalary}
              keyboardType="numeric"
              placeholder={t.placeholderExpenseAmount}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.initialWalletBalance} ({currencySymbol})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border }]}
              value={editInitialBalance}
              onChangeText={setEditInitialBalance}
              keyboardType="numeric"
              placeholder={t.placeholderExpenseAmount}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.salaryDayHabitual}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border }]}
              value={editPayDay}
              onChangeText={setEditPayDay}
              keyboardType="number-pad"
              placeholder={t.placeholderExpenseDay}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.salaryFrequencyLabel}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {[
                { id: 'monthly', label: t.monthly },
                { id: 'biweekly', label: t.biweekly },
                { id: 'bimonthly', label: t.bimonthly },
              ].map((freq) => (
                <TouchableOpacity
                  key={freq.id}
                  style={[
                    styles.freqButton,
                    {
                      backgroundColor: editFrequency === freq.id ? colors.primaryCyanLight : colors.inputBg,
                      borderColor: editFrequency === freq.id ? colors.primaryCyan : colors.border,
                    },
                  ]}
                  onPress={() => setEditFrequency(freq.id as any)}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: editFrequency === freq.id ? '800' : '600',
                      color: editFrequency === freq.id ? colors.primaryCyan : colors.textSecondary,
                    }}
                  >
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Conta Salário (Janela 25 a 5)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {['Millennium BIM', 'M-Pesa', 'e-Mola', 'Access Bank'].map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={[
                    styles.freqButton,
                    {
                      backgroundColor: editSalaryAccount === bank ? colors.primaryCyanLight : colors.inputBg,
                      borderColor: editSalaryAccount === bank ? colors.primaryCyan : colors.border,
                    },
                  ]}
                  onPress={() => setEditSalaryAccount(bank)}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: editSalaryAccount === bank ? '800' : '600',
                      color: editSalaryAccount === bank ? colors.primaryCyan : colors.textSecondary,
                    }}
                  >
                    {bank}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Automation Status */}
            <View
              style={{
                backgroundColor: (userProfile.salaryConfirmedMonthsCount || 0) >= 2 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: (userProfile.salaryConfirmedMonthsCount || 0) >= 2 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: (userProfile.salaryConfirmedMonthsCount || 0) >= 2 ? '#059669' : '#2563EB',
                }}
              >
                {(userProfile.salaryConfirmedMonthsCount || 0) >= 2
                  ? '⚡ Atualização Automática Ativa (Após 2 confirmações concluídas)'
                  : `📋 Modo Confirmação: ${userProfile.salaryConfirmedMonthsCount || 0}/2 meses confirmados`}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setProfileModalVisible(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.primaryCyan }]} onPress={handleSaveProfile}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Orçamento 50/30/20 */}
      <Modal visible={budgetModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t.budgetSplitModalTitle}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{t.budgetSplitModalSubtitle}</Text>
            
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.primaryCyan }]}>{t.needsPercentLabel}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border, textAlign: 'center' }]}
                  keyboardType="number-pad"
                  value={editNeeds}
                  onChangeText={setEditNeeds}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.accentPurple }]}>{t.wantsPercentLabel}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border, textAlign: 'center' }]}
                  keyboardType="number-pad"
                  value={editWants}
                  onChangeText={setEditWants}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.accentGreen }]}>{t.savingsPercentLabel}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border, textAlign: 'center' }]}
                  keyboardType="number-pad"
                  value={editSavings}
                  onChangeText={setEditSavings}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setBudgetModalVisible(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.primaryCyan }]} onPress={handleSaveBudget}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{t.apply}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Segurança PIN */}
      <Modal visible={securityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t.appSecurityTitle}</Text>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.pin4DigitsLabel}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.primaryCyan, borderColor: colors.border, textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
              placeholder={t.pinPlaceholder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setSecurityModalVisible(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.primaryCyan }]} onPress={handleSaveSecurity}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{t.savePinBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Inteligência Artificial Gemini Direta */}
      <Modal visible={aiModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="sparkles" size={22} color={colors.accentPurple} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                {t.aiDirectModalTitle}
              </Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {t.aiDirectModalSubtitle}
            </Text>

            <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: 12, borderRadius: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="hardware-chip-outline" size={14} color={colors.accentPurple} />
                <Text style={{ color: colors.accentPurple, fontSize: 12, fontWeight: '700' }}>
                  {t.activeModels}
                </Text>
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 11, marginTop: 3 }}>
                {t.activeModelsDesc}
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.googleGeminiKeyLabel}</Text>
            <View style={{ position: 'relative', marginBottom: 14 }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    fontSize: 12,
                    paddingRight: 40,
                    marginBottom: 0,
                  },
                ]}
                value={geminiKey}
                onChangeText={setGeminiKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showGeminiKey}
                placeholder={t.placeholderAiKey}
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 12, top: 12 }}
                onPress={() => setShowGeminiKey(!showGeminiKey)}
              >
                <Ionicons
                  name={showGeminiKey ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <TouchableOpacity
                style={[
                  styles.modalCancel,
                  {
                    flex: 1.2,
                    borderColor: colors.primaryCyan,
                    backgroundColor: colors.primaryCyanLight,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  },
                ]}
                onPress={handleTestGeminiConnection}
                disabled={isTestingGemini}
                activeOpacity={0.7}
              >
                {!isTestingGemini && (
                  <Ionicons name="flash-outline" size={14} color={colors.primaryCyan} />
                )}
                <Text style={{ color: colors.primaryCyan, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>
                  {isTestingGemini ? t.testingConnectionBtn : t.testConnectionBtn}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalCancel,
                  { flex: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                ]}
                onPress={handleResetGeminiKey}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, textAlign: 'center' }}>
                  {t.restoreDefaultBtn}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => setAiModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{t.close}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: colors.accentPurple }]}
                onPress={handleSaveGeminiKey}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{t.saveKeyBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Importar Dados */}
      <Modal visible={importModalVisible} animationType="fade" transparent onRequestClose={() => setImportModalVisible(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={() => importStep !== 'loading' && setImportModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border, width: '100%' },
            ]}
          >
            {/* Ícone de topo */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primaryCyanLight,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name={importStep === 'done' ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={28}
                  color={importStep === 'done' ? colors.accentGreen : colors.primaryCyan}
                />
              </View>
            </View>

            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
              {importStep === 'done' ? t.importCompleteTitle : t.importDatabaseTitle}
            </Text>

            {importStep === 'select' && (
              <>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                  {t.importDatabaseSubtitle}
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    paddingVertical: 14,
                    borderRadius: 18,
                    backgroundColor: colors.primaryCyan,
                    marginTop: 8,
                  }}
                  onPress={handlePickFileAndImport}
                  activeOpacity={0.85}
                >
                  <Ionicons name="document-outline" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                    {t.selectFileBtn}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                    marginTop: 6,
                  }}
                  onPress={() => setImportModalVisible(false)}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {importStep === 'loading' && (
              <>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                  {t.restoringDatabaseMsg}
                </Text>
                {/* Barra de Progresso */}
                <View
                  style={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.statTrackBg,
                    overflow: 'hidden',
                    marginTop: 12,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${importProgress}%`,
                      backgroundColor: colors.primaryCyan,
                      borderRadius: 5,
                    }}
                  />
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                  {importProgress}%
                </Text>
              </>
            )}

            {importStep === 'done' && (
              <>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                  {importStatusMsg || t.importSuccess} {t.redirectToSecurityPinMsg}
                </Text>
                <TouchableOpacity
                  style={{
                    paddingVertical: 14,
                    borderRadius: 18,
                    backgroundColor: colors.accentGreen,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                  onPress={() => {
                    setImportModalVisible(false);
                    setImportStep('select');
                    lockApp();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                    {t.continueToPinBtn}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 160,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  menuCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  lockNowBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 24,
  },
  lockNowText: {
    fontSize: 13,
    fontWeight: '800',
  },
  resetDbBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 20,
  },
  resetDbText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalSave: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  freqButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
