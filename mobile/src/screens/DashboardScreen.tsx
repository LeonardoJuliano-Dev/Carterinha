import React, { useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '../stores/financeStore';
import { lightTheme, darkTheme, getTheme } from '../theme/colors';
import { SalaryModal } from '../components/SalaryModal';
import { SalaryConfirmationModal } from '../components/SalaryConfirmationModal';
import { MonthSelectorModal } from '../components/MonthSelectorModal';
import { formatMonthDisplay } from '../utils/dateUtils';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';

interface DashboardScreenProps {
  onNavigateTransactions?: () => void;
  onNavigateGoals?: () => void;
  onNavigateFixedExpenses?: () => void;
  onActionClick?: (actionType?: string, actionPayload?: string) => void;
  onNavigateAdvisorWithPrompt?: (prompt: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateTransactions,
  onNavigateGoals,
  onNavigateFixedExpenses,
  onActionClick,
  onNavigateAdvisorWithPrompt,
}) => {
  const {
    budgets,
    allocation,
    transactions,
    fixedExpenses,
    notifications,
    registerSalary,
    selectMonthYear,
    currentMonthYear,
    budgetSplit,
    theme,
    toggleTheme,
    userProfile,
    isOnline,
    isBackendReachable,
    refreshData,
  } = useFinanceStore();

  const { t, language } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  const currentMonthDisplay = formatMonthDisplay(currentMonthYear, language);

  const totalIncome = allocation?.total_income || 0;
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const baseFunds = totalIncome > 0 ? totalIncome : (userProfile.initialBalance || 0);
  const availableBalance = Math.max(0, baseFunds - totalSpent);

  const committedFixedTotal = fixedExpenses
    .filter((f) => f.is_active)
    .reduce((sum, f) => sum + f.amount, 0);
  const projectedFreeBalance = Math.max(0, availableBalance - committedFixedTotal);

  // Alerta inteligente ativo (Meta a chegar ao fim, meta parada ou despesa a vencer)
  const activeAlert = useMemo(() => {
    return notifications.find((n) => !n.isRead && n.actionType && n.actionType !== 'none') ||
      notifications.find((n) => n.actionType && n.actionType !== 'none');
  }, [notifications]);

  // Obter valores de cada orçamento respeitando a regra personalizada (ex: 40/30/30)
  const essentialBudget = budgets.find((b) => b.category === 'essential') || {
    allocated_amount: (totalIncome * (budgetSplit.needsPercent / 100)),
    spent_amount: 0,
  };
  const lifestyleBudget = budgets.find((b) => b.category === 'lifestyle') || {
    allocated_amount: (totalIncome * (budgetSplit.wantsPercent / 100)),
    spent_amount: 0,
  };
  const savingsBudget = budgets.find((b) => b.category === 'savings_goals') || {
    allocated_amount: (totalIncome * (budgetSplit.savingsPercent / 100)),
    spent_amount: 0,
  };

  const calculatePct = (spent: number, alloc: number) => {
    if (alloc <= 0) return '0%';
    return `${Math.min(100, Math.round((spent / alloc) * 100))}%`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header One UI 8.5 (Dinâmico com Seletor de Meses em Cristal) */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandTitleRow}>
            <Image
              source={require('../../assets/splash-icon.png')}
              style={styles.brandLogoIcon}
              resizeMode="contain"
            />
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Carterinha</Text>
          </View>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            {t.monthlyOverview}
          </Text>
          <TouchableOpacity
            style={[
              styles.monthSelector,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
              },
            ]}
            onPress={() => setMonthModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.monthSelectorText, { color: colors.primaryCyan }]}>
              {currentMonthDisplay}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.primaryCyan} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.themeBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              shadowColor: colors.crystalGlow,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={theme === 'light' ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={theme === 'light' ? '#D97706' : colors.primaryCyan}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryCyan}
            colors={[colors.primaryCyan]}
          />
        }
      >
        {/* Banner Offline / Backend Indisponível */}
        {(!isOnline || !isBackendReachable) && (
          <View style={[styles.offlineBanner, {
            backgroundColor: !isOnline ? 'rgba(225, 29, 72, 0.12)' : 'rgba(217, 119, 6, 0.12)',
            borderColor: !isOnline ? 'rgba(225, 29, 72, 0.3)' : 'rgba(217, 119, 6, 0.3)',
          }]}>
            <Ionicons
              name={!isOnline ? 'cloud-offline-outline' : 'warning-outline'}
              size={16}
              color={!isOnline ? '#E11D48' : '#D97706'}
            />
            <Text style={[styles.offlineBannerText, {
              color: !isOnline ? '#E11D48' : '#D97706',
            }]}>
              {!isOnline ? t.offlineMode : t.aiOfflineLocalData}
            </Text>
          </View>
        )}

        {/* Banner Proativo de Novo Mês / Atualização de Salário */}
        {totalIncome === 0 && (
          <View
            style={[
              styles.newMonthCard,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.primaryCyan,
                shadowColor: colors.primaryCyan,
              },
            ]}
          >
            <View style={styles.newMonthHeaderRow}>
              <View style={[styles.newMonthIconBox, { backgroundColor: colors.primaryCyanLight }]}>
                <Ionicons name="calendar" size={20} color={colors.primaryCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.newMonthTitle, { color: colors.textPrimary }]}>
                  {t.newMonthCycle}: {currentMonthDisplay}
                </Text>
                <Text style={[styles.newMonthSub, { color: colors.textSecondary }]}>
                  {t.setSalaryForMonth} (dia habitual: {userProfile.salaryPayDay || 25}).
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.newMonthBtn, { backgroundColor: colors.primaryCyan }]}
              onPress={() => setSalaryModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.newMonthBtnText}>{t.setSalaryBtn} - {currentMonthDisplay}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Smart Alert Banner (Metas próximas, contas a 3 dias, etc.) */}
        {activeAlert && (
          <TouchableOpacity
            style={[
              styles.smartAlertCard,
              {
                backgroundColor:
                  activeAlert.actionType === 'navigate_advisor'
                    ? 'rgba(147, 51, 234, 0.10)'
                    : activeAlert.actionType === 'navigate_goals'
                    ? 'rgba(2, 132, 199, 0.10)'
                    : 'rgba(245, 158, 11, 0.10)',
                borderColor:
                  activeAlert.actionType === 'navigate_advisor'
                    ? 'rgba(147, 51, 234, 0.35)'
                    : activeAlert.actionType === 'navigate_goals'
                    ? 'rgba(2, 132, 199, 0.35)'
                    : 'rgba(245, 158, 11, 0.35)',
              },
            ]}
            onPress={() => onActionClick?.(activeAlert.actionType, activeAlert.actionPayload)}
            activeOpacity={0.8}
          >
            <View style={styles.smartAlertRow}>
              <View
                style={[
                  styles.smartAlertIconBox,
                  {
                    backgroundColor:
                      activeAlert.actionType === 'navigate_advisor'
                        ? 'rgba(147, 51, 234, 0.20)'
                        : activeAlert.actionType === 'navigate_goals'
                        ? 'rgba(2, 132, 199, 0.20)'
                        : 'rgba(245, 158, 11, 0.20)',
                  },
                ]}
              >
                <Ionicons
                  name={
                    activeAlert.actionType === 'navigate_advisor'
                      ? 'sparkles'
                      : activeAlert.actionType === 'navigate_goals'
                      ? 'flag'
                      : 'alarm-outline'
                  }
                  size={18}
                  color={
                    activeAlert.actionType === 'navigate_advisor'
                      ? colors.accentPurple
                      : activeAlert.actionType === 'navigate_goals'
                      ? colors.primaryCyan
                      : '#D97706'
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.smartAlertTitle,
                    {
                      color:
                        activeAlert.actionType === 'navigate_advisor'
                          ? colors.accentPurple
                          : activeAlert.actionType === 'navigate_goals'
                          ? colors.primaryCyan
                          : '#D97706',
                    },
                  ]}
                >
                  {activeAlert.title}
                </Text>
                <Text style={[styles.smartAlertDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {activeAlert.message}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={
                  activeAlert.actionType === 'navigate_advisor'
                    ? colors.accentPurple
                    : activeAlert.actionType === 'navigate_goals'
                    ? colors.primaryCyan
                    : '#D97706'
                }
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Cartão Azul Hero One UI com Gradiente de Cristal e Valores Reais */}
        <View
          style={[
            styles.heroCardShadowWrapper,
            { shadowColor: userProfile.primaryColor || colors.primaryCyan },
          ]}
        >
          <LinearGradient
            colors={colors.gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Linha de reflexo especular de cristal no topo */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.40)', 'rgba(255, 255, 255, 0.0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.heroSheen}
              pointerEvents="none"
            />

            <View style={styles.heroTopRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.heroBadgeRow}>
                  <Text style={styles.heroLabel}>{t.availableBalance}</Text>
                  <View style={styles.heroSparkleBadge}>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.heroAmount}>
                  {formatCurrency(availableBalance, currencySymbol)}
                </Text>
                <Text style={styles.heroSub}>
                  {t.ofTotalFunds} {formatCurrency(baseFunds, currencySymbol)}
                </Text>
              </View>
              <View style={styles.heroWalletIcon}>
                <Ionicons name="wallet-outline" size={30} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroBottomRow}>
              <Text style={styles.heroCompareText}>
                {totalSpent > 0
                  ? `${t.totalSpentThisMonth}: ${formatCurrency(totalSpent, currencySymbol)}`
                  : t.noTransactionsYet}
              </Text>
              {committedFixedTotal > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="pin" size={14} color="#FDE047" style={{ marginRight: 6 }} />
                  <Text style={[styles.heroCompareText, { opacity: 0.92 }]}>
                    {t.activeFixedExpenses}: {formatCurrency(committedFixedTotal, currencySymbol)} • {t.estimatedFreeBalance}: {formatCurrency(projectedFreeBalance, currencySymbol)}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Secção Orçamento Real */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t.monthlyAllocation503020}
          </Text>
          <TouchableOpacity onPress={() => setSalaryModalVisible(true)}>
            <Text style={[styles.editLink, { color: colors.primaryCyan }]}>{t.setSalaryBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* 3 Cartões Circulares 50 / 30 / 20 em Cristal */}
        <View style={styles.budgetGaugesRow}>
          {/* 50% Fixas */}
          <TouchableOpacity
            style={[
              styles.gaugeCard,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                shadowColor: colors.primaryCyan,
              },
            ]}
            onPress={onNavigateFixedExpenses}
            activeOpacity={0.8}
          >
            <View style={[styles.gaugeCircle, { borderColor: colors.primaryCyan, shadowColor: colors.primaryCyan }]}>
              <Text style={[styles.gaugePercent, { color: colors.primaryCyan }]}>
                {calculatePct(essentialBudget.spent_amount, essentialBudget.allocated_amount)}
              </Text>
            </View>
            <Text style={[styles.gaugeCategory, { color: colors.textPrimary }]}>{t.essentialNeeds}</Text>
            <Text style={[styles.gaugeSpent, { color: colors.textSecondary }]}>
              {formatCurrency(essentialBudget.spent_amount, currencySymbol)}
            </Text>
            <Text style={[styles.gaugeTotal, { color: colors.textMuted }]}>
              {t.ofTotalFunds} {formatCurrency(essentialBudget.allocated_amount, currencySymbol)}
            </Text>
          </TouchableOpacity>

          {/* 30% Estilo de Vida */}
          <TouchableOpacity
            style={[
              styles.gaugeCard,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                shadowColor: colors.accentPurple,
              },
            ]}
            onPress={onNavigateTransactions}
            activeOpacity={0.8}
          >
            <View style={[styles.gaugeCircle, { borderColor: '#06B6D4', shadowColor: '#06B6D4' }]}>
              <Text style={[styles.gaugePercent, { color: '#06B6D4' }]}>
                {calculatePct(lifestyleBudget.spent_amount, lifestyleBudget.allocated_amount)}
              </Text>
            </View>
            <Text style={[styles.gaugeCategory, { color: colors.textPrimary }]}>{t.lifestyleWants}</Text>
            <Text style={[styles.gaugeSpent, { color: colors.textSecondary }]}>
              {formatCurrency(lifestyleBudget.spent_amount, currencySymbol)}
            </Text>
            <Text style={[styles.gaugeTotal, { color: colors.textMuted }]}>
              {t.ofTotalFunds} {formatCurrency(lifestyleBudget.allocated_amount, currencySymbol)}
            </Text>
          </TouchableOpacity>

          {/* 20% Poupança */}
          <TouchableOpacity
            style={[
              styles.gaugeCard,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                shadowColor: colors.accentGreen,
              },
            ]}
            onPress={onNavigateGoals}
            activeOpacity={0.8}
          >
            <View style={[styles.gaugeCircle, { borderColor: colors.accentGreen, shadowColor: colors.accentGreen }]}>
              <Text style={[styles.gaugePercent, { color: colors.accentGreen }]}>
                {calculatePct(savingsBudget.spent_amount, savingsBudget.allocated_amount)}
              </Text>
            </View>
            <Text style={[styles.gaugeCategory, { color: colors.textPrimary }]}>{t.savingsGoals}</Text>
            <Text style={[styles.gaugeSpent, { color: colors.textSecondary }]}>
              {formatCurrency(savingsBudget.spent_amount, currencySymbol)}
            </Text>
            <Text style={[styles.gaugeTotal, { color: colors.textMuted }]}>
              {t.ofTotalFunds} {formatCurrency(savingsBudget.allocated_amount, currencySymbol)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Secção Resumo Rápido */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t.recentTransactions}
          </Text>
          <TouchableOpacity onPress={onNavigateTransactions}>
            <Text style={[styles.editLink, { color: colors.primaryCyan }]}>{t.seeAll} ({transactions.length})</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.summaryListCard,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          {/* Despesas do mês */}
          <TouchableOpacity
            style={[styles.summaryRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={onNavigateTransactions}
            activeOpacity={0.7}
          >
            <View style={styles.summaryLeft}>
              <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(225, 29, 72, 0.16)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}>
                <Ionicons name="arrow-down-outline" size={18} color={colors.accentRed} />
              </View>
              <Text style={[styles.summaryItemLabel, { color: colors.textPrimary }]}>
                {t.spent}
              </Text>
            </View>
            <Text style={[styles.summaryItemValue, { color: colors.textPrimary }]}>
              {formatCurrency(totalSpent, currencySymbol)}
            </Text>
          </TouchableOpacity>

          {/* Receitas do mês */}
          <TouchableOpacity
            style={styles.summaryRow}
            onPress={() => setSalaryModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.summaryLeft}>
              <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(5, 150, 105, 0.16)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <Ionicons name="arrow-up-outline" size={18} color={colors.accentGreen} />
              </View>
              <Text style={[styles.summaryItemLabel, { color: colors.textPrimary }]}>
                {t.allocated}
              </Text>
            </View>
            <Text style={[styles.summaryItemValue, { color: colors.textPrimary }]}>
              {formatCurrency(totalIncome, currencySymbol)}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SalaryModal
        visible={salaryModalVisible}
        onClose={() => setSalaryModalVisible(false)}
        monthName={currentMonthDisplay}
        onSubmit={async (sal) => {
          await registerSalary(sal);
        }}
      />

      <SalaryConfirmationModal />

      <MonthSelectorModal
        visible={monthModalVisible}
        selectedMonthYear={currentMonthYear}
        onSelectMonth={async (my) => {
          await selectMonthYear(my);
        }}
        onClose={() => setMonthModalVisible(false)}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  monthSelectorText: {
    fontSize: 12,
    fontWeight: '800',
  },
  themeBtn: {
    width: 42,
    height: 42,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 160,
  },
  heroCardShadowWrapper: {
    borderRadius: 30,
    marginBottom: 20,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 30,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroSparkleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 10,
    padding: 3,
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  heroWalletIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  heroBottomRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
  },
  heroCompareText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  budgetGaugesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gaugeCard: {
    flex: 1,
    borderRadius: 24,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  gaugeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gaugePercent: {
    fontSize: 13,
    fontWeight: '900',
  },
  gaugeCategory: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  gaugeSpent: {
    fontSize: 11,
    fontWeight: '800',
  },
  gaugeTotal: {
    fontSize: 10,
    marginTop: 2,
  },
  summaryListCard: {
    borderRadius: 26,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryItemLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryItemValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  newMonthCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  newMonthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  newMonthIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newMonthTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  newMonthSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  newMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  newMonthBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  smartAlertCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  smartAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smartAlertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  smartAlertDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
