import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Goal } from '../types';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';

interface CustomDepositModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (goalId: string, amount: number, note?: string) => Promise<void>;
}

export const CustomDepositModal: React.FC<CustomDepositModalProps> = ({
  visible,
  goal,
  onClose,
  onSubmit,
}) => {
  const { theme, userProfile, getAvailableBalance } = useFinanceStore();
  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);
  const availableBalance = getAvailableBalance();

  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!goal) return null;

  const isCompleted = goal ? goal.current_amount >= goal.target_amount : false;
  const remainingToTarget = goal ? Math.max(0, goal.target_amount - goal.current_amount) : 0;

  const handleQuickAdd = (added: number) => {
    if (isCompleted) return;
    const current = parseFloat(amountText.replace(',', '.')) || 0;
    const nextVal = current + added;
    if (remainingToTarget > 0 && nextVal > remainingToTarget) {
      setAmountText(String(remainingToTarget));
    } else {
      setAmountText(String(nextVal));
    }
  };

  const handleDeposit = async () => {
    setErrorMessage('');
    const parsedAmount = parseFloat(amountText.replace(',', '.'));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(t.errDepositValidAmount);
      return;
    }

    if (isCompleted) {
      setErrorMessage(t.errGoalAlreadyCompleted);
      return;
    }

    if (parsedAmount > remainingToTarget) {
      setErrorMessage(
        `${t.errDepositExceedsRemaining} (${t.remainingLabel}: ${formatCurrency(remainingToTarget, currencySymbol)})`
      );
      return;
    }

    if (parsedAmount > availableBalance) {
      setErrorMessage(
        `${t.depositErrorBalance} (${formatCurrency(availableBalance, currencySymbol)})`
      );
      return;
    }

    try {
      setLoading(true);
      await onSubmit(goal.id, parsedAmount, note.trim() || undefined);
      setAmountText('');
      setNote('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || t.errorProcessingGoal);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.glassSurfaceElevated,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          <View
            style={[
              styles.handleBar,
              { backgroundColor: theme === 'light' ? '#CBD5E1' : '#334155' },
            ]}
          />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: colors.primaryCyan }]}>{t.depositTitle}</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {goal.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Progresso Atual e Saldo Disponível */}
          {isCompleted ? (
            <View
              style={[
                styles.goalSummary,
                {
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  borderColor: colors.accentGreen,
                  borderTopColor: colors.accentGreen,
                  flexDirection: 'row',
                  alignItems: 'center',
                },
              ]}
            >
              <Ionicons name="ribbon-outline" size={20} color={colors.accentGreen} style={{ marginRight: 8 }} />
              <Text style={[styles.summaryText, { color: colors.accentGreen, fontWeight: '800', flex: 1 }]}>
                {t.goal100Completed} ({formatCurrency(goal.target_amount, currencySymbol)})
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.goalSummary,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {t.accumulatedAmountLabel}{' '}
                <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
                  {formatCurrency(goal.current_amount, currencySymbol)}
                </Text>{' '}
                {t.ofTargetLabel} {formatCurrency(goal.target_amount, currencySymbol)} ({t.remainingLabel}{' '}
                <Text style={{ fontWeight: '800', color: colors.primaryCyan }}>
                  {formatCurrency(remainingToTarget, currencySymbol)}
                </Text>
                )
              </Text>
              <Text style={[styles.summarySubText, { color: colors.textMuted, marginTop: 4 }]}>
                {t.availableAccountBalance}{' '}
                <Text style={{ fontWeight: '700', color: colors.accentGreen }}>
                  {formatCurrency(availableBalance, currencySymbol)}
                </Text>
              </Text>
            </View>
          )}

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.accentRed} />
              <Text style={[styles.errorText, { color: colors.accentRed }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Campo Valor */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {`${t.depositAmountLabel} (${currencySymbol})`}
          </Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: colors.glassInputBg,
                borderColor: colors.glassBorder,
                borderTopColor: colors.glassBorderTop,
              },
            ]}
          >
            <Ionicons name="cash-outline" size={20} color={colors.primaryCyan} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={t.placeholderCustomDeposit}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amountText}
              onChangeText={setAmountText}
            />
          </View>

          {/* Atalhos Rápidos de Valor */}
          <View style={styles.quickRow}>
            {[200, 500, 1000, 2000].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.quickBtn,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                    borderTopColor: colors.glassBorderTop,
                    opacity: isCompleted ? 0.4 : 1,
                  },
                ]}
                onPress={() => handleQuickAdd(val)}
                disabled={isCompleted}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar ${val} ${currencySymbol}`}
              >
                <Text style={[styles.quickBtnText, { color: isCompleted ? colors.textMuted : colors.primaryCyan }]}>
                  +{val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campo Nota Opcional */}
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>
            {t.depositNoteLabel}
          </Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: colors.glassInputBg,
                borderColor: colors.glassBorder,
                borderTopColor: colors.glassBorderTop,
              },
            ]}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={t.depositNotePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Botão Confirmar Depósito */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { shadowColor: colors.primaryCyan },
              (loading || isCompleted) && { opacity: 0.5 },
            ]}
            onPress={handleDeposit}
            disabled={loading || isCompleted}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Confirmar depósito na meta"
          >
            <LinearGradient
              colors={isCompleted ? ['#64748B', '#475569'] : colors.gradients.cyan}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : isCompleted ? (
                <>
                  <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>{t.goalCompleted}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>{t.depositConfirmBtn}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalSummary: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 13,
  },
  summarySubText: {
    fontSize: 11,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  submitBtn: {
    borderRadius: 20,
    marginTop: 22,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
