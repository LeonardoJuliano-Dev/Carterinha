import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Goal, Transaction } from '../types';
import { getTheme } from '../theme/colors';
import { useFinanceStore } from '../stores/financeStore';
import { getDeadlineStatus, formatDateShort } from '../utils/dateUtils';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';

interface GoalHistoryModalProps {
  visible: boolean;
  goal: Goal | null;
  transactions: Transaction[];
  onClose: () => void;
  onConsultInChat: (goal: Goal) => void;
  onRequestDelete?: (goal: Goal) => void;
}

export const GoalHistoryModal: React.FC<GoalHistoryModalProps> = ({
  visible,
  goal,
  transactions,
  onClose,
  onConsultInChat,
  onRequestDelete,
}) => {
  const { theme, userProfile } = useFinanceStore();
  const { t, language } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  if (!goal) return null;

  const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const isCompleted = goal.current_amount >= goal.target_amount;
  const deadlineInfo = getDeadlineStatus(goal.deadline, language);

  // Filtra transações vinculadas a esta meta
  const goalTransactions = transactions.filter(
    (t) =>
      t.goal_id === goal.id ||
      (t.description && t.description.toLowerCase().includes(goal.name.toLowerCase()))
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.glassSurfaceElevated,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryCyanLight }]}>
                <Ionicons name="flag" size={20} color={colors.primaryCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: colors.primaryCyan }]}>{t.goalHistoryTitle}</Text>
                <Text style={[styles.goalTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {goal.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Cartão de Progresso */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <View style={styles.badgeRow}>
                <Text style={[styles.cardSubText, { color: colors.textMuted }]}>{t.accumulatedProgress}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : colors.primaryCyanLight,
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : 'trending-up'}
                    size={13}
                    color={isCompleted ? colors.accentGreen : colors.primaryCyan}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isCompleted ? colors.accentGreen : colors.primaryCyan },
                    ]}
                  >
                    {isCompleted ? t.goalAchievedBadge : `${pct}% ${t.completedPercentSuffix}`}
                  </Text>
                </View>
              </View>

              <View style={[styles.progressBarTrack, { backgroundColor: colors.glassInputBg }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: isCompleted ? colors.accentGreen : colors.primaryCyan,
                      width: `${pct}%`,
                    },
                  ]}
                />
              </View>

              {/* Grid de Valores */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.totalTargetLabel}</Text>
                  <Text style={[styles.statVal, { color: colors.textPrimary }]}>
                    {formatCurrency(goal.target_amount, currencySymbol)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.totalSaved}</Text>
                  <Text style={[styles.statVal, { color: colors.accentGreen }]}>
                    {formatCurrency(goal.current_amount, currencySymbol)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.remainingLabel}</Text>
                  <Text style={[styles.statVal, { color: colors.accentAmber }]}>
                    {formatCurrency(remaining, currencySymbol)}
                  </Text>
                </View>
              </View>

              {/* Informações de Datas */}
              <View style={[styles.datesRow, { borderTopColor: colors.glassBorder }]}>
                <View style={styles.dateCol}>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>{t.createdAtLabel}</Text>
                  <Text style={[styles.dateVal, { color: colors.textPrimary }]}>{formatDateShort(goal.created_at, language)}</Text>
                </View>
                <View style={styles.dateCol}>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>{t.targetDeadlineLabel}</Text>
                  <Text style={[styles.dateVal, { color: colors.textPrimary }]}>
                    {goal.deadline ? formatDateShort(goal.deadline, language) : t.noDeadlineLabel}
                  </Text>
                  {deadlineInfo.hasDeadline && !isCompleted && (
                    <View
                      style={[
                        styles.deadlineBadge,
                        {
                          backgroundColor: deadlineInfo.isExpired
                            ? 'rgba(239, 68, 68, 0.12)'
                            : colors.primaryCyanLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.deadlineBadgeText,
                          { color: deadlineInfo.isExpired ? colors.accentRed : colors.primaryCyan },
                        ]}
                      >
                        {deadlineInfo.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Secção de Histórico de Movimentações */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {t.depositsCount} ({goalTransactions.length})
            </Text>

            {goalTransactions.length > 0 ? (
              goalTransactions.map((tx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.txItemRow,
                    {
                      backgroundColor: colors.glassSurface,
                      borderColor: colors.glassBorder,
                      borderTopColor: colors.glassBorderTop,
                    },
                  ]}
                >
                  <View style={[styles.txIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Ionicons name="arrow-down" size={16} color={colors.accentGreen} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txDescription, { color: colors.textPrimary }]} numberOfLines={1}>
                      {tx.description || t.depositForGoalDesc}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textMuted }]}>
                      {formatDateShort(tx.created_at, language)}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: colors.accentGreen }]}>
                    +{formatCurrency(tx.amount, currencySymbol)}
                  </Text>
                </View>
              ))
            ) : (
              <View
                style={[
                  styles.emptyHistoryBox,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                    borderTopColor: colors.glassBorderTop,
                  },
                ]}
              >
                <Ionicons name="wallet-outline" size={24} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyHistoryTitle, { color: colors.textPrimary }]}>
                    {t.initialAccumulatedBalance}
                  </Text>
                  <Text style={[styles.emptyHistorySub, { color: colors.textSecondary }]}>
                    {goal.current_amount > 0
                      ? `${formatCurrency(goal.current_amount, currencySymbol)} ${t.savedAtOpeningDesc}`
                      : t.noDepositsAssociatedDesc}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Botão de Ação: Iniciar Consultoria Desta Meta */}
          <View style={styles.footerRow}>
            {onRequestDelete && (
              <TouchableOpacity
                style={[
                  styles.deleteHistoryBtn,
                  {
                    backgroundColor: 'rgba(225, 29, 72, 0.12)',
                    borderColor: 'rgba(244, 63, 94, 0.3)',
                  },
                ]}
                onPress={() => onRequestDelete(goal)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={colors.accentRed} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.consultBtn, { shadowColor: colors.primaryCyan, flex: 1 }]}
              onPress={() => {
                onClose();
                onConsultInChat(goal);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={colors.gradients.cyan}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.consultGradient}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.consultBtnText}>{t.consultWithAiBtn}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardSubText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  datesRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  deadlineBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deadlineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  txItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDescription: {
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyHistoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  emptyHistoryTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyHistorySub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  footerRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteHistoryBtn: {
    width: 48,
    height: 48,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consultBtn: {
    borderRadius: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  consultGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  consultBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
