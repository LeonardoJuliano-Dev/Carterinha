import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { lightTheme, darkTheme } from '../theme/colors';
import { translations, getLanguageCode } from '../i18n/translations';
import { getCurrencySymbol } from '../utils/formatters';

const LANGUAGE_OPTIONS = [
  { code: 'pt', label: 'Português', flag: '🇲🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const CURRENCY_OPTIONS = [
  { code: 'MZN', label: 'Metical (MT)', symbol: 'MT', flag: '🇲🇿' },
  { code: 'USD', label: 'Dólar ($)', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€', flag: '🇪🇺' },
  { code: 'BRL', label: 'Real (R$)', symbol: 'R$', flag: '🇧🇷' },
];

export const OnboardingScreen: React.FC = () => {
  const { theme, completeOnboarding } = useFinanceStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [step, setStep] = useState<number>(1);

  // Dados do formulário
  const [language, setLanguage] = useState('Português');
  const [currency, setCurrency] = useState('Metical (MT)');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [salary, setSalary] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [salaryPayDay, setSalaryPayDay] = useState('25');
  const [salaryFrequency, setSalaryFrequency] = useState<'monthly' | 'biweekly' | 'bimonthly'>('monthly');
  const [salaryAccountSource, setSalaryAccountSource] = useState('Millennium BIM');

  // Modais de Dropdown para seleção
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [currModalVisible, setCurrModalVisible] = useState(false);

  // Percentagens
  const [needsPercent, setNeedsPercent] = useState('50');
  const [wantsPercent, setWantsPercent] = useState('30');
  const [savingsPercent, setSavingsPercent] = useState('20');

  // Tradução reativa
  const t = translations[getLanguageCode(language)];
  const currencySymbol = getCurrencySymbol(currency);

  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.slice(0, 2).toUpperCase() || 'LJ';
  };

  const getLanguageFlag = (langStr: string) => {
    return langStr.toLowerCase().includes('en') ? '🇬🇧' : '🇲🇿';
  };

  const getCurrencyFlag = (currStr: string) => {
    const found = CURRENCY_OPTIONS.find((c) => c.label === currStr);
    return found ? found.flag : '🇲🇿';
  };

  const handleNext = async () => {
    if (step === 1) {
      // Preferências (idioma e moeda) - sempre válido
      setStep(2);
    } else if (step === 2) {
      if (!name.trim() || !email.trim()) {
        Alert.alert(t.errIncompleteTitle, t.errIncompleteDesc);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (pinCode && pinCode.length !== 4) {
        Alert.alert(t.errInvalidPinTitle, t.errInvalidPinDesc);
        return;
      }
      if (pinCode && pinCode !== confirmPin) {
        Alert.alert(t.errPinMismatchTitle, t.errPinMismatchDesc);
        return;
      }
      setStep(4);
    } else if (step === 4) {
      const numSal = parseFloat(salary.replace(',', '.'));
      if (isNaN(numSal) || numSal <= 0) {
        Alert.alert(t.errInvalidSalaryTitle, t.errInvalidSalaryDesc);
        return;
      }
      setStep(5);
    } else if (step === 5) {
      const nP = parseFloat(needsPercent) || 50;
      const wP = parseFloat(wantsPercent) || 30;
      const sP = parseFloat(savingsPercent) || 20;

      if (nP + wP + sP !== 100) {
        Alert.alert(t.errSumPercentTitle, t.errSumPercentDesc);
        return;
      }

      await completeOnboarding({
        name,
        email,
        pinCode: pinCode || undefined,
        biometricsEnabled,
        salary: parseFloat(salary.replace(',', '.')) || 0,
        initialBalance: parseFloat(initialBalance.replace(',', '.')) || 0,
        salaryPayDay: parseInt(salaryPayDay, 10) || 25,
        salaryFrequency,
        salaryAccountSource,
        split: { needsPercent: nP, wantsPercent: wP, savingsPercent: sP },
        language,
        currency,
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho do Onboarding One UI 8.5 */}
        <View style={styles.header}>
          <View style={[styles.stepBadge, { backgroundColor: colors.primaryCyanLight }]}>
            <Text style={[styles.stepBadgeText, { color: colors.primaryCyan }]}>
              {t.onboardingStep} {step} {t.stepOf} 5
            </Text>
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Carterinha</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            {t.onboardingBrandSubtitle}
          </Text>
        </View>

        {/* Indicador de Progresso */}
        <View style={[styles.progressTrack, { backgroundColor: colors.statTrackBg }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${(step / 5) * 100}%`,
                backgroundColor: colors.primaryCyan,
              },
            ]}
          />
        </View>

        {/* PASSO 1: Preferências de Idioma e Moeda em Dropdowns Elegantes */}
        {step === 1 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryCyanLight }]}>
                <Ionicons name="globe-outline" size={24} color={colors.primaryCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  {t.onboardingPreferences}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                  {t.onboardingPreferencesDesc}
                </Text>
              </View>
            </View>

            {/* Dropdown de Idioma */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t.languageSelection.toUpperCase()}
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownInput,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
              ]}
              onPress={() => setLangModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownValueRow}>
                <Text style={styles.dropdownFlag}>{getLanguageFlag(language)}</Text>
                <Text style={[styles.dropdownValueText, { color: colors.textPrimary }]}>{language}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.primaryCyan} />
            </TouchableOpacity>

            {/* Dropdown de Moeda Base */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              {t.currencySelection.toUpperCase()}
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownInput,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
              ]}
              onPress={() => setCurrModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownValueRow}>
                <Text style={styles.dropdownFlag}>{getCurrencyFlag(currency)}</Text>
                <Text style={[styles.dropdownValueText, { color: colors.textPrimary }]}>{currency}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.primaryCyan} />
            </TouchableOpacity>
          </View>
        )}

        {/* PASSO 2: Nome e E-mail */}
        {step === 2 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primaryCyan }]}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  {t.onboardingPersonal}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                  {t.onboardingPersonalDesc}
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.fullName}</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder={t.namePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.emailAddress}</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="leonardojulianoj@gmail.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        )}

        {/* PASSO 3: Segurança e PIN */}
        {step === 3 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primaryCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  {t.onboardingSecurity}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                  {t.onboardingSecurityDesc}
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t.create4DigitPin}
            </Text>
            <TextInput
              style={[
                styles.pinInput,
                { backgroundColor: colors.inputBg, color: colors.primaryCyan, borderColor: colors.border },
              ]}
              placeholder={t.pinPlaceholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={pinCode}
              onChangeText={setPinCode}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t.confirmPin}
            </Text>
            <TextInput
              style={[
                styles.pinInput,
                { backgroundColor: colors.inputBg, color: colors.primaryCyan, borderColor: colors.border },
              ]}
              placeholder={t.pinPlaceholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <View style={[styles.biometricRow, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.biometricTitle, { color: colors.textPrimary }]}>
                  {t.enableBiometrics}
                </Text>
                <Text style={[styles.biometricDesc, { color: colors.textSecondary }]}>
                  {t.biometricsDesc}
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: colors.border, true: colors.primaryCyan }}
              />
            </View>
          </View>
        )}

        {/* PASSO 4: Salário e Saldo Disponível */}
        {step === 4 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                <Ionicons name="wallet" size={24} color={colors.accentGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  {t.onboardingIncome}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                  {t.baseCalculationIn} {currency}
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t.monthlyNetSalary} ({currencySymbol})
            </Text>
            <TextInput
              style={[
                styles.amountInput,
                { backgroundColor: colors.inputBg, color: colors.primaryCyan, borderColor: colors.border },
              ]}
              placeholder={t.amountPlaceholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={salary}
              onChangeText={setSalary}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t.salaryDayHabitual}
            </Text>
            <TextInput
              style={[
                styles.amountInput,
                { backgroundColor: colors.inputBg, color: colors.primaryCyan, borderColor: colors.border },
              ]}
              placeholder="25"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={salaryPayDay}
              onChangeText={setSalaryPayDay}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Conta Salário (Deteção de 25 a 5)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {['Millennium BIM', 'M-Pesa', 'e-Mola', 'Access Bank'].map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={[
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      backgroundColor: salaryAccountSource === bank ? colors.primaryCyanLight : colors.inputBg,
                      borderColor: salaryAccountSource === bank ? colors.primaryCyan : colors.border,
                    },
                  ]}
                  onPress={() => setSalaryAccountSource(bank)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: salaryAccountSource === bank ? '800' : '600',
                      color: salaryAccountSource === bank ? colors.primaryCyan : colors.textSecondary,
                    }}
                  >
                    {bank}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t.initialBalanceOptional} ({currencySymbol})
            </Text>
            <TextInput
              style={[
                styles.amountInput,
                { backgroundColor: colors.inputBg, color: colors.accentGreen, borderColor: colors.border },
              ]}
              placeholder={t.amountPlaceholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={initialBalance}
              onChangeText={setInitialBalance}
            />
          </View>
        )}

        {/* PASSO 5: Divisão do Orçamento */}
        {step === 5 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(147, 51, 234, 0.12)' }]}>
                <Ionicons name="pie-chart" size={24} color={colors.accentPurple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  {t.onboardingBudget}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                  {t.onboardingBudgetDesc}
                </Text>
              </View>
            </View>

            <View style={styles.splitInputRow}>
              <View style={styles.splitBox}>
                <Text style={[styles.splitLabel, { color: colors.primaryCyan }]}>
                  {t.essentialNeeds.toUpperCase()}
                </Text>
                <TextInput
                  style={[
                    styles.splitInput,
                    { backgroundColor: colors.inputBg, color: colors.primaryCyan, borderColor: colors.border },
                  ]}
                  keyboardType="numeric"
                  value={needsPercent}
                  onChangeText={setNeedsPercent}
                />
                <Text style={[styles.splitHint, { color: colors.textMuted }]}>
                  {t.needsHint}
                </Text>
              </View>

              <View style={styles.splitBox}>
                <Text style={[styles.splitLabel, { color: '#06B6D4' }]}>
                  {t.lifestyleWants.toUpperCase()}
                </Text>
                <TextInput
                  style={[
                    styles.splitInput,
                    { backgroundColor: colors.inputBg, color: '#06B6D4', borderColor: colors.border },
                  ]}
                  keyboardType="numeric"
                  value={wantsPercent}
                  onChangeText={setWantsPercent}
                />
                <Text style={[styles.splitHint, { color: colors.textMuted }]}>
                  {t.wantsHint}
                </Text>
              </View>

              <View style={styles.splitBox}>
                <Text style={[styles.splitLabel, { color: colors.accentGreen }]}>
                  {t.savingsGoals.toUpperCase()}
                </Text>
                <TextInput
                  style={[
                    styles.splitInput,
                    { backgroundColor: colors.inputBg, color: colors.accentGreen, borderColor: colors.border },
                  ]}
                  keyboardType="numeric"
                  value={savingsPercent}
                  onChangeText={setSavingsPercent}
                />
                <Text style={[styles.splitHint, { color: colors.textMuted }]}>
                  {t.savingsHint}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Botões de Ação */}
        <View style={styles.actionsRow}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setStep(step - 1)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primaryCyan }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {step === 5 ? t.finishSetup : t.nextStep}
            </Text>
            <Ionicons
              name={step === 5 ? 'checkmark-circle' : 'arrow-forward'}
              size={18}
              color="#FFFFFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Dropdown de Idioma */}
      <Modal visible={langModalVisible} animationType="fade" transparent onRequestClose={() => setLangModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={[styles.dropdownModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]}>
              {t.selectLanguageDropdown}
            </Text>
            {LANGUAGE_OPTIONS.map((item) => {
              const isSelected = language === item.label;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.dropdownOptionRow,
                    { borderBottomColor: colors.borderSubtle },
                    isSelected && { backgroundColor: colors.primaryCyanLight },
                  ]}
                  onPress={() => {
                    setLanguage(item.label);
                    setLangModalVisible(false);
                  }}
                >
                  <View style={styles.dropdownOptionLeft}>
                    <Text style={styles.dropdownOptionFlag}>{item.flag}</Text>
                    <Text style={[styles.dropdownOptionText, { color: isSelected ? colors.primaryCyan : colors.textPrimary, fontWeight: isSelected ? '800' : '600' }]}>
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primaryCyan} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Dropdown de Moeda Base */}
      <Modal visible={currModalVisible} animationType="fade" transparent onRequestClose={() => setCurrModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCurrModalVisible(false)}
        >
          <View style={[styles.dropdownModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]}>
              {t.selectCurrencyDropdown}
            </Text>
            {CURRENCY_OPTIONS.map((item) => {
              const isSelected = currency === item.label;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.dropdownOptionRow,
                    { borderBottomColor: colors.borderSubtle },
                    isSelected && { backgroundColor: colors.primaryCyanLight },
                  ]}
                  onPress={() => {
                    setCurrency(item.label);
                    setCurrModalVisible(false);
                  }}
                >
                  <View style={styles.dropdownOptionLeft}>
                    <Text style={styles.dropdownOptionFlag}>{item.flag}</Text>
                    <Text style={[styles.dropdownOptionText, { color: isSelected ? colors.primaryCyan : colors.textPrimary, fontWeight: isSelected ? '800' : '600' }]}>
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primaryCyan} />}
                </TouchableOpacity>
              );
            })}
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
  scrollContainer: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  card: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  pinInput: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  amountInput: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '900',
    borderWidth: 1,
    marginBottom: 16,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  biometricTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  biometricDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  splitInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  splitBox: {
    flex: 1,
  },
  splitLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  splitInput: {
    borderRadius: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    borderWidth: 1,
  },
  splitHint: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  nextBtn: {
    flex: 1,
    height: 56,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownModalCard: {
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderBottomWidth: 1,
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownOptionFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  dropdownOptionText: {
    fontSize: 15,
  },
});
