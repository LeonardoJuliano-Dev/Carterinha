import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';

interface AppearanceScreenProps {
  onBack?: () => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
];

const CURRENCY_OPTIONS = [
  { code: 'MZN', label: 'Metical (MT)', symbol: 'MT', flag: '🇲🇿' },
  { code: 'USD', label: 'Dólar ($)', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€', flag: '🇪🇺' },
  { code: 'BRL', label: 'Real (R$)', symbol: 'R$', flag: '🇧🇷' },
];

interface ExchangeRateCache {
  rates: Record<string, number>;
  updatedAt: string;
}

const EXCHANGE_CACHE_KEY = 'carterinha-exchange-rates';

export const AppearanceScreen: React.FC<AppearanceScreenProps> = ({ onBack }) => {
  const { theme, setTheme, userProfile, setPrimaryColor, updateProfile, changeCurrencyWithExchange } = useFinanceStore();
  const { t } = useTranslation();
  const colors = getTheme(theme, userProfile.primaryColor);

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [exchangeUpdatedAt, setExchangeUpdatedAt] = useState<string>('');
  const [loadingRates, setLoadingRates] = useState(false);

  const colorPalettes = [
    { hex: '#0284C7', label: 'Azul Ciano' },
    { hex: '#9333EA', label: 'Roxo Galaxy' },
    { hex: '#059669', label: 'Verde Esmeralda' },
    { hex: '#EA580C', label: 'Laranja Solar' },
    { hex: '#E11D48', label: 'Rosa Coral' },
  ];

  // Buscar taxas de câmbio
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    // Tentar cache local primeiro
    try {
      const cached = await AsyncStorage.getItem(EXCHANGE_CACHE_KEY);
      if (cached) {
        const parsed: ExchangeRateCache = JSON.parse(cached);
        setExchangeRates(parsed.rates);
        setExchangeUpdatedAt(parsed.updatedAt);

        // Se o cache é de hoje, não buscar novamente
        const cacheDate = parsed.updatedAt.split('/').reverse().join('-');
        const today = new Date().toISOString().slice(0, 10);
        if (cacheDate === today) return;
      }
    } catch {}

    // Buscar da API
    setLoadingRates(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('https://open.er-api.com/v6/latest/MZN', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          const rates: Record<string, number> = {
            MZN: 1,
            USD: data.rates.USD || 0,
            EUR: data.rates.EUR || 0,
            BRL: data.rates.BRL || 0,
          };
          const now = new Date();
          const updatedStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
          setExchangeRates(rates);
          setExchangeUpdatedAt(updatedStr);

          // Guardar no cache
          await AsyncStorage.setItem(
            EXCHANGE_CACHE_KEY,
            JSON.stringify({ rates, updatedAt: updatedStr })
          );
        }
      }
    } catch (err) {
      console.warn('[Appearance] Falha ao obter câmbio:', err);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleSelectLanguage = async (lang: string) => {
    await updateProfile({ language: lang });
    setLanguageModalVisible(false);
  };

  const handleSelectCurrency = async (curr: string) => {
    setCurrencyModalVisible(false);
    if (curr === userProfile.currency) return;

    Alert.alert(
      t.confirmExchangeTitle,
      `${t.confirmExchangeMsg}\n\n${userProfile.currency} ➔ ${curr}`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirm,
          onPress: async () => {
            const res = await changeCurrencyWithExchange(curr);
            if (res.success && res.fromCode !== res.toCode) {
              Alert.alert(
                t.currencyConvertedTitle,
                `${t.currencyConvertedMsg}\n\n1 ${res.fromCode} = ${res.ratio.toFixed(4)} ${res.toCode}`
              );
            }
          },
        },
      ]
    );
  };

  const getExchangeDisplay = (): string | null => {
    if (!exchangeRates) return null;
    const lines: string[] = [];
    if (exchangeRates.USD) {
      const usdPerMzn = exchangeRates.USD;
      const mznPerUsd = usdPerMzn > 0 ? (1 / usdPerMzn) : 0;
      lines.push(`1 USD = ${mznPerUsd.toFixed(2)} MZN`);
    }
    if (exchangeRates.EUR) {
      const eurPerMzn = exchangeRates.EUR;
      const mznPerEur = eurPerMzn > 0 ? (1 / eurPerMzn) : 0;
      lines.push(`1 EUR = ${mznPerEur.toFixed(2)} MZN`);
    }
    if (exchangeRates.BRL) {
      const brlPerMzn = exchangeRates.BRL;
      const mznPerBrl = brlPerMzn > 0 ? (1 / brlPerMzn) : 0;
      lines.push(`1 BRL = ${mznPerBrl.toFixed(2)} MZN`);
    }
    return lines.join('  •  ');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar One UI */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>{t.appearanceTitle}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Seletor de Tema Claro vs Escuro */}
        <View style={styles.themeRow}>
          {/* Card Claro */}
          <TouchableOpacity
            style={[
              styles.themeOptionCard,
              {
                backgroundColor: '#FFFFFF',
                borderColor: theme === 'light' ? colors.primaryCyan : colors.border,
                borderWidth: theme === 'light' ? 2 : 1,
              },
            ]}
            onPress={() => setTheme('light')}
            activeOpacity={0.8}
          >
            <View style={styles.themeMockupLight}>
              <View style={[styles.mockupBarLight, { backgroundColor: colors.primaryCyan }]} />
              <View style={styles.mockupCardLight} />
              <View style={styles.mockupCardLight} />
            </View>
            <Text style={[styles.themeLabel, { color: '#0F172A' }]}>{t.lightTheme}</Text>
            {theme === 'light' && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primaryCyan }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Card Escuro */}
          <TouchableOpacity
            style={[
              styles.themeOptionCard,
              {
                backgroundColor: '#151E32',
                borderColor: theme === 'dark' ? colors.primaryCyan : colors.border,
                borderWidth: theme === 'dark' ? 2 : 1,
              },
            ]}
            onPress={() => setTheme('dark')}
            activeOpacity={0.8}
          >
            <View style={styles.themeMockupDark}>
              <View style={[styles.mockupBarDark, { backgroundColor: colors.primaryCyan }]} />
              <View style={styles.mockupCardDark} />
              <View style={styles.mockupCardDark} />
            </View>
            <Text style={[styles.themeLabel, { color: '#F8FAFC' }]}>{t.darkTheme}</Text>
            {theme === 'dark' && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primaryCyan }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Cor Principal */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>
          {t.primaryColorSelection}
        </Text>
        <View
          style={[
            styles.colorsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.paletteRow}>
            {colorPalettes.map((c) => {
              const isSelected = (userProfile.primaryColor || '#0284C7').toLowerCase() === c.hex.toLowerCase();
              return (
                <TouchableOpacity
                  key={c.hex}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.hex },
                    isSelected && [styles.colorCircleSelected, { borderColor: colors.textPrimary }],
                  ]}
                  onPress={() => setPrimaryColor(c.hex)}
                  activeOpacity={0.7}
                >
                  {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Idioma e Moeda */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>
          {t.appearanceAndLang}
        </Text>
        <View
          style={[
            styles.optionsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.optionRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => setLanguageModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{t.languageSelection}</Text>
            <View style={styles.optionRight}>
              <Text style={[styles.optionValue, { color: colors.primaryCyan, fontWeight: '700' }]}>
                {userProfile.language || 'Português'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setCurrencyModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{t.currencySelection}</Text>
            <View style={styles.optionRight}>
              <Text style={[styles.optionValue, { color: colors.primaryCyan, fontWeight: '700' }]}>
                {userProfile.currency || 'Metical (MT)'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Indicador de Câmbio Real */}
        {(exchangeRates || loadingRates) && (
          <View
            style={[
              styles.exchangeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.exchangeHeader}>
              <Ionicons name="trending-up" size={16} color={colors.primaryCyan} />
              <Text style={[styles.exchangeTitle, { color: colors.textPrimary }]}>
                {t.realTimeExchange}
              </Text>
            </View>
            {loadingRates ? (
              <ActivityIndicator size="small" color={colors.primaryCyan} style={{ marginTop: 6 }} />
            ) : (
              <>
                <Text style={[styles.exchangeRates, { color: colors.textSecondary }]}>
                  {getExchangeDisplay()}
                </Text>
                {exchangeUpdatedAt ? (
                  <Text style={[styles.exchangeDate, { color: colors.textMuted }]}>
                    Atualizado: {exchangeUpdatedAt}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Escolher Idioma */}
      <Modal visible={languageModalVisible} animationType="fade" transparent onRequestClose={() => setLanguageModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={[styles.pickerModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.pickerModalTitle, { color: colors.textPrimary }]}>{t.selectLanguageTitle}</Text>
            {LANGUAGE_OPTIONS.map((item) => {
              const isSelected = userProfile.language === item.label;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.borderSubtle },
                    isSelected && { backgroundColor: colors.primaryCyanLight },
                  ]}
                  onPress={() => handleSelectLanguage(item.label)}
                >
                  <Text style={[styles.pickerOptionText, { color: isSelected ? colors.primaryCyan : colors.textPrimary, fontWeight: isSelected ? '800' : '600' }]}>
                    {item.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primaryCyan} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Escolher Moeda */}
      <Modal visible={currencyModalVisible} animationType="fade" transparent onRequestClose={() => setCurrencyModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <View style={[styles.pickerModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.pickerModalTitle, { color: colors.textPrimary }]}>{t.selectCurrencyTitle}</Text>
            {CURRENCY_OPTIONS.map((item) => {
              const isSelected = userProfile.currency === item.label;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.borderSubtle },
                    isSelected && { backgroundColor: colors.primaryCyanLight },
                  ]}
                  onPress={() => handleSelectCurrency(item.label)}
                >
                  <View style={styles.currencyOptionLeft}>
                    <Text style={styles.currencyFlag}>{item.flag}</Text>
                    <Text style={[styles.pickerOptionText, { color: isSelected ? colors.primaryCyan : colors.textPrimary, fontWeight: isSelected ? '800' : '600' }]}>
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
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 160,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 14,
  },
  themeOptionCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  themeMockupLight: {
    width: '100%',
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  mockupBarLight: {
    width: '50%',
    height: 10,
    borderRadius: 5,
  },
  mockupCardLight: {
    width: '100%',
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  themeMockupDark: {
    width: '100%',
    height: 90,
    backgroundColor: '#0B1120',
    borderRadius: 16,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  mockupBarDark: {
    width: '50%',
    height: 10,
    borderRadius: 5,
  },
  mockupCardDark: {
    width: '100%',
    height: 22,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  colorsCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  optionsCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionValue: {
    fontSize: 13,
  },
  exchangeCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginTop: 14,
  },
  exchangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  exchangeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  exchangeRates: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 20,
  },
  exchangeDate: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerModalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 15,
  },
  currencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyFlag: {
    fontSize: 20,
  },
});
