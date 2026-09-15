import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { lightTheme, darkTheme, getTheme } from '../theme/colors';
import { GoalModal } from '../components/GoalModal';
import { CustomDepositModal } from '../components/CustomDepositModal';
import { GoalHistoryModal } from '../components/GoalHistoryModal';
import { DeleteGoalModal } from '../components/DeleteGoalModal';
import { getDeadlineStatus, formatDateShort } from '../utils/dateUtils';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';
import { Goal } from '../types';

interface GoalsScreenProps {
  onBack?: () => void;
  onNavigateAdvisor?: (goal: Goal) => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ onBack, onNavigateAdvisor }) => {
  const {
    goals,
    transactions,
    createGoal,
    depositToGoal,
    deleteGoal,
    getAvailableBalance,
    theme,
    refreshData,
    userProfile,
  } = useFinanceStore();
  const { t, language } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [customDepositVisible, setCustomDepositVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [activeGoalForHistory, setActiveGoalForHistory] = useState<Goal | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goals[0]?.id || null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { await refreshData(); } finally { setIsRefreshing(false); }
  }, [refreshData]);

  const getGoalColor = (index: number) => {
    const palette = [
      { color: colors.accentGreen, bg: 'rgba(5, 150, 105, 0.12)', icon: 'shield-checkmark-outline' },
      { color: colors.primaryCyan, bg: colors.primaryCyanLight, icon: 'home-outline' },
      { color: colors.accentPurple, bg: 'rgba(147, 51, 234, 0.12)', icon: 'umbrella-outline' },
      { color: colors.accentAmber, bg: 'rgba(217, 119, 6, 0.12)', icon: 'book-outline' },
    ];
    return palette[index % palette.length];
  };

  const activeSelectedGoal = goals.find((g) => g.id === selectedGoalId) || goals[0] || null;
  const isActiveGoalCompleted = activeSelectedGoal ? activeSelectedGoal.current_amount >= activeSelectedGoal.target_amount : false;

  const handleQuickDeposit = async (amount: number) => {
    const targetId = selectedGoalId || (goals.length > 0 ? goals[0].id : null);
    if (!targetId) {
      Alert.alert(t.noActiveGoals, t.quickDepositNoGoal);
      return;
    }

    const g = goals.find((item) => item.id === targetId);
    if (!g) return;

    if (g.current_amount >= g.target_amount) {
      Alert.alert(
        t.completedBadge,
        `"${g.name}" • ${t.goalCompletedBanner}`
      );
      return;
    }

    const remaining = g.target_amount - g.current_amount;
    if (amount > remaining) {
      Alert.alert(
        'Aviso',
        `${t.quickDepositExceeds} (${formatCurrency(remaining, currencySymbol)})`
      );
      return;
    }

    const available = getAvailableBalance();
    if (amount > available) {
      Alert.alert(
        'Saldo Insuficiente',
        `${t.depositErrorBalance} (${formatCurrency(available, currencySymbol)})`
      );
      return;
    }

    try {
      await depositToGoal(targetId, amount);
      Alert.alert(t.quickDepositSaved, `${t.quickDepositSuccessMsg} (+${formatCurrency(amount, currencySymbol)})`);
    } catch (err: any) {
      Alert.alert('Aviso de Depósito', err?.message || 'Não foi possível efetuar o depósito.');
    }
  };

  const handleOpenCustomDeposit = (goalId?: string | null) => {
    const targetId = goalId || selectedGoalId || (goals.length > 0 ? goals[0].id : null);
    if (!targetId) {
      Alert.alert(t.noActiveGoals, t.quickDepositNoGoal);
      return;
    }
    setSelectedGoalId(targetId);
    setCustomDepositVisible(true);
  };

  const handleOpenHistory = (goal: Goal) => {
    setSelectedGoalId(goal.id);
    setActiveGoalForHistory(goal);
    setHistoryModalVisible(true);
  };

  const handleRequestDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setDeleteModalVisible(true);
  };

  const handleConfirmDeleteGoal = async (goalId: string, reason: string) => {
    const g = goals.find((item) => item.id === goalId);
    await deleteGoal(goalId, reason);
    if (selectedGoalId === goalId) {
      const remaining = goals.filter((item) => item.id !== goalId);
      setSelectedGoalId(remaining[0]?.id || null);
    }
    Alert.alert(
      t.goalDeletedSuccess,
      `"${g?.name || ''}"\n\n${reason}`
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar One UI 8.5 (Mockup Screen 7) em Cristal */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao início"
            style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
          {t.goalsTitle}
        </Text>
        <TouchableOpacity
          onPress={() => setGoalModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Criar nova meta de vida"
          style={[styles.addBtn, { backgroundColor: colors.primaryCyan }]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
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
        {/* Secção 1: Metas Ativas */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t.activeGoals}
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            {goals.length}
          </Text>
        </View>

        {goals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flag-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t.noActiveGoals}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {t.noActiveGoalsSub}
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.primaryCyan }]}
              onPress={() => setGoalModalVisible(true)}
            >
              <Text style={styles.emptyAddText}>+ {t.newGoal}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Lista de Metas (Mockup Screen 7) */}
            <View style={styles.goalsList}>
              {goals.map((goal, index) => {
                const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
                const isSelected = selectedGoalId === goal.id;
                const deadlineInfo = getDeadlineStatus(goal.deadline, language);
                const isCompleted = goal.target_amount > 0 && goal.current_amount >= goal.target_amount;
                const styleInfo = getGoalColor(index);

                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalCard,
                      {
                        borderColor: isSelected ? styleInfo.color : colors.glassBorder,
                        borderTopColor: isSelected ? styleInfo.color : colors.glassBorderTop,
                        backgroundColor: colors.glassSurface,
                        shadowColor: isSelected ? styleInfo.color : colors.cardShadow,
                        shadowOpacity: isSelected ? 0.30 : 0.08,
                      },
                    ]}
                    onPress={() => setSelectedGoalId(goal.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.goalTopRow}>
                      <View style={[styles.iconBox, { backgroundColor: styleInfo.bg, borderColor: styleInfo.color, borderWidth: 1 }]}>
                        <Ionicons name={styleInfo.icon as any} size={22} color={styleInfo.color} />
                      </View>

                      <View style={styles.goalInfo}>
                        <Text style={[styles.goalName, { color: colors.textPrimary }]}>
                          {goal.name}
                        </Text>
                        <Text style={[styles.goalValues, { color: colors.textSecondary }]}>
                          {formatCurrency(goal.current_amount, currencySymbol)} /{' '}
                          {formatCurrency(goal.target_amount, currencySymbol)}
                        </Text>
                      </View>

                      <View style={styles.goalRightCol}>
                        <Text style={[styles.targetAmount, { color: colors.textPrimary }]}>
                          {formatCurrency(goal.target_amount, currencySymbol)}
                        </Text>
                        <Text style={[styles.pctText, { color: styleInfo.color }]}>
                          {pct.toFixed(0)}%
                        </Text>
                      </View>
                    </View>

                    {/* Barra de Progresso Colorida */}
                    <View style={[styles.progressTrack, { backgroundColor: colors.statTrackBg }]}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.max(4, pct)}%`,
                            backgroundColor: styleInfo.color,
                          },
                        ]}
                      />
                    </View>

                    {/* Rodapé do Card: Prazo e Botão de Histórico */}
                    <View style={styles.goalFooterRow}>
                      {deadlineInfo.hasDeadline ? (
                        <View
                          style={[
                            styles.deadlineBadge,
                            {
                              backgroundColor: isCompleted
                                ? 'rgba(16, 185, 129, 0.16)'
                                : deadlineInfo.isExpired
                                ? 'rgba(239, 68, 68, 0.16)'
                                : colors.primaryCyanLight,
                            },
                          ]}
                        >
                          {isCompleted && (
                            <Ionicons
                              name="ribbon-outline"
                              size={12}
                              color={colors.accentGreen}
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Text
                            style={[
                              styles.deadlineBadgeText,
                              {
                                color: isCompleted
                                  ? colors.accentGreen
                                  : deadlineInfo.isExpired
                                  ? colors.accentRed
                                  : colors.primaryCyan,
                              },
                            ]}
                          >
                            {isCompleted ? t.completedBadge : deadlineInfo.label}
                          </Text>
                        </View>
                      ) : (
                        <View />
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.deleteCardBtn,
                            {
                              backgroundColor: 'rgba(225, 29, 72, 0.1)',
                              borderColor: 'rgba(244, 63, 94, 0.25)',
                            },
                          ]}
                          onPress={() => handleRequestDeleteGoal(goal)}
                          accessibilityRole="button"
                          accessibilityLabel={`${t.delete} ${goal.name}`}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.accentRed} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.historyBtn}
                          onPress={() => handleOpenHistory(goal)}
                          accessibilityRole="button"
                          accessibilityLabel={`${t.viewHistoryBtn} ${goal.name}`}
                        >
                          <Text style={[styles.historyBtnText, { color: colors.primaryCyan }]}>{t.viewHistoryBtn}</Text>
                          <Ionicons name="chevron-forward" size={13} color={colors.primaryCyan} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Atalhos de Depósito Rápido ou Aviso de Conclusão */}
            {isActiveGoalCompleted ? (
              <View
                style={[
                  styles.completedNoticeBox,
                  {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    borderColor: colors.accentGreen,
                    borderTopColor: colors.glassBorderTop,
                  },
                ]}
              >
                <Ionicons name="ribbon-outline" size={20} color={colors.accentGreen} style={{ marginRight: 8 }} />
                <Text style={[styles.completedNoticeText, { color: colors.accentGreen }]}>
                  "{activeSelectedGoal?.name}" • {t.goalCompletedBanner}
                </Text>
              </View>
            ) : (
              <View style={styles.shortcutsRow}>
                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}
                  onPress={() => handleQuickDeposit(500)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Depositar 500 ${currencySymbol}`}
                >
                  <Text style={[styles.shortcutText, { color: colors.primaryCyan }]}>+ 500 {currencySymbol}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}
                  onPress={() => handleQuickDeposit(1000)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Depositar 1000 ${currencySymbol}`}
                >
                  <Text style={[styles.shortcutText, { color: colors.primaryCyan }]}>+ 1.000 {currencySymbol}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}
                  onPress={() => handleQuickDeposit(2000)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Depositar 2000 ${currencySymbol}`}
                >
                  <Text style={[styles.shortcutText, { color: colors.primaryCyan }]}>+ 2.000 {currencySymbol}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: colors.glassSurfaceElevated, borderColor: colors.primaryCyan }]}
                  onPress={() => handleOpenCustomDeposit(selectedGoalId)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Depositar outro valor com nota"
                >
                  <Ionicons name="create-outline" size={13} color={colors.primaryCyan} style={{ marginRight: 2 }} />
                  <Text style={[styles.shortcutText, { color: colors.primaryCyan }]}>{t.otherAmountBtn}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <GoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onSubmit={async (name, target, deadline) => {
          await createGoal(name, target, deadline);
        }}
      />

      <CustomDepositModal
        visible={customDepositVisible}
        goal={goals.find((g) => g.id === selectedGoalId) || goals[0] || null}
        onClose={() => setCustomDepositVisible(false)}
        onSubmit={async (goalId, amount, note) => {
          await depositToGoal(goalId, amount, note);
          const g = goals.find((item) => item.id === goalId);
          Alert.alert('Poupança Registada', `Adicionaste +${amount.toLocaleString('pt-PT')} MT à meta "${g?.name}".`);
        }}
      />

      <GoalHistoryModal
        visible={historyModalVisible}
        goal={activeGoalForHistory}
        transactions={transactions}
        onClose={() => {
          setHistoryModalVisible(false);
          setActiveGoalForHistory(null);
        }}
        onRequestDelete={(goal) => {
          setHistoryModalVisible(false);
          setActiveGoalForHistory(null);
          handleRequestDeleteGoal(goal);
        }}
        onConsultInChat={(goal) => {
          setHistoryModalVisible(false);
          if (onNavigateAdvisor) {
            onNavigateAdvisor(goal);
          }
        }}
      />

      <DeleteGoalModal
        visible={deleteModalVisible}
        goal={goalToDelete}
        onClose={() => {
          setDeleteModalVisible(false);
          setGoalToDelete(null);
        }}
        onConfirmDelete={handleConfirmDeleteGoal}
      />
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
    fontSize: 17,
    fontWeight: '800',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyAddBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyAddText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 160,
  },
  goalsList: {
    gap: 12,
    marginBottom: 20,
  },
  goalCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '800',
  },
  goalValues: {
    fontSize: 12,
    marginTop: 2,
  },
  goalRightCol: {
    alignItems: 'flex-end',
  },
  targetAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  shortcutBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '800',
  },
  completedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 6,
  },
  completedNoticeText: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  createGoalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  goalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deadlineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  historyBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteCardBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
